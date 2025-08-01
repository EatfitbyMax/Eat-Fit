// Charger les variables d'environnement en premier
require('dotenv').config();

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

// Fake data storage
let users = [];
let coaches = [];

// Utility function to load users (clients) from memory
const loadUsers = async () => {
  try {
    const users = await readJsonFile('users.json', []);
    return users;
  } catch (error) {
    console.error('Error loading users from file:', error);
    return [];
  }
};

// Utility function to save users (clients) to memory
const saveUsers = async (updatedUsers) => {
  try {
    await writeJsonFile('users.json', updatedUsers);
  } catch (error) {
    console.error('Error saving users to file:', error);
  }
};

// Utility function to load coaches from memory
const loadCoaches = async () => {
  try {
    const coaches = await readJsonFile('coaches.json', []);
    return coaches;
  } catch (error) {
    console.error('Error loading coaches from file:', error);
    return [];
  }
};

// Utility function to save coaches to memory
const saveCoaches = async (updatedCoaches) => {
  try {
    await writeJsonFile('coaches.json', updatedCoaches);
  } catch (error) {
    console.error('Error saving coaches to file:', error);
  }
};

// Routes pour les utilisateurs (clients uniquement)
app.get('/api/users', async (req, res) => {
  try {
    const users = await loadUsers();
    // Filtrer pour ne retourner que les clients
    const clients = users.filter(user => user.userType === 'client' || !user.userType);
    console.log(`📊 Récupération clients: ${clients.length} clients trouvés`);
    res.json(clients);
  } catch (error) {
    console.error('Erreur lecture clients:', error);
    console.log('📝 Initialisation d\'une liste de clients vide');
    res.json([]);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    // Filtrer pour ne sauvegarder que les clients
    const allUsers = Array.isArray(req.body) ? req.body : [req.body];
    const clients = allUsers.filter(user => user.userType === 'client' || !user.userType);
    
    await saveUsers(clients);
    console.log('💾 Sauvegarde clients:', clients.length);
    console.log('✅ Clients sauvegardés avec succès');
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde clients:', error);
    res.status(500).json({ error: 'Erreur sauvegarde clients' });
  }
});

// Routes pour les coaches
app.get('/api/coaches', async (req, res) => {
  try {
    const coaches = await loadCoaches();
    console.log(`👨‍💼 Récupération coaches: ${coaches.length} coaches trouvés`);
    res.json(coaches);
  } catch (error) {
    console.error('Erreur lecture coaches:', error);
    console.log('📝 Initialisation d\'une liste de coaches vide');
    res.json([]);
  }
});

