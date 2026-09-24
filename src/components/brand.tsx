import { Link } from "@tanstack/react-router";

export function Brand({
  showSubtitle = true,
  className = "",
  size = "md",
}: {
  showSubtitle?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const imgSize = size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10";
  const titleSize = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${className}`}
      aria-label="MacMood POS - Beranda"
    >
      <img
        src="/assets/macmood-logo.png"
        alt="MacMood Logo"
        className={`${imgSize} rounded-xl object-cover shadow-xs border border-brand-green-800/20`}
      />
      <div className="flex flex-col leading-tight">
        <span className={`font-display font-extrabold tracking-wider text-brand-green-950 dark:text-brand-cream-50 ${titleSize}`}>
          MACMOOD
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-bold tracking-widest text-brand-green-700/80 dark:text-brand-cream-200/80 uppercase">
            Mac and cheese, made happy
          </span>
        )}
      </div>
    </Link>
  );
}
