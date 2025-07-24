-- DemoScript.lua
-- Demonstration script showing how the egg system works

local DemoScript = {}

-- This would normally be run in Roblox Studio to demonstrate the system
-- For documentation purposes, this shows the key interactions

local EggSystem = require(script.Parent.EggSystem)
local EggPlazaHandler = require(script.Parent.EggPlazaHandler)
local GameManager = require(script.Parent.GameManager)

function DemoScript.demonstrateEggFlow()
    print("=== Steal a Toon - Egg System Demonstration ===")
    
    -- 1. Initialize the game
    print("\n1. Initializing game systems...")
    GameManager.initialize()
    print("Game initialized with map, plaza, and remote events")
    
    -- 2. Start the egg system
    print("\n2. Starting continuous egg spawning...")
    EggSystem.start()
    print("Eggs will now spawn every 3 seconds and move across the map")
    
    -- 3. Simulate player interactions
    print("\n3. Simulating player interactions...")
    
    -- Simulate egg collection (clicking moving eggs)
    print("Player clicks moving egg -> EggSystem.onEggClicked() -> Egg despawned")
    
    -- Simulate plaza visit
    print("Player approaches Egg Plaza -> UI shows purchase options")
    
    -- Simulate egg purchase
    local mockPlayer = {Name = "DemoPlayer", UserId = 12345}
    print("Player purchases Common Egg -> Deducts 100 coins")
    EggPlazaHandler.purchaseEgg(mockPlayer, "Common Egg")
    
    -- Simulate plot placement
    print("Player places purchased egg on Plot 1 -> Starts hatching timer")
    EggPlazaHandler.placeEggOnPlot(mockPlayer, {}, 1)
    
    -- 4. Show system status
    print("\n4. System status:")
    local status = EggSystem.getStatus()
    print("Running: " .. tostring(status.isRunning))
    print("Active eggs: " .. status.activeEggCount)
    
    print("\n=== Demonstration Complete ===")
    print("The system is now running with all features active!")
end

function DemoScript.explainGameFlow()
    print("=== Game Flow Explanation ===")
    print("1. Background Process:")
    print("   - Eggs spawn automatically every 3 seconds")
    print("   - They move along predefined waypoints")
    print("   - Auto-despawn when reaching the end")
    print("")
    print("2. Player Interaction with Moving Eggs:")
    print("   - Players can click moving eggs to collect them")
    print("   - Collected eggs provide immediate feedback")
    print("   - System prevents spam by managing active egg count")
    print("")
    print("3. Egg Plaza System:")
    print("   - Players visit plaza to purchase specific eggs")
    print("   - Different rarities available (Common, Rare, Epic, Legendary)")
    print("   - Currency system with starting balance of 1000 coins")
    print("")
    print("4. Plot Management:")
    print("   - Purchased eggs can be placed on any of 5 plots")
    print("   - Eggs hatch after 30 seconds into toons")
    print("   - Toon rarity matches the egg that was placed")
    print("")
    print("5. Integration:")
    print("   - Moving eggs complement the plaza system")
    print("   - Players get both active (clicking) and passive (plaza) gameplay")
    print("   - All systems work together seamlessly")
end

-- Key configuration values for reference
function DemoScript.showConfiguration()
    print("=== System Configuration ===")
    print("Egg Spawning:")
    print("  - Interval: 3 seconds")
    print("  - Max concurrent: 5 eggs")
    print("  - Speed: 10 studs/second")
    print("")
    print("Egg Plaza:")
    print("  - Common Egg: 100 coins")
    print("  - Rare Egg: 500 coins") 
    print("  - Epic Egg: 1500 coins")
    print("  - Legendary Egg: 5000 coins")
    print("")
    print("Map Layout:")
    print("  - Baseplate: 200x200 studs")
    print("  - Egg Plaza: 20x20 studs at (-60, 1, 0)")
    print("  - 5 Plots: 10x10 studs each, spaced 15 studs apart")
    print("")
    print("Path System:")
    print("  - 5 waypoints from (-50,5,0) to (50,5,0)")
    print("  - Linear movement with smooth interpolation")
    print("  - Automatic cleanup at path end")
end

return DemoScript