-- CombatManager.lua
-- Handles 1v1 tap battle combat system (unlocked after 2 rebirths)

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local DataManager = require(script.Parent.DataManager)
local RebirthManager = require(script.Parent.RebirthManager)
local ToonManager = require(script.Parent.ToonManager)

local CombatManager = {}
local activeBattles = {}
local battleQueue = {}

-- Combat configuration
local COMBAT_CONFIG = {
    minRebirthsRequired = 2,
    battleDuration = 60, -- seconds
    tapCooldown = 0.5, -- seconds between taps
    damageMultiplier = {
        Common = 1,
        Uncommon = 1.2,
        Rare = 1.5,
        Epic = 2,
        Legendary = 3,
        Mythic = 5,
        Glitched = 8
    },
    arenaPositions = {
        Vector3.new(500, 10, 0),   -- Arena 1
        Vector3.new(-500, 10, 0),  -- Arena 2
        Vector3.new(0, 10, 500),   -- Arena 3
        Vector3.new(0, 10, -500)   -- Arena 4
    }
}

function CombatManager:Init()
    print("CombatManager: Initializing combat system...")
    
    -- Create battle arenas
    self:CreateBattleArenas()
    
    -- Connect remote events
    local remotes = ReplicatedStorage:WaitForChild("Remotes", 5)
    if remotes then
        local challengePlayerRemote = remotes:FindFirstChild("ChallengePlayer")
        if challengePlayerRemote then
            challengePlayerRemote.OnServerEvent:Connect(function(player, targetPlayerId)
                self:ChallengePlayer(player, targetPlayerId)
            end)
        end
        
        local acceptChallengeRemote = remotes:FindFirstChild("AcceptChallenge")
        if acceptChallengeRemote then
            acceptChallengeRemote.OnServerEvent:Connect(function(player, challengeId)
                self:AcceptChallenge(player, challengeId)
            end)
        end
        
        local battleTapRemote = remotes:FindFirstChild("BattleTap")
        if battleTapRemote then
            battleTapRemote.OnServerEvent:Connect(function(player)
                self:ProcessBattleTap(player)
            end)
        end
        
        local selectBattleToonRemote = remotes:FindFirstChild("SelectBattleToon")
        if selectBattleToonRemote then
            selectBattleToonRemote.OnServerEvent:Connect(function(player, toonId)
                self:SelectBattleToon(player, toonId)
            end)
        end
    end
    
    -- Start battle management loop
    spawn(function()
        self:BattleManagementLoop()
    end)
end

function CombatManager:CreateBattleArenas()
    print("CombatManager: Creating battle arenas...")
    
    for i, position in pairs(COMBAT_CONFIG.arenaPositions) do
        -- Create arena platform
        local arena = Instance.new("Part")
        arena.Name = "BattleArena" .. i
        arena.Size = Vector3.new(40, 2, 40)
        arena.Position = position
        arena.Anchored = true
        arena.Material = Enum.Material.Neon
        arena.BrickColor = BrickColor.new("Really red")
        arena.TopSurface = Enum.SurfaceType.Smooth
        arena.Parent = game.Workspace
        
        -- Add arena boundary
        local boundary = Instance.new("Part")
        boundary.Name = "Boundary"
        boundary.Size = Vector3.new(42, 10, 42)
        boundary.Position = position + Vector3.new(0, 5, 0)
        boundary.Anchored = true
        boundary.CanCollide = false
        boundary.Transparency = 0.8
        boundary.Material = Enum.Material.ForceField
        boundary.BrickColor = BrickColor.new("Bright red")
        boundary.Parent = arena
        
        -- Add arena sign
        local sign = Instance.new("Part")
        sign.Name = "ArenaSign"
        sign.Size = Vector3.new(8, 12, 1)
        sign.Position = position + Vector3.new(0, 8, 22)
        sign.Anchored = true
        sign.Material = Enum.Material.Neon
        sign.BrickColor = BrickColor.new("Bright yellow")
        sign.Parent = arena
        
        -- Add sign GUI
        local gui = Instance.new("SurfaceGui")
        gui.Face = Enum.NormalId.Front
        gui.Parent = sign
        
        local titleLabel = Instance.new("TextLabel")
        titleLabel.Size = UDim2.new(1, 0, 0.6, 0)
        titleLabel.BackgroundTransparency = 1
        titleLabel.Text = "⚔️ BATTLE ARENA " .. i .. " ⚔️"
        titleLabel.TextColor3 = Color3.new(0, 0, 0)
        titleLabel.TextScaled = true
        titleLabel.Font = Enum.Font.GothamBold
        titleLabel.Parent = gui
        
        local statusLabel = Instance.new("TextLabel")
        statusLabel.Name = "StatusLabel"
        statusLabel.Size = UDim2.new(1, 0, 0.4, 0)
        statusLabel.Position = UDim2.new(0, 0, 0.6, 0)
        statusLabel.BackgroundTransparency = 1
        statusLabel.Text = "Available"
        statusLabel.TextColor3 = Color3.new(0, 0.8, 0)
        statusLabel.TextScaled = true
        statusLabel.Font = Enum.Font.Gotham
        statusLabel.Parent = gui
    end
