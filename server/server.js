
// Charger les variables d'environnement en premier
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const CLIENTS_DIR = path.join(DATA_DIR, 'clients');
const COACHES_DIR = path.join(DATA_DIR, 'coaches');

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
    await fs.mkdir(CLIENTS_DIR, { recursive: true });
    await fs.mkdir(COACHES_DIR, { recursive: true });
    console.log('📁 Structure de répertoires vérifiée');
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

// Fonctions utilitaires pour la gestion des fichiers utilisateur
async function getUserFilePath(userId, userType = null) {
  if (!userType) {
    // Essayer de déterminer le type d'utilisateur
    const clientPath = path.join(CLIENTS_DIR, `${userId}.json`);
    const coachPath = path.join(COACHES_DIR, `${userId}.json`);
    
    try {
      await fs.access(clientPath);
      return { filePath: clientPath, userType: 'client' };
    } catch {
      try {
        await fs.access(coachPath);
        return { filePath: coachPath, userType: 'coach' };
      } catch {
        return { filePath: null, userType: null };
      }
    }
  }
  
  const dir = userType === 'coach' ? COACHES_DIR : CLIENTS_DIR;
  return { filePath: path.join(dir, `${userId}.json`), userType };
}

async function readUserData(userId, userType = null) {
  try {
    const { filePath } = await getUserFilePath(userId, userType);
    if (!filePath) return null;
    
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeUserData(userId, userData, userType) {
  try {
    const { filePath } = await getUserFilePath(userId, userType);
    userData.lastUpdated = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
    return true;
  } catch (error) {
    console.error(`Erreur écriture données utilisateur ${userId}:`, error);
    throw error;
  }
}

async function createDefaultUserData(userId, basicUserInfo, userType) {
  const defaultData = {
    // Informations de base
    ...basicUserInfo,
    id: userId,
    userType: userType,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    
    // Données spécifiques selon le type
    ...(userType === 'client' ? {
      nutrition: [],
      workouts: [],
      health: [],
      weight: {
        startWeight: basicUserInfo.weight || 0,
        currentWeight: basicUserInfo.weight || 0,
        targetWeight: 0,
        lastWeightUpdate: null,
        targetAsked: false,
        weightHistory: []
      },
      messages: [],
      integrations: {
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
      },
      recentSports: [],
      activityRatings: {},
      notificationSettings: {
        pushNotifications: true,
        mealReminders: true,
        workoutReminders: true,
        progressUpdates: true,
        coachMessages: true,
        weeklyReports: true,
        soundEnabled: true,
        vibrationEnabled: true
      },
      appPreferences: {}
    } : {
      // Données pour coaches
      clients: [],
      programmes: [],
      messages: [],
      rdv: [],
      notificationSettings: {
        pushNotifications: true,
        clientMessages: true,
        rdvReminders: true,
        soundEnabled: true,
        vibrationEnabled: true
      },
      appPreferences: {}
    })
  };
  
  await writeUserData(userId, defaultData, userType);
  return defaultData;
}

// Routes pour récupérer tous les utilisateurs (compatibilité)
app.get('/api/users', async (req, res) => {
  try {
    const files = await fs.readdir(CLIENTS_DIR);
    const clients = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(CLIENTS_DIR, file);
          const data = await fs.readFile(filePath, 'utf8');
          const userData = JSON.parse(data);
          // Retourner seulement les infos de base pour la liste
          clients.push({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            firstName: userData.firstName,
            lastName: userData.lastName,
            userType: userData.userType,
            goals: userData.goals,
            gender: userData.gender,
            age: userData.age,
            height: userData.height,
            weight: userData.weight,
            activityLevel: userData.activityLevel,
            favoriteSport: userData.favoriteSport,
            hashedPassword: userData.hashedPassword,
            password: userData.password,
            needsPasswordReset: userData.needsPasswordReset
          });
        } catch (error) {
          console.error(`Erreur lecture client ${file}:`, error);
        }
      }
    }
    
    console.log(`📊 Récupération clients: ${clients.length} clients trouvés`);
    res.json(clients);
  } catch (error) {
    console.error('Erreur lecture clients:', error);
    res.json([]);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const users = Array.isArray(req.body) ? req.body : [req.body];
    const clients = users.filter(user => user.userType === 'client' || !user.userType);
    
    for (const client of clients) {
      if (client.id) {
        const existingData = await readUserData(client.id, 'client');
        if (existingData) {
          // Mettre à jour les données existantes
          const updatedData = { ...existingData, ...client };
          await writeUserData(client.id, updatedData, 'client');
        } else {
          // Créer nouvelles données
          await createDefaultUserData(client.id, client, 'client');
        }
      }
    }
    
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
    const files = await fs.readdir(COACHES_DIR);
    const coaches = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(COACHES_DIR, file);
          const data = await fs.readFile(filePath, 'utf8');
          const userData = JSON.parse(data);
          // Retourner seulement les infos de base pour la liste
          coaches.push({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            firstName: userData.firstName,
            lastName: userData.lastName,
            userType: userData.userType,
            city: userData.city,
            country: userData.country,
            diplomas: userData.diplomas,
            specialites: userData.specialites,
            experience: userData.experience,
            hashedPassword: userData.hashedPassword,
            status: userData.status,
            emailVerified: userData.emailVerified
          });
        } catch (error) {
          console.error(`Erreur lecture coach ${file}:`, error);
        }
      }
    }
    
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
        const existingData = await readUserData(coach.id, 'coach');
        if (existingData) {
          // Mettre à jour les données existantes
          const updatedData = { ...existingData, ...coach };
          await writeUserData(coach.id, updatedData, 'coach');
        } else {
          // Créer nouvelles données
          await createDefaultUserData(coach.id, coach, 'coach');
        }
      }
    }
    
    console.log('✅ Coaches sauvegardés avec succès');
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde coaches:', error);
    res.status(500).json({ error: 'Erreur sauvegarde coaches' });
  }
});

