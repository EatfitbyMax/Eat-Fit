
#!/bin/bash

echo "🧹 Nettoyage et déploiement propre vers VPS..."

VPS_HOST="51.178.29.220"
VPS_USER="ubuntu"

# 1. Créer l'archive du serveur
echo "📦 Création de l'archive..."
cd server
tar -czf ../server-clean.tar.gz .
cd ..

# 2. Copier vers le VPS
echo "📤 Upload vers le VPS..."
scp server-clean.tar.gz $VPS_USER@$VPS_HOST:~/

# 3. Installation propre sur le VPS
echo "🔧 Installation sur le VPS..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
  # Arrêter tous les processus PM2
  pm2 stop all 2>/dev/null || true
  pm2 delete all 2>/dev/null || true
  
  # Nettoyer complètement
  rm -rf ~/eatfitbymax
  
  # Créer le nouveau dossier
  mkdir -p ~/eatfitbymax
  cd ~/eatfitbymax
  
  # Extraire l'archive
  tar -xzf ~/server-clean.tar.gz
  
  # Installer Node.js et npm si nécessaire
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null || true
  sudo apt-get install -y nodejs 2>/dev/null || true
  
  # Installer PM2 globalement
  sudo npm install -g pm2 2>/dev/null || true
  
  # Installer les dépendances du projet
  npm install
  
  # Créer le fichier ecosystem pour PM2
  cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'eatfitbymax-api',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOFPM2
  
  # Créer le dossier logs
  mkdir -p logs
  
  # Démarrer avec PM2
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup
  
  # Nettoyer l'archive
  rm ~/server-clean.tar.gz
  
  echo "✅ Installation terminée!"
  echo "📊 Status PM2:"
  pm2 status
  echo "🌐 Test de connexion:"
  curl -s http://localhost:5000/api/health-check || echo "❌ Serveur non accessible"
EOF

echo "🎉 Déploiement terminé!"
echo "🔗 Votre serveur devrait être accessible sur : http://51.178.29.220:5000"

# Nettoyer localement
rm -f server-clean.tar.gz
