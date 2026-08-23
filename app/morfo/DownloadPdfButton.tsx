"use client";

import { downloadQuotePdf } from "@/app/morfo/pdf";
import type { QuoteRecord } from "@/app/morfo/QuoteForm";

export function DownloadPdfButton({
  quote,
  client,
  settings,
  paidAmount,
}: {
  quote: QuoteRecord;
  client: { name: string; contact_person: string | null; email: string | null };
  settings: {
    agency_name: string;
    agency_email: string;
    agency_phone: string;
    agency_website: string;
    agency_address: string;
    payment_methods: string;
    bank_details_invoice: string;
    bank_details_no_invoice: string;
    terms: string;
  };
  paidAmount: number;
}) {
  return (
    <button
      type="button"
      onClick={() => downloadQuotePdf(quote, client, settings, paidAmount)}
      className="w-full rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2 text-sm text-fuchsia-300 hover:bg-fuchsia-500/20"
    >
      Descargar PDF
    </button>
  );
}
