-- Main server script for Steal a Toon
-- Initializes all server-side systems

local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Initialize core server systems
print("Steal a Toon Server - Initializing...")

-- Load server modules
local DataManager = require(script.Parent.DataManager)
local PlotManager = require(script.Parent.PlotManager)
local EggManager = require(script.Parent.EggManager)
local ToonManager = require(script.Parent.ToonManager)
local EconomyManager = require(script.Parent.EconomyManager)
local RebirthManager = require(script.Parent.RebirthManager)
local StealingManager = require(script.Parent.StealingManager)

-- Initialize managers
DataManager:Init()
PlotManager:Init()
EggManager:Init()
ToonManager:Init()
EconomyManager:Init()
RebirthManager:Init()
StealingManager:Init()

print("Steal a Toon Server - All systems initialized!")