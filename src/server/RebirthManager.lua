-- RebirthManager.lua
-- Handles rebirth system that resets progress but provides permanent benefits

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local DataManager = require(script.Parent.DataManager)
local PlotManager = require(script.Parent.PlotManager)

local RebirthManager = {}

-- Rebirth requirements and benefits
local REBIRTH_CONFIG = {
    [1] = {
        coinsRequired = 50000,
        benefits = {
            coinMultiplier = 1.5,
            plotCapacity = 2,
            unlocks = {"advanced_eggs", "toon_fusion"}
        }
    },
    [2] = {
        coinsRequired = 500000,
        benefits = {
            coinMultiplier = 2.0,
            plotCapacity = 3,
            unlocks = {"premium_eggs", "combat_system"}
        }
    },
    [3] = {
        coinsRequired = 5000000,
        benefits = {
            coinMultiplier = 3.0,
            plotCapacity = 5,
            unlocks = {"legendary_eggs", "guild_system"}
        }
    },
    [4] = {
        coinsRequired = 50000000,
        benefits = {
            coinMultiplier = 5.0,
            plotCapacity = 8,
            unlocks = {"mythic_eggs", "prestige_system"}
        }
    },
    [5] = {
        coinsRequired = 500000000,
        benefits = {
            coinMultiplier = 10.0,
            plotCapacity = 12,
            unlocks = {"glitched_eggs", "dimension_travel"}
        }
    }
}

function RebirthManager:Init()
    print("RebirthManager: Initializing...")
    
    -- Connect remote events
    local remotes = ReplicatedStorage:WaitForChild("Remotes", 5)
    if remotes then
        local rebirthRemote = remotes:FindFirstChild("Rebirth")
        if rebirthRemote then
            rebirthRemote.OnServerEvent:Connect(function(player)
                self:ProcessRebirth(player)
            end)
        end
        
        local getRebirthInfoRemote = remotes:FindFirstChild("GetRebirthInfo")
        if getRebirthInfoRemote then
            getRebirthInfoRemote.OnServerEvent:Connect(function(player)
                self:SendRebirthInfo(player)
            end)
        end
    end
end

