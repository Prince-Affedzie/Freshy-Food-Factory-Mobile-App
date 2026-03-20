import 'dotenv/config';

export default {
  expo: {
    name: "FreshyFoodFactory-Mobile",
    slug: "freshyfoodfactory-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/FreshyFoodFactory_App_Icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/FreshyFoodFactory_App_Icon.png",
      resizeMode: "contain",
      backgroundColor: "#4CAF50"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.freshyfood.factory.gh",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
      ITSAppUsesNonExemptEncryption: false
     },
    },
    android: {
      package: "com.freshyfood.factory",
      adaptiveIcon: {
        foregroundImage: "./assets/FreshyFoodFactory_App_Icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: "./assets/FreshyFoodFactory_App_Icon.png"
    },
    updates: {
      url: "https://u.expo.dev/91d657de-bd96-4749-aa49-34001b7b4191"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL,
      EXPO_PayStack_publicKey: process.env.EXPO_PayStack_publicKey,
      eas: {
        projectId: "91d657de-bd96-4749-aa49-34001b7b4191"
      }
    },
    plugins: [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.34872065423-m8inhhq7qk25303taoitpgso8bcv9q95"
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 24,
            "compileSdkVersion": 35,
            "targetSdkVersion": 35
          }
        }
      ],
      "expo-font",
      "expo-notifications",
      "expo-asset",
      "expo-web-browser"
    ],
    owner: "affedziep44"
  }
};