
#!/bin/bash

# Script de déploiement des variables d'environnement
# Usage: ./scripts/deploy-env.sh

echo "🚀 Déploiement des variables d'environnement sur eatfitbymax.cloud..."

# Mettre à jour la clé secrète Strava directement sur le serveur
ssh ubuntu@eatfitbymax.cloud "cd /home/ubuntu/eatfitbymax/server && sed -i 's/votre_client_secret_strava/0a888961cf64a2294908224b07b222ccba150700/g' .env"

# Vérifier que la modification a été appliquée
ssh ubuntu@eatfitbymax.cloud "cd /home/ubuntu/eatfitbymax/server && grep STRAVA_CLIENT_SECRET .env"

# Redémarrer le serveur pour prendre en compte les nouvelles variables
ssh ubuntu@eatfitbymax.cloud "cd /home/ubuntu/eatfitbymax/server && pm2 restart eatfitbymax-server"

echo "✅ Clé secrète Strava déployée et serveur redémarré!"
