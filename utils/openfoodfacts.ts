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
      // Utiliser l'API v0 qui est plus stable
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();

      // Filtrer les produits avec des données nutritionnelles valides
      const validProducts = data.products?.filter((product: any) => 
        product.product_name && 
        product.nutriments && 
        (product.nutriments['energy-kcal_100g'] || product.nutriments['energy_100g'])
      ) || [];

      return validProducts.map((product: any) => {
      return {
        barcode: product.code || '',
        name: product.product_name_fr || product.product_name || 'Produit inconnu',
        brand: product.brands || '',
        quantity: product.quantity || '',
        calories: product.nutriments?.['energy-kcal_100g'] || 0,
        proteins: product.nutriments?.proteins_100g || 0,
        carbs: product.nutriments?.carbohydrates_100g || 0,
        fats: product.nutriments?.fat_100g || 0,
        fiber: product.nutriments?.fiber_100g || 0,
        sugar: product.nutriments?.sugars_100g || 0,
        salt: product.nutriments?.salt_100g || 0,
        image: product.image_url || product.image_front_url || '',
        ingredients: product.ingredients_text_fr || product.ingredients_text || '',
        allergens: product.allergens || '',
        additives: product.additives_tags || [],
        nutriScore: product.nutrition_grades || '',
        novaGroup: product.nova_groups || '',
        ecoscore: product.ecoscore_grade || ''
      };
    });
  } catch (error) {
    console.error('Erreur recherche OpenFoodFacts:', error);
    // En cas d'erreur, retourner les aliments populaires
    return this.getPopularFoods();
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

  // Suggestions d'aliments populaires
  static getPopularFoods(): FoodProduct[] {
    return [
      {
        id: 'banana',
        name: 'Banane',
        nutriments: {
          energy_kcal: 89,
          proteins: 1.1,
          carbohydrates: 23,
          fat: 0.3,
          fiber: 2.6,
        }
      },
      {
        id: 'apple',
        name: 'Pomme',
        nutriments: {
          energy_kcal: 52,
          proteins: 0.3,
          carbohydrates: 14,
          fat: 0.2,
          fiber: 2.4,
        }
      },
      {
        id: 'bread',
        name: 'Pain complet',
        nutriments: {
          energy_kcal: 247,
          proteins: 13,
          carbohydrates: 41,
          fat: 4.2,
          fiber: 7,
        }
      },
      {
        id: 'chicken',
        name: 'Blanc de poulet',
        nutriments: {
          energy_kcal: 165,
          proteins: 31,
          carbohydrates: 0,
          fat: 3.6,
          fiber: 0,
        }
      },
      {
        id: 'rice',
        name: 'Riz blanc cuit',
        nutriments: {
          energy_kcal: 130,
          proteins: 2.7,
          carbohydrates: 28,
          fat: 0.3,
          fiber: 0.4,
        }
      }
    ];
  }
}