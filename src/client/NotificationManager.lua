-- NotificationManager.lua
-- Handles in-game notifications and popups

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local NotificationManager = {}
local notificationQueue = {}
local activeNotifications = {}
local maxActiveNotifications = 5

function NotificationManager:Init()
    print("NotificationManager: Initializing...")
    
    -- Create notification container
    self.screenGui = Instance.new("ScreenGui")
    self.screenGui.Name = "NotificationGui"
    self.screenGui.ResetOnSpawn = false
    self.screenGui.Parent = playerGui
    
    self.container = Instance.new("Frame")
    self.container.Name = "NotificationContainer"
    self.container.Size = UDim2.new(0, 350, 1, 0)
    self.container.Position = UDim2.new(1, -370, 0, 20)
    self.container.BackgroundTransparency = 1
    self.container.Parent = self.screenGui
    
    -- Start processing queue
    spawn(function()
        self:ProcessNotificationQueue()
    end)
end

function NotificationManager:ShowNotification(message, notificationType, duration)
    notificationType = notificationType or "info"
    duration = duration or 4
    
    local notification = {
        message = message,
        type = notificationType,
        duration = duration,
        timestamp = tick()
    }
    
    table.insert(notificationQueue, notification)
end

function NotificationManager:ProcessNotificationQueue()
    while true do
        -- Process queued notifications
        while #notificationQueue > 0 and #activeNotifications < maxActiveNotifications do
            local notification = table.remove(notificationQueue, 1)
            self:CreateNotificationGUI(notification)
        end
        
        -- Clean up expired notifications
        local currentTime = tick()
        for i = #activeNotifications, 1, -1 do
            local notification = activeNotifications[i]
            if currentTime - notification.startTime >= notification.duration then
                self:RemoveNotification(i)
            end
        end
        
        wait(0.1)
    end
end

