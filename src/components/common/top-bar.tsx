import { Bell, Menu, User } from "lucide-react";

interface TopBarProps {
  userName: string;
  roleLabel?: string;
  unreadNotifCount?: number;
  onOpenNotifications: () => void;
  onOpenMobileMenu: () => void;
  extraActions?: React.ReactNode;
}

export function TopBar({
  userName,
  roleLabel,
  unreadNotifCount = 2,
  onOpenNotifications,
  onOpenMobileMenu,
  extraActions,
}: TopBarProps) {
  return (
    <header className="bg-white border-b border-brand-green-900/10 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 z-10 flex-shrink-0">
      {/* Left side: Hamburger (Mobile) + Welcome & User Name (Reference Image 3) */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden size-9 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="size-5" />
        </button>

        {/* Welcome Text */}
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
            Welcome{roleLabel ? ` · ${roleLabel}` : ""}
          </span>
          <h2 className="font-display font-extrabold text-sm sm:text-base text-brand-green-950 truncate max-w-[200px] sm:max-w-xs">
            {userName}
          </h2>
        </div>
      </div>

      {/* Right side: Extra Actions (e.g. Status) + Notification Bell + User Avatar (Reference Image 3) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Optional Extra Context Badges (e.g. Shift / Online) */}
        {extraActions}

        {/* Notification Bell Button (Reference Image 3) */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="size-9 sm:size-10 rounded-full bg-neutral-100 hover:bg-brand-cream-100 text-neutral-700 hover:text-brand-green-950 flex items-center justify-center relative transition-colors cursor-pointer"
          aria-label="Buka Notifikasi Outlet"
          title="Notifikasi Outlet"
        >
          <Bell className="size-4.5" />
          {unreadNotifCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-amber-500 ring-2 ring-white" />
            </span>
          )}
        </button>

        {/* User Profile Avatar Circle (Reference Image 3) */}
        <div className="size-9 sm:size-10 rounded-full bg-brand-green-900 border-2 border-emerald-500/30 text-brand-yellow-400 flex items-center justify-center font-display font-bold text-xs sm:text-sm shadow-xs flex-shrink-0 cursor-default">
          {userName
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || <User className="size-4" />}
        </div>
      </div>
    </header>
  );
}
