import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/morfo-supabase/server";
import { logout } from "@/app/morfo/actions";

const STATUS_LABEL: Record<string, string> = {
  lead: "Prospecto",
  active: "Activo",
  inactive: "Inactivo",
};

const STATUS_STYLE: Record<string, string> = {
  lead: "bg-amber-500/15 text-amber-300",
  active: "bg-emerald-500/15 text-emerald-300",
  inactive: "bg-zinc-500/15 text-zinc-400",
};

export default async function MorfoClientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/morfo/login");
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, contact_person, status, responsible, invoice_required")
    .order("name");

  const all = clients ?? [];
  const activos = all.filter((c) => c.status === "active").length;
  const prospectos = all.filter((c) => c.status === "lead").length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Morfo</h1>
            <p className="text-xs text-zinc-500">{user.email} · Clientes</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              ← Finanzas
            </Link>
            <Link
              href="/morfo/operaciones"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Operaciones
            </Link>
            <Link
              href="/morfo/cotizaciones"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Cotizaciones
            </Link>
            <Link
              href="/morfo/gastos"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Gastos
            </Link>
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

        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Total clientes</p>
            <p className="mt-1 text-xl font-semibold">{all.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Activos</p>
            <p className="mt-1 text-xl font-semibold text-emerald-400">{activos}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="text-xs text-zinc-400">Prospectos</p>
            <p className="mt-1 text-xl font-semibold text-amber-400">{prospectos}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Clientes</h2>
            <Link
              href="/morfo/clientes/nueva"
              className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              + Nuevo cliente
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {all.map((c) => (
              <Link
                key={c.id}
                href={`/morfo/clientes/${c.id}`}
                className="flex items-center justify-between gap-3 py-3 hover:bg-white/[0.02]"
              >
                <div>
                  <p className="text-sm text-zinc-100">{c.name}</p>
                  <p className="text-xs text-zinc-500">
                    {c.contact_person ?? "—"}
                    {c.responsible ? ` · Atiende: ${c.responsible}` : ""}
                    {c.invoice_required ? " · Factura" : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${STATUS_STYLE[c.status] ?? "bg-zinc-500/15 text-zinc-400"}`}
                >
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </Link>
            ))}
            {all.length === 0 && (
              <p className="py-4 text-sm text-zinc-500">Sin clientes todavía.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
