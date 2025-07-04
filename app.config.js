
export default {
  expo: {
    name: "EatFit By Max",
    slug: "eatfitbymax",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/crown-logo.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      icon: "./assets/images/crown-logo.png",
      supportsTablet: true,
      infoPlist: {
        NSHealthShareUsageDescription: "EatFitByMax utilise Apple Health pour synchroniser vos données de santé et fitness afin de vous fournir un suivi personnalisé de votre progression.",
        NSHealthUpdateUsageDescription: "EatFitByMax peut écrire des données dans Apple Health pour garder vos informations de santé à jour."
      }
    },
    android: {
      icon: "./assets/images/crown-logo.png",
      adaptiveIcon: {
        foregroundImage: "./assets/images/crown-logo.png",
        backgroundColor: "#1E1E1E"
      }
    },
    
    plugins: [
      "expo-router",
      "expo-web-browser",
      [
        "expo-barcode-scanner",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera to scan QR codes."
        }
      ],
      "expo-font"
    ],
    experiments: {
      typedRoutes: true
    }
  }
};
