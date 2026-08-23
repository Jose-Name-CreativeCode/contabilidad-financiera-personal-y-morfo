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

export async function saveQuote(
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
  const client_id = String(formData.get("client_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const service_type = String(formData.get("service_type") ?? "").trim() || null;
  const quote_date = String(formData.get("quote_date") ?? "");
  const status = String(formData.get("status") ?? "borrador");
  const payment_status = String(formData.get("payment_status") ?? "no_pagada");
  const payment_method = String(formData.get("payment_method") ?? "").trim() || null;
  const service_amount = Number(formData.get("service_amount") ?? 0);
  const ad_spend_required = formData.get("ad_spend_required") === "on";
  const ad_spend = Number(formData.get("ad_spend") ?? 0);
  const ad_budget = Number(formData.get("ad_budget") ?? 0);
  const invoice_required = formData.get("invoice_required") === "on";
  const iva = Number(formData.get("iva") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();
  const custom_table_title = String(formData.get("custom_table_title") ?? "").trim() || null;

  let custom_table_rows: unknown = [];
  try {
    custom_table_rows = JSON.parse(String(formData.get("custom_table_rows") ?? "[]"));
  } catch {
    custom_table_rows = [];
  }

  if (!title || !client_id || !quote_date) {
    return { error: "Faltan campos obligatorios (título, cliente o fecha)." };
  }

  const payload = {
    client_id,
    title,
    service_type,
    quote_date,
    status,
    payment_status,
    payment_method,
    service_amount,
    ad_spend_required,
    ad_spend,
    ad_budget,
    invoice_required,
    iva,
    notes,
    custom_table_title,
    custom_table_rows,
  };

  const { error } = id
    ? await supabase.from("quotes").update(payload).eq("id", id)
    : await supabase.from("quotes").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/morfo/cotizaciones");
  redirect("/morfo/cotizaciones");
}

export async function deleteQuote(id: string) {
  const supabase = await createClient();
  await supabase.from("quotes").delete().eq("id", id);
  revalidatePath("/morfo/cotizaciones");
  redirect("/morfo/cotizaciones");
}

export async function saveAgencySettings(
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

  const payload = {
    agency_name: String(formData.get("agency_name") ?? "").trim(),
    agency_email: String(formData.get("agency_email") ?? "").trim(),
    agency_phone: String(formData.get("agency_phone") ?? "").trim(),
    agency_website: String(formData.get("agency_website") ?? "").trim(),
    agency_address: String(formData.get("agency_address") ?? "").trim(),
    payment_methods: String(formData.get("payment_methods") ?? "").trim(),
    bank_details_invoice: String(formData.get("bank_details_invoice") ?? "").trim(),
    bank_details_no_invoice: String(formData.get("bank_details_no_invoice") ?? "").trim(),
    advance_percent: Number(formData.get("advance_percent") ?? 50),
    terms: String(formData.get("terms") ?? "").trim(),
  };

  const { error } = await supabase.from("agency_settings").update(payload).eq("id", "default");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/morfo/ajustes");
  return { error: "" };
}

export async function savePayment(
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

  const quote_id = String(formData.get("quote_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const payment_date = String(formData.get("payment_date") ?? "");
  const method = String(formData.get("method") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!quote_id || !amount || amount <= 0 || !payment_date) {
    return { error: "Faltan campos obligatorios (cotización, monto o fecha)." };
  }

  const { error } = await supabase
    .from("payments")
    .insert({ quote_id, amount, payment_date, method, notes });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/morfo/cotizaciones");
  revalidatePath("/morfo/cobros");
  redirect(`/morfo/cotizaciones/${quote_id}`);
}

export async function deletePayment(quoteId: string, id: string) {
  const supabase = await createClient();
  await supabase.from("payments").delete().eq("id", id);
  revalidatePath("/morfo/cotizaciones");
  revalidatePath("/morfo/cobros");
  redirect(`/morfo/cotizaciones/${quoteId}`);
}

export async function saveExpense(
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
  const expense_date = String(formData.get("expense_date") ?? "");
  const concept = String(formData.get("concept") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const payment_method = String(formData.get("payment_method") ?? "").trim() || null;
  const invoice = formData.get("invoice") === "on";
  const amount = Number(formData.get("amount") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!concept || !amount || amount <= 0 || !expense_date) {
    return { error: "Faltan campos obligatorios (concepto, monto o fecha)." };
  }

  const payload = { expense_date, concept, category, payment_method, invoice, amount, notes };

  const { error } = id
    ? await supabase.from("expenses").update(payload).eq("id", id)
    : await supabase.from("expenses").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/morfo/gastos");
  redirect("/morfo/gastos");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/morfo/gastos");
  redirect("/morfo/gastos");
}
