-- EggSystem.lua
-- Main server-side egg spawning, movement, and despawning system

local EggSystem = {}

local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

-- Configuration
local EGG_SPAWN_INTERVAL = 3 -- seconds between egg spawns
local EGG_MOVE_SPEED = 10 -- studs per second
local EGG_PATH_LENGTH = 100 -- total path length in studs
local MAX_EGGS_ON_MAP = 5 -- maximum concurrent eggs

-- State
local activeEggs = {}
local eggSpawnTimer = 0
local isSystemRunning = false

-- Egg spawn positions (start of the path)
local SPAWN_POSITIONS = {
    Vector3.new(-50, 5, 0),
    Vector3.new(-50, 5, 10),
    Vector3.new(-50, 5, -10)
}

-- Egg path waypoints
local PATH_WAYPOINTS = {
    Vector3.new(-50, 5, 0),
    Vector3.new(-25, 5, 0),
    Vector3.new(0, 5, 0),
    Vector3.new(25, 5, 0),
    Vector3.new(50, 5, 0)
}

-- Create egg model
local function createEggModel(position)
    local egg = Instance.new("Part")
    egg.Name = "Egg"
    egg.Shape = Enum.PartType.Ball
    egg.Size = Vector3.new(2, 3, 2)
    egg.Position = position
    egg.Material = Enum.Material.Plastic
    egg.BrickColor = BrickColor.Random()
    egg.CanCollide = false
    egg.Anchored = true
    
    -- Add a ClickDetector for interaction
    local clickDetector = Instance.new("ClickDetector")
    clickDetector.MaxActivationDistance = 20
    clickDetector.Parent = egg
    
    -- Add egg metadata
    local eggData = Instance.new("ObjectValue")
    eggData.Name = "EggData"
    eggData.Parent = egg
    
    local spawned = Instance.new("NumberValue")
    spawned.Name = "SpawnTime"
    spawned.Value = tick()
    spawned.Parent = eggData
    
    local eggType = Instance.new("StringValue")
    eggType.Name = "Type"
    eggType.Value = "Common" -- Could be expanded to different rarities
    eggType.Parent = eggData
    
    return egg
end

-- Move egg along predefined path
local function moveEggAlongPath(egg)
    local currentWaypoint = 1
    local moveConnection
    
    moveConnection = RunService.Heartbeat:Connect(function(deltaTime)
        if not egg.Parent then
            moveConnection:Disconnect()
            return
        end
        
        local targetPosition = PATH_WAYPOINTS[currentWaypoint + 1]
        if not targetPosition then
            -- Reached end of path, despawn egg
            EggSystem.despawnEgg(egg)
            moveConnection:Disconnect()
            return
        end
        
        local currentPos = egg.Position
        local direction = (targetPosition - currentPos).Unit
        local moveDistance = EGG_MOVE_SPEED * deltaTime
        
        local newPosition = currentPos + direction * moveDistance
        
        -- Check if we've reached the current waypoint
        if (newPosition - targetPosition).Magnitude <= 1 then
            currentWaypoint = currentWaypoint + 1
            newPosition = targetPosition
        end
        
        egg.Position = newPosition
    end)
    
    return moveConnection
end

-- Spawn a new egg
function EggSystem.spawnEgg()
    if #activeEggs >= MAX_EGGS_ON_MAP then
        return nil
    end
    
    -- Choose random spawn position
    local spawnPos = SPAWN_POSITIONS[math.random(1, #SPAWN_POSITIONS)]
    local egg = createEggModel(spawnPos)
    egg.Parent = workspace
    
    -- Set up movement
    local moveConnection = moveEggAlongPath(egg)
    
    -- Store egg data
    local eggInfo = {
        model = egg,
        moveConnection = moveConnection,
        spawnTime = tick()
    }
    
    table.insert(activeEggs, eggInfo)
    
    -- Set up click interaction
    egg.ClickDetector.MouseClick:Connect(function(player)
        EggSystem.onEggClicked(egg, player)
    end)
    
    print("Spawned egg at position:", spawnPos)
    return egg
end

-- Despawn an egg
function EggSystem.despawnEgg(egg)
    -- Find and remove from active eggs
    for i, eggInfo in ipairs(activeEggs) do
        if eggInfo.model == egg then
            if eggInfo.moveConnection then
                eggInfo.moveConnection:Disconnect()
            end
            table.remove(activeEggs, i)
            break
        end
    end
    
    -- Remove from workspace
    if egg and egg.Parent then
        egg:Destroy()
        print("Despawned egg")
    end
end

-- Handle egg click interaction
function EggSystem.onEggClicked(egg, player)
    print(player.Name .. " clicked an egg!")
    
    -- Could add egg collection logic here
    -- For now, just despawn the egg when clicked
    EggSystem.despawnEgg(egg)
    
    -- Fire remote event to client for feedback
    if ReplicatedStorage:FindFirstChild("EggCollected") then
        ReplicatedStorage.EggCollected:FireClient(player, egg.EggData.Type.Value)
    end
end

-- Start the egg system
function EggSystem.start()
    if isSystemRunning then
        return
    end
    
    isSystemRunning = true
    print("Starting Egg System...")
    
    -- Main update loop
    local heartbeatConnection
    heartbeatConnection = RunService.Heartbeat:Connect(function(deltaTime)
        if not isSystemRunning then
            heartbeatConnection:Disconnect()
            return
        end
        
        -- Update spawn timer
        eggSpawnTimer = eggSpawnTimer + deltaTime
        
        -- Spawn new egg if timer reached
        if eggSpawnTimer >= EGG_SPAWN_INTERVAL then
            EggSystem.spawnEgg()
            eggSpawnTimer = 0
        end
        
        -- Clean up destroyed eggs
        for i = #activeEggs, 1, -1 do
            local eggInfo = activeEggs[i]
            if not eggInfo.model or not eggInfo.model.Parent then
                if eggInfo.moveConnection then
                    eggInfo.moveConnection:Disconnect()
                end
                table.remove(activeEggs, i)
            end
        end
    end)
end

-- Stop the egg system
function EggSystem.stop()
    isSystemRunning = false
    
    -- Clean up all active eggs
    for _, eggInfo in ipairs(activeEggs) do
        if eggInfo.moveConnection then
            eggInfo.moveConnection:Disconnect()
        end
        if eggInfo.model and eggInfo.model.Parent then
            eggInfo.model:Destroy()
        end
    end
    
    activeEggs = {}
    print("Stopped Egg System")
end

-- Get system status
function EggSystem.getStatus()
    return {
        isRunning = isSystemRunning,
        activeEggCount = #activeEggs,
        spawnTimer = eggSpawnTimer
    }
end

return EggSystem