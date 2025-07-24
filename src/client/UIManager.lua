-- UIManager.lua
-- Handles all UI creation and management for the client

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local UIManager = {}
local screenGui = nil
local mainFrame = nil
local currentPlayerData = {}

function UIManager:Init()
    print("UIManager: Initializing...")
    
    -- Create main screen GUI
    screenGui = Instance.new("ScreenGui")
    screenGui.Name = "StealAToonUI"
    screenGui.ResetOnSpawn = false
    screenGui.Parent = playerGui
    
    -- Create main UI frame
    self:CreateMainUI()
    self:CreateEggShop()
    self:CreateInventory()
    self:CreateRebirthUI()
    self:CreateStealingUI()
    self:CreateBoostShop()
    
    -- Connect input events
    UserInputService.InputBegan:Connect(function(input, gameProcessed)
        if gameProcessed then return end
        
        if input.KeyCode == Enum.KeyCode.E then
            self:ToggleEggShop()
        elseif input.KeyCode == Enum.KeyCode.I then
            self:ToggleInventory()
        elseif input.KeyCode == Enum.KeyCode.R then
            self:ToggleRebirthUI()
        elseif input.KeyCode == Enum.KeyCode.S then
            self:ToggleStealingUI()
        elseif input.KeyCode == Enum.KeyCode.B then
            self:ToggleBoostShop()
        end
    end)
end

function UIManager:CreateMainUI()
    -- Main frame
    mainFrame = Instance.new("Frame")
    mainFrame.Name = "MainFrame"
    mainFrame.Size = UDim2.new(1, 0, 0, 80)
    mainFrame.Position = UDim2.new(0, 0, 0, 0)
    mainFrame.BackgroundColor3 = Color3.new(0.1, 0.1, 0.1)
    mainFrame.BackgroundTransparency = 0.2
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    -- Coins display
    local coinsFrame = Instance.new("Frame")
    coinsFrame.Name = "CoinsFrame"
    coinsFrame.Size = UDim2.new(0, 200, 0, 60)
    coinsFrame.Position = UDim2.new(0, 10, 0, 10)
    coinsFrame.BackgroundColor3 = Color3.new(1, 0.8, 0)
    coinsFrame.BorderSizePixel = 2
    coinsFrame.BorderColor3 = Color3.new(0.8, 0.6, 0)
    coinsFrame.Parent = mainFrame
    
    local coinsLabel = Instance.new("TextLabel")
    coinsLabel.Name = "CoinsLabel"
    coinsLabel.Size = UDim2.new(1, 0, 1, 0)
    coinsLabel.BackgroundTransparency = 1
    coinsLabel.Text = "💰 Coins: 0"
    coinsLabel.TextColor3 = Color3.new(0, 0, 0)
    coinsLabel.TextScaled = true
    coinsLabel.Font = Enum.Font.GothamBold
    coinsLabel.Parent = coinsFrame
    
    -- Rebirth display
    local rebirthFrame = Instance.new("Frame")
    rebirthFrame.Name = "RebirthFrame"
    rebirthFrame.Size = UDim2.new(0, 150, 0, 60)
    rebirthFrame.Position = UDim2.new(0, 220, 0, 10)
    rebirthFrame.BackgroundColor3 = Color3.new(0.8, 0.2, 0.8)
    rebirthFrame.BorderSizePixel = 2
    rebirthFrame.BorderColor3 = Color3.new(0.6, 0.1, 0.6)
    rebirthFrame.Parent = mainFrame
    
    local rebirthLabel = Instance.new("TextLabel")
    rebirthLabel.Name = "RebirthLabel"
    rebirthLabel.Size = UDim2.new(1, 0, 1, 0)
    rebirthLabel.BackgroundTransparency = 1
    rebirthLabel.Text = "🌟 Rebirths: 0"
    rebirthLabel.TextColor3 = Color3.new(1, 1, 1)
    rebirthLabel.TextScaled = true
    rebirthLabel.Font = Enum.Font.GothamBold
    rebirthLabel.Parent = rebirthFrame
    
    -- Control buttons
    local buttonsFrame = Instance.new("Frame")
    buttonsFrame.Name = "ButtonsFrame"
    buttonsFrame.Size = UDim2.new(0, 600, 0, 60)
    buttonsFrame.Position = UDim2.new(0, 380, 0, 10)
    buttonsFrame.BackgroundTransparency = 1
    buttonsFrame.Parent = mainFrame
    
    -- Create control buttons
    local buttons = {
        {name = "Eggs (E)", callback = function() self:ToggleEggShop() end},
        {name = "Inventory (I)", callback = function() self:ToggleInventory() end},
        {name = "Rebirth (R)", callback = function() self:ToggleRebirthUI() end},
        {name = "Steal (S)", callback = function() self:ToggleStealingUI() end},
        {name = "Boosts (B)", callback = function() self:ToggleBoostShop() end}
    }
    
    for i, buttonData in pairs(buttons) do
        local button = Instance.new("TextButton")
        button.Name = buttonData.name
        button.Size = UDim2.new(0, 110, 0, 50)
        button.Position = UDim2.new(0, (i-1) * 115, 0, 5)
        button.BackgroundColor3 = Color3.new(0.2, 0.4, 0.8)
        button.BorderSizePixel = 1
        button.BorderColor3 = Color3.new(0.1, 0.2, 0.6)
        button.Text = buttonData.name
        button.TextColor3 = Color3.new(1, 1, 1)
        button.TextScaled = true
        button.Font = Enum.Font.Gotham
        button.Parent = buttonsFrame
        
        button.MouseButton1Click:Connect(buttonData.callback)
        
        -- Hover effects
        button.MouseEnter:Connect(function()
            TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = Color3.new(0.3, 0.5, 0.9)}):Play()
        end)
        
        button.MouseLeave:Connect(function()
            TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = Color3.new(0.2, 0.4, 0.8)}):Play()
        end)
    end
