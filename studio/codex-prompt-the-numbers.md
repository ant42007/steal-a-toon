You are working on my computer to build a short Roblox story video inside Roblox Studio. Work carefully, verify every step, and stop and ask me if anything is unclear.

## 0. Use the right Studio window (important)
Two Roblox Studio places are open:
- **`BreakTheIce`**: one word, no spaces. **Use ONLY this one.**
- `Break The Ice!`: with spaces and an exclamation mark. **Do NOT read, edit, save, play, or close this one.**

With the Roblox Studio MCP server: call `list_roblox_studios`, pick the instance whose name is exactly `BreakTheIce`, and pass its `studio_id` on **every** call. Before the first edit, call `get_studio_state` and confirm the place name is `BreakTheIce`. If you can't tell them apart, stop and ask me.
If you control the screen instead, only click inside the window titled "BreakTheIce - Roblox Studio".

## 1. Connect to Studio (only if the Studio MCP tools aren't available yet)
Roblox Studio ships its own MCP server. Add it to `~/.codex/config.toml` (check that the file it points to exists first), then tell me to restart Codex:
- Windows:
  ```toml
  [mcp_servers.roblox_studio]
  command = "cmd.exe"
  args = ["/c", "%LOCALAPPDATA%\\Roblox\\mcp.bat"]
  ```
- macOS:
  ```toml
  [mcp_servers.roblox_studio]
  command = "/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP"
  ```
If Studio has an option to enable its MCP server, make sure it's on. Don't start editing until `list_roblox_studios` shows `BreakTheIce`.

## 2. What we're making
**THE NUMBERS**, a 45-second vertical (9:16) Roblox story. The voiceover, captions and music already exist and will be added later. Your job is to build the scenes and a **Director** that plays all 12 shots in exact sync with that audio, so I can screen-record it.

Story: In this world, everyone has a number above their head, and nobody knows what it means. You can see everyone's number except your own. Leo writes down every number he sees. His little sister Ellie is 21. People start disappearing: the mailman (17), the bus driver (18), the crossing guard (19). They're vanishing in order. Leo stays up holding Ellie's hand. She asks, "Leo? Why is your number twenty?" He was next. He keeps his promise ("I always go first") and disappears, then Ellie does. She spawns on a SpawnLocation on an empty baseplate, and Leo is there waiting.

## 3. Ground rules
- Put everything in a new `Workspace.TheNumbers` folder. Name scripts and modules `TheNumbers_*`. Don't delete or change anything else that's already in the place.
- **Leo is the main character.** All rigs are **R6**, with classic Roblox faces and real catalog or Creator Store clothing and hair.
- Free models from the Creator Store: inspect them, then delete every Script, LocalScript and ModuleScript inside before using them. Never run code that came from an inserted asset.
- Don't publish. When you're done, ask me to save (File > Save to File).

## 4. Cast
Build each character from a `HumanoidDescription` with `Players:CreateHumanoidModelFromDescription(desc, Enum.HumanoidRigType.R6)` and name the model.
- **Leo** (main character): kid size (`Model:ScaleTo(0.82)`), skin `Color3.fromRGB(243,210,177)`, **blue hoodie**, **blue jeans with white sneakers**, **brown side-swept/messy hair**, classic "Smile" face. Leo has **no number above his head** until the reveal in shot 8.
- **Ellie** (little sister): `ScaleTo(0.68)`, pink t-shirt with a heart, purple skirt, pink shoes, **auburn pigtails**. Number **21**. A pink pajama version for shots 8–10 is optional.
- **Mom**: rose sweater, dark slacks, dark brown bob. Number **4,000,112**.
- **Mailman**: light-blue uniform shirt, navy cap, skin `Color3.fromRGB(201,142,106)`. Number **17**. Holds a white letter.
- **Bus driver**: grey tee, jeans, short black curly hair, brown skin. Number **18**. Sits in the driver's seat of a school bus.
- **Crossing guard**: orange safety vest over a white shirt, grey hair bun, holds a STOP sign. Number **19**.
- **2 scientists**: white lab coats, glasses (one bald). Numbers **6,108,330** and **41,977**.
- **12 townspeople** in varied outfits. Numbers: 2,018,442 · 77 · 4,812,003 · 350 · 6,602,118 · 903,377 · 1,209 · 88,104 · 5 · 2,991 · 61,450 · 12,804.

Find clothing and hair with `search_asset` (Creator Store), or ask me for catalog IDs. Record every asset ID you use in a ModuleScript `ReplicatedStorage.TheNumbers_Assets` so Leo can be reused in future videos.

## 5. Numbers above heads
Put a BillboardGui on each Head: `Size = UDim2.new(4,0,1.4,0)`, `StudsOffset = Vector3.new(0,3,0)`, `AlwaysOnTop = false`, `LightInfluence = 0`. Inside it, a TextLabel with `BackgroundTransparency = 1`, `Font = Enum.Font.FredokaOne`, `TextScaled = true`, white text, plus a `UIStroke` (black, Thickness 3).
Leo's "20" appears only at the reveal: give it a red UIStroke and make it pop in with a slight scale bounce.