end

function CombatManager:ChallengePlayer(challenger, targetPlayerId)
    -- Check if combat is unlocked for challenger
    local challengerData = DataManager:GetPlayerData(challenger)
    if not challengerData or (challengerData.rebirths or 0) < COMBAT_CONFIG.minRebirthsRequired then
        self:NotifyPlayer(challenger, "🔒 Combat unlocks after " .. COMBAT_CONFIG.minRebirthsRequired .. " rebirths!")
        return false
    end
    
    -- Get target player
    local targetPlayer = Players:GetPlayerByUserId(targetPlayerId)
    if not targetPlayer then
        self:NotifyPlayer(challenger, "❌ Target player not found!")
        return false
    end
    
    -- Check if target has combat unlocked
    local targetData = DataManager:GetPlayerData(targetPlayer)
    if not targetData or (targetData.rebirths or 0) < COMBAT_CONFIG.minRebirthsRequired then
        self:NotifyPlayer(challenger, "❌ Target player hasn't unlocked combat yet!")
        return false
    end
    
    -- Check if either player is already in battle
    if self:IsPlayerInBattle(challenger) or self:IsPlayerInBattle(targetPlayer) then
        self:NotifyPlayer(challenger, "⚔️ One of you is already in battle!")
        return false
    end
    
    -- Create challenge
    local challengeId = self:GenerateChallengeId()
    local challenge = {
        id = challengeId,
        challenger = challenger,
        target = targetPlayer,
        timestamp = tick(),
        status = "pending"
    }
    
    battleQueue[challengeId] = challenge
    
    -- Notify both players
    self:NotifyPlayer(challenger, "⚔️ Challenge sent to " .. targetPlayer.Name .. "!")
    self:NotifyPlayer(targetPlayer, "⚔️ " .. challenger.Name .. " challenged you to battle! Accept?")
    
    -- Send challenge to client
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local challengeReceivedRemote = remotes:FindFirstChild("ChallengeReceived")
        if challengeReceivedRemote then
            challengeReceivedRemote:FireClient(targetPlayer, {
                challengeId = challengeId,
                challengerName = challenger.Name,
                challengerId = challenger.UserId
            })
        end
    end
    
    -- Auto-expire challenge after 30 seconds
    spawn(function()
        wait(30)
        if battleQueue[challengeId] and battleQueue[challengeId].status == "pending" then
            battleQueue[challengeId] = nil
            self:NotifyPlayer(challenger, "⏰ Challenge to " .. targetPlayer.Name .. " expired.")
        end
    end)
    
    print("CombatManager:", challenger.Name, "challenged", targetPlayer.Name)
    return true
end

function CombatManager:AcceptChallenge(player, challengeId)
    local challenge = battleQueue[challengeId]
    if not challenge or challenge.target ~= player then
        self:NotifyPlayer(player, "❌ Invalid challenge!")
        return false
    end
    
    if challenge.status ~= "pending" then
        self:NotifyPlayer(player, "❌ Challenge is no longer available!")
        return false
    end
    
    -- Start battle
    local battleId = self:StartBattle(challenge.challenger, player)
    if battleId then
        battleQueue[challengeId] = nil -- Remove from queue
        return true
    else
        self:NotifyPlayer(player, "❌ Failed to start battle!")
        return false
    end
end

function CombatManager:StartBattle(player1, player2)
    -- Find available arena
    local arenaId = self:FindAvailableArena()
    if not arenaId then
        self:NotifyPlayer(player1, "❌ No available battle arenas!")
        return nil
    end
    
    -- Create battle instance
    local battleId = self:GenerateBattleId()
    local battle = {
        id = battleId,
        player1 = player1,
        player2 = player2,
        arenaId = arenaId,
        startTime = tick(),
        duration = COMBAT_CONFIG.battleDuration,
        status = "toon_selection",
        player1Toon = nil,
        player2Toon = nil,
        player1Health = 100,
        player2Health = 100,
        player1LastTap = 0,
        player2LastTap = 0,
        taps = {player1 = 0, player2 = 0}
    }
    
    activeBattles[battleId] = battle
    
    -- Update arena status
    self:UpdateArenaStatus(arenaId, "In Battle: " .. player1.Name .. " vs " .. player2.Name)
    
    -- Teleport players to arena
    self:TeleportToArena(player1, arenaId, "player1")
    self:TeleportToArena(player2, arenaId, "player2")
    
    -- Notify players
    self:NotifyPlayer(player1, "⚔️ Battle started! Select your toon!")
    self:NotifyPlayer(player2, "⚔️ Battle started! Select your toon!")
    
    -- Send battle info to clients
    self:SendBattleInfo(battleId)
    
    print("CombatManager: Started battle", battleId, "between", player1.Name, "and", player2.Name)
    return battleId
