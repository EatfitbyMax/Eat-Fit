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
const STRAVA_DIR = path.join(DATA_DIR, 'Strava');

// Configuration Strava avec les variables d'environnement
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '159394';
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || '0a888961cf64a2294908224b07b222ccba150700';

// Log de vérification configuration au démarrage
console.log('🔧 [STARTUP] Configuration Strava:');
console.log('   - Client ID:', STRAVA_CLIENT_ID);
console.log('   - Client Secret présent:', !!STRAVA_CLIENT_SECRET);
console.log('   - Redirect URI configuré: https://eatfitbymax.cloud/strava-callback');

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
    await fs.mkdir(STRAVA_DIR, { recursive: true });
    console.log('📁 Répertoires data/Client, data/Coach et data/Strava vérifiés');
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

// Fonctions pour gérer les données Strava séparées
async function readStravaFile(userId) {
  try {
    const filePath = path.join(STRAVA_DIR, `${userId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Fichier Strava non trouvé
    }
    throw error;
  }
}

async function writeStravaFile(userId, stravaData) {
  try {
    const filePath = path.join(STRAVA_DIR, `${userId}.json`);
    const dataToSave = {
      userId: userId,
      lastUpdated: new Date().toISOString(),
      stravaIntegration: stravaData.stravaIntegration || null,
      activities: stravaData.activities || []
    };
    await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
    return true;
  } catch (error) {
    console.error(`Erreur écriture fichier Strava ${userId}:`, error);
    throw error;
  }
}

async function deleteStravaFile(userId) {
  try {
    const filePath = path.join(STRAVA_DIR, `${userId}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true; // Fichier déjà supprimé
    }
    throw error;
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

// Endpoint pour récupérer les activités Strava d'un utilisateur - STRUCTURE STRAVA UNIFIÉE
app.get('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 [STRAVA_GET] Récupération activités Strava pour: ${userId}`);

    // Lire directement depuis le fichier Strava dédié
    const stravaData = await readStravaFile(userId);
    
    if (stravaData && stravaData.activities && Array.isArray(stravaData.activities)) {
      console.log(`✅ [STRAVA_GET] ${stravaData.activities.length} activités trouvées dans Strava/${userId}.json`);
      
      if (stravaData.activities.length > 0) {
        const firstActivity = stravaData.activities[0];
        console.log(`📋 [STRAVA_GET] Première activité: "${firstActivity.name}" - ${firstActivity.start_date || firstActivity.date} (${firstActivity.type || firstActivity.sport_type})`);
      }
      
      res.json(stravaData.activities);
    } else {
      console.log(`📭 [STRAVA_GET] Aucune activité trouvée dans Strava/${userId}.json`);
      res.json([]);
    }

  } catch (error) {
    console.error(`❌ [STRAVA_GET] Erreur récupération activités Strava:`, error.message);
    res.json([]);
  }
});