end

function UIManager:CreateEggShop()
    local eggShop = Instance.new("Frame")
    eggShop.Name = "EggShop"
    eggShop.Size = UDim2.new(0, 400, 0, 500)
    eggShop.Position = UDim2.new(0.5, -200, 0.5, -250)
    eggShop.BackgroundColor3 = Color3.new(0.9, 0.9, 0.9)
    eggShop.BorderSizePixel = 2
    eggShop.BorderColor3 = Color3.new(0.5, 0.5, 0.5)
    eggShop.Visible = false
    eggShop.Parent = screenGui
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(1, 0, 0, 50)
    title.BackgroundColor3 = Color3.new(0.1, 0.8, 0.1)
    title.Text = "🥚 EGG SHOP 🥚"
    title.TextColor3 = Color3.new(1, 1, 1)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = eggShop
    
    -- Close button
    local closeButton = Instance.new("TextButton")
    closeButton.Name = "CloseButton"
    closeButton.Size = UDim2.new(0, 30, 0, 30)
    closeButton.Position = UDim2.new(1, -35, 0, 5)
    closeButton.BackgroundColor3 = Color3.new(1, 0, 0)
    closeButton.Text = "X"
    closeButton.TextColor3 = Color3.new(1, 1, 1)
    closeButton.TextScaled = true
    closeButton.Font = Enum.Font.GothamBold
    closeButton.Parent = eggShop
    
    closeButton.MouseButton1Click:Connect(function()
        self:ToggleEggShop()
    end)
    
    -- Egg list (will be populated dynamically)
    local scrollFrame = Instance.new("ScrollingFrame")
    scrollFrame.Name = "EggList"
    scrollFrame.Size = UDim2.new(1, -20, 1, -70)
    scrollFrame.Position = UDim2.new(0, 10, 0, 60)
    scrollFrame.BackgroundTransparency = 1
    scrollFrame.ScrollBarThickness = 8
    scrollFrame.Parent = eggShop
    
    -- Grid layout for eggs
    local gridLayout = Instance.new("UIGridLayout")
    gridLayout.CellSize = UDim2.new(0, 180, 0, 120)
    gridLayout.CellPadding = UDim2.new(0, 10, 0, 10)
    gridLayout.Parent = scrollFrame
end

function UIManager:CreateInventory()
    local inventory = Instance.new("Frame")
    inventory.Name = "Inventory"
    inventory.Size = UDim2.new(0, 600, 0, 400)
    inventory.Position = UDim2.new(0.5, -300, 0.5, -200)
    inventory.BackgroundColor3 = Color3.new(0.8, 0.8, 0.9)
    inventory.BorderSizePixel = 2
    inventory.BorderColor3 = Color3.new(0.4, 0.4, 0.6)
    inventory.Visible = false
    inventory.Parent = screenGui
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 50)
    title.BackgroundColor3 = Color3.new(0.2, 0.2, 0.8)
    title.Text = "📦 INVENTORY 📦"
    title.TextColor3 = Color3.new(1, 1, 1)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = inventory
    
    -- Close button
    local closeButton = Instance.new("TextButton")
    closeButton.Size = UDim2.new(0, 30, 0, 30)
    closeButton.Position = UDim2.new(1, -35, 0, 5)
    closeButton.BackgroundColor3 = Color3.new(1, 0, 0)
    closeButton.Text = "X"
    closeButton.TextColor3 = Color3.new(1, 1, 1)
    closeButton.TextScaled = true
    closeButton.Font = Enum.Font.GothamBold
    closeButton.Parent = inventory
    
    closeButton.MouseButton1Click:Connect(function()
        self:ToggleInventory()
    end)
