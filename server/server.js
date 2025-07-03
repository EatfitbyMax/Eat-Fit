
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

// Routes pour récupérer les données de forme par date
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

// Route pour les données CIQUAL
app.get('/api/ciqual/foods', async (req, res) => {
  try {
    const ciqualPath = path.join(__dirname, 'data', 'ciqual-foods.json');
    const data = await fs.readFile(ciqualPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Erreur chargement CIQUAL:', error);
    res.status(500).json({ error: 'Erreur chargement base CIQUAL' });
  }
});

// Route de recherche CIQUAL
app.get('/api/ciqual/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Paramètre de recherche manquant' });
    }

    const ciqualPath = path.join(__dirname, 'data', 'ciqual-foods.json');
    const data = await fs.readFile(ciqualPath, 'utf8');
    const foods = JSON.parse(data);
    
    const searchTerm = query.toLowerCase();
    const results = foods.filter(food => 
      food.name.toLowerCase().includes(searchTerm) ||
      food.category.toLowerCase().includes(searchTerm)
    );
    
    console.log(`Recherche CIQUAL: ${results.length} résultats pour "${query}"`);
    res.json(results);
  } catch (error) {
    console.error('Erreur recherche CIQUAL:', error);
    res.status(500).json({ error: 'Erreur recherche CIQUAL' });
  }
});

// Routes pour OpenFoodFacts local
app.get('/api/openfoodfacts/search', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Paramètre de recherche manquant' });
    }

    const offPath = path.join(__dirname, 'data', 'openfoodfacts-products.json');
    
    try {
      const data = await fs.readFile(offPath, 'utf8');
      const products = JSON.parse(data);
      
      const searchTerm = query.toLowerCase();
      const results = products
        .filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
          (product.categories && product.categories.toLowerCase().includes(searchTerm))
        )
        .slice(0, parseInt(limit));
      
      console.log(`Recherche OpenFoodFacts local: ${results.length} résultats pour "${query}"`);
      res.json(results);
    } catch (fileError) {
      console.log('Base OpenFoodFacts locale non trouvée, utilisation CIQUAL...');
      // Fallback vers CIQUAL
      const ciqualPath = path.join(__dirname, 'data', 'ciqual-foods.json');
      const ciqualData = await fs.readFile(ciqualPath, 'utf8');
      const foods = JSON.parse(ciqualData);
      
      const searchTerm = query.toLowerCase();
      const results = foods.filter(food => 
        food.name.toLowerCase().includes(searchTerm) ||
        food.category.toLowerCase().includes(searchTerm)
      ).slice(0, parseInt(limit));
      
      res.json(results);
    }
  } catch (error) {
    console.error('Erreur recherche OpenFoodFacts local:', error);
    res.status(500).json({ error: 'Erreur recherche OpenFoodFacts local' });
  }
});

app.get('/api/openfoodfacts/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const offPath = path.join(__dirname, 'data', 'openfoodfacts-products.json');
    const data = await fs.readFile(offPath, 'utf8');
    const products = JSON.parse(data);
    
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Produit non trouvé' });
    }
  } catch (error) {
    console.error('Erreur recherche code-barres:', error);
    res.status(404).json({ error: 'Produit non trouvé' });
  }
});

app.get('/api/openfoodfacts/stats', async (req, res) => {
  try {
    const offPath = path.join(__dirname, 'data', 'openfoodfacts-products.json');
    const stats = await fs.stat(offPath);
    const data = await fs.readFile(offPath, 'utf8');
    const products = JSON.parse(data);
    
    res.json({
      totalProducts: products.length,
      lastUpdate: stats.mtime,
      fileSize: stats.size,
      fileSizeMB: Math.round(stats.size / 1024 / 1024)
    });
  } catch (error) {
    res.status(404).json({ error: 'Base de données non trouvée' });
  }
});

app.post('/api/openfoodfacts/download', async (req, res) => {
  try {
    const OpenFoodFactsDownloader = require('./scripts/download-openfoodfacts');
    const downloader = new OpenFoodFactsDownloader();
    
    // Télécharger en arrière-plan
    downloader.downloadDatabase()
      .then(productCount => {
        console.log(`✅ Base OpenFoodFacts mise à jour: ${productCount} produits`);
      })
      .catch(error => {
        console.error('❌ Erreur mise à jour OpenFoodFacts:', error);
      });
    
    res.json({ message: 'Téléchargement démarré en arrière-plan' });
  } catch (error) {
    console.error('Erreur démarrage téléchargement:', error);
    res.status(500).json({ error: 'Erreur démarrage téléchargement' });
  }
});

// Route de test
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur VPS fonctionnel' });
});

app.listen(PORT, '0.0.0.0', async () => {
  await initDataDir();
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur accessible sur : https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev:${PORT}`);
});
