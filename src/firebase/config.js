/**
 * ViandaPro - Configuración de Firebase
 * Crear .env con VITE_FIREBASE_* (ver .env.example)
 * Con USE_MOCK_DATA=true la app funciona sin Firebase
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123:web:abc',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let secondaryAuthInstance = null;
export function getSecondaryAuth() {
  if (secondaryAuthInstance) return secondaryAuthInstance;
  const existing = getApps().find((a) => a.name === 'secondary');
  const secondaryApp = existing || initializeApp(firebaseConfig, 'secondary');
  secondaryAuthInstance = getAuth(secondaryApp);
  return secondaryAuthInstance;
}
export default app;
