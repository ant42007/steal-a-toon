-- PlotManager.lua
-- Handles player plot claiming, upgrading, and management

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local DataManager = require(script.Parent.DataManager)

local PlotManager = {}
local plots = {}
local plotPositions = {}

-- Plot configuration
local PLOT_SIZE = Vector3.new(50, 1, 50)
local PLOT_SPACING = 60
local PLOTS_PER_ROW = 10
local BASE_PLOT_COST = 1000

function PlotManager:Init()
    print("PlotManager: Initializing...")
    
    -- Create plot positions
    self:GeneratePlotPositions()
    
    -- Connect remote events
    local remotes = ReplicatedStorage:WaitForChild("Remotes", 5)
    if remotes then
        local claimPlotRemote = remotes:FindFirstChild("ClaimPlot")
        if claimPlotRemote then
            claimPlotRemote.OnServerEvent:Connect(function(player, plotId)
                self:ClaimPlot(player, plotId)
            end)
        end
        
        local upgradePlotRemote = remotes:FindFirstChild("UpgradePlot")
        if upgradePlotRemote then
            upgradePlotRemote.OnServerEvent:Connect(function(player, plotId)
                self:UpgradePlot(player, plotId)
            end)
        end
    end
    
    -- Connect player events
    Players.PlayerAdded:Connect(function(player)
        player.CharacterAdded:Connect(function()
            self:SetupPlayerPlots(player)
        end)
    end)
end

function PlotManager:GeneratePlotPositions()
    local startX = -((PLOTS_PER_ROW * PLOT_SPACING) / 2)
    local startZ = -((PLOTS_PER_ROW * PLOT_SPACING) / 2)
    
    for row = 1, PLOTS_PER_ROW do
        for col = 1, PLOTS_PER_ROW do
            local plotId = ((row - 1) * PLOTS_PER_ROW) + col
            plotPositions[plotId] = Vector3.new(
                startX + (col * PLOT_SPACING),
                5,
                startZ + (row * PLOT_SPACING)
            )
        end
    end
end

function PlotManager:SetupPlayerPlots(player)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return end
    
    -- Auto-claim first plot for new players
    if not plots[player.UserId] then
        plots[player.UserId] = {}
        self:ClaimPlot(player, 1, true) -- Auto-claim first plot
    end
end

function PlotManager:ClaimPlot(player, plotId, isAuto)
    isAuto = isAuto or false
    
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return false end
    
    -- Check if plot is already claimed
    for userId, userPlots in pairs(plots) do
        if userPlots[plotId] then
            if not isAuto then
                -- Notify player that plot is taken
                local remotes = ReplicatedStorage:FindFirstChild("Remotes")
                if remotes then
                    local plotClaimFailedRemote = remotes:FindFirstChild("PlotClaimFailed")
                    if plotClaimFailedRemote then
                        plotClaimFailedRemote:FireClient(player, "Plot already claimed!")
                    end
                end
            end
            return false
        end
    end
    
    -- Check if player can afford the plot
    local plotCost = self:GetPlotCost(plotId)
    if not isAuto and playerData.coins < plotCost then
        local remotes = ReplicatedStorage:FindFirstChild("Remotes")
        if remotes then
            local plotClaimFailedRemote = remotes:FindFirstChild("PlotClaimFailed")
            if plotClaimFailedRemote then
                plotClaimFailedRemote:FireClient(player, "Not enough coins!")
            end
        end
        return false
    end
    
    -- Claim the plot
    if not plots[player.UserId] then
        plots[player.UserId] = {}
    end
    
    plots[player.UserId][plotId] = {
        level = 1,
        capacity = 5,
        efficiency = 1.0,
        toons = {},
        eggs = {},
        lastUpgrade = tick()
    }
    
    -- Deduct coins (except for auto-claim)
    if not isAuto then
        DataManager:ModifyPlayerCoins(player, -plotCost)
    end
    
    -- Create physical plot in workspace
    self:CreatePhysicalPlot(player, plotId)
    
    -- Update player data
    DataManager:UpdatePlayerData(player, "plots.owned", self:GetPlayerPlotCount(player))
    
    print("PlotManager:", player.Name, "claimed plot", plotId)
    return true
end

