"use client";

import { useActionState } from "react";
import { createTransaction } from "@/app/actions";

type Option = { id: string; name: string };

const inputClass =
  "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/30";

export function TransactionForm({
  accounts,
  categories,
}: {
  accounts: Option[];
  categories: Option[];
}) {
  const [state, formAction, pending] = useActionState(createTransaction, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <select name="type" required className={`flex-1 ${inputClass}`}>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Monto"
          required
          className={`w-32 ${inputClass}`}
        />
      </div>
      <input name="description" type="text" placeholder="Descripción" className={inputClass} />
      <div className="flex gap-2">
        <select name="account_id" required className={`flex-1 ${inputClass}`}>
          <option value="">Cuenta...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select name="category_id" className={`flex-1 ${inputClass}`}>
          <option value="">Categoría (opcional)...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <input
        name="transaction_date"
        type="date"
        defaultValue={today}
        required
        className={inputClass}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar transacción"}
      </button>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
    </form>
  );
}
