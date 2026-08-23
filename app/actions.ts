"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(_prevState: { error: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createTransaction(
  _prevState: { error: string } | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión no válida." };
  }

  const type = String(formData.get("type") ?? "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "") || null;
  const account_id = String(formData.get("account_id") ?? "");
  const category_id = String(formData.get("category_id") ?? "") || null;
  const transaction_date = String(formData.get("transaction_date") ?? "");

  if (!type || !amount || amount <= 0 || !account_id || !transaction_date) {
    return { error: "Faltan campos obligatorios (tipo, monto, cuenta o fecha)." };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type,
    amount,
    description,
    account_id,
    category_id,
    transaction_date,
    source: "web",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { error: "" };
}
