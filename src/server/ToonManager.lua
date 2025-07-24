-- ToonManager.lua
-- Handles toon generation, leveling, evolution, and management

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local DataManager = require(script.Parent.DataManager)
local PlotManager = require(script.Parent.PlotManager)

local ToonManager = {}
local toonTemplates = {}
local activeToons = {} -- Toons generating income

-- Toon rarity definitions
local RARITY_CONFIG = {
    Common = {
        baseValue = 1,
        evolutionMultiplier = 1.2,
        color = Color3.new(0.7, 0.7, 0.7)
    },
    Uncommon = {
        baseValue = 2,
        evolutionMultiplier = 1.4,
        color = Color3.new(0.2, 0.8, 0.2)
    },
    Rare = {
        baseValue = 5,
        evolutionMultiplier = 1.6,
        color = Color3.new(0.2, 0.4, 1)
    },
    Epic = {
        baseValue = 15,
        evolutionMultiplier = 1.8,
        color = Color3.new(0.8, 0.2, 0.8)
    },
    Legendary = {
        baseValue = 50,
        evolutionMultiplier = 2.0,
        color = Color3.new(1, 0.8, 0.2)
    },
    Mythic = {
        baseValue = 150,
        evolutionMultiplier = 2.5,
        color = Color3.new(1, 0.2, 0.2)
    },
    Glitched = {
        baseValue = 500,
        evolutionMultiplier = 3.0,
        color = Color3.new(0.1, 0.1, 0.1)
    }
}

-- Toon templates
local TOON_TEMPLATES = {
    -- Basic toons
    {
        name = "Silly Cat",
        type = "cat",
        description = "A goofy cartoon cat that loves to play!",
        baseSize = Vector3.new(3, 4, 2),
        animations = {"idle", "dance", "play"}
    },
    {
        name = "Bouncy Dog",
        type = "dog",
        description = "An energetic dog that never stops bouncing!",
        baseSize = Vector3.new(3, 3, 4),
        animations = {"idle", "bounce", "bark"}
    },
    {
        name = "Wise Owl",
        type = "owl",
        description = "A smart-looking owl with big eyes!",
        baseSize = Vector3.new(2, 4, 2),
        animations = {"idle", "hoot", "fly"}
    },
    {
        name = "Speedy Mouse",
        type = "mouse",
        description = "A tiny mouse that's incredibly fast!",
        baseSize = Vector3.new(1, 2, 1),
        animations = {"idle", "run", "squeak"}
    },
    {
        name = "Happy Pig",
        type = "pig",
        description = "A jolly pig that loves to roll in mud!",
        baseSize = Vector3.new(4, 3, 4),
        animations = {"idle", "roll", "oink"}
    },
    -- Premium toons
    {
        name = "Rainbow Unicorn",
        type = "unicorn",
        description = "A magical unicorn with rainbow powers!",
        baseSize = Vector3.new(3, 5, 4),
        animations = {"idle", "magic", "gallop"},
        premium = true
    },
    {
        name = "Dragon Baby",
        type = "dragon",
        description = "A baby dragon learning to breathe fire!",
        baseSize = Vector3.new(4, 4, 6),
        animations = {"idle", "fire", "roar"},
        premium = true
    },
    {
        name = "Glitch Entity",
        type = "glitch",
        description = "A mysterious glitched being from another dimension!",
        baseSize = Vector3.new(3, 6, 3),
        animations = {"idle", "glitch", "phase"},
        premium = true,
        glitched = true
    }
}

function ToonManager:Init()
    print("ToonManager: Initializing...")
    
    -- Initialize toon templates
    for i, template in pairs(TOON_TEMPLATES) do
        toonTemplates[i] = template
    end
    
    -- Connect remote events
    local remotes = ReplicatedStorage:WaitForChild("Remotes", 5)
    if remotes then
        local evolveToonRemote = remotes:FindFirstChild("EvolveToon")
        if evolveToonRemote then
            evolveToonRemote.OnServerEvent:Connect(function(player, toonId)
                self:EvolveToon(player, toonId)
            end)
        end
        
        local sellToonRemote = remotes:FindFirstChild("SellToon")
        if sellToonRemote then
            sellToonRemote.OnServerEvent:Connect(function(player, toonId)
                self:SellToon(player, toonId)
            end)
        end
    end
    
    -- Start income generation loop
    spawn(function()
        self:IncomeGenerationLoop()
    end)
