const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware de base
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '50mb' }));

// Logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Créer le dossier data s'il n'existe pas
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('📁 Répertoire data vérifié');
  } catch (error) {
    console.error('Erreur création répertoire data:', error);
  }
}

// Route de santé principale - optimisée pour les health checks
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Route de santé détaillée
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    message: 'Serveur EatFitByMax opérationnel',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Serveur EatFitByMax fonctionnel',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

app.get('/api/health-check', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Serveur Replit opérationnel',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Fonction utilitaire pour lire les fichiers JSON
async function readJsonFile(filename, defaultValue = {}) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    throw error;
  }
}

// Fonction utilitaire pour écrire les fichiers JSON
async function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Erreur écriture ${filename}:`, error);
    throw error;
  }
}

// Routes pour les utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    const users = await readJsonFile('users.json', []);
    res.json(users);
  } catch (error) {
    console.error('Erreur lecture utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    await writeJsonFile('users.json', req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde utilisateurs:', error);
    res.status(500).json({ error: 'Erreur sauvegarde utilisateurs' });
  }
});

// Routes pour les programmes
app.get('/api/programmes', async (req, res) => {
  try {
    const programmes = await readJsonFile('programmes.json', []);
    res.json(programmes);
  } catch (error) {
    console.error('Erreur lecture programmes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/programmes', async (req, res) => {
  try {
    await writeJsonFile('programmes.json', req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde programmes:', error);
    res.status(500).json({ error: 'Erreur sauvegarde programmes' });
  }
});

// Routes pour les messages par utilisateur
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await readJsonFile(`messages_${userId}.json`, []);
    res.json(messages);
  } catch (error) {
    console.error(`Erreur lecture messages utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await writeJsonFile(`messages_${userId}.json`, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde messages utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde messages' });
  }
});

// Routes pour les données de santé Apple Health
app.get('/api/health/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const healthData = await readJsonFile(`health_${userId}.json`, []);
    res.json(healthData);
  } catch (error) {
    console.error(`Erreur lecture données santé utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/health/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await writeJsonFile(`health_${userId}.json`, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde données santé utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données Apple Health' });
  }
});

// Routes pour les entraînements
app.get('/api/workouts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const workouts = await readJsonFile(`workouts_${userId}.json`, []);
    res.json(workouts);
  } catch (error) {
    console.error(`Erreur lecture entraînements utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/workouts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await writeJsonFile(`workouts_${userId}.json`, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde entraînements utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde entraînements' });
  }
});

// Routes pour les données Strava
app.get('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stravaData = await readJsonFile(`strava_${userId}.json`, []);
    res.json(stravaData);
  } catch (error) {
    console.error(`Erreur lecture données Strava utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await writeJsonFile(`strava_${userId}.json`, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde données Strava utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données Strava' });
  }
});

// Routes pour les données nutritionnelles
app.get('/api/nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const nutritionData = await readJsonFile(`nutrition_${userId}.json`, []);
    res.json(nutritionData);
  } catch (error) {
    console.error(`Erreur lecture nutrition utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await writeJsonFile(`nutrition_${userId}.json`, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde nutrition utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données nutrition' });
  }
});

// Routes pour les données de poids
app.get('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const defaultWeight = {
      startWeight: 0,
      currentWeight: 0,
      targetWeight: 0,
      lastWeightUpdate: null,
      targetAsked: false,
      weightHistory: []
    };
    const weightData = await readJsonFile(`weight_${userId}.json`, defaultWeight);
    res.json(weightData);
  } catch (error) {
    console.error(`Erreur lecture poids utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await writeJsonFile(`weight_${userId}.json`, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde poids utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données poids' });
  }
});

// Routes pour les profils utilisateur
app.get('/api/user-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = await readJsonFile(`user_profile_${userId}.json`, null);
    res.json(profileData);
  } catch (error) {
    console.error(`Erreur lecture profil utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/user-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await writeJsonFile(`user_profile_${userId}.json`, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde profil utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde profil utilisateur' });
  }
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
async function startServer() {
  try {
    await ensureDataDir();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur EatFitByMax démarré sur le port ${PORT}`);
      console.log(`🌐 API disponible sur: https://eatfitbymax.replit.app`);
      console.log(`✅ Serveur prêt à recevoir des connexions`);
      
      // Signal PM2 que l'application est prête
      if (process.send) {
        process.send('ready');
      }
    });
  } catch (error) {
    console.error('Erreur démarrage serveur:', error);
    process.exit(1);
  }
}

startServer();