# Steal a Toon - Egg Handling System

A comprehensive Roblox game implementation featuring an advanced egg spawning, movement, and collection system inspired by the "Steal a Brainrot" mechanics.

## 🎮 Features

### Core Egg System
- **Automated Spawning**: Eggs spawn every 3 seconds at multiple spawn points
- **Linear Movement**: Eggs follow predefined waypoints across the map
- **Smart Despawning**: Automatic cleanup when eggs reach the end of their path
- **Player Interaction**: Click moving eggs to collect them instantly

### Egg Plaza System
- **Purchase Interface**: Buy eggs with different rarities using in-game currency
- **Currency Management**: Track and manage player coins (starts with 1000)
- **Multiple Rarities**: Common (100), Rare (500), Epic (1500), Legendary (5000)
- **Plot System**: Place purchased eggs on plots to hatch into toons

### Client Experience
- **Intuitive UI**: Clean interface for plaza interactions
- **Real-time Notifications**: Immediate feedback for all actions
- **Proximity Detection**: Automatic UI triggers when near the plaza
- **Smooth Animations**: Polished visual effects for all interactions

## 🏗️ Architecture

### Server-Side Components
```
src/ServerScriptService/
├── EggSystem.lua          # Core spawning and movement logic
├── EggPlazaHandler.lua    # Purchase and plot management
├── GameManager.lua        # Main initialization and coordination
├── TestEggSystem.lua      # Comprehensive test suite
└── DemoScript.lua         # Usage examples and demonstrations
```

### Client-Side Components
```
src/StarterGui/
└── ClientEggHandler.lua   # UI management and player interactions
```

### Shared Resources
```
src/ReplicatedStorage/
└── Config.lua             # Centralized configuration settings
```

## 🚀 Quick Start

1. **Setup**: Copy all files to your Roblox Studio project
2. **Initialize**: The GameManager automatically starts all systems
3. **Test**: Use the built-in test suite to verify functionality
4. **Customize**: Modify Config.lua to adjust spawn rates, costs, etc.

## 🔧 Configuration

All system parameters are centralized in `Config.lua`:

```lua
-- Egg spawning settings
Config.EggSystem = {
    SPAWN_INTERVAL = 3,        -- seconds between spawns
    MOVE_SPEED = 10,           -- studs per second
    MAX_EGGS_ON_MAP = 5        -- concurrent egg limit
}

-- Plaza shop settings
Config.EggPlaza = {
    STARTING_CURRENCY = 1000,  -- initial player coins
    HATCH_TIME = 30            -- seconds to hatch
}
```

## 🎯 Game Flow

1. **Background Process**: Eggs continuously spawn and move across the map
2. **Active Collection**: Players click moving eggs for immediate rewards
3. **Plaza Shopping**: Visit the Egg Plaza to purchase specific egg types
4. **Plot Management**: Place purchased eggs on plots to hatch into toons
5. **Collection Building**: Collect different rarity toons from hatched eggs

## 🧪 Testing

The system includes comprehensive testing capabilities:

```bash
# Run validation script
./validate.sh

# Build and check syntax
./build.sh
```

Test coverage includes:
- ✅ Egg spawning mechanics
- ✅ Movement and pathfinding
- ✅ Despawning behavior
- ✅ Plaza purchase system
- ✅ Plot placement and hatching
- ✅ Client-server communication

## 📊 System Performance

- **Optimized Updates**: Efficient RunService.Heartbeat usage
- **Memory Management**: Automatic cleanup of connections and objects
- **Scalable Design**: Configurable limits prevent server overload
- **Client Optimization**: Smooth UI animations with TweenService

## 🔄 Integration

The system seamlessly integrates with existing Roblox game patterns:
- Uses standard RemoteEvents for client-server communication
- Follows Roblox service architecture patterns
- Compatible with DataStore for persistence (easily extensible)
- Modular design allows for easy feature additions

## 📈 Extensibility

The modular architecture supports easy extensions:
- Add new egg types in the configuration
- Implement custom movement patterns
- Create additional player interaction types
- Integrate with achievement systems
- Add visual/sound effects

## 🎨 Visual Design

- **Map Layout**: Clean baseplate with designated areas
- **Color Coding**: Rarity-based egg colors for easy identification
- **UI Polish**: Professional-looking interfaces with smooth transitions
- **Feedback Systems**: Clear visual indicators for all player actions

---

**Built for Roblox Studio** | **Fully Tested** | **Production Ready**