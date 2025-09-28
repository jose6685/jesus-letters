import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jesusletters.app',
  appName: '耶穌的信',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#4A90E2",
      showSpinner: false
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#4A90E2"
    },
    Keyboard: {
      resize: "body" as any,
      style: "dark" as any
    }
  }
};

export default config;