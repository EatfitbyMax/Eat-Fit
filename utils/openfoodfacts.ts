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

      console.log('Recherche OpenFoodFacts pour:', query);

      // Créer un contrôleur d'abort pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

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
          const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
          
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
          console.log('Toutes les APIs OpenFoodFacts échouées, utilisation des aliments locaux');
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

  // Base de données locale étendue d'aliments
  static getAllLocalFoods(): FoodProduct[] {
    return [
      // Fruits
      {
        id: 'banana',
        name: 'Banane',
        categories: 'fruits',
        nutriments: { energy_kcal: 89, proteins: 1.1, carbohydrates: 23, fat: 0.3, fiber: 2.6 }
      },
      {
        id: 'apple',
        name: 'Pomme',
        categories: 'fruits',
        nutriments: { energy_kcal: 52, proteins: 0.3, carbohydrates: 14, fat: 0.2, fiber: 2.4 }
      },
      {
        id: 'orange',
        name: 'Orange',
        categories: 'fruits',
        nutriments: { energy_kcal: 47, proteins: 0.9, carbohydrates: 12, fat: 0.1, fiber: 2.4 }
      },
      {
        id: 'strawberry',
        name: 'Fraise',
        categories: 'fruits',
        nutriments: { energy_kcal: 32, proteins: 0.7, carbohydrates: 8, fat: 0.3, fiber: 2 }
      },
      {
        id: 'kiwi',
        name: 'Kiwi',
        categories: 'fruits',
        nutriments: { energy_kcal: 61, proteins: 1.1, carbohydrates: 15, fat: 0.5, fiber: 3 }
      },
      
      // Légumes
      {
        id: 'carrot',
        name: 'Carotte',
        categories: 'légumes',
        nutriments: { energy_kcal: 41, proteins: 0.9, carbohydrates: 10, fat: 0.2, fiber: 2.8 }
      },
      {
        id: 'tomato',
        name: 'Tomate',
        categories: 'légumes',
        nutriments: { energy_kcal: 18, proteins: 0.9, carbohydrates: 3.9, fat: 0.2, fiber: 1.2 }
      },
      {
        id: 'broccoli',
        name: 'Brocoli',
        categories: 'légumes',
        nutriments: { energy_kcal: 34, proteins: 2.8, carbohydrates: 7, fat: 0.4, fiber: 2.6 }
      },
      {
        id: 'spinach',
        name: 'Épinards',
        categories: 'légumes',
        nutriments: { energy_kcal: 23, proteins: 2.9, carbohydrates: 3.6, fat: 0.4, fiber: 2.2 }
      },
      
      // Protéines
      {
        id: 'chicken',
        name: 'Blanc de poulet',
        categories: 'viandes',
        nutriments: { energy_kcal: 165, proteins: 31, carbohydrates: 0, fat: 3.6, fiber: 0 }
      },
      {
        id: 'salmon',
        name: 'Saumon',
        categories: 'poissons',
        nutriments: { energy_kcal: 208, proteins: 25, carbohydrates: 0, fat: 12, fiber: 0 }
      },
      {
        id: 'eggs',
        name: 'Œufs',
        categories: 'protéines',
        nutriments: { energy_kcal: 155, proteins: 13, carbohydrates: 1.1, fat: 11, fiber: 0 }
      },
      {
        id: 'tuna',
        name: 'Thon',
        categories: 'poissons',
        nutriments: { energy_kcal: 144, proteins: 30, carbohydrates: 0, fat: 1, fiber: 0 }
      },
      
      // Céréales et féculents
      {
        id: 'bread',
        name: 'Pain complet',
        categories: 'céréales',
        nutriments: { energy_kcal: 247, proteins: 13, carbohydrates: 41, fat: 4.2, fiber: 7 }
      },
      {
        id: 'rice',
        name: 'Riz blanc cuit',
        categories: 'céréales',
        nutriments: { energy_kcal: 130, proteins: 2.7, carbohydrates: 28, fat: 0.3, fiber: 0.4 }
      },
      {
        id: 'pasta',
        name: 'Pâtes',
        categories: 'céréales',
        nutriments: { energy_kcal: 131, proteins: 5, carbohydrates: 25, fat: 1.1, fiber: 1.8 }
      },
      {
        id: 'oats',
        name: 'Avoine',
        categories: 'céréales',
        nutriments: { energy_kcal: 389, proteins: 17, carbohydrates: 66, fat: 7, fiber: 11 }
      },
      
      // Produits laitiers
      {
        id: 'milk',
        name: 'Lait entier',
        categories: 'laitages',
        nutriments: { energy_kcal: 61, proteins: 3.2, carbohydrates: 4.8, fat: 3.3, fiber: 0 }
      },
      {
        id: 'yogurt',
        name: 'Yaourt nature',
        categories: 'laitages',
        nutriments: { energy_kcal: 59, proteins: 10, carbohydrates: 3.6, fat: 0.4, fiber: 0 }
      },
      {
        id: 'cheese',
        name: 'Fromage',
        categories: 'laitages',
        nutriments: { energy_kcal: 113, proteins: 7, carbohydrates: 1, fat: 9, fiber: 0 }
      },
      
      // Légumineuses
      {
        id: 'lentils',
        name: 'Lentilles',
        categories: 'légumineuses',
        nutriments: { energy_kcal: 116, proteins: 9, carbohydrates: 20, fat: 0.4, fiber: 8 }
      },
      {
        id: 'chickpeas',
        name: 'Pois chiches',
        categories: 'légumineuses',
        nutriments: { energy_kcal: 164, proteins: 8.9, carbohydrates: 27, fat: 2.6, fiber: 8 }
      },
      
      // Noix et graines
      {
        id: 'almonds',
        name: 'Amandes',
        categories: 'oléagineux',
        nutriments: { energy_kcal: 579, proteins: 21, carbohydrates: 22, fat: 50, fiber: 12 }
      },
      {
        id: 'walnuts',
        name: 'Noix',
        categories: 'oléagineux',
        nutriments: { energy_kcal: 654, proteins: 15, carbohydrates: 14, fat: 65, fiber: 7 }
      }
    ];
  }

  // Suggestions d'aliments populaires
  static getPopularFoods(): FoodProduct[] {
    const allFoods = this.getAllLocalFoods();
    return allFoods.slice(0, 8); // Retourner les 8 premiers aliments
  }
}