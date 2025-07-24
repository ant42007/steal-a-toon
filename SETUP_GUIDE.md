# Steal a Toon - Installation & Setup Guide

## 🚀 Quick Start

This guide will help you set up the complete "Steal a Toon" Roblox game in Roblox Studio.

## 📋 Prerequisites

- Roblox Studio installed and updated
- Basic knowledge of Roblox Studio interface
- Access to publish games (for DataStore functionality)

## 📁 File Structure Overview

The game is organized into these main directories:
- `src/server/` - Server-side game logic
- `src/client/` - Client-side UI and interactions  
- `src/shared/` - Shared modules and constants
- `src/ReplicatedStorage/` - Remote events setup
- `src/StarterPlayer/` - Player initialization scripts
- `src/Workspace/` - Map and world setup

## 🔧 Installation Steps

### Step 1: Set Up Project Structure

1. Open Roblox Studio and create a new place
2. In the Explorer, you'll see the standard Roblox services

### Step 2: Add Server Scripts

1. In **ServerScriptService**, create the following scripts:
   - `init.server.lua` - Main server initialization
   - `DataManager.lua` - Player data management (ModuleScript)
   - `PlotManager.lua` - Plot system (ModuleScript)
   - `EggManager.lua` - Egg system (ModuleScript)
   - `ToonManager.lua` - Toon management (ModuleScript)
   - `EconomyManager.lua` - Economy system (ModuleScript)
   - `RebirthManager.lua` - Rebirth system (ModuleScript)
   - `StealingManager.lua` - Stealing mechanics (ModuleScript)
   - `AssetIntegration.lua` - Asset integration framework (ModuleScript)
   - `CombatManager.lua` - Combat system (ModuleScript)
   - `TestFramework.lua` - Testing framework (ModuleScript)

2. Copy the contents from each corresponding file in `src/server/` to these scripts

### Step 3: Add Client Scripts

1. In **StarterPlayer** > **StarterPlayerScripts**, create:
   - `PlayerSetup.client.lua` - Player initialization (LocalScript)
   - `init.client.lua` - Main client script (LocalScript)
   - `UIManager.lua` - UI management (ModuleScript)
   - `NotificationManager.lua` - Notification system (ModuleScript)

2. Copy the contents from each corresponding file in `src/client/` to these scripts

### Step 4: Add Shared Modules

1. In **ReplicatedStorage**, create:
   - `RemoteEvents.server.lua` - Remote events setup (Script)
   - Create a folder called "Shared"
   - Inside Shared folder, create `GameConstants.lua` (ModuleScript)

2. Copy the contents from the corresponding files in `src/shared/` and `src/ReplicatedStorage/`

### Step 5: Add Map Setup

1. In **Workspace**, create:
   - `MapSetup.server.lua` - Map generation (Script)

2. Copy the contents from `src/Workspace/MapSetup.server.lua`

### Step 6: Configure Services

1. Make sure **DataStoreService** is enabled:
   - Go to **Game Settings** > **Security** > **Studio Access to API Services** = ON
   - This is required for player data saving

2. For testing, you may want to enable **Local Server** in Test tab

## 🎮 Testing the Setup

### Method 1: Studio Testing

1. Click **Play** button in Studio (F5)
2. You should see initialization messages in the Output window:
   ```
   Steal a Toon Server - Initializing...
   DataManager: Initializing...
   PlotManager: Initializing...
   [... other system messages]
   TestFramework: Starting system validation tests...
   ✅ DataManagement - PASSED
   [... test results]
   ```

3. Your character should spawn near the Egg Plaza
4. Press these keys to test UI:
   - **E** - Egg Shop
   - **I** - Inventory
   - **R** - Rebirth System
   - **S** - Stealing Interface
   - **B** - Boost Shop

### Method 2: Multi-Player Testing

1. Click **Test** tab in Studio
2. Choose **Local Server** with 2+ players
3. Test stealing mechanics between players
4. Test combat system (available after 2 rebirths)