app.post('/api/coaches', async (req, res) => {
  try {
    await saveCoaches(req.body);
    console.log('💾 Sauvegarde coaches:', Array.isArray(req.body) ? req.body.length : 'format invalide');
    console.log('✅ Coaches sauvegardés avec succès');
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde coaches:', error);
    res.status(500).json({ error: 'Erreur sauvegarde coaches' });
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

// Route pour sauvegarder les préférences d'application
app.post('/api/app-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    console.log(`📱 Sauvegarde préférences app pour utilisateur ${userId}:`, preferences);

    // Charger les clients et coaches
    const users = await loadUsers();
    const coaches = await loadCoaches();
    
    // Chercher dans les clients
    let userIndex = users.findIndex(user => user.id === userId);
    let isCoach = false;
    
    // Si pas trouvé dans les clients, chercher dans les coaches
    if (userIndex === -1) {
      userIndex = coaches.findIndex(coach => coach.id === userId);
      isCoach = true;
    }

    if (userIndex === -1) {
      console.error(`❌ Utilisateur ${userId} non trouvé pour sauvegarde préférences app`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les préférences
    if (isCoach) {
      coaches[userIndex].appPreferences = preferences;
      coaches[userIndex].lastUpdated = new Date().toISOString();
      await saveCoaches(coaches);
    } else {
      users[userIndex].appPreferences = preferences;
      users[userIndex].lastUpdated = new Date().toISOString();
      await saveUsers(users);
    }

    console.log(`✅ Préférences app sauvegardées pour ${userId}`);
    res.json({ success: true, message: 'Préférences sauvegardées' });

  } catch (error) {
    console.error('❌ Erreur sauvegarde préférences app:', error);
    res.status(500).json({ error: 'Erreur sauvegarde préférences app' });
  }
});

// Routes pour les paramètres de notifications (compatibilité ancienne API)
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔔 Récupération paramètres notifications pour utilisateur ${userId}`);

    // Paramètres par défaut (notifications activées par défaut)
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

    // Charger les clients et coaches
    const users = await loadUsers();
    const coaches = await loadCoaches();
    
    // Chercher l'utilisateur dans les deux listes
    let user = users.find(user => user.id === userId);
    if (!user) {
      user = coaches.find(coach => coach.id === userId);
    }

    if (!user) {
      console.log(`⚠️ Utilisateur ${userId} non trouvé, création avec paramètres par défaut`);
      return res.json(defaultSettings);
    }

    // Retourner les paramètres de notification ou les paramètres par défaut
    const notificationSettings = user.notificationSettings || defaultSettings;
    console.log(`✅ Paramètres notifications récupérés pour ${userId}:`, notificationSettings);
    res.json(notificationSettings);

  } catch (error) {
    console.error('❌ Erreur récupération paramètres notifications:', error);
    res.status(500).json({ error: 'Erreur récupération paramètres notifications' });
  }
});

app.post('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;

    console.log(`🔔 Sauvegarde paramètres notifications pour utilisateur ${userId}:`, settings);

    // Charger les clients et coaches
    const users = await loadUsers();
    const coaches = await loadCoaches();
    
    // Chercher dans les clients
    let userIndex = users.findIndex(user => user.id === userId);
    let isCoach = false;
    
    // Si pas trouvé dans les clients, chercher dans les coaches
    if (userIndex === -1) {
      userIndex = coaches.findIndex(coach => coach.id === userId);
      isCoach = true;
    }

    if (userIndex === -1) {
      console.log(`⚠️ Utilisateur ${userId} non trouvé, impossible de sauvegarder les paramètres notifications`);
      return res.status(404).json({ error: 'Utilisateur non trouvé. Les paramètres de notifications ne peuvent pas être sauvegardés.' });
    }

    // Mettre à jour les paramètres de notifications
    if (isCoach) {
      coaches[userIndex].notificationSettings = settings;
      coaches[userIndex].lastUpdated = new Date().toISOString();
      await saveCoaches(coaches);
    } else {
      users[userIndex].notificationSettings = settings;
      users[userIndex].lastUpdated = new Date().toISOString();
      await saveUsers(users);
    }

    console.log(`✅ Paramètres notifications sauvegardés pour ${userId}`);
    res.json({ success: true, message: 'Paramètres notifications sauvegardés' });

  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres notifications:', error);
    res.status(500).json({ error: 'Erreur sauvegarde paramètres notifications' });
  }
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Paiements gérés exclusivement par Apple App Store via In-App Purchases

// Routes pour les intégrations Strava
app.post('/api/strava/exchange-token', async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code et userId requis' });
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
      The code adds new endpoints for managing notification settings, including retrieval, saving, and testing.      </html>
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

// API d'inscription coach
app.post('/api/coach-register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, city, country, diplomas, specialties, experience, terms } = req.body;

    console.log('👨‍💼 Nouvelle inscription coach:', email);

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !password || !city || !country || !diplomas || !specialties || !experience || !terms) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Validation mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Récupérer les coaches existants
    const coaches = await loadCoaches();
    
    // Récupérer aussi les clients pour vérifier les doublons d'email
    const users = await loadUsers();

    // Vérifier si l'email existe déjà (chez les coaches et les clients)
    const existingCoach = coaches.find(c => c.email.toLowerCase() === email.toLowerCase());
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingCoach || existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cette adresse email existe déjà'
      });
    }

    // Hacher le mot de passe avec le système unifié
    const crypto = require('crypto');
    const passwordString = String(password).trim();
    const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
    const hashedPassword = crypto.createHash('sha256').update(saltedPassword).digest('hex');

    // Créer le nouveau coach - compte actif immédiatement
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
      emailVerified: true, // Directement vérifié
      status: 'active', // Compte actif immédiatement
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Ajouter à la liste des coaches
    coaches.push(newCoach);
    await saveCoaches(coaches);

    console.log('✅ Coach inscrit avec succès (compte actif):', email);
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



// ========================================
// 🔔 GESTION DES NOTIFICATIONS
// ========================================

// Récupérer les paramètres de notifications d'un utilisateur (nouvelle API)
app.get('/api/notifications/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔔 [SETTINGS] Récupération paramètres notifications pour utilisateur: ${userId}`);

    // Paramètres par défaut
    const defaultSettings = {
      pushNotifications: true,
      mealReminders: true,
      workoutReminders: true,
      progressUpdates: true,
      coachMessages: true,
      weeklyReports: true,
      soundEnabled: true,
      vibrationEnabled: true
    };

    // Chercher les paramètres personnalisés dans les données utilisateur
    const users = await loadUsers();
    const coaches = await loadCoaches();
    
    // Chercher l'utilisateur dans les deux listes
    let user = users.find(u => u.id === userId);
    if (!user) {
      user = coaches.find(c => c.id === userId);
    }

    if (user && user.notificationSettings) {
      console.log('✅ [SETTINGS] Paramètres notifications personnalisés trouvés');
      res.json({
        success: true,
        settings: { ...defaultSettings, ...user.notificationSettings }
      });
    } else {
      console.log('📝 [SETTINGS] Utilisation des paramètres notifications par défaut');
      res.json({
        success: true,
        settings: defaultSettings
      });
    }
  } catch (error) {
    console.error('❌ [SETTINGS] Erreur récupération paramètres notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des paramètres'
    });
  }
});

