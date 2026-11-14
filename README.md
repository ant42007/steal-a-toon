# steal-a-toon

60-second Roblox-style story shorts, built end to end in code: a script becomes a voiceover with word-synced captions, then 3D blocky scenes, then a 1080x1920 MP4.

## CRACKS
*"In this world, every lie you tell cracks your face."*

| | |
|---|---|
| `story/01-breakdown.md` | Beat-by-beat breakdown of the reference reel (hook, story, twist, ending) |
| `story/02-script.md` | The new story, mapped beat for beat to the same structure |
| `story/03-director-notes.md` | Notes on cut 1 and what changed in cut 2 |
| `renders/cracks-v1.mp4` | Cut 1, 69.9s |
| `renders/cracks-v2.mp4` | Cut 2, 59.5s, with the notes applied |

## THE NUMBERS
*"In this world, everyone has a number above their head."*

| | |
|---|---|
| `story/04-the-numbers.md` | Script, beat map, and what changed to make it look like Roblox |
| `renders/numbers-v1.mp4` | 61s, Roblox-accurate kit: classic heads and face decals, R6 bodies, shaded clothing, glossy hair, Roblox materials and baseplate, bubble chat |

## Pipeline (`video/`)

```
scripts/script.vN.json      lines, speakers, pauses, SFX cues, music cues
  └─ tools/build_audio.py   Kokoro TTS per line → faster-whisper word timings → timeline.json
                            + procedural SFX/ambience/score (tools/synth.py), voice-ducked, -14 LUFS
  └─ render.mjs             Playwright drives web/index.html frame by frame (window.renderAt(t)),
                            screenshots → ffmpeg (x264, 30fps) → muxed with the mix
       web/lib/scenes.js    CRACKS: 12 shots, one camera move each
       web/stories/numbers.js  THE NUMBERS: 12 shots on the Roblox kit
       web/rbx/             Roblox-accurate avatars (avatar.js) and world/materials (world.js)
       web/lib/char.js      CRACKS characters: canvas faces, expressions, lip flap, cracks
       web/lib/overlay.js   word-by-word captions, CRACK! popups, flashes
  └─ tools/review.py        contact sheets, caption-sync check vs. a fresh transcription, loudness
```

```bash
cd video
bash build.sh v2          # → renders/cracks-v2.mp4  (about 16 min on 4 CPU cores, software WebGL)
bash build.sh numbers-v1  # → renders/numbers-v1.mp4 (about 20 min)
node render.mjs v2 --stills 0,13.7,42.8   # quick PNG checks
python3 tools/review.py v2
```

Requires Node 22, Python 3 with `kokoro-onnx soundfile faster-whisper`, ffmpeg, and Playwright's Chromium. The Kokoro voice model (about 350MB) downloads on first build. Everything is generated locally, so there are no stock assets: the caption font is Lilita One (OFL), and the music and SFX are synthesized.
