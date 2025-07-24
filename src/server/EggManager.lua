-- EggManager.lua
-- Handles egg selection, placement, hatching, and management

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local DataManager = require(script.Parent.DataManager)
local PlotManager = require(script.Parent.PlotManager)

local EggManager = {}
local activeEggs = {} -- Track eggs that are hatching
local eggTypes = {}

-- Egg type definitions
local EGG_TYPES = {
    -- Basic Eggs
    {
        id = "basic",
        name = "Basic Egg",
        cost = 50,
        hatchTime = 10, -- seconds
        rarity = {
            Common = 70,
            Uncommon = 25,
            Rare = 5
        },
        currency = "coins"
    },
    {
        id = "improved",
        name = "Improved Egg",
        cost = 200,
        hatchTime = 15,
        rarity = {
            Common = 50,
            Uncommon = 35,
            Rare = 13,
            Epic = 2
        },
        currency = "coins"
    },
    {
        id = "advanced",
        name = "Advanced Egg",
        cost = 1000,
        hatchTime = 30,
        rarity = {
            Common = 30,
            Uncommon = 40,
            Rare = 20,
            Epic = 8,
            Legendary = 2
        },
        currency = "coins"
    },
    -- Premium Eggs (Robux only)
    {
        id = "rainbow",
        name = "Rainbow Egg",
        cost = 99, -- Robux
        hatchTime = 45,
        rarity = {
            Rare = 40,
            Epic = 35,
            Legendary = 20,
            Mythic = 5
        },
        currency = "robux",
        premium = true
    },
    {
        id = "glitched",
        name = "Glitched Egg",
        cost = 199, -- Robux
        hatchTime = 60,
        rarity = {
            Epic = 30,
            Legendary = 35,
            Mythic = 25,
            Glitched = 10
        },
        currency = "robux",
        premium = true
    }
}

function EggManager:Init()
    print("EggManager: Initializing...")
    
    -- Initialize egg types
    for _, eggData in pairs(EGG_TYPES) do
        eggTypes[eggData.id] = eggData
    end
    
    -- Connect remote events
    local remotes = ReplicatedStorage:WaitForChild("Remotes", 5)
    if remotes then
        local buyEggRemote = remotes:FindFirstChild("BuyEgg")
        if buyEggRemote then
            buyEggRemote.OnServerEvent:Connect(function(player, eggId, plotId)
                self:BuyEgg(player, eggId, plotId)
            end)
        end
        
        local hatchEggRemote = remotes:FindFirstChild("HatchEgg")
        if hatchEggRemote then
            hatchEggRemote.OnServerEvent:Connect(function(player, eggId)
                self:ForceHatchEgg(player, eggId)
            end)
        end
    end
    
    -- Start egg hatching loop
    spawn(function()
        self:EggHatchingLoop()
    end)
end

function EggManager:BuyEgg(player, eggId, plotId)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return false end
    
    local eggType = eggTypes[eggId]
    if not eggType then return false end
    
    -- Check if player has the plot
    local playerPlots = PlotManager:GetPlayerPlots(player)
    if not playerPlots[plotId] then
        self:NotifyPlayer(player, "You don't own this plot!")
        return false
    end
    
    -- Check plot capacity
    local plot = playerPlots[plotId]
    local currentEggs = 0
    for _ in pairs(plot.eggs) do
        currentEggs = currentEggs + 1
    end
    
    if currentEggs >= plot.capacity then
        self:NotifyPlayer(player, "Plot is at maximum capacity!")
        return false
    end
    
    -- Check if player can afford the egg
    local canAfford = false
    if eggType.currency == "coins" then
        canAfford = playerData.coins >= eggType.cost
    elseif eggType.currency == "robux" then
        -- For demo purposes, we'll assume they can afford robux items
        -- In a real game, you'd check with Roblox's purchase system
        canAfford = true
    end
    
    if not canAfford then
        self:NotifyPlayer(player, "Not enough " .. eggType.currency .. "!")
        return false
    end
    
    -- Deduct cost
    if eggType.currency == "coins" then
        DataManager:ModifyPlayerCoins(player, -eggType.cost)
    end
    
    -- Create egg
    local eggId = self:GenerateEggId()
    local egg = {
        id = eggId,
        type = eggType.id,
        plotId = plotId,
        startTime = tick(),
        hatchTime = eggType.hatchTime,
        progress = 0
    }
    
    -- Add egg to plot
    plot.eggs[eggId] = egg
    activeEggs[eggId] = {
        playerId = player.UserId,
        egg = egg
    }
    
    -- Create physical egg in the world
    self:CreatePhysicalEgg(player, egg, plotId)
    
    -- Notify client
    self:NotifyPlayer(player, "Egg purchased! It will hatch in " .. eggType.hatchTime .. " seconds.")
    
    print("EggManager:", player.Name, "bought", eggType.name, "for plot", plotId)
    return true
