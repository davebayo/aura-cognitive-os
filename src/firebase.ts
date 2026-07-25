import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "aura-app-2c4ea.firebaseapp.com",
  projectId: "aura-app-2c4ea",
  storageBucket: "aura-app-2c4ea.firebasestorage.app",
  messagingSenderId: "1051208396505",
  appId: "1:1051208396505:web:a75fe04f98c91e0e10d8c8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
