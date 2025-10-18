import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  User as FirebaseUser,
  deleteUser,
  getRedirectResult,
  UserCredential
} from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  serverTimestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Interfaz User que extiende correctamente FirebaseUser
export interface User extends FirebaseUser {
  id: string;
  name?: string;
  lastname?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  city?: string;
  createdAt?: string;
  notifications?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isVip: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithGoogleRedirect: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const checkVipStatus = async (userId: string): Promise<boolean> => {
  try {
    const subscriptionsRef = collection(db, 'vipSubscriptions');
    const q = query(
      subscriptionsRef, 
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking VIP status:', error);
    return false;
  }
};

const getUserData = async (userId: string): Promise<Partial<User>> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as Partial<User>;
    }
    return {};
  } catch (error) {
    console.error('Error getting user data:', error);
    return {};
  }
};

// Función para asegurar que el documento de usuario existe
const ensureUserDocument = async (firebaseUser: FirebaseUser): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Crear documento de usuario si no existe
      await setDoc(userDocRef, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        createdAt: serverTimestamp(),
        notifications: true,
        name: firebaseUser.displayName?.split(' ')[0] || '',
        lastname: firebaseUser.displayName?.split(' ')[1] || ''
      });
      console.log('Documento de usuario creado en Firestore');
    } else {
      console.log('Documento de usuario ya existe en Firestore');
      
      // Actualizar datos si es necesario
      await updateDoc(userDocRef, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
      });
    }
  } catch (error) {
    console.error('Error al verificar/crear documento de usuario:', error);
    throw error;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Manejar el resultado de redirección de Google
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Google redirect result:', result);
          await ensureUserDocument(result.user);
          const userData = await getUserData(result.user.uid);
          const vipStatus = await checkVipStatus(result.user.uid);
          
          const combinedUser: User = {
            ...result.user,
            id: result.user.uid,
            ...userData
          };
          
          setUser(combinedUser);
          setIsVip(vipStatus);
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Asegurar que el documento de usuario existe
          await ensureUserDocument(firebaseUser);
          
          const userData = await getUserData(firebaseUser.uid);
          const vipStatus = await checkVipStatus(firebaseUser.uid);
          
          // Crear objeto usuario combinando datos de Firebase y Firestore
          const combinedUser: User = {
            ...firebaseUser,
            id: firebaseUser.uid,
            ...userData
          };
          
          setUser(combinedUser);
          setIsVip(vipStatus);
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser({
            ...firebaseUser,
            id: firebaseUser.uid
          } as User);
          setIsVip(false);
        }
      } else {
        setUser(null);
        setIsVip(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Asegurar que el documento del usuario existe
      await ensureUserDocument(userCredential.user);
      
      const userData = await getUserData(userCredential.user.uid);
      const vipStatus = await checkVipStatus(userCredential.user.uid);
      
      const combinedUser: User = {
        ...userCredential.user,
        id: userCredential.user.uid,
        ...userData
      };
      
      setUser(combinedUser);
      setIsVip(vipStatus);
      
      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore usando ensureUserDocument
      await ensureUserDocument(userCredential.user);
      
      const userData = await getUserData(userCredential.user.uid);
      const vipStatus = await checkVipStatus(userCredential.user.uid);
      
      const combinedUser: User = {
        ...userCredential.user,
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        createdAt: new Date().toISOString(),
        notifications: true,
        ...userData
      };
      
      setUser(combinedUser);
      setIsVip(false);
      
      return userCredential;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsVip(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const sendOTP = async (phoneNumber: string) => {
    // This is a placeholder - you would integrate with your actual OTP service
    console.log('Sending OTP to:', phoneNumber);
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
  };

  const verifyOTP = async (code: string) => {
    // This is a placeholder - you would integrate with your actual OTP service
    console.log('Verifying OTP code:', code);
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Agregar parámetros adicionales para una mejor experiencia
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Asegurar que el documento del usuario existe
      await ensureUserDocument(userCredential.user);
      
      const userData = await getUserData(userCredential.user.uid);
      const vipStatus = await checkVipStatus(userCredential.user.uid);
      
      const combinedUser: User = {
        ...userCredential.user,
        id: userCredential.user.uid,
        ...userData
      };
      
      setUser(combinedUser);
      setIsVip(vipStatus);
      
      return userCredential;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // Manejar específicamente el error de popup cerrado por el usuario
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Usuario cerró la ventana de autenticación');
        throw new Error('El proceso de autenticación fue cancelado');
      }
      
      // Manejar otros errores comunes de autenticación
      if (error.code === 'auth/popup-blocked') {
        console.log('Popup bloqueado por el navegador');
        throw new Error('La ventana de autenticación fue bloqueada. Por favor permite ventanas emergentes para este sitio.');
      }
      
      throw error;
    }
  };

  // Función alternativa para autenticación con Google por redirección
  const signInWithGoogleRedirect = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error('Error with Google redirect:', error);
      throw error;
    }
  };

  // Nueva función para eliminar la cuenta
  const deleteAccount = async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      // Eliminar datos del usuario de Firestore
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await deleteDoc(userDocRef);

      // Eliminar la cuenta de autenticación
      await deleteUser(auth.currentUser);
      
      // Cerrar sesión
      await signOut(auth);
      
      setUser(null);
      setIsVip(false);
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isVip,
    loading,
    signIn,
    signUp,
    signOut: signOutUser,
    sendOTP,
    verifyOTP,
    resetPassword,
    signInWithGoogle,
    signInWithGoogleRedirect,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};