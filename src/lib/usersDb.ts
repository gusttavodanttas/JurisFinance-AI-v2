import { supabase } from "../supabase";

export interface FirestoreUser {
  name: string;
  oab: string;
  email: string;
  password?: string;
  createdAt?: any;
}

// Check or get a single user by email from Supabase
export async function getFirestoreUser(
  email: string
): Promise<FirestoreUser | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle(); // Returns null instead of throwing an error on empty result

    if (error) throw error;

    if (data) {
      return {
        name: data.name,
        oab: data.oab,
        email: data.email,
        password: data.password,
        createdAt: data.created_at,
      } as FirestoreUser;
    }
  } catch (error) {
    console.error("Erro ao obter usuário do Supabase:", error);
  }
  return null;
}

// Create or update a user in Supabase
export async function createFirestoreUser(
  user: FirestoreUser
): Promise<boolean> {
  if (!user.email) return false;
  const cleanEmail = user.email.toLowerCase().trim();
  try {
    const { error } = await supabase.from("users").upsert(
      {
        email: cleanEmail,
        name: user.name.trim(),
        oab: user.oab.trim(),
        password: user.password,
      },
      { onConflict: "email" }
    );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Erro ao registrar usuário no Supabase:", error);
    return false;
  }
}

// Get all registered users from Supabase
export async function getAllFirestoreUsers(): Promise<FirestoreUser[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (data) {
      return data.map((d: any) => ({
        name: d.name,
        oab: d.oab,
        email: d.email,
        password: d.password,
        createdAt: d.created_at,
      }));
    }
  } catch (error) {
    console.error("Erro ao carregar lista de usuários do Supabase:", error);
  }
  return [];
}
