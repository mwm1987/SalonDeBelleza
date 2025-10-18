import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized:', app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Messaging
export const messaging = getMessaging(app);

// Initialize Firebase Storage with explicit bucket URL
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
// Asegurarse de que el bucket esté correctamente formateado
// Usar formato gs:// para el bucket URL que es requerido por Firebase Storage
const bucketUrl = storageBucket ? `gs://${storageBucket}` : undefined;
export const storage = getStorage(app, bucketUrl);
console.log('Firebase Storage initialized with bucket URL:', bucketUrl);

// Verificar la configuración del bucket
if (!storageBucket) {
  console.error('ADVERTENCIA: No se ha configurado VITE_FIREBASE_STORAGE_BUCKET en el archivo .env');
} else {
  console.log('Bucket de Storage configurado:', storageBucket);
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Export auth methods for use in the app
export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  getToken,
  onMessage
};

// Export Firestore methods
export {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc
};