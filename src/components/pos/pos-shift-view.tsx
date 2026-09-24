import { useState, useMemo } from "react";
import type { ShiftData, PastShift } from "./types";
import { formatRupiah } from "./format";
import {
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Calculator,
  Lock,
  Unlock,
} from "lucide-react";

interface PosShiftViewProps {
  shift: ShiftData;
  pastShifts: PastShift[];
  onOpenShift: (initialCash: number) => void;
  onCloseShift: (actualCash: number, notes: string) => void;
}

export function PosShiftView({
  shift,
  pastShifts,
  onOpenShift,
  onCloseShift,
}: PosShiftViewProps) {
  // Buka Shift Form State
  const [initialCashInput, setInitialCashInput] = useState("150000");

  // Tutup Shift Form State
  const [actualCashInput, setActualCashInput] = useState("");
  const [shiftNotesInput, setShiftNotesInput] = useState("");
  const [isDenominationOpen, setIsDenominationOpen] = useState(false);

  // Denominations Breakdown helper
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  const countedDenominationTotal = useMemo(() => {
    return Object.entries(denominations).reduce(
      (acc, [nominal, count]) => acc + Number(nominal) * count,
      0
    );
  }, [denominations]);

  const updateDenomination = (nominal: number, delta: number) => {
    setDenominations((prev) => {
      const current = prev[nominal] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev, [nominal]: next };
      const newTotal = Object.entries(updated).reduce(
        (acc, [n, c]) => acc + Number(n) * c,
        0
      );
      setActualCashInput(newTotal.toString());
      return updated;
    });
  };

  // Calculations
  const expectedCashInDrawer = shift.initialCash + shift.cashSales;
  const actualCash = Number(actualCashInput.replace(/\D/g, "")) || 0;
  const cashDifference = actualCash - expectedCashInDrawer;

  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(initialCashInput.replace(/\D/g, "")) || 0;
    onOpenShift(amount);
  };

  const handleFinishShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCashInput) return;
    onCloseShift(actualCash, shiftNotesInput);
    setActualCashInput("");
    setShiftNotesInput("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-brand-cream-50">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-brand-green-800 text-xs font-bold tracking-wider uppercase block">
              Manajemen Kasir & Outlet
            </span>
            <h2 className="font-display font-extrabold text-2xl text-brand-green-950">
              Rekapitulasi Shift & Kas Laci
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                shift.status === "OPEN"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-neutral-200 text-neutral-700"
              }`}
            >
              {shift.status === "OPEN" ? (
                <>
                  <Unlock className="size-3.5" />
                  <span>Shift Berjalan (Aktif)</span>
                </>
              ) : (
                <>
                  <Lock className="size-3.5" />
                  <span>Shift Ditutup</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* View 1: When Shift is CLOSED -> Show Form Buka Shift */}
        {shift.status === "CLOSED" && (
          <div className="p-6 rounded-3xl bg-white border border-brand-green-900/10 shadow-sm max-w-lg mx-auto space-y-5">
            <div className="text-center space-y-1">
              <div className="size-12 rounded-2xl bg-brand-cream-100 text-brand-green-900 mx-auto flex items-center justify-center mb-2">
                <Lock className="size-6" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-brand-green-950">
                Buka Shift Baru Kasir
              </h3>
              <p className="text-xs text-neutral-500">
                Wajib menginput uang kas modal awal (cash float) sebelum memulai transaksi.
              </p>
            </div>

            <form onSubmit={handleStartShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Kasir yang Bertugas:
                </label>
                <input
                  type="text"
                  disabled
                  value={shift.cashierName}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Kas Modal Awal / Float di Laci:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display font-extrabold text-neutral-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={initialCashInput}
                    onChange={(e) => setInitialCashInput(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-neutral-300 font-display font-black text-lg focus:outline-none focus:border-brand-green-800 text-neutral-900"
                  />
                </div>
              </div>

              {/* Quick float buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "100k", val: 100000 },
                  { label: "150k", val: 150000 },
                  { label: "200k", val: 200000 },
                ].map((btn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInitialCashInput(btn.val.toString())}
                    className="py-2 px-2 rounded-xl bg-brand-cream-50 hover:bg-brand-cream-100 border border-neutral-200 text-xs font-bold text-neutral-700 transition-colors"
                  >
                    Rp{btn.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-display font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="size-4" />
                <span>Buka Shift Sekarang</span>
              </button>
            </form>
          </div>
        )}

        {/* View 2: When Shift is OPEN -> Active Dashboard & Tutup Shift Form */}
        {shift.status === "OPEN" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Shift Real-time Status & Reconciliation Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-xs">
                  <span className="text-[11px] font-semibold text-neutral-500 block">
                    Modal Awal (Float)
                  </span>
                  <div className="font-display font-black text-lg text-neutral-800 mt-1">
                    {formatRupiah(shift.initialCash)}
                  </div>
                  <span className="text-[10px] text-neutral-400">Kas awal laci</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-xs">
                  <span className="text-[11px] font-semibold text-neutral-500 block">
                    Penjualan Tunai
                  </span>
                  <div className="font-display font-black text-lg text-emerald-800 mt-1">
                    {formatRupiah(shift.cashSales)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Uang masuk fisik</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-xs">
                  <span className="text-[11px] font-semibold text-neutral-500 block">
                    Penjualan QRIS
                  </span>
                  <div className="font-display font-black text-lg text-blue-800 mt-1">
                    {formatRupiah(shift.qrisSales)}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">Masuk rekening</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-xs">
                  <span className="text-[11px] font-semibold text-neutral-500 block">
                    Total Omzet Shift
                  </span>
                  <div className="font-display font-black text-lg text-brand-green-950 mt-1">
                    {formatRupiah(shift.cashSales + shift.qrisSales)}
                  </div>
                  <span className="text-[10px] text-neutral-400">{shift.orderCount} transaksi</span>
                </div>

                <div className="col-span-2 p-4 rounded-2xl bg-brand-cream-100 border border-brand-green-800/20 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-green-950">
                      Ekspektasi Uang Fisik di Laci:
                    </span>
                    <DollarSign className="size-4 text-brand-green-900" />
                  </div>
                  <div className="font-display font-black text-2xl text-brand-green-900 mt-1">
                    {formatRupiah(expectedCashInDrawer)}
                  </div>
                  <span className="text-[11px] text-brand-green-800/80">
                    Kalkulasi: Kas Awal ({formatRupiah(shift.initialCash)}) + Penjualan Tunai ({formatRupiah(shift.cashSales)})
                  </span>
                </div>
              </div>

              {/* Form Tutup Shift & Rekonsiliasi Kas */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-brand-green-900/10 shadow-sm space-y-5">
                <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-extrabold text-base text-brand-green-950">
                      Rekonsiliasi Kas & Tutup Shift
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Hitung fisik uang tunai di laci kasir secara teliti sebelum menutup shift.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDenominationOpen(!isDenominationOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Calculator className="size-3.5 text-brand-green-900" />
                    <span>{isDenominationOpen ? "Tutup Hitung Lembar" : "Hitung per Lembar"}</span>
                  </button>
                </div>

                {/* Optional Denominations Calculator Accordion */}
                {isDenominationOpen && (
                  <div className="p-4 rounded-2xl bg-brand-cream-50 border border-neutral-200 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-brand-green-950">
                      <span>Kalkulator Pecahan Uang Kertas & Koin:</span>
                      <span className="text-brand-green-900 font-mono">
                        Hasil: {formatRupiah(countedDenominationTotal)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map((nom) => (
                        <div key={nom} className="p-2 rounded-xl bg-white border border-neutral-200 flex items-center justify-between">
                          <span className="font-bold text-neutral-700 text-[11px]">{nom / 1000}k</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateDenomination(nom, -1)}
                              className="size-5 rounded bg-neutral-100 hover:bg-neutral-200 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-[11px]">
                              {denominations[nom]}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateDenomination(nom, 1)}
                              className="size-5 rounded bg-neutral-100 hover:bg-neutral-200 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleFinishShift} className="space-y-4">
                  {/* Input Kas Fisik Aktual */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Jumlah Uang Kas Fisik Hasil Hitungan di Laci:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display font-extrabold text-neutral-400 text-sm">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={actualCashInput}
                        onChange={(e) => setActualCashInput(e.target.value)}
                        placeholder="Contoh: 293000"
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-neutral-300 font-display font-black text-lg focus:outline-none focus:border-brand-green-800 text-neutral-900"
                      />
                    </div>
                  </div>

                  {/* Real-time Variance (Selisih) Alert Box */}
                  {actualCashInput && (
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        cashDifference === 0
                          ? "bg-emerald-50 border-emerald-200"
                          : cashDifference > 0
                          ? "bg-blue-50 border-blue-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {cashDifference === 0 ? (
                          <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle
                            className={`size-5 shrink-0 mt-0.5 ${
                              cashDifference > 0 ? "text-blue-600" : "text-brand-coral-600"
                            }`}
                          />
                        )}

                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-800">
                              {cashDifference === 0
                                ? "Kas Fisik Akurat (Sesuai)"
                                : cashDifference > 0
                                ? "Kas Fisik Berlebih"
                                : "Kas Fisik Kurang (Selisih)"}
                            </span>
                            <strong
                              className={`font-mono font-black text-sm ${
                                cashDifference === 0
                                  ? "text-emerald-700"
                                  : cashDifference > 0
                                  ? "text-blue-700"
                                  : "text-brand-coral-600"
                              }`}
                            >
                              {cashDifference === 0
                                ? "Selisih Rp0"
                                : cashDifference > 0
                                ? `+${formatRupiah(cashDifference)}`
                                : formatRupiah(cashDifference)}
                            </strong>
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-1">
                            {cashDifference === 0
                              ? "Jumlah uang tunai fisik di laci sama persis dengan akumulasi penjualan sistem."
                              : cashDifference > 0
                              ? "Terdapat kelebihan uang fisik di laci. Pastikan uang tips atau kembalian dicatat dengan jelas."
                              : "Uang fisik kurang dari ekspektasi sistem. Wajib menuliskan keterangan/alasan di bawah."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Catatan Shift Kasir */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Catatan Shift & Rekonsiliasi (Opsional / Wajib jika ada selisih):
                    </label>
                    <textarea
                      rows={2}
                      value={shiftNotesInput}
                      onChange={(e) => setShiftNotesInput(e.target.value)}
                      placeholder="Tuliskan catatan kondisi operasional, selisih receh, atau kendala laci..."
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-brand-green-800 text-neutral-900"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!actualCashInput}
                      className="px-5 py-3 rounded-xl bg-brand-coral-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-display font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="size-4" />
                      <span>Tutup Shift & Cetak Rekapitulasi</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right 1 Col: Active Shift Summary & Quick Info */}
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-brand-green-950 font-display font-extrabold text-sm pb-2 border-b border-neutral-100">
                  <Clock className="size-4 text-brand-green-900" />
                  <span>Informasi Shift Berjalan</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">ID Shift:</span>
                    <span className="font-mono font-bold text-neutral-800">{shift.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Kasir:</span>
                    <span className="font-bold text-neutral-900">{shift.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Waktu Mulai:</span>
                    <span className="font-bold text-neutral-800">{shift.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Outlet:</span>
                    <span className="font-bold text-neutral-800">01 Pusat (Jakarta)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-brand-cream-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
                  <span className="font-bold text-brand-green-950 block">SOP Tutup Shift Kasir:</span>
                  <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                    <li>Pastikan tidak ada pesanan gantung/belum bayar.</li>
                    <li>Hitung fisik uang tunai di laci kasir.</li>
                    <li>Input hasil hitungan fisik pada form rekonsiliasi.</li>
                    <li>Cetak rangkuman kas untuk arsip outlet.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Audit Trail Riwayat Shift Sebelumnya */}
        <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-brand-green-900" />
              <h3 className="font-display font-extrabold text-base text-brand-green-950">
                Riwayat Shift Kasir Sebelumnya
              </h3>
            </div>
            <span className="text-xs text-neutral-500">
              Audit rekonsiliasi kas tercatat di sistem
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-cream-50/70 border-b border-neutral-200/80 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Tanggal & Shift</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4 text-right">Kas Awal</th>
                  <th className="py-3 px-4 text-right">Penjualan Tunai</th>
                  <th className="py-3 px-4 text-right">Penjualan QRIS</th>
                  <th className="py-3 px-4 text-right">Kas Aktual</th>
                  <th className="py-3 px-4 text-center">Selisih Kas</th>
                  <th className="py-3 px-4">Catatan Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pastShifts.map((ps) => (
                  <tr key={ps.id} className="hover:bg-brand-cream-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      {ps.date}
                      <span className="block text-[10px] text-neutral-500 font-normal">
                        {ps.shiftName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-800">{ps.cashierName}</td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {ps.startTime} - {ps.endTime}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-600">
                      {formatRupiah(ps.initialCash)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                      {formatRupiah(ps.cashSales)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">
                      {formatRupiah(ps.qrisSales)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-brand-green-950 font-bold">
                      {formatRupiah(ps.actualCash)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ps.cashDifference === 0
                            ? "bg-emerald-100 text-emerald-800"
                            : ps.cashDifference > 0
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ps.cashDifference === 0
                          ? "✓ Rp0"
                          : ps.cashDifference > 0
                          ? `+${formatRupiah(ps.cashDifference)}`
                          : formatRupiah(ps.cashDifference)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                      {ps.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
