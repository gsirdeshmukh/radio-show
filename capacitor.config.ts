import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.radiolab.app',
  appName: 'RADIO-LAB',
  webDir: 'mobile',
  server: {
    // For local development, uncomment and set your local IP:
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#0b0c10'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0b0c10'
    }
  }
};

export default config;

