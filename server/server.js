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

// Routes pour les préférences d'application
app.get('/api/app-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const defaultPreferences = {
      theme: 'system',
      language: 'fr',
      units: 'metric',
      notifications: true
    };

    const preferences = userData?.appPreferences || defaultPreferences;
    res.json(preferences);
  } catch (error) {
    console.error(`Erreur lecture préférences app utilisateur ${req.params.userId}:`, error);
    res.json({
      theme: 'system',
      language: 'fr',
      units: 'metric',
      notifications: true
    });
  }
});

app.post('/api/app-preferences/:userId', async (req, res) => {
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

    userData.appPreferences = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde préférences app utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde préférences application' });
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

    console.log(`📤 [WEIGHT_LOAD] Chargement poids pour ${userId}:`, {
      targetWeight: weightData.targetWeight,
      targetWeightType: typeof weightData.targetWeight,
      completeData: weightData,
      userDataKeys: userData ? Object.keys(userData) : 'pas de userData'
    });

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

    // Logging détaillé des données reçues
    console.log(`🔍 [WEIGHT_SAVE] Données brutes reçues pour ${userId}:`, {
      startWeight: req.body.startWeight,
      currentWeight: req.body.currentWeight,
      targetWeight: req.body.targetWeight,
      targetWeightType: typeof req.body.targetWeight,
      targetAsked: req.body.targetAsked,
      targetAskedType: typeof req.body.targetAsked,
      allKeys: Object.keys(req.body)
    });

    // Préserver le targetWeight existant si la nouvelle valeur est 0 ou undefined
    const existingTargetWeight = userData.weight?.targetWeight || 0;
    const newTargetWeight = parseFloat(req.body.targetWeight);
    const finalTargetWeight = (!isNaN(newTargetWeight) && newTargetWeight > 0) ? newTargetWeight : existingTargetWeight;

    // Mettre à jour les données de poids
    const updatedWeightData = {
      startWeight: parseFloat(req.body.startWeight) || userData.weight?.startWeight || 0,
      currentWeight: parseFloat(req.body.currentWeight) || userData.weight?.currentWeight || 0,
      targetWeight: finalTargetWeight,
      lastWeightUpdate: req.body.lastWeightUpdate || userData.weight?.lastWeightUpdate || null,
      targetAsked: req.body.targetAsked !== undefined ? Boolean(req.body.targetAsked) : (userData.weight?.targetAsked || false),
      weightHistory: req.body.weightHistory || userData.weight?.weightHistory || []
    };

    userData.weight = updatedWeightData;
    userData.lastUpdated = new Date().toISOString();

    console.log(`💾 [WEIGHT_SAVE] Données finales à sauvegarder pour ${userId}:`, {
      existingTargetWeight,
      newTargetWeight,
      finalTargetWeight,
      updatedData: updatedWeightData
    });
    console.log(`💾 [WEIGHT_SAVE] Sauvegarde poids pour ${userId}:`, {
      targetAsked: updatedWeightData.targetAsked,
      currentWeight: updatedWeightData.currentWeight,
      targetWeight: updatedWeightData.targetWeight,
      targetWeightType: typeof updatedWeightData.targetWeight,
      originalTargetWeight: req.body.targetWeight,
      originalTargetWeightType: typeof req.body.targetWeight,
      weightDataComplete: updatedWeightData
    });

    await writeUserFile(userId, userData, userType);

    // Vérification immédiate après sauvegarde
    console.log(`🔍 [WEIGHT_VERIFY] Vérification données sauvées pour ${userId}:`, {
      targetWeight: userData.weight.targetWeight,
      targetWeightType: typeof userData.weight.targetWeight,
      allWeightData: userData.weight
    });
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

// Endpoint pour récupérer les activités Strava d'un utilisateur
app.get('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 [STRAVA_GET] === RÉCUPÉRATION ACTIVITÉS STRAVA ===`);
    console.log(`🔍 [STRAVA_GET] User ID demandé: ${userId}`);

    // Essayer d'abord le fichier Strava dédié
    let stravaData = await readStravaFile(userId);
    let foundIn = null;
    let stravaActivities = [];

    if (stravaData && stravaData.activities) {
      stravaActivities = stravaData.activities;
      foundIn = 'Strava/' + userId + '.json';
      console.log(`✅ [STRAVA_GET] Données trouvées dans le fichier Strava dédié: ${stravaActivities.length} activités`);
    } else {
      console.log(`🔍 [STRAVA_GET] Aucun fichier Strava dédié trouvé, recherche dans les données utilisateur...`);

      // Fallback: chercher dans les données utilisateur (ancienne structure)
      const userResult = await findUserById(userId);

      if (!userResult) {
        console.log(`❌ [STRAVA_GET] Utilisateur ${userId} non trouvé`);
        return res.json([]);
      }

      const { userData, userType } = userResult;
      console.log(`✅ [STRAVA_GET] Utilisateur trouvé: ${userData.name || userData.email} (${userType})`);

      // Vérifier toutes les structures possibles dans les données utilisateur
      const possibleKeys = ['stravaActivities', 'strava', 'activities'];

      for (const key of possibleKeys) {
        if (userData[key]) {
          console.log(`🔍 [STRAVA_GET] Clé "${key}" trouvée dans userData:`, {
            type: typeof userData[key],
            isArray: Array.isArray(userData[key]),
            length: Array.isArray(userData[key]) ? userData[key].length : 'N/A'
          });

          if (Array.isArray(userData[key])) {
            stravaActivities = userData[key];
            foundIn = `userData.${key}`;
            break;
          } else if (typeof userData[key] === 'object' && userData[key].activities) {
            stravaActivities = userData[key].activities;
            foundIn = `userData.${key}.activities`;
            break;
          }
        }
      }

      // Vérifier dans l'intégration Strava si les activités ne sont pas trouvées ailleurs
      if (stravaActivities.length === 0 && userData.stravaIntegration && userData.stravaIntegration.activities) {
        stravaActivities = userData.stravaIntegration.activities;
        foundIn = 'userData.stravaIntegration.activities';
      }

      // Si des activités sont trouvées dans l'ancienne structure, les migrer vers le nouveau fichier Strava
      if (stravaActivities.length > 0) {
        console.log(`🔄 [STRAVA_GET] Migration de ${stravaActivities.length} activités vers le fichier Strava dédié...`);
        const migrationData = {
          stravaIntegration: userData.stravaIntegration || null,
          activities: stravaActivities
        };
        await writeStravaFile(userId, migrationData);
        console.log(`✅ [STRAVA_GET] Migration terminée vers Strava/${userId}.json`);
        foundIn = `Strava/${userId}.json (migré depuis ${foundIn})`;
      }
    }

    console.log(`📊 [STRAVA_GET] === RÉSULTAT FINAL ===`);
    console.log(`📊 Activités trouvées: ${stravaActivities.length}`);
    console.log(`📊 Source: ${foundIn || 'Aucune'}`);

    // Debug des premières activités si elles existent
    if (stravaActivities.length > 0) {
      console.log(`📋 [STRAVA_GET] Première activité:`, {
        name: stravaActivities[0].name,
        date: stravaActivities[0].start_date || stravaActivities[0].date,
        type: stravaActivities[0].type || stravaActivities[0].sport_type,
        keys: Object.keys(stravaActivities[0])
      });

      console.log(`📋 [STRAVA_GET] Liste des ${Math.min(5, stravaActivities.length)} premières activités:`);
      stravaActivities.slice(0, 5).forEach((activity, index) => {
        const date = activity.start_date || activity.date || activity.start_date_local;
        console.log(`  ${index + 1}. "${activity.name}" - ${date} (${activity.type || activity.sport_type})`);
      });
    } else {
      console.log(`❌ [STRAVA_GET] Aucune activité trouvée`);
    }

    console.log(`✅ [STRAVA_GET] === FIN RÉCUPÉRATION ===`);
    res.json(stravaActivities);

  } catch (error) {
    console.error(`❌ [STRAVA_GET] Erreur complète:`, {
      message: error.message,
      stack: error.stack,
      userId: req.params.userId
    });
    res.json([]);
  }
});

