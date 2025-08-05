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
    // Pour l'instant, retourner les valeurs par défaut
    // Plus tard, vous pourrez récupérer depuis une base de données
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
    // Pour l'instant, juste confirmer la sauvegarde
    // Plus tard, vous pourrez sauvegarder dans une base de données
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

    // Supprimer aussi les fichiers de tokens Strava s'ils existent
    try {
      const stravaTokenPath = path.join(DATA_DIR, `strava_tokens_${userId}.json`);
      await fs.unlink(stravaTokenPath);
      console.log(`🗑️ Tokens Strava supprimés pour: ${userId}`);
    } catch (stravaError) {
      // Ignorer si le fichier n'existe pas
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

// Routes d'intégrations
app.post('/api/strava/exchange-token', async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code et userId requis' });
    }

    // Vérifier la configuration Strava
    if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
      console.error('❌ Configuration Strava manquante sur le serveur');
      return res.status(500).json({ error: 'Configuration Strava manquante sur le serveur' });
    }

    console.log('🔄 Échange du code Strava pour utilisateur:', userId);

    // Échanger le code contre un token d'accès
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Erreur lors de l\'authentification Strava');
    }

    const tokenData = await tokenResponse.json();

    // Sauvegarder les tokens
    const tokenFilePath = `strava_tokens_${userId}.json`;
    await writeJsonFile(tokenFilePath, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      athlete: tokenData.athlete,
      connected: true
    });

    console.log('✅ Tokens Strava sauvegardés pour utilisateur:', userId);
    res.json({ success: true, athlete: tokenData.athlete });
  } catch (error) {
    console.error('❌ Erreur échange token Strava:', error);
    res.status(500).json({ error: 'Erreur échange token Strava' });
  }
});

app.get('/api/strava/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tokenData = await readJsonFile(`strava_tokens_${userId}.json`, null);

    if (tokenData && tokenData.connected) {
      res.json({ 
        connected: true, 
        athlete: tokenData.athlete,
        lastSync: null 
      });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('❌ Erreur statut Strava:', error);
    res.json({ connected: false });
  }
});

// Callback Strava - Route principale
app.get('/strava-callback', async (req, res) => {
  const { code, error, state } = req.query;

  console.log('🔗 Callback Strava reçu:', { 
    code: code ? code.substring(0, 10) + '...' : 'aucun',
    error: error || 'aucune',
    state: state || 'aucun',
    url: req.url
  });

  if (error) {
    console.error('❌ Erreur callback Strava:', error);
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Erreur Strava</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">❌ Erreur de connexion Strava</h2>
            <p>Une erreur s'est produite lors de la connexion à Strava.</p>
            <p><strong>Erreur:</strong> ${error}</p>
            <p style="margin-top: 30px;">Vous pouvez fermer cette fenêtre et réessayer dans l'application.</p>
          </div>
        </body>
      </html>
    `);
  }

  if (code) {
    console.log('✅ Code d\'autorisation Strava reçu avec succès');

    // Si nous avons un state (userId), traiter immédiatement le token
    if (state) {
      try {
        console.log('🔄 Traitement automatique du token pour utilisateur:', state);

        // Échanger le code contre un token d'accès
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code'
          })
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();

          // Sauvegarder les tokens
          const tokenFilePath = `strava_tokens_${state}.json`;
          await writeJsonFile(tokenFilePath, {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: tokenData.expires_at,
            athlete: tokenData.athlete,
            connected: true
          });

          console.log('✅ Tokens Strava sauvegardés automatiquement pour utilisateur:', state);
        }
      } catch (error) {
        console.error('❌ Erreur traitement automatique token:', error);
      }
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Connexion Strava réussie</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
            <h2 style="color: #FC4C02;">🎉 Connexion Strava réussie!</h2>
            <p>Votre compte Strava a été connecté avec succès à <strong>EatFit By Max</strong>.</p>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>Code d'autorisation:</strong><br>
              <code style="font-size: 12px; color: #666;">${code.substring(0, 15)}...</code>
            </p>
            <div style="border: 2px dashed #28a745; padding: 20px; border-radius: 8px; background: #f8fff8; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #28a745;">
                ✓ Vous pouvez maintenant fermer cette fenêtre et retourner dans l'application mobile.
              </p>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #1976d2;">
                💡 <strong>Instructions:</strong><br>
                1. Fermez cette fenêtre<br>
                2. Retournez dans l'app EatFit By Max<br>
                3. Votre connexion Strava sera automatiquement mise à jour
              </p>
            </div>
            <button onclick="window.close()" style="background: #FC4C02; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">
              Fermer cette fenêtre
            </button>
          </div>
          <script>
            console.log('📱 Code Strava reçu et traité côté serveur');

            // Tentative de redirection vers l'app (optionnel)
            setTimeout(() => {
              try {
                window.location.href = 'eatfitbymax://strava-success';
              } catch (e) {
                console.log('⚠️ Redirection deep link non supportée');
              }
            }, 1000);
          </script>
        </body>
      </html>
    `);
  }

  // Cas où ni code ni erreur ne sont présents
  console.warn('⚠️ Callback Strava sans paramètres valides');
  res.status(400).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paramètres manquants</title>
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
          <h2 style="color: #f39c12;">⚠️ Paramètres manquants</h2>
          <p>Les paramètres de callback Strava sont manquants.</p>
          <p style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>URL reçue:</strong><br>
            <code style="font-size: 12px; word-break: break-all;">${req.url}</code>
          </p>
          <p>Veuillez réessayer la connexion depuis l'application mobile.</p>
        </div>
      </body>
    </html>
  `);
});




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