import { useState } from "react";
import type { PaymentMethod } from "./types";
import { formatRupiah } from "./format";
import { Banknote, QrCode, CheckCircle2, X } from "lucide-react";

interface PosCheckoutModalProps {
  subtotal?: number;
  discount?: number;
  promoCode?: string;
  tax?: number;
  total: number;
  onClose: () => void;
  onSubmit: (
    method: PaymentMethod,
    amountTendered: number,
    change: number,
  ) => void;
}

export function PosCheckoutModal({
  subtotal = 0,
  discount = 0,
  promoCode,
  tax = 0,
  total,
  onClose,
  onSubmit,
}: PosCheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [tenderedInput, setTenderedInput] = useState<string>(total.toString());

  const tenderedAmount = Number(tenderedInput.replace(/\D/g, "")) || 0;
  const changeAmount = Math.max(0, tenderedAmount - total);
  const isInsufficientCash = paymentMethod === "CASH" && tenderedAmount < total;

  const handleFinish = () => {
    if (isInsufficientCash) return;
    const finalTendered = paymentMethod === "CASH" ? tenderedAmount : total;
    const finalChange = paymentMethod === "CASH" ? changeAmount : 0;
    onSubmit(paymentMethod, finalTendered, finalChange);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 bg-brand-green-950 text-white flex items-center justify-between">
          <div>
            <span className="text-brand-yellow-400 text-[10px] font-black tracking-widest uppercase block">
              Pembayaran Kasir
            </span>
            <h3 className="font-display font-extrabold text-lg text-white">
              Pilih Metode Pembayaran
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Total Due Notice */}
          <div className="p-4 rounded-2xl bg-brand-cream-100 border border-brand-green-900/10">
            {discount > 0 && (
              <div className="space-y-1 pb-2.5 mb-2.5 border-b border-brand-green-900/10 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal Belanja</span>
                  <span className="font-mono font-medium">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Diskon {promoCode ? `(${promoCode})` : ""}</span>
                  <span className="font-mono">-{formatRupiah(discount)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>PB1 (10%)</span>
                  <span className="font-mono font-medium">
                    {formatRupiah(tax)}
                  </span>
                </div>
              </div>
            )}

            <span className="text-xs text-neutral-600 font-medium block text-center">
              Total tagihan pesanan:
            </span>
            <div className="font-display font-black text-3xl sm:text-4xl text-brand-green-900 mt-0.5 text-center">
              {formatRupiah(total)}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block text-center">
              Termasuk Pajak Restoran PB1 (10%)
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setPaymentMethod("CASH");
                setTenderedInput(total.toString());
              }}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                paymentMethod === "CASH"
                  ? "border-brand-green-800 bg-brand-green-100/50 text-brand-green-950 font-bold shadow-xs"
                  : "border-neutral-200 hover:border-neutral-300 text-neutral-600 bg-white"
              }`}
            >
              <Banknote className="size-6 mb-1 text-brand-green-800" />
              <span className="text-sm font-display font-bold">
                Tunai (Cash)
              </span>
              <span className="text-[10px] text-neutral-500">
                Hitung kembalian cepat
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod("QRIS_MANUAL");
                setTenderedInput(total.toString());
              }}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                paymentMethod === "QRIS_MANUAL"
                  ? "border-brand-green-800 bg-brand-green-100/50 text-brand-green-950 font-bold shadow-xs"
                  : "border-neutral-200 hover:border-neutral-300 text-neutral-600 bg-white"
              }`}
            >
              <QrCode className="size-6 mb-1 text-brand-green-800" />
              <span className="text-sm font-display font-bold">
                QRIS Manual
              </span>
              <span className="text-[10px] text-neutral-500">
                Verifikasi mutasi kasir
              </span>
            </button>
          </div>

          {/* Cash Calculator Flow */}
          {paymentMethod === "CASH" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Uang Diterima dari Pelanggan:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display font-extrabold text-neutral-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tenderedInput}
                    onChange={(e) => setTenderedInput(e.target.value)}
                    placeholder="0"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-neutral-300 font-display font-black text-lg focus:outline-none focus:border-brand-green-800 text-neutral-900"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Uang Pas", val: total },
                  { label: "20k", val: 20000 },
                  { label: "50k", val: 50000 },
                  { label: "100k", val: 100000 },
                ].map((btn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTenderedInput(btn.val.toString())}
                    className="py-2.5 px-1 rounded-xl bg-brand-cream-50 hover:bg-brand-yellow-400/40 text-xs font-bold text-neutral-800 border border-neutral-200 transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Change Calculation Box */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isInsufficientCash
                    ? "bg-red-50 border-red-200"
                    : "bg-emerald-50/60 border-emerald-200"
                }`}
              >
                <span className="text-xs font-semibold text-neutral-600">
                  Uang Kembalian:
                </span>
                <strong
                  className={`font-display font-black text-xl ${
                    isInsufficientCash
                      ? "text-brand-coral-600"
                      : "text-emerald-800"
                  }`}
                >
                  {isInsufficientCash
                    ? "Uang Masih Kurang"
                    : formatRupiah(changeAmount)}
                </strong>
              </div>
            </div>
          )}

          {/* QRIS Manual Flow */}
          {paymentMethod === "QRIS_MANUAL" && (
            <div className="space-y-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
              <div className="size-36 mx-auto bg-white p-2.5 rounded-xl border border-neutral-200 shadow-xs flex flex-col items-center justify-center">
                <QrCode className="size-24 text-brand-green-950" />
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mt-1">
                  QRIS MacMood Outlet 01
                </span>
              </div>

              <div className="text-left text-xs space-y-2 text-neutral-700 font-medium">
                <div className="flex items-start gap-2">
                  <span className="size-5 rounded-full bg-brand-green-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Tunjukkan barcode QRIS outlet kepada pelanggan.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-5 rounded-full bg-brand-green-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Pastikan notifikasi dana masuk telah diterima di HP
                    operasional outlet.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-5 rounded-full bg-brand-green-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tekan tombol konfirmasi di bawah untuk menyelesaikan
                    pesanan.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-bold transition-colors"
            >
              Kembali ke Keranjang
            </button>
            <button
              type="button"
              disabled={isInsufficientCash}
              onClick={handleFinish}
              className="h-12 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-display font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="size-4" />
              <span>Selesaikan & Struk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
