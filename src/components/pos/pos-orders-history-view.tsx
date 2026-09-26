import { useState, useMemo } from "react";
import type { CompletedOrder } from "./types";
import { formatRupiah } from "./format";
import { PosReceiptModal } from "./pos-receipt-modal";
import {
  Search,
  Printer,
  Ban,
  Clock,
  Banknote,
  QrCode,
  CheckCircle2,
  X,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface PosOrdersHistoryViewProps {
  orders: CompletedOrder[];
  onVoidOrder: (orderId: string, reason: string) => void;
}

export function PosOrdersHistoryView({
  orders,
  onVoidOrder,
}: PosOrdersHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<
    "ALL" | "CASH" | "QRIS_MANUAL"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "VOID">(
    "ALL",
  );
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] =
    useState<CompletedOrder | null>(null);
  const [orderToVoid, setOrderToVoid] = useState<CompletedOrder | null>(null);
  const [voidReasonInput, setVoidReasonInput] = useState("");

  // KPI Calculations
  const kpi = useMemo(() => {
    const validOrders = orders.filter((o) => o.status === "PAID");
    const totalTransactions = validOrders.length;
    const totalRevenue = validOrders.reduce((acc, o) => acc + o.total, 0);
    const cashTotal = validOrders
      .filter((o) => o.paymentMethod === "CASH")
      .reduce((acc, o) => acc + o.total, 0);
    const qrisTotal = validOrders
      .filter((o) => o.paymentMethod === "QRIS_MANUAL")
      .reduce((acc, o) => acc + o.total, 0);

    return { totalTransactions, totalRevenue, cashTotal, qrisTotal };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((i) =>
          i.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchPayment =
        paymentFilter === "ALL" || order.paymentMethod === paymentFilter;
      const matchStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return matchSearch && matchPayment && matchStatus;
    });
  }, [orders, searchQuery, paymentFilter, statusFilter]);

  const handleConfirmVoid = () => {
    if (!orderToVoid || !voidReasonInput.trim()) return;
    onVoidOrder(orderToVoid.id, voidReasonInput.trim());
    setOrderToVoid(null);
    setVoidReasonInput("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-brand-cream-50">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="text-xs font-semibold">Pesanan Hari Ini</span>
              <FileText className="size-4 text-brand-green-800" />
            </div>
            <div className="font-display font-black text-2xl text-brand-green-950">
              {kpi.totalTransactions}
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">
              Transaksi lunas
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="text-xs font-semibold">Total Omzet Kasir</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <div className="font-display font-black text-2xl text-emerald-800">
              {formatRupiah(kpi.totalRevenue)}
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">
              Shift berlangsung
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="text-xs font-semibold">Penerimaan Tunai</span>
              <Banknote className="size-4 text-emerald-600" />
            </div>
            <div className="font-display font-black text-xl text-neutral-900">
              {formatRupiah(kpi.cashTotal)}
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">
              Uang masuk laci
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="text-xs font-semibold">Penerimaan QRIS</span>
              <QrCode className="size-4 text-blue-600" />
            </div>
            <div className="font-display font-black text-xl text-neutral-900">
              {formatRupiah(kpi.qrisTotal)}
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">
              Rekening outlet
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor nota MAC-... atau nama menu..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-brand-cream-50/60 border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 text-neutral-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Payment & Status Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center p-0.5 rounded-xl bg-brand-cream-100 border border-neutral-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentFilter("ALL")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  paymentFilter === "ALL"
                    ? "bg-white text-brand-green-950 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Semua Metode
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("CASH")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  paymentFilter === "CASH"
                    ? "bg-white text-brand-green-950 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Tunai
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("QRIS_MANUAL")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  paymentFilter === "QRIS_MANUAL"
                    ? "bg-white text-brand-green-950 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                QRIS
              </button>
            </div>

            <div className="flex items-center p-0.5 rounded-xl bg-brand-cream-100 border border-neutral-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-white text-brand-green-950 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PAID")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === "PAID"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Lunas
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("VOID")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === "VOID"
                    ? "bg-white text-brand-coral-600 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Batal (Void)
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table & Cards */}
        <div className="bg-white rounded-2xl border border-brand-green-900/10 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-display font-extrabold text-base text-brand-green-950">
              Riwayat Pesanan Shift Ini
            </h3>
            <span className="text-xs text-neutral-500 font-medium">
              Menampilkan {filteredOrders.length} pesanan
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 p-4 text-neutral-400">
              <FileText className="size-10 mx-auto mb-2 text-neutral-300" />
              <p className="font-bold text-sm text-neutral-600">
                Tidak ada pesanan yang sesuai
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Coba ubah kata kunci pencarian atau filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-cream-50/70 border-b border-neutral-200/80 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">No. Transaksi</th>
                    <th className="py-3 px-4">Jam</th>
                    <th className="py-3 px-4">Rincian Item</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4 text-right">Total Tagihan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Kasir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map((order) => {
                    const isVoid = order.status === "VOID";

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-brand-cream-50/50 transition-colors ${
                          isVoid ? "bg-red-50/30 opacity-75" : ""
                        }`}
                      >
                        {/* Order Number & Sync */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-neutral-900 block">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                              order.syncStatus === "SYNCED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.syncStatus === "SYNCED"
                              ? "Tersinkron"
                              : "Lokal"}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="size-3 text-neutral-400" />
                            <span>{order.timestamp}</span>
                          </div>
                        </td>

                        {/* Items summary */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-neutral-800 font-medium truncate">
                            {order.items
                              .map((it) => `${it.name} (x${it.quantity})`)
                              .join(", ")}
                          </div>
                          <span className="text-[10px] text-neutral-400">
                            {order.items.reduce(
                              (acc, i) => acc + i.quantity,
                              0,
                            )}{" "}
                            porsi total
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                              order.paymentMethod === "CASH"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {order.paymentMethod === "CASH" ? (
                              <>
                                <Banknote className="size-3" />
                                <span>Tunai</span>
                              </>
                            ) : (
                              <>
                                <QrCode className="size-3" />
                                <span>QRIS</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <strong
                            className={`font-display font-black text-sm block ${
                              isVoid
                                ? "line-through text-neutral-400"
                                : "text-brand-green-900"
                            }`}
                          >
                            {formatRupiah(order.total)}
                          </strong>
                          {order.discount && order.discount > 0 && (
                            <span className="text-[10px] text-emerald-700 font-bold block">
                              Hemat: -{formatRupiah(order.discount)}{" "}
                              {order.promoCode ? `(${order.promoCode})` : ""}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isVoid
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {isVoid ? "Dibatalkan" : "Lunas"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Reprint button */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForReceipt(order)}
                              title="Cetak Ulang Struk"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 hover:bg-brand-cream-100 text-neutral-700 font-bold text-[11px] transition-colors"
                            >
                              <Printer className="size-3 text-brand-green-900" />
                              <span>Struk</span>
                            </button>

                            {/* Void button */}
                            {!isVoid && (
                              <button
                                type="button"
                                onClick={() => setOrderToVoid(order)}
                                title="Batalkan Pesanan (Void)"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-red-50 text-neutral-400 hover:text-brand-coral-600 font-bold text-[11px] transition-colors"
                              >
                                <Ban className="size-3" />
                                <span>Void</span>
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
          )}
        </div>
      </div>

      {/* Reprint Receipt Modal */}
      {selectedOrderForReceipt && (
        <PosReceiptModal
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
          isReprint={true}
        />
      )}

      {/* Void Order Confirmation Modal */}
      {orderToVoid && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-brand-coral-600">
                <AlertTriangle className="size-5" />
                <h3 className="font-display font-extrabold text-base text-neutral-900">
                  Batalkan Transaksi (Void)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderToVoid(null)}
                className="size-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-1.5 text-neutral-700">
                <div className="flex justify-between font-mono font-bold text-neutral-900">
                  <span>{orderToVoid.orderNumber}</span>
                  <span className="text-brand-coral-600">
                    {formatRupiah(orderToVoid.total)}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Pembatalan transaksi akan tercatat dalam audit log dan
                  mengurangi total omzet kasir shift ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Alasan Pembatalan (Wajib):
                </label>
                <textarea
                  rows={3}
                  value={voidReasonInput}
                  onChange={(e) => setVoidReasonInput(e.target.value)}
                  placeholder="Contoh: Pelanggan salah pesan menu / salah metode pembayaran..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-brand-coral-600 text-neutral-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToVoid(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={!voidReasonInput.trim()}
                onClick={handleConfirmVoid}
                className="px-4 py-2 rounded-xl bg-brand-coral-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-colors"
              >
                Konfirmasi Pembatalan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
