-- EconomyManager.lua
-- Handles game economy, boosts, and monetization

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local DataManager = require(script.Parent.DataManager)

local EconomyManager = {}
local boostItems = {}
local premiumItems = {}

-- Boost definitions
local BOOST_ITEMS = {
    {
        id = "double_coins",
        name = "Double Coins",
        description = "2x coin generation for 30 minutes",
        duration = 1800, -- 30 minutes in seconds
        multiplier = 2,
        cost = 50, -- Robux
        type = "coin_multiplier"
    },
    {
        id = "triple_coins",
        name = "Triple Coins", 
        description = "3x coin generation for 1 hour",
        duration = 3600, -- 1 hour in seconds
        multiplier = 3,
        cost = 100, -- Robux
        type = "coin_multiplier"
    },
    {
        id = "fast_growth",
        name = "Fast Growth",
        description = "2x toon growth speed for 1 hour",
        duration = 3600,
        multiplier = 2,
        cost = 75, -- Robux
        type = "growth_speed"
    },
    {
        id = "steal_shield",
        name = "Steal Shield",
        description = "Protects your toons from being stolen for 24 hours",
        duration = 86400, -- 24 hours
        multiplier = 1,
        cost = 150, -- Robux
        type = "steal_protection"
    },
    {
        id = "mega_boost",
        name = "Mega Boost",
        description = "5x coins + 3x growth + steal shield for 2 hours",
        duration = 7200, -- 2 hours
        multiplier = 5,
        cost = 300, -- Robux
        type = "mega_boost"
    }
}

-- Premium cosmetic items
local PREMIUM_ITEMS = {
    {
        id = "rainbow_hat",
        name = "Rainbow Hat",
        description = "A shiny rainbow hat for your toons",
        cost = 75, -- Robux
        type = "cosmetic",
        category = "hat"
    },
    {
        id = "golden_aura",
        name = "Golden Aura",
        description = "Golden particle effects around your toons",
        cost = 125, -- Robux
        type = "cosmetic",
        category = "effect"
    },
    {
        id = "epic_announcer",
        name = "Epic Announcer Voice",
        description = "Epic voice announcements for your achievements",
        cost = 100, -- Robux
        type = "cosmetic",
        category = "voice"
    },
    {
        id = "vip_plot_theme",
        name = "VIP Plot Theme",
        description = "Exclusive VIP theme for your plots",
        cost = 200, -- Robux
        type = "cosmetic",
        category = "plot_theme"
    }
}

function EconomyManager:Init()
    print("EconomyManager: Initializing...")
    
    -- Initialize items
    for _, boost in pairs(BOOST_ITEMS) do
        boostItems[boost.id] = boost
    end
    
    for _, item in pairs(PREMIUM_ITEMS) do
        premiumItems[item.id] = item
    end
    
    -- Connect remote events
    local remotes = ReplicatedStorage:WaitForChild("Remotes", 5)
    if remotes then
        local buyBoostRemote = remotes:FindFirstChild("BuyBoost")
        if buyBoostRemote then
            buyBoostRemote.OnServerEvent:Connect(function(player, boostId)
                self:BuyBoost(player, boostId)
            end)
        end
        
        local buyPremiumItemRemote = remotes:FindFirstChild("BuyPremiumItem")
        if buyPremiumItemRemote then
            buyPremiumItemRemote.OnServerEvent:Connect(function(player, itemId)
                self:BuyPremiumItem(player, itemId)
            end)
        end
        
        local claimOfflineEarningsRemote = remotes:FindFirstChild("ClaimOfflineEarnings")
        if claimOfflineEarningsRemote then
            claimOfflineEarningsRemote.OnServerEvent:Connect(function(player)
                self:ClaimOfflineEarnings(player)
            end)
        end
    end
    
    -- Start boost management loop
    spawn(function()
        self:BoostManagementLoop()
    end)
    
    -- Handle marketplace purchases
    MarketplaceService.ProcessReceipt = function(receiptInfo)
        return self:ProcessReceipt(receiptInfo)
    end
