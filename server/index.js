
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Initialiser la base de données SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Créer les tables si elles n'existent pas
db.serialize(() => {
  // Table des utilisateurs
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      userType TEXT CHECK(userType IN ('client', 'coach', 'admin')) DEFAULT 'client',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des profils clients
  db.run(`
    CREATE TABLE IF NOT EXISTS client_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      age INTEGER,
      weight REAL,
      height REAL,
      activityLevel TEXT,
      goals TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `);

  // Table des programmes d'entraînement
  db.run(`
    CREATE TABLE IF NOT EXISTS programmes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      coachId INTEGER,
      clientId INTEGER,
      exercises TEXT, -- JSON string
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coachId) REFERENCES users (id),
      FOREIGN KEY (clientId) REFERENCES users (id)
    )
  `);

  // Table des sessions d'entraînement
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      programmeId INTEGER,
      date DATE,
      completed BOOLEAN DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (programmeId) REFERENCES programmes (id)
    )
  `);

  // Créer un compte admin par défaut
  const adminEmail = 'admin@eatfitbymax.com';
  const adminPassword = 'admin123';
  
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      db.run(
        'INSERT INTO users (email, password, name, userType) VALUES (?, ?, ?, ?)',
        [adminEmail, hashedPassword, 'Administrateur', 'coach'],
        (err) => {
          if (err) {
            console.error('Erreur création admin:', err);
          } else {
            console.log('Compte admin créé:', adminEmail);
          }
        }
      );
    }
  });

  // Créer un compte client de démonstration
  const clientEmail = 'm.pacullmarquie@gmail.com';
  const clientPassword = 'client123';
  
  db.get('SELECT * FROM users WHERE email = ?', [clientEmail], (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync(clientPassword, 10);
      db.run(
        'INSERT INTO users (email, password, name, userType) VALUES (?, ?, ?, ?)',
        [clientEmail, hashedPassword, 'Maxime Client', 'client'],
        (err) => {
          if (err) {
            console.error('Erreur création client:', err);
          } else {
            console.log('Compte client créé:', clientEmail);
          }
        }
      );
    }
  });
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, userType = 'client' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (row) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }

      // Hasher le mot de passe
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Créer l'utilisateur
      db.run(
        'INSERT INTO users (email, password, name, userType) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, name || 'Utilisateur', userType],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erreur lors de la création du compte' });
          }

          const userId = this.lastID;
          const token = jwt.sign(
            { id: userId, email, userType },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            success: true,
            user: { id: userId, email, name, userType },
            token
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, userType: user.userType },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType
        },
        token
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour vérifier le token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  db.get('SELECT id, email, name, userType FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user
    });
  });
});

// Routes pour les profils
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(
    `SELECT u.*, cp.age, cp.weight, cp.height, cp.activityLevel, cp.goals 
     FROM users u 
     LEFT JOIN client_profiles cp ON u.id = cp.userId 
     WHERE u.id = ?`,
    [req.user.id],
    (err, profile) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      res.json({ success: true, profile });
    }
  );
});

app.put('/api/profile', authenticateToken, (req, res) => {
  const { name, age, weight, height, activityLevel, goals } = req.body;

  // Mettre à jour les informations utilisateur
  db.run(
    'UPDATE users SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [name, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
      }

      // Mettre à jour ou créer le profil client
      if (req.user.userType === 'client') {
        db.get('SELECT * FROM client_profiles WHERE userId = ?', [req.user.id], (err, existingProfile) => {
          if (existingProfile) {
            // Mettre à jour
            db.run(
              'UPDATE client_profiles SET age = ?, weight = ?, height = ?, activityLevel = ?, goals = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?',
              [age, weight, height, activityLevel, goals, req.user.id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
                }
                res.json({ success: true, message: 'Profil mis à jour' });
              }
            );
          } else {
            // Créer
            db.run(
              'INSERT INTO client_profiles (userId, age, weight, height, activityLevel, goals) VALUES (?, ?, ?, ?, ?, ?)',
              [req.user.id, age, weight, height, activityLevel, goals],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Erreur lors de la création du profil' });
                }
                res.json({ success: true, message: 'Profil créé' });
              }
            );
          }
        });
      } else {
        res.json({ success: true, message: 'Profil mis à jour' });
      }
    }
  );
});

// Routes pour les programmes
app.get('/api/programmes', authenticateToken, (req, res) => {
  let query;
  let params;

  if (req.user.userType === 'coach') {
    query = 'SELECT * FROM programmes WHERE coachId = ?';
    params = [req.user.id];
  } else {
    query = 'SELECT * FROM programmes WHERE clientId = ?';
    params = [req.user.id];
  }

  db.all(query, params, (err, programmes) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    res.json({ success: true, programmes });
  });
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Serveur EatFitByMax fonctionne !',
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur EatFitByMax démarré sur le port ${PORT}`);
  console.log(`📊 Base de données SQLite: ${dbPath}`);
  console.log(`🔗 API disponible sur: http://localhost:${PORT}/api`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n📝 Fermeture de la base de données...');
  db.close((err) => {
    if (err) {
      console.error('Erreur fermeture DB:', err);
    } else {
      console.log('✅ Base de données fermée.');
    }
    process.exit(0);
  });
});
