import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/morfo-supabase/server";

export default async function OperacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/morfo/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Morfo</h1>
            <p className="text-xs text-zinc-500">{user.email} · Nueva operación</p>
          </div>
          <Link
            href="/morfo/cotizaciones"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            Ver cotizaciones
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-white/[0.03] to-transparent p-6 backdrop-blur">
          <p className="mb-1 text-xs font-medium text-fuchsia-300">CAPTURA RÁPIDA</p>
          <h2 className="text-xl font-semibold">Nueva operación</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Registra lo importante sin perder tiempo: cliente, cotización, cobro o gasto.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="mb-1 text-xs font-medium text-fuchsia-300">FLUJO 1</p>
            <h3 className="mb-1 text-base font-semibold">Cliente + cotización</h3>
            <p className="mb-4 text-sm text-zinc-500">
              Da de alta al cliente y crea una cotización lista para seguimiento.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/morfo/clientes/nueva"
                className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90"
              >
                Nuevo cliente
              </Link>
              <Link
                href="/morfo/cotizaciones/nueva"
                className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90"
              >
                Nueva cotización
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="mb-1 text-xs font-medium text-fuchsia-300">FLUJO 2</p>
            <h3 className="mb-1 text-base font-semibold">Cobro rápido</h3>
            <p className="mb-4 text-sm text-zinc-500">
              Registra un anticipo, un cobro parcial o un pago completo desde la cotización.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/morfo/cotizaciones"
                className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90"
              >
                Elegir cotización a cobrar
              </Link>
              <Link
                href="/morfo/cobros"
                className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-zinc-300 hover:bg-white/5"
              >
                Ver historial de cobros
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <p className="mb-1 text-xs font-medium text-fuchsia-300">FLUJO 3</p>
            <h3 className="mb-1 text-base font-semibold">Gasto operativo</h3>
            <p className="mb-4 text-sm text-zinc-500">
              Captura un gasto del día y lo deja listo para reportes.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/morfo/gastos/nuevo"
                className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90"
              >
                Nuevo gasto
              </Link>
              <Link
                href="/morfo/gastos"
                className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-zinc-300 hover:bg-white/5"
              >
                Ver gastos
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
