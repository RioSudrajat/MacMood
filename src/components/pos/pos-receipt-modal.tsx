import type { CompletedOrder } from "./types";
import { formatRupiah } from "./format";
import { CheckCircle2, Printer, X, Ban } from "lucide-react";

interface PosReceiptModalProps {
  order: CompletedOrder;
  onClose: () => void;
  isReprint?: boolean;
}

export function PosReceiptModal({ order, onClose, isReprint = false }: PosReceiptModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Receipt Header */}
        <div className="text-center space-y-1 pb-4 border-b border-dashed border-neutral-300">
          <div className="flex justify-between items-start mb-1">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                order.status === "VOID"
                  ? "bg-red-100 text-red-800"
                  : isReprint
                  ? "bg-neutral-100 text-neutral-700"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {order.status === "VOID"
                ? "DIBATALKAN / VOID"
                : isReprint
                ? "SALINAN STRUK (REPRINT)"
                : "TRANSAKSI LUNAS"}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="size-11 rounded-2xl bg-brand-green-900 text-brand-yellow-400 mx-auto flex items-center justify-center mb-2 shadow-sm">
            {order.status === "VOID" ? (
              <Ban className="size-6 text-brand-coral-600" />
            ) : (
              <CheckCircle2 className="size-6" />
            )}
          </div>

          <h4 className="font-display font-black text-xl text-brand-green-950 uppercase tracking-widest">
            MACMOOD POS
          </h4>
          <p className="text-[11px] text-neutral-500">
            Comfort Food Mac & Cheese · Outlet 01 Pusat
          </p>
          <p className="text-[10px] text-neutral-400">
            Jl. Sudirman No. 42, Jakarta Pusat
          </p>

          <div className="text-xs font-mono font-bold text-neutral-900 pt-2 tracking-wide">
            {order.orderNumber}
          </div>
          <div className="text-[10px] text-neutral-500">
            {order.dateStr} · {order.timestamp} · Kasir: {order.cashierName}
          </div>
        </div>

        {/* Void notice if applicable */}
        {order.status === "VOID" && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-0.5">
            <span className="font-bold block">Pesanan Dibatalkan (Void)</span>
            <span className="text-[11px] text-red-600">Alasan: {order.voidReason || "Kesalahan transaksi kasir"}</span>
          </div>
        )}

        {/* Items Breakdown */}
        <div className="space-y-2 text-xs max-h-48 overflow-y-auto py-1 divide-y divide-neutral-100">
          {order.items.map((it, idx) => (
            <div key={idx} className="pt-2 first:pt-0 flex justify-between gap-2">
              <div className="flex-1">
                <div className="font-bold text-neutral-900">
                  {it.name}
                  <span className="text-neutral-500 font-normal ml-1">× {it.quantity}</span>
                </div>
                {it.notes && (
                  <span className="block text-[10px] text-neutral-500 italic">
                    Catatan: {it.notes}
                  </span>
                )}
                <span className="text-[10px] text-neutral-400">
                  @{formatRupiah(it.price)}
                </span>
              </div>
              <span className="font-mono font-bold text-neutral-800 text-right">
                {formatRupiah(it.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Receipt Totals */}
        <div className="pt-3 border-t border-dashed border-neutral-300 space-y-1.5 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal</span>
            <span className="font-medium text-neutral-800">{formatRupiah(order.subtotal)}</span>
          </div>

          {order.discount && order.discount > 0 ? (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Diskon {order.promoCode ? `(${order.promoCode})` : ""}</span>
              <span className="font-mono">-{formatRupiah(order.discount)}</span>
            </div>
          ) : null}

          <div className="flex justify-between text-neutral-600">
            <span>Pajak Resto PB1 (10%)</span>
            <span className="font-medium text-neutral-800">{formatRupiah(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-neutral-200 text-neutral-900">
            <span className="font-display font-black text-brand-green-950">Total Pembayaran</span>
            <span className="font-display font-black text-base text-brand-green-900">
              {formatRupiah(order.total)}
            </span>
          </div>

          <div className="flex justify-between text-neutral-600 text-[11px] pt-1">
            <span>Metode: <strong className="text-neutral-800">{order.paymentMethod === "CASH" ? "Tunai (Cash)" : "QRIS Manual"}</strong></span>
            <span>Diterima: <strong className="text-neutral-800">{formatRupiah(order.amountTendered)}</strong></span>
          </div>

          {order.paymentMethod === "CASH" && (
            <div className="flex justify-between text-[11px] font-bold text-neutral-800">
              <span>Kembalian</span>
              <span className="font-mono text-emerald-700">{formatRupiah(order.change)}</span>
            </div>
          )}
        </div>

        {/* Sync Status Badge */}
        <div className="flex justify-center pt-1">
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
              order.syncStatus === "SYNCED"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {order.syncStatus === "SYNCED" ? "✓ Tersinkron ke Server Cloud" : "Antrean Offline (Lokal)"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="h-11 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="size-4 text-brand-green-900" />
            <span>Cetak Struk</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl bg-brand-green-900 text-white hover:bg-brand-green-800 text-xs font-bold transition-colors shadow-xs"
          >
            {isReprint ? "Selesai" : "Pesanan Baru"}
          </button>
        </div>
      </div>
    </div>
  );
}
