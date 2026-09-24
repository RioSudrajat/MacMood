import { useState, useMemo } from "react";
import type { PromoVoucher, PromoDiscountType } from "./types";
import { formatRupiah } from "@/components/pos/format";
import {
  Tag,
  Percent,
  Search,
  Plus,
  Copy,
  Check,
  Sparkles,
  Ticket,
  X,
  FileSpreadsheet,
  Edit2,
  Trash2,
} from "lucide-react";

interface AdminPromosViewProps {
  promos: PromoVoucher[];
  onAddPromo: (promo: Omit<PromoVoucher, "id" | "usedCount">) => void;
  onUpdatePromo: (id: string, updates: Partial<PromoVoucher>) => void;
  onDeletePromo: (id: string) => void;
  onTogglePromoStatus: (id: string, currentStatus: boolean) => void;
}

export function AdminPromosView({
  promos,
  onAddPromo,
  onUpdatePromo,
  onDeletePromo,
  onTogglePromoStatus,
}: AdminPromosViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | PromoDiscountType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoVoucher | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<PromoDiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscount, setMaxDiscount] = useState<number>(15000);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(30000);
  const [quota, setQuota] = useState<number>(100);
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-10-31");
  const [description, setDescription] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filtered Promos
  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const matchSearch =
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === "ALL" || p.discountType === typeFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && p.isActive) ||
        (statusFilter === "INACTIVE" && !p.isActive);
      return matchSearch && matchType && matchStatus;
    });
  }, [promos, searchQuery, typeFilter, statusFilter]);

  // Executive KPI Metrics
  const activePromoCount = promos.filter((p) => p.isActive).length;
  const totalUsedCount = promos.reduce((sum, p) => sum + p.usedCount, 0);
  const totalAvailableQuota = promos.reduce((sum, p) => sum + Math.max(0, p.quota - p.usedCount), 0);
  const estimatedSavingsGiven = promos.reduce((sum, p) => {
    const avgEst = p.discountType === "PERCENTAGE" ? 6500 : p.discountValue;
    return sum + p.usedCount * avgEst;
  }, 0);

  const handleOpenAddModal = () => {
    setEditingPromo(null);
    setCode("");
    setName("");
    setDiscountType("PERCENTAGE");
    setDiscountValue(10);
    setMaxDiscount(15000);
    setMinOrderAmount(30000);
    setQuota(100);
    setStartDate("2026-09-01");
    setEndDate("2026-10-31");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PromoVoucher) => {
    setEditingPromo(p);
    setCode(p.code);
    setName(p.name);
    setDiscountType(p.discountType);
    setDiscountValue(p.discountValue);
    setMaxDiscount(p.maxDiscount || 0);
    setMinOrderAmount(p.minOrderAmount);
    setQuota(p.quota);
    setStartDate(p.startDate);
    setEndDate(p.endDate);
    setDescription(p.description);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const promoData = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      discountType,
      discountValue: Number(discountValue) || 0,
      maxDiscount: discountType === "PERCENTAGE" ? (Number(maxDiscount) || undefined) : undefined,
      minOrderAmount: Number(minOrderAmount) || 0,
      quota: Number(quota) || 1,
      startDate,
      endDate,
      isActive: editingPromo ? editingPromo.isActive : true,
      description: description.trim() || `Promo ${name}`,
    };

    if (editingPromo) {
      onUpdatePromo(editingPromo.id, promoData);
    } else {
      onAddPromo(promoData);
    }

    setIsModalOpen(false);
  };

  const handleCopyCode = (promoCode: string) => {
    navigator.clipboard?.writeText(promoCode);
    setCopiedCode(promoCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Kode Voucher",
      "Nama Promo",
      "Tipe Diskon",
      "Nilai Diskon",
      "Maks. Potongan",
      "Min. Belanja",
      "Kuota",
      "Terpakai",
      "Masa Berlaku",
      "Status",
    ];

    const rows = filteredPromos.map((p) => [
      p.code,
      `"${p.name}"`,
      p.discountType,
      p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : p.discountValue,
      p.maxDiscount || "-",
      p.minOrderAmount,
      p.quota,
      p.usedCount,
      `${p.startDate} s/d ${p.endDate}`,
      p.isActive ? "Aktif" : "Non-Aktif",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MacMood-Promosi-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-widest">
            <Sparkles className="size-4 text-emerald-600" />
            <span>Fase 2 · Marketing & Revenue Optimization</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-green-950 mt-1">
            Diskon, Voucher & Promo Dinamis
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl mt-0.5">
            Kelola kode voucher persentase (%) dan nominal (Rp) per pesanan, minimal transaksi, kuota pemakaian, dan batas masa berlaku kampanye.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-10 px-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="size-4 text-emerald-700" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <Plus className="size-4" />
            <span>+ Buat Promo Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Promo Aktif</span>
            <Tag className="size-4 text-emerald-600" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-brand-green-950">
            {activePromoCount}{" "}
            <span className="text-xs font-bold text-neutral-500 font-sans">kode</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Dapat langsung dipakai kasir di POS
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Terpakai</span>
            <Ticket className="size-4 text-amber-600" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-amber-900">
            {totalUsedCount}{" "}
            <span className="text-xs font-bold text-neutral-500 font-sans">kali redeem</span>
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Dari {promos.length} kampanye voucher
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sisa Kuota Voucher</span>
            <Percent className="size-4 text-blue-600" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-blue-900">
            {totalAvailableQuota}{" "}
            <span className="text-xs font-bold text-neutral-500 font-sans">tersedia</span>
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Batas kuota terkontrol aman
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-brand-green-950 text-white shadow-xs">
          <div className="flex items-center justify-between text-brand-yellow-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Potongan Diberikan</span>
            <Sparkles className="size-4" />
          </div>
          <div className="font-display font-black text-xl sm:text-2xl text-white">
            {formatRupiah(estimatedSavingsGiven)}
          </div>
          <span className="text-[11px] text-emerald-300 mt-1 block">
            Meningkatkan AOV & retensi pelanggan
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode promo, judul kampanye, atau deskripsi..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tipe Diskon Filter */}
          <div className="flex items-center rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === "ALL" ? "bg-white text-emerald-950 shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Semua Tipe
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("PERCENTAGE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === "PERCENTAGE" ? "bg-white text-emerald-950 shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Persen (%)
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("FIXED_AMOUNT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === "FIXED_AMOUNT" ? "bg-white text-emerald-950 shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Nominal (Rp)
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif Saja</option>
            <option value="INACTIVE">Non-Aktif / Expired</option>
          </select>
        </div>
      </div>

      {/* Promos Grid (Voucher Cards) */}
      {filteredPromos.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-neutral-300">
          <Ticket className="size-12 text-neutral-300 mx-auto mb-3" />
          <h4 className="font-display font-bold text-base text-neutral-800">Tidak ada kode promo ditemukan</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Coba ganti kata kunci pencarian atau buat kampanye voucher promo baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromos.map((promo) => {
            const usagePercent = Math.min(100, Math.round((promo.usedCount / promo.quota) * 100));
            const isFull = promo.usedCount >= promo.quota;

            return (
              <div
                key={promo.id}
                className={`relative rounded-3xl border bg-white overflow-hidden shadow-2xs transition-all hover:shadow-md flex flex-col justify-between ${
                  promo.isActive ? "border-emerald-600/25" : "border-neutral-200 opacity-75"
                }`}
              >
                {/* Coupon Top Header */}
                <div
                  className={`p-4 sm:p-5 border-b relative ${
                    promo.isActive
                      ? "bg-gradient-to-r from-emerald-950 via-brand-green-900 to-emerald-900 text-white"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow-400 block mb-1">
                        {promo.discountType === "PERCENTAGE" ? "VOUCHER DISKON PERSEN" : "POTONGAN NOMINAL TETAP"}
                      </span>
                      <h3 className="font-display font-extrabold text-base sm:text-lg text-white leading-tight">
                        {promo.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shrink-0 ${
                        promo.isActive
                          ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                          : "bg-neutral-700 text-neutral-400 border border-neutral-600"
                      }`}
                    >
                      {promo.isActive ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>

                  {/* Big Discount Value Display */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display font-black text-2xl sm:text-3xl text-brand-yellow-300">
                      {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : formatRupiah(promo.discountValue)}
                    </span>
                    {promo.discountType === "PERCENTAGE" && promo.maxDiscount && (
                      <span className="text-[11px] text-emerald-200">
                        (Maks. {formatRupiah(promo.maxDiscount)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Coupon Body with Tear Cutout details */}
                <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Promo Code Pill & Copy Button */}
                    <div className="p-2.5 rounded-2xl bg-brand-cream-100 border border-brand-green-900/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Tag className="size-4 text-emerald-700 shrink-0" />
                        <span className="font-mono font-black text-base tracking-widest text-brand-green-950">
                          {promo.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(promo.code)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-600/20 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Salin Kode Voucher"
                      >
                        {copiedCode === promo.code ? (
                          <>
                            <Check className="size-3 text-emerald-600" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {promo.description}
                    </p>

                    {/* Conditions */}
                    <div className="space-y-1.5 text-[11px] text-neutral-600 pt-1">
                      <div className="flex justify-between">
                        <span>Minimal Belanja:</span>
                        <strong className="text-neutral-900">{formatRupiah(promo.minOrderAmount)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Periode Berlaku:</span>
                        <strong className="text-neutral-900">{promo.startDate} s/d {promo.endDate}</strong>
                      </div>
                    </div>

                    {/* Quota Progress */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-neutral-600">Pemakaian Kuota</span>
                        <span className={isFull ? "text-rose-600" : "text-emerald-700"}>
                          {promo.usedCount} / {promo.quota} ({usagePercent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? "bg-rose-500" : "bg-emerald-600"
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions: Toggle, Edit, Delete */}
                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onTogglePromoStatus(promo.id, promo.isActive)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        promo.isActive
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          : "border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      <span className={`size-2 rounded-full ${promo.isActive ? "bg-emerald-600" : "bg-neutral-400"}`} />
                      <span>{promo.isActive ? "Aktif di POS" : "Dinonaktifkan"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(promo)}
                        className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Edit Promo"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus promo "${promo.code}"?`)) {
                            onDeletePromo(promo.id);
                          }
                        }}
                        className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Promo"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Tambah / Edit Promo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="p-5 bg-brand-green-950 text-white flex items-center justify-between">
              <div>
                <span className="text-brand-yellow-400 text-[10px] font-black uppercase tracking-widest block">
                  {editingPromo ? "Perbarui Kupon" : "Buat Kampanye Baru"}
                </span>
                <h3 className="font-display font-extrabold text-lg text-white">
                  {editingPromo ? "Edit Promo / Voucher" : "Tambah Voucher Promo Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Kode Promo <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="MISAL: HEMAT10K"
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 font-mono font-bold text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">Kode yang diinput kasir / pelanggan</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Nama Kampanye <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Diskon Pelajar 15%"
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Tipe Diskon Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Tipe Diskon <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDiscountType("PERCENTAGE")}
                    className={`h-11 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      discountType === "PERCENTAGE"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <Percent className="size-4 text-emerald-700" />
                    <span>Persentase (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountType("FIXED_AMOUNT")}
                    className={`h-11 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      discountType === "FIXED_AMOUNT"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <Tag className="size-4 text-emerald-700" />
                    <span>Nominal Tetap (Rp)</span>
                  </button>
                </div>
              </div>

              {/* Nilai Diskon & Max Potongan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {discountType === "PERCENTAGE" ? "Besaran Diskon (%)" : "Nominal Potongan (Rp)"}{" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === "PERCENTAGE" ? 100 : 500000}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {discountType === "PERCENTAGE" ? (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Maksimal Diskon (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(Number(e.target.value))}
                      placeholder="0 = Tanpa batas maksimal"
                      className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Minimal Belanja (Rp) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                )}
              </div>

              {discountType === "PERCENTAGE" && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Minimal Belanja (Rp) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Promo hanya bisa dipakai bila subtotal pesanan mencapai nilai ini
                  </span>
                </div>
              )}

              {/* Kuota & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Kuota Voucher <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quota}
                    onChange={(e) => setQuota(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mulai Berlaku
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Berakhir Pada
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Keterangan & Syarat Ketentuan
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Misal: Diskon berlaku untuk semua menu, tidak dapat digabung dengan promo lain..."
                  className="w-full p-3 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingPromo ? "Simpan Perubahan" : "Simpan & Aktifkan Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
