import { useState, useMemo } from "react";
import type { ShiftRecord } from "./types";
import { formatRupiah } from "@/components/pos/format";
import {
  CheckCircle2,
  AlertCircle,
  Download,
  Receipt,
  ShieldCheck,
  Printer,
  X,
  CreditCard,
  Banknote,
  Search,
} from "lucide-react";
import { downloadCsv, printReportPdf, type ReportPrintKpi, type ReportPrintSection } from "@/lib/export-utils";

interface AdminShiftsViewProps {
  shifts: ShiftRecord[];
  onVerifyShift?: (shiftId: string) => void;
}

export function AdminShiftsView({ shifts = [], onVerifyShift }: AdminShiftsViewProps) {
  const [selectedShift, setSelectedShift] = useState<ShiftRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Guaranteed Deduplication & Branch Info Normalization
  const uniqueShifts = useMemo(() => {
    const map = new Map<string, ShiftRecord>();
    (shifts || []).forEach((s) => {
      const norm: ShiftRecord = { ...s };
      if (!norm.branchName || norm.branchName.startsWith("Shift ")) {
        const nameLower = (norm.cashierName || "").toLowerCase();
        if (nameLower.includes("margonda") || nameLower.includes("rian") || nameLower.includes("outlet 2")) {
          norm.branchId = "branch-2";
          norm.branchName = "MacMood Express - Margonda";
          norm.branchCode = "MAC-DPK-01";
        } else if (nameLower.includes("tebet") || nameLower.includes("siti") || nameLower.includes("outlet 3")) {
          norm.branchId = "branch-3";
          norm.branchName = "MacMood Kitchen - Tebet";
          norm.branchCode = "MAC-JKT-02";
        } else {
          norm.branchId = "branch-1";
          norm.branchName = "MacMood Pusat - Fatmawati";
          norm.branchCode = "MAC-JKT-01";
        }
      }
      map.set(norm.id, norm);
    });
    return Array.from(map.values());
  }, [shifts]);

  // Filter shifts
  const filteredShifts = uniqueShifts.filter((s) => {
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesSearch =
      s.shiftName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.branchName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const totalCashCollected = filteredShifts.reduce((sum, s) => sum + s.cashSales, 0);
  const totalQrisCollected = filteredShifts.reduce((sum, s) => sum + s.qrisSales, 0);
  const totalVariance = filteredShifts.reduce((sum, s) => sum + Math.abs(s.cashDifference), 0);

  const handleExportCSV = () => {
    const filename = `MacMood_Rekap_Shift_${new Date().toISOString().slice(0, 10)}`;
    const headers = [
      "ID Shift",
      "Nama Shift",
      "Tanggal",
      "Kasir",
      "Jam Mulai",
      "Jam Selesai",
      "Modal Awal",
      "Penjualan Tunai",
      "Penjualan QRIS",
      "Total Nota",
      "Uang Sistem",
      "Uang Fisik",
      "Selisih Kas",
      "Status",
      "Verifikasi Owner",
    ];

    const rows = filteredShifts.map((s) => [
      s.id,
      s.shiftName,
      s.date,
      s.cashierName,
      s.startTime,
      s.endTime || "Aktif",
      s.initialCash,
      s.cashSales,
      s.qrisSales,
      s.totalOrders,
      s.expectedCash,
      s.actualCash,
      s.cashDifference,
      s.status,
      s.verifiedByOwner ? "Terverifikasi" : "Belum",
    ]);

    downloadCsv(filename, headers, rows);
    setExportNotice("Data rekapitulasi shift kasir berhasil diekspor ke CSV.");
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handlePrintPDF = () => {
    const kpis: ReportPrintKpi[] = [
      { label: "Total Penjualan Tunai", value: formatRupiah(totalCashCollected), sub: "Kas masuk laci" },
      { label: "Total Penjualan QRIS", value: formatRupiah(totalQrisCollected), sub: "Settlement rekening" },
      { label: "Total Selisih Kas", value: formatRupiah(totalVariance), sub: "Toleransi 100% terkontrol" },
      { label: "Total Shift Ditutup", value: `${shifts.filter((s) => s.status === "CLOSED").length} Shift`, sub: "Rekonsiliasi selesai" },
    ];

    const sections: ReportPrintSection[] = [
      {
        title: "Tabel Audit Rekapitulasi Shift Kasir & Laci Kas Fisik",
        headers: ["Shift & Tanggal", "Kasir", "Kas Awal", "Penjualan Tunai", "QRIS", "Fisik Laci", "Selisih", "Status"],
        rows: filteredShifts.map((s) => [
          `${s.shiftName} (${s.date})`,
          s.cashierName,
          formatRupiah(s.initialCash),
          formatRupiah(s.cashSales),
          formatRupiah(s.qrisSales),
          formatRupiah(s.actualCash),
          s.cashDifference === 0 ? "Rp 0 (Pas)" : formatRupiah(s.cashDifference),
          s.verifiedByOwner ? "Terverifikasi Owner" : s.status === "OPEN" ? "Berjalan" : "Tutup",
        ]),
      },
    ];

    printReportPdf({
      title: "Laporan Rekapitulasi Shift Kasir & Rekonsiliasi Kas Laci",
      subtitle: "Audit Akuntabilitas Kas Fisik Shift MacMood POS",
      periodLabel: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      outletName: "Seluruh Cabang Operasional",
      printedBy: "Muhammad Afrizal (Business Owner)",
      kpis,
      sections,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-green-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand-green-900 animate-pulse" />
            <span className="text-xs font-bold text-brand-green-800 uppercase tracking-widest block">
              Operasional & Rekonsiliasi Kas Cabang
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-green-950">
            Rekapitulasi Kas & Operasional Cabang
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Audit serah terima uang fisik laci kasir harian per cabang outlet, monitoring selisih kas fisik, dan otorisasi tutup buku.
          </p>
        </div>

        {/* Action Buttons: Dual Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-brand-cream-100 text-brand-green-950 text-xs font-bold rounded-2xl border border-neutral-200 shadow-2xs transition-colors cursor-pointer"
            title="Download CSV"
          >
            <Download className="size-3.5 text-brand-green-900" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 text-xs font-bold rounded-2xl shadow-xs transition-colors cursor-pointer"
            title="Cetak PDF Resmi"
          >
            <Printer className="size-3.5" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-brand-cream-100 border border-brand-green-900/20 text-brand-green-950 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-brand-green-800 flex-shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Kas Terkumpul (Tunai + QRIS) */}
        <div className="p-5 rounded-3xl bg-brand-green-950 text-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-brand-cream-100/70">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-yellow-400">Total Kas Terkumpul</span>
            <span className="size-8 rounded-xl bg-white/10 text-brand-yellow-400 flex items-center justify-center">
              <Banknote className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-2xl text-brand-yellow-400 font-mono tracking-tight">
            {formatRupiah(totalCashCollected + totalQrisCollected)}
          </div>
          <div className="text-[11px] text-brand-cream-100/80">
            Total penerimaan tunai fisik + QRIS
          </div>
        </div>

        {/* KPI 2: Total Kas Fisik Laci */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Kas Fisik Laci (Tunai)</span>
            <span className="size-8 rounded-xl bg-brand-cream-100 text-brand-green-900 flex items-center justify-center">
              <Banknote className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-brand-green-950 font-mono">
            {formatRupiah(totalCashCollected)}
          </div>
          <div className="text-[11px] text-neutral-500">
            Uang fisik di laci kasir cabang
          </div>
        </div>

        {/* KPI 3: Total QRIS Masuk */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Settlement QRIS (Bank)</span>
            <span className="size-8 rounded-xl bg-brand-yellow-400/20 text-amber-800 flex items-center justify-center">
              <CreditCard className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-amber-950 font-mono">
            {formatRupiah(totalQrisCollected)}
          </div>
          <div className="text-[11px] text-neutral-500">
            Settlement rekening operasional
          </div>
        </div>

        {/* KPI 4: Selisih Kas Keseluruhan */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Total Selisih Kas</span>
            <span className="size-8 rounded-xl bg-brand-cream-100 text-brand-green-900 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-brand-green-950 font-mono">
            {formatRupiah(totalVariance)}
          </div>
          <div className="text-[11px] text-brand-green-800 flex items-center gap-1 font-semibold">
            <span className="size-2 rounded-full bg-brand-green-900 animate-pulse" />
            <span>Akurasi laci kasir: 100% presisi</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-brand-green-900/10 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kasir, shift, atau ID..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-brand-green-900 rounded-xl text-xs outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500">Status:</span>
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "ALL" ? "bg-white text-brand-green-950 shadow-2xs" : "text-neutral-600"
              }`}
            >
              Semua ({shifts.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("OPEN")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "OPEN" ? "bg-white text-brand-green-950 shadow-2xs" : "text-neutral-600"
              }`}
            >
              Berjalan
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CLOSED")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "CLOSED" ? "bg-white text-neutral-900 shadow-2xs" : "text-neutral-600"
              }`}
            >
              Selesai Ditutup
            </button>
          </div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 sm:px-6">Cabang & Tanggal</th>
                <th className="py-3.5 px-4">Kasir / PIC</th>
                <th className="py-3.5 px-4">Modal Awal (Float)</th>
                <th className="py-3.5 px-4">Penjualan Tunai</th>
                <th className="py-3.5 px-4">Penjualan QRIS</th>
                <th className="py-3.5 px-4">Total Kas Masuk</th>
                <th className="py-3.5 px-4">Fisik Laci & Selisih</th>
                <th className="py-3.5 px-4">Status Rekapitulasi</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredShifts.map((shift) => {
                const hasVariance = shift.cashDifference !== 0;
                return (
                  <tr key={shift.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="font-display font-bold text-neutral-900 block text-xs">
                          {shift.branchName || "MacMood Pusat - Fatmawati"}
                        </strong>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green-800 bg-brand-cream-100 px-1.5 py-0.5 rounded border border-brand-green-900/15">
                          {shift.branchCode || "MAC-JKT-01"}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {shift.date} · {shift.startTime} {shift.endTime ? `- ${shift.endTime}` : "(Aktif Melayani)"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-brand-cream-200 text-brand-green-950 font-bold text-[10px] flex items-center justify-center">
                          {shift.cashierName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-neutral-900 font-semibold block">{shift.cashierName}</strong>
                          <span className="text-[10px] text-neutral-500">{shift.totalOrders} nota diproses</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-neutral-600">
                      {formatRupiah(shift.initialCash)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-brand-green-900">
                      {formatRupiah(shift.cashSales)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                      {formatRupiah(shift.qrisSales)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-brand-green-950">
                      {formatRupiah(shift.cashSales + shift.qrisSales)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>Fisik: <strong className="text-neutral-900">{formatRupiah(shift.actualCash)}</strong></div>
                      {!hasVariance ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-green-900 bg-brand-cream-100 px-1.5 py-0.5 rounded-full mt-0.5">
                          <CheckCircle2 className="size-2.5" /> Pas (Rp0)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-brand-yellow-400/20 px-1.5 py-0.5 rounded-full mt-0.5">
                          <AlertCircle className="size-2.5" /> {formatRupiah(shift.cashDifference)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {shift.status === "OPEN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-cream-100 text-brand-green-950 border border-brand-green-900/20">
                            <span className="size-1.5 rounded-full bg-brand-green-900 animate-ping" />
                            SEDANG BERJALAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                            SELESAI DITUTUP
                          </span>
                        )}

                        {shift.verifiedByOwner ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-brand-green-900 font-semibold">
                            <ShieldCheck className="size-3" /> Terverifikasi Owner
                          </span>
                        ) : (
                          shift.status === "CLOSED" && (
                            <button
                              type="button"
                              onClick={() => onVerifyShift?.(shift.id)}
                              className="text-[10px] font-bold text-brand-green-900 hover:text-brand-green-950 underline cursor-pointer"
                            >
                              Verifikasi & ACC
                            </button>
                          )
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedShift(shift)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-brand-cream-100 text-neutral-800 hover:text-brand-green-950 font-bold rounded-2xl transition-colors cursor-pointer"
                      >
                        Rincian
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Rincian Rekapitulasi Shift Kasir */}
      {selectedShift && (
        <div className="fixed inset-0 z-50 bg-brand-green-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-brand-green-900" />
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Rincian Rekapitulasi Kas Cabang
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShift(null)}
                className="size-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-brand-cream-50 p-4 rounded-2xl border border-brand-green-900/10 space-y-3 font-mono text-xs">
              <div className="text-center pb-2 border-b border-dashed border-neutral-300">
                <strong className="font-display font-black text-sm text-brand-green-950 block">
                  MACMOOD POS — REKAPITULASI KAS CABANG
                </strong>
                <span className="text-neutral-500 text-[11px] block">{selectedShift.branchName || selectedShift.shiftName} ({selectedShift.branchCode || "MAC-01"})</span>
                <span className="text-neutral-500 text-[11px]">{selectedShift.date} · Kasir: {selectedShift.cashierName}</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">1. Modal Kas Awal (Float):</span>
                  <strong>{formatRupiah(selectedShift.initialCash)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">2. Total Penjualan Tunai:</span>
                  <strong className="text-brand-green-900">{formatRupiah(selectedShift.cashSales)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">3. Total Penjualan QRIS:</span>
                  <strong className="text-amber-800">{formatRupiah(selectedShift.qrisSales)}</strong>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Jumlah Nota Diproses:</span>
                  <span>{selectedShift.totalOrders} transaksi</span>
                </div>
                <div className="border-t border-dashed border-neutral-300 pt-2 flex justify-between font-bold">
                  <span>Total Kas Diharapkan (1 + 2):</span>
                  <span>{formatRupiah(selectedShift.expectedCash)}</span>
                </div>
                <div className="flex justify-between font-bold text-brand-green-950">
                  <span>Uang Fisik Dihitung Kasir:</span>
                  <span>{formatRupiah(selectedShift.actualCash)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-neutral-200">
                  <span>Selisih Fisik Laci:</span>
                  <span className={selectedShift.cashDifference === 0 ? "text-brand-green-900" : "text-brand-coral-600"}>
                    {selectedShift.cashDifference === 0 ? "Rp0 (Seimbang)" : formatRupiah(selectedShift.cashDifference)}
                  </span>
                </div>
              </div>

              {selectedShift.notes && (
                <div className="p-2.5 bg-white rounded-xl border border-neutral-200 text-[11px] font-sans text-neutral-700">
                  <strong className="text-neutral-900 block mb-0.5">Catatan Kasir:</strong>
                  {selectedShift.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedShift(null)}
                className="px-5 py-2.5 bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 rounded-2xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
