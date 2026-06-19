import { db } from "../firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

export interface FirestoreUser {
  name: string;
  oab: string;
  email: string;
  password?: string;
  createdAt?: any;
}

// Check or get a single user by email
export async function getFirestoreUser(email: string): Promise<FirestoreUser | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const docRef = doc(db, "users", cleanEmail);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as FirestoreUser;
    }
  } catch (error) {
    console.error("Erro ao obter usuário do Firestore:", error);
  }
  return null;
}

// Create or update a user in Firestore
export async function createFirestoreUser(user: FirestoreUser): Promise<boolean> {
  if (!user.email) return false;
  const cleanEmail = user.email.toLowerCase().trim();
  try {
    const docRef = doc(db, "users", cleanEmail);
    await setDoc(docRef, {
      name: user.name.trim(),
      oab: user.oab.trim(),
      email: cleanEmail,
      password: user.password, // storing simply for demo matching as requested
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao registrar usuário no Firestore:", error);
    return false;
  }
}

// Get all registered users from Firestore
export async function getAllFirestoreUsers(): Promise<FirestoreUser[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: FirestoreUser[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push(docSnap.data() as FirestoreUser);
    });
    return users;
  } catch (error) {
    console.error("Erro ao carregar lista de usuários do Firestore:", error);
    return [];
  }
}
