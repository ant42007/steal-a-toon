-- TestEggSystem.lua
-- Test script to validate egg spawning, movement, and despawning functionality

local TestEggSystem = {}

-- Get services
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Get systems
local EggSystem = require(script.Parent.EggSystem)
local EggPlazaHandler = require(script.Parent.EggPlazaHandler)

-- Test state
local testResults = {}
local testsRunning = false

-- Helper function to create mock player
local function createMockPlayer()
    local mockPlayer = {
        Name = "TestPlayer",
        UserId = 12345,
        Character = nil
    }
    return mockPlayer
end

-- Test 1: Egg Spawning
local function testEggSpawning()
    print("Testing egg spawning...")
    
    local initialEggCount = #workspace:GetChildren()
    
    -- Spawn an egg
    local egg = EggSystem.spawnEgg()
    
    if egg and egg.Parent == workspace then
        testResults["EggSpawning"] = "PASS"
        print("✓ Egg spawning test passed")
    else
        testResults["EggSpawning"] = "FAIL"
        print("✗ Egg spawning test failed")
    end
    
    return egg
end

-- Test 2: Egg Movement
local function testEggMovement(egg)
    print("Testing egg movement...")
    
    if not egg then
        testResults["EggMovement"] = "FAIL - No egg provided"
        print("✗ Egg movement test failed - no egg")
        return
    end
    
    local initialPosition = egg.Position
    local testDuration = 2 -- seconds
    local startTime = tick()
    
    -- Wait for movement
    local connection
    connection = RunService.Heartbeat:Connect(function()
        if tick() - startTime > testDuration then
            connection:Disconnect()
            
            local finalPosition = egg.Position
            local distance = (finalPosition - initialPosition).Magnitude
            
            if distance > 1 then -- Egg should have moved
                testResults["EggMovement"] = "PASS"
                print("✓ Egg movement test passed - moved " .. distance .. " studs")
            else
                testResults["EggMovement"] = "FAIL"
                print("✗ Egg movement test failed - no movement detected")
            end
        end
    end)
end

-- Test 3: Egg Despawning
local function testEggDespawning()
    print("Testing egg despawning...")
    
    -- Spawn an egg
    local egg = EggSystem.spawnEgg()
    if not egg then
        testResults["EggDespawning"] = "FAIL - Could not spawn egg"
        print("✗ Egg despawning test failed - spawn failed")
        return
    end
    
    -- Manually despawn it
    EggSystem.despawnEgg(egg)
    
    -- Check if it's removed
    wait(0.1)
    if not egg.Parent then
        testResults["EggDespawning"] = "PASS"
        print("✓ Egg despawning test passed")
    else
        testResults["EggDespawning"] = "FAIL"
        print("✗ Egg despawning test failed - egg still exists")
    end
end

-- Test 4: System Start/Stop
local function testSystemStartStop()
    print("Testing system start/stop...")
    
    -- Test start
    EggSystem.start()
    local status = EggSystem.getStatus()
    
    if status.isRunning then
        print("✓ System start test passed")
    else
        testResults["SystemStartStop"] = "FAIL - Start failed"
        print("✗ System start test failed")
        return
    end
    
    -- Test stop
    EggSystem.stop()
    status = EggSystem.getStatus()
    
    if not status.isRunning then
        testResults["SystemStartStop"] = "PASS"
        print("✓ System start/stop test passed")
    else
        testResults["SystemStartStop"] = "FAIL - Stop failed"
        print("✗ System stop test failed")
    end
end

