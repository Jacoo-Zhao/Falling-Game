#!/bin/bash

# Falling Squares Game - Quick Deployment Script
# Falling Squares Game - Quick Deployment Script

echo "🎮 Preparing to deploy Falling Squares Game..."
echo "🎮 Preparing to deploy Falling Squares Game..."

# Check if git is already initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Falling Squares Game"
    echo "✅ Git repository initialized"
    
    echo ""
    echo "🔗 Please follow these steps to complete deployment:"
    echo "1. Create a new repository on GitHub"
    echo "2. Copy the repository URL"
    echo "3. Run the following commands:"
    echo ""
    echo "   git remote add origin YOUR_REPO_URL"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
    echo "4. Enable Pages in GitHub repository settings"
    echo "5. Select main branch as source"
    echo ""
else
    echo "📤 Pushing to GitHub..."
    git add .
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
    git push
    echo "✅ Code pushed to GitHub"
fi

echo ""
echo "🌐 Other deployment options:"
echo "• Netlify: Drag and drop folder to netlify.com"
echo "• Vercel: Connect GitHub repository to vercel.com"
echo "• Surge: Run 'npx surge' command"
echo ""
echo "🎯 After deployment, your game will be live in a few minutes!"
echo "🎮 Enjoy your Falling Squares Game!"