## 6. Sets
Build these inside `Workspace.TheNumbers`, about 500 studs apart, using real Roblox materials (Grass, Concrete, Brick, WoodPlanks, Neon).
1. **Suburb street**: houses, trees, street lamps, a road with yellow dashes, and sidewalks. Used for shots 1, 5 and 6.
2. **Lab**: a whiteboard reading "77 = ?", "4,812,003 ??", "age? NO", "luck??" and a big red "???", plus a bench with glowing Neon beakers.
3. **Leo's front yard**: a blue house with a red door, a fence and a mailbox.
4. **Leo's room**: a desk with an open notebook, desk lamp, bed and window. The notebook page is a SurfaceGui in handwriting style that reads: NUMBERS I SAW / Mom 4,000,112 / Mr. Patel 902,114 / Coach Rivera 54,330 / Mailman 17 / Bus driver 18 / Crossing guard 19 / Ellie 21. There is deliberately no 20. Needs day and night lighting.
5. **Crosswalk**: on the street, with a mailbox and a yellow school bus whose driver is visible through the side window.
6. **Ellie's room**: pink walls, bed, a star night-light and a window.
7. **The "other side"**: a plain grey Baseplate grid with a **SpawnLocation** and a bright sky.

## 7. The Director (plays the video)
Create a LocalScript `StarterPlayer.StarterPlayerScripts.TheNumbers_Director` and a ModuleScript `ReplicatedStorage.TheNumbers_Shots`.
On Play, the Director should:
- Hide the local character.
- Call `StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, false)`.
- Set `Camera.CameraType = Scriptable` and `FieldOfView = 62`.
- Show a 3-second countdown so I can start recording.
- Play all 12 shots back to back, driven by **one clock** (`os.clock()` minus the start time) so the timing never drifts.

Each shot gets **exactly one camera move**: a single tween of `Camera.CFrame` from its start to its end over the whole shot (Sine InOut unless noted), plus timed actions. Use these exact times, in seconds from the end of the countdown:

| # | Shot | Time | Camera move | Actions |
|---|---|---|---|---|
| 1 | crowd | 0.00–2.96 | Start tight on a smiling townsperson's face with "2,018,442" above it, then pull back and up to reveal the crowd | Townspeople idle, walk and wave |
| 2 | lab | 2.96–4.84 | Slow truck, left to right | One scientist scratches his head; the other shrugs |
| 3 | yard | 4.84–6.56 | Push in on Leo | Leo jumps and spins, trying to see his own number, until 5.60; then he stops, looks up and shrugs. Mom and Ellie watch with their numbers showing |
| 4 | desk | 6.56–9.53 | Over Leo's shoulder, then down onto the notebook page | Leo writes; the "Ellie 21" row writes itself in from 8.40 to 9.40 |
| 5 | walk | 9.53–14.35 | Dolly backward ahead of Leo and Ellie walking hand in hand toward camera | Leo's bubble at 11.46: "You'll never go anywhere alone. I'll always go first." |
| 6 | street | 14.35–19.62 | Truck along the street, settling briefly on each victim | Despawn: mailman at **16.07** (letter falls), bus driver at **16.91** (bus keeps rolling), crossing guard at **17.88** (STOP sign falls) |
| 7 | notebook | 19.62–24.79 | From Leo at his desk (night) down onto the page | Red pen line through 17 at **21.25**, 18 at **21.57**, 19 at **21.99**; red circle around "Ellie 21" at **24.62** |
| 8 | vigil | 24.79–30.87 | Wide on Ellie in bed, moving into **Ellie's point of view** looking up at Leo sitting beside her | Ellie's bubble at 26.32: "Leo? Why is your number twenty?" **Leo's "20" pops in at 27.89.** Leo goes shocked, then sad |
| 9 | goodbye | 30.87–34.18 | Ends over Ellie's shoulder on Leo | Ellie's bubble at 30.91: "Don't go!" Leo's bubble at 31.53: "Hey. I promised. I always go first." **Leo despawns at 33.47** |
| 10 | turn | 34.18–36.34 | Push in on Ellie sitting on her bed hugging a blue plush | **Ellie despawns at 35.58** (the plush drops) |
| 11 | spawn | 36.34–40.90 | Crane down from the sky to the SpawnLocation | White flash at 36.34. Ellie appears on the spawn with a ForceField and looks around. Leo walks in. Leo's bubble at 39.01: "Told you. You'll never go anywhere alone." They hug at about 40.5. **No numbers above anyone here** |
| 12 | ending | 40.90–44.98 | Pull back and up | Leo and Ellie walk hand in hand toward the mailman, bus driver, crossing guard and others, who wave. Fade to white over the last 0.9s |

- **Despawn effect:** the rig breaks apart. Each body part drifts outward and up, spins, shrinks and fades over about 1.2s, with a white and blue sparkle burst (ParticleEmitter). The number fades out within the first 0.3s.
- **Bubble chat:** use `TextChatService:DisplayBubble(character.Head, text)` at the times listed.
- **Flashes and fades:** use a full-screen Frame in a ScreenGui with `IgnoreGuiInset = true`.
- **Lighting:**
  - Day: ClockTime 14, an Atmosphere, and ColorCorrection Saturation 0.2.
  - Night (shots 7 and 8): ClockTime 0, with a warm desk lamp or night-light PointLight.
  - Morning (shots 9 and 10): ClockTime 8.

## 8. Recording setup
Open Test > Device and set up a custom **1080×1920 portrait** device so the viewport is 9:16. Then tell me it's ready. I'll start an OBS window capture of the viewport and press Play. After the countdown, the sequence must run exactly 44.98 seconds.

## 9. Verify before handing over
- Take a `screen_capture` of every shot at its first and last camera position.
- Run a playtest, read `get_console_output`, and fix every error.
- Confirm that nothing outside `Workspace.TheNumbers` and the `TheNumbers_*` scripts changed, and that `Break The Ice!` was never touched.
- Give me a short report: what you built, the asset IDs you used, and anything you couldn't do.
