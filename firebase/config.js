// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };