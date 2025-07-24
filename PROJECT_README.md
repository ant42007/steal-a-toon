# Steal a Toon - Roblox Game Project

A complete tycoon-style Roblox game where players collect, grow, and evolve cartoon toons while competing through a unique stealing mechanic.

## 🎮 Game Features

### Core Systems
- **Plot Management**: Auto plot claiming, upgrading, and management
- **Egg System**: Choose eggs, place them on plots, and wait for hatching with visual timers
- **Toon System**: Collect various cartoon toons with different rarities and stats
- **Evolution System**: Level up and evolve toons for increased value and income
- **Economy System**: Idle coin generation with boosts and multipliers
- **Rebirth System**: Reset progress for permanent benefits and new features
- **Stealing System**: Raid other players' bases to steal their toons
- **Premium Shop**: Robux-exclusive items, boosts, and cosmetics

### Game Mechanics
- **Idle Income**: Toons generate coins automatically every 5 seconds
- **Rarity System**: 7 toon rarities from Common to Glitched
- **Progressive Unlocks**: New features unlock through rebirth progression
- **Combat System**: 1v1 tap battles unlock after 2 rebirths
- **Protection System**: Steal shields and boost items

## 🏗️ Project Structure

```
src/
├── server/                 # Server-side game logic
│   ├── init.server.lua    # Main server initialization
│   ├── DataManager.lua    # Player data management
│   ├── PlotManager.lua    # Plot claiming and upgrades
│   ├── EggManager.lua     # Egg purchasing and hatching
│   ├── ToonManager.lua    # Toon generation and management
│   ├── EconomyManager.lua # Economy and monetization
│   ├── RebirthManager.lua # Rebirth system
│   └── StealingManager.lua# Stealing and raid mechanics
├── client/                # Client-side UI and interactions
│   ├── init.client.lua    # Main client initialization
│   ├── UIManager.lua      # UI creation and management
│   └── NotificationManager.lua # In-game notifications
├── shared/                # Shared modules
│   └── GameConstants.lua  # Game constants and utilities
├── ReplicatedStorage/     # Shared game assets
│   └── RemoteEvents.server.lua # Remote events setup
├── StarterPlayer/         # Player initialization
│   └── StarterPlayerScripts/
│       └── PlayerSetup.client.lua
└── Workspace/             # Map and world setup
    └── MapSetup.server.lua
```

## 🎯 Key Features Implemented

### ✅ Core Systems
- [x] Data Management with auto-save
- [x] Plot claiming and upgrading system
- [x] Egg purchasing with timed hatching
- [x] Toon generation with rarity system
- [x] Idle income generation
- [x] Rebirth system with permanent benefits
- [x] Stealing mechanics with cooldowns
- [x] Premium boost shop

### ✅ User Interface
- [x] Main game UI with coin/rebirth display
- [x] Egg shop interface
- [x] Inventory system
- [x] Rebirth interface
- [x] Stealing/raid interface
- [x] Boost shop
- [x] Advanced notification system

### ✅ Visual Elements
- [x] Cartoony map with central Egg Plaza
- [x] Physical toons with animations
- [x] Egg hatching with progress bars
- [x] Plot visualization with signs
- [x] Rarity-based visual effects

## 🚀 Getting Started

1. **Setup**: Place all files in their respective Roblox Studio locations
2. **Server Scripts**: Place server files in ServerScriptService
3. **Client Scripts**: Place client files in StarterPlayer/StarterPlayerScripts
4. **Shared Modules**: Place in ReplicatedStorage
5. **Map**: The MapSetup script will automatically create the game world

## 🎨 Customization

### Adding New Toons
Edit `ToonManager.lua` TOON_TEMPLATES to add new toon types:
```lua
{
    name = "New Toon",
    type = "custom",
    description = "A custom toon!",
    baseSize = Vector3.new(3, 4, 2),
    animations = {"idle", "custom_anim"}
}
```

### Adding New Eggs
Edit `EggManager.lua` EGG_TYPES to add new egg varieties:
```lua
{
    id = "custom_egg",
    name = "Custom Egg", 
    cost = 500,
    hatchTime = 20,
    rarity = {Common = 60, Uncommon = 30, Rare = 10},
    currency = "coins"
}
```

### Monetization Setup
- Configure product IDs in `EconomyManager.lua`
- Set up MarketplaceService integration
- Add premium egg and boost product IDs

## 🔧 Technical Details

### Performance Optimizations
- Efficient data management with periodic auto-save
- Optimized toon rendering and animations
- Smart notification queuing system
- Minimal network traffic with batched updates

### Security Features
- Server-side validation for all transactions
- Anti-exploit measures for stealing system
- Secure data storage with error handling
- Rate limiting on actions

## 🎮 Gameplay Balance

### Progression Curve
- Early game: Fast progression with basic toons
- Mid game: Rebirth system adds strategic depth
- Late game: Stealing and raiding for competitive play

### Economy Balance
- Base income scales with rebirth level
- Egg costs increase with rarity
- Stealing has cooldowns and success rates
- Premium items provide meaningful benefits

## 🔮 Future Enhancements

Potential additions for expanded gameplay:
- Guild system for collaborative play
- Daily challenges and achievements
- Seasonal events with limited toons
- Trading system between players
- Advanced combat mechanics
- Multiple map areas

## 📝 Notes

This implementation provides a complete foundation for a Roblox tycoon game with unique stealing mechanics. The modular architecture makes it easy to extend and customize for specific needs.

The game is designed to be engaging for both casual players (idle mechanics) and competitive players (stealing/raiding), with monetization opportunities that don't break game balance.