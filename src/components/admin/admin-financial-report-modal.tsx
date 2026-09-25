import { formatRupiah } from "@/components/pos/format";
import { Download, Printer, X, FileText, ShieldCheck } from "lucide-react";

export interface FinancialReportData {
  periodLabel: string;
  generatedDate: string;
  ownerName: string;
  outletName: string;
  branchCode: string;
  grossSales: number;
  totalDiscount: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  pettyCashExpenses: number;
  operatingNetProfit: number;
  orderCount: number;
  aov: number;
  cashRevenue: number;
  qrisRevenue: number;
  topSellers: Array<{
    name: string;
    category: string;
    portionSold: number;
    revenue: number;
    marginPercent: number;
  }>;
}

interface AdminFinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: FinancialReportData;
}

export function downloadFinancialCsv(data: FinancialReportData) {
  const csvRows: string[] = [
    `"LAPORAN LABA RUGI & ANALITIK PENJUALAN EKSEKUTIF MACMOOD"`,
    `"Outlet:","${data.outletName} (${data.branchCode})"`,
    `"Periode:","${data.periodLabel}"`,
    `"Tanggal Ekspor:","${data.generatedDate}"`,
    `"Pemilik Bisnis:","${data.ownerName}"`,
    `""`,
    `"RINGKASAN LABA RUGI (FINANCIAL STATEMENT)","NOMINAL (IDR)","KETERANGAN"`,
    `"Penjualan Kotor (Gross Sales)",${data.grossSales},"Akumulasi harga katalog"`,
    `"Potongan Diskon & Promo",-${data.totalDiscount},"Voucher promo outlet"`,
    `"Penjualan Bersih (Net Sales)",${data.netSales},"Omzet riil diterima outlet"`,
    `"Harga Pokok Penjualan (HPP / COGS)",-${data.cogs},"Modal bahan baku terjual"`,
    `"Laba Kotor (Gross Profit)",${data.grossProfit},"Margin kotor ${data.grossMarginPercent}%"`,
    `"Biaya Kas Kecil (Petty Cash)",-${data.pettyCashExpenses},"Operasional harian & logistik"`,
    `"Laba Bersih Operasional",${data.operatingNetProfit},"Laba setelah HPP & kas kecil"`,
    `""`,
    `"METRIK OPERASIONAL & KANAL PEMBAYARAN","NILAI"`,
    `"Volume Transaksi Nota",${data.orderCount} nota`,
    `"Rata-Rata Belanja (AOV)",${data.aov} per nota`,
    `"Penerimaan Tunai (Cash)",${data.cashRevenue}`,
    `"Penerimaan QRIS Cashless",${data.qrisRevenue}`,
    `""`,
    `"KONTRIBUSI MENU TERLARIS (TOP SELLERS)","KATEGORI","TERJUAL (PORSI)","OMZET (IDR)","MARGIN KOTOR (%)"`,
    ...data.topSellers.map(
      (m) => `"${m.name}","${m.category}",${m.portionSold},${m.revenue},"${m.marginPercent}%"`
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Laporan-Keuangan-MacMood-${data.periodLabel.replace(/[^a-zA-Z0-9]/g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function AdminFinancialReportModal({
  isOpen,
  onClose,
  reportData,
}: AdminFinancialReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    downloadFinancialCsv(reportData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-brand-green-950/75 backdrop-blur-xs overflow-y-auto">
      {/* Modal Dialog Container */}
      <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-3xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden select-none">
        {/* Top Control Bar (Non-Printable) */}
        <div className="p-4 sm:px-6 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between gap-3 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-brand-green-900 text-brand-yellow-400 flex items-center justify-center">
              <FileText className="size-4" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-brand-green-950 leading-tight">
                Laporan Finansial & Laba Rugi
              </h3>
              <span className="text-[11px] text-neutral-500 block">
                Periode: {reportData.periodLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* CSV Button */}
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              title="Unduh Berkas CSV Excel"
            >
              <Download className="size-3.5" />
              <span>Unduh CSV</span>
            </button>

            {/* PDF / Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-brand-yellow-400 font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              title="Cetak atau Simpan PDF"
            >
              <Printer className="size-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Printable Formal Statement Document Area */}
        <div
          id="printable-financial-report"
          className="p-6 sm:p-10 overflow-y-auto space-y-6 text-neutral-900 font-sans print:p-0 print:space-y-4 print:text-black"
        >
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-brand-green-950 pb-5">
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/macmood-logo.png"
                alt="MacMood Logo"
                className="size-14 rounded-2xl object-cover border border-brand-green-900/10 shadow-2xs"
              />
              <div>
                <span className="font-display font-black text-xl tracking-wider text-brand-green-950 block">
                  MACMOOD RESTORAN
                </span>
                <span className="text-xs text-neutral-600 block">
                  {reportData.outletName} · Cabang {reportData.branchCode}
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Spesialis Mac & Cheese, Add-on Krispi & Minuman Dingin
                </span>
              </div>
            </div>

            <div className="text-right leading-tight">
              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider mb-1">
                Laporan Resmi Outlet
              </span>
              <span className="text-xs font-bold text-neutral-700 block">
                Periode: {reportData.periodLabel}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Dicetak: {reportData.generatedDate}
              </span>
            </div>
          </div>

          {/* Income Statement Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-green-950 border-b border-neutral-200 pb-1 flex items-center justify-between">
              <span>1. Ringkasan Laba Rugi Operasional</span>
              <span className="text-[10px] font-normal text-neutral-500 normal-case">
                Mata Uang: Rupiah (IDR)
              </span>
            </h4>

            <div className="rounded-2xl border border-neutral-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <tbody>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <td className="py-2.5 px-4 font-semibold text-neutral-700">
                      Penjualan Kotor (Gross Sales)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-neutral-900">
                      {formatRupiah(reportData.grossSales)}
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2.5 px-4 text-neutral-600 pl-8">
                      Potongan Diskon & Promo Voucher
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-red-600">
                      -{formatRupiah(reportData.totalDiscount)}
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-200 bg-brand-cream-50 font-bold">
                    <td className="py-2.5 px-4 text-brand-green-950">
                      Penjualan Bersih (Net Sales / Omzet)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-brand-green-950">
                      {formatRupiah(reportData.netSales)}
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2.5 px-4 text-neutral-600 pl-8">
                      Harga Pokok Penjualan (HPP / Biaya Bahan Baku)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-red-600">
                      -{formatRupiah(reportData.cogs)}
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-200 bg-emerald-50/60 font-bold">
                    <td className="py-2.5 px-4 text-emerald-950">
                      Laba Kotor (Gross Profit) — Margin {reportData.grossMarginPercent}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-800">
                      {formatRupiah(reportData.grossProfit)}
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-100">
                    <td className="py-2.5 px-4 text-neutral-600 pl-8">
                      Beban Kas Kecil Operasional (Petty Cash)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-red-600">
                      -{formatRupiah(reportData.pettyCashExpenses)}
                    </td>
                  </tr>
                  <tr className="bg-brand-green-900 text-white font-extrabold text-sm">
                    <td className="py-3 px-4 text-brand-yellow-300">
                      Laba Bersih Operasional (Net Operating Profit)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-brand-yellow-300">
                      {formatRupiah(reportData.operatingNetProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational & Payment Channel Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-1.5 text-xs">
              <span className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px]">
                Volume & Rata-rata Belanja
              </span>
              <div className="flex justify-between">
                <span className="text-neutral-500">Jumlah Transaksi:</span>
                <span className="font-bold font-mono text-neutral-900">
                  {reportData.orderCount} Nota
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Rata-Rata Nilai Nota (AOV):</span>
                <span className="font-bold font-mono text-neutral-900">
                  {formatRupiah(reportData.aov)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-1.5 text-xs">
              <span className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px]">
                Penerimaan Kanal Bayar
              </span>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tunai (Laci Kasir):</span>
                <span className="font-bold font-mono text-neutral-900">
                  {formatRupiah(reportData.cashRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">QRIS Merchant Cashless:</span>
                <span className="font-bold font-mono text-neutral-900">
                  {formatRupiah(reportData.qrisRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Sellers Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-green-950 border-b border-neutral-200 pb-1">
              2. Kontribusi Menu Terlaris (Top Selling Items)
            </h4>
            <div className="rounded-2xl border border-neutral-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Nama Menu</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3 text-center">Porsi Terjual</th>
                    <th className="py-2 px-3 text-right">Total Omzet</th>
                    <th className="py-2 px-3 text-right">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {reportData.topSellers.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/60">
                      <td className="py-2 px-3 font-semibold text-neutral-800">{item.name}</td>
                      <td className="py-2 px-3 text-neutral-500">{item.category}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-neutral-700">
                        {item.portionSold}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900">
                        {formatRupiah(item.revenue)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">
                        {item.marginPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature Sign-Off Block */}
          <div className="pt-6 border-t border-neutral-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <span className="text-neutral-500 block mb-12">Disiapkan oleh:</span>
              <span className="font-bold text-neutral-900 block border-b border-neutral-400 mx-auto w-40 pb-1">
                Budi Santoso
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Kasir Utama Outlet
              </span>
            </div>

            <div>
              <span className="text-neutral-500 block mb-12">Disetujui oleh:</span>
              <span className="font-bold text-neutral-900 block border-b border-neutral-400 mx-auto w-40 pb-1 flex items-center justify-center gap-1">
                <ShieldCheck className="size-3.5 text-emerald-600 inline" />
                {reportData.ownerName}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Business Owner MacMood
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
