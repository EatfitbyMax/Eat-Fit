
#!/bin/bash

# Script de déploiement pour serveur VPS OVH
echo "🚀 Déploiement EatFitByMax sur VPS OVH..."

# Variables
VPS_HOST="51.178.29.220"
VPS_USER="ubuntu"
VPS_PATH="/home/ubuntu/eatfitbymax"

# Mise à jour du code depuis GitHub
echo "📥 Mise à jour depuis GitHub..."
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && git pull origin main"

# Installation des dépendances
echo "📦 Installation des dépendances..."
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH/server && npm install --production"

# Redémarrage du serveur avec PM2
echo "🔄 Redémarrage du serveur..."
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH/server && pm2 restart eatfitbymax-server || pm2 start ecosystem.config.js"

echo "✅ Déploiement terminé!"
