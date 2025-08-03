
# Configuration des Achats In-App pour EatFit

## Produits à configurer dans App Store Connect

### 1. Abonnements Auto-Renouvelables

#### BRONZE
- **Product ID**: `com.eatfitbymax.app.bronze_monthly`
- **Reference Name**: Plan Bronze
- **Duration**: 1 mois
- **Prix**: 9,99 €

#### SILVER  
- **Product ID**: `com.eatfitbymax.app.silver_monthly`
- **Reference Name**: Plan Argent
- **Duration**: 1 mois
- **Prix**: 19,99 €

#### GOLD
- **Product ID**: `com.eatfitbymax.app.gold_monthly`
- **Reference Name**: Plan Or
- **Duration**: 1 mois
- **Prix**: 49,99 €

#### DIAMOND
- **Product ID**: `com.eatfitbymax.app.diamond_monthly`
- **Reference Name**: Plan Diamant
- **Duration**: 1 mois
- **Prix**: 99,99 €

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
