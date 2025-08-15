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

// Logging détaillé pour diagnostiquer les problèmes de routes
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 [${timestamp}] ${req.method} ${req.path}`);

  // Log spécial pour les routes d'hydratation
  if (req.path.includes('/api/water/')) {
    console.log(`💧 [WATER_REQUEST] Route hydratation détectée:`);
    console.log(`   - Method: ${req.method}`);
    console.log(`   - Path: ${req.path}`);
    console.log(`   - Params: ${JSON.stringify(req.params)}`);
    console.log(`   - Query: ${JSON.stringify(req.query)}`);
    if (req.method === 'POST') {
      console.log(`   - Body: ${JSON.stringify(req.body)}`);
    }
  }

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

app.get('/api/health-check', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Serveur VPS EatFitByMax opérationnel',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Fonction pour lire le fichier utilisateur dans la nouvelle structure (dossiers nom_prénom)
async function readUserFile(userId, userType = 'client') {
  try {
    const userDir = userType === 'coach' ? COACH_DIR : CLIENT_DIR;

    // Rechercher dans la nouvelle structure (dossiers nom_prénom)
    const folders = await fs.readdir(userDir);
    for (const folder of folders) {
      if (!folder.includes('_')) continue; // Ignorer les fichiers qui ne sont pas des dossiers nom_prénom

      const profilPath = path.join(userDir, folder, 'Info', 'profil.json');
      try {
        const data = await fs.readFile(profilPath, 'utf8');
        const userData = JSON.parse(data);
        if (userData.id === userId) {
          console.log(`📁 Utilisateur trouvé dans: ${folder}`);
          return userData;
        }
      } catch (e) {
        // Ignorer les erreurs de lecture de fichiers individuels
      }
    }

    return null; // Utilisateur non trouvé
  } catch (error) {
    return null;
  }
}

// Fonction pour rechercher un utilisateur par ID dans la nouvelle structure
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

  console.log('❌ [SEARCH_USER] Utilisateur non trouvé');
  return null;
}

// Fonction pour créer la structure de dossiers d'un utilisateur
async function createUserDirectoryStructure(userId, userData, userType = 'client') {
  try {
    const userDir = userType === 'coach' ? COACH_DIR : CLIENT_DIR;

    // Créer le nom du dossier : nom_prénom
    const folderName = `${userData.lastName || 'inconnu'}_${userData.firstName || 'inconnu'}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const userFolderPath = path.join(userDir, folderName);

    console.log(`📁 Création structure dossiers pour: ${folderName}`);

    // Créer tous les dossiers nécessaires
    const foldersToCreate = [
      userFolderPath,
      path.join(userFolderPath, 'Info'),
      path.join(userFolderPath, 'Strava'),
      path.join(userFolderPath, 'Health'),
      path.join(userFolderPath, 'Nutrition'),
      path.join(userFolderPath, 'Entrainements'),
      path.join(userFolderPath, 'Progrès'),
      path.join(userFolderPath, 'Forme')
    ];

    for (const folder of foldersToCreate) {
      await fs.mkdir(folder, { recursive: true });
    }

    // Créer les fichiers initiaux avec données par défaut
    const initialFiles = [
      // Info/
      {
        path: path.join(userFolderPath, 'Info', 'profil.json'),
        data: userData
      },
      {
        path: path.join(userFolderPath, 'Info', 'preferences-app.json'),
        data: {
          theme: 'system',
          language: 'fr',
          units: 'metric',
          notifications: true
        }
      },
      {
        path: path.join(userFolderPath, 'Info', 'integrations.json'),
        data: {
          appleHealth: { connected: false, permissions: [], lastSync: null },
          strava: { connected: false, lastSync: null, athleteId: null }
        }
      },
      {
        path: path.join(userFolderPath, 'Info', 'messages.json'),
        data: []
      },
      {
        path: path.join(userFolderPath, 'Info', 'notifications.json'),
        data: {
          pushNotifications: true,
          mealReminders: true,
          workoutReminders: true,
          progressUpdates: true,
          coachMessages: true,
          weeklyReports: true,
          soundEnabled: true,
          vibrationEnabled: true
        }
      },
      {
        path: path.join(userFolderPath, 'Info', 'notification-times.json'),
        data: {
          breakfast: { hour: 8, minute: 0 },
          lunch: { hour: 12, minute: 30 },
          dinner: { hour: 19, minute: 0 },
          workout: { hour: 18, minute: 0 }
        }
      },
      // Strava/
      {
        path: path.join(userFolderPath, 'Strava', 'compte.json'),
        data: { connected: false }
      },
      {
        path: path.join(userFolderPath, 'Strava', 'activites.json'),
        data: []
      },
      // Health/
      {
        path: path.join(userFolderPath, 'Health', 'health.json'),
        data: []
      },
      // Nutrition/
      {
        path: path.join(userFolderPath, 'Nutrition', 'aliments.json'),
        data: []
      },
      // Entrainements/
      {
        path: path.join(userFolderPath, 'Entrainements', 'entrainements.json'),
        data: []
      },
      // Progrès/
      {
        path: path.join(userFolderPath, 'Progrès', 'poids.json'),
        data: {
          startWeight: userData.weight || 0,
          currentWeight: userData.weight || 0,
          targetWeight: 0,
          lastWeightUpdate: null,
          targetAsked: false,
          weightHistory: []
        }
      },
      {
        path: path.join(userFolderPath, 'Progrès', 'mensurations.json'),
        data: {}
      },
      // Forme/
      {
        path: path.join(userFolderPath, 'Forme', 'sommeil-fatigue.json'),
        data: { globalData: {} }
      }
    ];

    // Écrire tous les fichiers initiaux
    for (const file of initialFiles) {
      await fs.writeFile(file.path, JSON.stringify(file.data, null, 2));
    }

    console.log(`✅ Structure créée avec succès: ${folderName}`);
    return { folderName, userFolderPath };
  } catch (error) {
    console.error(`❌ Erreur création structure utilisateur ${userId}:`, error);
    throw error;
  }
}

