import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACBPdlYcx911mXrm6AqY7Jr3PLPbwO4dk",
  authDomain: "ultimate-yarn-sdpgw.firebaseapp.com",
  projectId: "ultimate-yarn-sdpgw",
  storageBucket: "ultimate-yarn-sdpgw.firebasestorage.app",
  messagingSenderId: "293831365211",
  appId: "1:293831365211:web:bce2f3ca78aaaef158e57e"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, "ai-studio-23fa47bd-caed-4f63-87a1-3d35f90a0069");

export { app, db };
