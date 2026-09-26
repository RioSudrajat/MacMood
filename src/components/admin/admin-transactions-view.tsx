import { useState } from "react";
import type {
  CompletedOrder,
  PaymentMethod,
  OrderStatus,
} from "@/components/pos/types";
import type { BranchOutlet } from "./types";
import { formatRupiah } from "@/components/pos/format";
import {
  FileSpreadsheet,
  Search,
  Eye,
  AlertOctagon,
  Download,
  CreditCard,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  X,
  User,
  Store,
  FileText,
} from "lucide-react";
import { INITIAL_BRANCHES } from "./mock-data";
import {
  downloadCsv,
  printReportPdf,
  type ReportPrintKpi,
  type ReportPrintSection,
} from "@/lib/export-utils";

interface AdminTransactionsViewProps {
  orders: CompletedOrder[];
  branches?: BranchOutlet[];
  onVoidOrder: (orderId: string, reason: string) => void;
}

export function AdminTransactionsView({
  orders,
  branches = INITIAL_BRANCHES,
  onVoidOrder,
}: AdminTransactionsViewProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<"all" | string>(
    "all",
  );
  const [datePeriod, setDatePeriod] = useState<
    "today" | "week" | "month" | "all"
  >("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentMethod>(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(
    null,
  );

  // Void Modal State
  const [orderToVoid, setOrderToVoid] = useState<CompletedOrder | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const todayDateStr = new Date().toISOString().slice(0, 10);

  // Filtering
  const filteredOrders = orders.filter((ord) => {
    const matchBranch =
      selectedBranchId === "all" ||
      !ord.branchId ||
      ord.branchId === selectedBranchId;
    const matchSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.branchName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      ord.items.some((it) =>
        it.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchPayment =
      paymentFilter === "all" ||
      ord.paymentMethod === paymentFilter ||
      (paymentFilter === "QRIS_MANUAL" && ord.paymentMethod === "QRIS");
    const matchStatus = statusFilter === "all" || ord.status === statusFilter;

    let matchDate = true;
    const orderDate =
      ord.dateStr ||
      (ord.createdAt
        ? new Date(ord.createdAt).toISOString().slice(0, 10)
        : "2026-09-26");
    if (datePeriod === "today") {
      matchDate = Boolean(
        orderDate === todayDateStr ||
        orderDate === "2026-09-26" ||
        ord.dateStr?.startsWith("2026-09-26") ||
        (ord.createdAt && ord.createdAt.startsWith("2026-09-26")),
      );
    } else if (datePeriod === "week") {
      matchDate = orderDate >= "2026-09-20";
    } else if (datePeriod === "month") {
      matchDate =
        orderDate.startsWith("2026-09") ||
        orderDate.slice(0, 7) === todayDateStr.slice(0, 7);
    }

    return (
      matchBranch && matchSearch && matchPayment && matchStatus && matchDate
    );
  });

  // Calculate Metrics
  const paidOrders = filteredOrders.filter((o) => o.status === "PAID");
  const voidOrders = filteredOrders.filter((o) => o.status === "VOID");
  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const cashPaidTotal = paidOrders
    .filter((o) => o.paymentMethod === "CASH")
    .reduce((sum, o) => sum + o.total, 0);
  const qrisPaidTotal = paidOrders
    .filter(
      (o) => o.paymentMethod === "QRIS_MANUAL" || o.paymentMethod === "QRIS",
    )
    .reduce((sum, o) => sum + o.total, 0);

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToVoid || !voidReason.trim()) return;

    onVoidOrder(orderToVoid.id, voidReason.trim());
    setOrderToVoid(null);
    setVoidReason("");
  };

  const handleExportCSV = () => {
    const branchLabel =
      selectedBranchId === "all"
        ? "Semua_Cabang"
        : branches.find((b) => b.id === selectedBranchId)?.branchCode ||
          branches.find((b) => b.id === selectedBranchId)?.code ||
          "Cabang";
    const filename = `MacMood_Riwayat_Transaksi_${branchLabel}_${new Date().toISOString().slice(0, 10)}`;

    const headers = [
      "No. Nota",
      "Tanggal",
      "Waktu",
      "Cabang",
      "Kasir",
      "Metode Pembayaran",
      "Status",
      "Subtotal",
      "Diskon",
      "Kode Promo",
      "Pajak PB1",
      "Total Belanja",
      "Catatan Void",
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.dateStr || "2026-09-26",
      o.timestamp,
      o.branchName || "Cabang Pusat",
      o.cashierName,
      o.paymentMethod === "CASH" ? "Tunai" : "QRIS Outlet",
      o.status,
      o.subtotal,
      o.discount || 0,
      o.promoCode || "-",
      o.tax,
      o.total,
      o.voidReason || "-",
    ]);

    downloadCsv(filename, headers, rows);
    setExportNotice("Riwayat transaksi berhasil diekspor ke format CSV.");
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handlePrintPdf = () => {
    const branchLabel =
      selectedBranchId === "all"
        ? "Seluruh Cabang (Konsolidasi)"
        : branches.find((b) => b.id === selectedBranchId)?.name || "Cabang";

    const kpis: ReportPrintKpi[] = [
      {
        label: "Total Omzet Lunas",
        value: formatRupiah(totalPaidRevenue),
        sub: `${paidOrders.length} nota berhasil`,
      },
      {
        label: "Penerimaan Tunai",
        value: formatRupiah(cashPaidTotal),
        sub: "Kas laci kasir",
      },
      {
        label: "Penerimaan QRIS",
        value: formatRupiah(qrisPaidTotal),
        sub: "Settlement rekening",
      },
      {
        label: "Transaksi Dibatalkan",
        value: `${voidOrders.length} Nota`,
        sub: "Otorisasi void owner",
      },
    ];

    const sections: ReportPrintSection[] = [
      {
        title: "Riwayat Transaksi Penjualan Lengkap",
        headers: [
          "No. Nota",
          "Tanggal & Waktu",
          "Cabang",
          "Kasir",
          "Metode",
          "Status",
          "Total",
        ],
        rows: filteredOrders.map((o) => [
          o.orderNumber,
          `${o.dateStr || "2026-09-26"} ${o.timestamp}`,
          o.branchName || "Pusat",
          o.cashierName,
          o.paymentMethod === "CASH" ? "Tunai" : "QRIS",
          o.status === "PAID" ? "LUNAS" : "DIBATALKAN (VOID)",
          formatRupiah(o.total),
        ]),
        summaryText: `Total Omzet Bersih Transaksi Terverifikasi: ${formatRupiah(totalPaidRevenue)}`,
      },
    ];

    printReportPdf({
      title: "Laporan Riwayat Transaksi Penjualan POS",
      subtitle: `Audit Transaksi Multi-Cabang & Kanal Pembayaran MacMood (${branchLabel})`,
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
            <FileSpreadsheet className="size-4" />
            <span>Audit & Riwayat Penjualan Multi-Cabang</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-brand-green-950">
            Daftar Seluruh Transaksi
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Audit semua nota pembayaran kasir lintas cabang, verifikasi
            QRIS/Tunai, dan otorisasi void owner.
          </p>
        </div>

        {/* Dual Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-brand-cream-100 text-brand-green-950 text-xs font-bold rounded-2xl border border-neutral-200 shadow-2xs transition-colors cursor-pointer"
            title="Download Format CSV"
          >
            <Download className="size-3.5 text-brand-green-900" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 text-xs font-bold rounded-2xl shadow-xs transition-colors cursor-pointer"
            title="Cetak Laporan PDF Resmi"
          >
            <FileText className="size-3.5" />
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

      {/* Date Period & Branch Selection Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Date Period Tabs */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-neutral-200 shadow-2xs overflow-x-auto">
          <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5 px-2">
            <Calendar className="size-3.5 text-brand-green-900" />
            Periode:
          </span>
          {[
            { id: "today", label: "Hari Ini" },
            { id: "week", label: "7 Hari" },
            { id: "month", label: "Bulan Ini" },
            { id: "all", label: "Semua Waktu" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                setDatePeriod(p.id as "today" | "week" | "month" | "all")
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                datePeriod === p.id
                  ? "bg-brand-green-900 text-brand-yellow-400 shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Branch Selection Filter Tabs */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-neutral-200 shadow-2xs overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5 px-2">
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
            Semua ({orders.length})
          </button>
          {branches.map((b) => {
            const count = orders.filter((o) => o.branchId === b.id).length;
            return (
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
                {b.name.replace("MacMood ", "")} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Omzet Lunas */}
        <div className="p-4 rounded-3xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">
            Total Omzet Lunas
          </span>
          <span className="font-display font-black text-xl sm:text-2xl text-brand-green-950 tracking-tight">
            {formatRupiah(totalPaidRevenue)}
          </span>
          <span className="text-[10px] text-brand-green-800 font-bold block mt-0.5">
            {paidOrders.length} transaksi berhasil
          </span>
        </div>

        {/* Tunai (Cash) */}
        <div className="p-4 rounded-3xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">
            Pendapatan Tunai
          </span>
          <span className="font-display font-black text-xl sm:text-2xl text-brand-green-900 tracking-tight">
            {formatRupiah(cashPaidTotal)}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5">
            Tersimpan di laci kasir
          </span>
        </div>

        {/* QRIS Outlet */}
        <div className="p-4 rounded-3xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">
            Pendapatan QRIS
          </span>
          <span className="font-display font-black text-xl sm:text-2xl text-amber-950 tracking-tight">
            {formatRupiah(qrisPaidTotal)}
          </span>
          <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
            Penerimaan non-tunai cabang
          </span>
        </div>

        {/* Void / Batal */}
        <div className="p-4 rounded-3xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">
            Transaksi Dibatalkan
          </span>
          <span className="font-display font-black text-xl sm:text-2xl text-brand-coral-600 tracking-tight">
            {voidOrders.length}{" "}
            <span className="text-xs font-normal text-neutral-500">nota</span>
          </span>
          <span className="text-[10px] text-brand-coral-600 font-medium block mt-0.5">
            Otorisasi batal (Void Owner)
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-brand-green-900/10 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. nota, nama kasir, atau menu..."
            className="w-full h-9 pl-9 pr-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 bg-neutral-50/50"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Method */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-2xl">
            {[
              { id: "all", label: "Semua Metode" },
              { id: "CASH", label: "Tunai" },
              { id: "QRIS_MANUAL", label: "QRIS" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaymentFilter(p.id as "all" | PaymentMethod)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  paymentFilter === p.id
                    ? "bg-brand-green-900 text-brand-yellow-400 shadow-2xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | OrderStatus)
            }
            className="h-9 px-3 rounded-2xl border border-neutral-200 text-xs bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-green-800 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="PAID">Lunas (Paid)</option>
            <option value="VOID">Dibatalkan (Void)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table (Desktop) */}
      <div className="hidden md:block bg-white rounded-3xl border border-brand-green-900/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">No. Nota</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Cabang</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Pesanan</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-right">Total Nota</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {filteredOrders.map((ord) => {
                const isPaid = ord.status === "PAID";
                const isCash = ord.paymentMethod === "CASH";
                const formattedDate = ord.dateStr
                  ? new Date(ord.dateStr).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "26 Sep 2026";

                return (
                  <tr
                    key={ord.id}
                    className={`hover:bg-brand-cream-50/50 transition-colors ${
                      !isPaid ? "bg-brand-coral-50/20 opacity-75" : ""
                    }`}
                  >
                    {/* Order Number */}
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                      {ord.orderNumber}
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4 text-neutral-800 whitespace-nowrap">
                      <div className="font-semibold text-xs text-neutral-900 flex items-center gap-1.5">
                        <Calendar className="size-3 text-brand-green-800" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-0.5">
                        <Clock className="size-3 text-neutral-400" />
                        <span>{ord.timestamp}</span>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-4 font-bold text-brand-green-950">
                      {ord.branchName || "Pusat (Fatmawati)"}
                    </td>

                    {/* Cashier */}
                    <td className="py-3 px-4 text-neutral-800">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3 text-neutral-400" />
                        <span>{ord.cashierName}</span>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4 max-w-xs truncate text-neutral-700">
                      {ord.items
                        .map((i) => `${i.quantity}x ${i.name}`)
                        .join(", ")}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          isCash
                            ? "bg-brand-cream-100 text-brand-green-950 border border-brand-green-900/15"
                            : "bg-brand-yellow-400/20 text-amber-900 border border-brand-yellow-400/30"
                        }`}
                      >
                        {isCash ? (
                          <Banknote className="size-3 text-brand-green-800" />
                        ) : (
                          <CreditCard className="size-3 text-amber-800" />
                        )}
                        <span>{isCash ? "Tunai" : "QRIS"}</span>
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right font-display font-extrabold text-sm text-neutral-900">
                      <span
                        className={`block ${!isPaid ? "line-through text-neutral-400" : ""}`}
                      >
                        {formatRupiah(ord.total)}
                      </span>
                      {ord.discount && ord.discount > 0 && (
                        <span className="text-[10px] text-brand-green-800 font-bold block">
                          Hemat: -{formatRupiah(ord.discount)}{" "}
                          {ord.promoCode ? `(${ord.promoCode})` : ""}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-cream-100 text-brand-green-900 font-bold text-[10px] border border-brand-green-900/15">
                          <CheckCircle2 className="size-3" />
                          <span>Lunas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-coral-50 text-brand-coral-600 font-bold text-[10px] border border-brand-coral-600/20">
                          <XCircle className="size-3" />
                          <span>Dibatalkan</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="size-7 rounded-xl hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                          title="Lihat Rincian Nota"
                        >
                          <Eye className="size-3.5" />
                        </button>

                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => setOrderToVoid(ord)}
                            className="size-7 rounded-xl hover:bg-brand-coral-50 text-neutral-400 hover:text-brand-coral-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Otorisasi Void / Batalkan Nota"
                          >
                            <AlertOctagon className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions Cards (Mobile View) */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.map((ord) => {
          const isPaid = ord.status === "PAID";
          const isCash = ord.paymentMethod === "CASH";
          const formattedDate = ord.dateStr
            ? new Date(ord.dateStr).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "26 Sep 2026";

          return (
            <div
              key={ord.id}
              className={`p-4 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-3 ${
                !isPaid ? "opacity-75 bg-brand-coral-50/20" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-xs text-neutral-900 block">
                    #{ord.orderNumber}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                    <span className="font-semibold text-neutral-700">
                      {formattedDate}
                    </span>
                    <span>•</span>
                    <span>{ord.timestamp}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      isCash
                        ? "bg-brand-cream-100 text-brand-green-950 border border-brand-green-900/15"
                        : "bg-brand-yellow-400/20 text-amber-900 border border-brand-yellow-400/30"
                    }`}
                  >
                    {isCash ? "Tunai" : "QRIS"}
                  </span>
                  {isPaid ? (
                    <span className="px-2 py-0.5 rounded-full bg-brand-cream-100 text-brand-green-900 font-bold text-[10px] border border-brand-green-900/15">
                      Lunas
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-brand-coral-50 text-brand-coral-600 font-bold text-[10px] border border-brand-coral-600/20">
                      Batal
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-100">
                <div className="font-bold text-brand-green-950 mb-1">
                  {ord.branchName || "Pusat (Fatmawati)"} ·{" "}
                  <span className="font-normal text-neutral-500">
                    {ord.cashierName}
                  </span>
                </div>
                <p className="truncate text-neutral-600">
                  {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-neutral-500 block">
                    Total Nota
                  </span>
                  <strong className="font-display font-black text-base text-brand-green-950">
                    {formatRupiah(ord.total)}
                  </strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(ord)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Rincian
                  </button>
                  {isPaid && (
                    <button
                      type="button"
                      onClick={() => setOrderToVoid(ord)}
                      className="px-2.5 py-1.5 rounded-xl bg-brand-coral-50 hover:bg-brand-coral-100 text-brand-coral-600 text-xs font-bold transition-colors cursor-pointer"
                      title="Void"
                    >
                      Void
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Void Modal */}
      {orderToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="size-5 text-brand-coral-600" />
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Otorisasi Void Transaksi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderToVoid(null)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Apakah Anda yakin ingin membatalkan nota{" "}
              <strong className="text-neutral-900 font-mono">
                #{orderToVoid.orderNumber}
              </strong>{" "}
              sebesar{" "}
              <strong className="text-neutral-900">
                {formatRupiah(orderToVoid.total)}
              </strong>
              ? Tindakan ini akan dicatat ke dalam audit log keamanan.
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Alasan Pembatalan{" "}
                  <span className="text-brand-coral-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Misal: Salah input menu oleh kasir / pelanggan batalkan pesanan..."
                  className="w-full p-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToVoid(null)}
                  className="px-4 py-2 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-brand-coral-600 hover:bg-brand-coral-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Konfirmasi Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Rincian Nota #{selectedOrder.orderNumber}
                </h3>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {selectedOrder.branchName || "Cabang Pusat"} ·{" "}
                  {selectedOrder.timestamp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto divide-y divide-neutral-100 pr-1">
              {selectedOrder.items.map((it, idx) => (
                <div
                  key={idx}
                  className="pt-2 flex justify-between items-start text-xs"
                >
                  <div>
                    <strong className="text-neutral-900 block font-bold">
                      {it.name}
                    </strong>
                    <span className="text-neutral-500 font-mono">
                      {it.quantity} x {formatRupiah(it.price)}
                    </span>
                  </div>
                  <strong className="font-mono text-neutral-900">
                    {formatRupiah(it.subtotal)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono">
                  {formatRupiah(selectedOrder.subtotal)}
                </span>
              </div>
              {selectedOrder.discount && selectedOrder.discount > 0 && (
                <div className="flex justify-between text-brand-green-800 font-bold">
                  <span>
                    Diskon Promo ({selectedOrder.promoCode || "DISKON"}):
                  </span>
                  <span className="font-mono">
                    -{formatRupiah(selectedOrder.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>PB1 Restoran (10%):</span>
                <span className="font-mono">
                  {formatRupiah(selectedOrder.tax)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-brand-green-950 pt-1 border-t border-neutral-100">
                <span>Total:</span>
                <span className="font-mono">
                  {formatRupiah(selectedOrder.total)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600 pt-1">
                <span>Metode Pembayaran:</span>
                <strong className="text-brand-green-950 font-bold">
                  {selectedOrder.paymentMethod === "CASH"
                    ? "Tunai (Cash Drawer)"
                    : "QRIS Outlet"}
                </strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-bold text-xs cursor-pointer shadow-2xs"
              >
                Tutup Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
