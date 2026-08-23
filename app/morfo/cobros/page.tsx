import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/morfo-supabase/server";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/morfo/login");
  }

  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = today.slice(0, 7) + "-01";

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, payment_date, method, quote_id, quotes(title, clients(name))")
    .order("payment_date", { ascending: false });

  const all = payments ?? [];
  const totalMes = all
    .filter((p) => p.payment_date >= startOfMonth)
    .reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Morfo</h1>
            <p className="text-xs text-zinc-500">{user.email} · Cobros e ingresos</p>
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
            <p className="text-xs text-zinc-400">Cobros registrados</p>
            <p className="mt-1 text-xl font-semibold">{all.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Cobrado este mes</p>
            <p className="mt-1 text-xl font-semibold text-emerald-400">{fmt(totalMes)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Cobros</h2>
          <div className="flex flex-col divide-y divide-white/5">
            {all.map((p) => {
              const quote = p.quotes as unknown as {
                title: string;
                clients: { name: string } | null;
              } | null;
              return (
                <Link
                  key={p.id}
                  href={`/morfo/cotizaciones/${p.quote_id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-white/[0.02]"
                >
                  <div>
                    <p className="text-sm text-zinc-100">{quote?.title ?? "—"}</p>
                    <p className="text-xs text-zinc-500">
                      {quote?.clients?.name ?? "—"} · {p.payment_date}
                      {p.method ? ` · ${p.method}` : ""}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums text-emerald-400">
                    +{fmt(Number(p.amount))}
                  </span>
                </Link>
              );
            })}
            {all.length === 0 && (
              <p className="py-4 text-sm text-zinc-500">Sin cobros todavía.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
