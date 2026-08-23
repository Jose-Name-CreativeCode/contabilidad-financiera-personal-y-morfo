import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/morfo-supabase/server";
import { ClientForm } from "@/app/morfo/ClientForm";
import { deleteClient } from "@/app/morfo/actions";

export default async function ClientePage({
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

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!client) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 sm:p-6">
        <Link href="/morfo" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Volver a clientes
        </Link>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <h1 className="mb-3 text-sm font-semibold text-zinc-200">{client.name}</h1>
          <ClientForm client={client} />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <h2 className="mb-2 text-sm font-semibold text-zinc-200">Historial de servicios</h2>
          <p className="text-sm text-zinc-500">
            Aún no hay cotizaciones — esta sección se llenará cuando construyamos la Fase 2
            (cotizaciones).
          </p>
        </section>

        <form action={deleteClient.bind(null, client.id)}>
          <button
            type="submit"
            className="w-full rounded-lg border border-rose-500/30 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10"
          >
            Eliminar cliente
          </button>
        </form>
      </div>
    </main>
  );
}
