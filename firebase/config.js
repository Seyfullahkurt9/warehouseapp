// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4fk8wwU5fRzdTQBOutDajGyNwUWZ7hoQ",
  authDomain: "warehouseapitest.firebaseapp.com",
  projectId: "warehouseapitest",
  storageBucket: "warehouseapitest.firebasestorage.app",
  messagingSenderId: "84033105180",
  appId: "1:84033105180:web:8e1776a4318dbb68fd1ed9",
  measurementId: "G-G06CJPMM10"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);