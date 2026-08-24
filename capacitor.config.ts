import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kashurkanvas.app',
  appName: 'Kashur Kanvas',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