// Fonction pour écrire le fichier utilisateur (mise à jour)
async function writeUserFile(userId, userData, userType = 'client') {
  try {
    const userDir = userType === 'coach' ? COACH_DIR : CLIENT_DIR;
    const folderName = `${userData.lastName || 'inconnu'}_${userData.firstName || 'inconnu'}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const userFolderPath = path.join(userDir, folderName);
    const profilPath = path.join(userFolderPath, 'Info', 'profil.json');

    // Mettre à jour le profil dans la structure
    await fs.writeFile(profilPath, JSON.stringify(userData, null, 2));
    console.log(`📁 Profil mis à jour dans la structure: ${folderName}`);
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
    const folders = await fs.readdir(userDir);
    const users = [];

    for (const folder of folders) {
      if (folder.includes('_')) { // Dossiers nom_prénom
        const profilPath = path.join(userDir, folder, 'Info', 'profil.json');
        try {
          const data = await fs.readFile(profilPath, 'utf8');
          const userData = JSON.parse(data);
          users.push(userData);
        } catch (e) {
          // Ignorer les erreurs de lecture
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
        // Créer la structure de dossiers lors de la création
        await createUserDirectoryStructure(client.id, client, 'client');
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
        // Créer la structure de dossiers lors de la création
        await createUserDirectoryStructure(coach.id, coach, 'coach');
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

    const userResult = await findUserById(userId);

    if (!userResult) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const { userData, userType } = userResult;
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

// Route pour créer la structure de dossiers d'un utilisateur
app.post('/api/create-user-structure', async (req, res) => {
  try {
    const { userId, userData, userType } = req.body;

    if (!userId || !userData) {
      return res.status(400).json({ error: 'userId et userData requis' });
    }

    const result = await createUserDirectoryStructure(userId, userData, userType || 'client');

    console.log(`✅ Structure créée via API pour: ${result.folderName}`);
    res.json({ 
      success: true, 
      folderName: result.folderName, 
      message: 'Structure de dossiers créée avec succès' 
    });

  } catch (error) {
    console.error('❌ Erreur création structure via API:', error);
    res.status(500).json({ error: 'Erreur création structure utilisateur' });
  }
});

// Démarrage du serveur
async function startServer() {
  try {
    await ensureDataDirs();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur EatFitByMax démarré sur le port ${PORT}`);
      console.log(`🌐 API disponible sur: https://eatfitbymax.cloud`);
      console.log(`✅ Nouvelle structure: {nom_prénom} avec dossiers organisés`);
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

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

startServer();