
# Configuration iOS pour Apple Health

## Étapes nécessaires pour le déploiement iOS :

### 1. Capabilities dans Xcode
- Ouvrir le projet iOS dans Xcode
- Aller dans "Signing & Capabilities"
- Ajouter "HealthKit" capability

### 2. Info.plist (déjà configuré dans app.json)
```xml
<key>NSHealthShareUsageDescription</key>
<string>EatFitByMax utilise Apple Health pour synchroniser vos données de santé et fitness afin de vous fournir un suivi personnalisé de votre progression.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>EatFitBy Max peut écrire des données dans Apple Health pour garder vos informations de santé à jour.</string>
```

### 3. Build avec EAS
- L'intégration Apple Health nécessite un build natif
- Utiliser `eas build` pour créer l'app iOS
- Tester sur un vrai appareil iOS (le simulateur ne supporte pas HealthKit)

### 4. Test
- Seuls les vrais appareils iOS peuvent accéder à Apple Health
- Le simulateur retournera des données simulées
</pre>
