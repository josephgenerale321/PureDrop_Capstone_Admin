import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyClsR7XWwvYHQtRfFQTiw9Ob41fMD9elbA",
  authDomain: "puredrop-capstone-project.firebaseapp.com",
  projectId: "puredrop-capstone-project",
  storageBucket: "puredrop-capstone-project.firebasestorage.app",
  messagingSenderId: "781886256531",
  appId: "1:781886256531:web:e50ab386d9a4453d95a466",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functionsClient = getFunctions(app, "asia-southeast1");
