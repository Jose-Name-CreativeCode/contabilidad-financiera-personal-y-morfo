import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/morfo-supabase/server";

const STATUS_LABEL: Record<string, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aprobada: "Aprobada",
  archivada: "Archivada",
};

const STATUS_STYLE: Record<string, string> = {
  borrador: "bg-zinc-500/15 text-zinc-400",
  enviada: "bg-amber-500/15 text-amber-300",
  aprobada: "bg-emerald-500/15 text-emerald-300",
  archivada: "bg-zinc-700/30 text-zinc-500",
};

const PAYMENT_LABEL: Record<string, string> = {
  no_pagada: "No pagada",
  anticipo_pagado: "Anticipo",
  pagada_total: "Pagada",
};

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const quoteTotal = (q: {
  service_amount: number;
  ad_spend: number;
  invoice_required: boolean;
  iva: number;
  custom_table_rows: { amount: number }[] | null;
}) =>
  Number(q.service_amount) +
  Number(q.ad_spend) +
  (q.invoice_required ? Number(q.iva) : 0) +
  (q.custom_table_rows ?? []).reduce((acc, r) => acc + Number(r.amount), 0);

export default async function QuotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/morfo/login");
  }

  const [{ data: quotes }, { data: payments }] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        "id, title, quote_date, status, payment_status, service_amount, ad_spend, iva, invoice_required, custom_table_rows, clients(name)",
      )
      .order("quote_date", { ascending: false }),
    supabase.from("payments").select("quote_id, amount"),
  ]);

  const all = quotes ?? [];
  const paidByQuote = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByQuote.set(p.quote_id, (paidByQuote.get(p.quote_id) ?? 0) + Number(p.amount));
  }

  const totalCotizado = all.reduce((acc, q) => acc + quoteTotal(q), 0);
  const totalPendiente = all.reduce(
    (acc, q) => acc + Math.max(0, quoteTotal(q) - (paidByQuote.get(q.id) ?? 0)),
    0,
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Morfo</h1>
            <p className="text-xs text-zinc-500">{user.email} · Cotizaciones</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/morfo/operaciones"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Operaciones
            </Link>
            <Link
              href="/morfo"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Clientes
            </Link>
            <Link
              href="/morfo/cobros"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Cobros
            </Link>
            <Link
              href="/morfo/gastos"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Gastos
            </Link>
            <Link
              href="/morfo/ajustes"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Ajustes
            </Link>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Cotizaciones</p>
            <p className="mt-1 text-xl font-semibold">{all.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Total cotizado</p>
            <p className="mt-1 text-xl font-semibold text-emerald-400">{fmt(totalCotizado)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Por cobrar</p>
            <p className="mt-1 text-xl font-semibold text-amber-400">{fmt(totalPendiente)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Cotizaciones</h2>
            <Link
              href="/morfo/cotizaciones/nueva"
              className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              + Nueva cotización
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {all.map((q) => {
              const total = quoteTotal(q);
              return (
                <Link
                  key={q.id}
                  href={`/morfo/cotizaciones/${q.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-white/[0.02]"
                >
                  <div>
                    <p className="text-sm text-zinc-100">{q.title}</p>
                    <p className="text-xs text-zinc-500">
                      {(q.clients as unknown as { name: string } | null)?.name ?? "—"} ·{" "}
                      {q.quote_date} · {PAYMENT_LABEL[q.payment_status] ?? q.payment_status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-zinc-300">{fmt(total)}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${STATUS_STYLE[q.status] ?? "bg-zinc-500/15 text-zinc-400"}`}
                    >
                      {STATUS_LABEL[q.status] ?? q.status}
                    </span>
                  </div>
                </Link>
              );
            })}
            {all.length === 0 && (
              <p className="py-4 text-sm text-zinc-500">Sin cotizaciones todavía.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
