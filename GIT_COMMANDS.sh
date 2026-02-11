#!/bin/bash

# Rewind - GitHub Setup Script
# Run this after creating your GitHub repository

echo "🐙 Setting up GitHub for Rewind..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in Rewind directory"
    echo "Please cd to /Users/brennenstudenc/Desktop/Rewind/Rewind first"
    exit 1
fi

echo "📦 Current directory: $(pwd)"
echo ""

# Check git status
echo "📊 Checking git status..."
git status
echo ""

# Prompt for GitHub username and repo name
echo "🔗 GitHub Setup"
read -p "Enter your GitHub username: " github_username
read -p "Enter repository name (default: Rewind): " repo_name
repo_name=${repo_name:-Rewind}

echo ""
echo "📝 Repository URL will be:"
echo "https://github.com/$github_username/$repo_name.git"
echo ""

read -p "Continue? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "📦 Adding files to git..."
git add .

echo ""
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Complete Rewind app

- Polaroid-style camera UI with rainbow stripe
- Photo upload to Supabase storage
- Social feed with likes and comments
- User authentication and profiles
- Daily notification system
- Comprehensive documentation
- 2,000+ lines of TypeScript code"

echo ""
echo "🔗 Adding GitHub remote..."
git remote add origin "https://github.com/$github_username/$repo_name.git"

echo ""
echo "⬆️  Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Done! Your code is now on GitHub!"
echo ""
echo "🔗 View your repository at:"
echo "https://github.com/$github_username/$repo_name"
echo ""
echo "📝 Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Add topics: react-native, expo, typescript, supabase"
echo "3. Edit repository description"
echo "4. Consider adding a license (MIT recommended)"
echo ""
echo "🎉 Happy coding!"
