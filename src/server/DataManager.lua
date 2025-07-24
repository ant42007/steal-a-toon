-- DataManager.lua
-- Handles player data storage, loading, and saving

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local DataManager = {}
local playerDataStore = DataStoreService:GetDataStore("PlayerData")
local playerData = {}

-- Default player data structure
local DEFAULT_DATA = {
    coins = 100,
    rebirths = 0,
    plots = {
        owned = 1,
        maxPlots = 10
    },
    toons = {},
    eggs = {},
    boosts = {
        coinMultiplier = 1,
        growthSpeed = 1,
        stealShield = 0
    },
    settings = {
        notifications = true,
        sounds = true
    },
    statistics = {
        toonsHatched = 0,
        toonsStolen = 0,
        coinsEarned = 0,
        timePlayed = 0
    }
}

function DataManager:Init()
    print("DataManager: Initializing...")
    
    -- Connect player events
    Players.PlayerAdded:Connect(function(player)
        self:LoadPlayerData(player)
    end)
    
    Players.PlayerRemoving:Connect(function(player)
        self:SavePlayerData(player)
    end)
    
    -- Auto-save every 30 seconds
    spawn(function()
        while true do
            wait(30)
            for _, player in pairs(Players:GetPlayers()) do
                self:SavePlayerData(player)
            end
        end
    end)
end

function DataManager:LoadPlayerData(player)
    local userId = player.UserId
    local success, data = pcall(function()
        return playerDataStore:GetAsync("Player_" .. userId)
    end)
    
    if success and data then
        playerData[userId] = data
        print("DataManager: Loaded data for", player.Name)
    else
        -- Use default data for new players
        playerData[userId] = self:DeepCopy(DEFAULT_DATA)
        print("DataManager: Created new data for", player.Name)
    end
    
    -- Fire remote event to client with player data
    local remotes = ReplicatedStorage:WaitForChild("Remotes", 5)
    if remotes then
        local dataLoadedRemote = remotes:FindFirstChild("DataLoaded")
        if dataLoadedRemote then
            dataLoadedRemote:FireClient(player, playerData[userId])
        end
    end
end

function DataManager:SavePlayerData(player)
    local userId = player.UserId
    if not playerData[userId] then return end
    
    local success, error = pcall(function()
        playerDataStore:SetAsync("Player_" .. userId, playerData[userId])
    end)
    
    if success then
        print("DataManager: Saved data for", player.Name)
    else
        warn("DataManager: Failed to save data for", player.Name, "Error:", error)
    end
end

function DataManager:GetPlayerData(player)
    local userId = player.UserId
    return playerData[userId]
end

function DataManager:UpdatePlayerData(player, dataPath, value)
    local userId = player.UserId
    if not playerData[userId] then return false end
    
    -- Navigate to the correct data location
    local current = playerData[userId]
    local pathParts = string.split(dataPath, ".")
    
    for i = 1, #pathParts - 1 do
        if not current[pathParts[i]] then
            current[pathParts[i]] = {}
        end
        current = current[pathParts[i]]
    end
    
    current[pathParts[#pathParts]] = value
    return true
end

function DataManager:ModifyPlayerCoins(player, amount)
    local userId = player.UserId
    if not playerData[userId] then return false end
    
    playerData[userId].coins = math.max(0, playerData[userId].coins + amount)
    
    -- Notify client of coin change
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local coinsUpdatedRemote = remotes:FindFirstChild("CoinsUpdated")
        if coinsUpdatedRemote then
            coinsUpdatedRemote:FireClient(player, playerData[userId].coins)
        end
    end
    
    return true
end

function DataManager:DeepCopy(original)
    local copy = {}
    for key, value in pairs(original) do
        if type(value) == "table" then
            copy[key] = self:DeepCopy(value)
        else
            copy[key] = value
        end
    end
    return copy
end

return DataManager