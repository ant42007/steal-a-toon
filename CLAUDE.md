# steal-a-toon: notes for Claude

Roblox-style story shorts (1080x1920, 30 fps), built in code. Pipeline and commands are in `README.md`.

## Standing rules for every Roblox story video

- **Leo is the main character (MC) of every Roblox video.** Build him with `CAST.leo()` (or an outfit variant
  such as `CAST.leoPJ()`) from `video/web/rbx/cast.js`: brown side-swept hair, blue hoodie, jeans, white shoes,
  kid scale. Voice him with the shared `LEO` voice (masculine: Kokoro `am_fenrir`, distinct from the `am_michael`
  narrator) by setting `"castVoices": "scripts/cast-voices.json"` in the script JSON. Supporting characters change from story to story. Leo's look and voice stay the same.
- **Pacing like real Roblox story reels.** The reference narrator speaks about 5 words/sec with about 0.3s
  between sentences. Use the shared `N` narrator voice (sped up and time-stretched, with in-line pauses
  squeezed), line gaps of about 0.06s, and short holds. Keep one deliberate beat of silence before the twist.
- **Use the Roblox-accurate kit** in `video/web/rbx/` (classic head with face decals, R6 bodies, shaded
  clothing, sculpted glossy hair from `hair.js`, Roblox materials and baseplate) and the `STYLE` from
  `video/web/stories/numbers.js`: single lowercase word captions in the upper third, bubble chat, glow, grade.
- **One camera move per shot**, and the hook's first frame must show the strange thing.
- Check avatars with the lookbook (`node render.mjs lookbook --stills 0,6`) and check shots with
  `--stills` before running a full render (about 20 minutes).

## Using real Roblox (Studio)

Real Roblox assets (catalog hair and clothing, face decals, sounds, fonts) are used only **inside Roblox Studio**,
where the video is recorded in-engine. Never extract them into the three.js renderer. Studio's MCP server runs
on the user's own computer, so Studio work needs a Claude Code session on that machine with the Studio MCP
connected. A cloud session can't reach it. Load the `roblox-studio-mcp` skill before any Studio work.
