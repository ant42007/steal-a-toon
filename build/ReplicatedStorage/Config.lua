-- Config.lua
-- Configuration settings for the Steal a Toon game

local Config = {}

-- Egg System Configuration
Config.EggSystem = {
    SPAWN_INTERVAL = 3, -- seconds between egg spawns
    MOVE_SPEED = 10, -- studs per second
    MAX_EGGS_ON_MAP = 5, -- maximum concurrent eggs
    SPAWN_POSITIONS = {
        Vector3.new(-50, 5, 0),
        Vector3.new(-50, 5, 10),
        Vector3.new(-50, 5, -10)
    },
    PATH_WAYPOINTS = {
        Vector3.new(-50, 5, 0),
        Vector3.new(-25, 5, 0),
        Vector3.new(0, 5, 0),
        Vector3.new(25, 5, 0),
        Vector3.new(50, 5, 0)
    }
}

-- Egg Plaza Configuration
Config.EggPlaza = {
    CATALOG = {
        {name = "Common Egg", cost = 100, rarity = "Common", color = BrickColor.new("White")},
        {name = "Rare Egg", cost = 500, rarity = "Rare", color = BrickColor.new("Bright blue")},
        {name = "Epic Egg", cost = 1500, rarity = "Epic", color = BrickColor.new("Bright violet")},
        {name = "Legendary Egg", cost = 5000, rarity = "Legendary", color = BrickColor.new("Bright orange")}
    },
    STARTING_CURRENCY = 1000,
    HATCH_TIME = 30 -- seconds
}

-- Map Configuration
Config.Map = {
    BASEPLATE_SIZE = Vector3.new(200, 1, 200),
    PLAZA_SIZE = Vector3.new(20, 1, 20),
    PLAZA_POSITION = Vector3.new(-60, 1, 0),
    PLOT_SIZE = Vector3.new(10, 0.5, 10),
    PLOT_COUNT = 5,
    PLOT_SPACING = 15
}

-- UI Configuration
Config.UI = {
    NOTIFICATION_DURATION = 3,
    PLAZA_INTERACTION_RANGE = 15
}

return Config