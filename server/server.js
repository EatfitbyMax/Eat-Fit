const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

// Dossier de stockage des données
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuration Strava depuis les variables d'environnement
const stravaClientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || process.env.STRAVA_CLIENT_ID;
const stravaClientSecret = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || process.env.STRAVA_CLIENT_SECRET;

console.log('🔧 Configuration serveur:');
console.log('- Port:', PORT);
console.log('- Data directory:', DATA_DIR);
console.log('- Strava Client ID:', stravaClientId ? `${stravaClientId.substring(0, 6)}...` : 'MANQUANT');
console.log('- Strava Client Secret:', stravaClientSecret ? 'Configuré' : 'MANQUANT');

// Fonction utilitaire pour créer les dossiers
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📁 Dossier créé: ${dirPath}`);
    } else {
      throw error;
    }
  }
}

// Fonctions de lecture/écriture de fichiers JSON
async function readJsonFile(filename, defaultValue = null) {
  try {
    await ensureDirectoryExists(DATA_DIR);
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    console.error(`Erreur lecture ${filename}:`, error);
    return defaultValue;
  }
}

async function writeJsonFile(filename, data) {
  try {
    await ensureDirectoryExists(DATA_DIR);
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Erreur écriture ${filename}:`, error);
    return false;
  }
}

async function readUserFile(userId, userType = 'client') {
  try {
    const userDir = path.join(DATA_DIR, userType === 'client' ? 'Client' : 'Coach');
    await ensureDirectoryExists(userDir);
    const filePath = path.join(userDir, `${userId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    console.error(`Erreur lecture utilisateur ${userId}:`, error);
    return null;
  }
}

async function writeUserFile(userId, userData, userType = 'client') {
  try {
    const userDir = path.join(DATA_DIR, userType === 'client' ? 'Client' : 'Coach');
    await ensureDirectoryExists(userDir);
    const filePath = path.join(userDir, `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
    return true;
  } catch (error) {
    console.error(`Erreur écriture utilisateur ${userId}:`, error);
    return false;
  }
}

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    strava_configured: !!(stravaClientId && stravaClientSecret)
  });
});

// Routes Strava améliorées

