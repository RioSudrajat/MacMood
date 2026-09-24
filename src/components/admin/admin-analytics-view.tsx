import { useState } from "react";
import type { AdminDatePeriod, AdminProduct, ExpenseRecord } from "./types";
import { formatRupiah } from "@/components/pos/format";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Download,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  Clock,
  ArrowUpRight,
  Receipt,
  Wallet,
  Coins,
  Percent,
} from "lucide-react";
import type { CompletedOrder } from "@/components/pos/types";

interface AdminAnalyticsViewProps {
  orders?: CompletedOrder[];
  products?: AdminProduct[];
  expenses?: ExpenseRecord[];
}

export function AdminAnalyticsView({
  orders = [],
  products = [],
  expenses = [],
}: AdminAnalyticsViewProps = {}) {
  const [period, setPeriod] = useState<AdminDatePeriod>("today");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [exportNotice, setExportNotice] = useState(false);

  // Optional real-time order data mapping
  const paidOrders = orders.filter((o) => o.status === "PAID");
  const liveNetSales =
    paidOrders.length > 0 ? paidOrders.reduce((sum, o) => sum + o.total, 0) : null;
  const liveOrderCount = paidOrders.length > 0 ? paidOrders.length : null;
  const liveCash =
    paidOrders.length > 0
      ? paidOrders
          .filter((o) => o.paymentMethod === "CASH")
          .reduce((s, o) => s + o.total, 0)
      : null;
  const liveQris =
    paidOrders.length > 0
      ? paidOrders
          .filter((o) => o.paymentMethod === "QRIS_MANUAL")
          .reduce((s, o) => s + o.total, 0)
      : null;

  // Total daily expenses
  const totalTodayExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const todayNetSales = liveNetSales ?? 4120000;
  const todayCogs = Math.round(todayNetSales * 0.475); // ~47.5% modal bahan baku
  const todayGrossProfit = todayNetSales - todayCogs;
  const todayMargin = Math.round((todayGrossProfit / todayNetSales) * 1000) / 10;
  const todayExpenses = totalTodayExpenses > 0 ? totalTodayExpenses : 54000;
  const todayNetProfit = Math.max(0, todayGrossProfit - todayExpenses);

  // Metrics by Period
  const metricsData = {
    today: {
      label: "Hari Ini (24 Sep 2026)",
      netSales: todayNetSales,
      cogs: todayCogs,
      grossProfit: todayGrossProfit,
      grossMargin: todayMargin,
      operatingExpenses: todayExpenses,
      netProfit: todayNetProfit,
      orderCount: liveOrderCount ?? 162,
      aov: liveNetSales && liveOrderCount ? Math.round(liveNetSales / liveOrderCount) : 25432,
      cashRevenue: liveCash ?? 2420000,
      qrisRevenue: liveQris ?? 1700000,
      growth: "+14.2% vs kemarin",
    },
    week: {
      label: "7 Hari Terakhir",
      netSales: 28300000,
      cogs: 13584000,
      grossProfit: 14716000,
      grossMargin: 52.0,
      operatingExpenses: 345000,
      netProfit: 14371000,
      orderCount: 1115,
      aov: 25381,
      cashRevenue: 17100000,
      qrisRevenue: 11200000,
      growth: "+8.6% vs minggu lalu",
    },
    month: {
      label: "Bulan September 2026",
      netSales: 117550000,
      cogs: 56424000,
      grossProfit: 61126000,
      grossMargin: 52.0,
      operatingExpenses: 1450000,
      netProfit: 59676000,
      orderCount: 4680,
      aov: 25117,
      cashRevenue: 71200000,
      qrisRevenue: 46350000,
      growth: "+22.4% vs bulan lalu",
    },
    year: {
      label: "Tahun 2026",
      netSales: 418400000,
      cogs: 200832000,
      grossProfit: 217568000,
      grossMargin: 52.0,
      operatingExpenses: 5200000,
      netProfit: 212368000,
      orderCount: 16720,
      aov: 25023,
      cashRevenue: 254000000,
      qrisRevenue: 164400000,
      growth: "+35.1% YoY",
    },
  }[period];

  // Hourly Chart Data with Today vs Yesterday comparison
  const hourlyData = [
    { time: "08:00", todaySales: 240000, yestSales: 180000, todayOrders: 10, yestOrders: 7 },
    { time: "10:00", todaySales: 390000, yestSales: 310000, todayOrders: 16, yestOrders: 12 },
    { time: "12:00", todaySales: 850000, yestSales: 640000, todayOrders: 34, yestOrders: 26 }, // Peak Siang
    { time: "14:00", todaySales: 410000, yestSales: 380000, todayOrders: 17, yestOrders: 15 },
    { time: "16:00", todaySales: 520000, yestSales: 440000, todayOrders: 21, yestOrders: 18 },
    { time: "18:00", todaySales: 780000, yestSales: 690000, todayOrders: 31, yestOrders: 28 }, // Peak Malam
    { time: "20:00", todaySales: 620000, yestSales: 550000, todayOrders: 24, yestOrders: 22 },
    { time: "22:00", todaySales: 310000, yestSales: 280000, todayOrders: 12, yestOrders: 11 },
  ];

  // Calculate coordinates for smooth curved SVG Area Chart
  const svgWidth = 680;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 30;
  const padBottom = 35;
  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  const maxVal =
    chartMetric === "revenue"
      ? 1000000 // 1 Juta Rupiah skala atas
      : 40; // 40 Nota skala atas

  const getX = (idx: number) => padLeft + (idx / (hourlyData.length - 1)) * graphWidth;
  const getY = (val: number) => padTop + graphHeight - (Math.min(val, maxVal) / maxVal) * graphHeight;

  // Generate SVG smooth bezier curve path
  const createSmoothPath = (values: number[]) => {
    const points = values.map((val, idx) => ({ x: getX(idx), y: getY(val) }));
    if (points.length < 2) return "";

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const todayValues = hourlyData.map((d) => (chartMetric === "revenue" ? d.todaySales : d.todayOrders));
  const yestValues = hourlyData.map((d) => (chartMetric === "revenue" ? d.yestSales : d.yestOrders));

  const todayLinePath = createSmoothPath(todayValues);
  const yestLinePath = createSmoothPath(yestValues);
  const todayAreaPath = `${todayLinePath} L ${getX(hourlyData.length - 1)} ${padTop + graphHeight} L ${getX(0)} ${padTop + graphHeight} Z`;

  // Donut 1: Kategori Produk
  const categoryBreakdown = [
    { label: "Mac & Cheese", amount: 2585000, percentage: 62.7, color: "#065f46" }, // Emerald 800
    { label: "Sides & Katsu", amount: 865000, percentage: 21.0, color: "#d97706" }, // Amber 600
    { label: "Minuman Dingin", amount: 670000, percentage: 16.3, color: "#0284c7" }, // Sky 600
  ];

  // Donut 2: Kanal Pembayaran
  const paymentBreakdown = [
    { label: "Tunai (Cash)", amount: metricsData.cashRevenue, percentage: 58.7, color: "#10b981" }, // Emerald 500
    { label: "QRIS Outlet", amount: metricsData.qrisRevenue, percentage: 41.3, color: "#3b82f6" }, // Blue 500
  ];

  // Top Sellers Ranking
  const totalAllProductsRev =
    products.reduce((sum, p) => sum + p.soldCount * p.price, 0) || 1;

  const topProducts =
    products.length > 0
      ? [...products]
          .sort((a, b) => b.soldCount - a.soldCount)
          .slice(0, 6)
          .map((p, idx) => {
            const rev = p.soldCount * p.price;
            const share = Math.round((rev / totalAllProductsRev) * 1000) / 10;
            const marginVal =
              p.price > 0 ? Math.round(((p.price - p.costPrice) / p.price) * 1000) / 10 : 50;
            const colors = [
              "bg-emerald-600",
              "bg-emerald-700",
              "bg-sky-600",
              "bg-amber-600",
              "bg-amber-500",
              "bg-emerald-500",
            ];
            return {
              name: p.name,
              category: p.categoryLabel,
              sold: p.soldCount,
              revenue: rev,
              margin: `${marginVal}%`,
              color: colors[idx % colors.length],
              share,
            };
          })
      : [
          { name: "Super Mac", category: "Mac & Cheese", sold: 82, revenue: 1640000, margin: "52.5%", color: "bg-emerald-600", share: 39.8 },
          { name: "Potato Mac", category: "Mac & Cheese", sold: 45, revenue: 675000, margin: "53.3%", color: "bg-emerald-700", share: 16.4 },
          { name: "Es Lemon Tea Segar", category: "Minuman", sold: 68, revenue: 408000, margin: "70.0%", color: "bg-sky-600", share: 9.9 },
          { name: "Chicken Katsu Ala Carte", category: "Sides", sold: 32, revenue: 384000, margin: "46.2%", color: "bg-amber-600", share: 9.3 },
          { name: "Crispy French Fries", category: "Sides", sold: 51, revenue: 408000, margin: "56.0%", color: "bg-amber-500", share: 9.3 },
          { name: "Classic Mac", category: "Mac & Cheese", sold: 27, revenue: 270000, margin: "52.0%", color: "bg-emerald-500", share: 6.5 },
        ];

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8 bg-brand-cream-50/50 space-y-6">
      {/* Top Banner & Date Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-green-900/10">
        <div>
          <span className="text-xs font-bold text-brand-green-800 uppercase tracking-widest block flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-brand-yellow-500" />
            Executive Business Dashboard
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-green-950">
            Performa Finansial & Analitik Penjualan
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Visualisasi real-time omzet, laba kotor, HPP, efisiensi operasional, dan rekomendasi bisnis MacMood.
          </p>
        </div>

        {/* Action Buttons: Period Filter & Export CSV */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white p-1 rounded-2xl border border-neutral-200 shadow-2xs">
            {(["today", "week", "month", "year"] as AdminDatePeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === p
                    ? "bg-brand-green-900 text-white shadow-2xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                {p === "today"
                  ? "Hari Ini"
                  : p === "week"
                    ? "7 Hari"
                    : p === "month"
                      ? "Bulan Ini"
                      : "Tahun Ini"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-2xl border border-neutral-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0" />
          <span>Laporan analitik finansial periode {metricsData.label} berhasil diekspor ke format CSV.</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. ROW KPI FINANSIAL LENGKAP (6 KARTU STRATEGIS) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Omzet Bersih */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Omzet Bersih</span>
            <span className="size-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl lg:text-2xl text-brand-green-950 tracking-tight">
            {formatRupiah(metricsData.netSales)}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="size-3.5" />
            <span>{metricsData.growth}</span>
          </div>
        </div>

        {/* KPI 2: Total HPP (Cost of Goods Sold / Modal Bahan) */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Modal Bahan (HPP)</span>
            <span className="size-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Receipt className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl lg:text-2xl text-amber-950 tracking-tight">
            {formatRupiah(metricsData.cogs)}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            Rasio HPP: <strong className="text-neutral-700 font-bold">48.0%</strong> dari omzet
          </div>
        </div>

        {/* KPI 3: Laba Kotor & Gross Margin % */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-900 to-brand-green-950 text-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-brand-cream-100/70">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-yellow-400">Laba Kotor</span>
            <span className="size-8 rounded-xl bg-white/10 text-brand-yellow-400 flex items-center justify-center">
              <Coins className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl lg:text-2xl text-brand-yellow-400 tracking-tight">
            {formatRupiah(metricsData.grossProfit)}
          </div>
          <div className="text-[11px] text-brand-cream-100/90 font-medium flex items-center gap-1">
            <Percent className="size-3 text-brand-yellow-400" />
            <span>Margin Kotor: <strong className="text-white font-bold">{metricsData.grossMargin}%</strong></span>
          </div>
        </div>

        {/* KPI 4: Biaya Operasional & Estimasi Laba Bersih */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Biaya Kas Kecil</span>
            <span className="size-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Wallet className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl lg:text-2xl text-red-900 tracking-tight">
            {formatRupiah(metricsData.operatingExpenses)}
          </div>
          <div className="text-[11px] text-neutral-600 font-medium">
            Laba Bersih: <strong className="text-emerald-700 font-bold">{formatRupiah(metricsData.netProfit)}</strong>
          </div>
        </div>

        {/* KPI 5: Total Transaksi & AOV */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Total Transaksi</span>
            <span className="size-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl lg:text-2xl text-brand-green-950 tracking-tight">
            {metricsData.orderCount} <span className="text-xs font-normal text-neutral-500">nota</span>
          </div>
          <div className="text-[11px] text-neutral-600 font-medium truncate">
            AOV: <strong className="text-neutral-900 font-bold">{formatRupiah(metricsData.aov)}</strong>
          </div>
        </div>

        {/* KPI 6: Rekonsiliasi Kas Shift */}
        <div className="p-5 rounded-3xl bg-white border border-brand-green-900/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Kas Fisik Laci</span>
            <span className="size-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="font-display font-black text-xl lg:text-2xl text-emerald-700 tracking-tight">
            Rp0 <span className="text-xs font-semibold text-neutral-500">selisih</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Akurat Seimbang</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. INTERACTIVE CURVED AREA CHART (Tren Omzet vs Kemarin) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-display font-extrabold text-lg text-brand-green-950">
                Tren Volume Penjualan & Trafik Pesanan
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Visualisasi kurva pergerakan {chartMetric === "revenue" ? "omzet Rupiah" : "jumlah nota"} per jam hari ini vs kemarin.
            </p>
          </div>

          {/* Metric Selector & Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 rounded-full bg-emerald-600 inline-block" />
                <span className="text-emerald-950">Hari Ini</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-neutral-400 inline-block" />
                <span className="text-neutral-500">Kemarin</span>
              </div>
            </div>

            {/* Toggle Metric Button */}
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setChartMetric("revenue")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  chartMetric === "revenue"
                    ? "bg-white text-brand-green-950 shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Omzet (Rp)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("orders")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  chartMetric === "orders"
                    ? "bg-white text-brand-green-950 shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Nota (Qty)
              </button>
            </div>
          </div>
        </div>

        {/* SVG Curved Area Chart with Grid & Interactive Hover */}
        <div className="relative w-full overflow-x-auto pt-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-56 sm:h-64 select-none"
          >
            <defs>
              {/* Gradient for smooth emerald fill under the curve */}
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padTop + graphHeight * (1 - pct);
              const label =
                chartMetric === "revenue"
                  ? `${Math.round(pct * 1000)}rb`
                  : `${Math.round(pct * maxVal)}`;
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? "none" : "3 3"}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-neutral-400 font-mono font-medium"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Yesterday Dotted Curve */}
            <path
              d={yestLinePath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Today Area Fill */}
            <path d={todayAreaPath} fill="url(#areaGradient)" />

            {/* Today Solid Emerald Curve */}
            <path
              d={todayLinePath}
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points & X Axis Labels */}
            {hourlyData.map((d, idx) => {
              const cx = getX(idx);
              const cyToday = getY(chartMetric === "revenue" ? d.todaySales : d.todayOrders);
              const isHovered = hoveredPointIndex === idx;

              return (
                <g key={idx}>
                  {/* Vertical Guide Line on Hover */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={padTop}
                      x2={cx}
                      y2={padTop + graphHeight}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Circular Point */}
                  <circle
                    cx={cx}
                    cy={cyToday}
                    r={isHovered ? 6 : 4}
                    className="fill-white stroke-emerald-600 transition-all cursor-pointer"
                    strokeWidth={isHovered ? 3 : 2}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />

                  {/* X Axis Time Label */}
                  <text
                    x={cx}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className={`text-[11px] font-mono transition-colors ${
                      isHovered ? "fill-brand-green-950 font-bold" : "fill-neutral-500"
                    }`}
                  >
                    {d.time}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip Box */}
          {hoveredPointIndex !== null && (
            <div
              className="absolute top-4 bg-brand-green-950 text-white p-3 rounded-2xl shadow-xl border border-brand-green-800 text-xs pointer-events-none transition-all z-20 space-y-1"
              style={{
                left: `${Math.min(75, Math.max(15, (hoveredPointIndex / (hourlyData.length - 1)) * 100))}%`,
              }}
            >
              <div className="font-bold text-brand-yellow-400 flex items-center justify-between gap-4 pb-1 border-b border-white/10">
                <span>Pukul {hourlyData[hoveredPointIndex].time} WIB</span>
                <span className="text-[10px] text-brand-cream-100/70">Trafik Outlet</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-brand-cream-100/80">Hari Ini:</span>
                <strong className="text-white font-mono">
                  {chartMetric === "revenue"
                    ? formatRupiah(hourlyData[hoveredPointIndex].todaySales)
                    : `${hourlyData[hoveredPointIndex].todayOrders} nota`}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-400">Kemarin:</span>
                <strong className="text-neutral-300 font-mono">
                  {chartMetric === "revenue"
                    ? formatRupiah(hourlyData[hoveredPointIndex].yestSales)
                    : `${hourlyData[hoveredPointIndex].yestOrders} nota`}
                </strong>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold pt-1">
                +
                {Math.round(
                  ((hourlyData[hoveredPointIndex].todaySales - hourlyData[hoveredPointIndex].yestSales) /
                    hourlyData[hoveredPointIndex].yestSales) *
                    100
                )}
                % pertumbuhan vs kemarin
              </div>
            </div>
          )}
        </div>

        {/* Chart Summary Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-100 text-xs">
          <div className="p-3 bg-brand-cream-100/60 rounded-2xl">
            <span className="text-neutral-500 block text-[11px]">Jam Puncak Siang:</span>
            <strong className="text-brand-green-950 font-bold text-sm">12:00 - 13:00 WIB</strong>
            <span className="text-emerald-700 block text-[11px] font-medium">Rp 850.000 (34 transaksi)</span>
          </div>
          <div className="p-3 bg-brand-cream-100/60 rounded-2xl">
            <span className="text-neutral-500 block text-[11px]">Jam Puncak Malam:</span>
            <strong className="text-brand-green-950 font-bold text-sm">18:00 - 19:30 WIB</strong>
            <span className="text-emerald-700 block text-[11px] font-medium">Rp 780.000 (31 transaksi)</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-neutral-500 block text-[11px]">Kecepatan Layanan Kasir:</span>
            <strong className="text-emerald-950 font-bold text-sm">48 detik / nota</strong>
            <span className="text-emerald-700 block text-[11px] font-medium">Melebihi target SLA (&lt; 60 dtk)</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. ROW VISUAL DISTRIBUSI (2 DONUT CHARTS) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart 1: Komposisi Omzet per Kategori */}
        <div className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="size-5 text-brand-green-900" />
              <h3 className="font-display font-extrabold text-base text-brand-green-950">
                Distribusi Omzet per Kategori
              </h3>
            </div>
            <span className="text-xs text-neutral-500 font-medium">Katalog Menu</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative size-44 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                {/* Arc 1: Mac & Cheese (62.7%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#065f46"
                  strokeWidth="16"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.627)}
                />
                {/* Arc 2: Sides (21.0%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="16"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.21)}
                  style={{ transform: "rotate(225.7deg)", transformOrigin: "50% 50%" }}
                />
                {/* Arc 3: Minuman (16.3%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="16"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.163)}
                  style={{ transform: "rotate(301.3deg)", transformOrigin: "50% 50%" }}
                />
              </svg>
              {/* Center Info */}
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Total</span>
                <span className="text-xs font-display font-black text-brand-green-950">4.12 Jt</span>
              </div>
            </div>

            {/* Category Breakdown Details */}
            <div className="flex-1 w-full space-y-3">
              {categoryBreakdown.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <strong className="text-neutral-800">{cat.label}</strong>
                    </div>
                    <div className="text-right font-mono">
                      <strong className="text-neutral-900">{formatRupiah(cat.amount)}</strong>
                      <span className="text-[11px] text-neutral-500 ml-1.5 font-bold">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donut Chart 2: Komposisi Metode Pembayaran */}
        <div className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-brand-green-900" />
              <h3 className="font-display font-extrabold text-base text-brand-green-950">
                Kanal Penerimaan Pembayaran
              </h3>
            </div>
            <span className="text-xs text-neutral-500 font-medium">Tunai vs Cashless</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative size-44 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                {/* Arc: Tunai (58.7%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="16"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.587)}
                />
                {/* Arc: QRIS (41.3%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="16"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.413)}
                  style={{ transform: "rotate(211.3deg)", transformOrigin: "50% 50%" }}
                />
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Cashless</span>
                <span className="text-xs font-display font-black text-blue-700">41.3%</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="flex-1 w-full space-y-3.5">
              {paymentBreakdown.map((pay, i) => (
                <div key={i} className="p-3 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full flex-shrink-0" style={{ backgroundColor: pay.color }} />
                      <strong className="text-neutral-900">{pay.label}</strong>
                    </div>
                    <span className="font-bold text-neutral-700">{pay.percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-500">Nominal:</span>
                    <strong className="text-brand-green-950 font-bold">{formatRupiah(pay.amount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. SMART BUSINESS INSIGHTS & REKOMENDASI CEPAT (AI ACTIONABLE) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-brand-cream-100 to-amber-50 p-6 rounded-3xl border border-amber-200/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-xl bg-amber-400/20 text-amber-900 flex items-center justify-center font-bold">
              💡
            </span>
            <div>
              <h3 className="font-display font-extrabold text-base text-brand-green-950">
                Smart Business Insights & Rekomendasi Hari Ini
              </h3>
              <p className="text-xs text-neutral-600">
                Peluang peningkatan omzet, pencegahan bottleneck dapur, dan efisiensi margin bahan.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-bold bg-amber-200/60 text-amber-900 px-3 py-1 rounded-full">
            4 Insight Terdeteksi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Insight 1 */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200/50 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                Peluang Upselling
              </span>
              <ArrowUpRight className="size-4 text-blue-600" />
            </div>
            <h4 className="font-display font-bold text-sm text-neutral-900">
              Bundling Minuman Dingin
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Hanya <strong>32%</strong> pesanan Macaroni yang menyertakan minuman. Rekomendasikan promo Combo Hemat Mac + Lemon Tea untuk mendongkrak AOV sebesar +Rp4.000.
            </p>
          </div>

          {/* Insight 2 */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200/50 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="size-3" /> Puncak Trafik
              </span>
              <ArrowUpRight className="size-4 text-amber-600" />
            </div>
            <h4 className="font-display font-bold text-sm text-neutral-900">
              Antisipasi Rush Hour 12:00
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Puncak pesanan jam makan siang mencapai 34 nota/jam. Disarankan mulai *pre-cook* makaroni dan potongan chicken katsu pada pukul 11:30 WIB.
            </p>
          </div>

          {/* Insight 3 */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200/50 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Menu Bintang
              </span>
              <ArrowUpRight className="size-4 text-emerald-600" />
            </div>
            <h4 className="font-display font-bold text-sm text-neutral-900">
              Super Mac Terlaris (40%)
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Super Mac menyumbang omzet tertinggi (Rp 1.64 Jt) dengan margin kotor <strong>52.5%</strong>. Jaga konsistensi stok porsi katsu di angka minimal 25 porsi.
            </p>
          </div>

          {/* Insight 4 */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200/50 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                Kontrol Biaya
              </span>
              <ArrowUpRight className="size-4 text-red-600" />
            </div>
            <h4 className="font-display font-bold text-sm text-neutral-900">
              Kas Kecil Es Batu Rp30rb
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Pembelian darurat es batu laci kasir tercatat 2 kali minggu ini. Pertimbangkan penambahan freezer penyimpanan es agar beli dalam kuota grosir lebih hemat 20%.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. TOP SELLERS & MENU CONTRIBUTION (VISUAL RANKING) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-brand-green-900" />
            <h3 className="font-display font-extrabold text-base text-brand-green-950">
              Peringkat Kontribusi Menu Terlaris (Top Sellers)
            </h3>
          </div>
          <span className="text-xs text-neutral-500 font-medium">Berdasarkan Total Omzet</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topProducts.map((prod, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-neutral-100 hover:border-brand-green-900/20 bg-neutral-50/40 hover:bg-white transition-all space-y-2.5"
            >
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`size-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      idx === 0
                        ? "bg-amber-400 text-amber-950"
                        : idx === 1
                          ? "bg-neutral-300 text-neutral-900"
                          : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <strong className="font-display text-neutral-900 font-extrabold text-sm block">
                      {prod.name}
                    </strong>
                    <span className="text-[11px] text-neutral-500">{prod.category}</span>
                  </div>
                </div>

                <div className="text-right">
                  <strong className="text-brand-green-950 font-bold block">
                    {formatRupiah(prod.revenue)}
                  </strong>
                  <span className="text-[11px] text-neutral-500">
                    {prod.sold} porsi · Margin {prod.margin}
                  </span>
                </div>
              </div>

              {/* Progress bar kontribusi */}
              <div className="space-y-1">
                <div className="w-full h-2.5 rounded-full bg-neutral-200/70 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${prod.color}`}
                    style={{ width: `${Math.min(100, Math.max(4, prod.share))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                  <span>Kontribusi Penjualan</span>
                  <span className="font-bold text-neutral-800">{prod.share}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