// Sauvegarder les paramètres de notifications d'un utilisateur (nouvelle API)
app.post('/api/notifications/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { settings } = req.body;

    console.log(`🔔 [SETTINGS] Sauvegarde paramètres notifications pour utilisateur: ${userId}`, settings);

    const users = await loadUsers();
    const coaches = await loadCoaches();
    
    // Chercher dans les clients
    let userIndex = users.findIndex(u => u.id === userId);
    let isCoach = false;
    
    // Si pas trouvé dans les clients, chercher dans les coaches
    if (userIndex === -1) {
      userIndex = coaches.findIndex(c => c.id === userId);
      isCoach = true;
    }

    if (userIndex === -1) {
      console.log(`⚠️ [SETTINGS] Utilisateur ${userId} non trouvé`);
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les paramètres de notifications
    if (isCoach) {
      coaches[userIndex].notificationSettings = settings;
      coaches[userIndex].lastUpdated = new Date().toISOString();
      await saveCoaches(coaches);
    } else {
      users[userIndex].notificationSettings = settings;
      users[userIndex].lastUpdated = new Date().toISOString();
      await saveUsers(users);
    }

    console.log(`✅ [SETTINGS] Paramètres notifications sauvegardés pour ${userId}`);
    res.json({
      success: true,
      message: 'Paramètres notifications mis à jour'
    });
  } catch (error) {
    console.error('❌ [SETTINGS] Erreur sauvegarde paramètres notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la sauvegarde'
    });
  }
});



// ========================================
// 🔧 DIAGNOSTIC ET TEST DES CONNEXIONS
// ========================================

// Route de diagnostic pour tester les connexions
app.post('/api/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    console.log(`🔍 [DEBUG] Tentative de diagnostic pour: ${email}`);

    // Charger tous les utilisateurs
    const users = await loadUsers();
    const coaches = await loadCoaches();
    const allUsers = [...users, ...coaches];

    // Trouver l'utilisateur
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.json({
        found: false,
        message: 'Utilisateur non trouvé',
        totalUsers: allUsers.length,
        emails: allUsers.map(u => u.email)
      });
    }

    // Informations de diagnostic
    const diagnostic = {
      found: true,
      userType: user.userType,
      hasPassword: !!user.password,
      hasHashedPassword: !!user.hashedPassword,
      hashLength: user.hashedPassword ? user.hashedPassword.length : 0,
      hashSample: user.hashedPassword ? user.hashedPassword.substring(0, 10) + '...' : null,
      status: user.status || 'non défini'
    };

    // Test des différents systèmes de hash
    const passwordString = String(password).trim();
    const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
    
    const tests = {
      plainText: user.password === password,
      currentSystem: false,
      legacyBase64: false,
      legacyMD5: false
    };

    if (user.hashedPassword) {
      // Test système actuel
      const currentHash = crypto.createHash('sha256').update(saltedPassword).digest('hex');
      tests.currentSystem = currentHash === user.hashedPassword;

      // Test ancien système Base64 (simulé)
      if (user.hashedPassword.length === 44) {
        tests.legacyBase64 = true; // Marqueur
      }

      // Test ancien système MD5
      if (user.hashedPassword.length === 32) {
        const md5Hash = crypto.createHash('md5').update(passwordString).digest('hex');
        const md5SaltHash = crypto.createHash('md5').update(saltedPassword).digest('hex');
        tests.legacyMD5 = md5Hash === user.hashedPassword || md5SaltHash === user.hashedPassword;
      }
    }

    res.json({
      ...diagnostic,
      passwordTests: tests,
      recommendation: tests.currentSystem ? 'Connexion OK' : 
                     tests.plainText ? 'Migration nécessaire depuis mot de passe clair' :
                     tests.legacyMD5 ? 'Migration nécessaire depuis MD5' :
                     tests.legacyBase64 ? 'Migration nécessaire depuis Base64' :
                     'Mot de passe incorrect ou système non reconnu'
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erreur diagnostic:', error);
    res.status(500).json({ error: 'Erreur serveur diagnostic' });
  }
});

// ========================================
// 🔄 GESTION DES MISES À JOUR EAS
// ========================================

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
async function startServer() {
  try {
    await ensureDataDir();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur EatFitByMax démarré sur le port ${PORT}`);
      console.log(`🌐 API disponible sur: https://eatfitbymax.cloud`);
      console.log(`✅ Serveur prêt à recevoir des connexions sur 0.0.0.0:${PORT}`);

      // Serveur prêt pour VPS
      console.log('📡 Serveur VPS configuré et en ligne');
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