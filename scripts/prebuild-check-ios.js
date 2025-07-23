#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🍎 Vérification pré-build EAS iOS pour EatFitByMax...');

// Variables globales
let hasErrors = false;
let warnings = [];
let recommendations = [];

// Vérifier les fichiers critiques
const criticalFiles = [
  'app.json',
  'eas.json',
  'metro.config.js',
  'babel.config.js',
  'package.json',
  'tsconfig.json',
  '.env'
];

console.log('\n📁 Vérification des fichiers critiques:');
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
    { key: 'expo.slug', value: appConfig.expo?.slug, required: true },
    { key: 'expo.ios.bundleIdentifier', value: appConfig.expo?.ios?.bundleIdentifier, required: true },
    { key: 'expo.ios.buildNumber', value: appConfig.expo?.ios?.buildNumber, required: false },
    { key: 'expo.version', value: appConfig.expo?.version, required: true },
    { key: 'expo.platforms', value: appConfig.expo?.platforms, required: true },
    { key: 'expo.scheme', value: appConfig.expo?.scheme, required: true }
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
      'NSPhotoLibraryUsageDescription',
      'NSMotionUsageDescription',
      'NSLocationWhenInUseUsageDescription',
      'NSHealthShareUsageDescription'
    ];

    requiredPermissions.forEach(permission => {
      if (appConfig.expo.ios.infoPlist[permission]) {
        console.log(`✅ Permission iOS: ${permission}`);
      } else {
        warnings.push(`⚠️ Permission iOS manquante: ${permission}`);
      }
    });
  }

  // Vérifier les plugins
  if (appConfig.expo?.plugins) {
    const requiredPlugins = ['expo-router', 'expo-camera', 'expo-build-properties'];
    requiredPlugins.forEach(plugin => {
      const hasPlugin = appConfig.expo.plugins.some(p => 
        typeof p === 'string' ? p === plugin : Array.isArray(p) && p[0] === plugin
      );
      if (hasPlugin) {
        console.log(`✅ Plugin: ${plugin}`);
      } else {
        console.error(`❌ Plugin manquant: ${plugin}`);
        hasErrors = true;
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
    if (iosConfig.buildConfiguration) {
      console.log(`✅ Build configuration: ${iosConfig.buildConfiguration}`);
    }
  } else {
    console.error('❌ Configuration iOS production manquante dans eas.json');
    hasErrors = true;
  }

  // Vérifier la configuration submit
  if (easConfig.submit?.production?.ios) {
    console.log('✅ Configuration submit iOS présente');
    const submitConfig = easConfig.submit.production.ios;
    if (submitConfig.appleId && submitConfig.ascAppId && submitConfig.appleTeamId) {
      console.log('✅ Informations App Store Connect configurées');
    } else {
      warnings.push('⚠️ Informations App Store Connect incomplètes');
    }
  }

} catch (error) {
  console.error('❌ Erreur parsing eas.json:', error.message);
  hasErrors = true;
}

// Vérifier les variables d'environnement critiques
console.log('\n🌍 Vérification des variables d\'environnement:');
const requiredEnvVars = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_VPS_URL'
];

const optionalEnvVars = [
  'EXPO_PUBLIC_STRAVA_CLIENT_ID',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_EMAILJS_SERVICE_ID',
  'EXPO_PUBLIC_CLARIFAI_API_KEY'
];

if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  requiredEnvVars.forEach(envVar => {
    const found = envLines.some(line => line.startsWith(`${envVar}=`));
    if (found) {
      console.log(`✅ ${envVar}: configuré`);
    } else {
      console.error(`❌ Variable d'environnement manquante: ${envVar}`);
      hasErrors = true;
    }
  });

  optionalEnvVars.forEach(envVar => {
    const found = envLines.some(line => line.startsWith(`${envVar}=`));
    if (found) {
      console.log(`✅ ${envVar}: configuré`);
    } else {
      warnings.push(`⚠️ Variable optionnelle: ${envVar} non configurée`);
    }
  });
} else {
  console.error('❌ Fichier .env manquant');
  hasErrors = true;
}

