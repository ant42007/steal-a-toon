# Steal a Toon - Project Structure

## Overview
This is a Roblox game implementing an egg spawning, movement, and collection system.

## Directory Structure
```
src/
├── ServerScriptService/     - Server-side scripts
│   ├── EggSystem.lua       - Main egg spawning/movement system
│   ├── EggPlazaHandler.lua - Egg purchasing and plot management
│   ├── GameManager.lua     - Main game initialization
│   └── TestEggSystem.lua   - Test suite for egg system
├── StarterGui/             - Client-side UI scripts
│   └── ClientEggHandler.lua - Player UI and interaction handling
└── ReplicatedStorage/      - Shared resources
    └── Config.lua          - Game configuration settings
```

## Key Features
1. **Egg Spawning**: Random egg generation at predefined spawn points
2. **Egg Movement**: Eggs follow a predefined path across the map
3. **Egg Despawning**: Automatic removal when eggs reach the end
4. **Egg Plaza**: Central hub for purchasing eggs
5. **Plot System**: Players can place eggs on plots to hatch
6. **Interactive UI**: Client-side interface for game interactions

## Game Flow
1. Player visits Egg Plaza
2. Player purchases eggs with in-game currency
3. Eggs can be placed on plots to hatch into toons
4. Moving eggs can be collected by clicking on them
5. System continuously spawns new eggs that move across the map

