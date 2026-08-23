import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions";
import { TransactionForm } from "@/app/TransactionForm";
import { RecentLimitSelect } from "@/app/RecentLimitSelect";
import { StatCard, BalanceHero, CategoryBars, fmt } from "@/app/dashboard/Widgets";

const RECENT_LIMITS = [10, 15, 25, 50, 100];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const { limit: limitParam } = await searchParams;
  const limit = RECENT_LIMITS.includes(Number(limitParam)) ? Number(limitParam) : 10;

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
  const monthLabel = new Date(today).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  const sum = (rows: typeof all) => rows.reduce((acc, t) => acc + Number(t.amount), 0);
  const expenses = all.filter((t) => t.type === "expense");
  const incomes = all.filter((t) => t.type === "income");

  const gastoHoy = sum(expenses.filter((t) => t.transaction_date === today));
  const gastoSemana = sum(expenses.filter((t) => t.transaction_date >= startOfWeekStr));
  const gastoMes = sum(expenses.filter((t) => t.transaction_date >= startOfMonthStr));
  const ingresosMes = sum(incomes.filter((t) => t.transaction_date >= startOfMonthStr));
  const saldo = sum(incomes) - sum(expenses);

  const groupByCategory = (rows: typeof all) => {
    const map = new Map<string, number>();
    for (const t of rows) {
      const name = (t.categories as unknown as { name: string } | null)?.name ?? "Sin categoría";
      map.set(name, (map.get(name) ?? 0) + Number(t.amount));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const gastosPorCategoria = groupByCategory(
    expenses.filter((t) => t.transaction_date >= startOfMonthStr),
  );
  const ingresosPorCategoria = groupByCategory(
    incomes.filter((t) => t.transaction_date >= startOfMonthStr),
  );

  const recientes = all.slice(0, limit);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Finanzas</h1>
            <p className="text-xs text-zinc-500">
              {user.email} · {monthLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/morfo"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Morfo →
            </a>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        <BalanceHero saldo={saldo} />

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Gasto de hoy" amount={gastoHoy} tone="negative" />
          <StatCard label="Gasto semanal" amount={gastoSemana} tone="negative" />
          <StatCard label="Gasto mensual" amount={gastoMes} tone="negative" />
          <StatCard label="Ingresos del mes" amount={ingresosMes} tone="positive" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <CategoryBars
            title="Gastos por categoría (mes actual)"
            data={gastosPorCategoria}
            emptyLabel="Sin gastos este mes."
            barClass="bg-gradient-to-r from-rose-500 to-orange-400"
          />
          <CategoryBars
            title="Ingresos por categoría (mes actual)"
            data={ingresosPorCategoria}
            emptyLabel="Sin ingresos registrados este mes."
            barClass="bg-gradient-to-r from-emerald-500 to-teal-400"
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Cuentas y categorías</h2>
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-xs text-zinc-500">Cuentas</p>
              <div className="flex flex-wrap gap-2">
                {(accounts ?? []).map((a) => (
                  <span
                    key={a.id}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200"
                  >
                    {a.name}
                  </span>
                ))}
                {(accounts ?? []).length === 0 && (
                  <span className="text-xs text-zinc-500">Sin cuentas todavía.</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-zinc-500">Categorías</p>
              <div className="flex flex-wrap gap-2">
                {(categories ?? []).map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200"
                  >
                    {c.name}
                  </span>
                ))}
                {(categories ?? []).length === 0 && (
                  <span className="text-xs text-zinc-500">Sin categorías todavía.</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Nueva transacción</h2>
          <TransactionForm accounts={accounts ?? []} categories={categories ?? []} />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Movimientos recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-zinc-500">
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="font-medium">Descripción</th>
                  <th className="font-medium">Monto</th>
                  <th className="font-medium">Cuenta</th>
                  <th className="font-medium">Categoría</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((t) => (
                  <tr key={t.id} className="border-b border-white/5">
                    <td className="py-2 text-zinc-400">{t.transaction_date}</td>
                    <td className="text-zinc-200">{t.description ?? "—"}</td>
                    <td
                      className={`tabular-nums ${
                        t.type === "income" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {fmt(Number(t.amount))}
                    </td>
                    <td className="text-zinc-400">
                      {(t.accounts as unknown as { name: string } | null)?.name ?? "—"}
                    </td>
                    <td className="text-zinc-400">
                      {(t.categories as unknown as { name: string } | null)?.name ?? "—"}
                    </td>
                  </tr>
                ))}
                {recientes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-zinc-500">
                      Sin transacciones todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <span>Mostrar:</span>
            <RecentLimitSelect options={RECENT_LIMITS} value={limit} />
          </div>
        </section>
      </div>
    </main>
  );
}