// Vérifier la structure des dossiers
console.log('\n📂 Vérification de la structure du projet:');
const requiredDirs = ['app', 'components', 'utils', 'assets', 'constants', 'context'];
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ Dossier: ${dir}`);
  } else {
    console.error(`❌ Dossier manquant: ${dir}`);
    hasErrors = true;
  }
});

// Vérifier les assets iOS
console.log('\n🖼️ Vérification des assets iOS:');
const iosAssets = [
  'assets/images/crown-logo.png',
  'assets/images/adaptive-icon.png'
];

iosAssets.forEach(asset => {
  if (fs.existsSync(asset)) {
    console.log(`✅ Asset: ${path.basename(asset)}`);
  } else {
    console.error(`❌ Asset manquant: ${asset}`);
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
    'react-native',
    'expo-camera',
    'expo-crypto',
    '@stripe/stripe-react-native'
  ];

  criticalDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.error(`❌ Dépendance critique manquante: ${dep}`);
      hasErrors = true;
    }
  });

  const expoVersion = packageJson.dependencies?.expo;
  if (expoVersion && !expoVersion.includes('53.')) {
    warnings.push('⚠️ Version Expo non testée pour ce build');
  }

} catch (error) {
  console.error('❌ Erreur lecture package.json:', error.message);
  hasErrors = true;
}

// Vérifier Metro config
console.log('\n🚇 Vérification Metro config:');
try {
  if (fs.existsSync('metro.config.js')) {
    const metroContent = fs.readFileSync('metro.config.js', 'utf8');
    if (metroContent.includes('empty-mock.js')) {
      console.log('✅ Metro config avec mocks configuré');
    } else {
      warnings.push('⚠️ Metro config pourrait nécessiter des ajustements');
    }
  }
} catch (error) {
  warnings.push('⚠️ Impossible de vérifier metro.config.js');
}

// Vérifier TypeScript
console.log('\n📘 Vérification TypeScript:');
try {
  if (fs.existsSync('tsconfig.json')) {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    if (tsConfig.compilerOptions?.strict) {
      console.log('✅ TypeScript strict mode activé');
    }
    if (tsConfig.compilerOptions?.skipLibCheck) {
      console.log('✅ skipLibCheck activé');
    }
  }
} catch (error) {
  warnings.push('⚠️ Erreur lecture tsconfig.json');
}

// Vérifications spécifiques EAS Build
console.log('\n🔧 Vérifications spécifiques EAS Build:');

if (fs.existsSync('.easignore')) {
  console.log('✅ .easignore présent');
} else {
  recommendations.push('💡 Créer un fichier .easignore pour optimiser le build');
}

const sensitiveFiles = ['.env.local', 'google-service-account.json', 'ios/'];
sensitiveFiles.forEach(file => {
  if (fs.existsSync(file)) {
    if (file === '.env.local') {
      warnings.push('⚠️ .env.local détecté - assurez-vous qu\'il est dans .easignore');
    }
  }
});

// Résumé
console.log('\n📊 Résumé de la vérification:');

if (recommendations.length > 0) {
  console.log('\n💡 Recommandations:');
  recommendations.forEach(rec => console.log(`   ${rec}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️ Avertissements:');
  warnings.forEach(warning => console.log(`   ${warning}`));
}

if (hasErrors) {
  console.error('\n❌ Des erreurs critiques ont été détectées. Corrigez-les avant le build.');
  console.log('\n💡 Actions recommandées:');
  console.log('   1. Vérifiez tous les fichiers de configuration');
  console.log('   2. Assurez-vous que toutes les variables d\'environnement sont définies');
  console.log('   3. Vérifiez que tous les assets requis sont présents');
  console.log('   4. Relancez cette vérification après correction');
  process.exit(1);
} else {
  console.log('\n✅ Toutes les vérifications critiques sont passées avec succès !');
  console.log('🚀 Votre projet EatFitByMax est prêt pour le build EAS iOS.');

  if (warnings.length > 0) {
    console.log(`\n📝 ${warnings.length} avertissement(s) à considérer pour optimiser votre build.`);
  }

  console.log('\n🎯 Commandes de build recommandées:');
  console.log('   Preview: npx eas build --platform ios --profile preview');
  console.log('   Production: npx eas build --platform ios --profile production');

  process.exit(0);
}
