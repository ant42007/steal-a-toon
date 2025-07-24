-- AssetIntegration.lua
-- Framework for integrating "Steal a Brainrot" asset map and other external assets

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local Workspace = game:GetService("Workspace")

local AssetIntegration = {}
local integratedAssets = {}

-- Asset integration configuration
local ASSET_CONFIG = {
    -- Supported asset types
    SUPPORTED_TYPES = {
        "Model",
        "Script", 
        "LocalScript",
        "ModuleScript",
        "Folder",
        "Part",
        "MeshPart",
        "UnionOperation"
    },
    
    -- Integration modes
    INTEGRATION_MODES = {
        REPLACE = "replace",      -- Replace existing with asset
        MERGE = "merge",          -- Merge with existing
        OVERLAY = "overlay",      -- Add as overlay
        EXTEND = "extend"         -- Extend existing functionality
    },
    
    -- Asset validation rules
    VALIDATION = {
        maxSize = 1000000,        -- Max asset size in bytes
        allowedDomains = {
            "roblox.com",
            "rbxasset.com"
        },
        requiredTags = {
          "StealAToon",
          "Compatible"
        }
    }
}

function AssetIntegration:Init()
    print("AssetIntegration: Initializing framework...")
    
    -- Create asset storage locations
    self:SetupAssetStorage()
    
    -- Initialize asset scanning
    self:ScanForAssets()
    
    -- Set up asset loading system
    self:SetupAssetLoader()
    
    print("AssetIntegration: Framework ready for asset integration")
end

function AssetIntegration:SetupAssetStorage()
    -- Create dedicated storage for integrated assets
    local assetStorage = ServerStorage:FindFirstChild("IntegratedAssets")
    if not assetStorage then
        assetStorage = Instance.new("Folder")
        assetStorage.Name = "IntegratedAssets"
        assetStorage.Parent = ServerStorage
    end
    
    -- Create asset categories
    local categories = {"Maps", "Scripts", "Models", "Sounds", "Textures", "UI"}
    for _, category in pairs(categories) do
        local categoryFolder = assetStorage:FindFirstChild(category)
        if not categoryFolder then
            categoryFolder = Instance.new("Folder")
            categoryFolder.Name = category
            categoryFolder.Parent = assetStorage
        end
    end
    
    print("AssetIntegration: Asset storage structure created")
end

