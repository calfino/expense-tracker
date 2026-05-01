import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─── TODO: Replace with your Firebase project config ──────────────────────────
// console.firebase.google.com → Project Settings → Your apps → Web app → Config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);

// getAuth() uses the best available persistence automatically
// (AsyncStorage on native via Expo, localStorage on web)
export const auth = getAuth(app);
export const db = getFirestore(app);
