// Charger les variables d'environnement en premier
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const CLIENT_DIR = path.join(DATA_DIR, 'Client');
const COACH_DIR = path.join(DATA_DIR, 'Coach');

// Configuration Strava avec les variables d'environnement
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '159394';
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || '0a8889616f64a229949082240702228cba150700';

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

// Créer les dossiers s'ils n'existent pas
async function ensureDataDirs() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(CLIENT_DIR, { recursive: true });
    await fs.mkdir(COACH_DIR, { recursive: true });
    console.log('📁 Répertoires data/Client et data/Coach vérifiés');
  } catch (error) {
    console.error('Erreur création répertoires:', error);
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

// Endpoints pour les intégrations
app.get('/api/integrations/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const defaultIntegrations = {
      appleHealth: {
        connected: false,
        permissions: [],
        lastSync: null
      },
      strava: {
        connected: false,
        lastSync: null,
        athleteId: null
      }
    };

    console.log(`📱 Statuts intégrations demandés pour utilisateur: ${userId}`);
    res.json(defaultIntegrations);
  } catch (error) {
    console.error('❌ Erreur récupération intégrations:', error);
    res.status(500).json({ error: 'Erreur serveur intégrations' });
  }
});

app.post('/api/integrations/:userId', (req, res) => {
  const { userId } = req.params;
  const integrationStatus = req.body;

  try {
    console.log(`💾 Sauvegarde intégrations pour utilisateur ${userId}:`, integrationStatus);
    res.json({ success: true, message: 'Intégrations sauvegardées' });
  } catch (error) {
    console.error('❌ Erreur sauvegarde intégrations:', error);
    res.status(500).json({ error: 'Erreur serveur sauvegarde intégrations' });
  }
});

app.get('/api/health-check', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Serveur VPS EatFitByMax opérationnel',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Fonctions helper pour la gestion des fichiers JSON
async function readJsonFile(fileName, defaultValue = {}) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    throw error;
  }
}

async function writeJsonFile(fileName, data) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Erreur écriture fichier ${fileName}:`, error);
    throw error;
  }
}

async function deleteJsonFile(fileName) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true; // Fichier déjà supprimé
    }
    throw error;
  }
}

// Fonction pour lire le fichier utilisateur (client ou coach)
async function readUserFile(userId, userType = 'client') {
  try {
    const userDir = userType === 'coach' ? COACH_DIR : CLIENT_DIR;
    const filePath = path.join(userDir, `${userId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Utilisateur non trouvé
    }
    throw error;
  }
}

// Fonction pour rechercher un utilisateur par ID (plus robuste)
async function findUserById(userId) {
  console.log('🔍 [SEARCH_USER] Recherche utilisateur ID:', userId);

  // Essayer client d'abord
  try {
    const userData = await readUserFile(userId, 'client');
    if (userData) {
      console.log('✅ [SEARCH_USER] Trouvé dans Client/');
      return { userData, userType: 'client' };
    }
  } catch (error) {
    console.log('⚠️ [SEARCH_USER] Erreur lecture Client/', error.message);
  }

  // Essayer coach ensuite
  try {
    const userData = await readUserFile(userId, 'coach');
    if (userData) {
      console.log('✅ [SEARCH_USER] Trouvé dans Coach/');
      return { userData, userType: 'coach' };
    }
  } catch (error) {
    console.log('⚠️ [SEARCH_USER] Erreur lecture Coach/', error.message);
  }

  // Recherche exhaustive si pas trouvé
  console.log('🔍 [SEARCH_USER] Recherche exhaustive dans tous les fichiers...');

  for (const userType of ['client', 'coach']) {
    try {
      const userDir = userType === 'coach' ? COACH_DIR : CLIENT_DIR;
      const files = await fs.readdir(userDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(userDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            const userData = JSON.parse(data);

            // Vérifier correspondance ID
            if (userData.id && userData.id.toString() === userId.toString()) {
              console.log(`✅ [SEARCH_USER] Trouvé par correspondance ID dans ${userType}/${file}`);
              return { userData, userType };
            }
          } catch (fileError) {
            console.log(`⚠️ [SEARCH_USER] Erreur lecture ${file}:`, fileError.message);
          }
        }
      }
    } catch (dirError) {
      console.log(`⚠️ [SEARCH_USER] Erreur lecture dossier ${userType}:`, dirError.message);
    }
  }

  console.log('❌ [SEARCH_USER] Utilisateur non trouvé nulle part');
  return null;
}

