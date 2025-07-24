-- ClientEggHandler.lua
-- Client-side script for handling egg interactions and UI

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- UI Elements
local screenGui = nil
local eggPlazaGui = nil
local notificationGui = nil

-- Create main UI
local function createUI()
    -- Create ScreenGui
    screenGui = Instance.new("ScreenGui")
    screenGui.Name = "StealAToonUI"
    screenGui.ResetOnSpawn = false
    screenGui.Parent = playerGui
    
    -- Create Egg Plaza UI (initially hidden)
    eggPlazaGui = Instance.new("Frame")
    eggPlazaGui.Name = "EggPlazaGui"
    eggPlazaGui.Size = UDim2.new(0, 400, 0, 500)
    eggPlazaGui.Position = UDim2.new(0.5, -200, 0.5, -250)
    eggPlazaGui.BackgroundColor3 = Color3.new(0.2, 0.2, 0.3)
    eggPlazaGui.BorderSizePixel = 2
    eggPlazaGui.BorderColor3 = Color3.new(1, 1, 1)
    eggPlazaGui.Visible = false
    eggPlazaGui.Parent = screenGui
    
    -- Plaza title
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(1, 0, 0, 50)
    title.Position = UDim2.new(0, 0, 0, 0)
    title.BackgroundColor3 = Color3.new(0.1, 0.1, 0.2)
    title.Text = "EGG PLAZA"
    title.TextColor3 = Color3.new(1, 1, 1)
    title.TextScaled = true
    title.Font = Enum.Font.SourceSansBold
    title.Parent = eggPlazaGui
    
    -- Currency display
    local currencyLabel = Instance.new("TextLabel")
    currencyLabel.Name = "CurrencyLabel"
    currencyLabel.Size = UDim2.new(1, -20, 0, 30)
    currencyLabel.Position = UDim2.new(0, 10, 0, 60)
    currencyLabel.BackgroundTransparency = 1
    currencyLabel.Text = "Coins: 1000"
    currencyLabel.TextColor3 = Color3.new(1, 1, 0)
    currencyLabel.TextScaled = true
    currencyLabel.Font = Enum.Font.SourceSans
    currencyLabel.TextXAlignment = Enum.TextXAlignment.Left
    currencyLabel.Parent = eggPlazaGui
    
    -- Egg shop items
    local eggTypes = {
        {name = "Common Egg", cost = 100, color = Color3.new(1, 1, 1)},
        {name = "Rare Egg", cost = 500, color = Color3.new(0, 0.5, 1)},
        {name = "Epic Egg", cost = 1500, color = Color3.new(0.5, 0, 1)},
        {name = "Legendary Egg", cost = 5000, color = Color3.new(1, 0.5, 0)}
    }
    
    for i, eggData in ipairs(eggTypes) do
        local eggButton = Instance.new("TextButton")
        eggButton.Name = "EggButton" .. i
        eggButton.Size = UDim2.new(1, -40, 0, 60)
        eggButton.Position = UDim2.new(0, 20, 0, 100 + (i - 1) * 80)
        eggButton.BackgroundColor3 = eggData.color
        eggButton.Text = eggData.name .. "\n" .. eggData.cost .. " Coins"
        eggButton.TextColor3 = Color3.new(0, 0, 0)
        eggButton.TextScaled = true
        eggButton.Font = Enum.Font.SourceSansBold
        eggButton.Parent = eggPlazaGui
        
        -- Button click handler
        eggButton.MouseButton1Click:Connect(function()
            purchaseEgg(eggData.name)
        end)
        
        -- Hover effects
        eggButton.MouseEnter:Connect(function()
            local tween = TweenService:Create(eggButton, TweenInfo.new(0.2), {Size = UDim2.new(1, -30, 0, 70)})
            tween:Play()
        end)
        
        eggButton.MouseLeave:Connect(function()
            local tween = TweenService:Create(eggButton, TweenInfo.new(0.2), {Size = UDim2.new(1, -40, 0, 60)})
            tween:Play()
        end)
    end
    
    -- Close button
    local closeButton = Instance.new("TextButton")
    closeButton.Name = "CloseButton"
    closeButton.Size = UDim2.new(0, 80, 0, 40)
    closeButton.Position = UDim2.new(1, -90, 1, -50)
    closeButton.BackgroundColor3 = Color3.new(0.8, 0.2, 0.2)
    closeButton.Text = "CLOSE"
    closeButton.TextColor3 = Color3.new(1, 1, 1)
    closeButton.TextScaled = true
    closeButton.Font = Enum.Font.SourceSansBold
    closeButton.Parent = eggPlazaGui
    
    closeButton.MouseButton1Click:Connect(function()
        hideEggPlaza()
    end)
    
    -- Create notification system
    createNotificationSystem()
end