function PlotManager:CreatePhysicalPlot(player, plotId)
    local position = plotPositions[plotId]
    if not position then return end
    
    -- Create plot base
    local plot = Instance.new("Part")
    plot.Name = "Plot_" .. player.UserId .. "_" .. plotId
    plot.Size = PLOT_SIZE
    plot.Position = position
    plot.Anchored = true
    plot.Material = Enum.Material.Grass
    plot.BrickColor = BrickColor.new("Bright green")
    plot.Parent = Workspace
    
    -- Add plot boundaries
    local boundary = Instance.new("Part")
    boundary.Name = "Boundary"
    boundary.Size = Vector3.new(PLOT_SIZE.X + 2, 10, PLOT_SIZE.Z + 2)
    boundary.Position = position + Vector3.new(0, 5, 0)
    boundary.Anchored = true
    boundary.CanCollide = false
    boundary.Transparency = 0.8
    boundary.Material = Enum.Material.ForceField
    boundary.BrickColor = BrickColor.new("Cyan")
    boundary.Parent = plot
    
    -- Add plot sign
    local sign = Instance.new("Part")
    sign.Name = "Sign"
    sign.Size = Vector3.new(5, 8, 1)
    sign.Position = position + Vector3.new(0, 4, PLOT_SIZE.Z/2 + 3)
    sign.Anchored = true
    sign.Material = Enum.Material.Wood
    sign.BrickColor = BrickColor.new("Brown")
    sign.Parent = plot
    
    -- Add text to sign
    local gui = Instance.new("SurfaceGui")
    gui.Face = Enum.NormalId.Front
    gui.Parent = sign
    
    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, 0, 0.6, 0)
    nameLabel.Position = UDim2.new(0, 0, 0, 0)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = player.Name .. "'s Plot"
    nameLabel.TextColor3 = Color3.new(1, 1, 1)
    nameLabel.TextScaled = true
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.Parent = gui
    
    local levelLabel = Instance.new("TextLabel")
    levelLabel.Size = UDim2.new(1, 0, 0.4, 0)
    levelLabel.Position = UDim2.new(0, 0, 0.6, 0)
    levelLabel.BackgroundTransparency = 1
    levelLabel.Text = "Level " .. plots[player.UserId][plotId].level
    levelLabel.TextColor3 = Color3.new(0.8, 0.8, 0.8)
    levelLabel.TextScaled = true
    levelLabel.Font = Enum.Font.Gotham
    levelLabel.Parent = gui
end

function PlotManager:UpgradePlot(player, plotId)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return false end
    
    local userPlots = plots[player.UserId]
    if not userPlots or not userPlots[plotId] then return false end
    
    local plot = userPlots[plotId]
    local upgradeCost = self:GetUpgradeCost(plot.level)
    
    if playerData.coins < upgradeCost then
        local remotes = ReplicatedStorage:FindFirstChild("Remotes")
        if remotes then
            local upgradeFailedRemote = remotes:FindFirstChild("UpgradeFailed")
            if upgradeFailedRemote then
                upgradeFailedRemote:FireClient(player, "Not enough coins!")
            end
        end
        return false
    end
    
    -- Upgrade the plot
    plot.level = plot.level + 1
    plot.capacity = plot.capacity + 2
    plot.efficiency = plot.efficiency * 1.1
    plot.lastUpgrade = tick()
    
    -- Deduct coins
    DataManager:ModifyPlayerCoins(player, -upgradeCost)
    
    -- Update physical plot
    self:UpdatePhysicalPlot(player, plotId)
    
    print("PlotManager:", player.Name, "upgraded plot", plotId, "to level", plot.level)
    return true
end

function PlotManager:UpdatePhysicalPlot(player, plotId)
    local plotName = "Plot_" .. player.UserId .. "_" .. plotId
    local plot = Workspace:FindFirstChild(plotName)
    if not plot then return end
    
    local sign = plot:FindFirstChild("Sign")
    if not sign then return end
    
    local gui = sign:FindFirstChild("SurfaceGui")
    if not gui then return end
    
    local levelLabel = gui:FindFirstChild("TextLabel")
    if levelLabel and levelLabel.Name ~= "TextLabel" then
        levelLabel = gui:GetChildren()[2] -- Get second text label
    end
    
    if levelLabel then
        levelLabel.Text = "Level " .. plots[player.UserId][plotId].level
    end
end

function PlotManager:GetPlotCost(plotId)
    return BASE_PLOT_COST * plotId
end

function PlotManager:GetUpgradeCost(currentLevel)
    return math.floor(500 * (currentLevel ^ 1.5))
end

function PlotManager:GetPlayerPlotCount(player)
    local userPlots = plots[player.UserId]
    if not userPlots then return 0 end
    
    local count = 0
    for _ in pairs(userPlots) do
        count = count + 1
    end
    return count
end

function PlotManager:GetPlayerPlots(player)
    return plots[player.UserId] or {}
end

return PlotManager