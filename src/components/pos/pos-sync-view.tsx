import { useState } from "react";
import type { SyncQueueItem } from "./types";
import { formatRupiah } from "./format";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Database,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface PosSyncViewProps {
  isOnline: boolean;
  syncQueue: SyncQueueItem[];
  onForceSync: () => void;
  onToggleSimulateOffline: () => void;
  isSimulatedOffline: boolean;
}

export function PosSyncView({
  isOnline,
  syncQueue,
  onForceSync,
  onToggleSimulateOffline,
  isSimulatedOffline,
}: PosSyncViewProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(false);

  const pendingCount = syncQueue.filter(
    (i) => i.syncStatus === "PENDING_SYNC",
  ).length;
  const syncedCount = syncQueue.filter((i) => i.syncStatus === "SYNCED").length;

  const handleSyncClick = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onForceSync();
      setIsSyncing(false);
      setSyncSuccessMsg(true);
      setTimeout(() => setSyncSuccessMsg(false), 3000);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-brand-cream-50">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-brand-green-800 text-xs font-bold tracking-wider uppercase block">
              Offline-First Engine
            </span>
            <h2 className="font-display font-extrabold text-2xl text-brand-green-950">
              Status Sinkronisasi & Antrean Lokal
            </h2>
          </div>

          {/* Sync Trigger button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSyncing || (!isOnline && !isSimulatedOffline)}
              onClick={handleSyncClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-display font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              <RefreshCw
                className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`}
              />
              <span>
                {isSyncing ? "Menyinkronkan..." : "Sinkronkan Semua Sekarang"}
              </span>
            </button>
          </div>
        </div>

        {/* Sync Success Notification Toast */}
        {syncSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>
              Semua antrean lokal berhasil disinkronkan ke server cloud!
            </span>
          </div>
        )}

        {/* Connectivity Diagnostics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Real-time Connection State */}
          <div
            className={`p-5 rounded-3xl border transition-all ${
              isOnline
                ? "bg-white border-emerald-200 shadow-xs"
                : "bg-amber-50/70 border-amber-200 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Status Konektivitas
              </span>
              <div
                className={`size-3 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`size-12 rounded-2xl flex items-center justify-center ${
                  isOnline
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isOnline ? (
                  <Wifi className="size-6" />
                ) : (
                  <WifiOff className="size-6" />
                )}
              </div>

              <div>
                <h4 className="font-display font-black text-lg text-brand-green-950">
                  {isOnline ? "Tersambung (Online)" : "Terputus (Offline)"}
                </h4>
                <p className="text-[11px] text-neutral-500">
                  {isOnline
                    ? "API Server cloud siap menerima data transaksi."
                    : "Antrean lokal aktif menyimpan transaksi."}
                </p>
              </div>
            </div>

            {/* Toggle Simulate Offline for Testing */}
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-600 font-semibold">
                Simulasi Mode Offline:
              </span>
              <button
                type="button"
                onClick={onToggleSimulateOffline}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  isSimulatedOffline
                    ? "bg-amber-500 text-white"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                }`}
              >
                {isSimulatedOffline ? "Mode Simulasi Aktif" : "Uji Offline"}
              </button>
            </div>
          </div>

          {/* Pending Queue Count */}
          <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Antrean Pending
              </span>
              <Database className="size-4 text-brand-green-800" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-brand-green-950">
                {pendingCount}
              </span>
              <span className="text-xs font-medium text-neutral-400">
                transaksi menunggu
              </span>
            </div>

            <p className="text-[11px] text-neutral-500 mt-2">
              {pendingCount > 0
                ? "Akan otomatis di-push ke server begitu koneksi internet pulih."
                : "Semua transaksi lokal telah terkirim rapi ke database."}
            </p>
          </div>

          {/* Synced Count */}
          <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Total Tersinkron
              </span>
              <ShieldCheck className="size-4 text-emerald-600" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-emerald-800">
                {syncedCount}
              </span>
              <span className="text-xs font-medium text-neutral-400">
                transaksi aman
              </span>
            </div>

            <p className="text-[11px] text-neutral-500 mt-2">
              Tercatat di PostgreSQL server dengan idempotency UUID unik.
            </p>
          </div>
        </div>

        {/* Technical Architecture Badge Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-brand-cream-100 border border-brand-green-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-2xl bg-brand-green-900 text-brand-yellow-400 flex items-center justify-center shrink-0">
              <Zap className="size-5" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-sm text-brand-green-950">
                Idempotent Sync & Local-First Resilience
              </h4>
              <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed max-w-2xl">
                Sistem MacMood POS menggunakan Client-Side UUID v4 sebagai
                Primary Key pesanan. Jika koneksi terputus lalu tersambung
                kembali, pengiriman transaksi berulang dijamin aman tanpa risiko
                pencatatan ganda (*no double recording*).
              </p>
            </div>
          </div>
        </div>

        {/* Local Sync Queue Table */}
        <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-display font-extrabold text-base text-brand-green-950">
              Daftar Antrean Transaksi di Perangkat Ini
            </h3>
            <span className="text-xs text-neutral-500">
              IndexedDB / Local Storage Buffer
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-cream-50/70 border-b border-neutral-200/80 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Waktu Dibuat (Lokal)</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Percobaan</th>
                  <th className="py-3 px-4 text-center">Status Sinkron</th>
                  <th className="py-3 px-4">Waktu Sinkron Cloud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {syncQueue.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-brand-cream-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                      {item.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">
                      {item.createdAt}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-700">
                        {item.paymentMethod === "CASH"
                          ? "Tunai"
                          : "QRIS Manual"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-brand-green-900">
                      {formatRupiah(item.total)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-500">
                      {item.retryCount}x
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.syncStatus === "SYNCED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {item.syncStatus === "SYNCED"
                          ? "✓ Tersinkron"
                          : "Antrean Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                      {item.syncedAt || "Menunggu koneksi..."}
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
