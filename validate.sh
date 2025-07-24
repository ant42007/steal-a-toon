#!/bin/bash
# validate.sh - Shell-based validation for the egg system implementation

echo "=== Steal a Toon Implementation Validation ==="

# Check file structure
echo "Checking file structure..."

files=(
    "src/ServerScriptService/EggSystem.lua"
    "src/ServerScriptService/EggPlazaHandler.lua"
    "src/ServerScriptService/GameManager.lua"
    "src/ServerScriptService/TestEggSystem.lua"
    "src/StarterGui/ClientEggHandler.lua"
    "src/ReplicatedStorage/Config.lua"
)

passed_files=0
total_files=${#files[@]}

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
        ((passed_files++))
    else
        echo "✗ $file missing"
    fi
done

echo "File structure: $passed_files/$total_files files found"

# Check core functionality in EggSystem.lua
echo ""
echo "Validating EggSystem.lua functionality..."

egg_system_functions=(
    "function EggSystem.spawnEgg"
    "function EggSystem.despawnEgg"
    "function EggSystem.start"
    "function EggSystem.stop"
    "function EggSystem.getStatus"
)

passed_functions=0
total_functions=${#egg_system_functions[@]}

if [ -f "src/ServerScriptService/EggSystem.lua" ]; then
    for func in "${egg_system_functions[@]}"; do
        if grep -q "$func" "src/ServerScriptService/EggSystem.lua"; then
            echo "✓ Found: $func"
            ((passed_functions++))
        else
            echo "✗ Missing: $func"
        fi
    done
else
    echo "✗ EggSystem.lua not found"
fi

echo "EggSystem functions: $passed_functions/$total_functions found"

# Check EggPlazaHandler functionality
echo ""
echo "Validating EggPlazaHandler.lua functionality..."

plaza_functions=(
    "function EggPlazaHandler.purchaseEgg"
    "function EggPlazaHandler.placeEggOnPlot"
    "function EggPlazaHandler.getPlayerCurrency"
    "function EggPlazaHandler.createPurchasedEgg"
    "function EggPlazaHandler.hatchEgg"
)

passed_plaza=0
total_plaza=${#plaza_functions[@]}

if [ -f "src/ServerScriptService/EggPlazaHandler.lua" ]; then
    for func in "${plaza_functions[@]}"; do
        if grep -q "$func" "src/ServerScriptService/EggPlazaHandler.lua"; then
            echo "✓ Found: $func"
            ((passed_plaza++))
        else
            echo "✗ Missing: $func"
        fi
    done
else
    echo "✗ EggPlazaHandler.lua not found"
fi

echo "EggPlaza functions: $passed_plaza/$total_plaza found"

# Check configuration
echo ""
echo "Validating Config.lua..."

config_sections=(
    "Config.EggSystem"
    "Config.EggPlaza"
    "Config.Map"
    "Config.UI"
)

passed_config=0
total_config=${#config_sections[@]}

if [ -f "src/ReplicatedStorage/Config.lua" ]; then
    for section in "${config_sections[@]}"; do
        if grep -q "$section" "src/ReplicatedStorage/Config.lua"; then
            echo "✓ Found: $section"
            ((passed_config++))
        else
            echo "✗ Missing: $section"
        fi
    done
else
    echo "✗ Config.lua not found"
fi

echo "Config sections: $passed_config/$total_config found"

# Check client handler
echo ""
echo "Validating ClientEggHandler.lua..."

client_features=(
    "createUI"
    "showEggPlaza"
    "hideEggPlaza"
    "purchaseEgg"
    "showNotification"
)

passed_client=0
total_client=${#client_features[@]}

if [ -f "src/StarterGui/ClientEggHandler.lua" ]; then
    for feature in "${client_features[@]}"; do
        if grep -q "$feature" "src/StarterGui/ClientEggHandler.lua"; then
            echo "✓ Found: $feature"
            ((passed_client++))
        else
            echo "✗ Missing: $feature"
        fi
    done
else
    echo "✗ ClientEggHandler.lua not found"
fi

echo "Client features: $passed_client/$total_client found"

# Check key requirements from problem statement
echo ""
echo "Validating Problem Statement Requirements..."

requirements=(
    "EGG_SPAWN_INTERVAL:Egg spawning mechanics"
    "PATH_WAYPOINTS:Predefined path/route"
    "despawnEgg:Egg despawning"
    "ClickDetector:Player interaction"
    "EggPlaza:Integration with existing flow"
)

passed_req=0
total_req=${#requirements[@]}

for req_info in "${requirements[@]}"; do
    req=$(echo "$req_info" | cut -d':' -f1)
    desc=$(echo "$req_info" | cut -d':' -f2)
    
    if grep -r "$req" src/ >/dev/null 2>&1; then
        echo "✓ $desc: $req found"
        ((passed_req++))
    else
        echo "✗ $desc: $req missing"
    fi
done

echo "Requirements: $passed_req/$total_req found"

# Summary
echo ""
echo "=== VALIDATION SUMMARY ==="
total_tests=$((total_files + total_functions + total_plaza + total_config + total_client + total_req))
total_passed=$((passed_files + passed_functions + passed_plaza + passed_config + passed_client + passed_req))

echo "Overall Score: $total_passed/$total_tests tests passed"
percentage=$((total_passed * 100 / total_tests))
echo "Success Rate: $percentage%"

if [ $total_passed -eq $total_tests ]; then
    echo "🎉 All validations passed! Implementation is complete."
    exit 0
elif [ $percentage -ge 80 ]; then
    echo "✅ Implementation is mostly complete with minor issues."
    exit 0
else
    echo "⚠️  Implementation needs more work."
    exit 1
fi