end

function CombatManager:SelectBattleToon(player, toonId)
    -- Find player's active battle
    local battle = self:FindPlayerBattle(player)
    if not battle or battle.status ~= "toon_selection" then
        return false
    end
    
    -- Validate toon ownership
    local toon = self:ValidatePlayerToon(player, toonId)
    if not toon then
        self:NotifyPlayer(player, "❌ Invalid toon selection!")
        return false
    end
    
    -- Set player's toon
    if battle.player1 == player then
        battle.player1Toon = toon
    elseif battle.player2 == player then
        battle.player2Toon = toon
    end
    
    self:NotifyPlayer(player, "✅ Toon selected: " .. toon.name)
    
    -- Check if both players have selected toons
    if battle.player1Toon and battle.player2Toon then
        battle.status = "active"
        battle.startTime = tick() -- Reset timer for actual battle
        
        self:NotifyPlayer(battle.player1, "⚔️ BATTLE BEGINS! Tap to attack!")
        self:NotifyPlayer(battle.player2, "⚔️ BATTLE BEGINS! Tap to attack!")
        
        -- Create battle visuals
        self:CreateBattleVisuals(battle)
    end
    
    return true
end

function CombatManager:ProcessBattleTap(player)
    local battle = self:FindPlayerBattle(player)
    if not battle or battle.status ~= "active" then
        return false
    end
    
    local currentTime = tick()
    local isPlayer1 = battle.player1 == player
    local lastTapTime = isPlayer1 and battle.player1LastTap or battle.player2LastTap
    
    -- Check tap cooldown
    if currentTime - lastTapTime < COMBAT_CONFIG.tapCooldown then
        return false
    end
    
    -- Update tap time
    if isPlayer1 then
        battle.player1LastTap = currentTime
        battle.taps.player1 = battle.taps.player1 + 1
    else
        battle.player2LastTap = currentTime
        battle.taps.player2 = battle.taps.player2 + 1
    end
    
    -- Calculate damage
    local playerToon = isPlayer1 and battle.player1Toon or battle.player2Toon
    local baseDamage = 10
    local rarityMultiplier = COMBAT_CONFIG.damageMultiplier[playerToon.rarity] or 1
    local levelMultiplier = 1 + (playerToon.level - 1) * 0.1
    local damage = math.floor(baseDamage * rarityMultiplier * levelMultiplier)
    
    -- Apply damage to opponent
    if isPlayer1 then
        battle.player2Health = math.max(0, battle.player2Health - damage)
    else
        battle.player1Health = math.max(0, battle.player1Health - damage)
    end
    
    -- Update battle visuals
    self:UpdateBattleVisuals(battle)
    
    -- Check for battle end
    if battle.player1Health <= 0 or battle.player2Health <= 0 then
        self:EndBattle(battle.id)
    end
    
    return true
end

function CombatManager:BattleManagementLoop()
    while true do
        local currentTime = tick()
        local battlesToEnd = {}
        
        for battleId, battle in pairs(activeBattles) do
            -- Check for battle timeout
            if battle.status == "active" and (currentTime - battle.startTime) >= battle.duration then
                table.insert(battlesToEnd, battleId)
            end
            
            -- Check for disconnected players
            if not battle.player1.Parent or not battle.player2.Parent then
                table.insert(battlesToEnd, battleId)
            end
        end
        
        -- End timed out battles
        for _, battleId in pairs(battlesToEnd) do
            self:EndBattle(battleId)
        end
        
        wait(1)
    end
end

