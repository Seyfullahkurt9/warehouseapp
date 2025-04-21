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
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from './config';

// Initialize Firebase Auth
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

// Login with email and password and check user role
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get user document from Firestore
    const usersRef = collection(db, "Kullanicilar");
    const q = query(usersRef, where("eposta", "==", email));
    const querySnapshot = await getDocs(q);
    
    // Check if user exists in Firestore
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Return user with additional data including role
      return {
        user: userCredential.user,
        userData: userData,
        isAdmin: userData.yetki_id === "admin"
      };
    } else {
      // User authenticated but not found in Firestore
      return {
        user: userCredential.user,
        userData: null,
        isAdmin: false
      };
    }
  } catch (error) {
    throw error;
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