// Endpoint pour sauvegarder les activités Strava - STRUCTURE STRAVA UNIFIÉE
app.post('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`💾 [STRAVA_POST] Sauvegarde activités Strava pour: ${userId}`);
    console.log(`💾 [STRAVA_POST] Nombre d'activités reçues: ${Array.isArray(req.body) ? req.body.length : 0}`);

    // Récupérer les informations d'intégration existantes depuis le fichier Strava
    let existingStravaData = await readStravaFile(userId);
    
    // Si pas de fichier Strava existant, récupérer l'intégration depuis les données utilisateur
    if (!existingStravaData || !existingStravaData.stravaIntegration) {
      const userResult = await findUserById(userId);
      if (userResult && userResult.userData.stravaIntegration) {
        existingStravaData = {
          stravaIntegration: userResult.userData.stravaIntegration,
          activities: []
        };
      }
    }

    // Préparer les données à sauvegarder
    const stravaDataToSave = {
      stravaIntegration: existingStravaData?.stravaIntegration || null,
      activities: Array.isArray(req.body) ? req.body : []
    };

    // Mettre à jour la date de synchronisation
    if (stravaDataToSave.stravaIntegration) {
      stravaDataToSave.stravaIntegration.lastSync = new Date().toISOString();
    }

    // Sauvegarder dans le fichier Strava dédié
    await writeStravaFile(userId, stravaDataToSave);
    console.log(`✅ [STRAVA_POST] ${stravaDataToSave.activities.length} activités sauvegardées dans Strava/${userId}.json`);

    res.json({ success: true });
  } catch (error) {
    console.error(`❌ [STRAVA_POST] Erreur sauvegarde activités Strava:`, error.message);
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

    // Vérifier la configuration de base
    console.log('🔍 [STRAVA_EXCHANGE] Vérification configuration:');
    console.log('   - Client ID:', STRAVA_CLIENT_ID);
    console.log('   - Client Secret présent:', !!STRAVA_CLIENT_SECRET);
    console.log('   - Client Secret longueur:', STRAVA_CLIENT_SECRET ? STRAVA_CLIENT_SECRET.length : 0);

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

    // Préparer les données d'intégration Strava
    const stravaIntegrationData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      athlete: tokenData.athlete,
      connected: true,
      lastSync: new Date().toISOString(),
      connectionDate: new Date().toISOString()
    };

    console.log('💾 [STRAVA_EXCHANGE] Sauvegarde tokens pour athlete:', tokenData.athlete.firstname, tokenData.athlete.lastname);

    // Récupérer les activités existantes s'il y en a dans le fichier Strava dédié
    let existingStravaData = await readStravaFile(userId);
    const existingActivities = existingStravaData?.activities || [];

    // Sauvegarder dans le fichier Strava dédié
    const completeStravaData = {
      stravaIntegration: stravaIntegrationData,
      activities: existingActivities
    };
    await writeStravaFile(userId, completeStravaData);
    console.log(`✅ [STRAVA_EXCHANGE] Données sauvegardées dans Strava/${userId}.json (${existingActivities.length} activités conservées)`);

    // Mettre à jour le fichier utilisateur avec juste la référence d'intégration (sans les activités)
    userData.stravaIntegration = stravaIntegrationData;

    // Nettoyer l'ancienne structure si elle existe
    if (userData.stravaTokens) {
      console.log('🧹 [STRAVA_EXCHANGE] Nettoyage ancienne structure stravaTokens');
      delete userData.stravaTokens;
    }
    if (userData.stravaActivities) {
      console.log('🧹 [STRAVA_EXCHANGE] Nettoyage stravaActivities (migré vers fichier dédié)');
      delete userData.stravaActivities;
    }
    if (userData.strava) {
      console.log('🧹 [STRAVA_EXCHANGE] Nettoyage ancienne structure strava');
      delete userData.strava;
    }

    userData.lastUpdated = new Date().toISOString();

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

// Endpoint pour vérifier le statut de connexion Strava - STRUCTURE STRAVA UNIFIÉE
app.get('/api/strava/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 [STRAVA_STATUS] Vérification statut pour: ${userId}`);

    // Récupérer les données depuis le fichier Strava dédié AVEC logs détaillés
    console.log(`🔍 [STRAVA_STATUS] Tentative lecture Strava/${userId}.json`);
    const stravaData = await readStravaFile(userId);
    
    console.log(`🔍 [STRAVA_STATUS] Données Strava lues:`, stravaData ? 'TROUVÉ' : 'VIDE');
    if (stravaData) {
      console.log(`🔍 [STRAVA_STATUS] Structure:`, {
        hasIntegration: !!stravaData.stravaIntegration,
        connected: stravaData.stravaIntegration?.connected,
        hasAthlete: !!stravaData.stravaIntegration?.athlete,
        athleteName: stravaData.stravaIntegration?.athlete?.firstname + ' ' + stravaData.stravaIntegration?.athlete?.lastname
      });
    }
    
    if (stravaData && stravaData.stravaIntegration && stravaData.stravaIntegration.connected) {
      const integration = stravaData.stravaIntegration;
      console.log(`✅ [STRAVA_STATUS] Connecté pour ${userId}: ${integration.athlete?.firstname || 'Athlète'}`);

      res.json({
        connected: true,
        athlete: integration.athlete,
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken,
        expiresAt: integration.expiresAt,
        lastSync: integration.lastSync
      });
    } else {
      console.log(`📝 [STRAVA_STATUS] Non connecté pour ${userId} - Recherche dans fichier utilisateur...`);
      
      // Fallback : chercher dans le fichier utilisateur
      const userResult = await findUserById(userId);
      if (userResult && userResult.userData.stravaIntegration && userResult.userData.stravaIntegration.connected) {
        const integration = userResult.userData.stravaIntegration;
        console.log(`✅ [STRAVA_STATUS] Trouvé dans fichier utilisateur pour ${userId}: ${integration.athlete?.firstname || 'Athlète'}`);
        
        res.json({
          connected: true,
          athlete: integration.athlete,
          accessToken: integration.accessToken,
          refreshToken: integration.refreshToken,
          expiresAt: integration.expiresAt,
          lastSync: integration.lastSync
        });
      } else {
        console.log(`📝 [STRAVA_STATUS] Définitivement non connecté pour ${userId}`);
        res.json({ connected: false });
      }
    }
  } catch (error) {
    console.error('❌ [STRAVA_STATUS] Erreur vérification:', error.message);
    res.json({ connected: false, error: 'Erreur serveur' });
  }
});