function CombatManager:EndBattle(battleId)
    local battle = activeBattles[battleId]
    if not battle then return end
    
    -- Determine winner
    local winner, loser
    if battle.player1Health > battle.player2Health then
        winner = battle.player1
        loser = battle.player2
    elseif battle.player2Health > battle.player1Health then
        winner = battle.player2
        loser = battle.player1
    else
        -- Tie - determine by taps
        if battle.taps.player1 > battle.taps.player2 then
            winner = battle.player1
            loser = battle.player2
        else
            winner = battle.player2
            loser = battle.player1
        end
    end
    
    -- Calculate rewards
    local winnerReward = 1000 * (battle.player1Health + battle.player2Health) / 100
    local loserReward = math.floor(winnerReward * 0.3)
    
    -- Give rewards
    DataManager:ModifyPlayerCoins(winner, winnerReward)
    DataManager:ModifyPlayerCoins(loser, loserReward)
    
    -- Notify players
    self:NotifyPlayer(winner, "🏆 Victory! You earned " .. winnerReward .. " coins!")
    self:NotifyPlayer(loser, "💪 Good fight! You earned " .. loserReward .. " coins!")
    
    -- Update statistics
    local winnerData = DataManager:GetPlayerData(winner)
    local loserData = DataManager:GetPlayerData(loser)
    
    if winnerData then
        winnerData.statistics.battlesWon = (winnerData.statistics.battlesWon or 0) + 1
    end
    
    if loserData then
        loserData.statistics.battlesLost = (loserData.statistics.battlesLost or 0) + 1
    end
    
    -- Clean up battle
    self:CleanupBattle(battle)
    activeBattles[battleId] = nil
    
    print("CombatManager: Battle", battleId, "ended -", winner.Name, "defeated", loser.Name)
end

function CombatManager:CleanupBattle(battle)
    -- Update arena status
    self:UpdateArenaStatus(battle.arenaId, "Available")
    
    -- Remove battle visuals
    self:RemoveBattleVisuals(battle)
    
    -- Teleport players back to spawn
    self:TeleportToSpawn(battle.player1)
    self:TeleportToSpawn(battle.player2)
end

-- Helper functions
function CombatManager:FindAvailableArena()
    for i = 1, #COMBAT_CONFIG.arenaPositions do
        local inUse = false
        for _, battle in pairs(activeBattles) do
            if battle.arenaId == i then
                inUse = true
                break
            end
        end
        if not inUse then
            return i
        end
    end
    return nil
end

function CombatManager:IsPlayerInBattle(player)
    for _, battle in pairs(activeBattles) do
        if battle.player1 == player or battle.player2 == player then
            return true
        end
    end
    return false
end

function CombatManager:FindPlayerBattle(player)
    for _, battle in pairs(activeBattles) do
        if battle.player1 == player or battle.player2 == player then
            return battle
        end
    end
    return nil
end

function CombatManager:ValidatePlayerToon(player, toonId)
    -- This would validate that the player owns the toon
    -- For now, return a mock toon
    return {
        id = toonId,
        name = "Battle Toon",
        rarity = "Common",
        level = 1
    }
end

function CombatManager:TeleportToArena(player, arenaId, position)
    if not player.Character or not player.Character.PrimaryPart then return end
    
    local arenaPosition = COMBAT_CONFIG.arenaPositions[arenaId]
    local offset = position == "player1" and Vector3.new(-10, 5, 0) or Vector3.new(10, 5, 0)
    
    player.Character.PrimaryPart.Position = arenaPosition + offset
end

function CombatManager:TeleportToSpawn(player)
    if not player.Character or not player.Character.PrimaryPart then return end
    
    player.Character.PrimaryPart.Position = Vector3.new(0, 10, 80)
end

function CombatManager:UpdateArenaStatus(arenaId, status)
    local arena = game.Workspace:FindFirstChild("BattleArena" .. arenaId)
    if not arena then return end
    
    local sign = arena:FindFirstChild("ArenaSign")
    if not sign then return end
    
    local gui = sign:FindFirstChild("SurfaceGui")
    if not gui then return end
    
    local statusLabel = gui:FindFirstChild("StatusLabel")
    if statusLabel then
        statusLabel.Text = status
        statusLabel.TextColor3 = status == "Available" and Color3.new(0, 0.8, 0) or Color3.new(0.8, 0, 0)
    end
end

function CombatManager:CreateBattleVisuals(battle)
    -- Create visual representations of the battle (implement as needed)
    print("CombatManager: Creating battle visuals for", battle.id)
end

function CombatManager:UpdateBattleVisuals(battle)
    -- Update battle visuals (implement as needed)
    print("CombatManager: Updating battle visuals for", battle.id)
end

function CombatManager:RemoveBattleVisuals(battle)
    -- Remove battle visuals (implement as needed)
    print("CombatManager: Removing battle visuals for", battle.id)
end

function CombatManager:SendBattleInfo(battleId)
    -- Send battle information to clients (implement as needed)
    print("CombatManager: Sending battle info for", battleId)
end

function CombatManager:GenerateChallengeId()
    return "challenge_" .. tick() .. "_" .. math.random(1000, 9999)
end

function CombatManager:GenerateBattleId()
    return "battle_" .. tick() .. "_" .. math.random(1000, 9999)
end

function CombatManager:NotifyPlayer(player, message)
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local notificationRemote = remotes:FindFirstChild("Notification")
        if notificationRemote then
            notificationRemote:FireClient(player, message)
        end
    end
end

return CombatManager