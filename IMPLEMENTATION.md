# Steal a Toon - Egg Handling System

## Implementation Overview

This project implements a comprehensive egg handling system for the "Steal a Toon" Roblox game, aligning with the "Steal a Brainrot" system requirements.

## Key Features Implemented

### 1. Egg Spawning Mechanics ✅
- **Random Generation**: Eggs spawn at random intervals (3 seconds by default)
- **Row Spawning**: Multiple spawn positions create a row effect
- **Single Line Movement**: All eggs follow the same linear path across the map

### 2. Egg Movement System ✅
- **Predefined Path**: Eggs follow waypoints from spawn to despawn
- **Continuous Movement**: Constant speed movement (10 studs/second)
- **Smooth Interpolation**: Frame-by-frame position updates for smooth animation

### 3. Egg Despawning ✅
- **Automatic Removal**: Eggs despawn when reaching the end of the path
- **Manual Cleanup**: System can manually remove eggs when clicked
- **Memory Management**: Proper cleanup of connections and references

### 4. Integration with Existing Game Flow ✅
- **Egg Plaza**: Central hub for purchasing eggs
- **Purchase System**: Players can buy different egg types with currency
- **Plot Placement**: Purchased eggs can be placed on plots to hatch
- **Toon Generation**: Eggs hatch into toons based on rarity

### 5. Player Interaction ✅
- **Click Detection**: Players can click moving eggs to collect them
- **UI Integration**: Notifications and feedback for player actions
- **Proximity Detection**: Automatic UI triggers when near Egg Plaza

## File Structure

```
src/
├── ServerScriptService/
│   ├── EggSystem.lua          # Core egg spawning and movement
│   ├── EggPlazaHandler.lua    # Plaza interactions and purchases
│   ├── GameManager.lua        # Main game initialization
│   └── TestEggSystem.lua      # Comprehensive test suite
├── StarterGui/
│   └── ClientEggHandler.lua   # Client-side UI and interactions
└── ReplicatedStorage/
    └── Config.lua             # Centralized configuration
```

## Technical Implementation

### Egg Spawning System
- Uses RunService.Heartbeat for precise timing
- Maintains active egg tracking for performance
- Implements maximum concurrent egg limits

### Movement Algorithm
- Waypoint-based pathfinding
- Distance-based waypoint advancement
- Automatic despawning at path completion

### Client-Server Communication
- RemoteEvents for player interactions
- Real-time feedback system
- Secure server-side validation

## Testing and Validation

The system includes comprehensive tests for:
- Egg spawning functionality
- Movement mechanics
- Despawning behavior
- System start/stop operations
- Plaza purchase system
- Path following accuracy

## Game Flow Integration

1. **Background System**: Eggs continuously spawn and move across the map
2. **Player Discovery**: Players can click moving eggs to collect them
3. **Plaza Interaction**: Players visit Egg Plaza to purchase specific eggs
4. **Plot Management**: Purchased eggs are placed on plots to hatch
5. **Toon Collection**: Hatched toons become part of player's collection

## Performance Considerations

- Efficient egg tracking with array management
- Connection cleanup to prevent memory leaks
- Configurable limits to prevent server overload
- Optimized movement calculations

## Future Enhancements

- Dynamic path generation
- Egg rarity variations for moving eggs
- Visual effects for spawning/despawning
- Sound integration
- Data persistence with DataStore

This implementation provides a solid foundation for the egg handling system while maintaining compatibility with the existing game flow.