# 🐙 GitHub Setup Guide

## Quick GitHub Setup (5 minutes)

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in:
   - **Repository name:** `Rewind` (or `rewind-app`)
   - **Description:** "Polaroid-style BeReal clone - Capture nostalgic moments"
   - **Visibility:** Choose Public or Private
   - **⚠️ DO NOT** check "Initialize with README" (we already have one!)
   - **⚠️ DO NOT** add .gitignore or license (we have them!)
4. Click **"Create repository"**

### Step 2: Link Local Repo to GitHub

GitHub will show you commands. Use these:

```bash
# Make sure you're in the Rewind directory
cd /Users/brennenstudenc/Desktop/Rewind/Rewind

# Add all files to staging
git add .

# Commit everything
git commit -m "Initial commit: Complete Rewind app with Polaroid UI"

# Add your GitHub repo as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/Rewind.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify

1. Refresh your GitHub repository page
2. You should see all files uploaded!
3. Check that README.md displays nicely

## 🔐 Important: Protect Your Secrets

### What NOT to Commit

Your `.env` file is already in `.gitignore`, but double-check:

```bash
# Verify .env is ignored
git status

# .env should NOT appear in the list
# If it does, run:
git rm --cached .env
```

### Environment Variables on GitHub

For collaborators, create `.env.example`:

```bash
# This is already created, just verify:
cat .env.example

# Should show:
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 📝 Good Commit Messages

Use clear, descriptive messages:

```bash
# Good examples:
git commit -m "Add Polaroid frame component with rainbow stripe"
git commit -m "Implement photo upload to Supabase storage"
git commit -m "Fix camera permissions on iOS"

# Bad examples:
git commit -m "update"
git commit -m "fixed bug"
git commit -m "changes"
```

## 🌿 Branching Strategy

### For Solo Development

```bash
# Work directly on main (simplest)
git add .
git commit -m "Your message"
git push
```

### For Team Development

```bash
# Create feature branch
git checkout -b feature/dual-camera

# Make changes...
git add .
git commit -m "Add dual camera feature"

# Push branch
git push -u origin feature/dual-camera

# Create Pull Request on GitHub
# Merge after review
```

## 📋 Useful Git Commands

```bash
# Check status
git status

# See what changed
git diff

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git restore .

# Pull latest from GitHub
git pull

# Create new branch
git checkout -b branch-name

# Switch branches
git checkout main

# Delete branch
git branch -d branch-name
```

## 🚀 Workflow for Daily Development

```bash
# 1. Start your day
git pull                    # Get latest changes

# 2. Make changes
# ... edit files ...

# 3. Check what changed
git status
git diff

# 4. Stage and commit
git add .
git commit -m "Descriptive message"

# 5. Push to GitHub
git push

# Repeat steps 2-5 throughout the day
```

## 🔄 Syncing with GitHub

### First Time Setup (Already Done!)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### Regular Updates
```bash
# Add all changes
git add .

# Or add specific files
git add src/components/NewComponent.tsx

# Commit with message
git commit -m "Add new feature"

# Push to GitHub
git push
```

## 📊 What to Commit

### ✅ Always Commit
- Source code (`src/`, `app/`)
- Documentation (`.md` files)
- Configuration (`package.json`, `tsconfig.json`)
- Database schemas (`.sql` files)
- Assets (images, fonts)
- `.gitignore` file

### ❌ Never Commit
- `.env` (secrets!)
- `node_modules/` (too large)
- `.expo/` (generated files)
- `dist/`, `build/` (build artifacts)
- `.DS_Store` (Mac system files)
- Personal notes with API keys

## 🎯 GitHub Best Practices

### 1. Write Good README
✅ Already done! Your `README.md` is comprehensive.

### 2. Use .gitignore
✅ Already done! Prevents committing sensitive files.

### 3. Add Topics (on GitHub)
Add topics to your repo for discoverability:
- `react-native`
- `expo`
- `typescript`
- `supabase`
- `polaroid`
- `social-media`
- `ios`

### 4. Add License
Choose a license on GitHub (MIT is common for personal projects)

### 5. Enable Issues
Good for tracking bugs and feature requests

### 6. Add Repository Description
Short description that appears under repo name

## 🔒 Keeping Secrets Safe

### Double-Check .gitignore

Your `.gitignore` already includes:

```
# Environment variables
.env
.env*.local

# These are safe from being committed
```

### If You Accidentally Committed Secrets

```bash
# Remove from git but keep locally
git rm --cached .env

# Commit the removal
git commit -m "Remove .env from tracking"

# Push
git push

# ⚠️ IMPORTANT: Change your API keys!
# The old ones are now in git history
```

### Using GitHub Secrets (for CI/CD)

When you set up GitHub Actions:
1. Go to Settings → Secrets and variables → Actions
2. Add secrets:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 📱 Clone on Another Machine

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/Rewind.git

# Navigate into it
cd Rewind

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your Supabase credentials

# Start the app
npm start
```

## 🎉 Your First Push Checklist

- [ ] Create GitHub repository
- [ ] Copy the remote URL
- [ ] Add remote: `git remote add origin URL`
- [ ] Stage all files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Push: `git push -u origin main`
- [ ] Verify files on GitHub
- [ ] Check README displays correctly
- [ ] Confirm .env is NOT visible

## 💡 Pro Tips

1. **Commit often** - Small, focused commits are better
2. **Write clear messages** - Future you will thank you
3. **Pull before push** - Especially when collaborating
4. **Use branches** - For experimental features
5. **Review before commit** - Use `git diff` to check changes

## 🆘 Common Issues

### "Permission denied (publickey)"
Set up SSH keys or use HTTPS with token

### "Failed to push"
```bash
git pull --rebase
git push
```

### "Merge conflicts"
```bash
# Open conflicted files
# Resolve conflicts manually
git add .
git commit -m "Resolve merge conflicts"
git push
```

### "Large files rejected"
```bash
# Remove from git
git rm --cached large-file.mp4

# Add to .gitignore
echo "*.mp4" >> .gitignore

# Commit
git commit -m "Remove large files"
```

---

## 🚀 Quick Commands to Run Now

```bash
cd /Users/brennenstudenc/Desktop/Rewind/Rewind

# Add everything
git add .

# Commit with descriptive message
git commit -m "Initial commit: Complete Rewind app

- Polaroid-style camera UI with rainbow stripe
- Photo upload to Supabase storage
- Social feed with likes and comments
- User authentication and profiles
- Daily notification system
- Comprehensive documentation
- 2,000+ lines of TypeScript code"

# Add your GitHub remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/Rewind.git

# Push to GitHub
git push -u origin main
```

**Done! Your code is now safely backed up on GitHub! 🎉**
