// Lógica determinista de parsing para el workflow de n8n (mensajes de WhatsApp).
// No usa IA. Cada función es pura (sin llamadas a red) para poder probarse aquí
// con Node directamente. El CUERPO de cada función se pega tal cual dentro del
// Code node correspondiente en n8n (ver n8n/README.md).

const EXPENSE_VERBS = ["gaste", "gasté", "pague", "pagué", "compre", "compré"];
const INCOME_VERBS = ["recibi", "recibí", "me depositaron", "cobre", "cobré"];

// Reglas de categoría MUY explícitas. Ampliar solo con reglas inequívocas.
const CATEGORY_KEYWORDS = {
  gasolina: "Transporte",
  uber: "Transporte",
  camion: "Transporte",
};

function stripAccents(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizeText(text) {
  return stripAccents(text.toLowerCase().trim());
}

function detectType(normalized) {
  if (EXPENSE_VERBS.some((v) => normalized.includes(stripAccents(v)))) return "expense";
  if (INCOME_VERBS.some((v) => normalized.includes(stripAccents(v)))) return "income";
  return null;
}

// Un mensaje puede tener varios números ("Compré 2 cafés por 180 pesos").
// Solo confiamos en un número como monto si trae una marca de moneda ($ o
// "pesos"/"mxn"), o si es el ÚNICO número del mensaje. Si hay varios números
// y ninguno (o más de uno) trae marca de moneda, no adivinamos: se pregunta.
function extractAmount(normalized) {
  const numberRegex = /(\$)?\s?(\d+(?:,\d{3})*(?:\.\d+)?)\s?(pesos|mxn)?/g;
  const candidates = [...normalized.matchAll(numberRegex)].map((m) => ({
    raw: m[0],
    value: Number(m[2].replace(/,/g, "")),
    hasCurrencyMark: Boolean(m[1] || m[3]),
  }));

  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    const c = candidates[0];
    return c.value > 0 ? { amount: c.value, raw: c.raw } : null;
  }

  const marked = candidates.filter((c) => c.hasCurrencyMark);
  if (marked.length === 1) {
    return marked[0].value > 0 ? { amount: marked[0].value, raw: marked[0].raw } : null;
  }

  return null; // ambiguo: varios números, sin una sola marca de moneda clara
}

// Coincidencia exacta o normalizada únicamente. Si hay más de una cuenta cuyo
// nombre aparece en el texto, se considera ambigua y se debe preguntar.
function matchAccount(normalized, accounts) {
  const matches = accounts.filter((a) => normalized.includes(normalizeText(a.name)));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return { ambiguous: true, candidates: matches };
  return null;
}

function matchCategory(description, categories) {
  if (!description) return null;
  const normalizedDescription = normalizeText(description);
  const words = normalizedDescription.split(/\s+/);
  const categoryName = words.map((w) => CATEGORY_KEYWORDS[w]).find(Boolean);
  if (!categoryName) return null;
  const found = categories.find((c) => normalizeText(c.name) === normalizeText(categoryName));
  return found ?? null;
}

