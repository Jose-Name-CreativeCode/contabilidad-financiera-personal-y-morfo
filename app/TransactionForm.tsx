"use client";

import { useActionState } from "react";
import { createTransaction } from "@/app/actions";

type Option = { id: string; name: string };

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
    <form action={formAction} className="flex flex-col gap-2 rounded border p-4">
      <div className="flex gap-2">
        <select name="type" required className="flex-1 rounded border px-2 py-1">
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
          className="w-32 rounded border px-2 py-1"
        />
      </div>
      <input
        name="description"
        type="text"
        placeholder="Descripción"
        className="rounded border px-2 py-1"
      />
      <div className="flex gap-2">
        <select name="account_id" required className="flex-1 rounded border px-2 py-1">
          <option value="">Cuenta...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select name="category_id" className="flex-1 rounded border px-2 py-1">
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
        className="rounded border px-2 py-1"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar transacción"}
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
