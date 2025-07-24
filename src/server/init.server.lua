-- Main server script for Steal a Toon
-- Initializes all server-side systems

local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

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
local AssetIntegration = require(script.Parent.AssetIntegration)
local CombatManager = require(script.Parent.CombatManager)
local TestFramework = require(script.Parent.TestFramework)
local AdminTools = require(script.Parent.AdminTools)

-- Initialize managers in order
DataManager:Init()
AssetIntegration:Init()
PlotManager:Init()
EggManager:Init()
ToonManager:Init()
EconomyManager:Init()
RebirthManager:Init()
StealingManager:Init()
CombatManager:Init()

-- Initialize admin tools (for testing and debugging)
if RunService:IsStudio() then
    AdminTools:Init()
    AdminTools:AutoDetectAdmin()
    AdminTools:StartPerformanceMonitor()
end

-- Integrate Brainrot assets if available
spawn(function()
    wait(2) -- Wait for everything to load
    AssetIntegration:IntegrateBrainrotMap()
end)

-- Run system tests
spawn(function()
    wait(1) -- Wait for initialization
    TestFramework:Init()
end)

print("Steal a Toon Server - All systems initialized!")
print("Game ready for players!")