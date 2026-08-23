# Workflow n8n: WhatsApp texto → Supabase

No tengo acceso a una instancia de n8n ni a credenciales de WhatsApp Business Cloud desde este entorno, así que **no configuré el workflow real**. Esto documenta exactamente qué nodos crear y cómo conectarlos. `parser.js` contiene la lógica exacta (probada con `node n8n/parser.test.js`) que va pegada dentro de los Code nodes.

## Formato canónico del número de WhatsApp

Usamos **solo dígitos**, tal como los entrega WhatsApp Cloud API en `messages[].from` / `contacts[].wa_id` (sin `+`, espacios ni guiones). Ejemplo: `525512345678`.

- Nunca se usa el texto libre del mensaje para identificar al usuario — solo el campo `from`/`wa_id` del payload del webhook.
- `profiles.whatsapp_number` debe guardarse en el **mismo formato exacto** que WhatsApp entrega para ese número (incluyendo código de país), verificándolo contra un mensaje real antes de insertarlo — no lo inventes a partir de un número "bonito".
- n8n normaliza igual ambos lados antes de comparar (`normalizePhoneNumber` en `parser.js`: quita todo lo que no sea dígito). Esto unifica variantes como `+52 55 1234 5678` y `+525512345678` (ambas → `525512345678`).
- **Limitación real:** esta normalización NO puede inventar un código de país faltante. `5512345678` (10 dígitos, sin `52`) y `525512345678` (con código de país) son y seguirán siendo números distintos — no se pueden reconciliar sin adivinar, y no adivinamos. Por eso el `whatsapp_number` del profile debe cargarse siempre con el mismo formato completo que manda la API, nunca a mano "a ojo".

## Credenciales a crear en n8n (Settings → Credentials), nunca hardcodeadas

- **WhatsApp Cloud API**: `access_token`, `phone_number_id`.
- **Verify token** del webhook (string que tú defines al configurar el webhook en Meta).
- **Supabase (HTTP Header Auth)**: header `apikey` y `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`, apuntando a `https://<project>.supabase.co/rest/v1`. Solo n8n la usa; nunca va al frontend.

## Respuesta rápida a Meta (sin colas, sin Redis)

El nodo **Webhook (POST)** se configura con la opción nativa de n8n **Respond → "Immediately"** (en vez de "When Last Node Finishes"). Esto hace que n8n conteste `200 OK` a Meta en cuanto llega la petición, y el resto del workflow sigue ejecutándose en segundo plano dentro de la misma ejecución. No hace falta infraestructura adicional: es una opción del propio nodo Webhook.

Consecuencia: como la respuesta ya se envió, el resto del flujo **no puede devolver nada en el body de esa respuesta** — por eso la confirmación ("✅ Registrado...") y los mensajes de error/pregunta siempre se mandan por una llamada aparte a la API de envío de WhatsApp (`POST /{phone_number_id}/messages`), nunca a través del webhook.

## Nodos y conexiones

1. **Webhook (GET) – "Verify"**
   Path: `/whatsapp`. Responde el valor de `hub.challenge` como texto plano si `hub.verify_token` coincide con la credencial guardada; si no, responde 403.

2. **Webhook (POST) – "Receive"** — mismo path, método POST, **Respond = Immediately** (ver arriba).

3. **Code – "Extract & Normalize"**
   Lee `entry[0].changes[0].value.messages[0]`. Si no existe (evento de status, no mensaje), termina el flujo sin más acción. Si existe, extrae:
   - `whatsapp_message_id = messages[0].id`
   - `wa_id = normalizePhoneNumber(messages[0].from)`
   - `raw_text = messages[0].text.body`

4. **HTTP Request – "Get Profile"**
   `GET /rest/v1/profiles?whatsapp_number=eq.{{ $json.wa_id }}&select=id`

5. **IF – "Profile Found?"**
   - **false** → HTTP Request **"Log Unlinked"**: `POST /rest/v1/whatsapp_messages` con `Prefer: resolution=ignore-duplicates,return=representation`, body `{user_id: null, wa_id, whatsapp_message_id, raw_text, processed_status: 'failed'}` (requiere migraciones 0003 y 0004). Si la respuesta viene vacía (ya existía, es un reintento), **no reenviar** el aviso. Si es nueva → HTTP Request **"Send WhatsApp Reply"**: `"Tu número de WhatsApp todavía no está vinculado a una cuenta."` → fin.
   - **true** → continúa con `profile.id`.

6. **HTTP Request – "Get Pending"**
   `GET /rest/v1/whatsapp_messages?user_id=eq.{{profile.id}}&processed_status=eq.pending&select=id,pending_transaction_data&limit=1`
   (el índice único parcial garantiza 0 o 1 resultado)

7. **HTTP Request – "Get Accounts" / "Get Categories"** (en paralelo)
   `GET /rest/v1/accounts?user_id=eq.{{profile.id}}&select=id,name`
   `GET /rest/v1/categories?user_id=eq.{{profile.id}}&select=id,name`