app.post('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`💾 [STRAVA_POST] Sauvegarde activités pour: ${userId}`);
    console.log(`💾 [STRAVA_POST] Données reçues:`, {
      type: typeof req.body,
      isArray: Array.isArray(req.body),
      length: Array.isArray(req.body) ? req.body.length : 'N/A'
    });

    // Récupérer les informations d'intégration existantes
    let existingStravaData = await readStravaFile(userId);

    // Si pas de fichier Strava existant, essayer de récupérer les infos d'intégration depuis les données utilisateur
    if (!existingStravaData) {
      const userResult = await findUserById(userId);
      if (userResult) {
        const { userData } = userResult;
        existingStravaData = {
          stravaIntegration: userData.stravaIntegration || null,
          activities: []
        };
      }
    }

    // Préparer les données à sauvegarder dans le fichier Strava dédié
    const stravaDataToSave = {
      stravaIntegration: existingStravaData?.stravaIntegration || null,
      activities: req.body
    };

    // Mettre à jour la date de synchronisation si l'intégration existe
    if (stravaDataToSave.stravaIntegration) {
      stravaDataToSave.stravaIntegration.lastSync = new Date().toISOString();
    }

    // Sauvegarder dans le fichier Strava dédié
    await writeStravaFile(userId, stravaDataToSave);

    console.log(`✅ [STRAVA_POST] ${Array.isArray(req.body) ? req.body.length : 0} activités sauvegardées dans Strava/${userId}.json`);

    // Optionnel: nettoyer les anciennes données Strava des fichiers utilisateur
    try {
      const userResult = await findUserById(userId);
      if (userResult) {
        const { userData, userType } = userResult;
        let needsCleanup = false;

        // Supprimer les anciennes structures
        if (userData.stravaActivities) {
          delete userData.stravaActivities;
          needsCleanup = true;
        }
        if (userData.strava) {
          delete userData.strava;
          needsCleanup = true;
        }
        if (userData.stravaIntegration && userData.stravaIntegration.activities) {
          delete userData.stravaIntegration.activities;
          needsCleanup = true;
        }

        if (needsCleanup) {
          userData.lastUpdated = new Date().toISOString();
          await writeUserFile(userId, userData, userType);
          console.log(`🧹 [STRAVA_POST] Nettoyage des anciennes données Strava dans le fichier utilisateur`);
        }
      }
    } catch (cleanupError) {
      console.log(`⚠️ [STRAVA_POST] Erreur nettoyage (non critique):`, cleanupError.message);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(`❌ [STRAVA_POST] Erreur sauvegarde données Strava utilisateur ${userId}:`, error);
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

// Routes pour l'hydratation
app.get('/api/water/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const waterData = userData?.waterIntake || {};
    const amount = waterData[date] || 0;

    res.json(amount);
  } catch (error) {
    console.error(`Erreur récupération hydratation ${req.params.userId}/${req.params.date}:`, error);
    res.json(0);
  }
});

