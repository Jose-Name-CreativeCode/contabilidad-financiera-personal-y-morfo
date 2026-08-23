-- Fase 2 de Morfo: cotizaciones, ligadas a clientes.
-- Reemplaza el modelo anterior de QuoteRecord (rawJson genérico) por columnas reales.

create table quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  title text not null,
  service_type text,
  quote_date date not null default current_date,
  status text not null default 'borrador'
    check (status in ('borrador', 'enviada', 'aprobada', 'archivada')),
  payment_status text not null default 'no_pagada'
    check (payment_status in ('no_pagada', 'anticipo_pagado', 'pagada_total')),
  payment_method text,
  service_amount numeric(12, 2) not null default 0,
  ad_spend_required boolean not null default false,
  ad_spend numeric(12, 2) not null default 0,
  ad_budget numeric(12, 2) not null default 0,
  invoice_required boolean not null default false,
  iva numeric(12, 2) not null default 0,
  total_paid numeric(12, 2) not null default 0,
  notes text not null default '',
  custom_table_title text,
  custom_table_rows jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table quotes enable row level security;

create policy "quotes_all_authenticated" on quotes
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Datos de la agencia usados para generar el PDF de cotizaciones (una sola fila).
create table agency_settings (
  id text primary key default 'default',
  agency_name text not null default 'Morfo Studio',
  agency_email text not null default '',
  agency_phone text not null default '',
  agency_website text not null default '',
  agency_address text not null default '',
  payment_methods text not null default 'Transferencia, Efectivo, Tarjeta',
  bank_details_invoice text not null default '',
  bank_details_no_invoice text not null default '',
  advance_percent int not null default 50,
  terms text not null default '',
  updated_at timestamptz not null default now()
);

alter table agency_settings enable row level security;

create policy "agency_settings_all_authenticated" on agency_settings
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

insert into agency_settings (id) values ('default');
