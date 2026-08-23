-- Permite registrar mensajes de números de WhatsApp NO vinculados a ningún
-- profile (auditoría/debug), sin crear transacciones ni usuarios.
-- La FK y el RLS existentes siguen aplicando cuando user_id sí está presente.

alter table whatsapp_messages
  alter column user_id drop not null;
