"use client";

import { useActionState } from "react";
import { savePayment } from "@/app/morfo/actions";

const inputClass =
  "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/30";

export function PaymentForm({ quoteId }: { quoteId: string }) {
  const [state, formAction, pending] = useActionState(savePayment, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="quote_id" value={quoteId} />
      <div className="flex gap-2">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Monto recibido"
          required
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="payment_date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
          className={`w-40 ${inputClass}`}
        />
      </div>
      <input name="method" type="text" placeholder="Método de pago" className={inputClass} />
      <input name="notes" type="text" placeholder="Notas (opcional)" className={inputClass} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Registrar cobro"}
      </button>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
    </form>
  );
}