end

function EggManager:CreatePhysicalEgg(player, egg, plotId)
    local plotName = "Plot_" .. player.UserId .. "_" .. plotId
    local plot = game.Workspace:FindFirstChild(plotName)
    if not plot then return end
    
    -- Create egg model
    local eggModel = Instance.new("Model")
    eggModel.Name = "Egg_" .. egg.id
    eggModel.Parent = plot
    
    -- Create egg part
    local eggPart = Instance.new("Part")
    eggPart.Name = "EggPart"
    eggPart.Shape = Enum.PartType.Ball
    eggPart.Size = Vector3.new(4, 6, 4)
    eggPart.Material = Enum.Material.Neon
    eggPart.Anchored = true
    eggPart.CanCollide = false
    
    -- Set egg color based on type
    local eggType = eggTypes[egg.type]
    if eggType.id == "basic" then
        eggPart.BrickColor = BrickColor.new("White")
    elseif eggType.id == "improved" then
        eggPart.BrickColor = BrickColor.new("Light blue")
    elseif eggType.id == "advanced" then
        eggPart.BrickColor = BrickColor.new("Light green")
    elseif eggType.id == "rainbow" then
        eggPart.BrickColor = BrickColor.new("Really red")
        -- Add rainbow effect
        local rainbow = Instance.new("PointLight")
        rainbow.Color = Color3.new(1, 0, 1)
        rainbow.Brightness = 2
        rainbow.Range = 10
        rainbow.Parent = eggPart
    elseif eggType.id == "glitched" then
        eggPart.BrickColor = BrickColor.new("Really black")
        eggPart.Material = Enum.Material.ForceField
    end
    
    -- Position egg randomly within plot bounds
    local plotSize = 50
    local randomX = math.random(-plotSize/2 + 5, plotSize/2 - 5)
    local randomZ = math.random(-plotSize/2 + 5, plotSize/2 - 5)
    eggPart.Position = plot.Position + Vector3.new(randomX, 10, randomZ)
    eggPart.Parent = eggModel
    
    -- Add progress GUI
    local gui = Instance.new("BillboardGui")
    gui.Size = UDim2.new(0, 100, 0, 50)
    gui.StudsOffset = Vector3.new(0, 4, 0)
    gui.Parent = eggPart
    
    local progressFrame = Instance.new("Frame")
    progressFrame.Size = UDim2.new(1, 0, 0.5, 0)
    progressFrame.Position = UDim2.new(0, 0, 0, 0)
    progressFrame.BackgroundColor3 = Color3.new(0, 0, 0)
    progressFrame.BackgroundTransparency = 0.3
    progressFrame.BorderSizePixel = 0
    progressFrame.Parent = gui
    
    local progressBar = Instance.new("Frame")
    progressBar.Name = "ProgressBar"
    progressBar.Size = UDim2.new(0, 0, 1, 0)
    progressBar.Position = UDim2.new(0, 0, 0, 0)
    progressBar.BackgroundColor3 = Color3.new(0, 1, 0)
    progressBar.BorderSizePixel = 0
    progressBar.Parent = progressFrame
    
    local timeLabel = Instance.new("TextLabel")
    timeLabel.Name = "TimeLabel"
    timeLabel.Size = UDim2.new(1, 0, 0.5, 0)
    timeLabel.Position = UDim2.new(0, 0, 0.5, 0)
    timeLabel.BackgroundTransparency = 1
    timeLabel.Text = math.ceil(eggType.hatchTime) .. "s"
    timeLabel.TextColor3 = Color3.new(1, 1, 1)
    timeLabel.TextScaled = true
    timeLabel.Font = Enum.Font.GothamBold
    timeLabel.Parent = gui
end