// Route de diagnostic pour analyser les données utilisateur
app.get('/api/debug/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔧 [DEBUG] Diagnostic utilisateur: ${userId}`);

    const userResult = await findUserById(userId);

    if (!userResult) {
      return res.json({ error: 'Utilisateur non trouvé' });
    }

    const { userData, userType } = userResult;

    // Vérifier aussi le fichier Strava dédié
    const stravaFileData = await readStravaFile(userId);

    // Créer un diagnostic complet
    const diagnostic = {
      userId: userId,
      userType: userType,
      userName: userData.name || `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      allKeys: Object.keys(userData),
      stravaKeys: Object.keys(userData).filter(key => key.toLowerCase().includes('strava')),
      stravaData: {},
      activityKeys: Object.keys(userData).filter(key => key.toLowerCase().includes('activit')),
      workoutKeys: Object.keys(userData).filter(key => key.toLowerCase().includes('workout')),
      fileSize: JSON.stringify(userData).length,
      stravaIntegrationDetails: userData.stravaIntegration ? {
        connected: userData.stravaIntegration.connected,
        hasAthlete: !!userData.stravaIntegration.athlete,
        athleteName: userData.stravaIntegration.athlete ? 
          `${userData.stravaIntegration.athlete.firstname} ${userData.stravaIntegration.athlete.lastname}` : null,
        hasAccessToken: !!userData.stravaIntegration.accessToken,
        lastSync: userData.stravaIntegration.lastSync,
        allKeys: Object.keys(userData.stravaIntegration)
      } : null,
      dedicatedStravaFile: stravaFileData ? {
        exists: true,
        hasIntegration: !!stravaFileData.stravaIntegration,
        connected: stravaFileData.stravaIntegration?.connected || false,
        activitiesCount: stravaFileData.activities?.length || 0,
        lastUpdated: stravaFileData.lastUpdated,
        athleteName: stravaFileData.stravaIntegration?.athlete ? 
          `${stravaFileData.stravaIntegration.athlete.firstname} ${stravaFileData.stravaIntegration.athlete.lastname}` : null,
        sample: stravaFileData.activities && stravaFileData.activities.length > 0 ? {
          name: stravaFileData.activities[0].name,
          date: stravaFileData.activities[0].start_date || stravaFileData.activities[0].date,
          type: stravaFileData.activities[0].type || stravaFileData.activities[0].sport_type
        } : null
      } : {
        exists: false
      }
    };

    // Analyser chaque clé Strava dans les données utilisateur
    diagnostic.stravaKeys.forEach(key => {
      const data = userData[key];
      diagnostic.stravaData[key] = {
        type: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        keys: typeof data === 'object' && data ? Object.keys(data) : [],
        sample: Array.isArray(data) && data.length > 0 ? {
          name: data[0].name,
          date: data[0].start_date || data[0].date,
          type: data[0].type || data[0].sport_type,
          id: data[0].id
        } : null
      };
    });

    // Analyser les clés d'activités générales
    diagnostic.activityKeys.forEach(key => {
      if (!diagnostic.stravaData[key]) { // Éviter les doublons
        const data = userData[key];
        diagnostic.stravaData[key] = {
          type: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A',
          keys: typeof data === 'object' && data ? Object.keys(data) : [],
          sample: Array.isArray(data) && data.length > 0 ? {
            name: data[0].name,
            date: data[0].start_date || data[0].date,
            type: data[0].type || data[0].sport_type,
            id: data[0].id
          } : null
        };
      }
    });

    console.log(`🔧 [DEBUG] Diagnostic généré pour ${userId}:`, diagnostic);
    res.json(diagnostic);

  } catch (error) {
    console.error(`❌ [DEBUG] Erreur diagnostic:`, error);
    res.status(500).json({ error: 'Erreur diagnostic' });
  }
});

// Endpoint pour synchronisation manuelle Strava - STRUCTURE STRAVA UNIFIÉE
app.post('/api/strava/sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 [STRAVA_SYNC] Synchronisation manuelle pour: ${userId}`);

    // Récupérer les données Strava depuis le fichier dédié
    let stravaData = await readStravaFile(userId);
    
    // Si pas de fichier Strava, récupérer l'intégration depuis les données utilisateur
    if (!stravaData || !stravaData.stravaIntegration) {
      const userResult = await findUserById(userId);
      if (!userResult || !userResult.userData.stravaIntegration) {
        return res.status(404).json({ 
          success: false, 
          error: 'Strava non connecté - configuration manquante' 
        });
      }
      
      stravaData = {
        stravaIntegration: userResult.userData.stravaIntegration,
        activities: []
      };
    }

    // Vérifier l'état de la connexion
    const integration = stravaData.stravaIntegration;
    if (!integration || !integration.connected || !integration.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Strava non connecté - tokens manquants' 
      });
    }

    console.log(`🔗 [STRAVA_SYNC] Récupération activités depuis API Strava pour athlete: ${integration.athlete?.firstname}`);

    // Récupérer les activités depuis l'API Strava
    const stravaResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=50', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!stravaResponse.ok) {
      const errorText = await stravaResponse.text();
      console.error(`❌ [STRAVA_SYNC] Erreur API Strava (${stravaResponse.status}):`, errorText);
      return res.status(400).json({ 
        success: false, 
        error: `Erreur API Strava: ${stravaResponse.status}` 
      });
    }

    const activities = await stravaResponse.json();
    console.log(`✅ [STRAVA_SYNC] ${activities.length} activités récupérées depuis API Strava`);

    // Mettre à jour les données complètes
    const updatedStravaData = {
      stravaIntegration: {
        ...integration,
        lastSync: new Date().toISOString()
      },
      activities: activities
    };

    // Sauvegarder dans le fichier Strava dédié
    await writeStravaFile(userId, updatedStravaData);
    console.log(`💾 [STRAVA_SYNC] ${activities.length} activités sauvegardées dans Strava/${userId}.json`);

    // Log des premières activités pour debug
    if (activities.length > 0) {
      activities.slice(0, 3).forEach((activity, index) => {
        console.log(`  ${index + 1}. "${activity.name}" - ${activity.start_date} (${activity.type || activity.sport_type})`);
      });
    }

    res.json({ 
      success: true, 
      message: 'Synchronisation Strava réussie',
      activitiesCount: activities.length,
      lastSync: updatedStravaData.stravaIntegration.lastSync
    });

  } catch (error) {
    console.error('❌ [STRAVA_SYNC] Erreur synchronisation:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la synchronisation' 
    });
  }
});

