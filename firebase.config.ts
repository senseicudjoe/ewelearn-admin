// src/config/firebase.config.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjDpexoPskMZgXNdSl4qEunGCKKjdOgf8",
  authDomain: "learn-ewe.firebaseapp.com",
  projectId: "learn-ewe",
  storageBucket: "learn-ewe.firebasestorage.app",
  messagingSenderId: "866147477548",
  appId: "1:866147477548:web:353bb6fb38e502404cc989",
  measurementId: "G-CT5VQPC6Z7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);