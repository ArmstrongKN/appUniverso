import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDIJegZ5yDvaDl4xwLRC9P2MVAo0IJ5p6s",
  authDomain: "universo-121ee.firebaseapp.com",
  projectId: "universo-121ee",
  storageBucket: "universo-121ee.appspot.com",
  messagingSenderId: "490412131995",
  appId: "1:490412131995:web:8baf82fe67fa8ff09ae83e"
  };
  
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const fire = getFirestore(app);