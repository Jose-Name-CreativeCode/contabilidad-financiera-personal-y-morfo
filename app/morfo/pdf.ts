import { jsPDF } from "jspdf";
import type { QuoteRecord } from "@/app/morfo/QuoteForm";

type Client = { name: string; contact_person: string | null; email: string | null };

type Settings = {
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

const money = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  no_pagada: "No pagada",
  anticipo_pagado: "Anticipo pagado",
  pagada_total: "Pagada total",
};

export function downloadQuotePdf(
  quote: QuoteRecord,
  client: Client,
  settings: Settings,
  paidAmount: number,
) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 50;
  const contentWidth = pageWidth - marginX * 2;
  let y = 60;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(settings.agency_name || "Morfo Studio", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  y += 16;
  const agencyLine = [settings.agency_email, settings.agency_phone, settings.agency_website]
    .filter(Boolean)
    .join("  ·  ");
  if (agencyLine) doc.text(agencyLine, marginX, y);
  if (settings.agency_address) {
    y += 12;
    doc.text(settings.agency_address, marginX, y);
  }

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Cotización", pageWidth - marginX, 60, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(quote.quote_date, pageWidth - marginX, 76, { align: "right" });

  y += 30;
  doc.setDrawColor(220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Cliente", marginX, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(client.name, marginX, y);
  y += 14;
  if (client.contact_person) {
    doc.text(client.contact_person, marginX, y);
    y += 14;
  }
  if (client.email) {
    doc.text(client.email, marginX, y);
    y += 14;
  }

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(quote.title, marginX, y);
  if (quote.service_type) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(quote.service_type, marginX, y + 14);
    doc.setTextColor(0);
  }
  y += 34;

  type LineItem = { label: string; amount: number };
  const items: LineItem[] = [{ label: quote.service_type || "Servicio", amount: quote.service_amount }];
  if (quote.ad_spend_required && quote.ad_spend > 0) {
    items.push({ label: "Manejo de pauta publicitaria", amount: quote.ad_spend });
  }
  for (const row of quote.custom_table_rows) {
    items.push({ label: row.label, amount: row.amount });
  }

  doc.setFillColor(245, 245, 248);
  doc.rect(marginX, y, contentWidth, 20, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(quote.custom_table_title || "Concepto", marginX + 8, y + 14);
  doc.text("Monto", pageWidth - marginX - 8, y + 14, { align: "right" });
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const item of items) {
    y += 20;
    doc.text(item.label, marginX + 8, y);
    doc.text(money(item.amount), pageWidth - marginX - 8, y, { align: "right" });
  }

  const subtotal = items.reduce((acc, i) => acc + i.amount, 0);
  const total = subtotal + (quote.invoice_required ? quote.iva : 0);

  y += 20;
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 18;
  doc.text("Subtotal", marginX + 8, y);
  doc.text(money(subtotal), pageWidth - marginX - 8, y, { align: "right" });

  if (quote.invoice_required && quote.iva > 0) {
    y += 18;
    doc.text("IVA", marginX + 8, y);
    doc.text(money(quote.iva), pageWidth - marginX - 8, y, { align: "right" });
  }

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total", marginX + 8, y);
  doc.text(money(total), pageWidth - marginX - 8, y, { align: "right" });

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const remaining = total - paidAmount;
  doc.text(`Estado de pago: ${PAYMENT_STATUS_LABEL[quote.payment_status] ?? quote.payment_status}`, marginX + 8, y);
  y += 14;
  doc.text(`Pagado: ${money(paidAmount)}   ·   Saldo pendiente: ${money(remaining)}`, marginX + 8, y);

  const bankDetails = quote.invoice_required
    ? settings.bank_details_invoice
    : settings.bank_details_no_invoice;

  if (bankDetails || settings.payment_methods) {
    y += 30;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Datos de pago", marginX, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (settings.payment_methods) {
      doc.text(`Métodos aceptados: ${settings.payment_methods}`, marginX, y);
      y += 12;
    }
    for (const line of bankDetails.split("\n").filter(Boolean)) {
      doc.text(line, marginX, y);
      y += 12;
    }
  }

  if (quote.notes) {
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Notas", marginX, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(quote.notes, contentWidth);
    doc.text(lines, marginX, y);
    y += lines.length * 12;
  }

  if (settings.terms) {
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Términos y condiciones", marginX, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(settings.terms, contentWidth);
    doc.text(lines, marginX, y);
  }

  doc.save(`Cotizacion-${client.name}-${quote.quote_date}.pdf`);
}
