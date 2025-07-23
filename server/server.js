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
    console.log(`📊 Récupération utilisateurs: ${users.length} utilisateurs trouvés`);
    res.json(users);
  } catch (error) {
    console.error('Erreur lecture utilisateurs:', error);
    // Retourner un tableau vide au lieu d'une erreur pour permettre l'inscription
    console.log('📝 Création d\'un fichier users.json vide');
    const emptyUsers = [];
    await writeJsonFile('users.json', emptyUsers);
    res.json(emptyUsers);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    console.log('💾 Sauvegarde utilisateurs:', Array.isArray(req.body) ? req.body.length : 'format invalide');
    await writeJsonFile('users.json', req.body);
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

// Callback Strava
app.get('/strava-callback', (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    console.error('Erreur callback Strava:', error);
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Erreur de connexion Strava</h2>
          <p>Une erreur s'est produite lors de la connexion à Strava.</p>
          <p>Vous pouvez fermer cette fenêtre et réessayer.</p>
        </body>
      </html>
    `);
  }

  if (code) {
    console.log('✅ Code d\'autorisation Strava reçu:', code);
    return res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Connexion Strava réussie!</h2>
          <p>Votre compte Strava a été connecté avec succès.</p>
          <p>Vous pouvez fermer cette fenêtre et retourner dans l'application.</p>
          <script>
            // Essayer de rediriger vers l'app
            setTimeout(() => {
              window.location.href = 'eatfitbymax://strava-callback?code=${code}';
            }, 2000);
          </script>
        </body>
      </html>
    `);
  }

  res.status(400).send(`
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2>Paramètres manquants</h2>
        <p>Les paramètres de callback sont manquants.</p>
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