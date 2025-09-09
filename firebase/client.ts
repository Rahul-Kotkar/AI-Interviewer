// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBrumHCfinDby__Gs2Mk6_yYfUenYv6bAw",
  authDomain: "prepwise-e737e.firebaseapp.com",
  projectId: "prepwise-e737e",
  storageBucket: "prepwise-e737e.firebasestorage.app",
  messagingSenderId: "245294346588",
  appId: "1:245294346588:web:8c1a4fa89d9f5105531199",
  measurementId: "G-QVCR5QEXG8",
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