## 🔧 Configuration Options

### Adjusting Game Balance

Edit these files to modify game balance:

**Economy Settings** (`EconomyManager.lua`):
```lua
-- Boost pricing and duration
local BOOST_ITEMS = {
    {cost = 50, duration = 1800}, -- Adjust cost and duration
}
```

**Rebirth Requirements** (`RebirthManager.lua`):
```lua
local REBIRTH_CONFIG = {
    [1] = {coinsRequired = 50000}, -- Adjust coin requirements
}
```

**Toon Rarities** (`ToonManager.lua`):
```lua
local RARITY_CONFIG = {
    Common = {baseValue = 1}, -- Adjust base values
}
```

### Adding Custom Content

**New Toon Types** (`ToonManager.lua`):
```lua
local TOON_TEMPLATES = {
    {
        name = "Custom Toon",
        type = "custom",
        description = "Your custom toon!",
        baseSize = Vector3.new(3, 4, 2)
    }
}
```

**New Egg Types** (`EggManager.lua`):
```lua
local EGG_TYPES = {
    {
        id = "custom",
        name = "Custom Egg",
        cost = 100,
        hatchTime = 15,
        rarity = {Common = 50, Rare = 50}
    }
}
```

## 🔌 Asset Integration

### Integrating "Steal a Brainrot" Assets

The game includes a built-in asset integration system:

1. Place your "Steal a Brainrot" assets in **ServerStorage** > **IntegratedAssets**
2. Tag assets with "StealABrainrot" using the Tag Editor
3. The system will automatically scan and integrate compatible assets
4. Check the Output for integration messages

### Manual Asset Integration

```lua
local AssetIntegration = require(ServerScriptService.AssetIntegration)
local assetLoader = AssetIntegration:GetAssetLoader()

-- Load a specific asset
local myAsset = assetLoader.LoadAsset("BrainrotMap")
-- Integrate it into the workspace
assetLoader.IntegrateAsset("BrainrotMap", workspace)
```

## 🐛 Troubleshooting

### Common Issues

**"Module not found" errors:**
- Ensure all ModuleScripts are properly placed in their correct services
- Check that the script names match exactly (case-sensitive)

**DataStore errors:**
- Make sure API Services are enabled in Game Settings
- Publish your place to enable DataStore access

**UI not appearing:**
- Check that ReplicatedStorage contains the Remotes folder
- Ensure RemoteEvents.server.lua has run successfully

**Players not spawning correctly:**
- Verify MapSetup.server.lua has created the SpawnLocation
- Check that PlayerSetup.client.lua is in StarterPlayerScripts

### Debug Mode

Enable verbose logging by editing the test framework:
```lua
local TEST_CONFIG = {
    runOnStartup = true,
    verbose = true  -- Set to true for detailed logs
}
```

## 📈 Performance Optimization

### For Large Servers

- Increase auto-save intervals in DataManager (currently 30 seconds)
- Reduce egg hatching check frequency if needed
- Consider limiting concurrent battles in CombatManager

### For Mobile Players

- The UI is designed to be mobile-friendly
- All major functions have keyboard shortcuts but also clickable buttons
- Notification system is optimized for smaller screens

## 🚀 Publishing Your Game

1. **Test thoroughly** in Studio with multiple players
2. **Configure monetization** by adding actual Product IDs to EconomyManager
3. **Set up DataStore** by publishing the place
4. **Test in published environment** to ensure DataStore functionality
5. **Add game icon and description** in Game Settings

## 🔄 Updates and Maintenance

The modular structure makes updates easy:
- Individual systems can be updated without affecting others
- New features can be added by creating new manager modules
- The asset integration system allows for easy content updates

## 📞 Support

If you encounter issues:
1. Check the Output window for error messages
2. Verify all files are in the correct locations
3. Test the system validation framework
4. Review the troubleshooting section above

The game includes comprehensive error handling and logging to help identify issues quickly.