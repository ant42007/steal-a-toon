-- StealingManager.lua
-- Handles toon stealing mechanics and raid system

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local DataManager = require(script.Parent.DataManager)
local PlotManager = require(script.Parent.PlotManager)
local ToonManager = require(script.Parent.ToonManager)
local RebirthManager = require(script.Parent.RebirthManager)

local StealingManager = {}
local stealCooldowns = {} -- Track steal cooldowns per player
local activeRaids = {} -- Track ongoing raids

-- Stealing configuration
local STEAL_CONFIG = {
    baseCooldown = 300, -- 5 minutes base cooldown
    stealChance = 0.3, -- 30% base success chance
    maxStealsPerHour = 10,
    rarityMultipliers = {
        Common = 1.0,
        Uncommon = 0.8,
        Rare = 0.6,
        Epic = 0.4,
        Legendary = 0.2,
        Mythic = 0.1,
        Glitched = 0.05
    }
}

function StealingManager:Init()
    print("StealingManager: Initializing...")
    
    -- Connect remote events
    local remotes = ReplicatedStorage:WaitForChild("Remotes", 5)
    if remotes then
        local attemptStealRemote = remotes:FindFirstChild("AttemptSteal")
        if attemptStealRemote then
            attemptStealRemote.OnServerEvent:Connect(function(player, targetPlayerId, toonId)
                self:AttemptSteal(player, targetPlayerId, toonId)
            end)
        end
        
        local getStealablePlayersRemote = remotes:FindFirstChild("GetStealablePlayers")
        if getStealablePlayersRemote then
            getStealablePlayersRemote.OnServerEvent:Connect(function(player)
                self:SendStealablePlayers(player)
            end)
        end
        
        local startRaidRemote = remotes:FindFirstChild("StartRaid")
        if startRaidRemote then
            startRaidRemote.OnServerEvent:Connect(function(player, targetPlayerId)
                self:StartRaid(player, targetPlayerId)
            end)
        end
    end
    
    -- Start raid management loop
    spawn(function()
        self:RaidManagementLoop()
    end)
end

function StealingManager:AttemptSteal(player, targetPlayerId, toonId)
    -- Check if stealing is unlocked for the player
    if not RebirthManager:IsFeatureUnlocked(player, "toon_stealing") and 
       (DataManager:GetPlayerData(player).rebirths or 0) < 1 then
        self:NotifyPlayer(player, "🔒 Toon stealing unlocks after your first rebirth!")
        return false
    end
    
    -- Check cooldown
    if not self:CanPlayerSteal(player) then
        local timeLeft = self:GetStealCooldownTime(player)
        self:NotifyPlayer(player, "⏰ You must wait " .. math.ceil(timeLeft) .. " seconds before stealing again!")
        return false
    end
    
    -- Get target player
    local targetPlayer = Players:GetPlayerByUserId(targetPlayerId)
    if not targetPlayer then
        self:NotifyPlayer(player, "❌ Target player not found!")
        return false
    end
    
    -- Check if target has steal protection
    if self:IsPlayerProtected(targetPlayer) then
        self:NotifyPlayer(player, "🛡️ This player has steal protection active!")
        return false
    end
    
    -- Find the target toon
    local targetToon, targetPlotId = self:FindToonInPlayerPlots(targetPlayer, toonId)
    if not targetToon then
        self:NotifyPlayer(player, "❌ Target toon not found!")
        return false
    end
    
    -- Calculate steal success chance
    local successChance = self:CalculateStealChance(player, targetPlayer, targetToon)
    local success = math.random() <= successChance
    
    -- Set cooldown regardless of success
    self:SetStealCooldown(player)
    
    if success then
        -- Successful steal
        self:ExecuteSuccessfulSteal(player, targetPlayer, targetToon, targetPlotId)
        return true
    else
        -- Failed steal
        self:ExecuteFailedSteal(player, targetPlayer, targetToon)
        return false
    end
end

