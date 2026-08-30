import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kashurkanvas.app',
  appName: 'Kashur Kanvas',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#064E3B',
      style: 'DARK'
    }
  }
};

export default config;