// Fonction pour écrire le fichier utilisateur
async function writeUserFile(userId, userData, userType = 'client') {
  try {
    const userDir = userType === 'coach' ? COACH_DIR : CLIENT_DIR;
    const filePath = path.join(userDir, `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
    return true;
  } catch (error) {
    console.error(`Erreur écriture utilisateur ${userId}:`, error);
    throw error;
  }
}

// Fonction pour lister tous les utilisateurs d'un type
async function getAllUsers(userType = 'client') {
  try {
    const userDir = userType === 'coach' ? COACH_DIR : CLIENT_DIR;
    const files = await fs.readdir(userDir);
    const users = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const userId = file.replace('.json', '');
        const userData = await readUserFile(userId, userType);
        if (userData) {
          users.push(userData);
        }
      }
    }

    return users;
  } catch (error) {
    console.error(`Erreur lecture utilisateurs ${userType}:`, error);
    return [];
  }
}

// Routes pour les utilisateurs (clients)
app.get('/api/users', async (req, res) => {
  try {
    const clients = await getAllUsers('client');
    console.log(`📊 Récupération clients: ${clients.length} clients trouvés`);
    res.json(clients);
  } catch (error) {
    console.error('Erreur lecture clients:', error);
    res.json([]);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const clients = Array.isArray(req.body) ? req.body : [req.body];

    for (const client of clients) {
      if (client.id && (client.userType === 'client' || !client.userType)) {
        await writeUserFile(client.id, client, 'client');
      }
    }

    console.log('💾 Sauvegarde clients:', clients.length);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde clients:', error);
    res.status(500).json({ error: 'Erreur sauvegarde clients' });
  }
});

// Routes pour les coaches
app.get('/api/coaches', async (req, res) => {
  try {
    const coaches = await getAllUsers('coach');
    console.log(`👨‍💼 Récupération coaches: ${coaches.length} coaches trouvés`);
    res.json(coaches);
  } catch (error) {
    console.error('Erreur lecture coaches:', error);
    res.json([]);
  }
});

app.post('/api/coaches', async (req, res) => {
  try {
    const coaches = Array.isArray(req.body) ? req.body : [req.body];

    for (const coach of coaches) {
      if (coach.id) {
        await writeUserFile(coach.id, coach, 'coach');
      }
    }

    console.log('💾 Sauvegarde coaches:', coaches.length);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde coaches:', error);
    res.status(500).json({ error: 'Erreur sauvegarde coaches' });
  }
});

// Route universelle pour récupérer les données d'un utilisateur
app.get('/api/user-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Chercher d'abord dans les clients
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    // Si pas trouvé, chercher dans les coaches
    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    console.log(`📊 Données utilisateur récupérées: ${userId} (${userType})`);
    res.json(userData);
  } catch (error) {
    console.error(`Erreur récupération utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route universelle pour sauvegarder les données d'un utilisateur
app.post('/api/user-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;

    // Déterminer le type d'utilisateur
    const userType = userData.userType === 'coach' ? 'coach' : 'client';

    // S'assurer que l'ID correspond
    userData.id = userId;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);

    console.log(`💾 Données utilisateur sauvegardées: ${userId} (${userType})`);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données utilisateur' });
  }
});

// Route universelle pour supprimer un utilisateur
app.delete('/api/user-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Chercher dans les clients d'abord
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    // Si pas trouvé, chercher dans les coaches
    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Supprimer le fichier utilisateur
    const userDir = userType === 'coach' ? COACH_DIR : CLIENT_DIR;
    const filePath = path.join(userDir, `${userId}.json`);

    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Fichier utilisateur supprimé: ${filePath}`);
    } catch (unlinkError) {
      if (unlinkError.code !== 'ENOENT') {
        throw unlinkError;
      }
    }

    console.log(`✅ Utilisateur supprimé définitivement: ${userId} (${userType})`);
    res.json({ success: true, message: 'Utilisateur supprimé définitivement' });
  } catch (error) {
    console.error(`❌ Erreur suppression utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur suppression utilisateur' });
  }
});

