-- GameConstants.lua
-- Shared constants used across client and server

local GameConstants = {}

-- Game Configuration
GameConstants.GAME_NAME = "Steal a Toon"
GameConstants.VERSION = "1.0.0"

-- Economy Constants
GameConstants.STARTING_COINS = 100
GameConstants.MAX_COINS = 999999999999

-- Plot Constants
GameConstants.MAX_PLOTS_PER_PLAYER = 10
GameConstants.BASE_PLOT_CAPACITY = 5
GameConstants.PLOT_SIZE = 50

-- Egg Constants
GameConstants.MIN_HATCH_TIME = 5 -- seconds
GameConstants.MAX_HATCH_TIME = 300 -- 5 minutes

-- Toon Constants
GameConstants.MAX_TOON_LEVEL = 100
GameConstants.BASE_TOON_VALUE = 1

-- Rebirth Constants
GameConstants.MAX_REBIRTHS = 10
GameConstants.REBIRTH_COIN_MULTIPLIER_BASE = 1.5

-- Stealing Constants
GameConstants.BASE_STEAL_COOLDOWN = 300 -- 5 minutes
GameConstants.BASE_STEAL_CHANCE = 0.3 -- 30%

-- UI Constants
GameConstants.UI_COLORS = {
    PRIMARY = Color3.new(0.2, 0.4, 0.8),
    SECONDARY = Color3.new(0.8, 0.8, 0.9),
    SUCCESS = Color3.new(0.2, 0.8, 0.2),
    WARNING = Color3.new(1, 0.8, 0.2),
    ERROR = Color3.new(1, 0.2, 0.2),
    COIN = Color3.new(1, 0.8, 0),
    REBIRTH = Color3.new(0.8, 0.2, 0.8)
}

-- Rarity Constants
GameConstants.RARITIES = {
    "Common",
    "Uncommon", 
    "Rare",
    "Epic",
    "Legendary",
    "Mythic",
    "Glitched"
}

GameConstants.RARITY_COLORS = {
    Common = Color3.new(0.7, 0.7, 0.7),
    Uncommon = Color3.new(0.2, 0.8, 0.2),
    Rare = Color3.new(0.2, 0.4, 1),
    Epic = Color3.new(0.8, 0.2, 0.8),
    Legendary = Color3.new(1, 0.8, 0.2),
    Mythic = Color3.new(1, 0.2, 0.2),
    Glitched = Color3.new(0.1, 0.1, 0.1)
}

-- Animation Constants
GameConstants.TWEEN_TIME = {
    FAST = 0.2,
    NORMAL = 0.3,
    SLOW = 0.5
}

-- Sound Constants
GameConstants.SOUNDS = {
    NOTIFICATION = "rbxasset://sounds/button.wav",
    SUCCESS = "rbxasset://sounds/electronicpingshort.wav",
    ERROR = "rbxasset://sounds/impact_water.mp3",
    COIN = "rbxasset://sounds/impact_water.mp3"
}

-- Utility Functions
function GameConstants.FormatNumber(number)
    if number < 1000 then
        return tostring(number)
    elseif number < 1000000 then
        return string.format("%.1fK", number / 1000)
    elseif number < 1000000000 then
        return string.format("%.1fM", number / 1000000)
    elseif number < 1000000000000 then
        return string.format("%.1fB", number / 1000000000)
    else
        return string.format("%.1fT", number / 1000000000000)
    end
end

function GameConstants.FormatTime(seconds)
    if seconds < 60 then
        return math.ceil(seconds) .. "s"
    elseif seconds < 3600 then
        local minutes = math.floor(seconds / 60)
        local remainingSeconds = seconds % 60
        return minutes .. "m " .. math.ceil(remainingSeconds) .. "s"
    else
        local hours = math.floor(seconds / 3600)
        local remainingMinutes = math.floor((seconds % 3600) / 60)
        return hours .. "h " .. remainingMinutes .. "m"
    end
end

function GameConstants.GetRarityColor(rarity)
    return GameConstants.RARITY_COLORS[rarity] or GameConstants.RARITY_COLORS.Common
end

function GameConstants.IsValidRarity(rarity)
    for _, validRarity in pairs(GameConstants.RARITIES) do
        if validRarity == rarity then
            return true
        end
    end
    return false
end

return GameConstants