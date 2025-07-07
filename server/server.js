const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Créer le dossier data s'il n'existe pas
async function initDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('Dossier data créé');
  }
}

// Routes pour les utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'users.json'), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const users = req.body;
    await fs.writeFile(path.join(DATA_DIR, 'users.json'), JSON.stringify(users, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde utilisateurs' });
  }
});

// Routes pour les programmes
app.get('/api/programmes', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'programmes.json'), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/programmes', async (req, res) => {
  try {
    const programmes = req.body;
    await fs.writeFile(path.join(DATA_DIR, 'programmes.json'), JSON.stringify(programmes, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde programmes' });
  }
});

// Routes pour les messages
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `messages_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = req.body;
    await fs.writeFile(path.join(DATA_DIR, `messages_${userId}.json`), JSON.stringify(messages, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde messages' });
  }
});

// Routes pour Apple Health
app.get('/api/health/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `health_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/health/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const healthData = req.body;
    await fs.writeFile(path.join(DATA_DIR, `health_${userId}.json`), JSON.stringify(healthData, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde données Apple Health' });
  }
});

// Routes pour les entraînements (workouts)
app.get('/api/workouts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `workouts_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/workouts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const workouts = req.body;
    await fs.writeFile(path.join(DATA_DIR, `workouts_${userId}.json`), JSON.stringify(workouts, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde entraînements' });
  }
});

// Routes pour Strava
app.get('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `strava_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/strava/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stravaData = req.body;
    await fs.writeFile(path.join(DATA_DIR, `strava_${userId}.json`), JSON.stringify(stravaData, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde données Strava' });
  }
});

// Routes pour les données nutritionnelles
app.get('/api/nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `nutrition_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const nutritionData = req.body;
    await fs.writeFile(path.join(DATA_DIR, `nutrition_${userId}.json`), JSON.stringify(nutritionData, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde données nutrition' });
  }
});

// Routes pour les données de forme
app.get('/api/forme/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `forme_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({});
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/forme/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const formeData = req.body;
    await fs.writeFile(path.join(DATA_DIR, `forme_${userId}.json`), JSON.stringify(formeData, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde données forme' });
  }
});

// Routes pour les données de poids
app.get('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `weight_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({
        startWeight: 0,
        currentWeight: 0,
        targetWeight: 0,
        lastWeightUpdate: null,
        targetAsked: false,
        weightHistory: [],
      });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const weightData = req.body;
    await fs.writeFile(path.join(DATA_DIR, `weight_${userId}.json`), JSON.stringify(weightData, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde données poids' });
  }
});

// Routes pour les mensurations
app.get('/api/mensurations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `mensurations_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({
        biceps: { start: 0, current: 0 },
        bicepsGauche: { start: 0, current: 0 },
        bicepsDroit: { start: 0, current: 0 },
        cuisses: { start: 0, current: 0 },
        cuissesGauche: { start: 0, current: 0 },
        cuissesDroit: { start: 0, current: 0 },
        pectoraux: { start: 0, current: 0 },
        taille: { start: 0, current: 0 },
        avantBras: { start: 0, current: 0 },
        avantBrasGauche: { start: 0, current: 0 },
        avantBrasDroit: { start: 0, current: 0 },
        mollets: { start: 0, current: 0 },
        molletsGauche: { start: 0, current: 0 },
        molletsDroit: { start: 0, current: 0 },
      });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/mensurations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const mensurationData = req.body;
    await fs.writeFile(path.join(DATA_DIR, `mensurations_${userId}.json`), JSON.stringify(mensurationData, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde données mensurations' });
  }
});

// Routes pour les données de forme par date
app.get('/api/forme/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `forme_data_${userId}_${date}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({
        sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
        stress: { level: 5, factors: [], notes: '' },
        heartRate: { resting: 0, variability: 0 },
        rpe: { value: 5, notes: '' },
        date: date
      });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/forme/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const formeData = req.body;
    await fs.writeFile(path.join(DATA_DIR, `forme_data_${userId}_${date}.json`), JSON.stringify(formeData, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde données forme' });
  }
});

// Routes pour les statuts d'intégrations
app.get('/api/integrations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `integrations_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({
        appleHealth: { connected: false, permissions: [] },
        strava: { connected: false }
      });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/integrations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const integrationData = req.body;
    await fs.writeFile(path.join(DATA_DIR, `integrations_${userId}.json`), JSON.stringify(integrationData, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde statuts intégrations' });
  }
});

