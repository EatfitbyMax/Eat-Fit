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

    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Connexion Strava réussie!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
          }
          .success-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          h1 {
            color: #FC4C02;
            margin-bottom: 10px;
            font-size: 1.8rem;
          }
          p {
            color: #333;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .code {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 0.9rem;
            margin: 20px 0;
            word-break: break-all;
          }
          .success-message {
            background: #e8f5e8;
            border: 2px dashed #4CAF50;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            color: #2e7d32;
          }
          .redirect-info {
            font-size: 0.9rem;
            color: #666;
            margin-top: 20px;
          }
          .close-button {
            background: #FC4C02;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 20px;
          }
          .countdown {
            font-weight: bold;
            color: #FC4C02;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">🎉</div>
          <h1>Connexion Strava réussie!</h1>
          <p>Votre compte Strava a été connecté avec succès à <strong>EatFit By Max</strong>.</p>

          <div class="code">
            <strong>Code d'autorisation:</strong><br>
            ${code.substring(0, 20)}...
          </div>

          <div class="success-message">
            ✓ <strong>Connexion Strava terminée !</strong><br>
            Retournez dans l'application EatFit By Max pour continuer.
          </div>

          <button class="close-button" onclick="closeWindow()">
            🔙 Retourner à l'application
          </button>

          <div style="background: #f0f8ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left;">
            <p style="margin: 0; font-size: 14px; color: #1e88e5;">
              <strong>📱 Instructions :</strong><br>
              • <strong>iPhone/iPad :</strong> Appuyez sur "Terminé" en haut à gauche<br>
              • <strong>Android :</strong> Utilisez le bouton retour de votre appareil<br>
              • Ou attendez la fermeture automatique
            </p>
          </div>

          <p class="redirect-info">
            Fermeture automatique dans <span class="countdown" id="countdown">8</span> secondes...
          </p>
        </div>

        <script>
          let countdown = 8;
          const countdownElement = document.getElementById('countdown');

          function updateCountdown() {
            countdownElement.textContent = countdown;
            countdown--;

            if (countdown < 0) {
              attemptClose();
            }
          }

          function attemptClose() {
            // Méthode 1: Essayer de fermer l'onglet/fenêtre
            try {
              window.close();
              console.log('Tentative window.close()');
            } catch(e) {
              console.log('window.close() échoué:', e);
            }

            // Méthode 2: Redirection vers l'app si possible
            setTimeout(() => {
              try {
                // Essayer de rediriger vers l'app Expo
                window.location.href = 'exp+eatfitbymax://';
                console.log('Tentative redirection vers app');
              } catch(e) {
                console.log('Redirection app échouée:', e);
                // Méthode 3: Page blanche en dernier recours
                window.location.href = 'about:blank';
              }
            }, 1000);
          }

          function closeWindow() {
            attemptClose();
          }

          // Démarrer le countdown avec délai plus long
          const interval = setInterval(updateCountdown, 1000);
          updateCountdown();

          // Écouter les clics sur le bouton
          document.addEventListener('DOMContentLoaded', function() {
            const closeBtn = document.querySelector('.close-button');
            if (closeBtn) {
              closeBtn.addEventListener('click', attemptClose);
            }
          });

          // Message à l'utilisateur si la fermeture automatique échoue
          setTimeout(() => {
            if (!document.hidden) {
              const container = document.querySelector('.container');
              if (container) {
                container.innerHTML += `
                  <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <p style="margin: 0; color: #1976d2; font-size: 14px;">
                      <strong>📱 Pour iOS Safari :</strong><br>
                      Appuyez sur le bouton "Terminé" en haut à gauche pour fermer cette page et retourner à l'application.
                    </p>
                  </div>
                `;
              }
            }
          }, 10000);
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