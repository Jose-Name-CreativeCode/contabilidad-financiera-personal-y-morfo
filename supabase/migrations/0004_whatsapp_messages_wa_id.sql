-- Conserva el identificador real del remitente de WhatsApp (wa_id, tal cual
-- lo entrega el payload de WhatsApp Business Cloud en messages[].from /
-- contacts[].wa_id) para no depender únicamente de user_id, que puede ser
-- null cuando el número todavía no está vinculado a ningún profile.

alter table whatsapp_messages
  add column wa_id text not null default '';

alter table whatsapp_messages
  alter column wa_id drop default;
