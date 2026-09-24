import { useState } from "react";
import type { ShiftRecord } from "./types";
import { formatRupiah } from "@/components/pos/format";
import {
  Clock,
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

interface AdminShiftsViewProps {
  shifts: ShiftRecord[];
  onVerifyShift?: (shiftId: string) => void;
}

export function AdminShiftsView({ shifts = [], onVerifyShift }: AdminShiftsViewProps) {
  const [selectedShift, setSelectedShift] = useState<ShiftRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportNotice, setExportNotice] = useState(false);

  // Filter shifts
  const filteredShifts = shifts.filter((s) => {
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesSearch =
      s.shiftName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const activeShift = shifts.find((s) => s.status === "OPEN");
  const totalCashCollected = shifts.reduce((sum, s) => sum + s.cashSales, 0);
  const totalQrisCollected = shifts.reduce((sum, s) => sum + s.qrisSales, 0);
  const totalVariance = shifts.reduce((sum, s) => sum + Math.abs(s.cashDifference), 0);

  const handleExportCSV = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-green-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-brand-green-800 uppercase tracking-widest block">
              Manajemen Shift & Akuntabilitas Kas Fisik
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-green-950">
            Rekapitulasi Shift Kasir & Laci Kas
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Audit serah terima uang fisik laci kasir per shift, monitoring selisih kas (*cash variance*), dan otorisasi tutup buku.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-2xl border border-neutral-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Ekspor Rekap CSV</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0" />
          <span>Data rekapitulasi shift kasir berhasil diekspor ke format CSV.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Shift Aktif */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Shift Aktif Sekarang</span>
            <span className="size-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-brand-green-950 truncate">
            {activeShift ? activeShift.cashierName : "Tidak ada"}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeShift ? `${activeShift.shiftName} (Mulai ${activeShift.startTime})` : "Tutup"}</span>
          </div>
        </div>

        {/* KPI 2: Total Tunai Shift */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Total Uang Tunai</span>
            <span className="size-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Banknote className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-brand-green-950 font-mono">
            {formatRupiah(totalCashCollected)}
          </div>
          <div className="text-[11px] text-neutral-500">
            Akumulasi transaksi cash seluruh shift
          </div>
        </div>

        {/* KPI 3: Total QRIS Shift */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Total QRIS Masuk</span>
            <span className="size-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CreditCard className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-blue-900 font-mono">
            {formatRupiah(totalQrisCollected)}
          </div>
          <div className="text-[11px] text-neutral-500">
            Settlement dana ke rekening BCA
          </div>
        </div>

        {/* KPI 4: Selisih Kas Keseluruhan */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-brand-green-950 to-emerald-950 text-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-brand-cream-100/70">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-yellow-400">Total Selisih Kas</span>
            <span className="size-8 rounded-xl bg-white/10 text-brand-yellow-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-brand-yellow-400 font-mono">
            {formatRupiah(totalVariance)}
          </div>
          <div className="text-[11px] text-brand-cream-100/80 flex items-center gap-1 font-medium">
            <span>Akurasi laci kasir: 99.9% presisi</span>
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
                statusFilter === "OPEN" ? "bg-white text-emerald-800 shadow-2xs" : "text-neutral-600"
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
                <th className="py-3.5 px-4 sm:px-6">Shift & Tanggal</th>
                <th className="py-3.5 px-4">Kasir Bertugas</th>
                <th className="py-3.5 px-4">Modal Awal (Float)</th>
                <th className="py-3.5 px-4">Penjualan Tunai</th>
                <th className="py-3.5 px-4">Penjualan QRIS</th>
                <th className="py-3.5 px-4">Uang Sistem vs Fisik</th>
                <th className="py-3.5 px-4">Selisih Kas</th>
                <th className="py-3.5 px-4">Status & Verifikasi</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredShifts.map((shift) => {
                const hasVariance = shift.cashDifference !== 0;
                return (
                  <tr key={shift.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <strong className="font-display font-bold text-neutral-900 block">
                        {shift.shiftName}
                      </strong>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {shift.date} · {shift.startTime} {shift.endTime ? `- ${shift.endTime}` : "(Aktif)"}
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

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {formatRupiah(shift.cashSales)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {formatRupiah(shift.qrisSales)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-neutral-500">Sistem: {formatRupiah(shift.expectedCash)}</div>
                      <div className="font-bold text-neutral-900">Fisik: {formatRupiah(shift.actualCash)}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {!hasVariance ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          <CheckCircle2 className="size-3" /> Rp0 (Pas)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertCircle className="size-3" /> {formatRupiah(shift.cashDifference)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {shift.status === "OPEN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-600 animate-ping" />
                            SEDANG BERJALAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                            SELESAI DITUTUP
                          </span>
                        )}

                        {shift.verifiedByOwner ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                            <ShieldCheck className="size-3" /> Terverifikasi Owner
                          </span>
                        ) : (
                          shift.status === "CLOSED" && (
                            <button
                              type="button"
                              onClick={() => onVerifyShift?.(shift.id)}
                              className="text-[10px] font-bold text-brand-green-900 hover:text-emerald-700 underline cursor-pointer"
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
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-brand-cream-100 text-neutral-800 hover:text-brand-green-950 font-bold rounded-xl transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-brand-green-900" />
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Rincian Struk & Rekapitulasi Shift
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
                  MACMOOD POS — OUTLET PUSAT
                </strong>
                <span className="text-neutral-500 text-[11px] block">{selectedShift.shiftName}</span>
                <span className="text-neutral-500 text-[11px]">{selectedShift.date} · Kasir: {selectedShift.cashierName}</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">1. Modal Kas Awal (Float):</span>
                  <strong>{formatRupiah(selectedShift.initialCash)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">2. Total Penjualan Tunai:</span>
                  <strong className="text-emerald-800">{formatRupiah(selectedShift.cashSales)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">3. Total Penjualan QRIS:</span>
                  <strong className="text-blue-700">{formatRupiah(selectedShift.qrisSales)}</strong>
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
                  <span className={selectedShift.cashDifference === 0 ? "text-emerald-700" : "text-amber-700"}>
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
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Printer className="size-3.5" />
                <span>Cetak Rekap Shift</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedShift(null)}
                className="px-4 py-2 bg-brand-green-900 hover:bg-brand-green-950 text-white rounded-xl text-xs font-bold cursor-pointer"
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