// Endpoint pour déconnecter Strava - STRUCTURE STRAVA UNIFIÉE
app.post('/api/strava/disconnect/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 [STRAVA_DISCONNECT] Déconnexion pour: ${userId}`);

    // Supprimer le fichier Strava dédié
    await deleteStravaFile(userId);
    console.log(`🗑️ [STRAVA_DISCONNECT] Fichier Strava/${userId}.json supprimé`);

    // Nettoyer aussi la référence dans le fichier utilisateur
    const userResult = await findUserById(userId);
    if (userResult) {
      const { userData, userType } = userResult;
      
      // Réinitialiser l'intégration Strava dans les données utilisateur
      userData.stravaIntegration = {
        connected: false,
        athlete: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        lastSync: null
      };

      userData.lastUpdated = new Date().toISOString();
      await writeUserFile(userId, userData, userType);
      console.log(`🧹 [STRAVA_DISCONNECT] Données utilisateur nettoyées`);
    }

    res.json({ success: true, message: 'Strava déconnecté avec succès' });
  } catch (error) {
    console.error('❌ [STRAVA_DISCONNECT] Erreur:', error.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Callback Strava - Route principale avec les vraies valeurs
app.get('/strava-callback', async (req, res) => {
  console.log('📥 [STRAVA_CALLBACK] === DÉBUT TRAITEMENT CALLBACK ===');
  console.log('📥 [STRAVA_CALLBACK] Query params:', JSON.stringify(req.query, null, 2));
  console.log('📥 [STRAVA_CALLBACK] Headers importants:', {
    'user-agent': req.headers['user-agent'],
    'referer': req.headers['referer'],
    'host': req.headers['host']
  });
  console.log('📥 [STRAVA_CALLBACK] URL complète:', req.url);
  console.log('📥 [STRAVA_CALLBACK] Method:', req.method);
  console.log('📥 [STRAVA_CALLBACK] Configuration utilisée:', {
    clientId: STRAVA_CLIENT_ID,
    clientSecret: STRAVA_CLIENT_SECRET ? '[PRÉSENT - ' + STRAVA_CLIENT_SECRET.length + ' chars]' : '[MANQUANT]',
    redirectUri: 'https://eatfitbymax.cloud/strava-callback'
  });

  const { code, error, state } = req.query;

  // Validation détaillée des paramètres
  console.log('🔍 [STRAVA_CALLBACK] Validation paramètres:');
  console.log('   - code présent:', !!code, '- longueur:', code ? code.length : 0);
  console.log('   - error présent:', !!error, '- valeur:', error);
  console.log('   - state présent:', !!state, '- valeur:', state);

  // Gestion des erreurs
  if (error) {
    console.error('❌ [STRAVA_CALLBACK] Erreur autorisation Strava:', error);
    res.send(createCallbackPage('❌ Erreur', 'L\'autorisation Strava a échoué: ' + error, '#FF6B6B', true));
    return;
  }

  if (!code) {
    console.error('❌ [STRAVA_CALLBACK] Code d\'autorisation manquant');
    res.send(createCallbackPage('⚠️ Code manquant', 'Code d\'autorisation non reçu. Réessayez depuis l\'app.', '#F5A623', true));
    return;
  }

  if (!state) {
    console.error('❌ [STRAVA_CALLBACK] State (userId) manquant');
    res.send(createCallbackPage('⚠️ État manquant', 'Identifiant utilisateur manquant. Réessayez depuis l\'app.', '#F5A623', true));
    return;
  }

  const userId = state;
  console.log('✅ [STRAVA_CALLBACK] Paramètres validés - Traitement pour utilisateur:', userId);

  try {
    console.log('🔄 [STRAVA_CALLBACK] === DÉBUT ÉCHANGE TOKEN ===');

    // Préparer la requête d'échange de token
    const tokenRequestBody = {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    };

    console.log('📤 [STRAVA_CALLBACK] Envoi requête vers Strava OAuth:');
    console.log('   - URL: https://www.strava.com/oauth/token');
    console.log('   - Method: POST');
    console.log('   - client_id:', tokenRequestBody.client_id);
    console.log('   - client_secret:', tokenRequestBody.client_secret ? '[MASQUÉ-' + tokenRequestBody.client_secret.length + ']' : 'MANQUANT');
    console.log('   - code (premiers 10 chars):', code.substring(0, 10) + '...');
    console.log('   - grant_type:', tokenRequestBody.grant_type);

    // Échanger le code contre un token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(tokenRequestBody)
    });

    console.log('📥 [STRAVA_CALLBACK] Réponse Strava reçue:');
    console.log('   - Status:', tokenResponse.status, tokenResponse.statusText);
    console.log('   - Headers:', Object.fromEntries(tokenResponse.headers.entries()));

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [STRAVA_CALLBACK] Échec échange token:');
      console.error('   - Status HTTP:', tokenResponse.status);
      console.error('   - Status Text:', tokenResponse.statusText);
      console.error('   - Response Body:', errorText);
      
      let errorMessage = 'Échec de l\'échange de token avec Strava';
      try {
        const errorJson = JSON.parse(errorText);
        console.error('   - Error JSON:', JSON.stringify(errorJson, null, 2));
        errorMessage += ': ' + (errorJson.message || errorJson.error || 'Erreur inconnue');
      } catch (parseError) {
        console.error('   - Impossible de parser l\'erreur JSON');
      }

      res.send(createCallbackPage('❌ Erreur OAuth', errorMessage, '#FF6B6B', true));
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ [STRAVA_CALLBACK] Token reçu avec succès:');
    console.log('   - Athlete présent:', !!tokenData.athlete);
    console.log('   - Athlete nom:', tokenData.athlete?.firstname, tokenData.athlete?.lastname);
    console.log('   - Athlete ID:', tokenData.athlete?.id);
    console.log('   - Access token présent:', !!tokenData.access_token);
    console.log('   - Refresh token présent:', !!tokenData.refresh_token);
    console.log('   - Expires at:', tokenData.expires_at, '(' + new Date(tokenData.expires_at * 1000).toISOString() + ')');
    console.log('   - Token Data complet:', JSON.stringify(tokenData, null, 2));

    // Sauvegarder les données
    const stravaData = {
      connected: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      athlete: tokenData.athlete,
      lastSync: new Date().toISOString()
    };

    console.log('🔍 [STRAVA_CALLBACK] === RECHERCHE UTILISATEUR ===');
    console.log('   - userId à rechercher:', userId);
    console.log('   - Type userId:', typeof userId);

    // Utiliser la recherche robuste pour trouver l'utilisateur
    const userResult = await findUserById(userId);

    if (!userResult) {
      console.error('❌ [STRAVA_CALLBACK] Utilisateur non trouvé:', userId);
      console.error('   - Vérification fichiers Client existants...');
      try {
        const clientFiles = await fs.readdir(CLIENT_DIR);
        console.error('   - Fichiers disponibles:', clientFiles.slice(0, 5)); // Les 5 premiers
        console.error('   - Total fichiers:', clientFiles.length);
      } catch (dirError) {
        console.error('   - Erreur lecture dossier Client:', dirError.message);
      }
      res.send(createCallbackPage('❌ Utilisateur non trouvé', 'Impossible de trouver votre profil utilisateur (ID: ' + userId + ')', '#FF6B6B', true));
      return;
    }

    const { userData, userType } = userResult;
    console.log('✅ [STRAVA_CALLBACK] Utilisateur trouvé:', {
      id: userData.id,
      name: userData.name || userData.firstName + ' ' + userData.lastName,
      type: userType,
      email: userData.email
    });

    console.log('💾 [STRAVA_CALLBACK] === SAUVEGARDE DONNÉES ===');

    // Préparer les données d'intégration Strava
    const stravaIntegrationData = {
      connected: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      athlete: tokenData.athlete,
      lastSync: new Date().toISOString(),
      connectionDate: new Date().toISOString()
    };

    // Sauvegarder dans le fichier Strava dédié d'abord
    const completeStravaData = {
      stravaIntegration: stravaIntegrationData,
      activities: [] // Initialement vide, sera rempli lors de la synchronisation
    };

    try {
      await writeStravaFile(userId, completeStravaData);
      console.log('✅ [STRAVA_CALLBACK] Données sauvées dans Strava/' + userId + '.json');
    } catch (stravaFileError) {
      console.error('❌ [STRAVA_CALLBACK] Erreur sauvegarde fichier Strava:', stravaFileError);
    }

    // Ensuite mettre à jour le fichier utilisateur avec la référence d'intégration
    userData.stravaIntegration = stravaIntegrationData;

    // Nettoyer les anciennes structures si elles existent
    const oldKeys = ['stravaTokens', 'strava', 'stravaActivities'];
    oldKeys.forEach(key => {
      if (userData[key]) {
        console.log('🧹 [STRAVA_CALLBACK] Nettoyage ancienne structure:', key);
        delete userData[key];
      }
    });

    userData.lastUpdated = new Date().toISOString();

    try {
      await writeUserFile(userId, userData, userType);
      console.log('✅ [STRAVA_CALLBACK] Fichier utilisateur mis à jour:', userType + '/' + userId + '.json');
    } catch (userFileError) {
      console.error('❌ [STRAVA_CALLBACK] Erreur sauvegarde fichier utilisateur:', userFileError);
      throw userFileError;
    }

    // Vérification finale - s'assurer que les données ont été bien sauvegardées
    console.log('🔍 [STRAVA_CALLBACK] === VÉRIFICATION FINALE ===');
    try {
      const verificationData = await readUserFile(userId, userType);
      const stravaVerificationData = await readStravaFile(userId);
      
      if (verificationData && verificationData.stravaIntegration && verificationData.stravaIntegration.connected) {
        console.log('✅ [STRAVA_CALLBACK] Vérification utilisateur réussie - Strava connecté');
      } else {
        console.error('❌ [STRAVA_CALLBACK] Vérification utilisateur échouée');
      }

      if (stravaVerificationData && stravaVerificationData.stravaIntegration && stravaVerificationData.stravaIntegration.connected) {
        console.log('✅ [STRAVA_CALLBACK] Vérification fichier Strava réussie');
      } else {
        console.error('❌ [STRAVA_CALLBACK] Vérification fichier Strava échouée');
      }
    } catch (verificationError) {
      console.error('❌ [STRAVA_CALLBACK] Erreur lors de la vérification finale:', verificationError);
    }

    console.log('🎉 [STRAVA_CALLBACK] === SUCCÈS COMPLET ===');
    console.log('   - Utilisateur:', userId);
    console.log('   - Athlete:', tokenData.athlete?.firstname, tokenData.athlete?.lastname);
    console.log('   - Connexion établie à:', new Date().toISOString());

    // Page de succès avec redirection automatique vers l'app
    res.send(createCallbackPage('🎉 Connexion réussie !', 'Strava est maintenant connecté à votre compte. Redirection vers l\'app...', '#28A745', true));
  } catch (error) {
    console.error('❌ [STRAVA_CALLBACK] === ERREUR CRITIQUE ===');
    console.error('   - Message:', error.message);
    console.error('   - Stack:', error.stack);
    console.error('   - Type:', error.constructor.name);
    console.error('   - userId:', userId);
    console.error('   - Timestamp:', new Date().toISOString());

    res.send(createCallbackPage(
      '❌ Erreur de connexion', 
      'Une erreur est survenue lors de la connexion: ' + error.message, 
      '#FF6B6B',
      true
    ));
  }
});

