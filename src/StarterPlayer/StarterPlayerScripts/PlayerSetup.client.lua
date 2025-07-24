-- PlayerSetup.client.lua
-- Sets up the player when they join the game

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterGui = game:GetService("StarterGui")

local player = Players.LocalPlayer

-- Wait for character to spawn
local character = player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

-- Set up player for the game
print("Setting up player:", player.Name)

-- Disable default Roblox UI elements that we don't need
StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, true)
StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Chat, true)
StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.EmotesMenu, false)
StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false)

-- Set up camera for tycoon-style gameplay
local camera = workspace.CurrentCamera
camera.CameraType = Enum.CameraType.Custom
camera.CameraSubject = character.Humanoid

-- Position camera for better tycoon view
spawn(function()
    wait(1) -- Wait for character to fully load
    if character and character.PrimaryPart then
        local cameraPosition = character.PrimaryPart.Position + Vector3.new(0, 50, 50)
        local lookAtPosition = character.PrimaryPart.Position
        
        camera.CFrame = CFrame.lookAt(cameraPosition, lookAtPosition)
    end
end)

-- Set player spawn location near their plot area
humanoid.Died:Connect(function()
    -- When player dies, they should respawn near their plots
    wait(5)
    if player.Character and player.Character.PrimaryPart then
        -- Move to spawn area (this would be adjusted based on plot locations)
        player.Character.PrimaryPart.Position = Vector3.new(0, 10, 0)
    end
end)

-- Load client-side scripts
local clientScript = ReplicatedStorage:WaitForChild("ClientScript", 10)
if clientScript then
    require(clientScript)
end

print("Player setup complete for", player.Name)