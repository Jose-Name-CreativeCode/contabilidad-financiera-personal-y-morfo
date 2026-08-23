"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/morfo-supabase/server";

export async function login(_prevState: { error: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/morfo");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/morfo/login");
}

export async function saveClient(
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

  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const contact_person = String(formData.get("contact_person") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "lead");
  const invoice_required = formData.get("invoice_required") === "on";
  const website = String(formData.get("website") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const responsible = String(formData.get("responsible") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) {
    return { error: "El nombre del cliente es obligatorio." };
  }

  const payload = {
    name,
    contact_person,
    email,
    phone,
    status,
    invoice_required,
    website,
    instagram,
    responsible,
    notes,
  };

  const { error } = id
    ? await supabase.from("clients").update(payload).eq("id", id)
    : await supabase.from("clients").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/morfo");
  redirect("/morfo");
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/morfo");
  redirect("/morfo");
}
