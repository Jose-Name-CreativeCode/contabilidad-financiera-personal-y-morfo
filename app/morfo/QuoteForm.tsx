"use client";

import { useActionState, useState } from "react";
import { saveQuote } from "@/app/morfo/actions";

const inputClass =
  "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/30";

type Row = { label: string; amount: string };

export type QuoteRecord = {
  id: string;
  client_id: string;
  title: string;
  service_type: string | null;
  quote_date: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  service_amount: number;
  ad_spend_required: boolean;
  ad_spend: number;
  ad_budget: number;
  invoice_required: boolean;
  iva: number;
  notes: string;
  custom_table_title: string | null;
  custom_table_rows: { label: string; amount: number }[];
};

export function QuoteForm({
  quote,
  clients,
}: {
  quote?: QuoteRecord;
  clients: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveQuote, undefined);
  const [adRequired, setAdRequired] = useState(quote?.ad_spend_required ?? false);
  const [invoiceRequired, setInvoiceRequired] = useState(quote?.invoice_required ?? false);
  const [rows, setRows] = useState<Row[]>(
    (quote?.custom_table_rows ?? []).map((r) => ({
      label: r.label,
      amount: String(r.amount),
    })),
  );

  const addRow = () => setRows([...rows, { label: "", amount: "" }]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof Row, value: string) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {quote && <input type="hidden" name="id" value={quote.id} />}
      <input
        type="hidden"
        name="custom_table_rows"
        value={JSON.stringify(
          rows
            .filter((r) => r.label.trim())
            .map((r) => ({ label: r.label, amount: Number(r.amount) || 0 })),
        )}
      />

      <input
        name="title"
        type="text"
        placeholder="Título de la cotización"
        defaultValue={quote?.title}
        required
        className={inputClass}
      />

      <div className="flex gap-2">
        <select
          name="client_id"
          required
          defaultValue={quote?.client_id ?? ""}
          className={`flex-1 ${inputClass}`}
        >
          <option value="">Cliente...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          name="quote_date"
          type="date"
          defaultValue={quote?.quote_date ?? new Date().toISOString().slice(0, 10)}
          required
          className={`w-40 ${inputClass}`}
        />
      </div>

      <input
        name="service_type"
        type="text"
        placeholder="Tipo de servicio (ej. Manejo de redes)"
        defaultValue={quote?.service_type ?? ""}
        className={inputClass}
      />

      <div className="flex gap-2">
        <select
          name="status"
          defaultValue={quote?.status ?? "borrador"}
          className={`flex-1 ${inputClass}`}
        >
          <option value="borrador">Borrador</option>
          <option value="enviada">Enviada</option>
          <option value="aprobada">Aprobada</option>
          <option value="archivada">Archivada</option>
        </select>
        <select
          name="payment_status"
          defaultValue={quote?.payment_status ?? "no_pagada"}
          className={`flex-1 ${inputClass}`}
        >
          <option value="no_pagada">No pagada</option>
          <option value="anticipo_pagado">Anticipo pagado</option>
          <option value="pagada_total">Pagada total</option>
        </select>
      </div>

      <div className="flex gap-2">
        <input
          name="payment_method"
          type="text"
          placeholder="Método de pago"
          defaultValue={quote?.payment_method ?? ""}
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="service_amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Monto del servicio"
          defaultValue={quote?.service_amount ?? ""}
          required
          className={`flex-1 ${inputClass}`}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          name="ad_spend_required"
          checked={adRequired}
          onChange={(e) => setAdRequired(e.target.checked)}
          className="rounded border-white/20"
        />
        Incluye manejo de pauta publicitaria
      </label>
      {adRequired && (
        <div className="flex gap-2 pl-6">
          <input
            name="ad_spend"
            type="number"
            step="0.01"
            min="0"
            placeholder="Costo de manejo de pauta"
            defaultValue={quote?.ad_spend ?? ""}
            className={`flex-1 ${inputClass}`}
          />
          <input
            name="ad_budget"
            type="number"
            step="0.01"
            min="0"
            placeholder="Presupuesto de pauta (informativo)"
            defaultValue={quote?.ad_budget ?? ""}
            className={`flex-1 ${inputClass}`}
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          name="invoice_required"
          checked={invoiceRequired}
          onChange={(e) => setInvoiceRequired(e.target.checked)}
          className="rounded border-white/20"
        />
        Requiere factura
      </label>
      {invoiceRequired && (
        <input
          name="iva"
          type="number"
          step="0.01"
          min="0"
          placeholder="IVA"
          defaultValue={quote?.iva ?? ""}
          className={`ml-6 ${inputClass}`}
        />
      )}

      <div className="rounded-lg border border-white/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-zinc-400">Renglones extra (opcional)</p>
          <button
            type="button"
            onClick={addRow}
            className="text-xs text-fuchsia-400 hover:underline"
          >
            + Agregar renglón
          </button>
        </div>
        <input
          name="custom_table_title"
          type="text"
          placeholder="Título de la tabla (ej. Entregables)"
          defaultValue={quote?.custom_table_title ?? ""}
          className={`mb-2 w-full ${inputClass}`}
        />
        {rows.map((row, i) => (
          <div key={i} className="mb-1 flex gap-2">
            <input
              type="text"
              placeholder="Descripción"
              value={row.label}
              onChange={(e) => updateRow(i, "label", e.target.value)}
              className={`flex-1 ${inputClass}`}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Monto"
              value={row.amount}
              onChange={(e) => updateRow(i, "amount", e.target.value)}
              className={`w-28 ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="px-2 text-zinc-500 hover:text-rose-400"
            >
              ✕
            </button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-zinc-600">Sin renglones extra.</p>}
      </div>

      <textarea
        name="notes"
        placeholder="Notas"
        defaultValue={quote?.notes ?? ""}
        rows={3}
        className={inputClass}
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : quote ? "Guardar cambios" : "Crear cotización"}
      </button>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
    </form>
  );
}