end

function UIManager:CreateRebirthUI()
    local rebirthUI = Instance.new("Frame")
    rebirthUI.Name = "RebirthUI"
    rebirthUI.Size = UDim2.new(0, 500, 0, 400)
    rebirthUI.Position = UDim2.new(0.5, -250, 0.5, -200)
    rebirthUI.BackgroundColor3 = Color3.new(0.9, 0.8, 0.9)
    rebirthUI.BorderSizePixel = 2
    rebirthUI.BorderColor3 = Color3.new(0.7, 0.4, 0.7)
    rebirthUI.Visible = false
    rebirthUI.Parent = screenGui
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 50)
    title.BackgroundColor3 = Color3.new(0.8, 0.2, 0.8)
    title.Text = "🌟 REBIRTH SYSTEM 🌟"
    title.TextColor3 = Color3.new(1, 1, 1)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = rebirthUI
    
    -- Close button
    local closeButton = Instance.new("TextButton")
    closeButton.Size = UDim2.new(0, 30, 0, 30)
    closeButton.Position = UDim2.new(1, -35, 0, 5)
    closeButton.BackgroundColor3 = Color3.new(1, 0, 0)
    closeButton.Text = "X"
    closeButton.TextColor3 = Color3.new(1, 1, 1)
    closeButton.TextScaled = true
    closeButton.Font = Enum.Font.GothamBold
    closeButton.Parent = rebirthUI
    
    closeButton.MouseButton1Click:Connect(function()
        self:ToggleRebirthUI()
    end)
    
    -- Rebirth button
    local rebirthButton = Instance.new("TextButton")
    rebirthButton.Name = "RebirthButton"
    rebirthButton.Size = UDim2.new(0, 200, 0, 60)
    rebirthButton.Position = UDim2.new(0.5, -100, 1, -80)
    rebirthButton.BackgroundColor3 = Color3.new(0.8, 0.2, 0.2)
    rebirthButton.Text = "REBIRTH"
    rebirthButton.TextColor3 = Color3.new(1, 1, 1)
    rebirthButton.TextScaled = true
    rebirthButton.Font = Enum.Font.GothamBold
    rebirthButton.Parent = rebirthUI
    
    rebirthButton.MouseButton1Click:Connect(function()
        local remotes = ReplicatedStorage:FindFirstChild("Remotes")
        if remotes then
            local rebirthRemote = remotes:FindFirstChild("Rebirth")
            if rebirthRemote then
                rebirthRemote:FireServer()
            end
        end
    end)
end

function UIManager:CreateStealingUI()
    local stealingUI = Instance.new("Frame")
    stealingUI.Name = "StealingUI"
    stealingUI.Size = UDim2.new(0, 600, 0, 450)
    stealingUI.Position = UDim2.new(0.5, -300, 0.5, -225)
    stealingUI.BackgroundColor3 = Color3.new(0.9, 0.8, 0.8)
    stealingUI.BorderSizePixel = 2
    stealingUI.BorderColor3 = Color3.new(0.7, 0.4, 0.4)
    stealingUI.Visible = false
    stealingUI.Parent = screenGui
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 50)
    title.BackgroundColor3 = Color3.new(0.8, 0.2, 0.2)
    title.Text = "🎯 STEAL TOONS 🎯"
    title.TextColor3 = Color3.new(1, 1, 1)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = stealingUI
    
    -- Close button
    local closeButton = Instance.new("TextButton")
    closeButton.Size = UDim2.new(0, 30, 0, 30)
    closeButton.Position = UDim2.new(1, -35, 0, 5)
    closeButton.BackgroundColor3 = Color3.new(1, 0, 0)
    closeButton.Text = "X"
    closeButton.TextColor3 = Color3.new(1, 1, 1)
    closeButton.TextScaled = true
    closeButton.Font = Enum.Font.GothamBold
    closeButton.Parent = stealingUI
    
    closeButton.MouseButton1Click:Connect(function()
        self:ToggleStealingUI()
    end)
    
    -- Player list
    local scrollFrame = Instance.new("ScrollingFrame")
    scrollFrame.Name = "PlayerList"
    scrollFrame.Size = UDim2.new(1, -20, 1, -70)
    scrollFrame.Position = UDim2.new(0, 10, 0, 60)
    scrollFrame.BackgroundTransparency = 1
    scrollFrame.ScrollBarThickness = 8
    scrollFrame.Parent = stealingUI
