
#!/bin/bash

# Configuration VPS
VPS_HOST="51.178.29.220"
VPS_USER="ubuntu"
VPS_PATH="/home/ubuntu/eatfitbymax"
VPS_PORT="5000"

echo "🚀 Déploiement vers VPS OVH..."

# 1. Créer l'archive du projet serveur
echo "📦 Création de l'archive..."
tar -czf server-deploy.tar.gz server/ package.json

# 2. Copier les fichiers vers le VPS
echo "📤 Upload vers le VPS..."
scp server-deploy.tar.gz $VPS_USER@$VPS_HOST:~/

# 3. Se connecter au VPS et déployer
echo "🔧 Déploiement sur le VPS..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
  # Arrêter l'ancienne instance PM2 si elle existe
  pm2 stop eatfitbymax-server 2>/dev/null || true
  pm2 delete eatfitbymax-server 2>/dev/null || true
  
  # Créer le dossier de l'application
  mkdir -p ~/eatfitbymax
  cd ~/eatfitbymax
  
  # Extraire l'archive
  tar -xzf ~/server-deploy.tar.gz
  
  # Installer les dépendances
  cd server
  npm install
  
  # Créer le fichier ecosystem.config.js pour PM2
  cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'eatfitbymax-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOFPM2
  
  # Démarrer avec PM2
  pm2 start ecosystem.config.js
  pm2 save
  
  # Nettoyer
  rm ~/server-deploy.tar.gz
  
  echo "✅ Déploiement terminé!"
  echo "📊 Status PM2:"
  pm2 status
EOF

echo "🎉 Déploiement terminé!"
echo "🌐 Votre serveur est accessible sur : http://51.178.29.220:5000"
