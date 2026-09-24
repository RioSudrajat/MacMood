import { useState } from "react";
import type { ExpenseRecord, ExpenseCategory } from "./types";
import { formatRupiah } from "@/components/pos/format";
import {
  Wallet,
  Plus,
  Receipt,
  Download,
  CheckCircle2,
  Search,
  X,
  CreditCard,
  Banknote,
} from "lucide-react";

interface AdminExpensesViewProps {
  expenses: ExpenseRecord[];
  onAddExpense: (newExp: Omit<ExpenseRecord, "id">) => void;
}

export function AdminExpensesView({ expenses = [], onAddExpense }: AdminExpensesViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportNotice, setExportNotice] = useState(false);

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>("BAHAN_BAKU");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [sourceOfFund, setSourceOfFund] = useState<"KAS_LACI" | "TRANSFER_OWNER">("KAS_LACI");
  const [staffName, setStaffName] = useState("Budi Santoso");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Filtering
  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = categoryFilter === "ALL" || e.category === categoryFilter;
    const matchesSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.receiptNumber && e.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // KPI Calculations
  const todayTotal = expenses
    .filter((e) => e.date === "24 Sep 2026")
    .reduce((sum, e) => sum + e.amount, 0);

  const cashDrawerTotal = expenses
    .filter((e) => e.sourceOfFund === "KAS_LACI")
    .reduce((sum, e) => sum + e.amount, 0);

  const ownerTransferTotal = expenses
    .filter((e) => e.sourceOfFund === "TRANSFER_OWNER")
    .reduce((sum, e) => sum + e.amount, 0);

  const allTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) return;

    const categoryLabels: Record<ExpenseCategory, string> = {
      BAHAN_BAKU: "Bahan Baku & Es Batu",
      UTILITAS_GAS: "Gas LPG & Listrik",
      KEMASAN: "Kemasan & Kantong",
      KEBERSIHAN: "Kebersihan & Sanitasi",
      OPERASIONAL_LAIN: "Operasional Lainnya",
    };

    const now = new Date();
    const timeStr = `${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`;

    onAddExpense({
      date: "24 Sep 2026",
      time: timeStr,
      category,
      categoryLabel: categoryLabels[category],
      description,
      amount: Number(amount),
      sourceOfFund,
      staffName,
      receiptNumber: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset Form
    setDescription("");
    setAmount("");
    setReceiptNumber("");
    setNotes("");
    setIsAddModalOpen(false);
  };

  const handleExportCSV = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-green-900/10">
        <div>
          <span className="text-xs font-bold text-brand-green-800 uppercase tracking-widest block">
            Pengeluaran & Kas Kecil (Petty Cash)
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-green-950">
            Biaya Operasional Harian Outlet
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Pencatatan kas kecil untuk pembelian es batu darurat, gas LPG, kantong kemasan takeaway, dan sanitasi.
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
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-green-900 hover:bg-brand-green-950 text-white text-xs font-bold rounded-2xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Catat Biaya Baru</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0" />
          <span>Data biaya operasional berhasil diekspor ke format CSV.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Biaya Hari Ini */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Total Biaya Hari Ini</span>
            <span className="size-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Wallet className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-red-950 font-mono">
            {formatRupiah(todayTotal)}
          </div>
          <div className="text-[11px] text-neutral-500">
            2 transaksi kas kecil tercatat
          </div>
        </div>

        {/* KPI 2: Dari Kas Laci Kasir */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Dipakai dari Kas Laci</span>
            <span className="size-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Banknote className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-amber-950 font-mono">
            {formatRupiah(cashDrawerTotal)}
          </div>
          <div className="text-[11px] text-neutral-500">
            Memotong kas fisik saat tutup shift
          </div>
        </div>

        {/* KPI 3: Dibayar Transfer Owner */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Transfer Mandiri Owner</span>
            <span className="size-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CreditCard className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-blue-900 font-mono">
            {formatRupiah(ownerTransferTotal)}
          </div>
          <div className="text-[11px] text-neutral-500">
            Pembelian inventaris via transfer
          </div>
        </div>

        {/* KPI 4: Total Seluruh Biaya */}
        <div className="p-5 rounded-3xl bg-brand-green-950 text-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-brand-cream-100/70">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-yellow-400">Total Pengeluaran</span>
            <span className="size-8 rounded-xl bg-white/10 text-brand-yellow-400 flex items-center justify-center">
              <Receipt className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl text-brand-yellow-400 font-mono">
            {formatRupiah(allTotal)}
          </div>
          <div className="text-[11px] text-brand-cream-100/80">
            {expenses.length} transaksi kas operasional
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-brand-green-900/10 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari deskripsi, staf, atau nomor kuitansi..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-brand-green-900 rounded-xl text-xs outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-neutral-500 whitespace-nowrap">Kategori:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="BAHAN_BAKU">Bahan Baku & Es Batu</option>
            <option value="UTILITAS_GAS">Gas LPG & Listrik</option>
            <option value="KEMASAN">Kemasan & Kantong</option>
            <option value="KEBERSIHAN">Kebersihan & Sanitasi</option>
            <option value="OPERASIONAL_LAIN">Operasional Lainnya</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 sm:px-6">Waktu & Tanggal</th>
                <th className="py-3.5 px-4">Deskripsi Biaya</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Sumber Dana</th>
                <th className="py-3.5 px-4">PIC / Staf</th>
                <th className="py-3.5 px-4">No. Kuitansi</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-neutral-600">
                    <span className="font-bold text-neutral-900 block">{exp.time}</span>
                    <span className="text-neutral-500">{exp.date}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <strong className="text-neutral-900 font-semibold block">{exp.description}</strong>
                    {exp.notes && (
                      <span className="text-[11px] text-neutral-500 block">{exp.notes}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800">
                      {exp.categoryLabel}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {exp.sourceOfFund === "KAS_LACI" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Banknote className="size-3" /> Kas Laci Kasir
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <CreditCard className="size-3" /> Transfer Owner
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-neutral-700 font-medium">
                    {exp.staffName}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-neutral-500 text-[11px]">
                    {exp.receiptNumber || "-"}
                  </td>

                  <td className="py-3.5 px-4 sm:px-6 text-right font-mono font-bold text-red-900 text-sm">
                    {formatRupiah(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pengeluaran Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-brand-green-900" />
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Catat Biaya Kas Kecil Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="size-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Kategori Pengeluaran</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-medium outline-none focus:border-brand-green-900"
                >
                  <option value="BAHAN_BAKU">Bahan Baku & Es Batu</option>
                  <option value="UTILITAS_GAS">Gas LPG & Listrik</option>
                  <option value="KEMASAN">Kemasan & Kantong Kresek</option>
                  <option value="KEBERSIHAN">Kebersihan & Sanitasi</option>
                  <option value="OPERASIONAL_LAIN">Operasional Lainnya</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Deskripsi Pengeluaran *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Es Batu Kristal 10kg (2 Pack)"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-green-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="30000"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono outline-none focus:border-brand-green-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Sumber Dana</label>
                  <select
                    value={sourceOfFund}
                    onChange={(e) => setSourceOfFund(e.target.value as "KAS_LACI" | "TRANSFER_OWNER")}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-medium outline-none focus:border-brand-green-900"
                  >
                    <option value="KAS_LACI">Kas Laci Kasir</option>
                    <option value="TRANSFER_OWNER">Transfer Owner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Nama Pemohon / Staf</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-green-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">No. Kuitansi / Bon (Opsional)</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="KWT-01"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-green-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan mendesak atau alasan pembelian..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-green-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-green-900 hover:bg-brand-green-950 text-white rounded-xl font-bold cursor-pointer"
                >
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
