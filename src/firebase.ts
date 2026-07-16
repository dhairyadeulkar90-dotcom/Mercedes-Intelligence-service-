import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDr6qNBMyRyka2ywU3RZyih7UzXkERMerA",
  authDomain: "mercedes-showroom.firebaseapp.com",
  projectId: "mercedes-showroom",
  storageBucket: "mercedes-showroom.firebasestorage.app",
  messagingSenderId: "359019412799",
  appId: "1:359019412799:web:5d633b74eb08a3fa0ba78a",
  measurementId: "G-5Z2T5S47S8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