function StealingManager:CalculateStealChance(stealer, target, toon)
    local baseChance = STEAL_CONFIG.stealChance
    
    -- Rarity affects steal chance
    local rarityMultiplier = STEAL_CONFIG.rarityMultipliers[toon.rarity] or 1.0
    
    -- Player level difference (rebirth levels)
    local stealerRebirths = DataManager:GetPlayerData(stealer).rebirths or 0
    local targetRebirths = DataManager:GetPlayerData(target).rebirths or 0
    local levelDifference = stealerRebirths - targetRebirths
    local levelMultiplier = 1 + (levelDifference * 0.1) -- 10% per rebirth level difference
    
    -- Toon level affects difficulty
    local toonLevelMultiplier = 1 / (1 + (toon.level - 1) * 0.05) -- Harder to steal higher level toons
    
    -- Online/offline multiplier
    local onlineMultiplier = target and 0.7 or 1.0 -- Easier to steal from offline players
    
    local finalChance = baseChance * rarityMultiplier * levelMultiplier * toonLevelMultiplier * onlineMultiplier
    
    return math.min(finalChance, 0.8) -- Cap at 80% success rate
end

function StealingManager:ExecuteSuccessfulSteal(stealer, target, toon, targetPlotId)
    -- Remove toon from target's plot
    local targetPlots = PlotManager:GetPlayerPlots(target)
    local targetPlot = targetPlots[targetPlotId]
    if targetPlot then
        targetPlot.toons[toon.id] = nil
    end
    
    -- Remove physical toon from target's plot
    ToonManager:RemovePhysicalToon(target.UserId, targetPlotId, toon.id)
    
    -- Find available plot for stealer
    local stealerPlots = PlotManager:GetPlayerPlots(stealer)
    local availablePlot = nil
    local availablePlotId = nil
    
    for plotId, plot in pairs(stealerPlots) do
        local currentToons = 0
        for _ in pairs(plot.toons) do
            currentToons = currentToons + 1
        end
        if currentToons < plot.capacity then
            availablePlot = plot
            availablePlotId = plotId
            break
        end
    end
    
    if not availablePlot then
        -- No space - give coins instead
        local compensationCoins = math.floor(toon.value * 2)
        DataManager:ModifyPlayerCoins(stealer, compensationCoins)
        self:NotifyPlayer(stealer, "💰 No plot space! Received " .. compensationCoins .. " coins instead!")
    else
        -- Add toon to stealer's plot
        availablePlot.toons[toon.id] = toon
        ToonManager:CreatePhysicalToon(stealer, toon, availablePlotId)
        
        self:NotifyPlayer(stealer, "🎉 Successfully stole " .. toon.name .. " (" .. toon.rarity .. ")!")
    end
    
    -- Notify target (if online)
    if target then
        self:NotifyPlayer(target, "😢 Your " .. toon.name .. " was stolen by " .. stealer.Name .. "!")
    end
    
    -- Update statistics
    local stealerData = DataManager:GetPlayerData(stealer)
    local targetData = DataManager:GetPlayerData(target)
    
    if stealerData then
        stealerData.statistics.toonsStolen = (stealerData.statistics.toonsStolen or 0) + 1
    end
    
    if targetData then
        targetData.statistics.toonsLost = (targetData.statistics.toonsLost or 0) + 1
    end
    
    print("StealingManager:", stealer.Name, "successfully stole", toon.name, "from", target.Name)
end

function StealingManager:ExecuteFailedSteal(stealer, target, toon)
    self:NotifyPlayer(stealer, "❌ Failed to steal " .. toon.name .. " from " .. target.Name .. "!")
    
    -- Notify target (if online)
    if target then
        self:NotifyPlayer(target, "🛡️ " .. stealer.Name .. " tried to steal your " .. toon.name .. " but failed!")
    end
    
    print("StealingManager:", stealer.Name, "failed to steal", toon.name, "from", target.Name)
end

function StealingManager:StartRaid(player, targetPlayerId)
    -- Raids require multiple rebirths
    local playerData = DataManager:GetPlayerData(player)
    if not playerData or (playerData.rebirths or 0) < 2 then
        self:NotifyPlayer(player, "🔒 Raids unlock after your second rebirth!")
        return false
    end
    
    local targetPlayer = Players:GetPlayerByUserId(targetPlayerId)
    if not targetPlayer then
        self:NotifyPlayer(player, "❌ Target player not found!")
        return false
    end
    
    -- Check if raid is already active
    if activeRaids[player.UserId] then
        self:NotifyPlayer(player, "⚔️ You already have an active raid!")
        return false
    end
    
    -- Create raid
    local raid = {
        attackerId = player.UserId,
        targetId = targetPlayerId,
        startTime = tick(),
        duration = 60, -- 1 minute raid
        progress = 0,
        toonsStolen = 0,
        maxSteals = 3
    }
    
    activeRaids[player.UserId] = raid
    
    self:NotifyPlayer(player, "⚔️ Started raid on " .. targetPlayer.Name .. "! You have 60 seconds!")
    
    if targetPlayer then
        self:NotifyPlayer(targetPlayer, "🚨 " .. player.Name .. " is raiding your base!")
    end
    
    print("StealingManager:", player.Name, "started raid on", targetPlayer.Name)
    return true