-- Test 5: Egg Plaza Purchase
local function testEggPlazaPurchase()
    print("Testing egg plaza purchase...")
    
    local mockPlayer = createMockPlayer()
    
    -- Initialize currency
    EggPlazaHandler.addCurrency(mockPlayer, 1000)
    local initialCurrency = EggPlazaHandler.getPlayerCurrency(mockPlayer)
    
    -- Purchase an egg
    local success = EggPlazaHandler.purchaseEgg(mockPlayer, "Common Egg")
    
    if success then
        local finalCurrency = EggPlazaHandler.getPlayerCurrency(mockPlayer)
        if finalCurrency < initialCurrency then
            testResults["EggPlazaPurchase"] = "PASS"
            print("✓ Egg plaza purchase test passed")
        else
            testResults["EggPlazaPurchase"] = "FAIL - Currency not deducted"
            print("✗ Egg plaza purchase test failed - currency issue")
        end
    else
        testResults["EggPlazaPurchase"] = "FAIL - Purchase failed"
        print("✗ Egg plaza purchase test failed")
    end
end

-- Test 6: Path Following
local function testPathFollowing()
    print("Testing path following...")
    
    local egg = EggSystem.spawnEgg()
    if not egg then
        testResults["PathFollowing"] = "FAIL - Could not spawn egg"
        print("✗ Path following test failed - spawn failed")
        return
    end
    
    local pathWaypoints = {
        Vector3.new(-50, 5, 0),
        Vector3.new(-25, 5, 0),
        Vector3.new(0, 5, 0),
        Vector3.new(25, 5, 0),
        Vector3.new(50, 5, 0)
    }
    
    local startTime = tick()
    local testDuration = 10 -- seconds
    local waypointsPassed = 0
    
    local connection
    connection = RunService.Heartbeat:Connect(function()
        if not egg.Parent then
            connection:Disconnect()
            return
        end
        
        local elapsed = tick() - startTime
        if elapsed > testDuration then
            connection:Disconnect()
            
            -- Check if egg reached multiple waypoints
            local currentPos = egg.Position
            for i, waypoint in ipairs(pathWaypoints) do
                if (currentPos - waypoint).Magnitude < 5 then
                    waypointsPassed = i
                end
            end
            
            if waypointsPassed >= 2 then
                testResults["PathFollowing"] = "PASS"
                print("✓ Path following test passed - reached waypoint " .. waypointsPassed)
            else
                testResults["PathFollowing"] = "FAIL"
                print("✗ Path following test failed - only reached waypoint " .. waypointsPassed)
            end
            
            -- Clean up
            EggSystem.despawnEgg(egg)
        end
    end)
end

-- Run all tests
function TestEggSystem.runAllTests()
    if testsRunning then
        print("Tests already running!")
        return
    end
    
    testsRunning = true
    testResults = {}
    
    print("=== Starting Egg System Tests ===")
    
    -- Run tests sequentially
    local egg = testEggSpawning()
    wait(1)
    
    if egg then
        testEggMovement(egg)
        wait(3)
        EggSystem.despawnEgg(egg) -- Clean up
    end
    
    wait(1)
    testEggDespawning()
    wait(1)
    testSystemStartStop()
    wait(1)
    testEggPlazaPurchase()
    wait(1)
    testPathFollowing()
    wait(11) -- Wait for path following to complete
    
    -- Print results
    print("=== Test Results ===")
    for testName, result in pairs(testResults) do
        print(testName .. ": " .. result)
    end
    
    -- Count passed/failed
    local passed = 0
    local failed = 0
    for _, result in pairs(testResults) do
        if string.find(result, "PASS") then
            passed = passed + 1
        else
            failed = failed + 1
        end
    end
    
    print("=== Summary ===")
    print("Passed: " .. passed)
    print("Failed: " .. failed)
    print("Total: " .. (passed + failed))
    
    testsRunning = false
    
    return testResults
end

-- Quick individual test functions
function TestEggSystem.testSpawning()
    return testEggSpawning()
end

function TestEggSystem.testMovement()
    local egg = testEggSpawning()
    if egg then
        testEggMovement(egg)
    end
end

function TestEggSystem.testDespawning()
    return testEggDespawning()
end

function TestEggSystem.getResults()
    return testResults
end

return TestEggSystem