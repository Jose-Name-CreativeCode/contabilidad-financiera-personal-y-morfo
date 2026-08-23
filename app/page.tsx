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
      .order("transaction_date", { ascending: false }),
  ]);

  const all = transactions ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);
  const startOfMonthStr = today.slice(0, 7) + "-01";

  const sum = (rows: typeof all) => rows.reduce((acc, t) => acc + Number(t.amount), 0);
  const expenses = all.filter((t) => t.type === "expense");
  const incomes = all.filter((t) => t.type === "income");

  const gastoHoy = sum(expenses.filter((t) => t.transaction_date === today));
  const gastoSemana = sum(expenses.filter((t) => t.transaction_date >= startOfWeekStr));
  const gastoMes = sum(expenses.filter((t) => t.transaction_date >= startOfMonthStr));
  const ingresosMes = sum(incomes.filter((t) => t.transaction_date >= startOfMonthStr));
  const saldo = sum(incomes) - sum(expenses);

  const porCategoria = new Map<string, number>();
  for (const t of expenses.filter((t) => t.transaction_date >= startOfMonthStr)) {
    const name = (t.categories as unknown as { name: string } | null)?.name ?? "Sin categoría";
    porCategoria.set(name, (porCategoria.get(name) ?? 0) + Number(t.amount));
  }
  const distribucion = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);

  const recientes = all.slice(0, 10);
  const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded border p-3">
          <p className="text-xs text-zinc-500">Gasto de hoy</p>
          <p className="text-lg font-semibold">{fmt(gastoHoy)}</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-xs text-zinc-500">Gasto semanal</p>
          <p className="text-lg font-semibold">{fmt(gastoSemana)}</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-xs text-zinc-500">Gasto mensual</p>
          <p className="text-lg font-semibold">{fmt(gastoMes)}</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-xs text-zinc-500">Ingresos del mes</p>
          <p className="text-lg font-semibold">{fmt(ingresosMes)}</p>
        </div>
        <div className="rounded border p-3">
          <p className="text-xs text-zinc-500">Saldo</p>
          <p className="text-lg font-semibold">{fmt(saldo)}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Distribución por categoría (mes actual)</h2>
        <ul className="flex flex-col gap-1">
          {distribucion.map(([name, amount]) => (
            <li key={name} className="flex justify-between text-sm">
              <span>{name}</span>
              <span>{fmt(amount)}</span>
            </li>
          ))}
          {distribucion.length === 0 && (
            <li className="text-sm text-zinc-500">Sin gastos este mes.</li>
          )}
        </ul>
      </section>

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
        <h2 className="mb-2 font-semibold">Movimientos recientes</h2>
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
            {recientes.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-1">{t.transaction_date}</td>
                <td>{t.description ?? "—"}</td>
                <td>{t.amount}</td>
                <td>{t.type}</td>
                <td>{(t.accounts as unknown as { name: string } | null)?.name ?? "—"}</td>
                <td>{(t.categories as unknown as { name: string } | null)?.name ?? "—"}</td>
              </tr>
            ))}
            {recientes.length === 0 && (
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
