import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: configJson.projectId || 'gen-lang-client-0584827809',
  appId: configJson.appId || '',
  storageBucket: configJson.storageBucket || '',
  apiKey: configJson.apiKey || '',
  authDomain: configJson.authDomain || '',
};

// Initialize Firebase App lazily
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
