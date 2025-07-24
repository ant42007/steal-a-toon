#!/bin/bash
# build.sh - Simple build script for Steal a Toon

echo "=== Steal a Toon Build Script ==="

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "Error: Please run this script from the repository root"
    exit 1
fi

# Create build directory
echo "Creating build directory..."
mkdir -p build

# Copy source files to build
echo "Copying source files..."
cp -r src/* build/ 2>/dev/null || echo "Source directory not found, skipping..."

# Check Lua syntax (if lua is available)
if command -v lua5.3 &> /dev/null || command -v lua &> /dev/null; then
    echo "Checking Lua syntax..."
    
    # Find all .lua files and check syntax
    find src -name "*.lua" 2>/dev/null | while read -r file; do
        if command -v lua5.3 &> /dev/null; then
            lua5.3 -p "$file" > /dev/null 2>&1
        else
            lua -p "$file" > /dev/null 2>&1
        fi
        
        if [ $? -eq 0 ]; then
            echo "✓ $file syntax OK"
        else
            echo "✗ $file syntax ERROR"
        fi
    done
else
    echo "Lua not found, skipping syntax check"
fi

# Create project structure documentation
echo "Creating project documentation..."
cat > build/PROJECT_STRUCTURE.md << 'EOF'
# Steal a Toon - Project Structure

## Overview
This is a Roblox game implementing an egg spawning, movement, and collection system.

## Directory Structure
```
src/
├── ServerScriptService/     - Server-side scripts
│   ├── EggSystem.lua       - Main egg spawning/movement system
│   ├── EggPlazaHandler.lua - Egg purchasing and plot management
│   ├── GameManager.lua     - Main game initialization
│   └── TestEggSystem.lua   - Test suite for egg system
├── StarterGui/             - Client-side UI scripts
│   └── ClientEggHandler.lua - Player UI and interaction handling
└── ReplicatedStorage/      - Shared resources
    └── Config.lua          - Game configuration settings
```

## Key Features
1. **Egg Spawning**: Random egg generation at predefined spawn points
2. **Egg Movement**: Eggs follow a predefined path across the map
3. **Egg Despawning**: Automatic removal when eggs reach the end
4. **Egg Plaza**: Central hub for purchasing eggs
5. **Plot System**: Players can place eggs on plots to hatch
6. **Interactive UI**: Client-side interface for game interactions

## Game Flow
1. Player visits Egg Plaza
2. Player purchases eggs with in-game currency
3. Eggs can be placed on plots to hatch into toons
4. Moving eggs can be collected by clicking on them
5. System continuously spawns new eggs that move across the map

EOF

echo "Build complete! Files are in the build/ directory"
echo "=== Build Summary ==="
echo "- Source files copied"
echo "- Syntax checked (if Lua available)"
echo "- Documentation generated"
echo "=== Build Complete ==="