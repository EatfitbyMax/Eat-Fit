
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
    console.log('🔄 Téléchargement de la base OpenFoodFacts...');
    
    try {
      // Créer le dossier data s'il n'existe pas
      await fs.mkdir(this.dataDir, { recursive: true });

      // Télécharger le fichier compressé
      const compressedData = await this.downloadFile(this.downloadUrl);
      console.log('✅ Fichier téléchargé, décompression...');

      // Décompresser les données
      const decompressedData = await this.decompress(compressedData);
      console.log('✅ Données décompressées, traitement...');

      // Traiter et filtrer les données
      const processedData = await this.processData(decompressedData);
      console.log(`✅ ${processedData.length} produits traités`);

      // Sauvegarder les données
      await fs.writeFile(this.openfoodfactsFile, JSON.stringify(processedData, null, 2));
      console.log('✅ Base de données OpenFoodFacts sauvegardée');

      return processedData.length;
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
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
    const maxProducts = 50000; // Limiter pour éviter les fichiers trop volumineux
    
    console.log(`📊 Traitement de ${lines.length} lignes...`);

    for (let i = 0; i < Math.min(lines.length, maxProducts); i++) {
      try {
        const product = JSON.parse(lines[i]);
        
        // Filtrer les produits avec des données nutritionnelles valides
        if (this.isValidProduct(product)) {
          const formattedProduct = this.formatProduct(product);
          if (formattedProduct) {
            products.push(formattedProduct);
          }
        }
      } catch (error) {
        // Ignorer les lignes JSON invalides
        continue;
      }

      // Afficher le progrès
      if (i % 10000 === 0) {
        console.log(`📊 Traité: ${i}/${Math.min(lines.length, maxProducts)} produits`);
      }
    }

    return products;
  }

  isValidProduct(product) {
    return (
      product &&
      (product.product_name || product.product_name_fr) &&
      product.nutriments &&
      product.nutriments['energy-kcal_100g'] !== undefined &&
      product.countries_tags &&
      (product.countries_tags.includes('en:france') || 
       product.countries_tags.includes('en:world') ||
       product.lang === 'fr')
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
