"use client";

import { useActionState } from "react";
import { saveClient } from "@/app/morfo/actions";

const inputClass =
  "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/30";

export type ClientRecord = {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  invoice_required: boolean;
  website: string | null;
  instagram: string | null;
  responsible: string | null;
  notes: string;
};

export function ClientForm({ client }: { client?: ClientRecord }) {
  const [state, formAction, pending] = useActionState(saveClient, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {client && <input type="hidden" name="id" value={client.id} />}
      <input
        name="name"
        type="text"
        placeholder="Nombre del cliente / empresa"
        defaultValue={client?.name}
        required
        className={inputClass}
      />
      <div className="flex gap-2">
        <input
          name="contact_person"
          type="text"
          placeholder="Persona de contacto"
          defaultValue={client?.contact_person ?? ""}
          className={`flex-1 ${inputClass}`}
        />
        <select
          name="status"
          defaultValue={client?.status ?? "lead"}
          className={`w-36 ${inputClass}`}
        >
          <option value="lead">Prospecto</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          placeholder="Email"
          defaultValue={client?.email ?? ""}
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="phone"
          type="text"
          placeholder="Teléfono"
          defaultValue={client?.phone ?? ""}
          className={`flex-1 ${inputClass}`}
        />
      </div>
      <div className="flex gap-2">
        <input
          name="website"
          type="text"
          placeholder="Sitio web"
          defaultValue={client?.website ?? ""}
          className={`flex-1 ${inputClass}`}
        />
        <input
          name="instagram"
          type="text"
          placeholder="Instagram"
          defaultValue={client?.instagram ?? ""}
          className={`flex-1 ${inputClass}`}
        />
      </div>
      <input
        name="responsible"
        type="text"
        placeholder="Responsable (quién lo atiende)"
        defaultValue={client?.responsible ?? ""}
        className={inputClass}
      />
      <textarea
        name="notes"
        placeholder="Notas"
        defaultValue={client?.notes ?? ""}
        rows={3}
        className={inputClass}
      />
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input
          name="invoice_required"
          type="checkbox"
          defaultChecked={client?.invoice_required ?? false}
          className="rounded border-white/20"
        />
        Requiere factura
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : client ? "Guardar cambios" : "Crear cliente"}
      </button>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
    </form>
  );
}
