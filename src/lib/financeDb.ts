import { db } from "../firebase";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Transaction, PriorityBill } from "../types";

export interface UserFinancials {
  transactions: Transaction[];
  priorityBills: PriorityBill[];
  updatedAt?: any;
}

const COLLECTION_NAME = "financials";

// Fetch consolidated financials (transactions & priority bills) from Firestore for a given user email
export async function getUserFinancials(email: string): Promise<UserFinancials | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const docRef = doc(db, COLLECTION_NAME, cleanEmail);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserFinancials;
    }
  } catch (error) {
    console.error("Erro ao carregar dados financeiros do Firestore:", error);
  }
  return null;
}

// Save consolidated financials (transactions & priority bills) to Firestore for a given user email
export async function saveUserFinancials(email: string, data: UserFinancials): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const docRef = doc(db, COLLECTION_NAME, cleanEmail);
    await setDoc(docRef, {
      transactions: data.transactions,
      priorityBills: data.priorityBills,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Erro ao salvar dados financeiros no Firestore:", error);
    return false;
  }
}

// Clear all financials in Firestore for a user (delete document)
export async function clearUserFinancials(email: string): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const docRef = doc(db, COLLECTION_NAME, cleanEmail);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Erro ao limpar dados financeiros do Firestore:", error);
    return false;
  }
}
