-- Fase 1 de Morfo: clientes de la agencia.
-- Vive en un proyecto de Supabase separado del de finanzas personales.

create extension if not exists pgcrypto;

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  status text not null default 'lead' check (status in ('lead', 'active', 'inactive')),
  invoice_required boolean not null default false,
  website text,
  instagram text,
  responsible text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients enable row level security;

-- un solo usuario admin por ahora (Jose); cualquier cuenta autenticada
-- en este proyecto tiene acceso total a los clientes.
create policy "clients_all_authenticated" on clients
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
