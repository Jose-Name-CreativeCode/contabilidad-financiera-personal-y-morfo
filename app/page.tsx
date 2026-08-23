import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions";
import { TransactionForm } from "@/app/TransactionForm";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: accounts }, { data: categories }, { data: transactions }] = await Promise.all([
    supabase.from("accounts").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("transactions")
      .select("id, transaction_date, description, amount, type, accounts(name), categories(name)")
      .order("transaction_date", { ascending: false })
      .limit(50),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600">{user.email}</p>
        <form action={logout}>
          <button type="submit" className="text-sm underline">
            Cerrar sesión
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">Cuentas</h2>
        <ul className="flex flex-wrap gap-2">
          {(accounts ?? []).map((a) => (
            <li key={a.id} className="rounded border px-2 py-1 text-sm">
              {a.name}
            </li>
          ))}
          {(accounts ?? []).length === 0 && (
            <li className="text-sm text-zinc-500">Sin cuentas todavía.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Categorías</h2>
        <ul className="flex flex-wrap gap-2">
          {(categories ?? []).map((c) => (
            <li key={c.id} className="rounded border px-2 py-1 text-sm">
              {c.name}
            </li>
          ))}
          {(categories ?? []).length === 0 && (
            <li className="text-sm text-zinc-500">Sin categorías todavía.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Nueva transacción</h2>
        <TransactionForm accounts={accounts ?? []} categories={categories ?? []} />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Transacciones</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1">Fecha</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Tipo</th>
              <th>Cuenta</th>
              <th>Categoría</th>
            </tr>
          </thead>
          <tbody>
            {(transactions ?? []).map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-1">{t.transaction_date}</td>
                <td>{t.description ?? "—"}</td>
                <td>{t.amount}</td>
                <td>{t.type}</td>
                <td>{(t.accounts as unknown as { name: string } | null)?.name ?? "—"}</td>
                <td>{(t.categories as unknown as { name: string } | null)?.name ?? "—"}</td>
              </tr>
            ))}
            {(transactions ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="py-2 text-zinc-500">
                  Sin transacciones todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