// Routes spécifiques pour les différents types de données (compatibilité)
app.get('/api/nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const nutritionData = userData?.nutrition || [];
    res.json(nutritionData);
  } catch (error) {
    console.error(`Erreur lecture nutrition utilisateur ${req.params.userId}:`, error);
    res.json([]);
  }
});

app.post('/api/nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    userData.nutrition = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde nutrition utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données nutrition' });
  }
});

app.get('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const defaultWeight = {
      startWeight: 0,
      currentWeight: 0,
      targetWeight: 0,
      lastWeightUpdate: null,
      targetAsked: false,
      weightHistory: []
    };

    const weightData = userData?.weight || defaultWeight;
    res.json(weightData);
  } catch (error) {
    console.error(`Erreur lecture poids utilisateur ${req.params.userId}:`, error);
    res.json({
      startWeight: 0,
      currentWeight: 0,
      targetWeight: 0,
      lastWeightUpdate: null,
      targetAsked: false,
      weightHistory: []
    });
  }
});

app.post('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    userData.weight = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde poids utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données poids' });
  }
});

app.get('/api/workouts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const workouts = userData?.workouts || [];
    res.json(workouts);
  } catch (error) {
    console.error(`Erreur lecture entraînements utilisateur ${req.params.userId}:`, error);
    res.json([]);
  }
});

app.post('/api/workouts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    userData.workouts = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde entraînements utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde entraînements' });
  }
});

app.get('/api/health/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const healthData = userData?.health || [];
    res.json(healthData);
  } catch (error) {
    console.error(`Erreur lecture données santé utilisateur ${req.params.userId}:`, error);
    res.json([]);
  }
});

app.post('/api/health/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    userData.health = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde données santé utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données Apple Health' });
  }
});

app.get('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const stravaData = userData?.strava || [];
    res.json(stravaData);
  } catch (error) {
    console.error(`Erreur lecture données Strava utilisateur ${req.params.userId}:`, error);
    res.json([]);
  }
});

app.post('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    userData.strava = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde données Strava utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données Strava' });
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const messages = userData?.messages || [];
    res.json(messages);
  } catch (error) {
    console.error(`Erreur lecture messages utilisateur ${req.params.userId}:`, error);
    res.json([]);
  }
});

// Routes pour les notes RPE des activités
app.get('/api/activity-ratings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const activityRatings = userData?.activityRatings || {};
    res.json(activityRatings);
  } catch (error) {
    console.error(`Erreur lecture notes RPE utilisateur ${req.params.userId}:`, error);
    res.json({});
  }
});

app.post('/api/activity-ratings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    userData.activityRatings = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde notes RPE utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde notes RPE' });
  }
});

app.post('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    userData.messages = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde messages utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde messages' });
  }
});

// Routes pour les notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const defaultSettings = {
      pushNotifications: true,
      mealReminders: true,
      workoutReminders: true,
      progressUpdates: true,
      coachMessages: true,
      weeklyReports: true,
      soundEnabled: true,
      vibrationEnabled: true,
    };

    const notificationSettings = userData?.notificationSettings || defaultSettings;
    res.json(notificationSettings);
  } catch (error) {
    console.error('Erreur récupération paramètres notifications:', error);
    res.json({
      pushNotifications: true,
      mealReminders: true,
      workoutReminders: true,
      progressUpdates: true,
      coachMessages: true,
      weeklyReports: true,
      soundEnabled: true,
      vibrationEnabled: true,
    });
  }
});

app.post('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;

    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    userData.notificationSettings = settings;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);

    console.log(`✅ Paramètres notifications sauvegardés pour ${userId}`);
    res.json({ success: true, message: 'Paramètres notifications sauvegardés' });
  } catch (error) {
    console.error('Erreur sauvegarde paramètres notifications:', error);
    res.status(500).json({ error: 'Erreur sauvegarde paramètres notifications' });
  }
});