function EggManager:EggHatchingLoop()
    while true do
        local currentTime = tick()
        local eggsToHatch = {}
        
        for eggId, eggData in pairs(activeEggs) do
            local egg = eggData.egg
            local eggType = eggTypes[egg.type]
            local elapsed = currentTime - egg.startTime
            local progress = math.min(elapsed / eggType.hatchTime, 1)
            
            -- Update egg progress
            egg.progress = progress
            self:UpdateEggVisual(eggId, progress)
            
            -- Check if egg should hatch
            if progress >= 1 then
                table.insert(eggsToHatch, eggId)
            end
        end
        
        -- Hatch completed eggs
        for _, eggId in pairs(eggsToHatch) do
            self:HatchEgg(eggId)
        end
        
        wait(1) -- Update every second
    end
end

function EggManager:UpdateEggVisual(eggId, progress)
    for _, eggData in pairs(activeEggs) do
        if eggData.egg.id == eggId then
            local player = Players:GetPlayerByUserId(eggData.playerId)
            if not player then continue end
            
            local plotName = "Plot_" .. eggData.playerId .. "_" .. eggData.egg.plotId
            local plot = game.Workspace:FindFirstChild(plotName)
            if not plot then continue end
            
            local eggModel = plot:FindFirstChild("Egg_" .. eggId)
            if not eggModel then continue end
            
            local eggPart = eggModel:FindFirstChild("EggPart")
            if not eggPart then continue end
            
            local gui = eggPart:FindFirstChild("BillboardGui")
            if not gui then continue end
            
            local progressFrame = gui:FindFirstChild("Frame")
            if progressFrame then
                local progressBar = progressFrame:FindFirstChild("ProgressBar")
                if progressBar then
                    progressBar.Size = UDim2.new(progress, 0, 1, 0)
                end
            end
            
            local timeLabel = gui:FindFirstChild("TimeLabel")
            if timeLabel then
                local eggType = eggTypes[eggData.egg.type]
                local timeLeft = math.ceil(eggType.hatchTime * (1 - progress))
                timeLabel.Text = timeLeft .. "s"
            end
            
            break
        end
    end
end

function EggManager:HatchEgg(eggId)
    local eggData = activeEggs[eggId]
    if not eggData then return end
    
    local player = Players:GetPlayerByUserId(eggData.playerId)
    if not player then
        activeEggs[eggId] = nil
        return
    end
    
    local egg = eggData.egg
    local eggType = eggTypes[egg.type]
    
    -- Generate toon from egg
    local ToonManager = require(script.Parent.ToonManager)
    local toon = ToonManager:GenerateToonFromEgg(eggType)
    
    -- Add toon to plot
    local playerPlots = PlotManager:GetPlayerPlots(player)
    local plot = playerPlots[egg.plotId]
    if plot then
        plot.toons[toon.id] = toon
        
        -- Remove egg from plot
        plot.eggs[eggId] = nil
    end
    
    -- Remove physical egg and create toon
    self:RemovePhysicalEgg(eggData.playerId, egg.plotId, eggId)
    ToonManager:CreatePhysicalToon(player, toon, egg.plotId)
    
    -- Update statistics
    DataManager:UpdatePlayerData(player, "statistics.toonsHatched", 
        DataManager:GetPlayerData(player).statistics.toonsHatched + 1)
    
    -- Notify player
    self:NotifyPlayer(player, "🎉 Your egg hatched! You got a " .. toon.rarity .. " " .. toon.name .. "!")
    
    -- Clean up
    activeEggs[eggId] = nil
    
    print("EggManager:", player.Name, "hatched", eggType.name, "got", toon.rarity, toon.name)
end

function EggManager:ForceHatchEgg(player, eggId)
    -- Premium feature to instantly hatch eggs
    local eggData = activeEggs[eggId]
    if not eggData or eggData.playerId ~= player.UserId then return end
    
    -- In a real game, this would require Robux payment
    self:HatchEgg(eggId)
end

function EggManager:RemovePhysicalEgg(playerId, plotId, eggId)
    local plotName = "Plot_" .. playerId .. "_" .. plotId
    local plot = game.Workspace:FindFirstChild(plotName)
    if not plot then return end
    
    local eggModel = plot:FindFirstChild("Egg_" .. eggId)
    if eggModel then
        eggModel:Destroy()
    end
end

function EggManager:GenerateEggId()
    return "egg_" .. tick() .. "_" .. math.random(1000, 9999)
end

function EggManager:NotifyPlayer(player, message)
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local notificationRemote = remotes:FindFirstChild("Notification")
        if notificationRemote then
            notificationRemote:FireClient(player, message)
        end
    end
end

function EggManager:GetEggTypes()
    return eggTypes
end

return EggManager