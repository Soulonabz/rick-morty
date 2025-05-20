// Import Firebase SDK v9+ (modular)
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApd9bOiaiqtYDJplGDCk5SmizWH_aMiPE",
  authDomain: "tunemusic-4230a.firebaseapp.com",
  projectId: "tunemusic-4230a",
  storageBucket: "tunemusic-4230a.firebasestorage.app",
  messagingSenderId: "713514012458",
  appId: "1:713514012458:web:894289c1b7b526ef9a9853"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, setDoc, doc };
