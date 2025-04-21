// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyD4fk8wwU5fRzdTQBOutDajGyNwUWZ7hoQ",
  authDomain: "warehouseapitest.firebaseapp.com",
  projectId: "warehouseapitest",
  storageBucket: "warehouseapitest.firebasestorage.app",
  messagingSenderId: "84033105180",
  appId: "1:84033105180:web:72119e88bae2be9efd1ed9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };