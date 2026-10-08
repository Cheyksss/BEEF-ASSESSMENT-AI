#!/bin/bash
# Frontend Installation Script
# Run this after installing Node.js

echo "🚀 Installing Beef Quality Assessment Frontend..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    
    # Create .env.local if it doesn't exist
    if [ ! -f .env.local ]; then
        echo "📝 Creating .env.local from template..."
        cp .env.local.example .env.local
        echo "⚠️  Please edit .env.local with your Supabase credentials"
    else
        echo "✅ .env.local already exists"
    fi
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env.local with your credentials"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Open http://localhost:3000 in your browser"
else
    echo ""
    echo "❌ Installation failed"
    echo "Please check the error messages above"
    exit 1
fi
