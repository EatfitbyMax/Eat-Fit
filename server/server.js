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

// Fake data storage
let users = [];

// Utility function to load users from memory
const loadUsers = () => {
    return users;
};

// Utility function to save users to memory
const saveUsers = (updatedUsers) => {
    users = updatedUsers;
};

// Routes pour les utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    // Utilisez la fonction pour charger les utilisateurs
    const users = loadUsers();
    console.log(`📊 Récupération utilisateurs: ${users.length} utilisateurs trouvés`);
    res.json(users);
  } catch (error) {
    console.error('Erreur lecture utilisateurs:', error);
    // Retourner un tableau vide au lieu d'une erreur pour permettre l'inscription
    console.log('📝 Initialisation d\'une liste d\'utilisateurs vide');
    res.json([]);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    // Utilisez la fonction pour sauvegarder les utilisateurs
    saveUsers(req.body);
    console.log('💾 Sauvegarde utilisateurs:', Array.isArray(req.body) ? req.body.length : 'format invalide');
    console.log('✅ Utilisateurs sauvegardés avec succès');
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

// Route pour sauvegarder les préférences d'application
app.post('/api/app-preferences/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    console.log(`📱 Sauvegarde préférences app pour utilisateur ${userId}:`, preferences);

    // Charger les utilisateurs existants
    const users = loadUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
      console.error(`❌ Utilisateur ${userId} non trouvé pour sauvegarde préférences app`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les préférences de l'utilisateur
    users[userIndex].appPreferences = preferences;
    users[userIndex].lastUpdated = new Date().toISOString();

    // Sauvegarder dans le fichier
    saveUsers(users);

    console.log(`✅ Préférences app sauvegardées pour ${userId}`);
    res.json({ success: true, message: 'Préférences sauvegardées' });

  } catch (error) {
    console.error('❌ Erreur sauvegarde préférences app:', error);
    res.status(500).json({ error: 'Erreur sauvegarde préférences app' });
  }
});

// Routes pour les paramètres de notifications
app.get('/api/notifications/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔔 Récupération paramètres notifications pour utilisateur ${userId}`);

    // Charger les utilisateurs existants
    const users = loadUsers();
    const user = users.find(user => user.id === userId);

    if (!user) {
      console.error(`❌ Utilisateur ${userId} non trouvé pour récupération paramètres notifications`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Retourner les paramètres de notifications ou les paramètres par défaut
    const defaultSettings = {
      pushNotifications: true,
      mealReminders: true,
      workoutReminders: true,
      progressUpdates: true,
      coachMessages: true,
      weeklyReports: false,
      soundEnabled: true,
      vibrationEnabled: true,
    };

    const notificationSettings = user.notificationSettings || defaultSettings;

    console.log(`✅ Paramètres notifications récupérés pour ${userId}`);
    res.json(notificationSettings);

  } catch (error) {
    console.error('❌ Erreur récupération paramètres notifications:', error);
    res.status(500).json({ error: 'Erreur récupération paramètres notifications' });
  }
});

app.post('/api/notifications/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;

    console.log(`🔔 Sauvegarde paramètres notifications pour utilisateur ${userId}:`, settings);

    // Charger les utilisateurs existants
    const users = loadUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
      console.error(`❌ Utilisateur ${userId} non trouvé pour sauvegarde paramètres notifications`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les paramètres de notifications
    users[userIndex].notificationSettings = settings;
    users[userIndex].lastUpdated = new Date().toISOString();

    // Sauvegarder dans le fichier
    saveUsers(users);

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

// Routes pour Stripe
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { planId, planName, userId, amount, currency } = req.body;

    // Vérifier que Stripe est configuré
    console.log('🔑 Debug Stripe:', {
      hasKey: !!process.env.STRIPE_SECRET_KEY,
      keyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'non définie',
      isDefault: process.env.STRIPE_SECRET_KEY === 'sk_test_your_stripe_secret_key_here'
    });

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_stripe_secret_key_here') {
      console.error('❌ Clé Stripe non configurée');
      return res.status(500).json({ error: 'Configuration Stripe manquante' });
    }

    // Initialiser Stripe avec la vraie clé
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Convertir le montant en centimes (Stripe fonctionne en centimes)
    const amountInCents = Math.round(amount * 100);

    // Créer ou récupérer le customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: `user_${userId}@eatfitbymax.com`,
        limit: 1
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: `user_${userId}@eatfitbymax.com`,
          metadata: {
            userId: userId,
            planId: planId
          }
        });
      }
    } catch (customerError) {
      console.error('Erreur création customer:', customerError);
      return res.status(500).json({ error: 'Erreur création customer' });
    }

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        planId: planId,
        planName: planName,
        userId: userId
      },
      description: `Abonnement ${planName} pour EatFit By Max`
    });

    // Créer l'ephemeral key pour le customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    console.log(`💳 PaymentIntent créé pour ${planName} (${amount}${currency}) - User: ${userId}`);
    console.log(`🔑 PaymentIntent ID: ${paymentIntent.id}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Erreur création PaymentIntent:', error);
    res.status(500).json({ error: 'Erreur création PaymentIntent' });
  }
});

app.post('/api/stripe/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, userId } = req.body;

    // Vérifier que Stripe est configuré
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_stripe_secret_key_here') {
      console.error('❌ Clé Stripe non configurée');
      return res.status(500).json({ error: 'Configuration Stripe manquante' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Récupérer le PaymentIntent pour vérifier son statut
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log(`✅ PaymentIntent confirmé: ${paymentIntentId} pour utilisateur: ${userId}`);
    console.log(`📊 Statut du paiement: ${paymentIntent.status}`);

    res.json({ 
      success: true, 
      paymentIntentId,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
  } catch (error) {
    console.error('Erreur confirmation PaymentIntent:', error);
    res.status(500).json({ error: 'Erreur confirmation PaymentIntent' });
  }
});

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

// Route de test pour Strava
app.get('/test-strava', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Strava Configuration</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
          <h1>🔧 Test Configuration Strava</h1>
          <h3>Configuration actuelle :</h3>
          <ul>
            <li><strong>Client ID:</strong> ${process.env.STRAVA_CLIENT_ID || 'Non configuré'}</li>
            <li><strong>Client Secret:</strong> ${process.env.STRAVA_CLIENT_SECRET ? 'Configuré ✅' : 'Non configuré ❌'}</li>
            <li><strong>Redirect URI:</strong> https://eatfitbymax.cloud/strava-callback</li>
          </ul>

          <h3>Test de connexion Strava :</h3>
          <a href="https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID || 'MISSING'}&response_type=code&redirect_uri=https://eatfitbymax.cloud/strava-callback&approval_prompt=force&scope=read,activity:read_all" 
             style="display: inline-block; background: #FC4C02; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            🔗 Tester la connexion Strava
          </a>

          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Ce lien vous redirigera vers Strava pour tester la configuration.
          </p>
        </div>
      </body>
    </html>
  `);
});

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
      console.log(`🌐 API disponible sur: https://eatfitbymax.replit.app`);
      console.log(`✅ Serveur prêt à recevoir des connexions sur 0.0.0.0:${PORT}`);

      // Serveur prêt pour Replit
      console.log('📡 Serveur Replit configuré et en ligne');
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