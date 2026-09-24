import { useState } from "react";
import type { CompletedOrder, PaymentMethod, OrderStatus } from "@/components/pos/types";
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
  X,
  User,
} from "lucide-react";

interface AdminTransactionsViewProps {
  orders: CompletedOrder[];
  onVoidOrder: (orderId: string, reason: string) => void;
}

export function AdminTransactionsView({ orders, onVoidOrder }: AdminTransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentMethod>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);

  // Void Modal State
  const [orderToVoid, setOrderToVoid] = useState<CompletedOrder | null>(null);
  const [voidReason, setVoidReason] = useState("");

  // Filtering
  const filteredOrders = orders.filter((ord) => {
    const matchSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchPayment = paymentFilter === "all" || ord.paymentMethod === paymentFilter;
    const matchStatus = statusFilter === "all" || ord.status === statusFilter;

    return matchSearch && matchPayment && matchStatus;
  });

  // Calculate Metrics
  const paidOrders = orders.filter((o) => o.status === "PAID");
  const voidOrders = orders.filter((o) => o.status === "VOID");
  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const cashPaidTotal = paidOrders
    .filter((o) => o.paymentMethod === "CASH")
    .reduce((sum, o) => sum + o.total, 0);
  const qrisPaidTotal = paidOrders
    .filter((o) => o.paymentMethod === "QRIS_MANUAL")
    .reduce((sum, o) => sum + o.total, 0);

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToVoid || !voidReason.trim()) return;

    onVoidOrder(orderToVoid.id, voidReason.trim());
    setOrderToVoid(null);
    setVoidReason("");
  };

  const handleExportCSV = () => {
    const headers = ["No. Nota", "Tanggal", "Waktu", "Kasir", "Metode", "Status", "Subtotal", "Diskon", "Kode Promo", "PB1", "Total", "Catatan Void"];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.dateStr,
      o.timestamp,
      o.cashierName,
      o.paymentMethod,
      o.status,
      o.subtotal,
      o.discount || 0,
      o.promoCode || "-",
      o.tax,
      o.total,
      o.voidReason || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MacMood_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-green-800 uppercase tracking-widest mb-1">
            <FileSpreadsheet className="size-4" />
            <span>Audit & Riwayat Penjualan</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-brand-green-950">
            Daftar Seluruh Transaksi
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Audit semua nota pembayaran kasir lintas shift, verifikasi pembayaran QRIS/Tunai, dan otorisasi pembatalan (void).
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-green-900/20 bg-white hover:bg-brand-cream-50 text-brand-green-950 font-bold text-xs shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="size-4 text-brand-green-900" />
          <span>Export Laporan (.CSV)</span>
        </button>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Omzet Lunas */}
        <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Total Omzet Lunas</span>
          <span className="font-display font-black text-xl sm:text-2xl text-brand-green-950 tracking-tight">
            {formatRupiah(totalPaidRevenue)}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
            {paidOrders.length} transaksi berhasil
          </span>
        </div>

        {/* Tunai (Cash) */}
        <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Pendapatan Tunai</span>
          <span className="font-display font-black text-xl sm:text-2xl text-brand-green-900 tracking-tight">
            {formatRupiah(cashPaidTotal)}
          </span>
          <span className="text-[10px] text-neutral-500 block mt-0.5">
            Masuk ke laci kasir (cash drawer)
          </span>
        </div>

        {/* QRIS Outlet */}
        <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Pendapatan QRIS</span>
          <span className="font-display font-black text-xl sm:text-2xl text-blue-700 tracking-tight">
            {formatRupiah(qrisPaidTotal)}
          </span>
          <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
            Masuk rekening BCA outlet
          </span>
        </div>

        {/* Void / Batal */}
        <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Transaksi Dibatalkan</span>
          <span className="font-display font-black text-xl sm:text-2xl text-rose-700 tracking-tight">
            {voidOrders.length} <span className="text-xs font-normal text-neutral-500">nota</span>
          </span>
          <span className="text-[10px] text-rose-600 font-medium block mt-0.5">
            Otorisasi batal (Void Owner)
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-brand-green-900/10 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. nota, nama kasir, atau menu..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 bg-neutral-50/50"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Method */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            {[
              { id: "all", label: "Semua Metode" },
              { id: "CASH", label: "Tunai" },
              { id: "QRIS_MANUAL", label: "QRIS" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaymentFilter(p.id as "all" | PaymentMethod)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  paymentFilter === p.id
                    ? "bg-white text-brand-green-950 shadow-2xs"
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
            onChange={(e) => setStatusFilter(e.target.value as "all" | OrderStatus)}
            className="h-9 px-3 rounded-xl border border-neutral-200 text-xs bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-green-800 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="PAID">Lunas (Paid)</option>
            <option value="VOID">Dibatalkan (Void)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table (Desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-brand-green-900/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">No. Nota</th>
                <th className="py-3 px-4">Waktu</th>
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

                return (
                  <tr
                    key={ord.id}
                    className={`hover:bg-brand-cream-50/50 transition-colors ${
                      !isPaid ? "bg-rose-50/20 opacity-75" : ""
                    }`}
                  >
                    {/* Order Number */}
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                      {ord.orderNumber}
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-neutral-400" />
                        <span>{ord.timestamp}</span>
                      </div>
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
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                          isCash
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isCash ? <Banknote className="size-3" /> : <CreditCard className="size-3" />}
                        <span>{isCash ? "Tunai" : "QRIS"}</span>
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right font-display font-extrabold text-sm text-neutral-900">
                      <span className={`block ${!isPaid ? "line-through text-neutral-400" : ""}`}>
                        {formatRupiah(ord.total)}
                      </span>
                      {ord.discount && ord.discount > 0 && (
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          Hemat: -{formatRupiah(ord.discount)} {ord.promoCode ? `(${ord.promoCode})` : ""}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isPaid ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        <span>{isPaid ? "LUNAS" : "VOID"}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-brand-green-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Lihat Detail Struk"
                        >
                          <Eye className="size-4" />
                        </button>

                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToVoid(ord);
                              setVoidReason("");
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Batalkan Nota (Void Owner)"
                          >
                            <AlertOctagon className="size-4" />
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

      {/* Transactions Card List (Mobile) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredOrders.map((ord) => {
          const isPaid = ord.status === "PAID";
          const isCash = ord.paymentMethod === "CASH";

          return (
            <div
              key={ord.id}
              className={`p-4 rounded-2xl bg-white border space-y-3 ${
                isPaid ? "border-brand-green-900/10 shadow-2xs" : "border-rose-200 bg-rose-50/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-xs text-neutral-900 block">
                    {ord.orderNumber}
                  </span>
                  <span className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" /> {ord.timestamp} · Kasir: {ord.cashierName}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    isPaid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {isPaid ? "LUNAS" : "VOID"}
                </span>
              </div>

              <div className="text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded-xl space-y-1">
                <div className="font-medium truncate">
                  {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60">
                  <span>Metode: {isCash ? "Tunai (Cash)" : "QRIS"}</span>
                  <strong className={`font-display font-black text-sm ${isPaid ? "text-brand-green-950" : "line-through text-neutral-400"}`}>
                    {formatRupiah(ord.total)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(ord)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Detail Nota
                </button>

                {isPaid && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderToVoid(ord);
                      setVoidReason("");
                    }}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                  >
                    Void
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold block">
                  Detail Transaksi Nota
                </span>
                <h3 className="font-mono font-bold text-sm text-neutral-900">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Receipt Summary Details */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Tanggal & Waktu</span>
                <span className="font-mono text-neutral-800">{selectedOrder.timestamp}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Petugas Kasir</span>
                <strong className="text-neutral-800">{selectedOrder.cashierName}</strong>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Metode Pembayaran</span>
                <strong className="text-brand-green-900">
                  {selectedOrder.paymentMethod === "CASH" ? "Tunai (Cash)" : "QRIS Outlet"}
                </strong>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Status Nota</span>
                <span
                  className={`font-bold ${
                    selectedOrder.status === "PAID" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {selectedOrder.status === "PAID" ? "LUNAS (TERVERIFIKASI)" : "DIBATALKAN (VOID)"}
                </span>
              </div>

              {selectedOrder.voidReason && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                  <strong>Alasan Pembatalan:</strong> {selectedOrder.voidReason}
                </div>
              )}

              {/* Items List */}
              <div className="pt-3 border-t border-dashed border-neutral-200 space-y-2">
                <span className="font-semibold text-neutral-700 block">Daftar Menu:</span>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div>
                      <strong className="text-neutral-900 block">
                        {item.quantity}x {item.name}
                      </strong>
                      {item.notes && (
                        <span className="text-[10px] text-neutral-500 italic block">
                          Catatan: {item.notes}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-neutral-800">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal, PB1, Total */}
              <div className="pt-3 border-t border-dashed border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatRupiah(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>PB1 Restoran (10%)</span>
                  <span className="font-mono">{formatRupiah(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-brand-green-950 pt-1.5 border-t border-neutral-200 font-display">
                  <span>Total Pembayaran</span>
                  <span>{formatRupiah(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 rounded-xl bg-brand-green-900 text-white font-bold text-xs text-center cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Modal Authorization */}
      {orderToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="size-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertOctagon className="size-5" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-base text-neutral-900">
                  Otorisasi Batal (Void)
                </h3>
                <span className="text-xs text-neutral-500">Hak Akses Business Owner</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600">
              Anda akan membatalkan nota transaksi <strong className="font-mono text-neutral-900">{orderToVoid.orderNumber}</strong> sebesar <strong className="text-rose-700">{formatRupiah(orderToVoid.total)}</strong>. Tindakan ini akan dicatat ke audit log.
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Alasan Pembatalan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Misal: Salah input menu kasir / Pelanggan batalkan pesanan..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToVoid(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Konfirmasi Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
