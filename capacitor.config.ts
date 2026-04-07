import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.firewater",
  appName: "FIREWATER",
  webDir: "dist",
  backgroundColor: "#141210",
  ios: {
    allowsBackForwardNavigationGestures: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      showSpinner: false,
      backgroundColor: "#141210",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#141210",
    },
  },
};

export default config;
