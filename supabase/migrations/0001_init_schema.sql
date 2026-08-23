-- Fase 1: esquema mínimo (profiles, accounts, categories, transactions, whatsapp_messages)

create extension if not exists pgcrypto;

-- profiles: 1:1 con auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  whatsapp_number text unique,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'credit_card', 'cash', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'MXN',
  description text,
  category_id uuid references categories(id) on delete set null,
  account_id uuid not null references accounts(id) on delete restrict,
  transaction_date date not null default current_date,
  source text not null check (source in ('web', 'whatsapp_text', 'whatsapp_audio')),
  whatsapp_message_id text,
  status text not null default 'confirmed' check (status in ('confirmed', 'void')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- evita duplicados por reintentos de webhook (solo aplica a transacciones que vienen de WhatsApp)
create unique index ux_transactions_whatsapp_message_id
  on transactions (whatsapp_message_id)
  where whatsapp_message_id is not null;

create table whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  whatsapp_message_id text not null unique,
  raw_text text not null,
  processed_status text not null default 'pending' check (processed_status in ('pending', 'completed', 'failed')),
  pending_transaction_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- garantiza que exista como máximo una conversación pendiente por usuario,
-- para que un mensaje de seguimiento ("Amex") pueda resolverse sin ambigüedad
create unique index ux_whatsapp_messages_pending_per_user
  on whatsapp_messages (user_id)
  where processed_status = 'pending';

-- Row Level Security: cada usuario accede únicamente a sus propios datos.
-- El backend de n8n debe usar la service_role key (bypassa RLS) y nunca la anon key.

alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table whatsapp_messages enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create policy "accounts_select_own" on accounts for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on accounts for update using (auth.uid() = user_id);
create policy "accounts_delete_own" on accounts for delete using (auth.uid() = user_id);

create policy "categories_select_own" on categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on categories for update using (auth.uid() = user_id);
create policy "categories_delete_own" on categories for delete using (auth.uid() = user_id);

create policy "transactions_select_own" on transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on transactions for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on transactions for delete using (auth.uid() = user_id);

create policy "whatsapp_messages_select_own" on whatsapp_messages for select using (auth.uid() = user_id);