// Routes pour les données spécifiques aux utilisateurs
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData(userId);
    
    if (userData && userData.messages) {
      res.json(userData.messages);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(`Erreur lecture messages utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = req.body;
    
    const userData = await readUserData(userId);
    if (userData) {
      userData.messages = messages;
      await writeUserData(userId, userData, userData.userType);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error(`Erreur sauvegarde messages utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde messages' });
  }
});

// Routes pour les données de santé Apple Health
app.get('/api/health/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData(userId);
    
    if (userData && userData.health) {
      res.json(userData.health);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(`Erreur lecture données santé utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/health/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const healthData = req.body;
    
    const userData = await readUserData(userId);
    if (userData) {
      userData.health = healthData;
      await writeUserData(userId, userData, userData.userType);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error(`Erreur sauvegarde données santé utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données Apple Health' });
  }
});

// Routes pour les entraînements
app.get('/api/workouts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData(userId);
    
    if (userData && userData.workouts) {
      res.json(userData.workouts);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(`Erreur lecture entraînements utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/workouts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const workouts = req.body;
    
    const userData = await readUserData(userId);
    if (userData) {
      userData.workouts = workouts;
      await writeUserData(userId, userData, userData.userType);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error(`Erreur sauvegarde entraînements utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde entraînements' });
  }
});

// Routes pour les données nutritionnelles
app.get('/api/nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData(userId);
    
    if (userData && userData.nutrition) {
      res.json(userData.nutrition);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(`Erreur lecture nutrition utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const nutrition = req.body;
    
    const userData = await readUserData(userId);
    if (userData) {
      userData.nutrition = nutrition;
      await writeUserData(userId, userData, userData.userType);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error(`Erreur sauvegarde nutrition utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données nutrition' });
  }
});

