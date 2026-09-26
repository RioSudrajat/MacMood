import { Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  FileText,
  WalletCards,
  RefreshCw,
  Bell,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

export type PosTab = "pos" | "orders" | "shift" | "sync" | "notifications";

interface PosSidebarProps {
  activeTab: PosTab;
  onTabChange: (tab: PosTab) => void;
  cartItemCount: number;
  orderCount: number;
  isShiftOpen: boolean;
  pendingSyncCount: number;
  unreadNotifCount?: number;
  cashierName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onLockScreen?: () => void;
  isOwner?: boolean;
}

export function PosSidebar({
  activeTab,
  onTabChange,
  cartItemCount,
  orderCount,
  isShiftOpen,
  pendingSyncCount,
  unreadNotifCount = 2,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
  onLockScreen,
  isOwner = false,
}: PosSidebarProps) {
  const navItems = [
    {
      id: "pos" as const,
      label: "Katalog & Pesanan",
      subLabel: "Alur kasir & transaksi cepat",
      icon: ShoppingBag,
      badge: cartItemCount > 0 ? `${cartItemCount} item` : null,
      badgeColor: "bg-brand-yellow-400 text-brand-green-950 font-bold",
    },
    {
      id: "orders" as const,
      label: "Riwayat & Antrean",
      subLabel: "Nota & antrean hari ini",
      icon: FileText,
      badge: orderCount > 0 ? `${orderCount}` : null,
      badgeColor: "bg-neutral-200 text-neutral-800 font-bold",
    },
    {
      id: "shift" as const,
      label: "Kas Cabang",
      subLabel: "Laci kas & rekonsiliasi",
      icon: WalletCards,
      badge: isShiftOpen ? "Buka" : "Tutup",
      badgeColor: isShiftOpen
        ? "bg-brand-green-900/10 text-brand-green-950 font-bold"
        : "bg-neutral-200 text-neutral-600",
    },
    {
      id: "sync" as const,
      label: "Status Sinkronisasi",
      subLabel: "Antrean offline & server",
      icon: RefreshCw,
      badge: pendingSyncCount > 0 ? `${pendingSyncCount}` : "OK",
      badgeColor:
        pendingSyncCount > 0
          ? "bg-brand-yellow-500/20 text-brand-yellow-700 font-bold"
          : "bg-brand-green-900/10 text-brand-green-950 font-bold",
    },
    {
      id: "notifications" as const,
      label: "Notifikasi Outlet",
      subLabel: "Pemberitahuan & sistem",
      icon: Bell,
      badge: unreadNotifCount > 0 ? `${unreadNotifCount} baru` : null,
      badgeColor: "bg-brand-coral-500/10 text-brand-coral-600 font-bold",
    },
  ];

  const sidebarInner = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div
        className={`flex flex-col h-full bg-white border-r border-brand-green-900/10 text-neutral-800 relative transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Floating Collapse / Expand Button on right border (Desktop only) */}
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3.5 top-6 z-30 size-7 rounded-full bg-brand-green-950 hover:bg-brand-green-900 text-brand-yellow-400 items-center justify-center shadow-md cursor-pointer border-2 border-white transition-transform hover:scale-110"
            aria-label={collapsed ? "Buka Navigasi" : "Sembunyikan Navigasi"}
            title={collapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        )}

        {/* Brand / Logo Header */}
        <div
          className={`p-4 border-b border-brand-green-900/10 flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/macmood-logo.png"
              alt="MacMood Logo"
              className="size-10 rounded-2xl object-cover shadow-2xs border border-brand-green-900/20 flex-shrink-0"
            />
            {!collapsed && (
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-display font-extrabold text-base tracking-wider text-brand-green-950 truncate">
                  MACMOOD
                </span>
                <span className="text-[10px] font-bold text-brand-green-800 uppercase tracking-widest truncate">
                  Kasir & POS
                </span>
              </div>
            )}
          </div>

          {/* Close button for Mobile Drawer */}
          {isMobile && (
            <button
              type="button"
              onClick={onMobileClose}
              className="size-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors"
              aria-label="Tutup Menu"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (collapsed) {
              return (
                <div
                  key={item.id}
                  className="relative group flex justify-center"
                >
                  <button
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`size-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                      isActive
                        ? "bg-brand-green-900/10 text-brand-green-950 shadow-2xs border border-brand-green-900/20"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                    }`}
                    title={item.label}
                  >
                    {/* Active vertical pill indicator on left edge (Reference Image 4) */}
                    {isActive && (
                      <span className="absolute -left-3 top-2.5 bottom-2.5 w-1.5 rounded-r-full bg-brand-yellow-400" />
                    )}
                    <Icon className="size-5" />

                    {/* Unread badge dot */}
                    {item.id === "notifications" && unreadNotifCount > 0 && (
                      <span className="absolute top-2 right-2 size-2 rounded-full bg-brand-coral-500 ring-2 ring-white" />
                    )}
                  </button>

                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-md">
                    {item.label}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  if (isMobile) onMobileClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer text-left relative ${
                  isActive
                    ? "bg-brand-green-900/10 text-brand-green-950 border border-brand-green-900/20 shadow-2xs font-bold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {/* Active vertical pill indicator on left edge (Reference Image 4) */}
                {isActive && (
                  <span className="absolute -left-3 top-2.5 bottom-2.5 w-1.5 rounded-r-full bg-brand-yellow-400" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? "bg-brand-green-950 text-brand-yellow-400"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 block truncate mt-0.5">
                      {item.subLabel}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] flex-shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Role Switcher & Sign Out */}
        <div className="p-3 border-t border-brand-green-900/10 space-y-2">
          {/* Lock Screen / Ganti Kasir (Fast PIN) */}
          {onLockScreen &&
            (collapsed ? (
              <div className="flex justify-center group relative">
                <button
                  type="button"
                  onClick={onLockScreen}
                  className="size-11 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 flex items-center justify-center transition-colors cursor-pointer"
                  title="Kunci Layar / Ganti Kasir"
                >
                  <Lock className="size-4.5" />
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  Kunci Layar (PIN)
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLockScreen}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Lock className="size-4 text-amber-700 flex-shrink-0" />
                  <span className="text-xs font-bold truncate">
                    Kunci Layar / PIN
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                  Lock
                </span>
              </button>
            ))}

          {/* Switch to Owner Dashboard (Only visible for Owner/Admin role) */}
          {isOwner &&
            (collapsed ? (
              <div className="flex justify-center group relative">
                <Link
                  to="/admin"
                  className="size-11 rounded-2xl bg-neutral-100 hover:bg-brand-cream-100 text-neutral-700 hover:text-brand-green-950 flex items-center justify-center transition-colors cursor-pointer"
                  title="Dashboard Owner"
                >
                  <ShieldCheck className="size-5" />
                </Link>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  Dashboard Owner
                </div>
              </div>
            ) : (
              <Link
                to="/admin"
                className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-50 hover:bg-brand-cream-100 text-neutral-700 hover:text-brand-green-950 border border-neutral-200/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="size-4 text-brand-green-800 flex-shrink-0" />
                  <span className="text-xs font-bold truncate">
                    Dashboard Owner
                  </span>
                </div>
                <ArrowUpRight className="size-3.5 text-neutral-400" />
              </Link>
            ))}

          {/* Sign Out Button (User requested: "lalu sign out juga diletakkan di sidebar") */}
          <div className={collapsed ? "flex justify-center" : ""}>
            <SignOutButton variant="sidebar" collapsed={collapsed} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Collapsible Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 h-full relative z-20">
        {sidebarInner(false)}
      </aside>

      {/* Mobile Slide-in Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-brand-green-950/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarInner(true)}
          </div>
        </div>
      )}
    </>
  );
}