// Routes Stripe pour les paiements
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { planId, userId, amount, currency } = req.body;

    if (!planId || !userId || !amount) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    // Créer ou récupérer le client Stripe
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: `user-${userId}@eatfitbymax.com`,
        limit: 1
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: `user-${userId}@eatfitbymax.com`,
          metadata: {
            userId: userId,
            planId: planId
          }
        });
      }
    } catch (error) {
      console.error('Erreur création client:', error);
      return res.status(500).json({ error: 'Erreur création client' });
    }

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe utilise les centimes
      currency: currency || 'eur',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId,
        planId: planId,
        planName: req.body.planName || `Plan ${planId}`
      }
    });

    // Créer une clé éphémère pour le client
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-06-20' }
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Erreur création PaymentIntent:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du paiement' });
  }
});

// Route pour confirmer le paiement et activer l'abonnement
app.post('/api/stripe/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, userId } = req.body;

    if (!paymentIntentId || !userId) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    // Récupérer le PaymentIntent pour vérifier son statut
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Activer l'abonnement côté serveur
      const subscription = {
        userId: userId,
        planId: paymentIntent.metadata.planId,
        planName: paymentIntent.metadata.planName,
        price: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        stripePaymentIntentId: paymentIntentId,
        stripeCustomerId: paymentIntent.customer
      };

      // Sauvegarder l'abonnement
      await fs.writeFile(
        path.join(DATA_DIR, `subscription_${userId}.json`), 
        JSON.stringify(subscription, null, 2)
      );

      res.json({ success: true, subscription });
    } else {
      res.status(400).json({ error: 'Paiement non confirmé' });
    }

  } catch (error) {
    console.error('Erreur confirmation paiement:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la confirmation' });
  }
});

// Route pour récupérer le statut d'abonnement
app.get('/api/stripe/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const subscriptionData = await fs.readFile(
      path.join(DATA_DIR, `subscription_${userId}.json`), 
      'utf8'
    );

    const subscription = JSON.parse(subscriptionData);

    // Vérifier si l'abonnement est encore valide
    if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
      subscription.status = 'expired';
      await fs.writeFile(
        path.join(DATA_DIR, `subscription_${userId}.json`), 
        JSON.stringify(subscription, null, 2)
      );
    }

    res.json(subscription);

  } catch (error) {
    if (error.code === 'ENOENT') {
      // Aucun abonnement trouvé, retourner gratuit
      res.json({
        planId: 'free',
        planName: 'Version Gratuite',
        price: 0,
        currency: 'EUR',
        status: 'active',
        paymentMethod: 'none'
      });
    } else {
      console.error('Erreur récupération abonnement:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

// Webhook Stripe pour les événements de paiement
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Erreur vérification webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements Stripe
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Paiement réussi:', paymentIntent.id);

      // Ici vous pouvez ajouter une logique supplémentaire
      // comme l'envoi d'emails de confirmation, etc.
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ Paiement échoué:', failedPayment.id);
      break;

    default:
      console.log(`Événement non géré: ${event.type}`);
  }

  res.json({received: true});
});

// Routes pour les profils utilisateur
app.get('/api/user-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `user_profile_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json(null);
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/user-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    await fs.writeFile(path.join(DATA_DIR, `user_profile_${userId}.json`), JSON.stringify(profileData, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde profil utilisateur' });
  }
});

// Routes pour les paramètres de notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `notifications_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({
        workoutReminder: true,
        nutritionReminder: true,
        progressUpdate: true,
        reminderTime: '09:00',
        weeklyReport: true,
        coachMessages: true
      });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notificationSettings = req.body;
    await fs.writeFile(path.join(DATA_DIR, `notifications_${userId}.json`), JSON.stringify(notificationSettings, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde paramètres notifications' });
  }
});

// Routes pour les préférences d'application
app.get('/api/app-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await fs.readFile(path.join(DATA_DIR, `app_preferences_${userId}.json`), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({
        theme: 'dark',
        language: 'fr',
        units: 'metric',
        notifications: true
      });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

app.post('/api/app-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    await fs.writeFile(path.join(DATA_DIR, `app_preferences_${userId}.json`), JSON.stringify(preferences, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde préférences app' });
  }
});

// Route de test
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur VPS fonctionnel' });
});

app.listen(PORT, '0.0.0.0', async () => {
  await initDataDir();
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur accessible sur : http://0.0.0.0:${PORT}`);
  
  // Log des différentes URLs d'accès possibles
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    console.log(`Replit URL : https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev:${PORT}`);
  }
  
  // Pour production VPS
  console.log(`Production VPS URL : http://51.178.29.220:${PORT}`);
  console.log(`Local URL : http://localhost:${PORT}`);
});