function NotificationManager:CreateNotificationGUI(notification)
    local notificationFrame = Instance.new("Frame")
    notificationFrame.Name = "Notification"
    notificationFrame.Size = UDim2.new(1, 0, 0, 80)
    notificationFrame.Position = UDim2.new(0, 0, 0, #activeNotifications * 90)
    notificationFrame.BackgroundColor3 = self:GetNotificationColor(notification.type)
    notificationFrame.BorderSizePixel = 2
    notificationFrame.BorderColor3 = Color3.new(0.2, 0.2, 0.2)
    notificationFrame.Parent = self.container
    
    -- Add rounded corners
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = notificationFrame
    
    -- Icon
    local icon = Instance.new("TextLabel")
    icon.Name = "Icon"
    icon.Size = UDim2.new(0, 60, 1, 0)
    icon.Position = UDim2.new(0, 0, 0, 0)
    icon.BackgroundTransparency = 1
    icon.Text = self:GetNotificationIcon(notification.type)
    icon.TextColor3 = Color3.new(1, 1, 1)
    icon.TextScaled = true
    icon.Font = Enum.Font.GothamBold
    icon.Parent = notificationFrame
    
    -- Message text
    local messageLabel = Instance.new("TextLabel")
    messageLabel.Name = "Message"
    messageLabel.Size = UDim2.new(1, -70, 1, -10)
    messageLabel.Position = UDim2.new(0, 65, 0, 5)
    messageLabel.BackgroundTransparency = 1
    messageLabel.Text = notification.message
    messageLabel.TextColor3 = Color3.new(1, 1, 1)
    messageLabel.TextWrapped = true
    messageLabel.TextXAlignment = Enum.TextXAlignment.Left
    messageLabel.TextYAlignment = Enum.TextYAlignment.Center
    messageLabel.Font = Enum.Font.Gotham
    messageLabel.TextSize = 14
    messageLabel.Parent = notificationFrame
    
    -- Close button
    local closeButton = Instance.new("TextButton")
    closeButton.Name = "CloseButton"
    closeButton.Size = UDim2.new(0, 20, 0, 20)
    closeButton.Position = UDim2.new(1, -25, 0, 5)
    closeButton.BackgroundColor3 = Color3.new(1, 0, 0)
    closeButton.Text = "×"
    closeButton.TextColor3 = Color3.new(1, 1, 1)
    closeButton.TextScaled = true
    closeButton.Font = Enum.Font.GothamBold
    closeButton.Parent = notificationFrame
    
    local closeCorner = Instance.new("UICorner")
    closeCorner.CornerRadius = UDim.new(0, 10)
    closeCorner.Parent = closeButton
    
    -- Animation - slide in from right
    notificationFrame.Position = UDim2.new(1, 0, 0, #activeNotifications * 90)
    local slideInTween = TweenService:Create(
        notificationFrame,
        TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        {Position = UDim2.new(0, 0, 0, #activeNotifications * 90)}
    )
    slideInTween:Play()
    
    -- Play notification sound
    self:PlayNotificationSound(notification.type)
    
    -- Add to active notifications
    local notificationData = {
        frame = notificationFrame,
        startTime = tick(),
        duration = notification.duration,
        type = notification.type
    }
    
    table.insert(activeNotifications, notificationData)
    
    -- Connect close button
    closeButton.MouseButton1Click:Connect(function()
        for i, activeNotif in pairs(activeNotifications) do
            if activeNotif.frame == notificationFrame then
                self:RemoveNotification(i)
                break
            end
        end
    end)
    
    -- Hover effects
    notificationFrame.MouseEnter:Connect(function()
        TweenService:Create(
            notificationFrame,
            TweenInfo.new(0.2),
            {BackgroundTransparency = 0.1}
        ):Play()
    end)
    
    notificationFrame.MouseLeave:Connect(function()
        TweenService:Create(
            notificationFrame,
            TweenInfo.new(0.2),
            {BackgroundTransparency = 0}
        ):Play()
    end)
end

function NotificationManager:RemoveNotification(index)
    if not activeNotifications[index] then return end
    
    local notification = activeNotifications[index]
    local frame = notification.frame
    
    -- Slide out animation
    local slideOutTween = TweenService:Create(
        frame,
        TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
        {
            Position = UDim2.new(1, 0, frame.Position.Y.Scale, frame.Position.Y.Offset),
            BackgroundTransparency = 1
        }
    )
    
    slideOutTween:Play()
    slideOutTween.Completed:Connect(function()
        frame:Destroy()
    end)
    
    -- Remove from active notifications
    table.remove(activeNotifications, index)
    
    -- Reposition remaining notifications
    for i, activeNotif in pairs(activeNotifications) do
        local newPosition = UDim2.new(0, 0, 0, (i - 1) * 90)
        TweenService:Create(
            activeNotif.frame,
            TweenInfo.new(0.2),
            {Position = newPosition}
        ):Play()
    end
end

function NotificationManager:GetNotificationColor(notificationType)
    local colors = {
        info = Color3.new(0.2, 0.6, 1),      -- Blue
        success = Color3.new(0.2, 0.8, 0.2),  -- Green
        warning = Color3.new(1, 0.8, 0.2),    -- Orange
        error = Color3.new(1, 0.2, 0.2),      -- Red
        money = Color3.new(1, 0.8, 0),        -- Gold
        achievement = Color3.new(0.8, 0.2, 1) -- Purple
    }
    
    return colors[notificationType] or colors.info
end

function NotificationManager:GetNotificationIcon(notificationType)
    local icons = {
        info = "ℹ️",
        success = "✅",
        warning = "⚠️",
        error = "❌",
        money = "💰",
        achievement = "🏆"
    }
    
    return icons[notificationType] or icons.info
end

function NotificationManager:PlayNotificationSound(notificationType)
    -- Create sound effect based on notification type
    local sound = Instance.new("Sound")
    sound.Volume = 0.3
    sound.Parent = self.screenGui
    
    -- Different sounds for different types
    if notificationType == "success" or notificationType == "achievement" then
        sound.SoundId = "rbxasset://sounds/electronicpingshort.wav"
        sound.Pitch = 1.2
    elseif notificationType == "money" then
        sound.SoundId = "rbxasset://sounds/impact_water.mp3"
        sound.Pitch = 1.5
    elseif notificationType == "error" then
        sound.SoundId = "rbxasset://sounds/impact_water.mp3"
        sound.Pitch = 0.7
    else
        sound.SoundId = "rbxasset://sounds/button.wav"
    end
    
    sound:Play()
    
    -- Clean up sound after playing
    spawn(function()
        wait(2)
        sound:Destroy()
    end)
end

-- Convenience methods for different notification types
function NotificationManager:ShowSuccess(message, duration)
    self:ShowNotification(message, "success", duration)
end

function NotificationManager:ShowError(message, duration)
    self:ShowNotification(message, "error", duration)
end

function NotificationManager:ShowWarning(message, duration)
    self:ShowNotification(message, "warning", duration)
end

function NotificationManager:ShowMoney(message, duration)
    self:ShowNotification(message, "money", duration)
end

function NotificationManager:ShowAchievement(message, duration)
    self:ShowNotification(message, "achievement", duration or 6)
end

function NotificationManager:ClearAllNotifications()
    -- Clear queue
    notificationQueue = {}
    
    -- Remove all active notifications
    for i = #activeNotifications, 1, -1 do
        self:RemoveNotification(i)
    end
end

return NotificationManager