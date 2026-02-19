#!/bin/bash
set -e

cd /home/arya020595/Documents/work/lkm-sep

echo "Cleaning up existing git state..."
git rebase --abort 2>/dev/null || true
rm -rf .git .git.backup 2>/dev/null || true

echo "# st_lkm_sep" >> README.md

echo "Initializing git repository..."
git init

echo "Adding all files..."
git add .

echo "Creating initial commit..."
git commit -m "first commit"

echo "Renaming branch to main..."
git branch -M main

echo "Adding remote origin..."
git remote add origin git@github.com:arya020595/st_lkm_sep.git

echo "Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "Repository: https://github.com/arya020595/st_lkm_sep"