function AssetIntegration:ScanForAssets()
    -- Scan workspace for existing "Steal a Brainrot" assets
    local brainrotAssets = {}
    
    -- Look for assets with specific naming patterns
    local function scanObject(obj)
        if obj.Name:match("Brainrot") or obj.Name:match("brainrot") then
            table.insert(brainrotAssets, obj)
        end
        
        -- Check for specific tags
        local tags = obj:GetTags()
        for _, tag in pairs(tags) do
            if tag:match("Brainrot") or tag:match("StealABrainrot") then
                table.insert(brainrotAssets, obj)
                break
            end
        end
        
        -- Recursively scan children
        for _, child in pairs(obj:GetChildren()) do
            scanObject(child)
        end
    end
    
    scanObject(Workspace)
    scanObject(ReplicatedStorage)
    
    print("AssetIntegration: Found", #brainrotAssets, "potential Brainrot assets")
    
    -- Process found assets
    for _, asset in pairs(brainrotAssets) do
        self:ProcessFoundAsset(asset)
    end
end

function AssetIntegration:ProcessFoundAsset(asset)
    -- Validate and categorize the asset
    if not self:ValidateAsset(asset) then
        warn("AssetIntegration: Asset failed validation:", asset.Name)
        return
    end
    
    -- Determine asset category and integration method
    local category = self:CategorizeAsset(asset)
    local integrationMode = self:DetermineIntegrationMode(asset)
    
    -- Store asset information
    integratedAssets[asset.Name] = {
        object = asset,
        category = category,
        integrationMode = integrationMode,
        timestamp = tick(),
        validated = true
    }
    
    print("AssetIntegration: Processed asset:", asset.Name, "Category:", category, "Mode:", integrationMode)
end

function AssetIntegration:ValidateAsset(asset)
    -- Basic validation checks
    if not asset or not asset.Parent then
        return false
    end
    
    -- Check if asset type is supported
    local assetType = asset.ClassName
    local supported = false
    for _, supportedType in pairs(ASSET_CONFIG.SUPPORTED_TYPES) do
        if assetType == supportedType then
            supported = true
            break
        end
    end
    
    if not supported then
        warn("AssetIntegration: Unsupported asset type:", assetType)
        return false
    end
    
    -- Additional validation can be added here
    return true
end

function AssetIntegration:CategorizeAsset(asset)
    local assetType = asset.ClassName
    local assetName = asset.Name:lower()
    
    -- Categorize based on type and name patterns
    if assetType == "Script" or assetType == "LocalScript" or assetType == "ModuleScript" then
        return "Scripts"
    elseif assetType == "Model" or assetType == "MeshPart" or assetType == "UnionOperation" then
        if assetName:match("map") or assetName:match("terrain") then
            return "Maps"
        else
            return "Models"
        end
    elseif assetType == "Sound" then
        return "Sounds"
    elseif assetType == "Decal" or assetType == "Texture" then
        return "Textures"
    elseif assetName:match("gui") or assetName:match("ui") then
        return "UI"
    else
        return "Models" -- Default category
    end
end

function AssetIntegration:DetermineIntegrationMode(asset)
    local assetName = asset.Name:lower()
    
    -- Determine integration mode based on asset characteristics
    if assetName:match("replace") then
        return ASSET_CONFIG.INTEGRATION_MODES.REPLACE
    elseif assetName:match("overlay") then
        return ASSET_CONFIG.INTEGRATION_MODES.OVERLAY
    elseif assetName:match("extend") then
        return ASSET_CONFIG.INTEGRATION_MODES.EXTEND
    else
        return ASSET_CONFIG.INTEGRATION_MODES.MERGE -- Default mode
    end
end

function AssetIntegration:SetupAssetLoader()
    -- Create asset loading interface
    self.AssetLoader = {
        LoadAsset = function(assetName)
            return self:LoadAsset(assetName)
        end,
        
        IntegrateAsset = function(assetName, targetLocation)
            return self:IntegrateAsset(assetName, targetLocation)
        end,
        
        GetAssetInfo = function(assetName)
            return integratedAssets[assetName]
        end,
        
        ListAssets = function(category)
            return self:ListAssets(category)
        end
    }
end

function AssetIntegration:LoadAsset(assetName)
    local assetInfo = integratedAssets[assetName]
    if not assetInfo then
        warn("AssetIntegration: Asset not found:", assetName)
        return nil
    end
    
    print("AssetIntegration: Loading asset:", assetName)
    return assetInfo.object
end

function AssetIntegration:IntegrateAsset(assetName, targetLocation)
    local assetInfo = integratedAssets[assetName]
    if not assetInfo then
        warn("AssetIntegration: Asset not found for integration:", assetName)
        return false
    end
    
    local asset = assetInfo.object
    local integrationMode = assetInfo.integrationMode
    
    print("AssetIntegration: Integrating asset:", assetName, "to", targetLocation.Name, "Mode:", integrationMode)
    
    -- Perform integration based on mode
    if integrationMode == ASSET_CONFIG.INTEGRATION_MODES.REPLACE then
        return self:ReplaceAsset(asset, targetLocation)
    elseif integrationMode == ASSET_CONFIG.INTEGRATION_MODES.MERGE then
        return self:MergeAsset(asset, targetLocation)
    elseif integrationMode == ASSET_CONFIG.INTEGRATION_MODES.OVERLAY then
        return self:OverlayAsset(asset, targetLocation)
    elseif integrationMode == ASSET_CONFIG.INTEGRATION_MODES.EXTEND then
        return self:ExtendAsset(asset, targetLocation)
    end
    
    return false
end

function AssetIntegration:ReplaceAsset(asset, targetLocation)
    -- Replace existing asset with new one
    local existingAsset = targetLocation:FindFirstChild(asset.Name)
    if existingAsset then
        existingAsset:Destroy()
    end
    
    local newAsset = asset:Clone()
    newAsset.Parent = targetLocation
    
    print("AssetIntegration: Replaced asset:", asset.Name)
    return true
end

function AssetIntegration:MergeAsset(asset, targetLocation)
    -- Merge asset contents with existing
    local existingAsset = targetLocation:FindFirstChild(asset.Name)
    
    if existingAsset then
        -- Merge children
        for _, child in pairs(asset:GetChildren()) do
            local existingChild = existingAsset:FindFirstChild(child.Name)
            if not existingChild then
                local newChild = child:Clone()
                newChild.Parent = existingAsset
            end
        end
    else
        -- No existing asset, just clone
        local newAsset = asset:Clone()
        newAsset.Parent = targetLocation
    end
    
    print("AssetIntegration: Merged asset:", asset.Name)
    return true
end

function AssetIntegration:OverlayAsset(asset, targetLocation)
    -- Add asset as overlay without affecting existing content
    local overlayFolder = targetLocation:FindFirstChild("Overlays")
    if not overlayFolder then
        overlayFolder = Instance.new("Folder")
        overlayFolder.Name = "Overlays"
        overlayFolder.Parent = targetLocation
    end
    
    local newAsset = asset:Clone()
    newAsset.Parent = overlayFolder
    
    print("AssetIntegration: Added overlay asset:", asset.Name)
    return true
end

function AssetIntegration:ExtendAsset(asset, targetLocation)
    -- Extend existing functionality with new asset
    local extensionFolder = targetLocation:FindFirstChild("Extensions")
    if not extensionFolder then
        extensionFolder = Instance.new("Folder")
        extensionFolder.Name = "Extensions"
        extensionFolder.Parent = targetLocation
    end
    
    local newAsset = asset:Clone()
    newAsset.Parent = extensionFolder
    
    -- If it's a script, try to execute it in context
    if newAsset:IsA("ModuleScript") then
        -- Module scripts can be required by other systems
        print("AssetIntegration: Module available for requirement:", newAsset.Name)
    elseif newAsset:IsA("Script") then
        -- Server scripts will run automatically
        print("AssetIntegration: Server script will execute:", newAsset.Name)
    end
    
    print("AssetIntegration: Extended with asset:", asset.Name)
    return true
end

function AssetIntegration:ListAssets(category)
    local assetList = {}
    
    for assetName, assetInfo in pairs(integratedAssets) do
        if not category or assetInfo.category == category then
            table.insert(assetList, {
                name = assetName,
                category = assetInfo.category,
                integrationMode = assetInfo.integrationMode,
                timestamp = assetInfo.timestamp
            })
        end
    end
    
    return assetList
end

-- Integration helpers for specific "Steal a Brainrot" features
function AssetIntegration:IntegrateBrainrotMap()
    -- Look for Brainrot map assets and integrate them
    local mapAssets = self:ListAssets("Maps")
    
    for _, mapAsset in pairs(mapAssets) do
        if mapAsset.name:match("Brainrot") or mapAsset.name:match("brainrot") then
            print("AssetIntegration: Integrating Brainrot map:", mapAsset.name)
            
            -- Integrate with main workspace
            local success = self:IntegrateAsset(mapAsset.name, Workspace)
            if success then
                print("AssetIntegration: Successfully integrated Brainrot map")
                
                -- Notify other systems about map integration
                self:NotifyMapIntegration(mapAsset.name)
            end
        end
    end
end

function AssetIntegration:NotifyMapIntegration(mapName)
    -- Notify other game systems about map integration
    local PlotManager = require(script.Parent.PlotManager)
    local EggManager = require(script.Parent.EggManager)
    
    -- Allow systems to adapt to new map
    if PlotManager.OnMapIntegrated then
        PlotManager:OnMapIntegrated(mapName)
    end
    
    if EggManager.OnMapIntegrated then
        EggManager:OnMapIntegrated(mapName)
    end
end

function AssetIntegration:GetAssetLoader()
    return self.AssetLoader
end

return AssetIntegration