end

function EconomyManager:BuyBoost(player, boostId)
    local boost = boostItems[boostId]
    if not boost then return false end
    
    -- In a real game, this would trigger a Robux purchase
    -- For demo purposes, we'll simulate the purchase
    print("EconomyManager: Simulating purchase of", boost.name, "for", player.Name)
    
    -- Apply the boost
    return self:ApplyBoost(player, boost)
end

function EconomyManager:ApplyBoost(player, boost)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return false end
    
    local currentTime = tick()
    
    -- Apply boost based on type
    if boost.type == "coin_multiplier" then
        playerData.boosts.coinMultiplier = boost.multiplier
        playerData.boosts.coinBoostExpiry = currentTime + boost.duration
        
    elseif boost.type == "growth_speed" then
        playerData.boosts.growthSpeed = boost.multiplier
        playerData.boosts.growthBoostExpiry = currentTime + boost.duration
        
    elseif boost.type == "steal_protection" then
        playerData.boosts.stealShield = currentTime + boost.duration
        
    elseif boost.type == "mega_boost" then
        playerData.boosts.coinMultiplier = boost.multiplier
        playerData.boosts.growthSpeed = 3
        playerData.boosts.stealShield = currentTime + boost.duration
        playerData.boosts.coinBoostExpiry = currentTime + boost.duration
        playerData.boosts.growthBoostExpiry = currentTime + boost.duration
    end
    
    -- Notify player
    self:NotifyPlayer(player, "🚀 " .. boost.name .. " activated!")
    
    -- Send boost update to client
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local boostUpdatedRemote = remotes:FindFirstChild("BoostUpdated")
        if boostUpdatedRemote then
            boostUpdatedRemote:FireClient(player, playerData.boosts)
        end
    end
    
    print("EconomyManager:", player.Name, "activated", boost.name)
    return true
end

function EconomyManager:BuyPremiumItem(player, itemId)
    local item = premiumItems[itemId]
    if not item then return false end
    
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return false end
    
    -- Check if player already owns the item
    if not playerData.cosmetics then
        playerData.cosmetics = {}
    end
    
    if playerData.cosmetics[itemId] then
        self:NotifyPlayer(player, "You already own this item!")
        return false
    end
    
    -- In a real game, this would trigger a Robux purchase
    -- For demo purposes, we'll simulate the purchase
    print("EconomyManager: Simulating purchase of", item.name, "for", player.Name)
    
    -- Grant the item
    playerData.cosmetics[itemId] = {
        owned = true,
        equipped = false,
        purchaseTime = tick()
    }
    
    self:NotifyPlayer(player, "✨ You purchased " .. item.name .. "!")
    
    print("EconomyManager:", player.Name, "purchased", item.name)
    return true
end

function EconomyManager:BoostManagementLoop()
    while true do
        local currentTime = tick()
        
        for _, player in pairs(Players:GetPlayers()) do
            local playerData = DataManager:GetPlayerData(player)
            if playerData and playerData.boosts then
                local boosts = playerData.boosts
                local updated = false
                
                -- Check coin multiplier expiry
                if boosts.coinBoostExpiry and currentTime >= boosts.coinBoostExpiry then
                    boosts.coinMultiplier = 1
                    boosts.coinBoostExpiry = nil
                    self:NotifyPlayer(player, "⏰ Coin boost expired!")
                    updated = true
                end
                
                -- Check growth speed expiry
                if boosts.growthBoostExpiry and currentTime >= boosts.growthBoostExpiry then
                    boosts.growthSpeed = 1
                    boosts.growthBoostExpiry = nil
                    self:NotifyPlayer(player, "⏰ Growth boost expired!")
                    updated = true
                end
                
                -- Check steal shield expiry
                if boosts.stealShield and currentTime >= boosts.stealShield then
                    boosts.stealShield = 0
                    self:NotifyPlayer(player, "⏰ Steal shield expired!")
                    updated = true
                end
                
                -- Send update to client if boosts changed
                if updated then
                    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
                    if remotes then
                        local boostUpdatedRemote = remotes:FindFirstChild("BoostUpdated")
                        if boostUpdatedRemote then
                            boostUpdatedRemote:FireClient(player, boosts)
                        end
                    end
                end
            end
        end
        
        wait(30) -- Check every 30 seconds
    end