end

function StealingManager:RaidManagementLoop()
    while true do
        local currentTime = tick()
        local completedRaids = {}
        
        for attackerId, raid in pairs(activeRaids) do
            local timeElapsed = currentTime - raid.startTime
            raid.progress = math.min(timeElapsed / raid.duration, 1)
            
            -- Check if raid is complete
            if raid.progress >= 1 or raid.toonsStolen >= raid.maxSteals then
                table.insert(completedRaids, attackerId)
                
                local attacker = Players:GetPlayerByUserId(attackerId)
                if attacker then
                    local message = "⚔️ Raid completed! Stole " .. raid.toonsStolen .. " toons!"
                    self:NotifyPlayer(attacker, message)
                end
            end
        end
        
        -- Clean up completed raids
        for _, attackerId in pairs(completedRaids) do
            activeRaids[attackerId] = nil
        end
        
        wait(1)
    end
end

function StealingManager:FindToonInPlayerPlots(player, toonId)
    local plots = PlotManager:GetPlayerPlots(player)
    
    for plotId, plot in pairs(plots) do
        if plot.toons and plot.toons[toonId] then
            return plot.toons[toonId], plotId
        end
    end
    
    return nil, nil
end

function StealingManager:CanPlayerSteal(player)
    local lastSteal = stealCooldowns[player.UserId]
    if not lastSteal then return true end
    
    local currentTime = tick()
    local timeSinceLastSteal = currentTime - lastSteal
    local cooldownTime = self:GetStealCooldown(player)
    
    return timeSinceLastSteal >= cooldownTime
end

function StealingManager:GetStealCooldown(player)
    local playerData = DataManager:GetPlayerData(player)
    local rebirths = playerData and playerData.rebirths or 0
    
    -- Cooldown decreases with rebirth level
    local cooldownReduction = rebirths * 30 -- 30 seconds less per rebirth
    return math.max(STEAL_CONFIG.baseCooldown - cooldownReduction, 60) -- Minimum 1 minute
end

function StealingManager:GetStealCooldownTime(player)
    local lastSteal = stealCooldowns[player.UserId]
    if not lastSteal then return 0 end
    
    local currentTime = tick()
    local timeSinceLastSteal = currentTime - lastSteal
    local cooldownTime = self:GetStealCooldown(player)
    
    return math.max(cooldownTime - timeSinceLastSteal, 0)
end

function StealingManager:SetStealCooldown(player)
    stealCooldowns[player.UserId] = tick()
end

function StealingManager:IsPlayerProtected(player)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData or not playerData.boosts then return false end
    
    local currentTime = tick()
    return playerData.boosts.stealShield and currentTime < playerData.boosts.stealShield
end

function StealingManager:SendStealablePlayers(player)
    local stealablePlayers = {}
    
    for _, otherPlayer in pairs(Players:GetPlayers()) do
        if otherPlayer ~= player and not self:IsPlayerProtected(otherPlayer) then
            local plots = PlotManager:GetPlayerPlots(otherPlayer)
            local toonCount = 0
            
            for _, plot in pairs(plots) do
                for _ in pairs(plot.toons or {}) do
                    toonCount = toonCount + 1
                end
            end
            
            if toonCount > 0 then
                table.insert(stealablePlayers, {
                    userId = otherPlayer.UserId,
                    name = otherPlayer.Name,
                    toonCount = toonCount,
                    rebirths = DataManager:GetPlayerData(otherPlayer).rebirths or 0
                })
            end
        end
    end
    
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local stealablePlayersRemote = remotes:FindFirstChild("StealablePlayers")
        if stealablePlayersRemote then
            stealablePlayersRemote:FireClient(player, stealablePlayers)
        end
    end
end

function StealingManager:GetActiveRaidInfo(player)
    return activeRaids[player.UserId]
end

function StealingManager:NotifyPlayer(player, message)
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local notificationRemote = remotes:FindFirstChild("Notification")
        if notificationRemote then
            notificationRemote:FireClient(player, message)
        end
    end
end

return StealingManager