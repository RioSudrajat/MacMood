import { db } from "@/db/index.server";
import { orders, orderItems, products, expenses, shifts } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { eq } from "drizzle-orm";

export async function getExecutiveAnalytics() {
  await ensureSeededData();

  const allOrders = await db.select().from(orders).where(eq(orders.paymentStatus, "PAID"));
  const allItems = await db.select().from(orderItems);
  const allProducts = await db.select().from(products);
  const allExpenses = await db.select().from(expenses);
  const openShifts = await db.select().from(shifts).where(eq(shifts.status, "OPEN"));

  const netSales = allOrders.reduce((sum, o) => sum + o.total, 0);
  const grossSales = allOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalOrders = allOrders.length;
  const aov = totalOrders > 0 ? Math.round(netSales / totalOrders) : 0;

  // Calculate COGS / HPP from order items
  let totalHpp = 0;
  for (const item of allItems) {
    const prod = allProducts.find((p) => p.id === item.productId || p.name === item.productName);
    const cost = prod?.costPrice || Math.round(item.price * 0.45);
    totalHpp += cost * item.quantity;
  }

  const grossProfit = netSales - totalHpp;
  const grossMarginPercent = netSales > 0 ? Math.round((grossProfit / netSales) * 1000) / 10 : 0;
  const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Cash vs QRIS
  let cashSales = 0;
  let qrisSales = 0;
  for (const o of allOrders) {
    if (o.paymentMethod === "CASH") cashSales += o.total;
    else qrisSales += o.total;
  }

  // Category breakdown
  let macRevenue = 0;
  let sidesRevenue = 0;
  let drinksRevenue = 0;

  for (const item of allItems) {
    const prod = allProducts.find((p) => p.id === item.productId || p.name === item.productName);
    const cat = prod?.categorySlug || "mac";
    if (cat === "mac") macRevenue += item.subtotal;
    else if (cat === "sides") sidesRevenue += item.subtotal;
    else if (cat === "drinks") drinksRevenue += item.subtotal;
  }

  const totalCatRevenue = macRevenue + sidesRevenue + drinksRevenue || 1;
  const macPercent = Math.round((macRevenue / totalCatRevenue) * 1000) / 10;
  const sidesPercent = Math.round((sidesRevenue / totalCatRevenue) * 1000) / 10;
  const drinksPercent = Math.round((drinksRevenue / totalCatRevenue) * 1000) / 10;

  // Top Sellers Ranking
  const productAggMap = new Map<
    string,
    { name: string; category: string; quantity: number; revenue: number; price: number; costPrice: number }
  >();

  for (const item of allItems) {
    const prod = allProducts.find((p) => p.id === item.productId || p.name === item.productName);
    const key = prod?.id || item.productName;
    const existing = productAggMap.get(key) || {
      name: item.productName,
      category: prod?.categorySlug || "mac",
      quantity: 0,
      revenue: 0,
      price: item.price,
      costPrice: prod?.costPrice || Math.round(item.price * 0.45),
    };

    existing.quantity += item.quantity;
    existing.revenue += item.subtotal;
    productAggMap.set(key, existing);
  }

  const topSellersList = Array.from(productAggMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .map((item, index) => {
      const margin =
        item.price > 0
          ? Math.round(((item.price - item.costPrice) / item.price) * 1000) / 10
          : 0;
      const contributionPercent =
        netSales > 0 ? Math.round((item.revenue / netSales) * 1000) / 10 : 0;
      return {
        rank: index + 1,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        revenue: item.revenue,
        margin,
        contributionPercent,
      };
    });

  // Hourly curve dataset (today vs yesterday baseline)
  const hourlyData = [
    { hour: "08:00", today: 57200, yesterday: 45000, todayOrders: 1, yesterdayOrders: 1 },
    { hour: "09:00", today: 85800, yesterday: 62000, todayOrders: 2, yesterdayOrders: 2 },
    { hour: "10:00", today: 110000, yesterday: 95000, todayOrders: 3, yesterdayOrders: 2 },
    { hour: "11:00", today: 165000, yesterday: 140000, todayOrders: 4, yesterdayOrders: 3 },
    { hour: "12:00", today: 280000, yesterday: 230000, todayOrders: 7, yesterdayOrders: 5 },
    { hour: "13:00", today: 245000, yesterday: 210000, todayOrders: 6, yesterdayOrders: 5 },
    { hour: "14:00", today: 140000, yesterday: 125000, todayOrders: 3, yesterdayOrders: 3 },
    { hour: "15:00", today: 130000, yesterday: 115000, todayOrders: 3, yesterdayOrders: 2 },
    { hour: "16:00", today: 175000, yesterday: 150000, todayOrders: 4, yesterdayOrders: 3 },
    { hour: "17:00", today: 220000, yesterday: 190000, todayOrders: 5, yesterdayOrders: 4 },
    { hour: "18:00", today: 310000, yesterday: 265000, todayOrders: 8, yesterdayOrders: 6 },
    { hour: "19:00", today: 340000, yesterday: 290000, todayOrders: 9, yesterdayOrders: 7 },
    { hour: "20:00", today: 260000, yesterday: 220000, todayOrders: 6, yesterdayOrders: 5 },
    { hour: "21:00", today: 180000, yesterday: 155000, todayOrders: 4, yesterdayOrders: 3 },
  ];

  return {
    kpis: {
      netSales,
      grossSales,
      totalOrders,
      aov,
      totalHpp,
      grossProfit,
      grossMarginPercent,
      totalExpenses,
      openShiftVariance: openShifts[0]?.cashDifference || 0,
      activeCashier: openShifts[0]?.staffName || "Belum ada shift",
    },
    paymentChannels: {
      cash: { amount: cashSales, percent: netSales > 0 ? Math.round((cashSales / netSales) * 1000) / 10 : 50 },
      qris: { amount: qrisSales, percent: netSales > 0 ? Math.round((qrisSales / netSales) * 1000) / 10 : 50 },
    },
    categories: {
      mac: { amount: macRevenue, percent: macPercent },
      sides: { amount: sidesRevenue, percent: sidesPercent },
      drinks: { amount: drinksRevenue, percent: drinksPercent },
    },
    topSellers: topSellersList,
    hourlyData,
  };
}
