import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/morfo-supabase/server";
import { QuoteForm } from "@/app/morfo/QuoteForm";
import { DownloadPdfButton } from "@/app/morfo/DownloadPdfButton";
import { deleteQuote } from "@/app/morfo/actions";

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

  const [{ data: quote }, { data: clients }, { data: settings }] = await Promise.all([
    supabase.from("quotes").select("*, clients(name, contact_person, email)").eq("id", id).single(),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("agency_settings").select("*").eq("id", "default").single(),
  ]);

  if (!quote) {
    notFound();
  }

  const client = quote.clients as unknown as {
    name: string;
    contact_person: string | null;
    email: string | null;
  };

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

        {settings && (
          <DownloadPdfButton quote={quote} client={client} settings={settings} />
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