function extractDescription(normalized, amountRaw, account) {
  let text = normalized;
  if (amountRaw) text = text.replace(amountRaw, " ");
  for (const v of [...EXPENSE_VERBS, ...INCOME_VERBS]) text = text.replace(stripAccents(v), " ");
  if (account) text = text.replace(new RegExp(`con\\s+${normalizeText(account.name)}`, "i"), " ");
  text = text.replace(/^\s*(de|en)\s+/i, " ").trim();
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// input: { raw_text, accounts: [{id,name}], categories: [{id,name}] }
// output: { status: 'complete'|'ask_amount'|'ask_account', question, transaction, draft }
function parseNewMessage(input) {
  const { raw_text, accounts, categories } = input;
  const normalized = normalizeText(raw_text);

  const type = detectType(normalized) ?? "expense"; // "gasté/pagué/compré" son la mayoría; sin verbo, se asume gasto.
  const amountResult = extractAmount(normalized);
  const accountMatch = matchAccount(normalized, accounts);
  const account = accountMatch && !accountMatch.ambiguous ? accountMatch : null;
  const description = extractDescription(normalized, amountResult?.raw, account);
  const category = matchCategory(description, categories);

  const draft = {
    type,
    amount: amountResult?.amount ?? null,
    description,
    account_id: account?.id ?? null,
    category_id: category?.id ?? null,
    currency: "MXN",
  };

  if (!amountResult) {
    return { status: "ask_amount", question: "¿Cuánto fue el monto?", draft };
  }

  if (accountMatch?.ambiguous) {
    return {
      status: "ask_account",
      question: `Encontré más de una cuenta posible (${accountMatch.candidates
        .map((c) => c.name)
        .join(", ")}). ¿Con cuál pagaste?`,
      draft,
    };
  }

  if (!account) {
    return { status: "ask_account", question: "¿Con qué cuenta pagaste?", draft };
  }

  return {
    status: "complete",
    question: null,
    transaction: {
      type: draft.type,
      amount: draft.amount,
      currency: draft.currency,
      description: draft.description,
      account_id: draft.account_id,
      category_id: draft.category_id,
      transaction_date: new Date().toISOString().slice(0, 10),
    },
  };
}

// input: { raw_text, draft: <pending_transaction_data guardado>, accounts }
// Se usa cuando el usuario ya tiene una transacción pendiente y este mensaje
// es la respuesta (ej. solo "Amex"). Por ahora solo sabe completar la cuenta.
function mergePendingAnswer(input) {
  const { raw_text, draft, accounts } = input;
  const normalized = normalizeText(raw_text);

  if (draft.account_id == null) {
    const accountMatch = matchAccount(normalized, accounts);
    if (accountMatch?.ambiguous) {
      return {
        status: "ask_account",
        question: `Encontré más de una cuenta posible (${accountMatch.candidates
          .map((c) => c.name)
          .join(", ")}). ¿Con cuál pagaste?`,
        draft,
      };
    }
    if (!accountMatch) {
      return { status: "ask_account", question: "No reconozco esa cuenta. ¿Con qué cuenta pagaste?", draft };
    }
    draft.account_id = accountMatch.id;
  } else if (draft.amount == null) {
    const amountResult = extractAmount(normalized);
    if (!amountResult) {
      return { status: "ask_amount", question: "¿Cuánto fue el monto?", draft };
    }
    draft.amount = amountResult.amount;
  }

  if (draft.amount == null) {
    return { status: "ask_amount", question: "¿Cuánto fue el monto?", draft };
  }
  if (draft.account_id == null) {
    return { status: "ask_account", question: "¿Con qué cuenta pagaste?", draft };
  }

  return {
    status: "complete",
    question: null,
    transaction: {
      type: draft.type,
      amount: draft.amount,
      currency: draft.currency ?? "MXN",
      description: draft.description,
      account_id: draft.account_id,
      category_id: draft.category_id ?? null,
      transaction_date: new Date().toISOString().slice(0, 10),
    },
  };
}

// Formato canónico: solo dígitos, tal cual entrega WhatsApp Cloud API en
// messages[].from / contacts[].wa_id (sin "+", espacios ni guiones).
// Se aplica tanto al wa_id entrante como a profiles.whatsapp_number antes de
// compararlos, para que "+52 55 1234 5678" y "5215512345678" sean el mismo número.
function normalizePhoneNumber(raw) {
  return String(raw).replace(/\D/g, "");
}

// Extrae del payload crudo de WhatsApp Cloud API los campos que le importan
// al workflow (equivalente al Code node "Extract & Normalize" de n8n/README.md).
// Devuelve null si el evento no es un mensaje de texto de un usuario
// (ej. es un status update de entrega/lectura).
function extractWhatsAppMessage(payload) {
  const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message || message.type !== "text") return null;
  return {
    whatsapp_message_id: message.id,
    wa_id: normalizePhoneNumber(message.from),
    raw_text: message.text.body,
  };
}

module.exports = {
  parseNewMessage,
  mergePendingAnswer,
  normalizeText,
  extractAmount,
  matchAccount,
  normalizePhoneNumber,
  extractWhatsAppMessage,
};
