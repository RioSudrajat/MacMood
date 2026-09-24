import { useState } from "react";
import type { AdminProduct, StockLog, StockMutationReason } from "./types";
import {
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  X,
} from "lucide-react";

interface AdminInventoryViewProps {
  products: AdminProduct[];
  stockLogs: StockLog[];
  onMutateStock: (
    productId: string,
    delta: number,
    reason: StockMutationReason,
    notes: string,
    staffName: string
  ) => void;
}

export function AdminInventoryView({
  products,
  stockLogs,
  onMutateStock,
}: AdminInventoryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"stock" | "logs">("stock");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState<"all" | StockMutationReason>("all");

  // Modal State for New Stock Mutation
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedProductForMutation, setSelectedProductForMutation] = useState<string>(
    products[0]?.id || ""
  );
  const [mutationReason, setMutationReason] = useState<StockMutationReason>("RESTOCK");
  const [mutationQuantity, setMutationQuantity] = useState<number>(10);
  const [mutationNotes, setMutationNotes] = useState("");
  const [staffName, setStaffName] = useState("Ahmad Fauzi (Owner)");

  // Filter trackable products
  const trackableProducts = products.filter((p) => p.trackStock);
  const lowStockProducts = trackableProducts.filter((p) => p.currentStock <= p.lowStockThreshold);

  const selectedProduct = products.find((p) => p.id === selectedProductForMutation);
  const currentStock = selectedProduct?.currentStock || 0;

  // Effective delta based on reason
  const effectiveDelta =
    mutationReason === "SPOILAGE" ? -Math.abs(mutationQuantity) : Math.abs(mutationQuantity);
  const projectedFinalStock = Math.max(0, currentStock + effectiveDelta);

  const openMutationModal = (productId?: string) => {
    if (productId) {
      setSelectedProductForMutation(productId);
    } else if (products.length > 0 && !selectedProductForMutation) {
      setSelectedProductForMutation(products[0].id);
    }
    setMutationQuantity(10);
    setMutationNotes("");
    setIsMutationModalOpen(true);
  };

  const handleSubmitMutation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForMutation || mutationQuantity <= 0) return;

    onMutateStock(
      selectedProductForMutation,
      effectiveDelta,
      mutationReason,
      mutationNotes.trim() || (mutationReason === "RESTOCK" ? "Restock rutin bahan porsi" : "Pencatatan mutasi"),
      staffName
    );

    setIsMutationModalOpen(false);
  };

  // Filtered Stock Items
  const filteredStockProducts = trackableProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Logs
  const filteredLogs = stockLogs.filter((log) => {
    const matchProd = selectedProductFilter === "all" || log.productId === selectedProductFilter;
    const matchReason = reasonFilter === "all" || log.reason === reasonFilter;
    const matchSearch =
      log.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.staffName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchProd && matchReason && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-green-800 uppercase tracking-widest mb-1">
            <Package className="size-4" />
            <span>Kontrol Bahan & Mutasi</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-brand-green-950">
            Manajemen Stok & Opname
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Pantau sisa kuota porsi, amankan dari kehilangan bahan, dan catat setiap restock atau spoilage.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openMutationModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-extrabold text-xs shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="size-4 text-brand-yellow-400" />
          <span>Catat Mutasi Stok</span>
        </button>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700 flex-shrink-0">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <strong className="text-sm font-display font-extrabold block">
                Peringatan: {lowStockProducts.length} Menu Mendekati Batas Kritis!
              </strong>
              <span className="text-xs text-amber-800">
                Item: {lowStockProducts.map((p) => `${p.name} (${p.currentStock} porsi)`).join(", ")}.
                Segera lakukan restock atau persiapan dapur.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openMutationModal(lowStockProducts[0].id)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
          >
            Restock Sekarang
          </button>
        </div>
      )}

      {/* Sub-Tabs: Stock Monitor vs Audit Trail Logs */}
      <div className="flex items-center justify-between border-b border-brand-green-900/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("stock")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "stock"
                ? "bg-brand-green-900 text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            Sisa Stok Porsi ({trackableProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("logs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "logs"
                ? "bg-brand-green-900 text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            Log Riwayat Mutasi ({stockLogs.length})
          </button>
        </div>

        {/* Global Search */}
        <div className="relative w-48 sm:w-64 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu / catatan..."
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
          />
        </div>
      </div>

      {/* Sub-Tab 1: Stock Monitor Table & Cards */}
      {activeSubTab === "stock" && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-brand-green-900/10 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Menu Porsi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Batas Minimum</th>
                  <th className="py-3 px-4 text-center">Sisa Stok</th>
                  <th className="py-3 px-4 text-center">Status Stok</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {filteredStockProducts.map((prod) => {
                  const isLow = prod.currentStock <= prod.lowStockThreshold;

                  return (
                    <tr key={prod.id} className="hover:bg-brand-cream-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="size-10 rounded-xl object-cover border border-neutral-200 bg-neutral-100 flex-shrink-0"
                          />
                          <div>
                            <strong className="font-display font-bold text-sm text-neutral-900 block">
                              {prod.name}
                            </strong>
                            <span className="text-[11px] text-neutral-500 block">
                              Terjual hari ini: {prod.soldCount} porsi
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium text-[11px]">
                          {prod.categoryLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-neutral-600">
                        {prod.lowStockThreshold} porsi
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-display font-black text-base ${
                            isLow ? "text-amber-600" : "text-brand-green-950"
                          }`}
                        >
                          {prod.currentStock}
                        </span>
                        <span className="text-[10px] text-neutral-500 ml-1">porsi</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                            <AlertTriangle className="size-3" />
                            <span>Stok Menipis</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            <CheckCircle2 className="size-3" />
                            <span>Aman & Cukup</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => openMutationModal(prod.id)}
                          className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-brand-green-800 text-neutral-700 hover:text-brand-green-950 font-bold text-xs bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          Sesuaikan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredStockProducts.map((prod) => {
              const isLow = prod.currentStock <= prod.lowStockThreshold;

              return (
                <div
                  key={prod.id}
                  className={`p-4 rounded-2xl bg-white border space-y-3 ${
                    isLow ? "border-amber-300 bg-amber-50/20 shadow-2xs" : "border-brand-green-900/10 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="size-10 rounded-xl object-cover border border-neutral-200 bg-neutral-100"
                      />
                      <div>
                        <h4 className="font-display font-bold text-sm text-neutral-900">
                          {prod.name}
                        </h4>
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                          {prod.categoryLabel}
                        </span>
                      </div>
                    </div>

                    {isLow ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Menipis
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Aman
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-neutral-50 p-2 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Sisa Stok:</span>
                      <strong className={`font-display font-extrabold text-sm ${isLow ? "text-amber-600" : "text-brand-green-950"}`}>
                        {prod.currentStock} porsi
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 block">Ambang Batas:</span>
                      <span className="font-mono text-neutral-600">{prod.lowStockThreshold} porsi</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openMutationModal(prod.id)}
                    className="w-full py-2 rounded-xl bg-brand-green-900 text-white font-bold text-xs text-center cursor-pointer"
                  >
                    Catat Mutasi Stok
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Audit Trail Logs */}
      {activeSubTab === "logs" && (
        <div className="space-y-4">
          {/* Reason Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-brand-green-900/10">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1 mr-1">
                <Filter className="size-3.5" />
                Filter Tipe:
              </span>
              {[
                { id: "all", label: "Semua Mutasi" },
                { id: "RESTOCK", label: "Restock Masuk" },
                { id: "SPOILAGE", label: "Bahan Basi / Rusak" },
                { id: "ADJUSTMENT", label: "Penyesuaian Opname" },
              ].map((rf) => (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => setReasonFilter(rf.id as "all" | StockMutationReason)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    reasonFilter === rf.id
                      ? "bg-brand-green-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-neutral-200 text-xs bg-white text-neutral-700"
            >
              <option value="all">Semua Menu</option>
              {trackableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl border border-brand-green-900/10 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Waktu & Tanggal</th>
                    <th className="py-3 px-4">Menu Terkait</th>
                    <th className="py-3 px-4">Jenis Mutasi</th>
                    <th className="py-3 px-4 text-center">Perubahan</th>
                    <th className="py-3 px-4 text-center">Stok Akhir</th>
                    <th className="py-3 px-4">Petugas / PIC</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-sans">
                  {filteredLogs.map((log) => {
                    const isPositive = log.quantityChange > 0;

                    return (
                      <tr key={log.id} className="hover:bg-brand-cream-50/50 transition-colors">
                        {/* Waktu */}
                        <td className="py-3 px-4 font-mono text-neutral-600 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3 text-neutral-400" />
                            {log.timestamp}
                          </span>
                        </td>

                        {/* Menu */}
                        <td className="py-3 px-4 font-display font-bold text-neutral-900">
                          {log.productName}
                        </td>

                        {/* Jenis Mutasi Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.reason === "RESTOCK"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.reason === "SPOILAGE"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {log.reason === "RESTOCK" ? (
                              <ArrowUpRight className="size-3" />
                            ) : log.reason === "SPOILAGE" ? (
                              <ArrowDownRight className="size-3" />
                            ) : (
                              <RotateCcw className="size-3" />
                            )}
                            <span>{log.reasonLabel}</span>
                          </span>
                        </td>

                        {/* Perubahan */}
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span className={isPositive ? "text-emerald-700" : "text-rose-700"}>
                            {isPositive ? `+${log.quantityChange}` : log.quantityChange} porsi
                          </span>
                        </td>

                        {/* Stok Akhir */}
                        <td className="py-3 px-4 text-center font-display font-extrabold text-neutral-900">
                          {log.finalStock}
                        </td>

                        {/* Staff */}
                        <td className="py-3 px-4 text-neutral-700">
                          <span className="flex items-center gap-1">
                            <UserCheck className="size-3 text-neutral-400" />
                            {log.staffName}
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                          {log.notes || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mutation Modal */}
      {isMutationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-md w-full p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-brand-green-900 text-brand-yellow-400 flex items-center justify-center">
                  <PlusCircle className="size-4" />
                </div>
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Catat Mutasi Stok Bahan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMutationModalOpen(false)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitMutation} className="space-y-4">
              {/* Product Select */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Pilih Menu / Bahan <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProductForMutation}
                  onChange={(e) => setSelectedProductForMutation(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800"
                >
                  {trackableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Sisa saat ini: {p.currentStock} porsi)
                    </option>
                  ))}
                </select>
              </div>

              {/* Mutation Reason */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Tipe Mutasi <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMutationReason("RESTOCK")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      mutationReason === "RESTOCK"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <ArrowUpRight className="size-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-[11px] block">Restock Masuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMutationReason("SPOILAGE")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      mutationReason === "SPOILAGE"
                        ? "bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-2xs"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <ArrowDownRight className="size-4 mx-auto mb-1 text-rose-600" />
                    <span className="text-[11px] block">Bahan Basi / Rusak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMutationReason("ADJUSTMENT")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      mutationReason === "ADJUSTMENT"
                        ? "bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-2xs"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <RotateCcw className="size-4 mx-auto mb-1 text-blue-600" />
                    <span className="text-[11px] block">Opname Fisik</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Jumlah Porsi <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={mutationQuantity}
                    onChange={(e) => setMutationQuantity(Math.max(1, Number(e.target.value)))}
                    className="flex-1 h-10 px-3 rounded-xl border border-neutral-200 text-sm font-mono font-bold focus:outline-none focus:border-brand-green-800"
                  />
                  <div className="flex items-center gap-1">
                    {[10, 20, 50].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setMutationQuantity(quick)}
                        className="px-2.5 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-700 cursor-pointer"
                      >
                        +{quick}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="p-3 rounded-xl bg-brand-cream-50 border border-brand-green-900/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Stok Saat Ini:</span>
                  <strong className="font-mono text-neutral-800">{currentStock} porsi</strong>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block text-[11px]">Hasil Akhir Stok:</span>
                  <strong className="font-mono text-base font-extrabold text-brand-green-950">
                    {projectedFinalStock} porsi
                  </strong>
                </div>
              </div>

              {/* PIC Staff */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Petugas / PIC
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={mutationNotes}
                  onChange={(e) => setMutationNotes(e.target.value)}
                  placeholder="Misal: Kiriman batch pagi dari dapur pusat..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsMutationModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Konfirmasi Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
