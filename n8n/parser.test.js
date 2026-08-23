const assert = require("node:assert");
const { parseNewMessage, mergePendingAnswer, normalizePhoneNumber } = require("./parser");

const accounts = [
  { id: "acc-bbva", name: "BBVA" },
  { id: "acc-amex", name: "Amex" },
  { id: "acc-efectivo", name: "Efectivo" },
];
const categories = [
  { id: "cat-transporte", name: "Transporte" },
  { id: "cat-super", name: "Supermercado" },
];

// Caso 1: mensaje completo
{
  const r = parseNewMessage({ raw_text: "Gasté 420 pesos de gasolina con BBVA", accounts, categories });
  assert.equal(r.status, "complete");
  assert.equal(r.transaction.type, "expense");
  assert.equal(r.transaction.amount, 420);
  assert.equal(r.transaction.description, "Gasolina");
  assert.equal(r.transaction.account_id, "acc-bbva");
  assert.equal(r.transaction.category_id, "cat-transporte");
  console.log("Caso 1 OK:", r.transaction);
}

// Caso 2: falta cuenta
{
  const r = parseNewMessage({ raw_text: "Gasté 850 en Costco", accounts, categories });
  assert.equal(r.status, "ask_account");
  assert.equal(r.draft.amount, 850);
  assert.equal(r.draft.account_id, null);
  console.log("Caso 2 OK:", r);
}

// Caso 3: seguimiento "Amex" completa el pendiente del caso 2
{
  const r2 = parseNewMessage({ raw_text: "Gasté 850 en Costco", accounts, categories });
  const r3 = mergePendingAnswer({ raw_text: "Amex", draft: r2.draft, accounts });
  assert.equal(r3.status, "complete");
  assert.equal(r3.transaction.account_id, "acc-amex");
  assert.equal(r3.transaction.amount, 850);
  console.log("Caso 3 OK:", r3.transaction);
}

// Extra: monto con "$" y coma
{
  const r = parseNewMessage({ raw_text: "Pagué $1,250 en Costco con Amex", accounts, categories });
  assert.equal(r.status, "complete");
  assert.equal(r.transaction.amount, 1250);
  console.log("Extra OK:", r.transaction);
}

// Extra: ingreso
{
  const r = parseNewMessage({ raw_text: "Recibí 28000 pesos de nómina en BBVA", accounts, categories });
  assert.equal(r.status, "complete");
  assert.equal(r.transaction.type, "income");
  assert.equal(r.transaction.account_id, "acc-bbva");
  console.log("Extra ingreso OK:", r.transaction);
}

// Falsos positivos con números (revisión previa a conectar WhatsApp real)
{
  // No menciona cuenta -> debe preguntar, pero el monto ya debe ser correcto (180, no 2)
  const r = parseNewMessage({ raw_text: "Compré 2 cafés por 180 pesos", accounts, categories });
  assert.equal(r.status, "ask_account");
  assert.equal(r.draft.amount, 180);
  console.log("Falso positivo (cantidad vs monto) OK:", r.draft.amount);
}
{
  const r = parseNewMessage({ raw_text: "Gasolina 1,250 con BBVA", accounts, categories });
  assert.equal(r.status, "complete");
  assert.equal(r.transaction.amount, 1250);
  console.log("Monto con coma sin símbolo OK:", r.transaction.amount);
}
{
  const r = parseNewMessage({ raw_text: "Recibí $28,000 de nómina", accounts, categories });
  assert.equal(r.status, "ask_account"); // no menciona cuenta, es correcto que pregunte
  assert.equal(r.draft.amount, 28000);
  console.log("Monto con $ y coma OK:", r.draft.amount);
}

// Normalización de número (misma persona, tres formas de escribirlo)
{
  const variants = ["5512345678", "+52 55 1234 5678", "+525512345678", "5215512345678"];
  const normalized = variants.map(normalizePhoneNumber);
  console.log("Normalización:", normalized);
  assert.equal(normalized[1], "525512345678");
  assert.equal(normalized[2], "525512345678");
  // OJO: "5512345678" (sin código de país) y "5215512345678" (con 52+1) NO
  // normalizan al mismo valor entre sí -- ver limitación documentada en README.
}

console.log("\nTodos los casos de parsing pasaron.");
