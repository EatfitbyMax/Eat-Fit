import { Alert } from 'react-native';

export interface FoodProduct {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  nutriments: {
    energy_kcal?: number;
    proteins?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sugars?: number;
    salt?: number;
  };
  image_url?: string;
  quantity?: string;
  categories?: string;
  ingredients_text?: string;
}

export interface FoodEntry {
  id: string;
  product: FoodProduct;
  quantity: number; // en grammes
  mealType: 'Petit-déjeuner' | 'Déjeuner' | 'Collation' | 'Dîner';
  date: string;
  calories: number;
  proteins: number;
  carbohydrates: number;
  fat: number;
}

export class OpenFoodFactsService {
  private static readonly BASE_URL = 'https://world.openfoodfacts.org/api/v2';

  // Rechercher des aliments par nom
  static async searchFood(query: string): Promise<FoodProduct[]> {
    try {
      // Si pas de requête, retourner directement les aliments populaires
      if (!query || query.trim() === '') {
        return this.getPopularFoods();
      }

      console.log('Recherche pour:', query);

      // D'abord essayer notre base OpenFoodFacts locale
      console.log('🔍 Recherche dans la base OpenFoodFacts locale...');
      const localResults = await this.searchOpenFoodFactsLocal(query);
      
      if (localResults && localResults.length > 0) {
        console.log(`✅ ${localResults.length} résultats trouvés dans la base locale OpenFoodFacts`);
        return localResults;
      }

      // Si pas de résultats locaux, essayer CIQUAL
      console.log('🔍 Recherche dans la base CIQUAL...');
      const ciqualResults = await this.searchCiqual(query);
      
      if (ciqualResults && ciqualResults.length > 0) {
        console.log(`✅ ${ciqualResults.length} résultats trouvés dans CIQUAL`);
        return ciqualResults;
      }

      // En dernier recours, essayer l'API OpenFoodFacts en ligne
      console.log('🌐 Tentative API OpenFoodFacts en ligne...');
      
      // Créer un contrôleur d'abort pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes timeout

      try {
        // Essayer d'abord l'API v2 plus moderne
        let response = await fetch(
          `https://world.openfoodfacts.org/api/v2/search?q=${encodeURIComponent(query)}&fields=code,product_name,product_name_fr,brands,nutriments,image_url,image_front_url,quantity,categories,ingredients_text,ingredients_text_fr&page_size=20`,
          { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'EatFitbyMax/1.0'
            }
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.log('API v2 échouée, tentative avec API v0...');

          // Fallback vers l'API v0
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

          response = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`,
            { 
              signal: controller2.signal,
              headers: {
                'User-Agent': 'EatFitbyMax/1.0'
              }
            }
          );

          clearTimeout(timeoutId2);
        }

        if (!response.ok) {
          console.log('Toutes les APIs OpenFoodFacts échouées, recherche locale...');
          return this.getSearchableLocalFoods(query);
        }

        const data = await response.json();
        console.log('Réponse OpenFoodFacts reçue');

        // Vérifier que la réponse contient des produits
        const products = data.products || data.items || [];
        if (!Array.isArray(products) || products.length === 0) {
          console.log('Aucun produit trouvé dans la réponse, recherche locale...');
          return this.getSearchableLocalFoods(query);
        }

        // Filtrer les produits avec des données nutritionnelles valides
        const validProducts = products.filter((product: any) => 
          product && 
          (product.product_name || product.product_name_fr) && 
          product.nutriments
        );

        if (validProducts.length === 0) {
          console.log('Aucun produit valide trouvé, recherche locale...');
          return this.getSearchableLocalFoods(query);
        }

        console.log(`${validProducts.length} produits valides trouvés`);

        const formattedProducts = validProducts.map((product: any) => {
          return {
            id: product.code || `search_${Date.now()}_${Math.random()}`,
            name: product.product_name_fr || product.product_name || 'Produit inconnu',
            brand: product.brands || undefined,
            barcode: product.code,
            nutriments: {
              energy_kcal: this.parseNutriment(product.nutriments?.['energy-kcal_100g']) || 
                          Math.round((this.parseNutriment(product.nutriments?.['energy_100g']) || 0) / 4.184) || 0,
              proteins: this.parseNutriment(product.nutriments?.proteins_100g) || 0,
              carbohydrates: this.parseNutriment(product.nutriments?.carbohydrates_100g) || 0,
              fat: this.parseNutriment(product.nutriments?.fat_100g) || 0,
              fiber: this.parseNutriment(product.nutriments?.fiber_100g),
              sugars: this.parseNutriment(product.nutriments?.sugars_100g),
              salt: this.parseNutriment(product.nutriments?.salt_100g),
            },
            image_url: product.image_url || product.image_front_url,
            quantity: product.quantity,
            categories: product.categories,
            ingredients_text: product.ingredients_text_fr || product.ingredients_text,
          };
        });

        return formattedProducts;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.log('Timeout de recherche OpenFoodFacts, recherche locale...');
        } else {
          console.log('Erreur réseau OpenFoodFacts:', fetchError);
        }
        return this.getSearchableLocalFoods(query);
      }

    } catch (error) {
      console.error('Erreur recherche OpenFoodFacts:', error);
      // En cas d'erreur, faire une recherche locale
      return this.getSearchableLocalFoods(query);
    }
  }

  // Récupérer un produit par code-barres
  static async getProductByBarcode(barcode: string): Promise<FoodProduct | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/product/${barcode}.json`);

      if (!response.ok) {
        throw new Error('Produit non trouvé');
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        return this.formatProduct(data.product);
      }

      return null;
    } catch (error) {
      console.error('Erreur récupération produit:', error);
      throw new Error('Produit non trouvé');
    }
  }

  // Formater les données du produit OpenFoodFacts
  private static formatProduct(product: any): FoodProduct {
    // Récupérer l'énergie en kcal, avec fallback sur kJ converti
    let energyKcal = this.parseNutriment(product.nutriments?.['energy-kcal_100g']);
    if (!energyKcal && product.nutriments?.['energy_100g']) {
      // Convertir kJ en kcal (1 kcal = 4.184 kJ)
      energyKcal = Math.round(this.parseNutriment(product.nutriments['energy_100g']) / 4.184);
    }

    return {
      id: product.code || product._id || Date.now().toString(),
      name: product.product_name || product.product_name_fr || 'Produit sans nom',
      brand: product.brands || undefined,
      barcode: product.code,
      nutriments: {
        energy_kcal: energyKcal || 0,
        proteins: this.parseNutriment(product.nutriments?.proteins_100g) || 0,
        carbohydrates: this.parseNutriment(product.nutriments?.carbohydrates_100g) || 0,
        fat: this.parseNutriment(product.nutriments?.fat_100g) || 0,
        fiber: this.parseNutriment(product.nutriments?.fiber_100g),
        sugars: this.parseNutriment(product.nutriments?.sugars_100g),
        salt: this.parseNutriment(product.nutriments?.salt_100g),
      },
      image_url: product.image_front_url || product.image_url,
      quantity: product.quantity,
      categories: product.categories,
      ingredients_text: product.ingredients_text || product.ingredients_text_fr,
    };
  }

  // Obtenir les aliments favoris de l'utilisateur
  static async getFavoriteFoods(userId: string): Promise<FoodProduct[]> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem(`favorite_foods_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération favoris:', error);
      return [];
    }
  }

  // Ajouter un aliment aux favoris
  static async addToFavorites(userId: string, product: FoodProduct): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const favorites = await this.getFavoriteFoods(userId);

      // Vérifier si l'aliment n'est pas déjà dans les favoris
      const exists = favorites.find(fav => fav.id === product.id);
      if (!exists) {
        favorites.push(product);
        await AsyncStorage.setItem(`favorite_foods_${userId}`, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Erreur ajout favori:', error);
    }
  }

  // Retirer un aliment des favoris
  static async removeFromFavorites(userId: string, productId: string): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const favorites = await this.getFavoriteFoods(userId);
      const filtered = favorites.filter(fav => fav.id !== productId);
      await AsyncStorage.setItem(`favorite_foods_${userId}`, JSON.stringify(filtered));
    } catch (error) {
      console.error('Erreur suppression favori:', error);
    }
  }

  private static parseNutriment(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  // Calculer les valeurs nutritionnelles pour une quantité donnée
  static calculateNutrition(product: FoodProduct, quantityInGrams: number): {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fat: number;
  } {
    try {
      if (!product || !product.nutriments || quantityInGrams <= 0) {
        return { calories: 0, proteins: 0, carbohydrates: 0, fat: 0 };
      }

      const factor = quantityInGrams / 100; // OpenFoodFacts donne les valeurs pour 100g

      return {
        calories: Math.round((product.nutriments.energy_kcal || 0) * factor),
        proteins: Math.round((product.nutriments.proteins || 0) * factor * 10) / 10,
        carbohydrates: Math.round((product.nutriments.carbohydrates || 0) * factor * 10) / 10,
        fat: Math.round((product.nutriments.fat || 0) * factor * 10) / 10
      };
    } catch (error) {
      console.error('Erreur calcul nutrition:', error);
      return { calories: 0, proteins: 0, carbohydrates: 0, fat: 0 };
    }
  }

  // Recherche locale dans les aliments pré-définis
  static getSearchableLocalFoods(query: string): FoodProduct[] {
    const allLocalFoods = this.getAllLocalFoods();

    if (!query || query.trim() === '') {
      return this.getPopularFoods();
    }

    const searchTerm = query.toLowerCase().trim();
    const matchedFoods = allLocalFoods.filter(food => 
      food.name.toLowerCase().includes(searchTerm) ||
      (food.brand && food.brand.toLowerCase().includes(searchTerm)) ||
      (food.categories && food.categories.toLowerCase().includes(searchTerm))
    );

    console.log(`Recherche locale: ${matchedFoods.length} aliments trouvés pour "${query}"`);

    return matchedFoods.length > 0 ? matchedFoods : this.getPopularFoods();
  }

  // Base de données locale d'aliments français
  static getAllLocalFoods(): FoodProduct[] {
    return [
      // Fruits français et de saison
      {
        id: 'pomme_golden',
        name: 'Pomme Golden (France)',
        brand: 'Origine France',
        categories: 'fruits français',
        nutriments: { energy_kcal: 52, proteins: 0.3, carbohydrates: 14, fat: 0.2, fiber: 2.4 }
      },
      {
        id: 'poire_williams',
        name: 'Poire Williams (France)',
        brand: 'Origine France',
        categories: 'fruits français',
        nutriments: { energy_kcal: 53, proteins: 0.3, carbohydrates: 12, fat: 0.1, fiber: 3.3 }
      },
      {
        id: 'fraise_france',
        name: 'Fraises de France',
        brand: 'Origine France',
        categories: 'fruits français',
        nutriments: { energy_kcal: 32, proteins: 0.7, carbohydrates: 8, fat: 0.3, fiber: 2 }
      },
      {
        id: 'cerise_france',
        name: 'Cerises de France',
        brand: 'Origine France',
        categories: 'fruits français',
        nutriments: { energy_kcal: 68, proteins: 1.1, carbohydrates: 15, fat: 0.3, fiber: 2.1 }
      },
      {
        id: 'peche_france',
        name: 'Pêches de France',
        brand: 'Origine France',
        categories: 'fruits français',
        nutriments: { energy_kcal: 38, proteins: 0.8, carbohydrates: 8.1, fat: 0.1, fiber: 1.9 }
      },
      {
        id: 'raisin_chasselas',
        name: 'Raisin Chasselas (France)',
        brand: 'Origine France',
        categories: 'fruits français',
        nutriments: { energy_kcal: 62, proteins: 0.6, carbohydrates: 16, fat: 0.2, fiber: 0.9 }
      },
      {
        id: 'melon_charentais',
        name: 'Melon Charentais',
        brand: 'Origine France',
        categories: 'fruits français',
        nutriments: { energy_kcal: 34, proteins: 0.8, carbohydrates: 8.2, fat: 0.2, fiber: 0.9 }
      },

      // Légumes français
      {
        id: 'tomate_francaise',
        name: 'Tomates françaises',
        brand: 'Origine France',
        categories: 'légumes français',
        nutriments: { energy_kcal: 18, proteins: 0.9, carbohydrates: 3.9, fat: 0.2, fiber: 1.2 }
      },
      {
        id: 'carotte_francaise',
        name: 'Carottes françaises',
        brand: 'Origine France',
        categories: 'légumes français',
        nutriments: { energy_kcal: 41, proteins: 0.9, carbohydrates: 10, fat: 0.2, fiber: 2.8 }
      },
      {
        id: 'poireau_france',
        name: 'Poireaux de France',
        brand: 'Origine France',
        categories: 'légumes français',
        nutriments: { energy_kcal: 61, proteins: 1.5, carbohydrates: 14, fat: 0.3, fiber: 1.8 }
      },
      {
        id: 'courgette_france',
        name: 'Courgettes françaises',
        brand: 'Origine France',
        categories: 'légumes français',
        nutriments: { energy_kcal: 17, proteins: 1.2, carbohydrates: 3.1, fat: 0.3, fiber: 1 }
      },
      {
        id: 'haricot_vert_france',
        name: 'Haricots verts français',
        brand: 'Origine France',
        categories: 'légumes français',
        nutriments: { energy_kcal: 35, proteins: 2.4, carbohydrates: 8, fat: 0.2, fiber: 4 }
      },
      {
        id: 'radis_france',
        name: 'Radis français',
        brand: 'Origine France',
        categories: 'légumes français',
        nutriments: { energy_kcal: 16, proteins: 0.7, carbohydrates: 3.4, fat: 0.1, fiber: 1.6 }
      },
      {
        id: 'salade_verte',
        name: 'Salade verte française',
        brand: 'Origine France',
        categories: 'légumes français',
        nutriments: { energy_kcal: 14, proteins: 1.2, carbohydrates: 1.4, fat: 0.2, fiber: 1.5 }
      },

      // Fromages français AOP
      {
        id: 'camembert_normandie',
        name: 'Camembert de Normandie AOP',
        brand: 'Président',
        categories: 'fromages français',
        nutriments: { energy_kcal: 265, proteins: 21, carbohydrates: 0.5, fat: 20, fiber: 0 }
      },
      {
        id: 'roquefort',
        name: 'Roquefort AOP',
        brand: 'Société',
        categories: 'fromages français',
        nutriments: { energy_kcal: 369, proteins: 19, carbohydrates: 2, fat: 32, fiber: 0 }
      },
      {
        id: 'comte',
        name: 'Comté AOP',
        brand: 'Juraflore',
        categories: 'fromages français',
        nutriments: { energy_kcal: 417, proteins: 27, carbohydrates: 1.5, fat: 34, fiber: 0 }
      },
      {
        id: 'chevre_crottin',
        name: 'Crottin de Chavignol AOP',
        brand: 'Soignon',
        categories: 'fromages français',
        nutriments: { energy_kcal: 364, proteins: 25, carbohydrates: 2.5, fat: 29, fiber: 0 }
      },
      {
        id: 'brie_meaux',
        name: 'Brie de Meaux AOP',
        brand: 'Dong',
        categories: 'fromages français',
        nutriments: { energy_kcal: 334, proteins: 21, carbohydrates: 0.5, fat: 27, fiber: 0 }
      },

      // Produits laitiers français
      {
        id: 'yaourt_bulgare',
        name: 'Yaourt à la bulgare',
        brand: 'Danone',
        categories: 'produits laitiers français',
        nutriments: { energy_kcal: 59, proteins: 10, carbohydrates: 3.6, fat: 0.4, fiber: 0 }
      },
      {
        id: 'fromage_blanc_campagne',
        name: 'Fromage blanc de campagne',
        brand: 'Bridel',
        categories: 'produits laitiers français',
        nutriments: { energy_kcal: 98, proteins: 11, carbohydrates: 3.4, fat: 4.3, fiber: 0 }
      },
      {
        id: 'lait_demi_ecreme',
        name: 'Lait demi-écrémé français',
        brand: 'Lactel',
        categories: 'produits laitiers français',
        nutriments: { energy_kcal: 46, proteins: 3.2, carbohydrates: 4.8, fat: 1.6, fiber: 0 }
      },
      {
        id: 'beurre_normandie',
        name: 'Beurre de Normandie AOP',
        brand: 'Isigny Sainte-Mère',
        categories: 'produits laitiers français',
        nutriments: { energy_kcal: 717, proteins: 0.7, carbohydrates: 0.6, fat: 81, fiber: 0 }
      },

      // Viennoiseries françaises
      {
        id: 'croissant_beurre',
        name: 'Croissant au beurre',
        brand: 'Boulangerie française',
        categories: 'viennoiseries françaises',
        nutriments: { energy_kcal: 406, proteins: 8.2, carbohydrates: 46, fat: 21, fiber: 2.6 }
      },
      {
        id: 'pain_chocolat',
        name: 'Pain au chocolat',
        brand: 'Boulangerie française',
        categories: 'viennoiseries françaises',
        nutriments: { energy_kcal: 414, proteins: 7.8, carbohydrates: 45, fat: 23, fiber: 2.5 }
      },
      {
        id: 'brioche_vendeen',
        name: 'Brioche vendéenne',
        brand: 'Pasquier',
        categories: 'viennoiseries françaises',
        nutriments: { energy_kcal: 367, proteins: 8.5, carbohydrates: 49, fat: 15, fiber: 2.8 }
      },
      {
        id: 'chausson_pommes',
        name: 'Chausson aux pommes',
        brand: 'Boulangerie française',
        categories: 'viennoiseries françaises',
        nutriments: { energy_kcal: 302, proteins: 4.2, carbohydrates: 38, fat: 15, fiber: 2.1 }
      },

      // Pains français
      {
        id: 'baguette_tradition',
        name: 'Baguette tradition française',
        brand: 'Boulangerie artisanale',
        categories: 'pains français',
        nutriments: { energy_kcal: 280, proteins: 7.5, carbohydrates: 57, fat: 1.4, fiber: 3.5 }
      },
      {
        id: 'pain_complet',
        name: 'Pain complet français',
        brand: 'Poilâne',
        categories: 'pains français',
        nutriments: { energy_kcal: 230, proteins: 8.5, carbohydrates: 45, fat: 3.5, fiber: 8.5 }
      },
      {
        id: 'pain_seigle',
        name: 'Pain de seigle français',
        brand: 'Boulangerie artisanale',
        categories: 'pains français',
        nutriments: { energy_kcal: 219, proteins: 8.4, carbohydrates: 41, fat: 1.7, fiber: 5.8 }
      },

      // Pâtes et céréales françaises
      {
        id: 'pates_ble_dur',
        name: 'Pâtes blé dur français',
        brand: 'Panzani',
        categories: 'pâtes françaises',
        nutriments: { energy_kcal: 131, proteins: 5, carbohydrates: 25, fat: 1.1, fiber: 1.8 }
      },
      {
        id: 'riz_camargue',
        name: 'Riz de Camargue IGP',
        brand: 'Taureau Ailé',
        categories: 'céréales françaises',
        nutriments: { energy_kcal: 130, proteins: 2.7, carbohydrates: 28, fat: 0.3, fiber: 0.4 }
      },

      // Viandes françaises
      {
        id: 'poulet_fermier',
        name: 'Poulet fermier français',
        brand: 'Label Rouge',
        categories: 'viandes françaises',
        nutriments: { energy_kcal: 165, proteins: 31, carbohydrates: 0, fat: 3.6, fiber: 0 }
      },
      {
        id: 'boeuf_charolais',
        name: 'Bœuf Charolais français',
        brand: 'Label Rouge',
        categories: 'viandes françaises',
        nutriments: { energy_kcal: 250, proteins: 26, carbohydrates: 0, fat: 15, fiber: 0 }
      },
      {
        id: 'porc_francais',
        name: 'Porc français',
        brand: 'Origine France',
        categories: 'viandes françaises',
        nutriments: { energy_kcal: 200, proteins: 25, carbohydrates: 0, fat: 11, fiber: 0 }
      },

      // Poissons français
      {
        id: 'sole_bretagne',
        name: 'Sole de Bretagne',
        brand: 'Pêche française',
        categories: 'poissons français',
        nutriments: { energy_kcal: 83, proteins: 18, carbohydrates: 0, fat: 0.9, fiber: 0 }
      },
      {
        id: 'saumon_france',
        name: 'Saumon français',
        brand: 'Pêche française',
        categories: 'poissons français',
        nutriments: { energy_kcal: 184, proteins: 25, carbohydrates: 0, fat: 8.5, fiber: 0 }
      },
      {
        id: 'sardine_bretagne',
        name: 'Sardines de Bretagne',
        brand: 'Pêche française',
        categories: 'poissons français',
        nutriments: { energy_kcal: 135, proteins: 19, carbohydrates: 0, fat: 6.2, fiber: 0 }
      },

      // Légumineuses françaises
      {
        id: 'lentilles_berry',
        name: 'Lentilles vertes du Berry',
        brand: 'France Lentilles',
        categories: 'légumineuses françaises',
        nutriments: { energy_kcal: 116, proteins: 9, carbohydrates: 20, fat: 0.4, fiber: 8 }
      },
      {
        id: 'haricots_tarbais',
        name: 'Haricots Tarbais IGP',
        brand: 'Coopérative du Haricot Tarbais',
        categories: 'légumineuses françaises',
        nutriments: { energy_kcal: 129, proteins: 9.5, carbohydrates: 20, fat: 0.6, fiber: 8.7 }
      },

      // Desserts français
      {
        id: 'chocolat_valrhona',
        name: 'Chocolat noir Valrhona 70%',
        brand: 'Valrhona',
        categories: 'chocolats français',
        nutriments: { energy_kcal: 579, proteins: 7.8, carbohydrates: 29, fat: 42, fiber: 15 }
      },
      {
        id: 'madeleines_commercy',
        name: 'Madeleines de Commercy',
        brand: 'St Michel',
        categories: 'desserts français',
        nutriments: { energy_kcal: 463, proteins: 6.8, carbohydrates: 54, fat: 24, fiber: 1.8 }
      },
      {
        id: 'tarte_tatin',
        name: 'Tarte Tatin',
        brand: 'Pâtisserie française',
        categories: 'desserts français',
        nutriments: { energy_kcal: 267, proteins: 3.2, carbohydrates: 38, fat: 12, fiber: 2.1 }
      },

      // Pancakes français (adaptation locale)
      {
        id: 'pancake_francais',
        name: 'Pancakes français',
        brand: 'Recette française',
        categories: 'petit-déjeuner français',
        nutriments: { energy_kcal: 227, proteins: 6, carbohydrates: 28, fat: 10, fiber: 1.5 }
      },
      {
        id: 'crepe_bretonne',
        name: 'Crêpe bretonne',
        brand: 'Bretagne',
        categories: 'petit-déjeuner français',
        nutriments: { energy_kcal: 212, proteins: 6.1, carbohydrates: 26, fat: 9.8, fiber: 1.2 }
      },

      // Boissons françaises
      {
        id: 'jus_pomme_normandie',
        name: 'Jus de pomme de Normandie',
        brand: 'Val de Rance',
        categories: 'boissons françaises',
        nutriments: { energy_kcal: 46, proteins: 0.1, carbohydrates: 11.3, fat: 0.1, fiber: 0.2 }
      },
      {
        id: 'cafe_francais',
        name: 'Café français',
        brand: 'Malongo',
        categories: 'boissons françaises',
        nutriments: { energy_kcal: 2, proteins: 0.3, carbohydrates: 0, fat: 0, fiber: 0 }
      },

      // Glaces françaises
      {
        id: 'glace_vanille',
        name: 'Glace vanille française',
        brand: 'Häagen-Dazs France',
        categories: 'glaces françaises',
        nutriments: { energy_kcal: 207, proteins: 3.5, carbohydrates: 21, fat: 12, fiber: 0 }
      },
      {
        id: 'sorbet_citron',
        name: 'Sorbet au citron',
        brand: 'Picard',
        categories: 'glaces françaises',
        nutriments: { energy_kcal: 134, proteins: 0.4, carbohydrates: 34, fat: 0.1, fiber: 0.2 }
      },
      {
        id: 'glace_eau_fruit',
        name: 'Glace à l\'eau aux fruits',
        brand: 'La Gervais',
        categories: 'glaces françaises',
        nutriments: { energy_kcal: 70, proteins: 0.1, carbohydrates: 17, fat: 0.1, fiber: 0 }
      }
    ];
  }

  // Suggestions d'aliments populaires français
  static getPopularFoods(): FoodProduct[] {
    const allFoods = this.getAllLocalFoods();
    
    // Sélectionner des aliments populaires français et variés
    const popularIds = [
      'pomme_golden', 'baguette_tradition', 'camembert_normandie', 'poulet_fermier', 
      'yaourt_bulgare', 'croissant_beurre', 'tomate_francaise', 'fromage_blanc_campagne',
      'pancake_francais', 'pates_ble_dur', 'lentilles_berry', 'chocolat_valrhona'
    ];
    
    const popularFoods = popularIds
      .map(id => allFoods.find(food => food.id === id))
      .filter(food => food !== undefined);
    
    // Si on n'a pas assez d'aliments populaires, compléter avec les premiers
    if (popularFoods.length < 8) {
      const remaining = allFoods.filter(food => !popularIds.includes(food.id));
      popularFoods.push(...remaining.slice(0, 8 - popularFoods.length));
    }
    
    return popularFoods.slice(0, 8);
  }
    // Recherche OpenFoodFacts local via le serveur
  static async searchOpenFoodFactsLocal(query: string): Promise<FoodProduct[]> {
    try {
      console.log('Recherche OpenFoodFacts local pour:', query);

      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://workspace-5000.kirk.replit.dev';
      const response = await fetch(`${serverUrl}/api/openfoodfacts/search?q=${encodeURIComponent(query)}&limit=20`);

      if (!response.ok) {
        console.log('Erreur serveur OpenFoodFacts local, essai CIQUAL...');
        return this.searchCiqual(query);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        console.log('Aucun résultat OpenFoodFacts local, essai CIQUAL...');
        return this.searchCiqual(query);
      }

      console.log(`${data.length} produits OpenFoodFacts local trouvés`);
      return data;
    } catch (error) {
      console.error('Erreur recherche OpenFoodFacts local:', error);
      return this.searchCiqual(query);
    }
  }

  // Recherche CIQUAL via le serveur local
  static async searchCiqual(query: string): Promise<FoodProduct[]> {
    try {
      console.log('Recherche CIQUAL pour:', query);

      // Utiliser l'URL du serveur local déployé sur Replit
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://workspace-5000.kirk.replit.dev';
      const response = await fetch(`${serverUrl}/api/ciqual/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        console.log('Erreur serveur CIQUAL, utilisation locale...');
        return this.getSearchableLocalFoods(query);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        console.log('Aucun résultat CIQUAL, utilisation locale...');
        return this.getSearchableLocalFoods(query);
      }

      // Formater les données CIQUAL pour correspondre à FoodProduct
      const formattedProducts: FoodProduct[] = data.map((item: any) => ({
        id: item.id || `ciqual_${item.code}`,
        name: item.name,
        brand: 'CIQUAL',
        categories: item.category || 'Aliments',
        nutriments: {
          energy_kcal: item.nutriments?.energy_kcal || 0,
          proteins: item.nutriments?.proteins || 0,
          carbohydrates: item.nutriments?.carbohydrates || 0,
          fat: item.nutriments?.fat || 0,
          fiber: item.nutriments?.fiber,
          sugars: item.nutriments?.sugars,
          salt: item.nutriments?.salt,
        },
      }));

      console.log(`${formattedProducts.length} produits CIQUAL trouvés`);
      return formattedProducts;
    } catch (error) {
      console.error('Erreur recherche CIQUAL:', error);
      return this.getSearchableLocalFoods(query); // Fallback final
    }
  }
}