8. **IF – "Has Pending?"**

   **Rama A — SÍ hay pendiente (mensaje de seguimiento, ej. "Amex"):**
   - **Code "Merge Pending Answer"**: pega el cuerpo de `mergePendingAnswer()`, con `raw_text` del mensaje actual, `draft = pending.pending_transaction_data`, `accounts`.
   - **IF "Merge status = complete?"**
     - **true** →
       1. **HTTP Request "Insert Transaction"**: `POST /rest/v1/transactions`, `Prefer: return=representation`, body con `whatsapp_message_id = <id del mensaje actual (B)>` (es el mensaje que disparó la creación; el mensaje original A queda registrado aparte, nunca se sobreescribe su id).
       2. Si el insert tiene éxito → en paralelo:
          - `PATCH /rest/v1/whatsapp_messages?id=eq.{{pending.id}}` → `{processed_status: 'completed', pending_transaction_data: null}` (mensaje A: mismo id, se limpia el borrador).
          - `POST /rest/v1/whatsapp_messages` (`Prefer: resolution=ignore-duplicates`) → `{user_id, wa_id, whatsapp_message_id: <id de B>, raw_text, processed_status: 'completed'}` (mensaje B: fila propia).
          - `POST /{phone_number_id}/messages` → confirmación `"✅ Registrado: $<amount> en <description> · <accountName>"`.
       3. Si el insert de transacción falla por **conflicto de unique** (`transactions.whatsapp_message_id` ya existe): significa que otra ejecución concurrente ya la creó (reintento de Meta). No es error real: solo asegurar que la fila de B quede logueada (`ignore-duplicates`) y terminar **sin** reenviar confirmación.
       4. Si falla por cualquier otro motivo (error real de Supabase): **no** enviar confirmación; loguear B como `failed`; enviar mensaje de error genérico.
     - **false** (sigue faltando un dato) →
       - `PATCH /rest/v1/whatsapp_messages?id=eq.{{pending.id}}` → `{pending_transaction_data: <draft actualizado>}` (A sigue `pending`, solo se actualiza su borrador).
       - `POST /rest/v1/whatsapp_messages` (`ignore-duplicates`) → fila propia de B con `processed_status: 'completed'` (B ya cumplió su función: aportó un dato).
       - Enviar la siguiente pregunta (`question` del resultado).

   **Rama B — NO hay pendiente (mensaje nuevo):**
   - **Code "Parse New Message"**: pega el cuerpo de `parseNewMessage()`.
   - **IF "Parse status = complete?"**
     - **true** → igual que el paso "Insert Transaction" de arriba, pero con un solo mensaje (no hay fila A que actualizar): insertar transacción con `whatsapp_message_id` del mensaje actual → si tiene éxito, loguear el mensaje como `completed` (`ignore-duplicates`) y enviar confirmación; si hay conflicto de unique en `transactions`, ya fue procesada por otra ejecución → solo asegurar el log y terminar.
     - **false** → `POST /rest/v1/whatsapp_messages` (`ignore-duplicates`) con `processed_status: 'pending', pending_transaction_data: draft` → enviar la pregunta.
       - **Caso borde real:** si esta inserción falla por el índice único parcial "un solo pending por usuario" (carrera entre dos mensajes nuevos casi simultáneos), responder `"Ya tienes una transacción pendiente, contesta primero eso."` en vez de crear un segundo pendiente.

## Cómo reacciona n8n ante conflictos de duplicado (resumen)

| Insert que choca | Constraint responsable | Reacción de n8n |
|---|---|---|
| `whatsapp_messages` (mismo `whatsapp_message_id`) | `unique(whatsapp_message_id)` | `Prefer: resolution=ignore-duplicates` devuelve array vacío → no reenviar mensajes de WhatsApp, terminar. |
| `transactions` (mismo `whatsapp_message_id`) | índice único parcial `ux_transactions_whatsapp_message_id` | Capturar el error 23505 (nodo con "Continue On Fail" + IF de error) → no crear transacción, no confirmar de nuevo, solo asegurar el log del mensaje y terminar. |
| `whatsapp_messages` (segundo `pending` del mismo usuario) | índice único parcial `ux_whatsapp_messages_pending_per_user` | Capturar el error → responder pidiendo resolver el pendiente actual, no crear uno nuevo. |

Ninguna de estas protecciones depende de un `SELECT` previo: el `SELECT` de "Get Pending" solo decide qué rama tomar, pero la garantía real de "una sola transacción" vive en los índices únicos de Supabase.

## Ciclo de vida completo: mensaje incompleto + seguimiento

1. Llega A = "Gasté 850 en Costco". No hay pendiente → parser: falta cuenta → se inserta A en `whatsapp_messages` (`processed_status='pending'`, `pending_transaction_data={type:expense, amount:850, description:'Costco', account_id:null,...}`) → se pregunta "¿Con qué cuenta pagaste?".
2. Llega B = "Amex". Hay pendiente (fila A) → `mergePendingAnswer` combina "Amex" con el draft de A → completo → se inserta la transacción (`whatsapp_message_id = id de B`) → A se marca `completed` y su `pending_transaction_data` se limpia (mismo id de A, nunca se sobreescribe con el id de B) → B se inserta como su propia fila `completed` → se envía la confirmación.

Resultado: 2 filas en `whatsapp_messages` (A y B, cada una con su propio `whatsapp_message_id`), 1 transacción, 0 pendientes activos.

## Qué no pude probar aquí

Todo lo anterior depende de una instancia real de n8n, Supabase y WhatsApp Cloud API — no puedo ejecutarlo desde este entorno. Lo que sí se probó (`node n8n/parser.test.js`): los casos de parsing puro, incluida la normalización de número y los falsos positivos de monto. La verificación end-to-end (duplicado real, número no vinculado real, condición de carrera real) debe hacerse manualmente una vez montado el workflow.
