import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfColumn {
  header: string;
  dataKey: string;
  align?: "left" | "right" | "center";
}

export interface PdfExportOptions {
  title: string;
  churchName?: string;
  period?: string;
  columns: PdfColumn[];
  rows: Record<string, string | number>[];
  totals?: { label: string; value: string }[];
  filename: string;
}

const BRAND = { r: 10, g: 15, b: 44 }; // navy

export function exportToPdf(opts: PdfExportOptions) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(opts.churchName || "Igreja", 10, 10);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(opts.title, 10, 17);

  y = 30;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  if (opts.period) {
    doc.text(`Período: ${opts.period}`, 10, y);
  }
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
    pageWidth - 10,
    y,
    { align: "right" },
  );
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [opts.columns.map((c) => c.header)],
    body: opts.rows.map((r) => opts.columns.map((c) => String(r[c.dataKey] ?? ""))),
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: 40 },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: opts.columns.reduce<Record<number, { halign?: "left" | "right" | "center" }>>(
      (acc, c, i) => {
        if (c.align) acc[i] = { halign: c.align };
        return acc;
      },
      {},
    ),
    margin: { left: 10, right: 10 },
  });

  if (opts.totals && opts.totals.length) {
    // @ts-expect-error - lastAutoTable is added by autoTable plugin
    let endY: number = doc.lastAutoTable?.finalY ?? y;
    endY += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    opts.totals.forEach((t) => {
      doc.text(`${t.label}: ${t.value}`, pageWidth - 10, endY, { align: "right" });
      endY += 5;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" },
    );
  }

  doc.save(opts.filename);
}

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