// Routes pour les données de poids
app.get('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData(userId);
    
    if (userData && userData.weight) {
      res.json(userData.weight);
    } else {
      const defaultWeight = {
        startWeight: 0,
        currentWeight: 0,
        targetWeight: 0,
        lastWeightUpdate: null,
        targetAsked: false,
        weightHistory: []
      };
      res.json(defaultWeight);
    }
  } catch (error) {
    console.error(`Erreur lecture poids utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const weightData = req.body;
    
    const userData = await readUserData(userId);
    if (userData) {
      userData.weight = weightData;
      await writeUserData(userId, userData, userData.userType);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error(`Erreur sauvegarde poids utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données poids' });
  }
});

// Routes pour les intégrations
app.get('/api/integrations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData(userId);
    
    if (userData && userData.integrations) {
      res.json(userData.integrations);
    } else {
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
      res.json(defaultIntegrations);
    }
  } catch (error) {
    console.error(`Erreur lecture intégrations utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur intégrations' });
  }
});

app.post('/api/integrations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const integrationStatus = req.body;
    
    const userData = await readUserData(userId);
    if (userData) {
      userData.integrations = integrationStatus;
      await writeUserData(userId, userData, userData.userType);
      res.json({ success: true, message: 'Intégrations sauvegardées' });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error(`Erreur sauvegarde intégrations utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur sauvegarde intégrations' });
  }
});

// Routes pour les paramètres de notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData(userId);
    
    if (userData && userData.notificationSettings) {
      res.json(userData.notificationSettings);
    } else {
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
      res.json(defaultSettings);
    }
  } catch (error) {
    console.error('❌ Erreur récupération paramètres notifications:', error);
    res.status(500).json({ error: 'Erreur récupération paramètres notifications' });
  }
});

app.post('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;
    
    const userData = await readUserData(userId);
    if (userData) {
      userData.notificationSettings = settings;
      await writeUserData(userId, userData, userData.userType);
      res.json({ success: true, message: 'Paramètres notifications sauvegardés' });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres notifications:', error);
    res.status(500).json({ error: 'Erreur sauvegarde paramètres notifications' });
  }
});

// Routes pour les préférences d'application
app.post('/api/app-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    
    const userData = await readUserData(userId);
    if (userData) {
      userData.appPreferences = preferences;
      await writeUserData(userId, userData, userData.userType);
      res.json({ success: true, message: 'Préférences sauvegardées' });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde préférences app:', error);
    res.status(500).json({ error: 'Erreur sauvegarde préférences app' });
  }
});

