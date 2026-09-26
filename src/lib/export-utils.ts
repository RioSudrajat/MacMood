/**
 * Utility Ekspor Dokumen Standar Enterprise (CSV & Cetak PDF)
 * Didesain khusus untuk MacMood F&B POS & Admin Suite
 */

export interface DownloadCsvConfig {
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

export function downloadCsv(
  filenameOrConfig: string | DownloadCsvConfig,
  maybeHeaders?: string[],
  maybeRows?: (string | number | boolean | null | undefined)[][]
) {
  if (typeof window === "undefined") return;

  let filename: string;
  let headers: string[];
  let rows: (string | number | boolean | null | undefined)[][];

  if (typeof filenameOrConfig === "object" && filenameOrConfig !== null) {
    filename = filenameOrConfig.filename;
    headers = filenameOrConfig.headers;
    rows = filenameOrConfig.rows;
  } else {
    filename = filenameOrConfig;
    headers = maybeHeaders || [];
    rows = maybeRows || [];
  }

  const escapeCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCell).join(","));

  for (const row of rows) {
    csvRows.push(row.map(escapeCell).join(","));
  }

  // Tambahkan BOM \uFEFF agar Excel otomatis membuka karakter UTF-8 dengan benar
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  const cleanFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("download", cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ReportPrintKpi {
  label: string;
  value: string;
  sub?: string;
}

export interface ReportPrintSection {
  title: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  summaryText?: string;
}

export interface ReportPrintOptions {
  title: string;
  subtitle?: string;
  periodLabel?: string;
  outletName?: string;
  printedBy?: string;
  meta?: Array<{ label: string; value: string }>;
  kpis?: ReportPrintKpi[];
  tables?: Array<{
    title: string;
    headers: string[];
    rows: (string | number | boolean | null | undefined)[][];
    summaryText?: string;
  }>;
  sections?: ReportPrintSection[];
}

export function printReportPdf(options: ReportPrintOptions) {
  if (typeof window === "undefined") return;

  const nowStr =
    new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) +
    ", " +
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
    " WIB";

  const effectiveKpis: ReportPrintKpi[] =
    options.kpis ||
    (options.meta?.map((m) => ({ label: m.label, value: m.value })) ?? []);
  const effectiveSections: ReportPrintSection[] =
    options.sections || options.tables || [];

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Pop-up diblokir oleh peramban. Mohon izinkan pop-up untuk mencetak laporan.");
    return;
  }

  const kpisHtml =
    effectiveKpis && effectiveKpis.length > 0
      ? `
    <div class="kpi-grid">
      ${effectiveKpis
        .map(
          (kpi) => `
        <div class="kpi-card">
          <div class="kpi-label">${kpi.label}</div>
          <div class="kpi-value">${kpi.value}</div>
          ${kpi.sub ? `<div class="kpi-sub">${kpi.sub}</div>` : ""}
        </div>
      `
        )
        .join("")}
    </div>
  `
      : "";

  const sectionsHtml = effectiveSections
    .map(
      (sec) => `
    <div class="section">
      <h3 class="section-title">${sec.title}</h3>
      <table class="report-table">
        <thead>
          <tr>
            ${sec.headers.map((h) => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${sec.rows
            .map(
              (row) => `
            <tr>
              ${row.map((cell) => `<td>${cell !== null && cell !== undefined ? cell : "-"}</td>`).join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      ${sec.summaryText ? `<div class="section-summary">${sec.summaryText}</div>` : ""}
    </div>
  `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${options.title} - MacMood Official Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a2e26;
    }
    body {
      padding: 24px;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 2px solid #0d3829;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #0d3829;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      font-weight: 600;
      color: #d97706;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #4b5563;
    }
    .meta-box strong {
      color: #111827;
    }
    .doc-title-container {
      margin-bottom: 16px;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 800;
      color: #0d3829;
    }
    .doc-subtitle {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px 12px;
      background: #fdfcf9;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 16px;
      font-weight: 900;
      color: #0d3829;
      margin-top: 4px;
    }
    .kpi-sub {
      font-size: 9px;
      color: #059669;
      font-weight: 600;
      margin-top: 2px;
    }
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #0d3829;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .report-table th {
      background-color: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #e5e7eb;
      font-size: 9px;
      text-transform: uppercase;
    }
    .report-table td {
      padding: 6px 8px;
      border: 1px solid #e5e7eb;
      vertical-align: middle;
    }
    .report-table tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .section-summary {
      font-size: 10px;
      font-weight: 700;
      text-align: right;
      padding: 6px 8px;
      color: #0d3829;
      margin-top: 4px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px dashed #d1d5db;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">MacMood · Macaroni & Cheese</div>
      <div class="brand-sub">Sistem Manajemen Bisnis & Point of Sale Terintegrasi</div>
    </div>
    <div class="meta-box">
      <div>Tanggal Cetak: <strong>${nowStr}</strong></div>
      <div>Outlet: <strong>${options.outletName || "Semua Cabang"}</strong></div>
      <div>Dicetak Oleh: <strong>${options.printedBy || "Muhammad Afrizal (Owner)"}</strong></div>
      ${options.periodLabel ? `<div>Periode: <strong>${options.periodLabel}</strong></div>` : ""}
    </div>
  </div>

  <div class="doc-title-container">
    <h1 class="doc-title">${options.title}</h1>
    ${options.subtitle ? `<div class="doc-subtitle">${options.subtitle}</div>` : ""}
  </div>

  ${kpisHtml}
  ${sectionsHtml}

  <div class="footer">
    <div>MacMood Indonesia · Dokumen Resmi Internal Operasional</div>
    <div>Dicetak secara otomatis melalui Sistem MacMood Suite</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
