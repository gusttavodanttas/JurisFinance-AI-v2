import { supabase } from "../supabase";
import { Transaction, PriorityBill } from "../types";

export interface UserFinancials {
  transactions: Transaction[];
  priorityBills: PriorityBill[];
  updatedAt?: any;
}

// Fetch consolidated financials from Supabase for a given user email
export async function getUserFinancials(
  email: string
): Promise<UserFinancials | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const { data, error } = await supabase
      .from("financials")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      return {
        transactions: data.transactions || [],
        priorityBills: data.priority_bills || [],
        updatedAt: data.updated_at,
      } as UserFinancials;
    }
  } catch (error) {
    console.error("Erro ao carregar dados financeiros do Supabase:", error);
  }
  return null;
}

// Save consolidated financials to Supabase for a given user email
export async function saveUserFinancials(
  email: string,
  data: UserFinancials
): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const { error } = await supabase.from("financials").upsert(
      {
        email: cleanEmail,
        transactions: data.transactions,
        priority_bills: data.priorityBills,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Erro ao salvar dados financeiros no Supabase:", error);
    return false;
  }
}

// Clear all financials in Supabase for a user (delete row)
export async function clearUserFinancials(email: string): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const { error } = await supabase
      .from("financials")
      .delete()
      .eq("email", cleanEmail);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Erro ao limpar dados financeiros do Supabase:", error);
    return false;
  }
}
