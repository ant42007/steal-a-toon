-- EggPlazaHandler.lua
-- Handles Egg Plaza interactions - the central hub for egg purchasing

local EggPlazaHandler = {}

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

-- Egg types and costs
local EGG_CATALOG = {
    {name = "Common Egg", cost = 100, rarity = "Common", color = BrickColor.new("White")},
    {name = "Rare Egg", cost = 500, rarity = "Rare", color = BrickColor.new("Bright blue")},
    {name = "Epic Egg", cost = 1500, rarity = "Epic", color = BrickColor.new("Bright violet")},
    {name = "Legendary Egg", cost = 5000, rarity = "Legendary", color = BrickColor.new("Bright orange")}
}

-- Player currency tracking (simplified - would typically use DataStore)
local playerCurrency = {}

-- Initialize player currency
local function initializePlayerCurrency(player)
    if not playerCurrency[player.UserId] then
        playerCurrency[player.UserId] = 1000 -- Starting currency
    end
end

-- Get player currency
function EggPlazaHandler.getPlayerCurrency(player)
    initializePlayerCurrency(player)
    return playerCurrency[player.UserId]
end

-- Deduct currency from player
function EggPlazaHandler.deductCurrency(player, amount)
    initializePlayerCurrency(player)
    if playerCurrency[player.UserId] >= amount then
        playerCurrency[player.UserId] = playerCurrency[player.UserId] - amount
        return true
    end
    return false
end

-- Add currency to player
function EggPlazaHandler.addCurrency(player, amount)
    initializePlayerCurrency(player)
    playerCurrency[player.UserId] = playerCurrency[player.UserId] + amount
end

-- Purchase egg from plaza
function EggPlazaHandler.purchaseEgg(player, eggType)
    local eggInfo = nil
    
    -- Find egg in catalog
    for _, egg in ipairs(EGG_CATALOG) do
        if egg.name == eggType then
            eggInfo = egg
            break
        end
    end
    
    if not eggInfo then
        print("Invalid egg type:", eggType)
        return false
    end
    
    -- Check if player has enough currency
    if not EggPlazaHandler.deductCurrency(player, eggInfo.cost) then
        print(player.Name .. " doesn't have enough currency for " .. eggType)
        return false
    end
    
    -- Create purchased egg
    local purchasedEgg = EggPlazaHandler.createPurchasedEgg(eggInfo, player)
    
    print(player.Name .. " purchased " .. eggType .. " for " .. eggInfo.cost .. " coins")
    
    -- Fire event to client
    local remoteEvents = ReplicatedStorage:FindFirstChild("RemoteEvents")
    if remoteEvents and remoteEvents:FindFirstChild("EggPurchased") then
        remoteEvents.EggPurchased:FireClient(player, eggInfo)
    end
    
    return true
end

-- Create a purchased egg that player can place on plots
function EggPlazaHandler.createPurchasedEgg(eggInfo, player)
    local egg = Instance.new("Part")
    egg.Name = "PurchasedEgg"
    egg.Shape = Enum.PartType.Ball
    egg.Size = Vector3.new(2, 3, 2)
    egg.Material = Enum.Material.Neon
    egg.BrickColor = eggInfo.color
    egg.CanCollide = false
    egg.Anchored = true
    
    -- Add egg data
    local eggData = Instance.new("ObjectValue")
    eggData.Name = "EggData"
    eggData.Parent = egg
    
    local eggTypeValue = Instance.new("StringValue")
    eggTypeValue.Name = "Type"
    eggTypeValue.Value = eggInfo.name
    eggTypeValue.Parent = eggData
    
    local rarityValue = Instance.new("StringValue")
    rarityValue.Name = "Rarity"
    rarityValue.Value = eggInfo.rarity
    rarityValue.Parent = eggData
    
    local ownerValue = Instance.new("ObjectValue")
    ownerValue.Name = "Owner"
    ownerValue.Value = player
    ownerValue.Parent = eggData
    
    local purchaseTime = Instance.new("NumberValue")
    purchaseTime.Name = "PurchaseTime"
    purchaseTime.Value = tick()
    purchaseTime.Parent = eggData
    
    -- Add to player's inventory (simplified - would typically use more complex inventory system)
    local playerInventory = workspace:FindFirstChild(player.Name .. "_Inventory")
    if not playerInventory then
        playerInventory = Instance.new("Folder")
        playerInventory.Name = player.Name .. "_Inventory"
        playerInventory.Parent = workspace
    end
    
    egg.Parent = playerInventory
    
    return egg
end

