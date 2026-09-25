import { db } from "@/db/index.server";
import {
  categories,
  products,
  shifts,
  promos,
  rawMaterials,
  recipes,
  orders,
  orderItems,
  expenses,
  auditLogs,
} from "@/db/schema";
import { sql } from "drizzle-orm";

export async function ensureSeededData() {
  // Check if categories already seeded
  const existingCategories = await db.select({ count: sql<number>`count(*)::int` }).from(categories);
  if (existingCategories[0]?.count && existingCategories[0].count > 0) {
    // Keep category names and dedicated product images synchronized
    await db.update(categories).set({ name: "Add-on" }).where(sql`slug = 'sides'`);
    await db.update(categories).set({ name: "Minuman" }).where(sql`slug = 'drinks'`);
    await db.update(products).set({ imageUrl: "/assets/menu-chicken-katsu.png", categorySlug: "sides" }).where(sql`name = 'Chicken Katsu Ala Carte'`);
    await db.update(products).set({ imageUrl: "/assets/menu-french-fries.png", categorySlug: "sides" }).where(sql`name = 'Crispy French Fries'`);
    await db.update(products).set({ imageUrl: "/assets/menu-es-lemon-tea.png", categorySlug: "drinks" }).where(sql`name = 'Es Lemon Tea'`);
    await db.update(products).set({ imageUrl: "/assets/menu-es-teh-manis.png", categorySlug: "drinks" }).where(sql`name = 'Es Teh Manis'`);
    await db.update(products).set({ imageUrl: "/assets/menu-air-mineral.png", categorySlug: "drinks" }).where(sql`name = 'Air Mineral Botol'`);
    return;
  }

  // 1. Seed Categories
  const categoryRows = await db
    .insert(categories)
    .values([
      { slug: "mac", name: "Mac & Cheese", sortOrder: 1, isActive: true },
      { slug: "sides", name: "Add-on", sortOrder: 2, isActive: true },
      { slug: "drinks", name: "Minuman", sortOrder: 3, isActive: true },
    ])
    .returning();

  const macCat = categoryRows.find((c) => c.slug === "mac");
  const sidesCat = categoryRows.find((c) => c.slug === "sides");
  const drinksCat = categoryRows.find((c) => c.slug === "drinks");

  // 2. Seed Raw Materials
  const rawMatRows = await db
    .insert(rawMaterials)
    .values([
      { sku: "RM-MAC-01", name: "Makaroni Elbow Kering", category: "STAPLE", unit: "kg", currentStock: "25.0", minStock: "5.0", costPerUnit: 22000, supplierName: "CV Pangan Makmur" },
      { sku: "RM-CHS-01", name: "Keju Cheddar Olahan", category: "DAIRY", unit: "kg", currentStock: "12.0", minStock: "3.0", costPerUnit: 68000, supplierName: "PT Sumber Dairy Sejahtera" },
      { sku: "RM-CHS-02", name: "Keju Mozzarella Grated", category: "DAIRY", unit: "kg", currentStock: "7.0", minStock: "2.0", costPerUnit: 95000, supplierName: "PT Sumber Dairy Sejahtera" },
      { sku: "RM-CRM-01", name: "Cooking Cream Cair", category: "DAIRY", unit: "ml", currentStock: "10000.0", minStock: "2000.0", costPerUnit: 48, supplierName: "PT Fonterra Dairy" },
      { sku: "RM-CKN-01", name: "Dada Ayam Fillet Boneless", category: "MEAT", unit: "kg", currentStock: "15.0", minStock: "4.0", costPerUnit: 52000, supplierName: "Rumah Potong Unggas Berkah" },
      { sku: "RM-POT-01", name: "Kentang Fries Shoestring", category: "STAPLE", unit: "kg", currentStock: "18.0", minStock: "4.0", costPerUnit: 32000, supplierName: "CV Frozen Food Prima" },
      { sku: "RM-TEA-01", name: "Daun Teh Hitam Melati", category: "BEVERAGE", unit: "g", currentStock: "2000.0", minStock: "500.0", costPerUnit: 35, supplierName: "Kebun Teh Puncak Sari" },
      { sku: "RM-LMN-01", name: "Sari Buah Lemon Murni", category: "BEVERAGE", unit: "ml", currentStock: "3000.0", minStock: "1000.0", costPerUnit: 45, supplierName: "Petani Lemon Lembang" },
      { sku: "RM-BOX-01", name: "Paper Box MacMood 500ml", category: "PACKAGING", unit: "pcs", currentStock: "350.0", minStock: "100.0", costPerUnit: 850, supplierName: "Percetakan Karton Indah" },
      { sku: "RM-UTN-01", name: "Sendok Garpu Kayu Steril", category: "PACKAGING", unit: "pcs", currentStock: "420.0", minStock: "100.0", costPerUnit: 250, supplierName: "Eco Packaging Nusantara" },
    ])
    .returning();

  const getRm = (sku: string) => rawMatRows.find((r) => r.sku === sku)?.id;

  // 3. Seed Products
  const productRows = await db
    .insert(products)
    .values([
      {
        name: "Super Mac",
        categoryId: macCat?.id,
        categorySlug: "mac",
        description: "Makaroni keju creamy + chicken katsu + kentang renyah.",
        price: 20000,
        costPrice: 9500,
        imageUrl: "/assets/menu-super-mac-reference.png",
        badge: "BEST SELLER",
        isAvailable: true,
        trackStock: true,
        currentStock: 45,
      },
      {
        name: "Potato Mac",
        categoryId: macCat?.id,
        categorySlug: "mac",
        description: "Makaroni keju creamy bertabur kentang goreng gurih.",
        price: 15000,
        costPrice: 7200,
        imageUrl: "/assets/menu-potato-mac-reference.png",
        badge: "POPULAR",
        isAvailable: true,
        trackStock: true,
        currentStock: 38,
      },
      {
        name: "Classic Mac",
        categoryId: macCat?.id,
        categorySlug: "mac",
        description: "Comfort food klasik makaroni dengan lelehan saus keju lembut.",
        price: 10000,
        costPrice: 4800,
        imageUrl: "/assets/menu-classic-mac-reference.png",
        isAvailable: true,
        trackStock: true,
        currentStock: 50,
      },
      {
        name: "Spicy Smokey Mac",
        categoryId: macCat?.id,
        categorySlug: "mac",
        description: "Makaroni saus keju dengan aroma smoky dan sensasi pedas mantap.",
        price: 18000,
        costPrice: 8600,
        imageUrl: "/assets/menu-super-mac-reference.png",
        badge: "SPICY",
        isAvailable: true,
        trackStock: true,
        currentStock: 22,
      },
      {
        name: "Chicken Katsu Ala Carte",
        categoryId: sidesCat?.id,
        categorySlug: "sides",
        description: "Fillet dada ayam krispi berbalut tepung roti renyah keemasan.",
        price: 12000,
        costPrice: 5800,
        imageUrl: "/assets/menu-chicken-katsu.png",
        isAvailable: true,
        trackStock: true,
        currentStock: 30,
      },
      {
        name: "Crispy French Fries",
        categoryId: sidesCat?.id,
        categorySlug: "sides",
        description: "Kentang goreng renyah gurih dengan garam laut halus.",
        price: 8000,
        costPrice: 3800,
        imageUrl: "/assets/menu-french-fries.png",
        isAvailable: true,
        trackStock: true,
        currentStock: 40,
      },
      {
        name: "Es Lemon Tea",
        categoryId: drinksCat?.id,
        categorySlug: "drinks",
        description: "Teh perasan lemon segar asam-manis penghilang dahaga.",
        price: 6000,
        costPrice: 2100,
        imageUrl: "/assets/menu-es-lemon-tea.png",
        isAvailable: true,
        trackStock: true,
        currentStock: 60,
      },
      {
        name: "Es Teh Manis",
        categoryId: drinksCat?.id,
        categorySlug: "drinks",
        description: "Teh melati wangi dingin manis khas MacMood.",
        price: 4000,
        costPrice: 1200,
        imageUrl: "/assets/menu-es-teh-manis.png",
        isAvailable: true,
        trackStock: true,
        currentStock: 80,
      },
      {
        name: "Air Mineral Botol",
        categoryId: drinksCat?.id,
        categorySlug: "drinks",
        description: "Air mineral higienis dingin 600ml.",
        price: 3000,
        costPrice: 1500,
        imageUrl: "/assets/menu-air-mineral.png",
        isAvailable: true,
        trackStock: true,
        currentStock: 50,
      },
    ])
    .returning();

  // 4. Seed Recipes (BOM)
  const superMac = productRows.find((p) => p.name === "Super Mac");
  const potatoMac = productRows.find((p) => p.name === "Potato Mac");
  const classicMac = productRows.find((p) => p.name === "Classic Mac");

  const recipeList = [];
  if (superMac) {
    const rmMak = getRm("RM-MAC-01");
    const rmChd = getRm("RM-CHS-01");
    const rmMoz = getRm("RM-CHS-02");
    const rmCrm = getRm("RM-CRM-01");
    const rmCkn = getRm("RM-CKN-01");
    const rmPot = getRm("RM-POT-01");
    const rmBox = getRm("RM-BOX-01");

    if (rmMak) recipeList.push({ productId: superMac.id, rawMaterialId: rmMak, amount: "80.0", unit: "g" });
    if (rmChd) recipeList.push({ productId: superMac.id, rawMaterialId: rmChd, amount: "35.0", unit: "g" });
    if (rmMoz) recipeList.push({ productId: superMac.id, rawMaterialId: rmMoz, amount: "25.0", unit: "g" });
    if (rmCrm) recipeList.push({ productId: superMac.id, rawMaterialId: rmCrm, amount: "40.0", unit: "ml" });
    if (rmCkn) recipeList.push({ productId: superMac.id, rawMaterialId: rmCkn, amount: "60.0", unit: "g" });
    if (rmPot) recipeList.push({ productId: superMac.id, rawMaterialId: rmPot, amount: "40.0", unit: "g" });
    if (rmBox) recipeList.push({ productId: superMac.id, rawMaterialId: rmBox, amount: "1.0", unit: "pcs" });
  }

  if (potatoMac) {
    const rmMak = getRm("RM-MAC-01");
    const rmChd = getRm("RM-CHS-01");
    const rmPot = getRm("RM-POT-01");
    const rmBox = getRm("RM-BOX-01");

    if (rmMak) recipeList.push({ productId: potatoMac.id, rawMaterialId: rmMak, amount: "80.0", unit: "g" });
    if (rmChd) recipeList.push({ productId: potatoMac.id, rawMaterialId: rmChd, amount: "35.0", unit: "g" });
    if (rmPot) recipeList.push({ productId: potatoMac.id, rawMaterialId: rmPot, amount: "60.0", unit: "g" });
    if (rmBox) recipeList.push({ productId: potatoMac.id, rawMaterialId: rmBox, amount: "1.0", unit: "pcs" });
  }

  if (classicMac) {
    const rmMak = getRm("RM-MAC-01");
    const rmChd = getRm("RM-CHS-01");
    const rmBox = getRm("RM-BOX-01");

    if (rmMak) recipeList.push({ productId: classicMac.id, rawMaterialId: rmMak, amount: "80.0", unit: "g" });
    if (rmChd) recipeList.push({ productId: classicMac.id, rawMaterialId: rmChd, amount: "45.0", unit: "g" });
    if (rmBox) recipeList.push({ productId: classicMac.id, rawMaterialId: rmBox, amount: "1.0", unit: "pcs" });
  }

  if (recipeList.length > 0) {
    await db.insert(recipes).values(recipeList);
  }

  // 5. Seed Promos
  await db.insert(promos).values([
    {
      code: "MACMOOD10",
      name: "Promo Opening Mac & Cheese 10%",
      description: "Diskon 10% s.d Rp 10.000 untuk minimal belanja Rp 30.000.",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscount: 10000,
      minSubtotal: 30000,
      maxUsage: 100,
      currentUsage: 42,
      isActive: true,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-10-31"),
    },
    {
      code: "HEMAT5K",
      name: "Potongan Langsung 5 Ribu",
      description: "Potongan Rp 5.000 tanpa syarat batas maksimal.",
      discountType: "FIXED",
      discountValue: 5000,
      minSubtotal: 25000,
      maxUsage: 150,
      currentUsage: 89,
      isActive: true,
      startDate: new Date("2026-09-10"),
      endDate: new Date("2026-10-15"),
    },
    {
      code: "JUMATBERKAH",
      name: "Jumat Berkah Diskon 15%",
      description: "Diskon 15% setiap hari Jumat untuk semua varian mac.",
      discountType: "PERCENTAGE",
      discountValue: 15,
      maxDiscount: 15000,
      minSubtotal: 40000,
      maxUsage: 50,
      currentUsage: 35,
      isActive: true,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-31"),
    },
    {
      code: "BFFCOMBO",
      name: "Combo Sahabat Hemat 12 Ribu",
      description: "Diskon Rp 12.000 untuk pembelian bundling porsi besar.",
      discountType: "FIXED",
      discountValue: 12000,
      minSubtotal: 60000,
      maxUsage: 80,
      currentUsage: 28,
      isActive: true,
      startDate: new Date("2026-09-15"),
      endDate: new Date("2026-10-30"),
    },
    {
      code: "PELAJAR15",
      name: "Diskon Khusus Pelajar & Mahasiswa",
      description: "Tunjukkan kartu pelajar untuk diskon 15%.",
      discountType: "PERCENTAGE",
      discountValue: 15,
      maxDiscount: 8000,
      minSubtotal: 20000,
      maxUsage: 200,
      currentUsage: 165,
      isActive: true,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-11-30"),
    },
    {
      code: "FLASHDEAL8K",
      name: "Flash Deal Happy Hour",
      description: "Potongan Rp 8.000 pada jam sepi 14:00 - 16:00.",
      discountType: "FIXED",
      discountValue: 8000,
      minSubtotal: 35000,
      maxUsage: 100,
      currentUsage: 60,
      isActive: false,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-09-20"),
    },
  ]);

  // 6. Seed Initial Shift
  const [activeShift] = await db
    .insert(shifts)
    .values([
      {
        shiftCode: "SHIFT-20260924-01",
        staffName: "Budi Santoso",
        initialCash: 150000,
        cashSales: 143000,
        qrisSales: 80300,
        totalOrders: 5,
        expectedCash: 293000,
        status: "OPEN",
        isVerified: false,
        notes: "Shift pagi beroperasi normal.",
      },
    ])
    .returning();

  // 7. Seed Initial Completed Orders
  const initialOrdersData = [
    {
      id: "ord-101",
      orderNumber: "MAC-20260924-1001",
      shiftId: activeShift?.id,
      cashierName: "Budi Santoso",
      customerName: "Pelanggan",
      subtotal: 52000,
      discount: 0,
      tax: 5200,
      total: 57200,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      amountTendered: 100000,
      changeAmount: 42800,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-24T08:14:00+07:00"),
      items: [
        { productName: "Super Mac", quantity: 2, price: 20000, subtotal: 40000, notes: "Extra saus keju" },
        { productName: "Es Lemon Tea", quantity: 2, price: 6000, subtotal: 12000 },
      ],
    },
    {
      id: "ord-102",
      orderNumber: "MAC-20260924-1002",
      shiftId: activeShift?.id,
      cashierName: "Budi Santoso",
      customerName: "Pelanggan",
      subtotal: 31000,
      discount: 0,
      tax: 3100,
      total: 34100,
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      amountTendered: 34100,
      changeAmount: 0,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-24T08:28:00+07:00"),
      items: [
        { productName: "Potato Mac", quantity: 1, price: 15000, subtotal: 15000 },
        { productName: "Chicken Katsu Ala Carte", quantity: 1, price: 12000, subtotal: 12000 },
        { productName: "Es Teh Manis", quantity: 1, price: 4000, subtotal: 4000 },
      ],
    },
    {
      id: "ord-103",
      orderNumber: "MAC-20260924-1003",
      shiftId: activeShift?.id,
      cashierName: "Budi Santoso",
      customerName: "Pelanggan",
      subtotal: 50000,
      discount: 0,
      tax: 5000,
      total: 55000,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      amountTendered: 60000,
      changeAmount: 5000,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-24T08:45:00+07:00"),
      items: [
        { productName: "Spicy Smokey Mac", quantity: 2, price: 18000, subtotal: 36000, notes: "Level pedas maksimal" },
        { productName: "Crispy French Fries", quantity: 1, price: 8000, subtotal: 8000 },
        { productName: "Air Mineral Botol", quantity: 2, price: 3000, subtotal: 6000 },
      ],
    },
    {
      id: "ord-104",
      orderNumber: "MAC-20260924-1004",
      shiftId: activeShift?.id,
      cashierName: "Budi Santoso",
      customerName: "Pelanggan",
      subtotal: 42000,
      discount: 0,
      tax: 4200,
      total: 46200,
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      amountTendered: 46200,
      changeAmount: 0,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-24T09:05:00+07:00"),
      items: [
        { productName: "Classic Mac", quantity: 3, price: 10000, subtotal: 30000 },
        { productName: "Es Teh Manis", quantity: 3, price: 4000, subtotal: 12000 },
      ],
    },
    {
      id: "ord-105",
      orderNumber: "MAC-20260924-1005",
      shiftId: activeShift?.id,
      cashierName: "Budi Santoso",
      customerName: "Pelanggan",
      subtotal: 28000,
      discount: 0,
      tax: 2800,
      total: 30800,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      amountTendered: 50000,
      changeAmount: 19200,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-24T09:20:00+07:00"),
      items: [
        { productName: "Super Mac", quantity: 1, price: 20000, subtotal: 20000 },
        { productName: "Crispy French Fries", quantity: 1, price: 8000, subtotal: 8000 },
      ],
    },
  ];

  for (const o of initialOrdersData) {
    const { items, ...orderData } = o;
    await db.insert(orders).values(orderData);
    await db.insert(orderItems).values(
      items.map((it) => ({
        orderId: orderData.id,
        productName: it.productName,
        price: it.price,
        quantity: it.quantity,
        subtotal: it.subtotal,
        notes: it.notes,
      })),
    );
  }

  // 8. Seed Expenses
  await db.insert(expenses).values([
    {
      title: "Es Batu Kristal Higienis 2 Bal",
      amount: 24000,
      category: "INGREDIENT",
      paymentSource: "CASH_DRAWER",
      staffName: "Budi Santoso",
      receiptNumber: "NOTA-ES-882",
      notes: "Kebutuhan es batu mendesak untuk es teh manis saat siang terik.",
      createdAt: new Date("2026-09-24T10:15:00+07:00"),
    },
    {
      title: "Isi Ulang Gas LPG 3kg (2 Tabung)",
      amount: 46000,
      category: "UTILITY",
      paymentSource: "CASH_DRAWER",
      staffName: "Budi Santoso",
      receiptNumber: "GAS-PLG-091",
      notes: "Penggantian tabung kompor memasak makaroni dan deep fry katsu.",
      createdAt: new Date("2026-09-24T11:30:00+07:00"),
    },
    {
      title: "Kantong Kresek Takeaway Ramah Lingkungan",
      amount: 35000,
      category: "PACKAGING",
      paymentSource: "CASH_DRAWER",
      staffName: "Budi Santoso",
      receiptNumber: "INV-PLASTIK-44",
      notes: "1 pack ukuran sedang untuk take-away pesanan pelanggan.",
      createdAt: new Date("2026-09-24T13:00:00+07:00"),
    },
    {
      title: "Sabun Cuci Piring & Spons Dapur 1 Liter",
      amount: 19000,
      category: "OPERATIONAL",
      paymentSource: "CASH_DRAWER",
      staffName: "Budi Santoso",
      receiptNumber: "STRUK-MINI-901",
      notes: "Pembersih perlengkapan panci keju dan wadah bumbu.",
      createdAt: new Date("2026-09-24T14:45:00+07:00"),
    },
    {
      title: "Sari Buah Lemon Tambahan 1 Botol",
      amount: 75000,
      category: "INGREDIENT",
      paymentSource: "OWNER_TRANSFER",
      staffName: "Budi Santoso",
      receiptNumber: "TRF-LMN-202",
      notes: "Beli langsung ke petani lemon segar (ditransfer langsung oleh Owner).",
      createdAt: new Date("2026-09-24T16:20:00+07:00"),
    },
  ]);

  // 9. Seed Audit Logs
  await db.insert(auditLogs).values([
    {
      userName: "Muhammad Afrizal",
      userRole: "Owner",
      action: "PROMO_CREATED",
      actionLabel: "Pembuatan Voucher Baru",
      entityType: "Promo",
      entityId: "MACMOOD10",
      oldValue: "-",
      newValue: "Diskon 10% s.d Rp 10.000 (Min. Rp 30.000)",
      reason: "Kampanye promosi pembukaan outlet.",
      createdAt: new Date("2026-09-24T08:00:00+07:00"),
    },
    {
      userName: "Muhammad Afrizal",
      userRole: "Owner",
      action: "RECIPE_UPDATED",
      actionLabel: "Pembaruan Takaran Resep (BOM)",
      entityType: "Resep",
      entityId: "Super Mac",
      oldValue: "Mozzarella 20g",
      newValue: "Mozzarella 25g (+5g ekstra cheesy)",
      reason: "Peningkatan kualitas rasa keju meleleh atas masukan pelanggan.",
      createdAt: new Date("2026-09-24T09:30:00+07:00"),
    },
    {
      userName: "Budi Santoso",
      userRole: "Kasir",
      action: "RAW_MATERIAL_RESTOCKED",
      actionLabel: "Restock Bahan Mentah",
      entityType: "Bahan Baku",
      entityId: "RM-MAC-01",
      oldValue: "Stok 15.0 kg",
      newValue: "Stok 25.0 kg (+10.0 kg)",
      reason: "Penerimaan pasokan makaroni dari CV Pangan Makmur.",
      createdAt: new Date("2026-09-24T10:00:00+07:00"),
    },
  ]);
}
