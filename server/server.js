
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
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

// Route de test
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur VPS fonctionnel' });
});

app.listen(PORT, '0.0.0.0', async () => {
  await initDataDir();
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur accessible sur : https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev:${PORT}`);
});
