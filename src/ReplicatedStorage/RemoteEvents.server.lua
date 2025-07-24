-- RemoteEvents setup
-- Creates all the remote events needed for client-server communication

local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Create Remotes folder
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
remotes.Parent = ReplicatedStorage

-- Data management remotes
local dataLoaded = Instance.new("RemoteEvent")
dataLoaded.Name = "DataLoaded"
dataLoaded.Parent = remotes

local coinsUpdated = Instance.new("RemoteEvent")
coinsUpdated.Name = "CoinsUpdated"
coinsUpdated.Parent = remotes

-- Plot management remotes
local claimPlot = Instance.new("RemoteEvent")
claimPlot.Name = "ClaimPlot"
claimPlot.Parent = remotes

local upgradePlot = Instance.new("RemoteEvent")
upgradePlot.Name = "UpgradePlot"
upgradePlot.Parent = remotes

local plotClaimFailed = Instance.new("RemoteEvent")
plotClaimFailed.Name = "PlotClaimFailed"
plotClaimFailed.Parent = remotes

local upgradeFailed = Instance.new("RemoteEvent")
upgradeFailed.Name = "UpgradeFailed"
upgradeFailed.Parent = remotes

-- Egg management remotes
local buyEgg = Instance.new("RemoteEvent")
buyEgg.Name = "BuyEgg"
buyEgg.Parent = remotes

local hatchEgg = Instance.new("RemoteEvent")
hatchEgg.Name = "HatchEgg"
hatchEgg.Parent = remotes

-- Toon management remotes
local evolveToon = Instance.new("RemoteEvent")
evolveToon.Name = "EvolveToon"
evolveToon.Parent = remotes

local sellToon = Instance.new("RemoteEvent")
sellToon.Name = "SellToon"
sellToon.Parent = remotes

-- Economy remotes
local buyBoost = Instance.new("RemoteEvent")
buyBoost.Name = "BuyBoost"
buyBoost.Parent = remotes

local buyPremiumItem = Instance.new("RemoteEvent")
buyPremiumItem.Name = "BuyPremiumItem"
buyPremiumItem.Parent = remotes

local claimOfflineEarnings = Instance.new("RemoteEvent")
claimOfflineEarnings.Name = "ClaimOfflineEarnings"
claimOfflineEarnings.Parent = remotes

local boostUpdated = Instance.new("RemoteEvent")
boostUpdated.Name = "BoostUpdated"
boostUpdated.Parent = remotes

-- Rebirth remotes
local rebirth = Instance.new("RemoteEvent")
rebirth.Name = "Rebirth"
rebirth.Parent = remotes

local getRebirthInfo = Instance.new("RemoteEvent")
getRebirthInfo.Name = "GetRebirthInfo"
getRebirthInfo.Parent = remotes

local rebirthInfo = Instance.new("RemoteEvent")
rebirthInfo.Name = "RebirthInfo"
rebirthInfo.Parent = remotes

-- Stealing remotes
local attemptSteal = Instance.new("RemoteEvent")
attemptSteal.Name = "AttemptSteal"
attemptSteal.Parent = remotes

local getStealablePlayers = Instance.new("RemoteEvent")
getStealablePlayers.Name = "GetStealablePlayers"
getStealablePlayers.Parent = remotes

local stealablePlayers = Instance.new("RemoteEvent")
stealablePlayers.Name = "StealablePlayers"
stealablePlayers.Parent = remotes

local startRaid = Instance.new("RemoteEvent")
startRaid.Name = "StartRaid"
startRaid.Parent = remotes

-- General notification remote
local notification = Instance.new("RemoteEvent")
notification.Name = "Notification"
notification.Parent = remotes

print("RemoteEvents: All remote events created successfully!")