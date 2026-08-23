// Herramienta de validación LOCAL contra un Supabase real (tú pones las
// credenciales). Reproduce, con llamadas REST directas equivalentes a los
// HTTP Request nodes de n8n/README.md, el mismo camino que seguiría n8n.
// No es una segunda implementación del backend: reutiliza parser.js y solo
// hace las llamadas mínimas para poder ver el resultado en Supabase real.
//
// Variables de entorno requeridas (nunca hardcodear):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Uso:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node n8n/test-supabase-flow.js n8n/fixtures/text-complete.json

const fs = require("node:fs");
const { parseNewMessage, mergePendingAnswer, extractWhatsAppMessage } = require("./parser");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Este script no imprime sus valores ni siquiera si están definidos.",
  );
  process.exit(1);
}

const REST = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function rest(pathAndQuery, init = {}) {
  const res = await fetch(`${REST}${pathAndQuery}`, {
    ...init,
    headers: { ...HEADERS, ...(init.headers ?? {}) },
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const fixturePath = process.argv[2];
  if (!fixturePath) {
    console.error("Uso: node n8n/test-supabase-flow.js <fixture.json>");
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const extracted = extractWhatsAppMessage(payload);
  if (!extracted) {
    console.log("No es un mensaje de texto -> nada que hacer.");
    return;
  }
  const { whatsapp_message_id, wa_id, raw_text } = extracted;
  console.log("Mensaje:", { whatsapp_message_id, wa_id, raw_text });

  // 1. Identificar usuario
  const profileRes = await rest(`/profiles?whatsapp_number=eq.${wa_id}&select=id`);
  const profile = profileRes.body?.[0];

  if (!profile) {
    console.log("Número NO vinculado a ningún profile.");
    const log = await rest("/whatsapp_messages", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({
        user_id: null,
        wa_id,
        whatsapp_message_id,
        raw_text,
        processed_status: "failed",
      }),
    });
    console.log(
      log.body?.length ? "Registrado en whatsapp_messages (user_id=null)." : "Ya existía (reintento) -> no se duplicó.",
    );
    console.log("No se crea transacción. (Aquí n8n enviaría el aviso de 'número no vinculado'.)");
    return;
  }
  console.log("Profile encontrado:", profile.id);

  // 2. Cuentas/categorías y pending existente
  const [accountsRes, categoriesRes, pendingRes] = await Promise.all([
    rest(`/accounts?user_id=eq.${profile.id}&select=id,name`),
    rest(`/categories?user_id=eq.${profile.id}&select=id,name`),
    rest(`/whatsapp_messages?user_id=eq.${profile.id}&processed_status=eq.pending&select=id,pending_transaction_data`),
  ]);
  const accounts = accountsRes.body ?? [];
  const categories = categoriesRes.body ?? [];
  const pending = pendingRes.body?.[0] ?? null;
  console.log("Cuentas:", accounts.map((a) => a.name));
  console.log("Categorías:", categories.map((c) => c.name));
  console.log("Pending existente:", pending ? pending.id : "ninguno");

  // 3. Parser (mismo código que usaría el Code node de n8n)
  const result = pending
    ? mergePendingAnswer({ raw_text, draft: pending.pending_transaction_data, accounts })
    : parseNewMessage({ raw_text, accounts, categories });
  console.log("Resultado del parser:", result.status);

  // 4. Insertar según resultado, respetando dedupe
  if (result.status === "complete") {
    const insert = await rest("/transactions", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: profile.id,
        ...result.transaction,
        source: "whatsapp_text",
        whatsapp_message_id,
        status: "confirmed",
      }),
    });

    if (!insert.ok) {
      if (insert.body?.code === "23505") {
        console.log("Conflicto de unique en transactions -> ya fue procesada antes. No se duplica.");
      } else {
        console.log("Error insertando transacción:", insert.body?.message ?? insert.status);
      }
      return;
    }

    console.log("Transacción creada:", insert.body?.[0]?.id);

    if (pending) {
      await rest(`/whatsapp_messages?id=eq.${pending.id}`, {
        method: "PATCH",
        body: JSON.stringify({ processed_status: "completed", pending_transaction_data: null }),
      });
      console.log("Mensaje pendiente original marcado como completed.");
    }

    const log = await rest("/whatsapp_messages", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({
        user_id: profile.id,
        wa_id,
        whatsapp_message_id,
        raw_text,
        processed_status: "completed",
      }),
    });
    console.log(
      log.body?.length ? "Mensaje actual registrado como completed." : "Mensaje actual ya existía (reintento).",
    );
    console.log(`✅ Registrado: $${result.transaction.amount} en ${result.transaction.description ?? "-"}`);
  } else {
    if (pending) {
      await rest(`/whatsapp_messages?id=eq.${pending.id}`, {
        method: "PATCH",
        body: JSON.stringify({ pending_transaction_data: result.draft }),
      });
      await rest("/whatsapp_messages", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({
          user_id: profile.id,
          wa_id,
          whatsapp_message_id,
          raw_text,
          processed_status: "completed",
        }),
      });
      console.log("Draft del pendiente actualizado. Mensaje actual registrado como completed.");
    } else {
      const log = await rest("/whatsapp_messages", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({
          user_id: profile.id,
          wa_id,
          whatsapp_message_id,
          raw_text,
          processed_status: "pending",
          pending_transaction_data: result.draft,
        }),
      });
      console.log(
        log.ok
          ? log.body?.length
            ? "Nuevo pending creado."
            : "Mensaje ya existía (reintento) -> no se duplica el pending."
          : `Error creando pending: ${log.body?.message ?? log.status}`,
      );
    }
    console.log(`Pregunta que enviaría WhatsApp: "${result.question}"`);
  }
}

main().catch((err) => {
  let hostname = null;
  try {
    hostname = new URL(SUPABASE_URL).hostname;
  } catch {
    hostname = "(NEXT_PUBLIC_SUPABASE_URL no es una URL válida)";
  }

  console.error("Error inesperado:", {
    name: err.name,
    message: err.message,
    causeCode: err.cause?.code,
    causeMessage: err.cause?.message,
    supabaseHostname: hostname,
  });
  process.exit(1);
});