// Callback Strava - Page de succès personnalisée
app.get('/strava-callback', async (req, res) => {
  const { code, error, state } = req.query;

  console.log('🔄 Callback Strava reçu:', { 
    hasCode: !!code,
    error: error || 'aucune',
    userId: state || 'aucun'
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
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 400px; margin: 50px auto; background: white; border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .error { color: #e74c3c; font-size: 18px; margin-bottom: 20px; }
            .message { color: #666; line-height: 1.6; }
            .button { display: inline-block; background: #FC4C02; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌ Erreur de connexion</div>
            <div class="message">
              <strong>Erreur:</strong> ${error}<br><br>
              Vous pouvez fermer cette fenêtre et réessayer dans l'application.
            </div>
          </div>
        </body>
      </html>
    `);
  }

  if (code && state) {
    console.log('✅ Code d\'autorisation Strava reçu pour userId:', state);

    // Page de succès avec fermeture automatique
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Connexion réussie</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: linear-gradient(135deg, #FC4C02, #FF6B35);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container { 
              max-width: 400px; 
              background: white; 
              border-radius: 16px; 
              padding: 40px 30px; 
              text-align: center; 
              box-shadow: 0 8px 32px rgba(0,0,0,0.2);
              color: #333;
            }
            .success-icon { 
              width: 60px; 
              height: 60px; 
              background: #27AE60; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              margin: 0 auto 20px; 
              font-size: 24px;
            }
            .title { 
              font-size: 24px; 
              font-weight: 600; 
              color: #27AE60; 
              margin-bottom: 10px; 
            }
            .subtitle { 
              font-size: 18px; 
              color: #333; 
              margin-bottom: 20px; 
            }
            .message { 
              color: #666; 
              line-height: 1.6; 
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0;
            }
            .button { 
              display: inline-block; 
              background: #FC4C02; 
              color: white; 
              padding: 12px 24px; 
              border-radius: 8px; 
              text-decoration: none; 
              margin-top: 20px;
              border: none;
              font-size: 16px;
              cursor: pointer;
            }
            .loading { 
              display: inline-block; 
              width: 20px; 
              height: 20px; 
              border: 3px solid #f3f3f3; 
              border-top: 3px solid #FC4C02; 
              border-radius: 50%; 
              animation: spin 1s linear infinite; 
              margin-left: 10px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <div class="title">Connexion réussie!</div>
            <div class="subtitle">Strava connecté à EatFit By Max</div>
            <div class="message">
              Vous pouvez fermer cette fenêtre et retourner dans l'application.
            </div>
            <button class="button" onclick="closeWindow()">
              Fermer
              <span class="loading" id="loading" style="display: none;"></span>
            </button>
          </div>

          <script>
            // Tentative de fermeture automatique après 3 secondes
            setTimeout(function() {
              closeWindow();
            }, 3000);

            function closeWindow() {
              document.getElementById('loading').style.display = 'inline-block';

              // Tentatives multiples de fermeture pour différents environnements
              try {
                // Pour les webviews mobiles
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage('close');
                }

                // Pour les navigateurs standards
                window.close();

                // Pour les popups
                if (window.opener) {
                  window.opener.focus();
                  window.close();
                }

                // Message de retour pour Expo WebBrowser
                if (window.parent && window.parent.postMessage) {
                  window.parent.postMessage('strava_success', '*');
                }
              } catch (e) {
                console.log('Impossible de fermer automatiquement');
              }

              // Message de fallback
              setTimeout(function() {
                alert('Vous pouvez maintenant fermer cette fenêtre manuellement et retourner dans l\\'application.');
              }, 1000);
            }
          </script>
        </body>
      </html>
    `);
  }

  // Cas par défaut
  res.status(400).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paramètres manquants</title>
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2>Paramètres manquants</h2>
        <p>Code d'autorisation ou identifiant utilisateur manquant.</p>
      </body>
    </html>
  `);
});

// Échange de code pour token
app.post('/api/strava/exchange-token', async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Code et userId requis' });
    }

    if (!stravaClientId || !stravaClientSecret) {
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
        client_id: stravaClientId,
        client_secret: stravaClientSecret,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Erreur API Strava:', tokenResponse.status, errorText);
      throw new Error('Erreur lors de l\'authentification Strava');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token Strava reçu pour:', userId);

    // Sauvegarder les tokens
    const tokenFilePath = `strava_tokens_${userId}.json`;
    const saveSuccess = await writeJsonFile(tokenFilePath, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      athlete: tokenData.athlete,
      connected: true,
      lastUpdated: new Date().toISOString()
    });

    if (saveSuccess) {
      console.log('✅ Tokens Strava sauvegardés pour utilisateur:', userId);
      res.json({ 
        success: true, 
        athlete: tokenData.athlete,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at
      });
    } else {
      throw new Error('Erreur de sauvegarde des tokens');
    }

  } catch (error) {
    console.error('❌ Erreur échange token Strava:', error);
    res.status(500).json({ 
      error: 'Erreur échange token Strava',
      details: error.message 
    });
  }
});

// Rafraîchissement de token
app.post('/api/strava/refresh-token', async (req, res) => {
  try {
    const { userId, refreshToken } = req.body;

    if (!userId || !refreshToken) {
      return res.status(400).json({ error: 'userId et refreshToken requis' });
    }

    if (!stravaClientId || !stravaClientSecret) {
      return res.status(500).json({ error: 'Configuration Strava manquante' });
    }

    console.log('🔄 Rafraîchissement token Strava pour:', userId);

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: stravaClientId,
        client_secret: stravaClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur rafraîchissement Strava:', response.status, errorText);
      throw new Error('Token de rafraîchissement invalide');
    }

    const tokenData = await response.json();

    // Mettre à jour les tokens
    const tokenFilePath = `strava_tokens_${userId}.json`;
    const currentData = await readJsonFile(tokenFilePath, {});

    const updatedData = {
      ...currentData,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      lastUpdated: new Date().toISOString()
    };

    await writeJsonFile(tokenFilePath, updatedData);

    console.log('✅ Token Strava rafraîchi pour:', userId);
    res.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at
    });

  } catch (error) {
    console.error('❌ Erreur rafraîchissement token:', error);
    res.status(500).json({ 
      error: 'Erreur rafraîchissement token',
      details: error.message 
    });
  }
});

// Déconnexion Strava
app.post('/api/strava/disconnect/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Supprimer le fichier de tokens
    const tokenFilePath = `strava_tokens_${userId}.json`;
    try {
      await fs.unlink(path.join(DATA_DIR, tokenFilePath));
      console.log('✅ Tokens Strava supprimés pour:', userId);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('⚠️ Erreur suppression tokens:', error);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur déconnexion Strava:', error);
    res.status(500).json({ error: 'Erreur déconnexion Strava' });
  }
});

// Statut Strava
app.get('/api/strava/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tokenData = await readJsonFile(`strava_tokens_${userId}.json`, null);

    if (tokenData && tokenData.connected) {
      res.json({ 
        connected: true, 
        athlete: tokenData.athlete,
        lastSync: tokenData.lastUpdated || null
      });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('❌ Erreur statut Strava:', error);
    res.json({ connected: false });
  }
});

// Sauvegarde des activités Strava
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
    console.error(`❌ Erreur sauvegarde données Strava utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde données Strava' });
  }
});

// Routes d'authentification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`🔍 Tentative de connexion pour: ${normalizedEmail}`);

    // Chercher d'abord dans les clients
    let userData = null;
    let userType = null;
    let userId = null;

    try {
      const clientDir = path.join(DATA_DIR, 'Client');
      await ensureDirectoryExists(clientDir);
      const clientFiles = await fs.readdir(clientDir);

      for (const file of clientFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(clientDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const client = JSON.parse(data);
          
          if (client.email && client.email.toLowerCase() === normalizedEmail) {
            userData = client;
            userType = 'client';
            userId = file.replace('.json', '');
            break;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur lecture dossier Client:', error);
    }

    // Si pas trouvé dans les clients, chercher dans les coaches
    if (!userData) {
      try {
        const coachDir = path.join(DATA_DIR, 'Coach');
        await ensureDirectoryExists(coachDir);
        const coachFiles = await fs.readdir(coachDir);

        for (const file of coachFiles) {
          if (file.endsWith('.json')) {
            const filePath = path.join(coachDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            const coach = JSON.parse(data);
            
            if (coach.email && coach.email.toLowerCase() === normalizedEmail) {
              userData = coach;
              userType = 'coach';
              userId = file.replace('.json', '');
              break;
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur lecture dossier Coach:', error);
      }
    }

    if (!userData) {
      console.log(`❌ Utilisateur non trouvé: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe (pour simplifier, comparaison directe)
    // En production, utilisez bcrypt pour hasher les mots de passe
    if (userData.password !== password) {
      console.log(`❌ Mot de passe incorrect pour: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    console.log(`✅ Connexion réussie pour: ${normalizedEmail} (${userType})`);

    // Retourner les données utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = userData;
    res.json({
      success: true,
      user: {
        ...userWithoutPassword,
        id: userId,
        userType
      }
    });

  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const userData = req.body;

    if (!userData.email || !userData.password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const normalizedEmail = userData.email.toLowerCase().trim();
    console.log(`📝 Tentative d'inscription pour: ${normalizedEmail}`);

    // Générer un ID unique basé sur l'email et le timestamp
    const userId = `${normalizedEmail.replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const userType = userData.userType || 'client';

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await readUserFile(userId, userType);
    if (existingUser) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
    }

    // Vérifier dans l'autre type d'utilisateur aussi
    const otherType = userType === 'client' ? 'coach' : 'client';
    const existingOtherType = await readUserFile(userId, otherType);
    if (existingOtherType) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
    }

    // Préparer les données utilisateur
    const userDataToSave = {
      ...userData,
      email: normalizedEmail,
      id: userId,
      userType,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Sauvegarder l'utilisateur
    const saveSuccess = await writeUserFile(userId, userDataToSave, userType);

    if (saveSuccess) {
      console.log(`✅ Inscription réussie pour: ${normalizedEmail} (${userType})`);
      
      // Retourner les données utilisateur (sans le mot de passe)
      const { password: _, ...userWithoutPassword } = userDataToSave;
      res.json({
        success: true,
        user: userWithoutPassword
      });
    } else {
      throw new Error('Erreur de sauvegarde');
    }

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
});

// Routes existantes (messages, programmes, etc.)
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

    if (!userData.messages) {
      userData.messages = [];
    }

    userData.messages.push(req.body);
    userData.lastUpdated = new Date().toISOString();

    await writeUserFile(userId, userData, userType);
    res.json({ success: true });
  } catch (error) {
    console.error(`Erreur sauvegarde message utilisateur ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Erreur sauvegarde message' });
  }
});

app.get('/api/programmes', async (req, res) => {
  try {
    const programmes = await readJsonFile('programmes.json', []);
    res.json(programmes);
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
    await writeJsonFile('programmes.json', req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde programmes:', error);
    res.status(500).json({ error: 'Erreur sauvegarde programmes' });
  }
});

// Route par défaut
app.get('/', (req, res) => {
  res.json({ 
    message: 'EatFit By Max API Server', 
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    strava_configured: !!(stravaClientId && stravaClientSecret)
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://0.0.0.0:${PORT}`);

  // Vérifier la configuration Strava
  if (!stravaClientId || !stravaClientSecret) {
    console.warn('⚠️  Configuration Strava incomplète - vérifiez les variables d\'environnement');
  } else {
    console.log('✅ Configuration Strava OK');
  }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
});