// Routes pour les programmes (stockage global)
app.get('/api/programmes', async (req, res) => {
  try {
    const programmesPath = path.join(DATA_DIR, 'programmes.json');
    try {
      const data = await fs.readFile(programmesPath, 'utf8');
      const programmes = JSON.parse(data);
      res.json(programmes);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json([]);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Erreur lecture programmes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
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

// Routes pour les données Strava
app.get('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData(userId);
    
    if (userData && userData.stravaData) {
      res.json(userData.stravaData);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(`Erreur lecture données Strava utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stravaData = req.body;
    
    const userData = await readUserData(userId);
    if (userData) {
      userData.stravaData = stravaData;
      await writeUserData(userId, userData, userData.userType);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    console.error(`Erreur sauvegarde données Strava utilisateur ${userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données Strava' });
  }
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

    // Vérifier si l'email existe déjà
    const existingClientFiles = await fs.readdir(CLIENTS_DIR);
    const existingCoachFiles = await fs.readdir(COACHES_DIR);
    
    for (const file of [...existingClientFiles, ...existingCoachFiles]) {
      if (file.endsWith('.json')) {
        try {
          const filePath = file.startsWith('client') 
            ? path.join(CLIENTS_DIR, file) 
            : path.join(COACHES_DIR, file);
          const data = await fs.readFile(filePath, 'utf8');
          const userData = JSON.parse(data);
          
          if (userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
            return res.status(400).json({
              success: false,
              message: 'Un compte avec cette adresse email existe déjà'
            });
          }
        } catch (error) {
          // Ignorer les erreurs de lecture de fichiers individuels
        }
      }
    }

    // Hacher le mot de passe
    const crypto = require('crypto');
    const passwordString = String(password).trim();
    const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
    const hashedPassword = crypto.createHash('sha256').update(saltedPassword).digest('hex');

    // Créer le nouveau coach
    const newCoachId = Date.now().toString();
    const newCoachData = {
      id: newCoachId,
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
      lastUpdated: new Date().toISOString()
    };

    // Créer le fichier avec toutes les données par défaut
    await createDefaultUserData(newCoachId, newCoachData, 'coach');

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

// Routes Strava
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

    // Sauvegarder dans les données utilisateur
    const userData = await readUserData(userId);
    if (userData) {
      if (!userData.stravaTokens) userData.stravaTokens = {};
      userData.stravaTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at,
        athlete: tokenData.athlete,
        connected: true
      };
      await writeUserData(userId, userData, userData.userType);
    }

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
    const userData = await readUserData(userId);

    if (userData && userData.stravaTokens && userData.stravaTokens.connected) {
      res.json({ 
        connected: true, 
        athlete: userData.stravaTokens.athlete,
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

// Callback Strava
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

    if (state) {
      try {
        console.log('🔄 Traitement automatique du token pour utilisateur:', state);

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

          const userData = await readUserData(state);
          if (userData) {
            if (!userData.stravaTokens) userData.stravaTokens = {};
            userData.stravaTokens = {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              expiresAt: tokenData.expires_at,
              athlete: tokenData.athlete,
              connected: true
            };
            await writeUserData(state, userData, userData.userType);
          }

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
            <button onclick="window.close()" style="background: #FC4C02; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">
              Fermer cette fenêtre
            </button>
          </div>
          <script>
            console.log('📱 Code Strava reçu et traité côté serveur');
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

// Route de diagnostic pour tester les connexions
app.post('/api/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    console.log(`🔍 [DEBUG] Tentative de diagnostic pour: ${email}`);

    const clientFiles = await fs.readdir(CLIENTS_DIR);
    const coachFiles = await fs.readdir(COACHES_DIR);
    let userFound = null;
    let userType = null;

    // Chercher dans les clients
    for (const file of clientFiles) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(CLIENTS_DIR, file);
          const data = await fs.readFile(filePath, 'utf8');
          const userData = JSON.parse(data);
          
          if (userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
            userFound = userData;
            userType = 'client';
            break;
          }
        } catch (error) {
          // Ignorer les erreurs de lecture
        }
      }
    }

    // Chercher dans les coaches si pas trouvé
    if (!userFound) {
      for (const file of coachFiles) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(COACHES_DIR, file);
            const data = await fs.readFile(filePath, 'utf8');
            const userData = JSON.parse(data);
            
            if (userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
              userFound = userData;
              userType = 'coach';
              break;
            }
          } catch (error) {
            // Ignorer les erreurs de lecture
          }
        }
      }
    }
    
    if (!userFound) {
      return res.json({
        found: false,
        message: 'Utilisateur non trouvé',
        totalUsers: clientFiles.length + coachFiles.length
      });
    }

    // Informations de diagnostic
    const diagnostic = {
      found: true,
      userType: userType,
      hasPassword: !!userFound.password,
      hasHashedPassword: !!userFound.hashedPassword,
      hashLength: userFound.hashedPassword ? userFound.hashedPassword.length : 0,
      hashSample: userFound.hashedPassword ? userFound.hashedPassword.substring(0, 10) + '...' : null,
      status: userFound.status || 'non défini'
    };

    res.json(diagnostic);

  } catch (error) {
    console.error('❌ [DEBUG] Erreur diagnostic:', error);
    res.status(500).json({ error: 'Erreur serveur diagnostic' });
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
      console.log(`✅ Serveur prêt à recevoir des connexions sur 0.0.0.0:${PORT}`);
      console.log('📁 Structure de stockage: /data/clients et /data/coaches');
      console.log('📄 Un fichier JSON unique par utilisateur avec toutes ses données');
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
