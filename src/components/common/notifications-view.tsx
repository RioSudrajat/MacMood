import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  RefreshCw,
  WalletCards,
  CheckCheck,
  Trash2,
  ArrowRight,
  Filter,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  category: "order" | "stock" | "shift" | "system";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  priority: "HIGH" | "MEDIUM" | "NORMAL";
  actionLabel?: string;
  actionTab?: string;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    category: "order",
    title: "Pesanan Baru Masuk & Lunas",
    description:
      "Nota MAC-20260924-1005 senilai Rp 30.800 (Tunai) berhasil diproses kasir Budi Santoso.",
    timestamp: "5 menit yang lalu · 09:20 WIB",
    isRead: false,
    priority: "NORMAL",
    actionLabel: "Lihat Nota Transaksi",
    actionTab: "orders",
  },
  {
    id: "notif-2",
    category: "stock",
    title: "Peringatan Stok Porsi Kritis",
    description:
      "Stok Spicy Smokey Mac tersisa 14 porsi, berada di bawah batas minimum (20 porsi). Harap lakukan restock.",
    timestamp: "18 menit yang lalu · 09:07 WIB",
    isRead: false,
    priority: "HIGH",
    actionLabel: "Sesuaikan Stok Bahan",
    actionTab: "inventory",
  },
  {
    id: "notif-3",
    category: "shift",
    title: "Shift Pagi Kasir Dibuka",
    description:
      "Kasir Budi Santoso telah membuka shift baru dengan modal uang laci (cash float) Rp 300.000.",
    timestamp: "1 jam yang lalu · 08:00 WIB",
    isRead: true,
    priority: "NORMAL",
    actionLabel: "Cek Rekap Kas",
    actionTab: "shift",
  },
  {
    id: "notif-4",
    category: "system",
    title: "Sinkronisasi Offline Selesai",
    description:
      "Seluruh antrean nota offline lokal telah berhasil disinkronkan ke server cloud.",
    timestamp: "2 jam yang lalu · 07:15 WIB",
    isRead: true,
    priority: "NORMAL",
    actionLabel: "Periksa Antrean",
    actionTab: "sync",
  },
  {
    id: "notif-5",
    category: "stock",
    title: "Restock Bahan Masuk Dapur",
    description:
      "Owner Ahmad Fauzi mencatat penambahan 50 porsi Super Mac dari kiriman dapur pusat.",
    timestamp: "3 jam yang lalu · 06:30 WIB",
    isRead: true,
    priority: "MEDIUM",
    actionLabel: "Riwayat Mutasi",
    actionTab: "inventory",
  },
];

interface NotificationsViewProps {
  notifications?: NotificationItem[];
  onNavigateTab?: (tab: string) => void;
  onClose?: () => void;
}

export function NotificationsView({
  notifications: initialPropsNotifs,
  onNavigateTab,
  onClose,
}: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialPropsNotifs || INITIAL_NOTIFICATIONS,
  );
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "order" | "stock" | "shift" | "system"
  >("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)),
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (categoryFilter === "all") return true;
    return n.category === categoryFilter;
  });

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-green-900/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-green-800 uppercase tracking-widest mb-1">
            <Bell className="size-4" />
            <span>Pusat Notifikasi & Aktivitas</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-green-950">
            Pemberitahuan Outlet
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Dapatkan informasi terkini mengenai pesanan baru, batas stok
            menipis, pergantian shift, dan status sistem.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <CheckCheck className="size-3.5 text-brand-green-800" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAllNotifications}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Bersihkan</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold cursor-pointer"
            >
              Kembali
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1 mr-1">
          <Filter className="size-3.5" />
          Filter:
        </span>
        {[
          { id: "all", label: `Semua (${notifications.length})` },
          { id: "order", label: "Pesanan & Kasir" },
          { id: "stock", label: "Stok Bahan" },
          { id: "shift", label: "Shift Laci Kas" },
          { id: "system", label: "Sistem & Sync" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategoryFilter(tab.id as typeof categoryFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              categoryFilter === tab.id
                ? "bg-brand-green-900 text-white shadow-2xs"
                : "bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-brand-green-900/10 p-12 text-center space-y-3">
          <div className="size-14 rounded-2xl bg-brand-cream-100 text-brand-green-900 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-7" />
          </div>
          <h3 className="font-display font-extrabold text-base text-neutral-900">
            Tidak ada notifikasi aktif
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Semua aktivitas outlet telah dibaca dan berjalan normal tanpa
            kendala.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isOrder = notif.category === "order";
            const isStock = notif.category === "stock";
            const isShift = notif.category === "shift";

            return (
              <div
                key={notif.id}
                onClick={() => toggleRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !notif.isRead
                    ? "bg-white border-brand-green-900/20 shadow-xs ring-1 ring-brand-green-900/5"
                    : "bg-neutral-50/70 border-neutral-200 opacity-80"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Category Icon */}
                  <div
                    className={`size-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isStock
                        ? "bg-amber-100 text-amber-800"
                        : isOrder
                          ? "bg-emerald-100 text-emerald-800"
                          : isShift
                            ? "bg-blue-100 text-blue-800"
                            : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {isStock ? (
                      <AlertTriangle className="size-5" />
                    ) : isOrder ? (
                      <ShoppingBag className="size-5" />
                    ) : isShift ? (
                      <WalletCards className="size-5" />
                    ) : (
                      <RefreshCw className="size-5" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notif.isRead && (
                        <span className="size-2 rounded-full bg-amber-500 flex-shrink-0" />
                      )}
                      <h4 className="font-display font-bold text-sm text-neutral-900 truncate">
                        {notif.title}
                      </h4>
                      {notif.priority === "HIGH" && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                          Kritis
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {notif.description}
                    </p>
                    <span className="text-[10px] text-neutral-400 block pt-0.5">
                      {notif.timestamp}
                    </span>
                  </div>
                </div>

                {/* Optional Action Button */}
                {notif.actionLabel && onNavigateTab && notif.actionTab && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateTab(notif.actionTab!);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-cream-100 hover:bg-brand-cream-200 text-brand-green-950 font-bold text-xs transition-colors cursor-pointer flex-shrink-0 self-end sm:self-center"
                  >
                    <span>{notif.actionLabel}</span>
                    <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
