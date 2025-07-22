
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification pré-build EAS iOS complète...\n');

// Vérifier les fichiers critiques
const criticalFiles = [
  'app.json',
  'eas.json',
  'metro.config.js',
  'babel.config.js',
  'package.json',
  '.env',
  'tsconfig.json'
];

let hasErrors = false;
let warnings = [];

console.log('📁 Vérification des fichiers critiques:');
criticalFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Fichier manquant: ${file}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${file}`);
  }
});

// Vérifier la structure app.json
console.log('\n📱 Vérification de la configuration app.json:');
try {
  const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  
  const checks = [
    { key: 'expo.name', value: appConfig.expo?.name, required: true },
    { key: 'expo.ios.bundleIdentifier', value: appConfig.expo?.ios?.bundleIdentifier, required: true },
    { key: 'expo.ios.buildNumber', value: appConfig.expo?.ios?.buildNumber, required: false },
    { key: 'expo.version', value: appConfig.expo?.version, required: true },
    { key: 'expo.platforms', value: appConfig.expo?.platforms, required: true }
  ];

  checks.forEach(check => {
    if (check.required && !check.value) {
      console.error(`❌ ${check.key} manquant`);
      hasErrors = true;
    } else if (check.value) {
      console.log(`✅ ${check.key}: ${Array.isArray(check.value) ? check.value.join(', ') : check.value}`);
    } else {
      warnings.push(`⚠️ ${check.key} optionnel non défini`);
    }
  });

  // Vérifications spéciales pour iOS
  if (appConfig.expo?.ios?.infoPlist) {
    const requiredPermissions = [
      'NSCameraUsageDescription',
      'NSPhotoLibraryUsageDescription'
    ];
    
    requiredPermissions.forEach(permission => {
      if (appConfig.expo.ios.infoPlist[permission]) {
        console.log(`✅ Permission iOS: ${permission}`);
      } else {
        warnings.push(`⚠️ Permission iOS manquante: ${permission}`);
      }
    });
  }
  
} catch (error) {
  console.error('❌ Erreur parsing app.json:', error.message);
  hasErrors = true;
}

// Vérifier eas.json
console.log('\n🏗️ Vérification de la configuration EAS:');
try {
  const easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
  
  if (easConfig.build?.production?.ios) {
    console.log('✅ Configuration iOS production présente');
    
    const iosConfig = easConfig.build.production.ios;
    if (iosConfig.resourceClass) {
      console.log(`✅ Resource class: ${iosConfig.resourceClass}`);
    }
    if (iosConfig.autoIncrement) {
      console.log('✅ Auto-increment activé');
    }
  } else {
    console.error('❌ Configuration iOS production manquante dans eas.json');
    hasErrors = true;
  }
  
} catch (error) {
  console.error('❌ Erreur parsing eas.json:', error.message);
  hasErrors = true;
}

// Vérifier les variables d'environnement critiques
console.log('\n🌍 Vérification des variables d\'environnement:');
const requiredEnvVars = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'
];

const optionalEnvVars = [
  'EXPO_PUBLIC_STRAVA_CLIENT_ID',
  'EXPO_PUBLIC_EMAILJS_SERVICE_ID'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Variable d'environnement manquante: ${envVar}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${envVar}: configuré`);
  }
});

optionalEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    warnings.push(`⚠️ Variable optionnelle: ${envVar} non configurée`);
  } else {
    console.log(`✅ ${envVar}: configuré`);
  }
});

// Vérifier la structure des dossiers
console.log('\n📂 Vérification de la structure du projet:');
const requiredDirs = ['app', 'components', 'utils', 'assets'];
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ Dossier: ${dir}`);
  } else {
    console.error(`❌ Dossier manquant: ${dir}`);
    hasErrors = true;
  }
});

// Vérifier les dépendances critiques
console.log('\n📦 Vérification des dépendances:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const criticalDeps = [
    'expo',
    'expo-router',
    'react',
    'react-native'
  ];

  criticalDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.error(`❌ Dépendance critique manquante: ${dep}`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.error('❌ Erreur lecture package.json:', error.message);
  hasErrors = true;
}

// Afficher les résultats
console.log('\n📊 Résumé de la vérification:');

if (warnings.length > 0) {
  console.log('\n⚠️ Avertissements:');
  warnings.forEach(warning => console.log(`   ${warning}`));
}

if (hasErrors) {
  console.error('\n❌ Des erreurs critiques ont été détectées. Corrigez-les avant le build.');
  console.log('\n💡 Actions recommandées:');
  console.log('   1. Vérifiez tous les fichiers de configuration');
  console.log('   2. Assurez-vous que toutes les variables d\'environnement sont définies');
  console.log('   3. Relancez cette vérification après correction');
  process.exit(1);
} else {
  console.log('\n✅ Toutes les vérifications sont passées avec succès !');
  console.log('🚀 Votre projet est prêt pour le build EAS iOS.');
  
  if (warnings.length > 0) {
    console.log(`\n📝 ${warnings.length} avertissement(s) à considérer pour optimiser votre build.`);
  }
  
  process.exit(0);
}
