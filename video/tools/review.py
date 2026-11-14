"""Watch a render: contact sheets at 2 fps, caption-sync check against a fresh transcription of the
final audio, loudness of voice vs. background, and a beat map of the cut.

usage: python3 tools/review.py v1
"""
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
v = sys.argv[1]
B = os.path.join(HERE, "build", v)
mp4 = os.path.join(HERE, "..", "renders", (f"{v}.mp4" if "-" in v else f"cracks-{v}.mp4"))
T = json.load(open(os.path.join(B, "timeline.json")))
out = os.path.join(B, "review")
os.makedirs(out, exist_ok=True)

# 1. contact sheets: 2 fps, 8x3 tiles = 12s per sheet
for f in os.listdir(out):
    if f.startswith("sheet_"):
        os.remove(os.path.join(out, f))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp4, "-vf",
                "fps=2,scale=180:320,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:"
                "text='%{pts\\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=8x3:padding=3",
                os.path.join(out, "sheet_%02d.png")], check=True)

# 2. caption sync: transcribe the final mix and compare word onsets with the caption timeline
wav = os.path.join(out, "final16k.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp4, "-ac", "1", "-ar", "16000", wav], check=True)
with wave.open(wav) as w:
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
from faster_whisper import WhisperModel  # noqa: E402
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(a, word_timestamps=True, language="en")
heard = [(re.sub(r"[^a-z]", "", w.word.lower()), w.start) for s in segs for w in s.words]
cap = [(re.sub(r"[^a-z]", "", w["w"].lower()), w["s"]) for l in T["lines"] if l.get("fx") != "echo" for w in l["words"]]
import difflib  # noqa: E402
sm = difflib.SequenceMatcher(a=[c[0] for c in cap], b=[h[0] for h in heard], autojunk=False)
diffs = []
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        diffs.append(cap[blk.a + k][1] - heard[blk.b + k][1])
diffs = np.array(diffs)
print(f"caption sync: {len(diffs)}/{len(cap)} words matched, offset median {np.median(diffs)*1000:+.0f} ms, "
      f"p95 |offset| {np.percentile(np.abs(diffs), 95)*1000:.0f} ms")

# 3. loudness: integrated LUFS of final, and voice vs music RMS
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", mp4, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)
def rms_db(p):
    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    x = x[np.abs(x) > 1e-4]
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print(f"loudness: final {lufs[-1] if lufs else '?'} LUFS; voice {rms_db(os.path.join(B, 'vo.wav')):.1f} dBFS rms, "
      f"music {rms_db(os.path.join(B, 'music.wav')):.1f} dBFS rms")

# 4. beat map
print(f"\n{v}: {T['duration']:.2f}s")
for sc in T["scenes"]:
    ls = [l for l in T["lines"] if l["scene"] == sc["id"]]
    words = sum(len(l["words"]) for l in ls)
    dead = (sc["end"] - sc["start"]) - sum(l["end"] - l["start"] for l in ls)
    print(f"  {sc['start']:6.2f}  {sc['id']:<11} {sc['end']-sc['start']:5.2f}s  {words:3d} words  {dead:4.2f}s without voice")
print("\nsheets:", sorted(f for f in os.listdir(out) if f.startswith("sheet_")))
