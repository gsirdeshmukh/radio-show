#!/bin/bash

# RADIO-LAB Project Setup Script
# This script sets up the Node.js environment and installs dependencies

set -e

echo "🎵 RADIO-LAB Project Setup"
echo "=========================="
echo ""

# Check if nvm is installed
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "✅ nvm found"
    source "$HOME/.nvm/nvm.sh"
    
    # Check if .nvmrc exists
    if [ -f ".nvmrc" ]; then
        NODE_VERSION=$(cat .nvmrc)
        echo "📌 Node version specified in .nvmrc: $NODE_VERSION"
        
        # Check if version is installed
        if nvm list | grep -q "$NODE_VERSION"; then
            echo "✅ Node $NODE_VERSION is already installed"
        else
            echo "📥 Installing Node $NODE_VERSION..."
            nvm install "$NODE_VERSION"
        fi
        
        echo "🔄 Switching to Node $NODE_VERSION..."
        nvm use "$NODE_VERSION"
    else
        echo "⚠️  No .nvmrc file found, using current Node version"
    fi
else
    echo "⚠️  nvm not found. Using system Node.js"
    echo "   To install nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
fi

echo ""
echo "📦 Node.js version:"
node --version
npm --version

echo ""
echo "📥 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  - Run 'npm run sync:ios' to sync with iOS platform"
echo "  - Run 'npm run ios' to open in Xcode"
echo ""
