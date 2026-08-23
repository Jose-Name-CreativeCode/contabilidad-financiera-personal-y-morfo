"use client";

import { useActionState } from "react";
import { saveExpense } from "@/app/morfo/actions";

const inputClass =
  "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/30";

export type ExpenseRecord = {
  id: string;
  expense_date: string;
  concept: string;
  category: string | null;
  payment_method: string | null;
  invoice: boolean;
  amount: number;
  notes: string;
};

export function ExpenseForm({ expense }: { expense?: ExpenseRecord }) {
  const [state, formAction, pending] = useActionState(saveExpense, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {expense && <input type="hidden" name="id" value={expense.id} />}
      <div className="flex gap-2">
        <input
          name="concept"
          type="text"
          placeholder="Concepto"
          defaultValue={expense?.concept}
          required
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="expense_date"
          type="date"
          defaultValue={expense?.expense_date ?? new Date().toISOString().slice(0, 10)}
          required
          className={`w-40 ${inputClass}`}
        />
      </div>
      <div className="flex gap-2">
        <input
          name="category"
          type="text"
          placeholder="Categoría (ej. Software, Renta)"
          defaultValue={expense?.category ?? ""}
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="payment_method"
          type="text"
          placeholder="Método de pago"
          defaultValue={expense?.payment_method ?? ""}
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Monto"
          defaultValue={expense?.amount ?? ""}
          required
          className={`w-32 ${inputClass}`}
        />
      </div>
      <input
        name="notes"
        type="text"
        placeholder="Notas (opcional)"
        defaultValue={expense?.notes ?? ""}
        className={inputClass}
      />
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input
          name="invoice"
          type="checkbox"
          defaultChecked={expense?.invoice ?? false}
          className="rounded border-white/20"
        />
        Tiene factura
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : expense ? "Guardar cambios" : "Registrar gasto"}
      </button>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
    </form>
  );
}