end

function EconomyManager:CalculateOfflineEarnings(player)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return 0 end
    
    local currentTime = tick()
    local offlineTime = currentTime - (playerData.lastOnlineTime or currentTime)
    
    -- Cap offline time to 24 hours
    offlineTime = math.min(offlineTime, 86400)
    
    if offlineTime < 300 then return 0 end -- Must be offline for at least 5 minutes
    
    -- Calculate base offline earnings
    local baseEarningsPerSecond = self:CalculatePlayerIncomeRate(player)
    local offlineEarnings = math.floor(baseEarningsPerSecond * offlineTime * 0.1) -- 10% of online rate
    
    return offlineEarnings
end

function EconomyManager:CalculatePlayerIncomeRate(player)
    -- This would normally calculate based on all the player's toons
    -- For now, return a simple base rate
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return 0 end
    
    local baseRate = 1 * (playerData.rebirths + 1)
    return baseRate
end

function EconomyManager:ClaimOfflineEarnings(player)
    local offlineEarnings = self:CalculateOfflineEarnings(player)
    
    if offlineEarnings <= 0 then
        self:NotifyPlayer(player, "No offline earnings available!")
        return false
    end
    
    -- Grant offline earnings
    DataManager:ModifyPlayerCoins(player, offlineEarnings)
    
    -- Update last online time
    local playerData = DataManager:GetPlayerData(player)
    if playerData then
        playerData.lastOnlineTime = tick()
    end
    
    self:NotifyPlayer(player, "💰 Claimed " .. offlineEarnings .. " offline coins!")
    
    print("EconomyManager:", player.Name, "claimed", offlineEarnings, "offline coins")
    return true
end

function EconomyManager:ProcessReceipt(receiptInfo)
    -- Handle actual Robux purchases
    local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if not player then
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end
    
    -- Find the purchased item
    local productId = receiptInfo.ProductId
    local purchasedItem = nil
    
    for _, boost in pairs(boostItems) do
        if boost.productId == productId then
            purchasedItem = boost
            break
        end
    end
    
    if not purchasedItem then
        for _, item in pairs(premiumItems) do
            if item.productId == productId then
                purchasedItem = item
                break
            end
        end
    end
    
    if not purchasedItem then
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end
    
    -- Process the purchase
    local success = false
    if purchasedItem.type == "coin_multiplier" or purchasedItem.type == "growth_speed" or 
       purchasedItem.type == "steal_protection" or purchasedItem.type == "mega_boost" then
        success = self:ApplyBoost(player, purchasedItem)
    else
        success = self:BuyPremiumItem(player, purchasedItem.id)
    end
    
    if success then
        return Enum.ProductPurchaseDecision.PurchaseGranted
    else
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end
end

function EconomyManager:GetBoostItems()
    return boostItems
end

function EconomyManager:GetPremiumItems()
    return premiumItems
end

function EconomyManager:GetPlayerBoosts(player)
    local playerData = DataManager:GetPlayerData(player)
    if not playerData then return {} end
    
    return playerData.boosts or {}
end

function EconomyManager:NotifyPlayer(player, message)
    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    if remotes then
        local notificationRemote = remotes:FindFirstChild("Notification")
        if notificationRemote then
            notificationRemote:FireClient(player, message)
        end
    end
end

-- Player connection handlers
function EconomyManager:OnPlayerAdded(player)
    -- Set last online time when player joins
    local playerData = DataManager:GetPlayerData(player)
    if playerData then
        playerData.lastOnlineTime = tick()
    end
end

function EconomyManager:OnPlayerRemoving(player)
    -- Update last online time when player leaves
    local playerData = DataManager:GetPlayerData(player)
    if playerData then
        playerData.lastOnlineTime = tick()
    end
end

return EconomyManager