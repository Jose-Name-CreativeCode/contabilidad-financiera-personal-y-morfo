"use client";

import { useActionState } from "react";
import { login } from "@/app/morfo/actions";

const inputClass =
  "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/30";

export default function MorfoLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-6 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
        <h1 className="mb-1 text-lg font-semibold">Morfo</h1>
        <p className="mb-5 text-sm text-zinc-500">Clientes y cotizaciones de la agencia</p>
        <form action={formAction} className="flex flex-col gap-3">
          <input name="email" type="email" placeholder="Email" required className={inputClass} />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            className={inputClass}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
          {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
        </form>
      </div>
    </main>
  );
}
