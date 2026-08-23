// Simulador local del paso "Extract & Normalize" + parser del workflow de n8n.
// No llama a Supabase ni a WhatsApp. Sirve para validar el parser contra
// fixtures realistas de WhatsApp Cloud API antes de montar n8n de verdad.
//
// Uso:
//   node n8n/simulate-webhook.js n8n/fixtures/text-complete.json
//   node n8n/simulate-webhook.js n8n/fixtures/text-followup.json --draft n8n/fixtures/pending-draft-B.json

const fs = require("node:fs");
const path = require("node:path");
const { parseNewMessage, mergePendingAnswer, extractWhatsAppMessage } = require("./parser");

function main() {
  const [fixturePath, flag, draftPath] = process.argv.slice(2);
  if (!fixturePath) {
    console.error("Uso: node n8n/simulate-webhook.js <fixture.json> [--draft <draft.json>]");
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const extracted = extractWhatsAppMessage(payload);

  if (!extracted) {
    console.log("No es un mensaje de texto -> el workflow lo ignoraría (200 sin acción).");
    return;
  }

  const { whatsapp_message_id, wa_id, raw_text } = extracted;

  console.log("--- Extraído (como lo haría el Code node 'Extract & Normalize') ---");
  console.log({ whatsapp_message_id, wa_id, raw_text });

  const accounts = JSON.parse(
    fs.readFileSync(path.join(__dirname, "fixtures/test-accounts.json"), "utf8"),
  );
  const categories = JSON.parse(
    fs.readFileSync(path.join(__dirname, "fixtures/test-categories.json"), "utf8"),
  );

  let result;
  if (flag === "--draft" && draftPath) {
    const draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
    console.log("--- Simulando rama 'Has Pending' (mergePendingAnswer) ---");
    result = mergePendingAnswer({ raw_text, draft, accounts });
  } else {
    console.log("--- Simulando rama 'No Pending' (parseNewMessage) ---");
    result = parseNewMessage({ raw_text, accounts, categories });
  }

  console.log("--- Resultado ---");
  console.log(JSON.stringify(result, null, 2));
}

main();
