import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { app } from './config';
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Firebase Auth - simplified to fix persistence issues
const auth = getAuth(app);

// Register a new user
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Simple login - only authentication
export const loginWithEmail = async (email, password) => {
  try {
    // Sadece kimlik doğrulama işlemi
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    const userDocRef = doc(db, "Kullanicilar", userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Kullanıcı verisi alınırken hata:", error);
    return null;
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw error;
  }
};

// Log out user
export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw error;
  }
};

// Get current authenticated user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Listen for authentication state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Export auth instance if needed elsewhere
export { auth };