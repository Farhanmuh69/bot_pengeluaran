#!/bin/bash

# Bot Pengeluaran - Auto Update Script for aaPanel
# Usage: ./update.sh

echo "🔄 Starting update process..."

# Navigate to project directory
cd /www/wwwroot/bot-pengeluaran || exit

# Pull latest code from git
echo "📥 Pulling latest code..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart bot-pengeluaran

# Show status
echo "✅ Update complete!"
echo ""
pm2 status bot-pengeluaran