// Fonction utilitaire pour créer une page de callback
function createCallbackPage(title, message, color, autoRedirect = false) {
  const redirectScript = autoRedirect ? `
    <script>
      console.log('Début redirection automatique...');

      // Fonction pour fermer la fenêtre
      function closeWindow() {
        try {
          // 1. Essayer le protocole custom scheme pour iOS
          window.location.href = 'eatfitbymax://profil';

          // 2. Attendre un peu puis essayer de fermer
          setTimeout(function() {
            try {
              window.close();
            } catch (e) {
              console.log('Impossible de fermer la fenêtre:', e);
            }
          }, 500);

          // 3. Fallback final - retour en arrière
          setTimeout(function() {
            try {
              history.back();
            } catch (e) {
              console.log('Impossible de revenir en arrière:', e);
            }
          }, 1000);
        } catch (e) {
          console.log('Erreur lors de la redirection:', e);
        }
      }

      // Démarrer la redirection immédiatement
      setTimeout(closeWindow, 1000);

      // Ajouter un listener pour détecter si la page devient visible/cachée
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
          console.log('Page cachée - tentative de fermeture');
          closeWindow();
        }
      });

      // Ajouter un listener pour les événements de focus/blur
      window.addEventListener('blur', function() {
        console.log('Fenêtre a perdu le focus - tentative de fermeture');
        setTimeout(closeWindow, 200);
      });
    </script>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EatFitByMax - ${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%);
          color: white;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          text-align: center;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 400px;
          margin: 20px;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          color: ${color};
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 600;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 30px;
          opacity: 0.9;
        }
        .back-button {
          background: ${color};
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: opacity 0.2s;
        }
        .back-button:hover {
          opacity: 0.8;
        }
        .loading {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: ${color};
          animation: spin 1s ease-in-out infinite;
          margin-right: 10px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .countdown {
          font-size: 14px;
          opacity: 0.7;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🏃‍♂️</div>
        <h1>${title}</h1>
        <p>${message}</p>
        ${autoRedirect ? `
          <div class="loading"></div>
          <span>Redirection automatique...</span>
          <div class="countdown" id="countdown"></div>
        ` : '<a href="#" onclick="history.back();" class="back-button">Retour à l\'application</a>'}
      </div>
      ${autoRedirect ? `
        <script>
          let timeLeft = 3;
          const countdownEl = document.getElementById('countdown');

          function updateCountdown() {
            countdownEl.textContent = \`Redirection dans \${timeLeft}s\`;
            timeLeft--;

            if (timeLeft < 0) {
              countdownEl.textContent = 'Redirection en cours...';
            }
          }

          updateCountdown();
          const countdownInterval = setInterval(updateCountdown, 1000);

          setTimeout(function() {
            clearInterval(countdownInterval);
          }, 3000);
        </script>
      ` : ''}
      ${redirectScript}
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