function RebirthManager:ProcessRebirth(player)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return false end
    
    local currentRebirths = playerData.rebirths or 0
    local nextRebirth = currentRebirths + 1
    local rebirthConfig = REBIRTH_CONFIG[nextRebirth]
    
    if not rebirthConfig then
        self:NotifyPlayer(player, "🌟 You've reached the maximum rebirth level!")
        return false
    end
    
    -- Check if player meets requirements
    if playerData.coins < rebirthConfig.coinsRequired then
        self:NotifyPlayer(player, "❌ You need " .. rebirthConfig.coinsRequired .. " coins to rebirth!")
        return false
    end
    
    -- Confirm rebirth (in a real game, you'd show a confirmation dialog)
    print("RebirthManager:", player.Name, "is rebirthing from level", currentRebirths, "to", nextRebirth)
    
    -- Store pre-rebirth stats for comparison
    local preRebirthCoins = playerData.coins
    local preRebirthToons = self:CountPlayerToons(player)
    
    -- Reset player progress
    self:ResetPlayerProgress(player)
    
    -- Apply rebirth benefits
    self:ApplyRebirthBenefits(player, nextRebirth, rebirthConfig)
    
    -- Update rebirth count
    playerData.rebirths = nextRebirth
    
    -- Special rebirth effects
    self:CreateRebirthEffects(player)
    
    -- Notify player of successful rebirth
    local message = "🌟 REBIRTH SUCCESSFUL! 🌟\n" ..
                   "You are now Rebirth " .. nextRebirth .. "!\n" ..
                   "Coin Multiplier: " .. rebirthConfig.benefits.coinMultiplier .. "x\n" ..
                   "Plot Capacity: +" .. rebirthConfig.benefits.plotCapacity
    
    self:NotifyPlayer(player, message)
    
    -- Log rebirth statistics
    self:LogRebirthStats(player, nextRebirth, preRebirthCoins, preRebirthToons)
    
    -- Send updated rebirth info to client
    self:SendRebirthInfo(player)
    
    return true
end

function RebirthManager:ResetPlayerProgress(player)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return end
    
    -- Reset coins to starting amount
    playerData.coins = 100
    
    -- Clear all toons and eggs from plots
    local playerPlots = PlotManager:GetPlayerPlots(player)
    for plotId, plot in pairs(playerPlots) do
        -- Remove physical toons and eggs
        self:ClearPlotContents(player.UserId, plotId)
        
        -- Reset plot data
        plot.toons = {}
        plot.eggs = {}
        plot.level = 1
        plot.capacity = 5
        plot.efficiency = 1.0
    end
    
    -- Reset statistics (but keep some for achievements)
    local totalHatched = playerData.statistics.toonsHatched or 0
    local totalStolen = playerData.statistics.toonsStolen or 0
    local totalEarned = playerData.statistics.coinsEarned or 0
    local totalTime = playerData.statistics.timePlayed or 0
    
    playerData.statistics = {
        toonsHatched = 0,
        toonsStolen = 0,
        coinsEarned = 0,
        timePlayed = totalTime,
        -- Keep lifetime stats
        lifetimeToonsHatched = totalHatched,
        lifetimeToonsStolen = totalStolen,
        lifetimeCoinsEarned = totalEarned
    }
    
    print("RebirthManager: Reset progress for", player.Name)
end

function RebirthManager:ApplyRebirthBenefits(player, rebirthLevel, config)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return end
    
    -- Apply permanent coin multiplier
    if not playerData.permanentBoosts then
        playerData.permanentBoosts = {}
    end
    
    playerData.permanentBoosts.coinMultiplier = (playerData.permanentBoosts.coinMultiplier or 1) * config.benefits.coinMultiplier
    playerData.permanentBoosts.plotCapacity = (playerData.permanentBoosts.plotCapacity or 0) + config.benefits.plotCapacity
    
    -- Unlock new features
    if not playerData.unlocks then
        playerData.unlocks = {}
    end
    
    for _, unlock in pairs(config.benefits.unlocks) do
        playerData.unlocks[unlock] = true
        self:NotifyPlayer(player, "🔓 Unlocked: " .. unlock:gsub("_", " "):gsub("(%a)([%w_']*)", function(first, rest) return first:upper()..rest:lower() end))
    end
    
    -- Give starting bonus based on rebirth level
    local startingBonus = rebirthLevel * 500
    playerData.coins = playerData.coins + startingBonus
    
    print("RebirthManager: Applied benefits for", player.Name, "rebirth", rebirthLevel)
end

function RebirthManager:CreateRebirthEffects(player)
    -- Create visual effects for rebirth
    if not player.Character then return end
    
    local character = player.Character
    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end
    
    -- Create rebirth aura effect
    local aura = Instance.new("Part")
    aura.Name = "RebirthAura"
    aura.Size = Vector3.new(10, 20, 10)
    aura.Position = humanoidRootPart.Position
    aura.Anchored = true
    aura.CanCollide = false
    aura.Transparency = 0.5
    aura.Material = Enum.Material.ForceField
    aura.BrickColor = BrickColor.new("Bright yellow")
    aura.Shape = Enum.PartType.Cylinder
    aura.Parent = game.Workspace
    
    -- Add light effect
    local light = Instance.new("PointLight")
    light.Color = Color3.new(1, 1, 0)
    light.Brightness = 3
    light.Range = 20
    light.Parent = aura
    
    -- Animate the aura
    spawn(function()
        for i = 1, 30 do
            aura.Size = aura.Size + Vector3.new(1, 0, 1)
            aura.Transparency = aura.Transparency + 0.03
            wait(0.1)
        end
        aura:Destroy()
    end)
    
    -- Play sound effect (if available)
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxasset://sounds/electronicpingshort.wav"
    sound.Volume = 0.5
    sound.Parent = humanoidRootPart
    sound:Play()
    
    -- Clean up sound
    spawn(function()
        wait(2)
        sound:Destroy()
    end)
end

function RebirthManager:ClearPlotContents(playerId, plotId)
    local plotName = "Plot_" .. playerId .. "_" .. plotId
    local plot = game.Workspace:FindFirstChild(plotName)
    if not plot then return end
    
    -- Remove all toons
    for _, child in pairs(plot:GetChildren()) do
        if child.Name:match("^Toon_") then
            child:Destroy()
        elseif child.Name:match("^Egg_") then
            child:Destroy()
        end
    end
end

function RebirthManager:CountPlayerToons(player)
    local count = 0
    local playerPlots = PlotManager:GetPlayerPlots(player)
    
    for _, plot in pairs(playerPlots) do
        for _ in pairs(plot.toons or {}) do
            count = count + 1
        end
    end
    
    return count
end

function RebirthManager:SendRebirthInfo(player)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return end
    
    local currentRebirths = playerData.rebirths or 0
    local nextRebirth = currentRebirths + 1
    local rebirthConfig = REBIRTH_CONFIG[nextRebirth]
    
    local rebirthInfo = {
        currentRebirths = currentRebirths,
        nextRebirthCost = rebirthConfig and rebirthConfig.coinsRequired or nil,
        nextRebirthBenefits = rebirthConfig and rebirthConfig.benefits or nil,
        permanentBoosts = playerData.permanentBoosts or {},
        unlocks = playerData.unlocks or {},
        canRebirth = rebirthConfig and playerData.coins >= rebirthConfig.coinsRequired or false
    }
    
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local rebirthInfoRemote = remotes:FindFirstChild("RebirthInfo")
        if rebirthInfoRemote then
            rebirthInfoRemote:FireClient(player, rebirthInfo)
        end
    end
end

function RebirthManager:LogRebirthStats(player, rebirthLevel, preCoins, preToons)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return end
    
    -- Initialize rebirth stats if not exists
    if not playerData.rebirthStats then
        playerData.rebirthStats = {}
    end
    
    -- Log this rebirth
    playerData.rebirthStats[rebirthLevel] = {
        timestamp = tick(),
        coinsSpent = preCoins,
        toonsLost = preToons,
        timeTaken = playerData.statistics.timePlayed or 0
    }
    
    print("RebirthManager: Logged rebirth stats for", player.Name, "- Level:", rebirthLevel, "Coins:", preCoins, "Toons:", preToons)
end

function RebirthManager:GetRebirthRequirement(rebirthLevel)
    local config = REBIRTH_CONFIG[rebirthLevel]
    return config and config.coinsRequired or nil
end

function RebirthManager:GetRebirthBenefits(rebirthLevel)
    local config = REBIRTH_CONFIG[rebirthLevel]
    return config and config.benefits or nil
end

function RebirthManager:IsFeatureUnlocked(player, featureName)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData or not playerData.unlocks then return false end
    
    return playerData.unlocks[featureName] == true
end

function RebirthManager:GetPermanentMultiplier(player, multiplierType)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData or not playerData.permanentBoosts then return 1 end
    
    return playerData.permanentBoosts[multiplierType] or 1
end

function RebirthManager:NotifyPlayer(player, message)
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local notificationRemote = remotes:FindFirstChild("Notification")
        if notificationRemote then
            notificationRemote:FireClient(player, message)
        end
    end
end

return RebirthManager