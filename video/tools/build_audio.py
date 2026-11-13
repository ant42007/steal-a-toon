"""Script JSON -> voiceover clips (Kokoro) -> word timings (faster-whisper) -> timeline.json + mixed audio.

usage: python3 tools/build_audio.py scripts/script.v1.json build/v1
env:   KOKORO_DIR  folder holding kokoro-v1.0.onnx + voices-v1.0.bin (default: .cache/models)
"""
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import synth  # noqa: E402

SR = synth.SR
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(HERE, ".cache")
MODELS = os.environ.get("KOKORO_DIR", os.path.join(CACHE, "models"))


# ------------------------------------------------------------------ io helpers

def read_wav(path):
    with wave.open(path) as w:
        assert w.getsampwidth() == 2
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            a = a.reshape(-1, 2).mean(axis=1)
        return a, w.getframerate()


def write_wav(path, a, sr=SR):
    a = np.clip(a, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((a * 32767).astype(np.int16).tobytes())


def ffmpeg_filter(src, dst, af):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", af, "-ar", str(SR), "-ac", "1", dst], check=True)


# ------------------------------------------------------------------ tts + alignment

_kokoro = None
_whisper = None


def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
    return _kokoro


def whisper():
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel("small.en", device="cpu", compute_type="int8")
    return _whisper


def trim(a, sr, thresh_db=-42, pad=0.04):
    env = np.abs(a)
    thr = 10 ** (thresh_db / 20)
    idx = np.where(env > thr)[0]
    if len(idx) == 0:
        return a
    i0 = max(0, idx[0] - int(pad * sr))
    i1 = min(len(a), idx[-1] + int(pad * sr))
    return a[i0:i1]


def tts_clip(text, vcfg, fx=None):
    """Returns path to a 48k mono wav for this line (cached)."""
    key = hashlib.sha1(json.dumps([text, vcfg, fx], sort_keys=True).encode()).hexdigest()[:16]
    out = os.path.join(CACHE, "tts", key + ".wav")
    if os.path.exists(out):
        return out
    os.makedirs(os.path.dirname(out), exist_ok=True)
    a, sr = kokoro().create(text, voice=vcfg["voice"], speed=vcfg.get("speed", 1.0), lang="en-us")
    a = trim(np.asarray(a, dtype=np.float32), sr)
    raw = out + ".raw.wav"
    write_wav(raw, a, sr)
    filters = []
    if vcfg.get("pitch"):
        filters.append(f"rubberband=pitch={vcfg['pitch']}")
    if fx == "echo":
        filters += ["apad=pad_dur=0.9", "lowpass=f=5200", "aecho=0.85:0.75:110|230|420:0.45|0.3|0.18", "volume=0.8"]
    filters.append(f"aresample={SR}")
    ffmpeg_filter(raw, out, ",".join(filters))
    os.remove(raw)
    return out


def whisper_words(path):
    cache = path + ".words.json"
    if os.path.exists(cache):
        return json.load(open(cache))
    a, sr = read_wav(path)
    a16 = a[:: sr // 16000] if sr % 16000 == 0 else a
    segs, _ = whisper().transcribe(a16, word_timestamps=True, vad_filter=False, language="en")
    words = [{"w": w.word.strip(), "s": float(w.start), "e": float(w.end)} for s in segs for w in (s.words or [])]
    json.dump(words, open(cache, "w"))
    return words


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower().replace("’", "'"))


def align(tokens, ww, dur):
    """Map display tokens to whisper word times; interpolate anything unmatched."""
    a = [norm(t) for t in tokens]
    b = [norm(w["w"]) for w in ww]
    times = [None] * len(a)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal" or (op == "replace" and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                times[i1 + k] = [ww[j1 + k]["s"], ww[j1 + k]["e"]]
        elif op == "replace" and j2 > j1:
            s, e = ww[j1]["s"], ww[j2 - 1]["e"]
            lens = np.array([max(1, len(x)) for x in a[i1:i2]], float)
            edges = s + np.concatenate([[0], np.cumsum(lens)]) / lens.sum() * (e - s)
            for k in range(i2 - i1):
                times[i1 + k] = [edges[k], edges[k + 1]]
    # fill gaps
    i = 0
    while i < len(times):
        if times[i] is None:
            j = i
            while j < len(times) and times[j] is None:
                j += 1
            s = times[i - 1][1] if i > 0 else 0.0
            e = times[j][0] if j < len(times) else dur
            lens = np.array([max(1, len(x)) for x in a[i:j]], float)
            edges = s + np.concatenate([[0], np.cumsum(lens)]) / lens.sum() * max(0.05, e - s)
            for k in range(j - i):
                times[i + k] = [edges[k], edges[k + 1]]
            i = j
        else:
            i += 1
    # monotonic + clamp
    out = []
    last = 0.0
    for t, (s, e) in zip(tokens, times):
        s = max(last, min(s, dur))
        e = max(s + 0.04, min(e, dur))
        out.append({"w": t, "s": round(s, 3), "e": round(e, 3)})
        last = s
    return out


def envelope(a, fps=30):
    hop = SR // fps
    n = int(np.ceil(len(a) / hop))
    env = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    env = env / (np.percentile(env, 95) + 1e-6)
    return [round(float(min(1.0, x)), 3) for x in env]


# ------------------------------------------------------------------ build

def main(script_path, outdir):
    os.makedirs(outdir, exist_ok=True)
    S = json.load(open(script_path))
    D = S["defaults"]
    voices = S["voices"]
    fps = S.get("fps", 30)

    lines, cues, scenes, music_events = [], [], [], []
    clips = []  # (start_time, audio)
    t = 0.0
    for sc in S["scenes"]:
        s0 = t
        t += sc.get("lead", D["sceneLead"])
        for it in sc["items"]:
            if "pause" in it:
                t += it["pause"]
                continue
            if "cue" in it and "say" not in it:
                cues.append({"name": it["cue"], "t": round(t, 3), "scene": sc["id"]})
                continue
            if "music" in it:
                music_events.append({"t": t, **it["music"]})
                continue
            vc = voices[it["say"]]
            path = tts_clip(it["text"], vc, it.get("fx"))
            a, _ = read_wav(path)
            ww = whisper_words(path)
            dur = len(a) / SR
            display = it.get("display", it["text"])
            tokens = display.split()
            if "cut" in it:
                # cut the clip partway through a word (for interrupted lines)
                wi = min(it["cut"]["word"], len(ww) - 1)
                cut_t = ww[wi]["s"] + it["cut"]["frac"] * (ww[wi]["e"] - ww[wi]["s"])
                n = int(cut_t * SR)
                a = a[:n].copy()
                fade = int(0.012 * SR)
                a[-fade:] *= np.linspace(1, 0, fade)
                dur = len(a) / SR
                ww = [w for w in ww if w["s"] < cut_t]
                ww[-1]["e"] = min(ww[-1]["e"], cut_t)
            words = align(tokens, ww, dur)
            # strip echo tail from the 'speaking' window used for lip-sync
            speak_end = words[-1]["e"] + 0.05 if it.get("fx") == "echo" else dur
            line = {
                "speaker": it["say"], "text": display, "start": round(t, 3), "end": round(t + speak_end, 3),
                "fx": it.get("fx"), "scene": sc["id"],
                "words": [{"w": w["w"], "s": round(t + w["s"], 3), "e": round(t + w["e"], 3)} for w in words],
                "env": envelope(a[: int(speak_end * SR)], fps),
            }
            lines.append(line)
            clips.append((t, a))
            if "cue" in it:
                at = it.get("cueAt", "end")
                ct = t if at == "start" else t + speak_end + it.get("cueOffset", 0.04)
                cues.append({"name": it["cue"], "t": round(ct, 3), "scene": sc["id"]})
            t += dur + it.get("after", it.get("gapAfter", D["gap"]))
        t += sc.get("tail", D["sceneTail"])
        scenes.append({"id": sc["id"], "start": round(s0, 3), "end": round(t, 3), "ambience": sc.get("ambience")})

    total = t
    for ev in S.get("music", []):
        sc = next(s for s in scenes if s["id"] == ev["scene"])
        tt = sc["start"] if ev.get("at", "start") == "start" else sc["end"]
        tt += ev.get("offset", 0)
        music_events.append({"t": tt, **{k: v for k, v in ev.items() if k not in ("scene", "at", "offset")}})
    music_events.sort(key=lambda e: e["t"])

    N = int((total + 0.5) * SR)
    vo = np.zeros(N)
    for st, a in clips:
        i0 = int(st * SR)
        vo[i0:i0 + len(a)] += a[: N - i0]
    vo = vo / (np.max(np.abs(vo)) + 1e-9) * 0.89

    # ---- sfx + ambience
    sfx = np.zeros(N)

    def place(sig, tt, gain=1.0):
        i0 = int(tt * SR)
        n = min(len(sig), N - i0)
        if n > 0:
            sfx[i0:i0 + n] += sig[:n] * gain

    for c in cues:
        if c["name"] == "crack":
            place(synth.crack(seed=int(c["t"] * 100)), c["t"], 0.8)
        elif c["name"] == "tick":
            place(synth.tick(), c["t"], 0.7)
        elif c["name"] == "goldcrack":
            place(synth.goldcrack(), c["t"], 0.85)
        elif c["name"] == "goldStart":
            sc = next(s for s in scenes if s["id"] == c["scene"])
            place(synth.shimmer(sc["end"] - c["t"]), c["t"], 0.55)
        elif c["name"] == "fridgeOpen":
            place(synth.door_thunk(), c["t"] - 0.28, 0.9)
    for sc in scenes:
        d = sc["end"] - sc["start"]
        if sc["ambience"] == "monitor":
            place(synth.monitor(d), sc["start"], 1.0)
        elif sc["ambience"] == "hum":
            place(synth.hum(d), sc["start"], 1.0)

    # ---- music: sections crossfaded, gain envelope from events, ducked under voice
    music = np.zeros(N)
    sect_events = [e for e in music_events if "section" in e] or []
    starts = [(0.0, "main")] + [(e["t"], e["section"]) for e in sect_events]
    xf = int(1.2 * SR)
    for k, (st, name) in enumerate(starts):
        en = starts[k + 1][0] if k + 1 < len(starts) else total + 0.5
        seg = synth.score(name, en - st + 1.2)
        i0 = int(st * SR)
        n = min(len(seg), N - i0)
        w = np.ones(len(seg))
        if k > 0:
            w[:xf] = np.linspace(0, 1, xf)
        if k + 1 < len(starts):
            tail0 = int((en - st) * SR)
            w[tail0:tail0 + xf] = np.linspace(1, 0, len(w[tail0:tail0 + xf]))
            w[tail0 + xf:] = 0
        music[i0:i0 + n] += seg[:n] * w[:n]
    # gain automation
    g = np.ones(N)
    cur = 1.0
    gain_events = [e for e in music_events if "gain" in e]
    for k, e in enumerate(gain_events):
        i0 = int(e["t"] * SR)
        fade = int(e.get("fade", 0.4) * SR)
        target = e["gain"]
        ramp = np.linspace(cur, target, max(1, fade))
        g[i0:i0 + len(ramp)] = ramp[: max(0, N - i0)]
        g[i0 + len(ramp):] = target
        cur = target
    music *= g
    # duck under the voice
    hop = SR // 100
    nf = N // hop
    rms = np.sqrt(np.mean(vo[: nf * hop].reshape(nf, hop) ** 2, axis=1))
    act = np.clip(rms / 0.05, 0, 1)
    sm = np.zeros(nf)
    v = 0.0
    for i in range(nf):
        a_ = 0.35 if act[i] > v else 0.02
        v += (act[i] - v) * a_
        sm[i] = v
    duck = 1 - 0.45 * np.repeat(sm, hop)
    duck = np.concatenate([duck, np.ones(N - len(duck))])
    music *= duck
    music = music / (np.max(np.abs(music)) + 1e-9) * 0.16  # quiet bed, ~-18 dB under the voice peaks

    mix = vo + sfx * 0.55 + music
    write_wav(os.path.join(outdir, "vo.wav"), vo)
    write_wav(os.path.join(outdir, "music.wav"), music)
    write_wav(os.path.join(outdir, "sfx.wav"), sfx * 0.55)
    write_wav(os.path.join(outdir, "mix_raw.wav"), mix / max(1.0, np.max(np.abs(mix))))
    # gentle bus compression, then exact gain to -14 LUFS with a -1.5 dBFS peak limiter (Reels/TikTok target)
    raw = os.path.join(outdir, "mix_raw.wav")
    final = os.path.join(outdir, "audio.wav")
    comp = "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=140:knee=4"

    def integrated(path, chain="anull"):
        r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", chain + ",ebur128", "-f", "null", "-"],
                           capture_output=True, text=True, check=True)
        return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1])

    gain = -14.0 - integrated(raw, comp)
    for _ in range(3):
        chain = f"{comp},volume={gain:.2f}dB,alimiter=limit=0.84:attack=5:release=60:level=false:latency=true"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", chain, "-ar", str(SR), "-ac", "2", final], check=True)
        err = -14.0 - integrated(final)
        if abs(err) < 0.2:
            break
        gain += err

    timeline = {"version": S["version"], "title": S.get("title"), "fps": fps, "duration": round(total, 3),
                "scenes": scenes, "lines": lines, "cues": cues,
                "music": [{k: v for k, v in e.items()} for e in music_events]}
    json.dump(timeline, open(os.path.join(outdir, "timeline.json"), "w"), indent=1)
    print(f"{S['version']}: {total:.2f}s, {len(lines)} lines, {len(cues)} cues")
    for sc in scenes:
        print(f"  {sc['id']:<11} {sc['start']:6.2f} -> {sc['end']:6.2f}  ({sc['end']-sc['start']:.2f}s)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
