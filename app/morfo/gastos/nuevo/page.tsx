import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/morfo-supabase/server";
import { ExpenseForm } from "@/app/morfo/ExpenseForm";

export default async function NuevoGastoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/morfo/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 sm:p-6">
        <Link href="/morfo/gastos" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Volver a gastos
        </Link>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <h1 className="mb-3 text-sm font-semibold text-zinc-200">Nuevo gasto</h1>
          <ExpenseForm />
        </section>
      </div>
    </main>
  );
}
