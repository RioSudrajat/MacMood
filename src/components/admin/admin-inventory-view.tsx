import { useState } from "react";
import type {
  AdminProduct,
  StockLog,
  StockMutationReason,
  BranchOutlet,
} from "./types";
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
  Store,
  Download,
  FileText,
} from "lucide-react";
import { INITIAL_BRANCHES } from "./mock-data";
import {
  downloadCsv,
  printReportPdf,
  type ReportPrintKpi,
  type ReportPrintSection,
} from "@/lib/export-utils";

interface AdminInventoryViewProps {
  products: AdminProduct[];
  stockLogs: StockLog[];
  branches?: BranchOutlet[];
  onMutateStock: (
    productId: string,
    delta: number,
    reason: StockMutationReason,
    notes: string,
    staffName: string,
    branchId?: string,
    branchName?: string,
  ) => void;
}

export function AdminInventoryView({
  products,
  stockLogs,
  branches = INITIAL_BRANCHES,
  onMutateStock,
}: AdminInventoryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"stock" | "logs">("stock");
  const [selectedBranchId, setSelectedBranchId] = useState<"all" | string>(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState<"all" | StockMutationReason>(
    "all",
  );
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Modal State for New Stock Mutation
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedProductForMutation, setSelectedProductForMutation] =
    useState<string>(products[0]?.id || "");
  const [mutationBranchId, setMutationBranchId] = useState<string>(
    branches[0]?.id || "branch-1",
  );
  const [mutationReason, setMutationReason] =
    useState<StockMutationReason>("RESTOCK");
  const [mutationQuantity, setMutationQuantity] = useState<number>(10);
  const [mutationNotes, setMutationNotes] = useState("");
  const [staffName, setStaffName] = useState("Muhammad Afrizal (Owner)");

  // Helper to get stock for a product depending on selected branch
  const getProductStock = (
    p: AdminProduct,
    branchId: "all" | string,
  ): number => {
    if (branchId === "all") return p.currentStock;
    if (p.branchStocks && p.branchStocks[branchId] !== undefined) {
      return p.branchStocks[branchId];
    }
    // Fallback distribution if branchStocks missing
    const weights: Record<string, number> = {
      "branch-1": 0.45,
      "branch-2": 0.32,
      "branch-3": 0.23,
    };
    const w = weights[branchId] || 0.33;
    return Math.round(p.currentStock * w);
  };

  // Filter trackable products
  const trackableProducts = products.filter((p) => p.trackStock);

  const lowStockProducts = trackableProducts.filter((p) => {
    const stock = getProductStock(p, selectedBranchId);
    const threshold =
      selectedBranchId === "all"
        ? p.lowStockThreshold
        : Math.max(3, Math.round(p.lowStockThreshold / 3));
    return stock <= threshold;
  });

  const selectedProduct = products.find(
    (p) => p.id === selectedProductForMutation,
  );
  const currentBranchStock = selectedProduct
    ? getProductStock(selectedProduct, mutationBranchId)
    : 0;

  // Effective delta based on reason
  const effectiveDelta =
    mutationReason === "SPOILAGE"
      ? -Math.abs(mutationQuantity)
      : Math.abs(mutationQuantity);
  const projectedFinalStock = Math.max(0, currentBranchStock + effectiveDelta);

  const openMutationModal = (productId?: string) => {
    if (productId) {
      setSelectedProductForMutation(productId);
    } else if (products.length > 0 && !selectedProductForMutation) {
      setSelectedProductForMutation(products[0].id);
    }
    setMutationBranchId(
      selectedBranchId === "all"
        ? branches[0]?.id || "branch-1"
        : selectedBranchId,
    );
    setMutationQuantity(10);
    setMutationNotes("");
    setIsMutationModalOpen(true);
  };

  const handleSubmitMutation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForMutation || mutationQuantity <= 0) return;

    const targetBranch = branches.find((b) => b.id === mutationBranchId);

    onMutateStock(
      selectedProductForMutation,
      effectiveDelta,
      mutationReason,
      mutationNotes.trim() ||
        (mutationReason === "RESTOCK"
          ? "Restock rutin bahan porsi"
          : "Pencatatan opname fisik"),
      staffName,
      mutationBranchId,
      targetBranch?.name,
    );

    setIsMutationModalOpen(false);
  };

  // Filtered Stock Items
  const filteredStockProducts = trackableProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filtered Logs
  const filteredLogs = stockLogs.filter((log) => {
    const matchBranch =
      selectedBranchId === "all" ||
      !log.branchId ||
      log.branchId === selectedBranchId;
    const matchProd =
      selectedProductFilter === "all" ||
      log.productId === selectedProductFilter;
    const matchReason = reasonFilter === "all" || log.reason === reasonFilter;
    const matchSearch =
      log.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.staffName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBranch && matchProd && matchReason && matchSearch;
  });

  // Export CSV
  const handleExportCsv = () => {
    const branchLabel =
      selectedBranchId === "all"
        ? "Semua_Cabang"
        : branches.find((b) => b.id === selectedBranchId)?.branchCode ||
          branches.find((b) => b.id === selectedBranchId)?.code ||
          "Cabang";
    const filename = `MacMood_Inventori_Stok_${branchLabel}_${new Date().toISOString().slice(0, 10)}`;

    if (activeSubTab === "stock") {
      const headers = [
        "ID Menu",
        "Nama Menu",
        "Kategori",
        "Terjual (Porsi)",
        "Sisa Stok (Porsi)",
        "Ambang Batas",
        "Status Stok",
      ];
      const rows = filteredStockProducts.map((p) => {
        const stock = getProductStock(p, selectedBranchId);
        const threshold =
          selectedBranchId === "all"
            ? p.lowStockThreshold
            : Math.max(3, Math.round(p.lowStockThreshold / 3));
        const sold =
          selectedBranchId === "all"
            ? p.soldCount
            : (p.branchSoldCounts?.[selectedBranchId] ?? 0);
        return [
          p.id,
          p.name,
          p.categoryLabel,
          sold,
          stock,
          threshold,
          stock <= threshold ? "MENIPIS" : "AMAN",
        ];
      });
      downloadCsv(filename, headers, rows);
    } else {
      const headers = [
        "Waktu",
        "Menu",
        "Jenis Mutasi",
        "Perubahan (Porsi)",
        "Stok Akhir",
        "Cabang",
        "Petugas",
        "Catatan",
      ];
      const rows = filteredLogs.map((l) => [
        l.timestamp,
        l.productName,
        l.reasonLabel,
        l.quantityChange > 0 ? `+${l.quantityChange}` : l.quantityChange,
        l.finalStock,
        l.branchName || "Pusat (Fatmawati)",
        l.staffName,
        l.notes,
      ]);
      downloadCsv(filename, headers, rows);
    }

    setExportNotice("Data inventori berhasil diekspor ke CSV.");
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Export PDF
  const handlePrintPdf = () => {
    const branchLabel =
      selectedBranchId === "all"
        ? "Konsolidasi Seluruh Cabang"
        : branches.find((b) => b.id === selectedBranchId)?.name || "Cabang";

    const totalStockPortions = filteredStockProducts.reduce(
      (sum, p) => sum + getProductStock(p, selectedBranchId),
      0,
    );
    const totalSoldPortions = filteredStockProducts.reduce(
      (sum, p) =>
        sum +
        (selectedBranchId === "all"
          ? p.soldCount
          : (p.branchSoldCounts?.[selectedBranchId] ?? 0)),
      0,
    );

    const kpis: ReportPrintKpi[] = [
      {
        label: "Total Menu Terpantau",
        value: `${filteredStockProducts.length} Item`,
        sub: "Tracking porsi aktif",
      },
      {
        label: "Total Terjual (Nota)",
        value: `${totalSoldPortions} Porsi`,
        sub: "Berdasarkan pesanan terbayar",
      },
      {
        label: "Total Sisa Stok",
        value: `${totalStockPortions} Porsi`,
        sub: "Stok siap saji",
      },
      {
        label: "Menu Batas Kritis",
        value: `${lowStockProducts.length} Item`,
        sub: lowStockProducts.length > 0 ? "Perlu restock" : "Semua aman",
      },
    ];

    const sections: ReportPrintSection[] = [
      {
        title: "Daftar Saldo Stok Porsi Menu",
        headers: [
          "Nama Menu",
          "Kategori",
          "Terjual",
          "Sisa Stok",
          "Batas Min.",
          "Status Stok",
        ],
        rows: filteredStockProducts.map((p) => {
          const stock = getProductStock(p, selectedBranchId);
          const threshold =
            selectedBranchId === "all"
              ? p.lowStockThreshold
              : Math.max(3, Math.round(p.lowStockThreshold / 3));
          const sold =
            selectedBranchId === "all"
              ? `${p.soldCount} Porsi`
              : `${p.branchSoldCounts?.[selectedBranchId] ?? 0} Porsi`;
          return [
            p.name,
            p.categoryLabel,
            sold,
            `${stock} Porsi`,
            `${threshold} Porsi`,
            stock <= threshold ? "MENIPIS (Perlu Restock)" : "AMAN",
          ];
        }),
      },
      {
        title: "Riwayat Mutasi Stok Terakhir (Log Opname)",
        headers: [
          "Waktu",
          "Menu",
          "Jenis Mutasi",
          "Perubahan",
          "Stok Akhir",
          "Petugas PIC",
        ],
        rows: filteredLogs
          .slice(0, 15)
          .map((l) => [
            l.timestamp,
            l.productName,
            l.reasonLabel,
            l.quantityChange > 0
              ? `+${l.quantityChange} porsi`
              : `${l.quantityChange} porsi`,
            `${l.finalStock} porsi`,
            l.staffName,
          ]),
      },
    ];

    printReportPdf({
      title: "Laporan Inventori, Stok Porsi & Mutasi Bahan",
      subtitle: `Sistem Manajemen Bahan Baku & Stok Porsi MacMood (${branchLabel})`,
      periodLabel: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      outletName: branchLabel,
      printedBy: "Muhammad Afrizal (Business Owner)",
      kpis,
      sections,
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-green-800 uppercase tracking-widest mb-1">
            <Package className="size-4" />
            <span>Kontrol Bahan & Mutasi Multi-Cabang</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-brand-green-950">
            Manajemen Stok & Opname Porsi
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Pantau sisa kuota porsi per cabang, catat restock bahan, dan lacak
            audit opname fisik.
          </p>
        </div>

        {/* Action Buttons: Catat Mutasi & Dual Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-brand-cream-100 text-brand-green-950 text-xs font-bold rounded-2xl border border-neutral-200 shadow-2xs transition-colors cursor-pointer"
            title="Download CSV"
          >
            <Download className="size-3.5 text-brand-green-900" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 text-xs font-bold rounded-2xl shadow-xs transition-colors cursor-pointer"
            title="Cetak Laporan PDF"
          >
            <FileText className="size-3.5" />
            <span>Ekspor PDF</span>
          </button>

          <button
            type="button"
            onClick={() => openMutationModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-green-900 hover:bg-brand-green-950 text-white font-extrabold text-xs rounded-2xl shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <PlusCircle className="size-4 text-brand-yellow-400" />
            <span>Catat Mutasi Stok</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-brand-cream-100 border border-brand-green-900/20 text-brand-green-950 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-brand-green-800 flex-shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Branch Selection Filter Tabs (Per-Cabang Stock Filter) */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-neutral-200 shadow-2xs overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5 px-2.5">
          <Store className="size-3.5 text-brand-green-900" />
          Cabang:
        </span>
        <button
          type="button"
          onClick={() => setSelectedBranchId("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedBranchId === "all"
              ? "bg-brand-green-900 text-brand-yellow-400 shadow-2xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          Semua Cabang (Konsolidasi)
        </button>
        {branches.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelectedBranchId(b.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedBranchId === b.id
                ? "bg-brand-green-900 text-brand-yellow-400 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-3xl bg-brand-yellow-400/20 border border-brand-yellow-400/40 text-neutral-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2 rounded-2xl bg-brand-yellow-400 text-brand-green-950 flex-shrink-0">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <strong className="text-sm font-display font-extrabold block text-brand-green-950">
                Peringatan: {lowStockProducts.length} Menu Mendekati Batas
                Kritis!
              </strong>
              <span className="text-xs text-neutral-700">
                Item:{" "}
                {lowStockProducts
                  .map(
                    (p) =>
                      `${p.name} (${getProductStock(p, selectedBranchId)} porsi)`,
                  )
                  .join(", ")}
                . Segera lakukan restock atau persiapan dapur.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openMutationModal(lowStockProducts[0].id)}
            className="px-4 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 text-xs font-bold transition-colors cursor-pointer flex-shrink-0 shadow-2xs"
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
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "stock"
                ? "bg-brand-green-900 text-brand-yellow-400 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            Sisa Stok Porsi ({trackableProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("logs")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "logs"
                ? "bg-brand-green-900 text-brand-yellow-400 shadow-xs"
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
            className="w-full h-8 pl-8 pr-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
          />
        </div>
      </div>

      {/* Sub-Tab 1: Stock Monitor Table & Cards */}
      {activeSubTab === "stock" && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-brand-green-900/10 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Menu Porsi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Batas Minimum</th>
                  <th className="py-3 px-4 text-center">
                    {selectedBranchId === "all"
                      ? "Total Konsolidasi"
                      : "Stok Cabang"}
                  </th>
                  {selectedBranchId === "all" && (
                    <th className="py-3 px-4 text-center">Distribusi Cabang</th>
                  )}
                  <th className="py-3 px-4 text-center">Status Stok</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {filteredStockProducts.map((prod) => {
                  const stock = getProductStock(prod, selectedBranchId);
                  const threshold =
                    selectedBranchId === "all"
                      ? prod.lowStockThreshold
                      : Math.max(3, Math.round(prod.lowStockThreshold / 3));
                  const isLow = stock <= threshold;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-brand-cream-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="size-10 rounded-2xl object-cover border border-neutral-200 bg-neutral-100 flex-shrink-0"
                          />
                          <div>
                            <strong className="font-display font-bold text-sm text-neutral-900 block">
                              {prod.name}
                            </strong>
                            <span className="text-[11px] text-neutral-500 block">
                              Terjual:{" "}
                              <span className="font-bold text-neutral-800">
                                {selectedBranchId === "all"
                                  ? `${prod.soldCount} porsi`
                                  : `${prod.branchSoldCounts?.[selectedBranchId] ?? 0} porsi`}
                              </span>
                              {selectedBranchId !== "all" && (
                                <span className="text-neutral-400 text-[10px] ml-1">
                                  (total: {prod.soldCount})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-cream-100 text-brand-green-950 font-bold text-[10px] border border-brand-green-900/10">
                          {prod.categoryLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-neutral-600">
                        {threshold} porsi
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-display font-black text-base ${
                            isLow ? "text-amber-700" : "text-brand-green-950"
                          }`}
                        >
                          {stock}
                        </span>
                        <span className="text-[10px] text-neutral-500 ml-1">
                          porsi
                        </span>
                      </td>

                      {selectedBranchId === "all" && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[10px]">
                            <span
                              className="bg-brand-cream-100 text-brand-green-900 px-1.5 py-0.5 rounded-md font-mono"
                              title="Fatmawati"
                            >
                              Fatma:{" "}
                              {prod.branchStocks?.["branch-1"] ??
                                Math.round(prod.currentStock * 0.45)}
                            </span>
                            <span
                              className="bg-brand-cream-100 text-brand-green-900 px-1.5 py-0.5 rounded-md font-mono"
                              title="Margonda"
                            >
                              Margo:{" "}
                              {prod.branchStocks?.["branch-2"] ??
                                Math.round(prod.currentStock * 0.32)}
                            </span>
                            <span
                              className="bg-brand-cream-100 text-brand-green-900 px-1.5 py-0.5 rounded-md font-mono"
                              title="Tebet"
                            >
                              Tebet:{" "}
                              {prod.branchStocks?.["branch-3"] ??
                                Math.round(prod.currentStock * 0.23)}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-yellow-400/20 text-amber-900 font-bold text-[10px] border border-brand-yellow-400/40">
                            <AlertTriangle className="size-3 text-amber-700" />
                            <span>Stok Menipis</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-cream-100 text-brand-green-900 font-bold text-[10px] border border-brand-green-900/15">
                            <CheckCircle2 className="size-3 text-brand-green-800" />
                            <span>Aman & Cukup</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => openMutationModal(prod.id)}
                          className="px-3 py-1.5 rounded-2xl border border-neutral-200 hover:border-brand-green-900 text-neutral-700 hover:text-brand-green-950 font-bold text-xs bg-white hover:bg-brand-cream-50 transition-colors cursor-pointer"
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
                  onClick={() =>
                    setReasonFilter(rf.id as "all" | StockMutationReason)
                  }
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    reasonFilter === rf.id
                      ? "bg-brand-green-900 text-brand-yellow-400 shadow-2xs"
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
              className="h-8 px-2.5 rounded-xl border border-neutral-200 text-xs bg-white text-neutral-700"
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
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Menu</th>
                    <th className="py-3 px-4">Cabang</th>
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
                      <tr
                        key={log.id}
                        className="hover:bg-brand-cream-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-neutral-600 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3 text-neutral-400" />
                            {log.timestamp}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-display font-bold text-neutral-900">
                          {log.productName}
                        </td>

                        <td className="py-3 px-4 text-brand-green-950 font-medium">
                          {log.branchName || "Pusat (Fatmawati)"}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.reason === "RESTOCK"
                                ? "bg-brand-cream-100 text-brand-green-950 border border-brand-green-900/15"
                                : log.reason === "SPOILAGE"
                                  ? "bg-brand-coral-50 text-brand-coral-600 border border-brand-coral-600/20"
                                  : "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {log.reason === "RESTOCK" ? (
                              <ArrowUpRight className="size-3 text-brand-green-800" />
                            ) : log.reason === "SPOILAGE" ? (
                              <ArrowDownRight className="size-3 text-brand-coral-600" />
                            ) : (
                              <RotateCcw className="size-3" />
                            )}
                            <span>{log.reasonLabel}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span
                            className={
                              isPositive
                                ? "text-brand-green-900"
                                : "text-brand-coral-600"
                            }
                          >
                            {isPositive
                              ? `+${log.quantityChange}`
                              : log.quantityChange}{" "}
                            porsi
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-display font-extrabold text-neutral-900">
                          {log.finalStock}
                        </td>

                        <td className="py-3 px-4 text-neutral-700">
                          <span className="flex items-center gap-1">
                            <UserCheck className="size-3 text-neutral-400" />
                            {log.staffName}
                          </span>
                        </td>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-2xl bg-brand-green-900 text-brand-yellow-400 flex items-center justify-center">
                  <PlusCircle className="size-4" />
                </div>
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Catat Mutasi Stok Porsi Cabang
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

            <form onSubmit={handleSubmitMutation} className="space-y-4">
              {/* Branch Select */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Pilih Cabang Lokasi{" "}
                  <span className="text-brand-coral-600">*</span>
                </label>
                <select
                  value={mutationBranchId}
                  onChange={(e) => setMutationBranchId(e.target.value)}
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800 font-bold text-brand-green-950"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.branchCode || b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Select */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Pilih Menu / Bahan{" "}
                  <span className="text-brand-coral-600">*</span>
                </label>
                <select
                  value={selectedProductForMutation}
                  onChange={(e) =>
                    setSelectedProductForMutation(e.target.value)
                  }
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800"
                >
                  {trackableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Sisa di cabang:{" "}
                      {getProductStock(p, mutationBranchId)} porsi)
                    </option>
                  ))}
                </select>
              </div>

              {/* Mutation Reason */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Tipe Mutasi <span className="text-brand-coral-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMutationReason("RESTOCK")}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      mutationReason === "RESTOCK"
                        ? "bg-brand-cream-100 border-brand-green-900 text-brand-green-950 font-bold shadow-2xs"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <ArrowUpRight className="size-4 mx-auto mb-1 text-brand-green-800" />
                    <span className="text-[11px] block">Restock Masuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMutationReason("SPOILAGE")}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      mutationReason === "SPOILAGE"
                        ? "bg-brand-coral-50 border-brand-coral-600 text-brand-coral-600 font-bold shadow-2xs"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <ArrowDownRight className="size-4 mx-auto mb-1 text-brand-coral-600" />
                    <span className="text-[11px] block">Basi / Rusak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMutationReason("ADJUSTMENT")}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      mutationReason === "ADJUSTMENT"
                        ? "bg-brand-cream-100 border-brand-green-900 text-brand-green-950 font-bold shadow-2xs"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <RotateCcw className="size-4 mx-auto mb-1 text-brand-green-800" />
                    <span className="text-[11px] block">Opname Fisik</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Jumlah Porsi <span className="text-brand-coral-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={mutationQuantity}
                    onChange={(e) =>
                      setMutationQuantity(Math.max(1, Number(e.target.value)))
                    }
                    className="flex-1 h-10 px-3 rounded-2xl border border-neutral-200 text-sm font-mono font-bold focus:outline-none focus:border-brand-green-800"
                  />
                  <div className="flex items-center gap-1">
                    {[10, 20, 50].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setMutationQuantity(quick)}
                        className="px-2.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-700 cursor-pointer"
                      >
                        +{quick}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="p-3 rounded-2xl bg-brand-cream-50 border border-brand-green-900/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-500 block text-[11px]">
                    Stok Saat Ini (Cabang):
                  </span>
                  <strong className="font-mono text-neutral-800">
                    {currentBranchStock} porsi
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block text-[11px]">
                    Hasil Akhir Stok:
                  </span>
                  <strong className="font-mono text-base font-extrabold text-brand-green-950">
                    {projectedFinalStock} porsi
                  </strong>
                </div>
              </div>

              {/* PIC Staff */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Petugas PIC
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full h-9 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
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
                  className="w-full p-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsMutationModalOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-extrabold text-xs shadow-xs cursor-pointer"
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
