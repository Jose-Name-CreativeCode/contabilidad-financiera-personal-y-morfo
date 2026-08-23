import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/morfo-supabase/server";
import { QuoteForm } from "@/app/morfo/QuoteForm";
import { DownloadPdfButton } from "@/app/morfo/DownloadPdfButton";
import { PaymentForm } from "@/app/morfo/PaymentForm";
import { deleteQuote, deletePayment } from "@/app/morfo/actions";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default async function CotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/morfo/login");
  }

  const [{ data: quote }, { data: clients }, { data: settings }, { data: payments }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("*, clients(name, contact_person, email)")
        .eq("id", id)
        .single(),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("agency_settings").select("*").eq("id", "default").single(),
      supabase
        .from("payments")
        .select("id, amount, payment_date, method, notes")
        .eq("quote_id", id)
        .order("payment_date", { ascending: false }),
    ]);

  if (!quote) {
    notFound();
  }

  const client = quote.clients as unknown as {
    name: string;
    contact_person: string | null;
    email: string | null;
  };

  const paidAmount = (payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
  const total =
    Number(quote.service_amount) +
    Number(quote.ad_spend) +
    (quote.invoice_required ? Number(quote.iva) : 0) +
    (quote.custom_table_rows ?? []).reduce(
      (acc: number, r: { amount: number }) => acc + Number(r.amount),
      0,
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 sm:p-6">
        <Link href="/morfo/cotizaciones" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Volver a cotizaciones
        </Link>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <h1 className="mb-3 text-sm font-semibold text-zinc-200">{quote.title}</h1>
          <QuoteForm quote={quote} clients={clients ?? []} />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Cobros</h2>
            <p className="text-xs text-zinc-400">
              Pagado {fmt(paidAmount)} de {fmt(total)} · Saldo{" "}
              <span className={total - paidAmount > 0 ? "text-amber-400" : "text-emerald-400"}>
                {fmt(Math.max(0, total - paidAmount))}
              </span>
            </p>
          </div>
          <div className="mb-3 flex flex-col divide-y divide-white/5">
            {(payments ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-zinc-200">{fmt(Number(p.amount))}</p>
                  <p className="text-xs text-zinc-500">
                    {p.payment_date}
                    {p.method ? ` · ${p.method}` : ""}
                  </p>
                </div>
                <form action={deletePayment.bind(null, quote.id, p.id)}>
                  <button type="submit" className="text-xs text-zinc-500 hover:text-rose-400">
                    Eliminar
                  </button>
                </form>
              </div>
            ))}
            {(payments ?? []).length === 0 && (
              <p className="py-2 text-sm text-zinc-500">Sin cobros registrados.</p>
            )}
          </div>
          <PaymentForm quoteId={quote.id} />
        </section>

        {settings && (
          <DownloadPdfButton quote={quote} client={client} settings={settings} paidAmount={paidAmount} />
        )}

        <form action={deleteQuote.bind(null, quote.id)}>
          <button
            type="submit"
            className="w-full rounded-lg border border-rose-500/30 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10"
          >
            Eliminar cotización
          </button>
        </form>
      </div>
    </main>
  );
}
