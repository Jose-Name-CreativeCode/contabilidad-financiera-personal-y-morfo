-- Cobros: cada pago recibido queda como su propio registro (en vez de un solo
-- campo total_paid en quotes), para poder ver anticipos/parcialidades reales.

create table payments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  method text,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

create policy "payments_all_authenticated" on payments
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

alter table quotes drop column total_paid;

-- Gastos operativos de la agencia.
create table expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  concept text not null,
  category text,
  payment_method text,
  invoice boolean not null default false,
  amount numeric(12, 2) not null check (amount > 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table expenses enable row level security;

create policy "expenses_all_authenticated" on expenses
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
