const https = require('https');
const fs = require('fs');
const path = require('path');

const downloadWithRedirects = (url, maxRedirects = 5) => {
  return new Promise((resolve, reject) => {
    const download = (currentUrl, redirectCount = 0) => {
      if (redirectCount > maxRedirects) {
        reject(new Error(`Trop de redirections après ${maxRedirects} tentatives`));
        return;
      }

      const request = https.get(currentUrl, (response) => {
        const { statusCode, headers } = response;

        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          console.log(`Redirection ${statusCode} vers: ${headers.location}`);
          download(headers.location, redirectCount + 1);
          return;
        }

        if (statusCode !== 200) {
          reject(new Error(`Status: ${statusCode}`));
          return;
        }

        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        const file = fs.createWriteStream(path.join(dataDir, 'openfoodfacts.json'));
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log('✅ Base OpenFoodFacts téléchargée avec succès');
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(path.join(dataDir, 'openfoodfacts.json'), () => {});
          reject(err);
        });
      });

      request.on('error', reject);
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    };

    download(url);
  });
};

async function updateOpenFoodFacts() {
  try {
    console.log('[OpenFoodFacts] 🔄 Téléchargement de la base OpenFoodFacts...');
    console.log('[OpenFoodFacts] 📥 Début du téléchargement depuis OpenFoodFacts...');

    const url = 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.json';
    const https = require('https');
const fs = require('fs');
const path = require('path');

const downloadWithRedirects = (url, maxRedirects = 5) => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      // Gérer les redirections
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirectUrl = res.headers.location;
        console.log(`[OpenFoodFacts] 🔄 Redirection vers: ${redirectUrl}`);

        // Suivre la redirection
        const redirectedReq = https.get(redirectUrl, (redirectedRes) => {
          if (redirectedRes.statusCode !== 200) {
            reject(new Error(`Status after redirect: ${redirectedRes.statusCode}`));
            return;
          }

          const dataDir = path.join(__dirname, '../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            const file = fs.createWriteStream(path.join(dataDir, 'openfoodfacts.json'));
            redirectedRes.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log('✅ Base OpenFoodFacts téléchargée avec succès');
                resolve();
            });

            file.on('error', (err) => {
                fs.unlink(path.join(dataDir, 'openfoodfacts.json'), () => {});
                reject(err);
            });
        });

        redirectedReq.on('error', reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Status: ${res.statusCode}`));
        return;
      }

      const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const file = fs.createWriteStream(path.join(dataDir, 'openfoodfacts.json'));
        res.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log('✅ Base OpenFoodFacts téléchargée avec succès');
            resolve();
        });

        file.on('error', (err) => {
            fs.unlink(path.join(dataDir, 'openfoodfacts.json'), () => {});
            reject(err);
        });
    });

    request.on('error', reject);
  });
};

async function updateOpenFoodFacts() {
  try {
    console.log('[OpenFoodFacts] 🔄 Téléchargement de la base OpenFoodFacts...');
    console.log('[OpenFoodFacts] 📥 Début du téléchargement depuis OpenFoodFacts...');

    const url = 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.json';
    await downloadWithRedirects(url);

    console.log('[OpenFoodFacts] ✅ Mise à jour terminée avec succès');
  } catch (error) {
    console.error('[OpenFoodFacts] ❌ Erreur téléchargement:', error);
    throw error;
  }
}

// Exporter pour utilisation dans le serveur
module.exports = { updateOpenFoodFacts };

// Exécuter si appelé directement
if (require.main === module) {
  updateOpenFoodFacts().catch(console.error);
}