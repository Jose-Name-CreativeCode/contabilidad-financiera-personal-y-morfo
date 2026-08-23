import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/morfo-supabase/server";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/morfo/login");
  }

  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = today.slice(0, 7) + "-01";

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, expense_date, concept, category, payment_method, invoice, amount")
    .order("expense_date", { ascending: false });

  const all = expenses ?? [];
  const totalMes = all
    .filter((e) => e.expense_date >= startOfMonth)
    .reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Morfo</h1>
            <p className="text-xs text-zinc-500">{user.email} · Gastos operativos</p>
          </div>
          <Link
            href="/morfo/operaciones"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            Operaciones
          </Link>
        </div>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Gastos registrados</p>
            <p className="mt-1 text-xl font-semibold">{all.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Gasto del mes</p>
            <p className="mt-1 text-xl font-semibold text-rose-400">{fmt(totalMes)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Gastos</h2>
            <Link
              href="/morfo/gastos/nuevo"
              className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              + Nuevo gasto
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {all.map((e) => (
              <Link
                key={e.id}
                href={`/morfo/gastos/${e.id}`}
                className="flex items-center justify-between gap-3 py-3 hover:bg-white/[0.02]"
              >
                <div>
                  <p className="text-sm text-zinc-100">{e.concept}</p>
                  <p className="text-xs text-zinc-500">
                    {e.expense_date}
                    {e.category ? ` · ${e.category}` : ""}
                    {e.invoice ? " · Con factura" : ""}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-rose-400">{fmt(Number(e.amount))}</span>
              </Link>
            ))}
            {all.length === 0 && (
              <p className="py-4 text-sm text-zinc-500">Sin gastos todavía.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
