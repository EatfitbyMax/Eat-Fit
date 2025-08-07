
#!/bin/bash

# Script de déploiement des variables d'environnement
# Usage: ./scripts/deploy-env.sh

echo "🚀 Déploiement des variables d'environnement..."

# Copier le fichier .env vers le serveur
scp .env ubuntu@votre-serveur.com:/home/ubuntu/eatfitbymax/
scp server/.env ubuntu@votre-serveur.com:/home/ubuntu/eatfitbymax/server/

# Redémarrer le serveur
ssh ubuntu@votre-serveur.com "cd /home/ubuntu/eatfitbymax/server && pm2 restart eatfitbymax-server"

echo "✅ Variables d'environnement déployées avec succès!"
