
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
      const response = await fetch(
        `${this.BASE_URL}/search?search_terms=${encodeURIComponent(query)}&page_size=20&json=true`
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      
      return data.products?.map((product: any) => this.formatProduct(product)) || [];
    } catch (error) {
      console.error('Erreur recherche OpenFoodFacts:', error);
      throw new Error('Impossible de rechercher les aliments');
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
    return {
      id: product.code || product._id || Date.now().toString(),
      name: product.product_name || product.product_name_fr || 'Produit sans nom',
      brand: product.brands || undefined,
      barcode: product.code,
      nutriments: {
        energy_kcal: this.parseNutriment(product.nutriments?.['energy-kcal_100g']),
        proteins: this.parseNutriment(product.nutriments?.proteins_100g),
        carbohydrates: this.parseNutriment(product.nutriments?.carbohydrates_100g),
        fat: this.parseNutriment(product.nutriments?.fat_100g),
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
    const factor = quantityInGrams / 100; // OpenFoodFacts donne les valeurs pour 100g

    return {
      calories: Math.round((product.nutriments.energy_kcal || 0) * factor),
      proteins: Math.round((product.nutriments.proteins || 0) * factor * 10) / 10,
      carbohydrates: Math.round((product.nutriments.carbohydrates || 0) * factor * 10) / 10,
      fat: Math.round((product.nutriments.fat || 0) * factor * 10) / 10,
    };
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
