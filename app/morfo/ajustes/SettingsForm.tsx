"use client";

import { useActionState } from "react";
import { saveAgencySettings } from "@/app/morfo/actions";

const inputClass =
  "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/30";

export type AgencySettings = {
  agency_name: string;
  agency_email: string;
  agency_phone: string;
  agency_website: string;
  agency_address: string;
  payment_methods: string;
  bank_details_invoice: string;
  bank_details_no_invoice: string;
  advance_percent: number;
  terms: string;
};

export function SettingsForm({ settings }: { settings: AgencySettings }) {
  const [state, formAction, pending] = useActionState(saveAgencySettings, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input
        name="agency_name"
        type="text"
        placeholder="Nombre de la agencia"
        defaultValue={settings.agency_name}
        className={inputClass}
      />
      <div className="flex gap-2">
        <input
          name="agency_email"
          type="email"
          placeholder="Email"
          defaultValue={settings.agency_email}
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="agency_phone"
          type="text"
          placeholder="Teléfono"
          defaultValue={settings.agency_phone}
          className={`flex-1 ${inputClass}`}
        />
      </div>
      <div className="flex gap-2">
        <input
          name="agency_website"
          type="text"
          placeholder="Sitio web"
          defaultValue={settings.agency_website}
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="advance_percent"
          type="number"
          min="0"
          max="100"
          placeholder="% anticipo"
          defaultValue={settings.advance_percent}
          className={`w-32 ${inputClass}`}
        />
      </div>
      <input
        name="agency_address"
        type="text"
        placeholder="Dirección"
        defaultValue={settings.agency_address}
        className={inputClass}
      />
      <input
        name="payment_methods"
        type="text"
        placeholder="Métodos de pago (ej. Transferencia, Efectivo, Tarjeta)"
        defaultValue={settings.payment_methods}
        className={inputClass}
      />
      <textarea
        name="bank_details_invoice"
        placeholder="Datos bancarios (con factura)"
        defaultValue={settings.bank_details_invoice}
        rows={3}
        className={inputClass}
      />
      <textarea
        name="bank_details_no_invoice"
        placeholder="Datos bancarios (sin factura)"
        defaultValue={settings.bank_details_no_invoice}
        rows={3}
        className={inputClass}
      />
      <textarea
        name="terms"
        placeholder="Términos y condiciones (aparecen en el PDF)"
        defaultValue={settings.terms}
        rows={4}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar ajustes"}
      </button>
      {state?.error !== undefined &&
        (state.error ? (
          <p className="text-sm text-rose-400">{state.error}</p>
        ) : (
          <p className="text-sm text-emerald-400">Guardado.</p>
        ))}
    </form>
  );
}
