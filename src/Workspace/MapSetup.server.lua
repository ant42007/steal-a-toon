-- MapSetup.server.lua
-- Creates the basic map structure for Steal a Toon

local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")

print("Setting up Steal a Toon map...")

-- Configure lighting for a bright, cartoony feel
Lighting.Brightness = 2
Lighting.Ambient = Color3.new(0.2, 0.2, 0.3)
Lighting.ColorShift_Bottom = Color3.new(0.1, 0.1, 0.2)
Lighting.ColorShift_Top = Color3.new(0.2, 0.2, 0.4)
Lighting.OutdoorAmbient = Color3.new(0.4, 0.4, 0.5)
Lighting.ShadowSoftness = 0.5

-- Create sky
local sky = Instance.new("Sky")
sky.SkyboxBk = "rbxasset://textures/sky/sky512_bk.jpg"
sky.SkyboxDn = "rbxasset://textures/sky/sky512_dn.jpg"
sky.SkyboxFt = "rbxasset://textures/sky/sky512_ft.jpg"
sky.SkyboxLf = "rbxasset://textures/sky/sky512_lf.jpg"
sky.SkyboxRt = "rbxasset://textures/sky/sky512_rt.jpg"
sky.SkyboxUp = "rbxasset://textures/sky/sky512_up.jpg"
sky.Parent = Lighting

-- Create main ground/baseplate
local ground = Instance.new("Part")
ground.Name = "Ground"
ground.Size = Vector3.new(2000, 20, 2000)
ground.Position = Vector3.new(0, -10, 0)
ground.Anchored = true
ground.Material = Enum.Material.Grass
ground.BrickColor = BrickColor.new("Bright green")
ground.TopSurface = Enum.SurfaceType.Smooth
ground.Parent = Workspace

-- Create central Egg Plaza
local eggPlaza = Instance.new("Part")
eggPlaza.Name = "EggPlaza"
eggPlaza.Size = Vector3.new(100, 2, 100)
eggPlaza.Position = Vector3.new(0, 1, 0)
eggPlaza.Anchored = true
eggPlaza.Material = Enum.Material.Marble
eggPlaza.BrickColor = BrickColor.new("White")
eggPlaza.Parent = Workspace

-- Add plaza decoration
local plazaSign = Instance.new("Part")
plazaSign.Name = "PlazaSign"
plazaSign.Size = Vector3.new(20, 15, 2)
plazaSign.Position = Vector3.new(0, 10, 55)
plazaSign.Anchored = true
plazaSign.Material = Enum.Material.Neon
plazaSign.BrickColor = BrickColor.new("Bright yellow")
plazaSign.Parent = eggPlaza

-- Add sign text
local signGui = Instance.new("SurfaceGui")
signGui.Face = Enum.NormalId.Front
signGui.Parent = plazaSign

local signText = Instance.new("TextLabel")
signText.Size = UDim2.new(1, 0, 1, 0)
signText.BackgroundTransparency = 1
signText.Text = "🥚 EGG PLAZA 🥚\nChoose Your Eggs Here!"
signText.TextColor3 = Color3.new(0, 0, 0)
signText.TextScaled = true
signText.Font = Enum.Font.GothamBold
signText.Parent = signGui

-- Create spawn point
local spawnLocation = Instance.new("SpawnLocation")
spawnLocation.Name = "SpawnLocation"
spawnLocation.Size = Vector3.new(10, 1, 10)
spawnLocation.Position = Vector3.new(0, 3, 80)
spawnLocation.Anchored = true
spawnLocation.Material = Enum.Material.Neon
spawnLocation.BrickColor = BrickColor.new("Bright blue")
spawnLocation.CanCollide = true
spawnLocation.TopSurface = Enum.SurfaceType.Smooth
spawnLocation.Parent = Workspace

-- Create boundaries/walls around the play area
local boundaryPositions = {
    {Vector3.new(0, 25, 1000), Vector3.new(2000, 50, 10)},  -- North wall
    {Vector3.new(0, 25, -1000), Vector3.new(2000, 50, 10)}, -- South wall
    {Vector3.new(1000, 25, 0), Vector3.new(10, 50, 2000)},  -- East wall
    {Vector3.new(-1000, 25, 0), Vector3.new(10, 50, 2000)}  -- West wall
}

for i, boundary in pairs(boundaryPositions) do
    local wall = Instance.new("Part")
    wall.Name = "Boundary" .. i
    wall.Size = boundary[2]
    wall.Position = boundary[1]
    wall.Anchored = true
    wall.Material = Enum.Material.ForceField
    wall.BrickColor = BrickColor.new("Cyan")
    wall.Transparency = 0.7
    wall.CanCollide = true
    wall.Parent = Workspace
end

-- Create some decorative elements
local decorationPositions = {
    Vector3.new(200, 5, 200),
    Vector3.new(-200, 5, 200),
    Vector3.new(200, 5, -200),
    Vector3.new(-200, 5, -200)
}

for i, pos in pairs(decorationPositions) do
    -- Decorative trees/pillars
    local decoration = Instance.new("Part")
    decoration.Name = "Decoration" .. i
    decoration.Size = Vector3.new(5, 30, 5)
    decoration.Position = pos
    decoration.Anchored = true
    decoration.Material = Enum.Material.Wood
    decoration.BrickColor = BrickColor.new("Brown")
    decoration.Shape = Enum.PartType.Cylinder
    decoration.Parent = Workspace
    
    -- Top decoration
    local top = Instance.new("Part")
    top.Name = "DecorationTop"
    top.Size = Vector3.new(15, 5, 15)
    top.Position = pos + Vector3.new(0, 17, 0)
    top.Anchored = true
    top.Material = Enum.Material.Leaf
    top.BrickColor = BrickColor.new("Bright green")
    top.Shape = Enum.PartType.Ball
    top.Parent = decoration
end

-- Create plot area markers (these will be where player plots are generated)
for row = 1, 10 do
    for col = 1, 10 do
        local plotMarker = Instance.new("Part")
        plotMarker.Name = "PlotMarker_" .. ((row-1)*10 + col)
        plotMarker.Size = Vector3.new(50, 0.1, 50)
        plotMarker.Position = Vector3.new(
            -300 + (col * 60), 
            0.5, 
            -300 + (row * 60)
        )
        plotMarker.Anchored = true
        plotMarker.Material = Enum.Material.Neon
        plotMarker.BrickColor = BrickColor.new("Lime green")
        plotMarker.Transparency = 0.8
        plotMarker.CanCollide = false
        plotMarker.Parent = Workspace
    end
end

-- Add some ambient lighting effects
local ambientLight = Instance.new("PointLight")
ambientLight.Color = Color3.new(1, 1, 0.8)
ambientLight.Brightness = 1
ambientLight.Range = 100
ambientLight.Parent = plazaSign

print("Map setup complete! Created central plaza, spawn point, boundaries, and plot markers.")