#!/usr/bin/env bash
# MaGx World Super IPTV — push to GitHub
# Run this on your local machine after downloading the project.
set -e

REPO="git@github.com:uzzirulzz-cyber/xMag.git"
REPO_HTTPS="https://github.com/uzzirulzz-cyber/xMag.git"

echo "🚀 MaGx World Super IPTV — GitHub Push"
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ] || ! grep -q "MaGx" prisma/schema.prisma 2>/dev/null; then
  echo "❌ Run this from the project root (where package.json is)."
  exit 1
fi

# Try SSH first, fall back to HTTPS
if command -v ssh &>/dev/null && ssh -T git@github.com 2>&1 | grep -q "successfully authenticated\|You've successfully"; then
  echo "✅ SSH auth detected — using SSH remote"
  git remote set-url origin "$REPO" 2>/dev/null || git remote add origin "$REPO"
else
  echo "ℹ️  No SSH — using HTTPS. You'll need a GitHub Personal Access Token."
  echo "   Create one: https://github.com/settings/tokens/new?scopes=repo"
  git remote set-url origin "$REPO_HTTPS" 2>/dev/null || git remote add origin "$REPO_HTTPS"
fi

echo ""
echo "📦 Committing any uncommitted changes..."
git add -A
git diff --cached --quiet || git commit -m "MaGx World Super IPTV — full enterprise panel" --allow-empty

echo ""
echo "⬆️  Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your repo: https://github.com/uzzirulzz-cyber/xMag"
echo ""
echo "Next: Import to Vercel → https://vercel.com/new"
echo "See DEPLOY.md for the env var list."