-- Place purchased egg on plot
function EggPlazaHandler.placeEggOnPlot(player, eggData, plotNumber)
    -- Find the plot
    local plot = workspace:FindFirstChild("Plot" .. plotNumber)
    if not plot then
        print("Plot " .. plotNumber .. " not found")
        return false
    end
    
    -- Check if plot is already occupied
    local existingEgg = plot:FindFirstChildOfClass("Part")
    if existingEgg and existingEgg.Name == "PlotEgg" then
        print("Plot " .. plotNumber .. " is already occupied")
        return false
    end
    
    -- Find player's purchased egg
    local playerInventory = workspace:FindFirstChild(player.Name .. "_Inventory")
    if not playerInventory then
        print(player.Name .. " has no inventory")
        return false
    end
    
    local purchasedEgg = playerInventory:FindFirstChild("PurchasedEgg")
    if not purchasedEgg then
        print(player.Name .. " has no purchased eggs")
        return false
    end
    
    -- Move egg to plot
    purchasedEgg.Name = "PlotEgg"
    purchasedEgg.Position = plot.Position + Vector3.new(0, 3, 0)
    purchasedEgg.Parent = plot
    
    -- Add hatching timer
    local hatchTimer = Instance.new("NumberValue")
    hatchTimer.Name = "HatchTimer"
    hatchTimer.Value = 30 -- 30 seconds to hatch
    hatchTimer.Parent = purchasedEgg
    
    -- Start hatching process
    EggPlazaHandler.startHatching(purchasedEgg, player)
    
    print(player.Name .. " placed egg on plot " .. plotNumber)
    return true
end

-- Start egg hatching process
function EggPlazaHandler.startHatching(egg, player)
    local hatchTimer = egg:FindFirstChild("HatchTimer")
    if not hatchTimer then
        return
    end
    
    local startTime = tick()
    local hatchDuration = hatchTimer.Value
    
    -- Visual feedback during hatching
    local originalColor = egg.BrickColor
    local originalSize = egg.Size
    
    local heartbeatConnection
    heartbeatConnection = game:GetService("RunService").Heartbeat:Connect(function()
        if not egg.Parent then
            heartbeatConnection:Disconnect()
            return
        end
        
        local elapsed = tick() - startTime
        local progress = elapsed / hatchDuration
        
        if progress >= 1 then
            -- Egg is ready to hatch
            EggPlazaHandler.hatchEgg(egg, player)
            heartbeatConnection:Disconnect()
        else
            -- Animate egg during hatching
            local wobble = math.sin(elapsed * 10) * 0.1
            egg.Rotation = Vector3.new(wobble * 10, wobble * 15, wobble * 5)
            
            -- Change color intensity based on progress
            local brightness = 0.5 + progress * 0.5
            egg.Material = Enum.Material.Neon
        end
    end)
end

-- Hatch egg into toon
function EggPlazaHandler.hatchEgg(egg, player)
    local eggData = egg:FindFirstChild("EggData")
    if not eggData then
        return
    end
    
    local rarity = eggData:FindFirstChild("Rarity")
    if not rarity then
        return
    end
    
    -- Create toon based on egg rarity
    local toon = EggPlazaHandler.createToon(rarity.Value, egg.Position)
    toon.Parent = egg.Parent
    
    -- Remove the egg
    egg:Destroy()
    
    print(player.Name .. "'s egg hatched into a " .. rarity.Value .. " toon!")
    
    -- Fire event to client
    local remoteEvents = ReplicatedStorage:FindFirstChild("RemoteEvents")
    if remoteEvents and remoteEvents:FindFirstChild("EggHatched") then
        remoteEvents.EggHatched:FireClient(player, rarity.Value)
    end
end

-- Create toon from hatched egg
function EggPlazaHandler.createToon(rarity, position)
    local toon = Instance.new("Part")
    toon.Name = "Toon"
    toon.Size = Vector3.new(2, 4, 1)
    toon.Position = position
    toon.Material = Enum.Material.Plastic
    toon.Shape = Enum.PartType.Block
    toon.CanCollide = false
    toon.Anchored = true
    
    -- Set color based on rarity
    if rarity == "Common" then
        toon.BrickColor = BrickColor.new("Bright blue")
    elseif rarity == "Rare" then
        toon.BrickColor = BrickColor.new("Bright green")
    elseif rarity == "Epic" then
        toon.BrickColor = BrickColor.new("Bright violet")
    elseif rarity == "Legendary" then
        toon.BrickColor = BrickColor.new("Bright orange")
    end
    
    -- Add toon data
    local toonData = Instance.new("ObjectValue")
    toonData.Name = "ToonData"
    toonData.Parent = toon
    
    local rarityValue = Instance.new("StringValue")
    rarityValue.Name = "Rarity"
    rarityValue.Value = rarity
    rarityValue.Parent = toonData
    
    local hatchTime = Instance.new("NumberValue")
    hatchTime.Name = "HatchTime"
    hatchTime.Value = tick()
    hatchTime.Parent = toonData
    
    return toon
end

-- Initialize plaza interactions
function EggPlazaHandler.initialize()
    print("Egg Plaza Handler initialized")
    
    -- Connect to player events
    game.Players.PlayerAdded:Connect(function(player)
        initializePlayerCurrency(player)
    end)
end

return EggPlazaHandler