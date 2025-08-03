
# Configuration des Achats In-App pour EatFit

## Produits à configurer dans App Store Connect

### 1. Abonnements Auto-Renouvelables

#### BRONZE
- **Product ID**: `com.eatfitbymax.subscription.bronze.monthly`
- **Reference Name**: EatFit Bronze Monthly
- **Duration**: 1 mois
- **Prix**: 9,99 €

#### ARGENT  
- **Product ID**: `com.eatfitbymax.subscription.argent.monthly`
- **Reference Name**: EatFit Argent Monthly
- **Duration**: 1 mois
- **Prix**: 19,99 €

#### OR
- **Product ID**: `com.eatfitbymax.subscription.or.monthly`
- **Reference Name**: EatFit Or Monthly
- **Duration**: 1 mois
- **Prix**: 49,99 €

## Étapes de configuration

1. **App Store Connect** > Votre App > Fonctionnalités > Achats intégrés
2. Créer un **Groupe d'abonnements** : "EatFit Premium Subscriptions"
3. Ajouter chaque abonnement avec les Product IDs ci-dessus
4. Configurer les **localizations** en français
5. Activer les **promotions** si souhaité

## Test

- Utilisez un **compte Sandbox** pour tester
- Les produits doivent être **approuvés** avant les tests
- L'app doit être **signée** avec le même Team ID que App Store Connect

## Entitlements requis

✅ Déjà configuré dans `withHealthKit.js`
- `com.apple.developer.in-app-payments`
