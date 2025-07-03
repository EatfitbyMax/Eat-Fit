
const fs = require('fs').promises;
const https = require('https');
const zlib = require('zlib');
const path = require('path');

class OpenFoodFactsDownloader {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.openfoodfactsFile = path.join(this.dataDir, 'openfoodfacts-products.json');
    this.downloadUrl = 'https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz';
  }

  async downloadDatabase() {
    const logPrefix = `[${new Date().toISOString()}] [OpenFoodFacts]`;
    console.log(`${logPrefix} 🔄 Téléchargement de la base OpenFoodFacts...`);
    
    try {
      // Créer le dossier data s'il n'existe pas
      await fs.mkdir(this.dataDir, { recursive: true });

      // Télécharger le fichier compressé
      console.log(`${logPrefix} 📥 Début du téléchargement depuis OpenFoodFacts...`);
      const compressedData = await this.downloadFile(this.downloadUrl);
      console.log(`${logPrefix} ✅ Fichier téléchargé (${Math.round(compressedData.length / 1024 / 1024)}MB), décompression...`);

      // Décompresser les données
      const decompressedData = await this.decompress(compressedData);
      console.log(`${logPrefix} ✅ Données décompressées (${Math.round(decompressedData.length / 1024 / 1024)}MB), traitement...`);

      // Traiter et filtrer les données
      const processedData = await this.processData(decompressedData);
      console.log(`${logPrefix} ✅ ${processedData.length} produits traités`);

      // Sauvegarder les données
      await fs.writeFile(this.openfoodfactsFile, JSON.stringify(processedData, null, 2));
      console.log(`${logPrefix} ✅ Base de données OpenFoodFacts sauvegardée`);

      // Écrire un fichier de log pour PM2
      const logFile = path.join(this.dataDir, 'download-log.json');
      const logData = {
        lastUpdate: new Date().toISOString(),
        productCount: processedData.length,
        status: 'completed',
        fileSize: (await fs.stat(this.openfoodfactsFile)).size
      };
      await fs.writeFile(logFile, JSON.stringify(logData, null, 2));

      return processedData.length;
    } catch (error) {
      console.error(`${logPrefix} ❌ Erreur téléchargement:`, error);
      
      // Écrire le log d'erreur pour PM2
      const logFile = path.join(this.dataDir, 'download-log.json');
      const logData = {
        lastUpdate: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
      await fs.writeFile(logFile, JSON.stringify(logData, null, 2)).catch(() => {});
      
      throw error;
    }
  }

  downloadFile(url) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Status: ${response.statusCode}`));
          return;
        }

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        response.on('error', reject);
      }).on('error', reject);
    });
  }

  decompress(compressedData) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressedData, (err, decompressed) => {
        if (err) {
          reject(err);
        } else {
          resolve(decompressed.toString('utf8'));
        }
      });
    });
  }

  async processData(jsonlData) {
    const lines = jsonlData.split('\n').filter(line => line.trim());
    const products = [];
    const logPrefix = `[${new Date().toISOString()}] [OpenFoodFacts]`;
    
    console.log(`${logPrefix} 📊 Traitement de ${lines.length} lignes (base complète OpenFoodFacts)...`);
    console.log(`${logPrefix} ⚠️ Téléchargement de la base complète - cela peut prendre 10-30 minutes...`);
    console.log(`${logPrefix} 💡 Astuce: Vous pouvez suivre le progrès avec PM2 logs ou curl http://0.0.0.0:5000/api/openfoodfacts/download-progress`);

    const startTime = Date.now();
    let validProducts = 0;
    let invalidProducts = 0;

    for (let i = 0; i < lines.length; i++) {
      try {
        const product = JSON.parse(lines[i]);
        
        // Filtrer les produits avec des données nutritionnelles valides
        if (this.isValidProduct(product)) {
          const formattedProduct = this.formatProduct(product);
          if (formattedProduct) {
            products.push(formattedProduct);
            validProducts++;
          } else {
            invalidProducts++;
          }
        } else {
          invalidProducts++;
        }
      } catch (error) {
        // Ignorer les lignes JSON invalides
        invalidProducts++;
        continue;
      }

      // Afficher le progrès détaillé et écrire dans un fichier pour PM2
      if (i % 25000 === 0 || i === lines.length - 1) {
        const progress = Math.round((i/lines.length)*100);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const estimated = i > 0 ? Math.round((elapsed / i) * lines.length) : 0;
        const remaining = Math.round(estimated - elapsed);
        
        console.log(`${logPrefix} 📊 Progrès: ${i}/${lines.length} (${progress}%)`);
        console.log(`${logPrefix} ✅ Produits valides: ${validProducts} | ❌ Invalides: ${invalidProducts}`);
        console.log(`${logPrefix} ⏱️ Temps écoulé: ${elapsed}s | Restant: ${remaining}s`);
        
        // Mettre à jour le fichier de progrès pour PM2
        const progressFile = path.join(this.dataDir, 'download-progress.json');
        const progressData = {
          timestamp: new Date().toISOString(),
          progress: progress,
          processedLines: i,
          totalLines: lines.length,
          validProducts: validProducts,
          invalidProducts: invalidProducts,
          elapsedSeconds: elapsed,
          remainingSeconds: remaining,
          status: i === lines.length - 1 ? 'completed' : 'processing'
        };
        
        try {
          await fs.writeFile(progressFile, JSON.stringify(progressData, null, 2));
        } catch (writeError) {
          console.error(`${logPrefix} ⚠️ Erreur écriture fichier progrès:`, writeError.message);
        }
      }
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`${logPrefix} 🎉 Traitement terminé en ${totalTime}s`);
    console.log(`${logPrefix} 📈 Résultats: ${validProducts} produits valides, ${invalidProducts} ignorés`);

    return products;
  }

  isValidProduct(product) {
    return (
      product &&
      (product.product_name || product.product_name_fr) &&
      product.nutriments &&
      (product.nutriments['energy-kcal_100g'] !== undefined || 
       product.nutriments['energy_100g'] !== undefined) &&
      // Accepter tous les produits avec des données nutritionnelles valides
      (
        !product.countries_tags || // Pas de restriction de pays si pas d'info
        product.countries_tags.includes('en:france') || 
        product.countries_tags.includes('en:world') ||
        product.lang === 'fr' ||
        product.lang === 'en' ||
        product.product_name_fr || // Si nom en français
        (product.product_name && product.product_name.length > 0)
      )
    );
  }

  formatProduct(product) {
    try {
      const energyKcal = this.parseNutriment(product.nutriments['energy-kcal_100g']) ||
                        Math.round((this.parseNutriment(product.nutriments['energy_100g']) || 0) / 4.184);

      return {
        id: product.code || `off_${Date.now()}_${Math.random()}`,
        name: product.product_name_fr || product.product_name || 'Produit sans nom',
        brand: product.brands || undefined,
        barcode: product.code,
        nutriments: {
          energy_kcal: energyKcal || 0,
          proteins: this.parseNutriment(product.nutriments.proteins_100g) || 0,
          carbohydrates: this.parseNutriment(product.nutriments.carbohydrates_100g) || 0,
          fat: this.parseNutriment(product.nutriments.fat_100g) || 0,
          fiber: this.parseNutriment(product.nutriments.fiber_100g),
          sugars: this.parseNutriment(product.nutriments.sugars_100g),
          salt: this.parseNutriment(product.nutriments.salt_100g),
        },
        image_url: product.image_front_url || product.image_url,
        quantity: product.quantity,
        categories: product.categories,
        ingredients_text: product.ingredients_text_fr || product.ingredients_text,
        source: 'openfoodfacts_local'
      };
    } catch (error) {
      return null;
    }
  }

  parseNutriment(value) {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  async getDatabaseStats() {
    try {
      const data = await fs.readFile(this.openfoodfactsFile, 'utf8');
      const products = JSON.parse(data);
      return {
        totalProducts: products.length,
        lastUpdate: (await fs.stat(this.openfoodfactsFile)).mtime,
        fileSize: (await fs.stat(this.openfoodfactsFile)).size
      };
    } catch (error) {
      return null;
    }
  }
}

// Script principal
async function main() {
  const downloader = new OpenFoodFactsDownloader();
  
  try {
    const productCount = await downloader.downloadDatabase();
    console.log(`🎉 Base de données OpenFoodFacts téléchargée avec succès!`);
    console.log(`📊 ${productCount} produits disponibles localement`);
    
    const stats = await downloader.getDatabaseStats();
    if (stats) {
      console.log(`📁 Taille du fichier: ${Math.round(stats.fileSize / 1024 / 1024)}MB`);
      console.log(`📅 Dernière mise à jour: ${stats.lastUpdate}`);
    }
  } catch (error) {
    console.error('❌ Échec du téléchargement:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = OpenFoodFactsDownloader;
