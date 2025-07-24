-- Main client script for Steal a Toon
-- Initializes UI and client-side systems

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterGui = game:GetService("StarterGui")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

print("Steal a Toon Client - Initializing for", player.Name)

-- Load client modules
local UIManager = require(script.Parent.UIManager)
local NotificationManager = require(script.Parent.NotificationManager)

-- Initialize client systems
UIManager:Init()
NotificationManager:Init()

-- Connect to server events
local remotes = ReplicatedStorage:WaitForChild("Remotes")

-- Data loaded event
local dataLoadedRemote = remotes:WaitForChild("DataLoaded")
dataLoadedRemote.OnClientEvent:Connect(function(playerData)
    print("Client: Received player data")
    UIManager:UpdatePlayerData(playerData)
end)

-- Coins updated event
local coinsUpdatedRemote = remotes:WaitForChild("CoinsUpdated")
coinsUpdatedRemote.OnClientEvent:Connect(function(newCoins)
    UIManager:UpdateCoins(newCoins)
end)

-- Notification event
local notificationRemote = remotes:WaitForChild("Notification")
notificationRemote.OnClientEvent:Connect(function(message)
    NotificationManager:ShowNotification(message)
end)

-- Boost updated event
local boostUpdatedRemote = remotes:WaitForChild("BoostUpdated")
boostUpdatedRemote.OnClientEvent:Connect(function(boosts)
    UIManager:UpdateBoosts(boosts)
end)

-- Rebirth info event
local rebirthInfoRemote = remotes:WaitForChild("RebirthInfo")
rebirthInfoRemote.OnClientEvent:Connect(function(rebirthInfo)
    UIManager:UpdateRebirthInfo(rebirthInfo)
end)

-- Stealable players event
local stealablePlayersRemote = remotes:WaitForChild("StealablePlayers")
stealablePlayersRemote.OnClientEvent:Connect(function(players)
    UIManager:UpdateStealablePlayers(players)
end)

print("Steal a Toon Client - All systems initialized!")