end

function ToonManager:GenerateToonFromEgg(eggType)
    -- Select random toon template
    local availableTemplates = {}
    for i, template in pairs(toonTemplates) do
        if not template.premium or eggType.premium then
            table.insert(availableTemplates, {index = i, template = template})
        end
    end
    
    local selectedTemplate = availableTemplates[math.random(1, #availableTemplates)]
    local template = selectedTemplate.template
    
    -- Determine rarity based on egg type
    local rarity = self:DetermineRarity(eggType.rarity)
    local rarityConfig = RARITY_CONFIG[rarity]
    
    -- Generate toon
    local toon = {
        id = self:GenerateToonId(),
        name = template.name,
        type = template.type,
        description = template.description,
        rarity = rarity,
        level = 1,
        experience = 0,
        evolution = 1,
        value = rarityConfig.baseValue,
        size = template.baseSize,
        animations = template.animations,
        lastIncomeTime = tick(),
        isGlitched = template.glitched or false,
        stats = {
            strength = math.random(1, 10),
            speed = math.random(1, 10),
            intelligence = math.random(1, 10),
            charisma = math.random(1, 10)
        }
    }
    
    return toon
end

function ToonManager:DetermineRarity(rarityTable)
    local totalWeight = 0
    for _, weight in pairs(rarityTable) do
        totalWeight = totalWeight + weight
    end
    
    local random = math.random(1, totalWeight)
    local current = 0
    
    for rarity, weight in pairs(rarityTable) do
        current = current + weight
        if random <= current then
            return rarity
        end
    end
    
    return "Common" -- Fallback
end

function ToonManager:CreatePhysicalToon(player, toon, plotId)
    local plotName = "Plot_" .. player.UserId .. "_" .. plotId
    local plot = game.Workspace:FindFirstChild(plotName)
    if not plot then return end
    
    -- Create toon model
    local toonModel = Instance.new("Model")
    toonModel.Name = "Toon_" .. toon.id
    toonModel.Parent = plot
    
    -- Create main toon part
    local toonPart = Instance.new("Part")
    toonPart.Name = "ToonPart"
    toonPart.Size = toon.size
    toonPart.Material = Enum.Material.SmoothPlastic
    toonPart.Shape = Enum.PartType.Block
    toonPart.Anchored = true
    toonPart.CanCollide = false
    
    -- Apply rarity color
    local rarityConfig = RARITY_CONFIG[toon.rarity]
    toonPart.Color = rarityConfig.color
    
    -- Special effects for higher rarities
    if toon.rarity == "Legendary" or toon.rarity == "Mythic" then
        local light = Instance.new("PointLight")
        light.Color = rarityConfig.color
        light.Brightness = 1
        light.Range = 8
        light.Parent = toonPart
    end
    
    -- Glitch effects
    if toon.isGlitched then
        toonPart.Material = Enum.Material.ForceField
        local glitchEffect = Instance.new("SelectionBox")
        glitchEffect.Color3 = Color3.new(1, 0, 1)
        glitchEffect.Transparency = 0.5
        glitchEffect.Adornee = toonPart
        glitchEffect.Parent = toonPart
    end
    
    -- Position toon randomly in plot
    local plotSize = 50
    local randomX = math.random(-plotSize/2 + 5, plotSize/2 - 5)
    local randomZ = math.random(-plotSize/2 + 5, plotSize/2 - 5)
    toonPart.Position = plot.Position + Vector3.new(randomX, toon.size.Y/2 + 5, randomZ)
    toonPart.Parent = toonModel
    
    -- Add toon info GUI
    local gui = Instance.new("BillboardGui")
    gui.Size = UDim2.new(0, 150, 0, 100)
    gui.StudsOffset = Vector3.new(0, toon.size.Y/2 + 2, 0)
    gui.Parent = toonPart
    
    local infoFrame = Instance.new("Frame")
    infoFrame.Size = UDim2.new(1, 0, 1, 0)
    infoFrame.BackgroundColor3 = Color3.new(0, 0, 0)
    infoFrame.BackgroundTransparency = 0.3
    infoFrame.BorderSizePixel = 1
    infoFrame.BorderColor3 = rarityConfig.color
    infoFrame.Parent = gui
    
    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, 0, 0.4, 0)
    nameLabel.Position = UDim2.new(0, 0, 0, 0)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = toon.name
    nameLabel.TextColor3 = Color3.new(1, 1, 1)
    nameLabel.TextScaled = true
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.Parent = infoFrame
    
    local rarityLabel = Instance.new("TextLabel")
    rarityLabel.Size = UDim2.new(1, 0, 0.3, 0)
    rarityLabel.Position = UDim2.new(0, 0, 0.4, 0)
    rarityLabel.BackgroundTransparency = 1
    rarityLabel.Text = toon.rarity
    rarityLabel.TextColor3 = rarityConfig.color
    rarityLabel.TextScaled = true
    rarityLabel.Font = Enum.Font.Gotham
    rarityLabel.Parent = infoFrame
    
    local levelLabel = Instance.new("TextLabel")
    levelLabel.Size = UDim2.new(1, 0, 0.3, 0)
    levelLabel.Position = UDim2.new(0, 0, 0.7, 0)
    levelLabel.BackgroundTransparency = 1
    levelLabel.Text = "Level " .. toon.level .. " (Evo " .. toon.evolution .. ")"
    levelLabel.TextColor3 = Color3.new(0.8, 0.8, 0.8)
    levelLabel.TextScaled = true
    levelLabel.Font = Enum.Font.Gotham
    levelLabel.Parent = infoFrame
    
    -- Add toon to active income generation
    activeToons[toon.id] = {
        playerId = player.UserId,
        toon = toon,
        plotId = plotId
    }
    
    -- Start idle animation
    self:StartToonAnimation(toonModel, "idle")
end

function ToonManager:StartToonAnimation(toonModel, animationType)
    local toonPart = toonModel:FindFirstChild("ToonPart")
    if not toonPart then return end
    
    -- Simple animation system - just bobbing for now
    spawn(function()
        local startY = toonPart.Position.Y
        local time = 0
        
        while toonModel.Parent do
            time = time + 0.1
            local offset = math.sin(time * 2) * 0.5
            toonPart.Position = Vector3.new(toonPart.Position.X, startY + offset, toonPart.Position.Z)
            wait(0.1)
        end
    end)
end

function ToonManager:IncomeGenerationLoop()
    while true do
        local currentTime = tick()
        
        for toonId, toonData in pairs(activeToons) do
            local player = Players:GetPlayerByUserId(toonData.playerId)
            if not player then
                activeToons[toonId] = nil
                continue
            end
            
            local toon = toonData.toon
            local timeSinceLastIncome = currentTime - toon.lastIncomeTime
            
            -- Generate income every 5 seconds
            if timeSinceLastIncome >= 5 then
                local playerData = DataManager:GetPlayerData(player)
                if playerData then
                    local income = self:CalculateToonIncome(toon, playerData.boosts.coinMultiplier)
                    DataManager:ModifyPlayerCoins(player, income)
                    
                    -- Add experience
                    toon.experience = toon.experience + 1
                    self:CheckLevelUp(player, toon)
                    
                    toon.lastIncomeTime = currentTime
                end
            end
        end
        
        wait(1)
    end
end

function ToonManager:CalculateToonIncome(toon, boostMultiplier)
    local rarityConfig = RARITY_CONFIG[toon.rarity]
    local baseIncome = rarityConfig.baseValue * toon.level * (toon.evolution ^ 1.5)
    return math.floor(baseIncome * boostMultiplier)
end

function ToonManager:CheckLevelUp(player, toon)
    local expNeeded = toon.level * 10
    if toon.experience >= expNeeded then
        toon.level = toon.level + 1
        toon.experience = toon.experience - expNeeded
        
        -- Update visual
        self:UpdateToonVisual(toon)
        
        -- Notify player
        self:NotifyPlayer(player, toon.name .. " leveled up to level " .. toon.level .. "!")
    end
end

function ToonManager:EvolveToon(player, toonId)
    local toonData = self:FindPlayerToon(player, toonId)
    if not toonData then return false end
    
    local toon = toonData.toon
    local evolutionCost = self:GetEvolutionCost(toon)
    
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return false end
    
    if playerData.coins < evolutionCost then
        self:NotifyPlayer(player, "Not enough coins to evolve!")
        return false
    end
    
    -- Evolve the toon
    toon.evolution = toon.evolution + 1
    toon.level = 1
    toon.experience = 0
    toon.value = toon.value * RARITY_CONFIG[toon.rarity].evolutionMultiplier
    
    -- Deduct cost
    DataManager:ModifyPlayerCoins(player, -evolutionCost)
    
    -- Update visual
    self:UpdateToonVisual(toon)
    
    self:NotifyPlayer(player, "🌟 " .. toon.name .. " evolved to evolution " .. toon.evolution .. "!")
    
    print("ToonManager:", player.Name, "evolved", toon.name, "to evolution", toon.evolution)
    return true
end

function ToonManager:GetEvolutionCost(toon)
    return math.floor(toon.value * 10 * (toon.evolution ^ 2))
end

function ToonManager:SellToon(player, toonId)
    local toonData = self:FindPlayerToon(player, toonId)
    if not toonData then return false end
    
    local toon = toonData.toon
    local sellValue = math.floor(toon.value * 0.7) -- 70% of value
    
    -- Remove toon from plot
    local playerPlots = PlotManager:GetPlayerPlots(player)
    local plot = playerPlots[toonData.plotId]
    if plot then
        plot.toons[toonId] = nil
    end
    
    -- Remove from active toons
    activeToons[toonId] = nil
    
    -- Remove physical toon
    self:RemovePhysicalToon(player.UserId, toonData.plotId, toonId)
    
    -- Give coins
    DataManager:ModifyPlayerCoins(player, sellValue)
    
    self:NotifyPlayer(player, "Sold " .. toon.name .. " for " .. sellValue .. " coins!")
    
    print("ToonManager:", player.Name, "sold", toon.name, "for", sellValue, "coins")
    return true
end

function ToonManager:FindPlayerToon(player, toonId)
    for activeToonId, toonData in pairs(activeToons) do
        if activeToonId == toonId and toonData.playerId == player.UserId then
            return toonData
        end
    end
    return nil
end

function ToonManager:UpdateToonVisual(toon)
    local toonData = activeToons[toon.id]
    if not toonData then return end
    
    local plotName = "Plot_" .. toonData.playerId .. "_" .. toonData.plotId
    local plot = game.Workspace:FindFirstChild(plotName)
    if not plot then return end
    
    local toonModel = plot:FindFirstChild("Toon_" .. toon.id)
    if not toonModel then return end
    
    local toonPart = toonModel:FindFirstChild("ToonPart")
    if not toonPart then return end
    
    -- Update size based on evolution
    local newSize = toon.size * (1 + (toon.evolution - 1) * 0.2)
    toonPart.Size = newSize
    
    -- Update GUI
    local gui = toonPart:FindFirstChild("BillboardGui")
    if gui then
        local infoFrame = gui:FindFirstChild("Frame")
        if infoFrame then
            local levelLabel = infoFrame:GetChildren()[3] -- Third child should be level label
            if levelLabel then
                levelLabel.Text = "Level " .. toon.level .. " (Evo " .. toon.evolution .. ")"
            end
        end
    end
end

function ToonManager:RemovePhysicalToon(playerId, plotId, toonId)
    local plotName = "Plot_" .. playerId .. "_" .. plotId
    local plot = game.Workspace:FindFirstChild(plotName)
    if not plot then return end
    
    local toonModel = plot:FindFirstChild("Toon_" .. toonId)
    if toonModel then
        toonModel:Destroy()
    end
end

function ToonManager:GenerateToonId()
    return "toon_" .. tick() .. "_" .. math.random(1000, 9999)
end

function ToonManager:NotifyPlayer(player, message)
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local notificationRemote = remotes:FindFirstChild("Notification")
        if notificationRemote then
            notificationRemote:FireClient(player, message)
        end
    end
end

return ToonManager