-- AdminTools.lua
-- Admin commands and debugging tools for testing the game

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local DataManager = require(script.Parent.DataManager)
local PlotManager = require(script.Parent.PlotManager)
local EggManager = require(script.Parent.EggManager)
local ToonManager = require(script.Parent.ToonManager)
local EconomyManager = require(script.Parent.EconomyManager)
local RebirthManager = require(script.Parent.RebirthManager)

local AdminTools = {}

-- Admin user IDs (replace with actual admin user IDs)
local ADMIN_IDS = {
    123456789, -- Replace with your Roblox user ID
    987654321  -- Add more admin IDs as needed
}

-- Debug commands
local COMMANDS = {
    {
        name = "givecoins",
        description = "Give coins to a player",
        usage = "/givecoins [amount]",
        adminOnly = true,
        func = function(player, args)
            local amount = tonumber(args[1]) or 1000
            DataManager:ModifyPlayerCoins(player, amount)
            return "Gave " .. amount .. " coins to " .. player.Name
        end
    },
    {
        name = "setrebirths",
        description = "Set player rebirth level",
        usage = "/setrebirths [level]",
        adminOnly = true,
        func = function(player, args)
            local level = tonumber(args[1]) or 1
            DataManager:UpdatePlayerData(player, "rebirths", level)
            return "Set " .. player.Name .. " rebirth level to " .. level
        end
    },
    {
        name = "spawntoon",
        description = "Spawn a toon on your plot",
        usage = "/spawntoon [rarity]",
        adminOnly = true,
        func = function(player, args)
            local rarity = args[1] or "Common"
            local mockEgg = {
                rarity = {[rarity] = 100},
                premium = rarity == "Mythic" or rarity == "Glitched"
            }
            
            local toon = ToonManager:GenerateToonFromEgg(mockEgg)
            toon.rarity = rarity
            
            -- Find player's first plot
            local playerPlots = PlotManager:GetPlayerPlots(player)
            local firstPlotId = nil
            for plotId, _ in pairs(playerPlots) do
                firstPlotId = plotId
                break
            end
            
            if firstPlotId then
                playerPlots[firstPlotId].toons[toon.id] = toon
                ToonManager:CreatePhysicalToon(player, toon, firstPlotId)
                return "Spawned " .. rarity .. " toon: " .. toon.name
            else
                return "No plots available"
            end
        end
    },
    {
        name = "clearplots",
        description = "Clear all toons and eggs from your plots",
        usage = "/clearplots",
        adminOnly = true,
        func = function(player, args)
            local playerPlots = PlotManager:GetPlayerPlots(player)
            local cleared = 0
            
            for plotId, plot in pairs(playerPlots) do
                -- Clear toons
                for toonId, _ in pairs(plot.toons) do
                    ToonManager:RemovePhysicalToon(player.UserId, plotId, toonId)
                    cleared = cleared + 1
                end
                plot.toons = {}
                
                -- Clear eggs
                for eggId, _ in pairs(plot.eggs) do
                    EggManager:RemovePhysicalEgg(player.UserId, plotId, eggId)
                    cleared = cleared + 1
                end
                plot.eggs = {}
            end
            
            return "Cleared " .. cleared .. " items from your plots"
        end
    },
    {
        name = "testrebirth",
        description = "Test rebirth without requirements",
        usage = "/testrebirth",
        adminOnly = true,
        func = function(player, args)
            local currentRebirths = DataManager:GetPlayerData(player).rebirths or 0
            RebirthManager:ProcessRebirth(player)
            return "Attempted rebirth from level " .. currentRebirths
        end
    },
    {
        name = "listcommands",
        description = "List all available commands",
        usage = "/listcommands",
        adminOnly = false,
        func = function(player, args)
            local commandList = "Available commands:\n"
            local isAdmin = AdminTools:IsAdmin(player)
            
            for _, cmd in pairs(COMMANDS) do
                if not cmd.adminOnly or isAdmin then
                    commandList = commandList .. cmd.usage .. " - " .. cmd.description .. "\n"
                end
            end
            
            return commandList
        end
    },
    {
        name = "stats",
        description = "Show player statistics",
        usage = "/stats",
        adminOnly = false,
        func = function(player, args)
            local playerData = DataManager:GetPlayerData(player)
            if not playerData then return "No player data found" end
            
            local stats = "=== " .. player.Name .. "'s Stats ===\n" ..
                         "Coins: " .. playerData.coins .. "\n" ..
                         "Rebirths: " .. (playerData.rebirths or 0) .. "\n" ..
                         "Plots Owned: " .. PlotManager:GetPlayerPlotCount(player) .. "\n" ..
                         "Toons Hatched: " .. (playerData.statistics.toonsHatched or 0) .. "\n" ..
                         "Toons Stolen: " .. (playerData.statistics.toonsStolen or 0)
            
            return stats
        end
    },
    {
        name = "tp",
        description = "Teleport to coordinates",
        usage = "/tp [x] [y] [z]",
        adminOnly = true,
        func = function(player, args)
            if not player.Character or not player.Character.PrimaryPart then
                return "Character not found"
            end
            
            local x = tonumber(args[1]) or 0
            local y = tonumber(args[2]) or 10
            local z = tonumber(args[3]) or 0
            
            player.Character.PrimaryPart.Position = Vector3.new(x, y, z)
            return "Teleported to " .. x .. ", " .. y .. ", " .. z
        end
    }
}