// Routes pour les programmes (fichier global)
app.get('/api/programmes', async (req, res) => {
  try {
    const programmesPath = path.join(DATA_DIR, 'programmes.json');
    const data = await fs.readFile(programmesPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      console.error('Erreur lecture programmes:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/programmes', async (req, res) => {
  try {
    const programmesPath = path.join(DATA_DIR, 'programmes.json');
    await fs.writeFile(programmesPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde programmes:', error);
    res.status(500).json({ error: 'Erreur sauvegarde programmes' });
  }
});

// Routes d'intégrations Strava avec les vraies valeurs
app.post('/api/strava/exchange-token', async (req, res) => {
  try {
    const { code, userId } = req.body;

    // 🔍 DIAGNOSTIC COMPLET DES PARAMÈTRES REÇUS
    console.log('🔍 [STRAVA_EXCHANGE] === DIAGNOSTIC DÉMARRÉ ===');
    console.log('   - Timestamp:', new Date().toISOString());
    console.log('   - Headers reçus:', JSON.stringify(req.headers, null, 2));
    console.log('   - Body complet:', JSON.stringify(req.body, null, 2));
    console.log('   - Method:', req.method);
    console.log('   - URL:', req.url);
    console.log('   - IP Client:', req.ip || req.connection.remoteAddress);

    if (!code || !userId) {
      console.error('❌ [STRAVA_EXCHANGE] Paramètres manquants:', { 
        code: !!code, 
        userId: !!userId,
        codeValue: code,
        userIdValue: userId,
        bodyKeys: Object.keys(req.body),
        bodyValues: req.body
      });
      return res.status(400).json({ error: 'Code et userId requis' });
    }

    console.log('🔄 [STRAVA_EXCHANGE] Début échange token pour utilisateur:', userId);
    console.log('🔧 [STRAVA_EXCHANGE] Configuration utilisée:');
    console.log('   - Client ID:', STRAVA_CLIENT_ID);
    console.log('   - Client ID type:', typeof STRAVA_CLIENT_ID);
    console.log('   - Client Secret présent:', !!STRAVA_CLIENT_SECRET);
    console.log('   - Client Secret type:', typeof STRAVA_CLIENT_SECRET);
    console.log('   - Client Secret longueur:', STRAVA_CLIENT_SECRET ? STRAVA_CLIENT_SECRET.length : 0);
    console.log('   - Code reçu (10 premiers chars):', code.substring(0, 10) + '...');
    console.log('   - Code complet longueur:', code.length);
    console.log('   - Variables env chargées:', {
      hasStravaClientId: !!process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID,
      hasStravaClientSecret: !!process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET
    });

    // Vérifier la correspondance exacte avec la config Strava
    const expectedClientId = '159394';
    const expectedClientSecret = '0a8889616f64a229949082240702228cba150700';

    console.log('🔍 [STRAVA_EXCHANGE] Vérification configuration:');
    console.log('   - Client ID correspond:', STRAVA_CLIENT_ID === expectedClientId);
    console.log('   - Client Secret correspond:', STRAVA_CLIENT_SECRET === expectedClientSecret);

    if (STRAVA_CLIENT_ID !== expectedClientId) {
      console.error('❌ [STRAVA_EXCHANGE] ERREUR: Client ID ne correspond pas!');
      console.error('   - Attendu:', expectedClientId);
      console.error('   - Reçu:', STRAVA_CLIENT_ID);
    }

    if (STRAVA_CLIENT_SECRET !== expectedClientSecret) {
      console.error('❌ [STRAVA_EXCHANGE] ERREUR: Client Secret ne correspond pas!');
      console.error('   - Attendu (10 premiers chars):', expectedClientSecret.substring(0, 10) + '...');
      console.error('   - Reçu (10 premiers chars):', STRAVA_CLIENT_SECRET ? STRAVA_CLIENT_SECRET.substring(0, 10) + '...' : 'UNDEFINED');
    }

    // Vérifier que le redirect_uri correspond exactement à la config Strava
    const redirectUri = 'https://eatfitbymax.cloud/strava-callback';
    console.log('🔍 [STRAVA_EXCHANGE] Redirect URI utilisé:', redirectUri);

    // Préparer la requête vers Strava
    const requestData = {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    };

    console.log('🔍 [STRAVA_EXCHANGE] === VÉRIFICATION REDIRECT_URI ===');
    console.log('   - Redirect URI dans l\'app:', 'https://eatfitbymax.cloud/strava-callback');
    console.log('   - Client ID dans requête:', STRAVA_CLIENT_ID);
    console.log('   - Grant type:', 'authorization_code');

    console.log('📤 [STRAVA_EXCHANGE] Envoi requête vers Strava OAuth...');
    console.log('   - URL:', 'https://www.strava.com/oauth/token');
    console.log('   - Données envoyées:', {
      client_id: requestData.client_id,
      client_secret: requestData.client_secret ? '[MASQUÉ]' : 'MANQUANT',
      code: requestData.code ? requestData.code.substring(0, 10) + '...' : 'MANQUANT',
      grant_type: requestData.grant_type
    });

    // Échanger le code contre un token d'accès
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    console.log('📥 [STRAVA_EXCHANGE] Réponse Strava reçue:');
    console.log('   - Status:', tokenResponse.status, tokenResponse.statusText);
    console.log('   - Headers:', Object.fromEntries(tokenResponse.headers.entries()));

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [STRAVA_EXCHANGE] Erreur Strava OAuth:');
      console.error('   - Status:', tokenResponse.status);
      console.error('   - Status Text:', tokenResponse.statusText);
      console.error('   - Error Response:', errorText);

      // Essayer de parser le JSON d'erreur si possible
      try {
        const errorJson = JSON.parse(errorText);
        console.error('   - Error Details (JSON):', JSON.stringify(errorJson, null, 2));
      } catch (parseError) {
        console.error('   - Error Response (Raw):', errorText);
      }

      throw new Error('Erreur lors de l\'authentification Strava: ' + errorText);
    }

    const tokenData = await tokenResponse.json();

    console.log('✅ [STRAVA_EXCHANGE] Token reçu avec succès:');
    console.log('   - Access Token présent:', !!tokenData.access_token);
    console.log('   - Access Token (10 premiers chars):', tokenData.access_token ? tokenData.access_token.substring(0, 10) + '...' : 'MANQUANT');
    console.log('   - Refresh Token présent:', !!tokenData.refresh_token);
    console.log('   - Refresh Token (10 premiers chars):', tokenData.refresh_token ? tokenData.refresh_token.substring(0, 10) + '...' : 'MANQUANT');
    console.log('   - Expires At:', tokenData.expires_at);
    console.log('   - Expires At (Date):', tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toISOString() : 'MANQUANT');
    console.log('   - Athlete présent:', !!tokenData.athlete);
    console.log('   - Athlete ID:', tokenData.athlete?.id);
    console.log('   - Athlete Name:', tokenData.athlete?.firstname, tokenData.athlete?.lastname);
    console.log('   - Token Data complet:', JSON.stringify(tokenData, null, 2));

    // Vérifier la présence des champs essentiels
    const missingFields = [];
    if (!tokenData.access_token) missingFields.push('access_token');
    if (!tokenData.refresh_token) missingFields.push('refresh_token');
    if (!tokenData.expires_at) missingFields.push('expires_at');
    if (!tokenData.athlete) missingFields.push('athlete');

    if (missingFields.length > 0) {
      console.error('❌ [STRAVA_EXCHANGE] Champs manquants dans la réponse Strava:', missingFields);
      throw new Error('Réponse Strava incomplète: champs manquants - ' + missingFields.join(', '));
    }

    console.log('🔍 [STRAVA_EXCHANGE] Recherche utilisateur:', userId);
    console.log('🔍 [STRAVA_EXCHANGE] Type userId:', typeof userId);
    console.log('🔍 [STRAVA_EXCHANGE] Valeur userId brute:', JSON.stringify(userId));

    // Utiliser la fonction de recherche robuste
    const userResult = await findUserById(userId);

    if (!userResult) {
      console.error('❌ [STRAVA_EXCHANGE] Utilisateur non trouvé:', userId);
      console.error('   - Vérification des fichiers existants dans Client/:');
      try {
        const clientFiles = await fs.readdir(CLIENT_DIR);
        console.error('   - Fichiers Client disponibles:', clientFiles);
      } catch (dirError) {
        console.error('   - Impossible de lire le dossier Client:', dirError);
      }
      throw new Error('Utilisateur non trouvé: ' + userId);
    }

    const { userData, userType } = userResult;

    console.log('✅ [STRAVA_EXCHANGE] Utilisateur trouvé:', {
      id: userData.id,
      name: userData.name || userData.firstName + ' ' + userData.lastName,
      type: userType,
      existingStravaData: !!userData.stravaIntegration
    });

    // Sauvegarder les tokens dans le fichier utilisateur avec la nouvelle structure
    const stravaIntegrationData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      athlete: tokenData.athlete,
      connected: true,
      lastSync: new Date().toISOString(),
      connectionDate: new Date().toISOString()
    };

    console.log('💾 [STRAVA_EXCHANGE] === PRÉPARATION SAUVEGARDE ===');
    console.log('   - Athlete ID:', tokenData.athlete.id);
    console.log('   - Athlete Name:', tokenData.athlete.firstname, tokenData.athlete.lastname);
    console.log('   - Token expire le:', new Date(tokenData.expires_at * 1000).toISOString());
    console.log('   - Structure complète:', {
      ...stravaIntegrationData,
      accessToken: '[MASQUÉ]',
      refreshToken: '[MASQUÉ]'
    });

    // Backup de l'ancienne structure pour debug
    if (userData.stravaIntegration) {
      console.log('📝 [STRAVA_EXCHANGE] Écrasement ancienne données Strava existantes');
    }

    userData.stravaIntegration = stravaIntegrationData;

    // Nettoyer l'ancienne structure si elle existe
    if (userData.stravaTokens) {
      console.log('🧹 [STRAVA_EXCHANGE] Nettoyage ancienne structure stravaTokens');
      delete userData.stravaTokens;
    }

    userData.lastUpdated = new Date().toISOString();

    console.log('📂 [STRAVA_EXCHANGE] === ÉCRITURE FICHIER ===');
    console.log('   - Chemin fichier:', path.join(userType === 'coach' ? COACH_DIR : CLIENT_DIR, `${userId}.json`));
    console.log('   - Taille données utilisateur:', JSON.stringify(userData).length, 'caractères');

    const saveSuccess = await writeUserFile(userId, userData, userType);

    if (saveSuccess) {
      console.log('✅ [STRAVA_EXCHANGE] Tokens Strava sauvegardés avec succès dans le fichier utilisateur:', userId);
      console.log('   - Fichier utilisateur:', `${userType}/${userId}.json`);
      console.log('   - Connexion établie pour athlète:', tokenData.athlete.firstname, tokenData.athlete.lastname);

      // Vérification immédiate de la sauvegarde
      try {
        const verificationData = await readUserFile(userId, userType);
        if (verificationData && verificationData.stravaIntegration && verificationData.stravaIntegration.connected) {
          console.log('✅ [VÉRIFICATION] Données Strava confirmées dans le fichier après sauvegarde');
        } else {
          console.error('❌ [VÉRIFICATION] Données Strava non trouvées après sauvegarde!');
        }
      } catch (verifError) {
        console.error('❌ [VÉRIFICATION] Erreur lors de la vérification:', verifError);
      }
    } else {
      console.error('❌ [STRAVA_EXCHANGE] Échec sauvegarde fichier utilisateur');
      throw new Error('Impossible de sauvegarder les tokens Strava');
    }

    console.log('🎉 [STRAVA_EXCHANGE] Échange de token terminé avec succès pour:', userId);

    // Diagnostic final : vérifier que les données sont bien sauvées
    console.log('🔍 [DIAGNOSTIC FINAL] === VÉRIFICATION COMPLÈTE ===');
    try {
      const finalCheck = await readUserFile(userId, userType);
      if (finalCheck && finalCheck.stravaIntegration) {
        console.log('✅ [DIAGNOSTIC] Données Strava présentes:', {
          connected: finalCheck.stravaIntegration.connected,
          athlete: finalCheck.stravaIntegration.athlete?.firstname + ' ' + finalCheck.stravaIntegration.athlete?.lastname,
          hasAccessToken: !!finalCheck.stravaIntegration.accessToken,
          lastSync: finalCheck.stravaIntegration.lastSync
        });
      } else {
        console.error('❌ [DIAGNOSTIC] PROBLÈME : Pas de données stravaIntegration trouvées!');
      }
    } catch (diagError) {
      console.error('❌ [DIAGNOSTIC] Erreur diagnostic final:', diagError);
    }

    res.json({ 
      success: true, 
      athlete: tokenData.athlete,
      message: 'Strava connecté avec succès',
      debug: {
        userId: userId,
        userType: userType,
        saved: saveSuccess,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [STRAVA_EXCHANGE] Erreur complète:');
    console.error('   - Message:', error.message);
    console.error('   - Stack:', error.stack);
    console.error('   - Type:', error.constructor.name);

    res.status(500).json({ 
      error: 'Erreur échange token Strava',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/strava/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 [SERVEUR] Vérification statut Strava pour: ${userId}`);

    // Chercher dans les clients d'abord
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      console.log(`❌ Utilisateur ${userId} non trouvé`);
      return res.status(404).json({ connected: false, error: 'Utilisateur non trouvé' });
    }

    // Vérifier la nouvelle structure stravaIntegration
    if (userData.stravaIntegration && userData.stravaIntegration.connected) {
      console.log(`✅ [SERVEUR] Strava connecté pour ${userId}: ${userData.stravaIntegration.athlete?.firstname || 'Athlète'}`);

      res.json({
        connected: true,
        athlete: userData.stravaIntegration.athlete,
        accessToken: userData.stravaIntegration.accessToken,
        refreshToken: userData.stravaIntegration.refreshToken,
        expiresAt: userData.stravaIntegration.expiresAt,
        lastSync: userData.stravaIntegration.lastSync
      });
    } else {
      console.log(`📝 [SERVEUR] Strava non connecté pour ${userId}`);
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('❌ [SERVEUR] Erreur vérification statut Strava:', error);
    res.status(500).json({ connected: false, error: 'Erreur serveur' });
  }
});

// Endpoint pour déconnecter Strava
app.post('/api/strava/disconnect/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 [SERVEUR] Déconnexion Strava pour: ${userId}`);

    // Chercher l'utilisateur
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (userData) {
      // Supprimer les données Strava
      if (userData.stravaIntegration) {
        userData.stravaIntegration = {
          connected: false,
          athlete: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          lastSync: null
        };
      }

      // Nettoyer l'ancienne structure si elle existe
      if (userData.stravaTokens) {
        delete userData.stravaTokens;
      }

      userData.lastUpdated = new Date().toISOString();
      await writeUserFile(userId, userData, userType);

      console.log(`✅ [SERVEUR] Strava déconnecté pour: ${userId}`);
      res.json({ success: true, message: 'Strava déconnecté avec succès' });
    } else {
      res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error('❌ [SERVEUR] Erreur déconnexion Strava:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Callback Strava - Route principale avec les vraies valeurs
app.get('/strava-callback', async (req, res) => {
  console.log('📥 [STRAVA] Callback reçu:', req.query);

  const { code, error, state } = req.query;

  // Gestion des erreurs
  if (error) {
    console.error('❌ [STRAVA] Erreur autorisation:', error);
    return res.send(createCallbackPage('❌ Erreur', 'L\'autorisation Strava a échoué.', '#FF6B6B'));
  }

  if (!code || !state) {
    console.log('⚠️ [STRAVA] Paramètres manquants');
    return res.send(createCallbackPage('⚠️ Paramètres manquants', 'Veuillez réessayer depuis l\'application.', '#F5A623'));
  }

  const userId = state;
  console.log('✅ [STRAVA] Traitement pour utilisateur:', userId);

  try {
    // Échanger le code contre un token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [STRAVA] Échec échange token:', errorText);
      throw new Error('Échec échange token');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ [STRAVA] Token reçu pour athlète:', tokenData.athlete?.firstname);

    // Sauvegarder les données
    const stravaData = {
      connected: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      athlete: tokenData.athlete,
      lastSync: new Date().toISOString()
    };

    const userDataPath = path.join(CLIENT_DIR, `${userId}.json`); // Correction: CLIENT_DIR
    let userData = {};

    try {
      // Utilisation de fs.promises.readFile pour la compatibilité async/await
      const fileContent = await fs.readFile(userDataPath, 'utf8');
      userData = JSON.parse(fileContent);
    } catch (e) {
      console.log('📝 [STRAVA] Nouveau fichier utilisateur');
      // Si le fichier n'existe pas, userData reste {}
    }

    // Assurer que userData.stravaIntegration existe avant d'y accéder
    userData.stravaIntegration = stravaData; // Utiliser stravaIntegration comme dans le reste du code

    // Nettoyer l'ancienne structure si elle existe
    if (userData.stravaTokens) {
      delete userData.stravaTokens;
    }
    if (userData.strava) {
      delete userData.strava; // Supprimer l'ancienne clé 'strava'
    }

    userData.lastUpdated = new Date().toISOString();

    await fs.writeFile(userDataPath, JSON.stringify(userData, null, 2));

    console.log('💾 [STRAVA] Données sauvegardées');

    res.send(createCallbackPage(
      '🎉 Strava connecté !', 
      `Bonjour ${tokenData.athlete?.firstname || 'Athlète'} ! Connexion réussie.`, 
      '#28A745'
    ));

  } catch (error) {
    console.error('❌ [STRAVA] Erreur callback:', error);
    res.send(createCallbackPage('❌ Erreur', 'Impossible de connecter Strava.', '#FF6B6B'));
  }
});

// Fonction utilitaire pour créer les pages de callback
function createCallbackPage(title, message, color) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; background: #0A0A0A; color: #FFFFFF; text-align: center; }
        .container { max-width: 400px; margin: 0 auto; }
        h1 { color: ${color}; margin-bottom: 20px; }
        p { margin: 15px 0; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <p>${message}</p>
        <p>Retournez à l'application mobile.</p>
      </div>
      <script>
        setTimeout(() => window.close(), 1500);
      </script>
    </body>
    </html>
  `;
}

// ========================================
// 👨‍💼 GESTION DES INSCRIPTIONS COACH
// ========================================

// Inscription coach
app.post('/api/coach-register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, city, country, diplomas, specialties, experience, terms } = req.body;

    if (!firstName || !lastName || !email || !password || !city || !country || !diplomas || !specialties || !experience || !terms) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérifier les doublons
    const coaches = await getAllUsers('coach');
    const clients = await getAllUsers('client');

    const existingCoach = coaches.find(c => c.email.toLowerCase() === email.toLowerCase());
    const existingClient = clients.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingCoach || existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cette adresse email existe déjà'
      });
    }

    // Hacher le mot de passe
    const crypto = require('crypto');
    const passwordString = String(password).trim();
    const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
    const hashedPassword = crypto.createHash('sha256').update(saltedPassword).digest('hex');

    const newCoach = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      hashedPassword: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      userType: 'coach',
      city: city.trim(),
      country: country.trim(),
      diplomas: diplomas.trim(),
      specialites: specialties,
      experience: experience.trim(),
      emailVerified: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      // Initialiser les données vides
      messages: [],
      notifications: [],
      notificationSettings: {
        pushNotifications: true,
        mealReminders: true,
        workoutReminders: true,
        progressUpdates: true,
        coachMessages: true,
        weeklyReports: true,
        soundEnabled: true,
        vibrationEnabled: true
      }
    };

    await writeUserFile(newCoach.id, newCoach, 'coach');

    console.log('✅ Coach inscrit avec succès:', email);
    res.json({
      success: true,
      message: 'Inscription réussie ! Vous pouvez maintenant vous connecter via l\'application mobile.'
    });

  } catch (error) {
    console.error('❌ Erreur inscription coach:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
});

// Page d'inscription coach
app.get('/coach-signup', (req, res) => {
  const fs = require('fs');
  const path = require('path');

  try {
    const htmlPath = path.join(__dirname, 'coach-signup.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.send(html);
  } catch (error) {
    console.error('❌ Erreur lecture page coach-signup:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Erreur</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>Erreur temporaire</h2>
          <p>La page d'inscription coach n'est pas disponible actuellement.</p>
        </body>
      </html>
    `);
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
    await ensureDataDirs();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur EatFitByMax démarré sur le port ${PORT}`);
      console.log(`🌐 API disponible sur: https://eatfitbymax.cloud`);
      console.log(`🔧 Configuration Strava - Client ID: ${STRAVA_CLIENT_ID}`);
      console.log(`✅ Nouvelle structure: Client/ et Coach/ avec fichiers unifiés`);
    });

    server.on('error', (error) => {
      console.error('❌ Erreur serveur:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('Erreur démarrage serveur:', error);
    process.exit(1);
  }
}

startServer();