app.post('/api/water/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const { amount } = req.body;

    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (!userData.waterIntake) {
      userData.waterIntake = {};
    }

    userData.waterIntake[date] = amount;
    userData.lastUpdated = new Date().toISOString();

    try {
      await writeUserFile(userId, userData, userType);
      console.log(`✅ Hydratation sauvegardée: ${userId}/${date} = ${amount}ml`);
      res.json({ success: true });
    } catch (writeError) {
      console.error(`❌ Erreur écriture fichier hydratation ${userId}:`, writeError);
      res.status(500).json({ error: 'Erreur écriture fichier hydratation' });
    }
  } catch (error) {
    console.error(`❌ Erreur sauvegarde hydratation ${req.params.userId}/${req.params.date}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde hydratation' });
  }
});

// Routes pour les mensurations
app.get('/api/mensurations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const mensurationData = userData?.mensurations || {};
    res.json(mensurationData);
  } catch (error) {
    console.error(`Erreur lecture mensurations utilisateur ${req.params.userId}:`, error);
    res.json({});
  }
});

app.post('/api/mensurations/:userId', async (req, res) => {
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

    userData.mensurations = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde mensurations utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde mensurations' });
  }
});

// Routes pour les données de forme
app.get('/api/forme/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const formeData = userData?.forme || {};
    const dayData = formeData[date] || null;

    res.json(dayData);
  } catch (error) {
    console.error(`Erreur récupération forme ${req.params.userId}/${req.params.date}:`, error);
    res.json(null);
  }
});

app.post('/api/forme/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (!userData.forme) {
      userData.forme = {};
    }

    userData.forme[date] = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde forme ${userId}/${date}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données forme' });
  }
});

// Routes pour les sports récents
app.get('/api/recent-sports/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userData = await readUserFile(userId, 'client');
    if (!userData) userData = await readUserFile(userId, 'coach');

    const recentSports = userData?.recentSports || [];
    res.json(recentSports);
  } catch (error) {
    console.error(`Erreur lecture sports récents utilisateur ${req.params.userId}:`, error);
    res.json([]);
  }
});

app.post('/api/recent-sports/:userId', async (req, res) => {
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

    userData.recentSports = req.body;
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde sports récents utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde sports récents' });
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

    // Sauvegarder les tokens dans le fichier Strava dédié
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

    // Récupérer les activités existantes s'il y en a
    let existingStravaData = await readStravaFile(userId);
    const existingActivities = existingStravaData?.activities || [];

    // Préparer les données complètes à sauvegarder
    const completeStravaData = {
      stravaIntegration: stravaIntegrationData,
      activities: existingActivities
    };

    // Sauvegarder dans le fichier Strava dédié
    await writeStravaFile(userId, completeStravaData);

    console.log('📂 [STRAVA_EXCHANGE] === ÉCRITURE FICHIER STRAVA DÉDIÉ ===');
    console.log('   - Chemin fichier:', path.join(STRAVA_DIR, `${userId}.json`));
    console.log('   - Activités existantes conservées:', existingActivities.length);

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

// Endpoint pour synchronisation manuelle Strava
app.post('/api/strava/sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 [SERVEUR] Synchronisation manuelle Strava pour: ${userId}`);

    // Récupérer les données Strava existantes
    let stravaData = await readStravaFile(userId);

    // Si pas de fichier Strava, essayer de récupérer les infos d'intégration depuis les données utilisateur
    if (!stravaData || !stravaData.stravaIntegration) {
      const userResult = await findUserById(userId);
      if (!userResult) {
        return res.status(404).json({ 
          success: false, 
          error: 'Utilisateur non trouvé' 
        });
      }

      const { userData } = userResult;
      stravaData = {
        stravaIntegration: userData.stravaIntegration || null,
        activities: []
      };
    }

    // Vérifier si Strava est connecté
    if (!stravaData.stravaIntegration || !stravaData.stravaIntegration.connected || !stravaData.stravaIntegration.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Strava non connecté' 
      });
    }

    // Récupérer les activités depuis Strava
    console.log('📡 [SERVEUR] Récupération activités Strava...');
    const stravaResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=50', {
      headers: {
        'Authorization': `Bearer ${stravaData.stravaIntegration.accessToken}`
      }
    });

    if (!stravaResponse.ok) {
      console.error('❌ [SERVEUR] Erreur API Strava:', stravaResponse.status, stravaResponse.statusText);
      return res.status(400).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des activités Strava' 
      });
    }

    const activities = await stravaResponse.json();
    console.log(`✅ [SERVEUR] ${activities.length} activités récupérées de Strava`);

    // Mettre à jour les données Strava
    stravaData.stravaIntegration.lastSync = new Date().toISOString();
    stravaData.activities = activities;

    // Sauvegarder dans le fichier Strava dédié
    await writeStravaFile(userId, stravaData);

    console.log(`💾 [SERVEUR] ${activities.length} activités sauvegardées dans Strava/${userId}.json`);

    // Debug: afficher quelques activités sauvegardées
    if (activities.length > 0) {
      console.log(`📋 [SERVEUR] Activités synchronisées pour ${userId}:`);
      activities.slice(0, 3).forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.name} - ${activity.start_date} (${activity.type || activity.sport_type})`);
      });
    }

    console.log(`✅ [SERVEUR] Synchronisation Strava terminée pour: ${userId}`);
    res.json({ 
      success: true, 
      message: 'Synchronisation réussie',
      activitiesCount: activities.length,
      lastSync: stravaData.stravaIntegration.lastSync
    });

  } catch (error) {
    console.error('❌ [SERVEUR] Erreur synchronisation Strava:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la synchronisation' 
    });
  }
});

// Endpoint pour déconnecter Strava
app.post('/api/strava/disconnect/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 [SERVEUR] Déconnexion Strava pour: ${userId}`);

    // Supprimer le fichier Strava dédié
    await deleteStravaFile(userId);
    console.log(`🗑️ [SERVEUR] Fichier Strava/${userId}.json supprimé`);

    // Chercher l'utilisateur pour nettoyer aussi ses données
    let userData = await readUserFile(userId, 'client');
    let userType = 'client';

    if (!userData) {
      userData = await readUserFile(userId, 'coach');
      userType = 'coach';
    }

    if (userData) {
      // Supprimer les données Strava du fichier utilisateur
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

      // Nettoyer toutes les anciennes structures
      if (userData.stravaTokens) {
        delete userData.stravaTokens;
      }
      if (userData.stravaActivities) {
        delete userData.stravaActivities;
      }
      if (userData.strava) {
        delete userData.strava;
      }

      userData.lastUpdated = new Date().toISOString();
      await writeUserFile(userId, userData, userType);

      console.log(`✅ [SERVEUR] Strava déconnecté complètement pour: ${userId}`);
      res.json({ success: true, message: 'Strava déconnecté avec succès' });
    } else {
      // Même si l'utilisateur n'est pas trouvé, le fichier Strava a été supprimé
      console.log(`✅ [SERVEUR] Fichier Strava supprimé pour: ${userId} (utilisateur non trouvé)`);
      res.json({ success: true, message: 'Strava déconnecté avec succès' });
    }
  } catch (error) {
    console.error('❌ [SERVEUR] Erreur déconnexion Strava:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Callback Strava - Route principale avec les vraies valeurs
app.get('/strava-callback', async (req, res) => {
  console.log('📥 [STRAVA] Callback reçu:', req.query);
  console.log('📥 [STRAVA] Headers reçus:', req.headers);
  console.log('📥 [STRAVA] URL complète:', req.url);
  console.log('📥 [STRAVA] Configuration utilisée:', {
    clientId: STRAVA_CLIENT_ID,
    clientSecret: STRAVA_CLIENT_SECRET ? '[PRÉSENT]' : '[MANQUANT]'
  });

  const { code, error, state } = req.query;

  // Gestion des erreurs
  if (error) {
    console.error('❌ [STRAVA] Erreur autorisation:', error);
    res.send(createCallbackPage('❌ Erreur', 'L\'autorisation Strava a échoué. Redirection vers l\'app...', '#FF6B6B', true));
    return; // Important de retourner ici pour ne pas exécuter la suite
  }

  if (!code || !state) {
    console.log('⚠️ [STRAVA] Paramètres manquants');
    res.send(createCallbackPage('⚠️ Paramètres manquants', 'Veuillez réessayer depuis l\'application. Redirection vers l\'app...', '#F5A623', true));
    return; // Important de retourner ici pour ne pas exécuter la suite
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
      console.error('❌ [STRAVA] Échec échange token:');
      console.error('   - Status:', tokenResponse.status);
      console.error('   - Response:', errorText);
      console.error('   - Headers:', Object.fromEntries(tokenResponse.headers.entries()));
      res.send(createCallbackPage('❌ Erreur OAuth', 'Échec de l\'échange de token avec Strava. Redirection vers l\'app...', '#FF6B6B', true));
      return; // Important de retourner ici
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

    // Utiliser la recherche robuste pour trouver l'utilisateur
    const userResult = await findUserById(userId);

    if (!userResult) {
      console.error('❌ [STRAVA] Utilisateur non trouvé pour le callback:', userId);
      res.send(createCallbackPage('❌ Utilisateur non trouvé', 'Impossible de trouver votre profil utilisateur. Redirection vers l\'app...', '#FF6B6B', true));
      return;
    }

    const { userData, userType } = userResult;

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

    await writeUserFile(userId, userData, userType);

    console.log('💾 [STRAVA] Données sauvées avec succès');

    // Page de succès avec redirection automatique vers l'app
    res.send(createCallbackPage('🎉 Connexion réussie !', 'Strava est maintenant connecté. Redirection vers l\'app...', '#28A745', true));
  } catch (error) {
    console.error('❌ [STRAVA] Erreur traitement callback:', error);
    res.send(createCallbackPage(
      '❌ Erreur de connexion', 
      'Une erreur est survenue lors de la connexion. Redirection vers l\'app...', 
      '#FF6B6B',
      true // Redirection automatique même en cas d'erreur
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