-- Create notification system
local function createNotificationSystem()
    notificationGui = Instance.new("Frame")
    notificationGui.Name = "NotificationGui"
    notificationGui.Size = UDim2.new(0, 300, 0, 100)
    notificationGui.Position = UDim2.new(1, -320, 0, 20)
    notificationGui.BackgroundColor3 = Color3.new(0.1, 0.1, 0.1)
    notificationGui.BackgroundTransparency = 0.3
    notificationGui.BorderColor3 = Color3.new(1, 1, 1)
    notificationGui.BorderSizePixel = 2
    notificationGui.Visible = false
    notificationGui.Parent = screenGui
    
    local notificationText = Instance.new("TextLabel")
    notificationText.Name = "NotificationText"
    notificationText.Size = UDim2.new(1, -20, 1, -20)
    notificationText.Position = UDim2.new(0, 10, 0, 10)
    notificationText.BackgroundTransparency = 1
    notificationText.Text = ""
    notificationText.TextColor3 = Color3.new(1, 1, 1)
    notificationText.TextScaled = true
    notificationText.Font = Enum.Font.SourceSans
    notificationText.TextWrapped = true
    notificationText.Parent = notificationGui
end

-- Show notification
local function showNotification(message, duration)
    if not notificationGui then return end
    
    local notificationText = notificationGui:FindFirstChild("NotificationText")
    if notificationText then
        notificationText.Text = message
        notificationGui.Visible = true
        
        -- Slide in animation
        notificationGui.Position = UDim2.new(1, 0, 0, 20)
        local slideIn = TweenService:Create(notificationGui, TweenInfo.new(0.3), {Position = UDim2.new(1, -320, 0, 20)})
        slideIn:Play()
        
        -- Auto-hide after duration
        wait(duration or 3)
        local slideOut = TweenService:Create(notificationGui, TweenInfo.new(0.3), {Position = UDim2.new(1, 0, 0, 20)})
        slideOut:Play()
        
        slideOut.Completed:Connect(function()
            notificationGui.Visible = false
        end)
    end
end

-- Show egg plaza UI
local function showEggPlaza()
    if eggPlazaGui then
        eggPlazaGui.Visible = true
        
        -- Fade in animation
        eggPlazaGui.BackgroundTransparency = 1
        local fadeIn = TweenService:Create(eggPlazaGui, TweenInfo.new(0.3), {BackgroundTransparency = 0})
        fadeIn:Play()
    end
end

-- Hide egg plaza UI
function hideEggPlaza()
    if eggPlazaGui then
        local fadeOut = TweenService:Create(eggPlazaGui, TweenInfo.new(0.3), {BackgroundTransparency = 1})
        fadeOut:Play()
        
        fadeOut.Completed:Connect(function()
            eggPlazaGui.Visible = false
            eggPlazaGui.BackgroundTransparency = 0
        end)
    end
end

-- Purchase egg
function purchaseEgg(eggType)
    local remoteEvents = ReplicatedStorage:WaitForChild("RemoteEvents")
    local purchaseEgg = remoteEvents:WaitForChild("PurchaseEgg")
    
    purchaseEgg:FireServer(eggType)
    hideEggPlaza()
end

-- Handle proximity to Egg Plaza
local function checkEggPlazaProximity()
    local character = player.Character
    if not character or not character:FindFirstChild("HumanoidRootPart") then
        return
    end
    
    local eggPlaza = workspace:FindFirstChild("EggPlaza")
    if not eggPlaza then
        return
    end
    
    local distance = (character.HumanoidRootPart.Position - eggPlaza.Position).Magnitude
    
    if distance <= 15 then -- Within interaction range
        showNotification("Press E to visit Egg Plaza", 1)
        
        -- Check for E key press
        local connection
        connection = UserInputService.InputBegan:Connect(function(input)
            if input.KeyCode == Enum.KeyCode.E then
                showEggPlaza()
                connection:Disconnect()
            end
        end)
        
        -- Disconnect after leaving range
        wait(1)
        if (character.HumanoidRootPart.Position - eggPlaza.Position).Magnitude > 15 then
            connection:Disconnect()
        end
    end
end

-- Handle remote events
local function setupRemoteEvents()
    local remoteEvents = ReplicatedStorage:WaitForChild("RemoteEvents")
    
    -- Handle egg collection
    local eggCollected = remoteEvents:WaitForChild("EggCollected")
    eggCollected.OnClientEvent:Connect(function(eggType)
        showNotification("Collected " .. eggType .. " egg!", 2)
    end)
    
    -- Handle egg purchase confirmation
    if remoteEvents:FindFirstChild("EggPurchased") then
        remoteEvents.EggPurchased.OnClientEvent:Connect(function(eggInfo)
            showNotification("Purchased " .. eggInfo.name .. "!", 2)
        end)
    end
    
    -- Handle egg hatching
    if remoteEvents:FindFirstChild("EggHatched") then
        remoteEvents.EggHatched.OnClientEvent:Connect(function(rarity)
            showNotification("Your egg hatched into a " .. rarity .. " toon!", 3)
        end)
    end
end

-- Main initialization
local function initialize()
    createUI()
    setupRemoteEvents()
    
    -- Proximity checking loop
    spawn(function()
        while wait(1) do
            checkEggPlazaProximity()
        end
    end)
    
    print("Client Egg Handler initialized")
end

-- Wait for character and initialize
if player.Character then
    initialize()
else
    player.CharacterAdded:Connect(initialize)
end