end

function UIManager:CreateBoostShop()
    local boostShop = Instance.new("Frame")
    boostShop.Name = "BoostShop"
    boostShop.Size = UDim2.new(0, 450, 0, 500)
    boostShop.Position = UDim2.new(0.5, -225, 0.5, -250)
    boostShop.BackgroundColor3 = Color3.new(0.8, 0.9, 0.8)
    boostShop.BorderSizePixel = 2
    boostShop.BorderColor3 = Color3.new(0.4, 0.6, 0.4)
    boostShop.Visible = false
    boostShop.Parent = screenGui
    
    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 50)
    title.BackgroundColor3 = Color3.new(0.2, 0.8, 0.2)
    title.Text = "🚀 BOOST SHOP 🚀"
    title.TextColor3 = Color3.new(1, 1, 1)
    title.TextScaled = true
    title.Font = Enum.Font.GothamBold
    title.Parent = boostShop
    
    -- Close button
    local closeButton = Instance.new("TextButton")
    closeButton.Size = UDim2.new(0, 30, 0, 30)
    closeButton.Position = UDim2.new(1, -35, 0, 5)
    closeButton.BackgroundColor3 = Color3.new(1, 0, 0)
    closeButton.Text = "X"
    closeButton.TextColor3 = Color3.new(1, 1, 1)
    closeButton.TextScaled = true
    closeButton.Font = Enum.Font.GothamBold
    closeButton.Parent = boostShop
    
    closeButton.MouseButton1Click:Connect(function()
        self:ToggleBoostShop()
    end)
end

-- Toggle functions
function UIManager:ToggleEggShop()
    local eggShop = screenGui:FindFirstChild("EggShop")
    if eggShop then
        eggShop.Visible = not eggShop.Visible
    end
end

function UIManager:ToggleInventory()
    local inventory = screenGui:FindFirstChild("Inventory")
    if inventory then
        inventory.Visible = not inventory.Visible
    end
end

function UIManager:ToggleRebirthUI()
    local rebirthUI = screenGui:FindFirstChild("RebirthUI")
    if rebirthUI then
        rebirthUI.Visible = not rebirthUI.Visible
        
        -- Request rebirth info when opening
        if rebirthUI.Visible then
            local remotes = ReplicatedStorage:FindFirstChild("Remotes")
            if remotes then
                local getRebirthInfoRemote = remotes:FindFirstChild("GetRebirthInfo")
                if getRebirthInfoRemote then
                    getRebirthInfoRemote:FireServer()
                end
            end
        end
    end
end

function UIManager:ToggleStealingUI()
    local stealingUI = screenGui:FindFirstChild("StealingUI")
    if stealingUI then
        stealingUI.Visible = not stealingUI.Visible
        
        -- Request stealable players when opening
        if stealingUI.Visible then
            local remotes = ReplicatedStorage:FindFirstChild("Remotes")
            if remotes then
                local getStealablePlayersRemote = remotes:FindFirstChild("GetStealablePlayers")
                if getStealablePlayersRemote then
                    getStealablePlayersRemote:FireServer()
                end
            end
        end
    end
end

function UIManager:ToggleBoostShop()
    local boostShop = screenGui:FindFirstChild("BoostShop")
    if boostShop then
        boostShop.Visible = not boostShop.Visible
    end
end

-- Update functions
function UIManager:UpdatePlayerData(playerData)
    currentPlayerData = playerData
    self:UpdateCoins(playerData.coins)
    self:UpdateRebirths(playerData.rebirths or 0)
end

function UIManager:UpdateCoins(coins)
    local coinsLabel = mainFrame:FindFirstChild("CoinsFrame"):FindFirstChild("CoinsLabel")
    if coinsLabel then
        coinsLabel.Text = "💰 Coins: " .. coins
    end
end

function UIManager:UpdateRebirths(rebirths)
    local rebirthLabel = mainFrame:FindFirstChild("RebirthFrame"):FindFirstChild("RebirthLabel")
    if rebirthLabel then
        rebirthLabel.Text = "🌟 Rebirths: " .. rebirths
    end
end

function UIManager:UpdateBoosts(boosts)
    -- Update boost display (implement as needed)
    print("Client: Updated boosts", boosts)
end

function UIManager:UpdateRebirthInfo(rebirthInfo)
    -- Update rebirth UI with current info
    print("Client: Updated rebirth info", rebirthInfo)
end

function UIManager:UpdateStealablePlayers(players)
    -- Update stealing UI with available players
    print("Client: Updated stealable players", #players, "players available")
end

return UIManager