
# Configuration du VPS Ubuntu pour EatFitByMax

## Prérequis sur le VPS

### 1. Installation de Node.js et npm
```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js (version LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

### 2. Installation de PM2 pour la gestion des processus
```bash
sudo npm install -g pm2

# Configurer PM2 pour démarrer au boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 3. Création du dossier de l'application
```bash
# Créer le dossier pour l'application
mkdir -p /home/ubuntu/eatfitbymax-server
cd /home/ubuntu/eatfitbymax-server

# Créer le dossier data pour la base de données JSON
mkdir -p data
chmod 755 data
```

### 4. Configuration du pare-feu
```bash
# Permettre le trafic sur le port 5000
sudo ufw allow 5000/tcp

# Vérifier le statut
sudo ufw status
```

### 5. Configuration SSH pour le déploiement automatique
```bash
# Sur votre machine locale, générer une clé SSH si nécessaire
ssh-keygen -t rsa -b 4096 -C "deployment@eatfitbymax"

# Copier la clé publique sur le VPS
ssh-copy-id ubuntu@51.178.29.220
```

## Structure des fichiers sur le VPS

```
/home/ubuntu/eatfitbymax-server/
├── server.js
├── package.json
├── .env
├── data/
│   ├── users.json
│   ├── programmes.json
│   └── ... (autres fichiers de données)
└── logs/
    ├── combined.log
    ├── error.log
    └── out.log
```

## Commandes de gestion sur le VPS

### Démarrer l'application
```bash
cd /home/ubuntu/eatfitbymax-server
pm2 start server.js --name "eatfitbymax-server" --env production
```

### Vérifier le statut
```bash
pm2 status
pm2 logs eatfitbymax-server
```

### Redémarrer l'application
```bash
pm2 restart eatfitbymax-server
```

### Sauvegarder la configuration PM2
```bash
pm2 save
```

## Variables d'environnement sur le VPS

Créer le fichier `.env` dans `/home/ubuntu/eatfitbymax-server/` :

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Stripe Production
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# JWT
JWT_SECRET=your_super_secure_jwt_secret_for_production

# CORS
ALLOWED_ORIGINS=*
```

## Surveillance et logs

### Voir les logs en temps réel
```bash
pm2 logs eatfitbymax-server --lines 100
```

### Monitoring de l'application
```bash
pm2 monit
```

### Redémarrage automatique en cas de crash
PM2 redémarre automatiquement l'application en cas de crash.

## Sauvegarde des données

### Script de sauvegarde quotidienne
```bash
#!/bin/bash
# /home/ubuntu/backup-data.sh

BACKUP_DIR="/home/ubuntu/backups"
APP_DATA_DIR="/home/ubuntu/eatfitbymax-server/data"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/eatfitbymax_data_$DATE.tar.gz -C $APP_DATA_DIR .

# Garder seulement les 7 dernières sauvegardes
find $BACKUP_DIR -name "eatfitbymax_data_*.tar.gz" -mtime +7 -delete
```

### Ajouter à crontab pour automatisation
```bash
crontab -e
# Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin
0 2 * * * /home/ubuntu/backup-data.sh
```
