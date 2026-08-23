-- Corrige RLS de transactions: insert/update permitía referenciar
-- account_id/category_id de OTRO usuario (solo se validaba user_id).

drop policy "transactions_insert_own" on transactions;
drop policy "transactions_update_own" on transactions;

create policy "transactions_insert_own" on transactions
  for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from accounts a where a.id = account_id and a.user_id = auth.uid())
    and (category_id is null or exists (select 1 from categories c where c.id = category_id and c.user_id = auth.uid()))
  );

create policy "transactions_update_own" on transactions
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from accounts a where a.id = account_id and a.user_id = auth.uid())
    and (category_id is null or exists (select 1 from categories c where c.id = category_id and c.user_id = auth.uid()))
  );

-- WITH CHECK explícito en el resto de políticas de update (antes dependían
-- del comportamiento implícito de Postgres, que reusa USING si falta WITH CHECK).

drop policy "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy "accounts_update_own" on accounts;
create policy "accounts_update_own" on accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy "categories_update_own" on categories;
create policy "categories_update_own" on categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