function AdminTools:Init()
    print("AdminTools: Initializing admin command system...")
    
    -- Connect to player chat
    Players.PlayerAdded:Connect(function(player)
        player.Chatted:Connect(function(message)
            self:ProcessCommand(player, message)
        end)
    end)
    
    -- Connect existing players
    for _, player in pairs(Players:GetPlayers()) do
        if player.Character then
            player.Chatted:Connect(function(message)
                self:ProcessCommand(player, message)
            end)
        end
    end
end

function AdminTools:ProcessCommand(player, message)
    -- Check if message is a command
    if not message:sub(1, 1) == "/" then return end
    
    -- Parse command
    local args = {}
    for word in message:gmatch("%S+") do
        table.insert(args, word)
    end
    
    local commandName = args[1]:sub(2):lower() -- Remove the "/"
    table.remove(args, 1) -- Remove command name from args
    
    -- Find command
    local command = nil
    for _, cmd in pairs(COMMANDS) do
        if cmd.name == commandName then
            command = cmd
            break
        end
    end
    
    if not command then return end
    
    -- Check admin permissions
    if command.adminOnly and not self:IsAdmin(player) then
        self:SendMessage(player, "❌ Admin only command!")
        return
    end
    
    -- Execute command
    local success, result = pcall(command.func, player, args)
    
    if success then
        self:SendMessage(player, result)
        print("AdminTools:", player.Name, "executed command:", commandName)
    else
        self:SendMessage(player, "❌ Command error: " .. tostring(result))
        warn("AdminTools: Command error for", player.Name, ":", result)
    end
end

function AdminTools:IsAdmin(player)
    for _, adminId in pairs(ADMIN_IDS) do
        if player.UserId == adminId then
            return true
        end
    end
    return false
end

function AdminTools:SendMessage(player, message)
    -- Send message via notification system
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local notificationRemote = remotes:FindFirstChild("Notification")
        if notificationRemote then
            notificationRemote:FireClient(player, message)
        end
    end
    
    -- Also print to output for admins
    if self:IsAdmin(player) then
        print("AdminTools -> " .. player.Name .. ": " .. message)
    end
end

-- Debugging utilities
function AdminTools:DumpPlayerData(player)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return "No data found" end
    
    print("=== Player Data Dump for " .. player.Name .. " ===")
    for key, value in pairs(playerData) do
        if type(value) == "table" then
            print(key .. ":")
            for subKey, subValue in pairs(value) do
                print("  " .. subKey .. ": " .. tostring(subValue))
            end
        else
            print(key .. ": " .. tostring(value))
        end
    end
    print("=== End Data Dump ===")
end

function AdminTools:GetSystemStatus()
    local status = {
        players = #Players:GetPlayers(),
        activePlots = 0,
        activeToons = 0,
        activeEggs = 0
    }
    
    -- Count active game objects
    for _, player in pairs(Players:GetPlayers()) do
        local plots = PlotManager:GetPlayerPlots(player)
        for _, plot in pairs(plots) do
            status.activePlots = status.activePlots + 1
            
            for _ in pairs(plot.toons) do
                status.activeToons = status.activeToons + 1
            end
            
            for _ in pairs(plot.eggs) do
                status.activeEggs = status.activeEggs + 1
            end
        end
    end
    
    return status
end

-- Performance monitoring
function AdminTools:StartPerformanceMonitor()
    spawn(function()
        while true do
            local status = self:GetSystemStatus()
            
            if status.players > 0 then
                print("AdminTools Performance:", 
                      "Players:", status.players,
                      "Plots:", status.activePlots,
                      "Toons:", status.activeToons,
                      "Eggs:", status.activeEggs)
            end
            
            wait(60) -- Report every minute
        end
    end)
end

-- Auto-admin detection (for testing)
function AdminTools:AutoDetectAdmin()
    Players.PlayerAdded:Connect(function(player)
        wait(1) -- Wait for player to fully load
        
        -- Auto-admin the first player in studio (for testing)
        if #Players:GetPlayers() == 1 and game:GetService("RunService"):IsStudio() then
            table.insert(ADMIN_IDS, player.UserId)
            self:SendMessage(player, "🔧 Auto-admin enabled for testing! Use /listcommands to see available commands.")
            print("AdminTools: Auto-admin enabled for", player.Name, "(Studio testing)")
        end
    end)
end

return AdminTools