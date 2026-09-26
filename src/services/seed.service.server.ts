import { db } from "@/db/index.server";
import {
  branches,
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
  // Check if categories or products already seeded
  const existingProducts = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);
  if (!existingProducts[0]?.count || existingProducts[0].count === 0) {
    await seedMasterCatalog();
  }

  // Check if branches already seeded
  const existingBranches = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(branches);
  if (!existingBranches[0]?.count || existingBranches[0].count === 0) {
    await reseedAllTransactionalData();
  }
}

export async function seedMasterCatalog() {
  // 1. Seed Categories
  await db
    .insert(categories)
    .values([
      { slug: "mac", name: "Mac & Cheese", sortOrder: 1, isActive: true },
      { slug: "sides", name: "Add-on", sortOrder: 2, isActive: true },
      { slug: "drinks", name: "Minuman", sortOrder: 3, isActive: true },
    ])
    .onConflictDoNothing();

  const allCategories = await db.select().from(categories);
  const macCat = allCategories.find((c) => c.slug === "mac");
  const sidesCat = allCategories.find((c) => c.slug === "sides");
  const drinksCat = allCategories.find((c) => c.slug === "drinks");

  // 2. Seed Raw Materials
  await db
    .insert(rawMaterials)
    .values([
      {
        sku: "RM-MAC-01",
        name: "Makaroni Elbow Kering",
        category: "STAPLE",
        unit: "kg",
        currentStock: "25.0",
        minStock: "5.0",
        costPerUnit: 22000,
        supplierName: "CV Pangan Makmur",
      },
      {
        sku: "RM-CHS-01",
        name: "Keju Cheddar Olahan",
        category: "DAIRY",
        unit: "kg",
        currentStock: "12.0",
        minStock: "3.0",
        costPerUnit: 68000,
        supplierName: "PT Sumber Dairy Sejahtera",
      },
      {
        sku: "RM-CHS-02",
        name: "Keju Mozzarella Grated",
        category: "DAIRY",
        unit: "kg",
        currentStock: "7.0",
        minStock: "2.0",
        costPerUnit: 95000,
        supplierName: "PT Sumber Dairy Sejahtera",
      },
      {
        sku: "RM-CRM-01",
        name: "Cooking Cream Cair",
        category: "DAIRY",
        unit: "ml",
        currentStock: "10000.0",
        minStock: "2000.0",
        costPerUnit: 48,
        supplierName: "PT Fonterra Dairy",
      },
      {
        sku: "RM-CKN-01",
        name: "Dada Ayam Fillet Boneless",
        category: "MEAT",
        unit: "kg",
        currentStock: "15.0",
        minStock: "4.0",
        costPerUnit: 52000,
        supplierName: "Rumah Potong Unggas Berkah",
      },
      {
        sku: "RM-POT-01",
        name: "Kentang Fries Shoestring",
        category: "STAPLE",
        unit: "kg",
        currentStock: "18.0",
        minStock: "4.0",
        costPerUnit: 32000,
        supplierName: "CV Frozen Food Prima",
      },
      {
        sku: "RM-TEA-01",
        name: "Daun Teh Hitam Melati",
        category: "BEVERAGE",
        unit: "g",
        currentStock: "2000.0",
        minStock: "500.0",
        costPerUnit: 35,
        supplierName: "Kebun Teh Puncak Sari",
      },
      {
        sku: "RM-LMN-01",
        name: "Sari Buah Lemon Murni",
        category: "BEVERAGE",
        unit: "ml",
        currentStock: "3000.0",
        minStock: "1000.0",
        costPerUnit: 45,
        supplierName: "Petani Lemon Lembang",
      },
      {
        sku: "RM-BOX-01",
        name: "Paper Box MacMood 500ml",
        category: "PACKAGING",
        unit: "pcs",
        currentStock: "350.0",
        minStock: "100.0",
        costPerUnit: 850,
        supplierName: "Percetakan Karton Indah",
      },
      {
        sku: "RM-UTN-01",
        name: "Sendok Garpu Kayu Steril",
        category: "PACKAGING",
        unit: "pcs",
        currentStock: "420.0",
        minStock: "100.0",
        costPerUnit: 250,
        supplierName: "Eco Packaging Nusantara",
      },
    ])
    .onConflictDoNothing();

  const allRawMaterials = await db.select().from(rawMaterials);
  const getRm = (sku: string) => allRawMaterials.find((r) => r.sku === sku)?.id;

  // 3. Seed Products
  await db
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
        currentStock: 105,
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
        currentStock: 85,
      },
      {
        name: "Classic Mac",
        categoryId: macCat?.id,
        categorySlug: "mac",
        description:
          "Comfort food klasik makaroni dengan lelehan saus keju lembut.",
        price: 10000,
        costPrice: 4800,
        imageUrl: "/assets/menu-classic-mac-reference.png",
        isAvailable: true,
        trackStock: true,
        currentStock: 110,
      },
      {
        name: "Spicy Smokey Mac",
        categoryId: macCat?.id,
        categorySlug: "mac",
        description:
          "Makaroni saus keju dengan aroma smoky dan sensasi pedas mantap.",
        price: 18000,
        costPrice: 8600,
        imageUrl: "/assets/menu-super-mac-reference.png",
        badge: "SPICY",
        isAvailable: true,
        trackStock: true,
        currentStock: 52,
      },
      {
        name: "Chicken Katsu Ala Carte",
        categoryId: sidesCat?.id,
        categorySlug: "sides",
        description:
          "Fillet dada ayam krispi berbalut tepung roti renyah keemasan.",
        price: 12000,
        costPrice: 5800,
        imageUrl: "/assets/menu-chicken-katsu.png",
        isAvailable: true,
        trackStock: true,
        currentStock: 75,
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
        currentStock: 95,
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
        currentStock: 140,
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
        currentStock: 190,
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
        currentStock: 120,
      },
    ])
    .onConflictDoNothing({ target: products.name });

  const allProducts = await db.select().from(products);

  // 4. Seed Recipes (BOM)
  const superMac = allProducts.find((p) => p.name === "Super Mac");
  const potatoMac = allProducts.find((p) => p.name === "Potato Mac");
  const classicMac = allProducts.find((p) => p.name === "Classic Mac");

  const recipeList = [];
  if (superMac) {
    const rmMak = getRm("RM-MAC-01");
    const rmChd = getRm("RM-CHS-01");
    const rmMoz = getRm("RM-CHS-02");
    const rmCrm = getRm("RM-CRM-01");
    const rmCkn = getRm("RM-CKN-01");
    const rmPot = getRm("RM-POT-01");
    const rmBox = getRm("RM-BOX-01");

    if (rmMak)
      recipeList.push({
        productId: superMac.id,
        rawMaterialId: rmMak,
        amount: "80.0",
        unit: "g",
      });
    if (rmChd)
      recipeList.push({
        productId: superMac.id,
        rawMaterialId: rmChd,
        amount: "35.0",
        unit: "g",
      });
    if (rmMoz)
      recipeList.push({
        productId: superMac.id,
        rawMaterialId: rmMoz,
        amount: "25.0",
        unit: "g",
      });
    if (rmCrm)
      recipeList.push({
        productId: superMac.id,
        rawMaterialId: rmCrm,
        amount: "40.0",
        unit: "ml",
      });
    if (rmCkn)
      recipeList.push({
        productId: superMac.id,
        rawMaterialId: rmCkn,
        amount: "60.0",
        unit: "g",
      });
    if (rmPot)
      recipeList.push({
        productId: superMac.id,
        rawMaterialId: rmPot,
        amount: "40.0",
        unit: "g",
      });
    if (rmBox)
      recipeList.push({
        productId: superMac.id,
        rawMaterialId: rmBox,
        amount: "1.0",
        unit: "pcs",
      });
  }

  if (potatoMac) {
    const rmMak = getRm("RM-MAC-01");
    const rmChd = getRm("RM-CHS-01");
    const rmPot = getRm("RM-POT-01");
    const rmBox = getRm("RM-BOX-01");

    if (rmMak)
      recipeList.push({
        productId: potatoMac.id,
        rawMaterialId: rmMak,
        amount: "80.0",
        unit: "g",
      });
    if (rmChd)
      recipeList.push({
        productId: potatoMac.id,
        rawMaterialId: rmChd,
        amount: "35.0",
        unit: "g",
      });
    if (rmPot)
      recipeList.push({
        productId: potatoMac.id,
        rawMaterialId: rmPot,
        amount: "60.0",
        unit: "g",
      });
    if (rmBox)
      recipeList.push({
        productId: potatoMac.id,
        rawMaterialId: rmBox,
        amount: "1.0",
        unit: "pcs",
      });
  }

  if (classicMac) {
    const rmMak = getRm("RM-MAC-01");
    const rmChd = getRm("RM-CHS-01");
    const rmBox = getRm("RM-BOX-01");

    if (rmMak)
      recipeList.push({
        productId: classicMac.id,
        rawMaterialId: rmMak,
        amount: "80.0",
        unit: "g",
      });
    if (rmChd)
      recipeList.push({
        productId: classicMac.id,
        rawMaterialId: rmChd,
        amount: "45.0",
        unit: "g",
      });
    if (rmBox)
      recipeList.push({
        productId: classicMac.id,
        rawMaterialId: rmBox,
        amount: "1.0",
        unit: "pcs",
      });
  }

  if (recipeList.length > 0) {
    await db.insert(recipes).values(recipeList).onConflictDoNothing();
  }

  // 5. Seed Promos
  await db
    .insert(promos)
    .values([
      {
        code: "MACMOOD10",
        name: "Promo Opening Mac & Cheese 10%",
        description:
          "Diskon 10% s.d Rp 10.000 untuk minimal belanja Rp 30.000.",
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
    ])
    .onConflictDoNothing();
}

/**
 * Resets transactional dummy data (orders, shifts, expenses, audit logs)
 * and seeds 100% interconnected, mathematically consistent multi-branch data.
 */
export async function reseedAllTransactionalData() {
  await seedMasterCatalog();

  // 1. Wipe old transactional tables
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(expenses);
  await db.delete(shifts);
  await db.delete(auditLogs);
  await db.delete(branches);

  // 2. Seed Official Branches (Akun Cabang Terintegrasi)
  const [b1, b2, b3] = await db
    .insert(branches)
    .values([
      {
        id: "branch-1",
        name: "MacMood Pusat - Fatmawati",
        branchCode: "MAC-JKT-01",
        address: "Jl. RS Fatmawati Raya No. 18, Cilandak",
        city: "Jakarta Selatan",
        phone: "+62 812-3456-7890",
        email: "fatmawati@macmood.id",
        pin: "1234",
        isActive: true,
        taxRate: 10,
        serviceChargeRate: 0,
        qrisMerchantName: "MACMOOD FOOD INDONESIA",
        qrisNmid: "ID102008899201",
        bankAccount: "8830192841",
        bankName: "BCA",
        openedAt: "12 Januari 2026",
      },
      {
        id: "branch-2",
        name: "MacMood Express - Margonda",
        branchCode: "MAC-DPK-01",
        address: "Jl. Margonda Raya No. 120, Beji",
        city: "Depok",
        phone: "+62 812-9876-5432",
        email: "margonda@macmood.id",
        pin: "5678",
        isActive: true,
        taxRate: 10,
        serviceChargeRate: 0,
        qrisMerchantName: "MACMOOD EXPRESS MARGONDA",
        qrisNmid: "ID102008899202",
        bankAccount: "8830192842",
        bankName: "BCA",
        openedAt: "1 Mei 2026",
      },
      {
        id: "branch-3",
        name: "MacMood Kitchen - Tebet",
        branchCode: "MAC-JKT-02",
        address: "Jl. Tebet Timur Dalam Raya No. 45",
        city: "Jakarta Selatan",
        phone: "+62 812-1122-3344",
        email: "tebet@macmood.id",
        pin: "9012",
        isActive: true,
        taxRate: 10,
        serviceChargeRate: 0,
        qrisMerchantName: "MACMOOD KITCHEN TEBET",
        qrisNmid: "ID102008899203",
        bankAccount: "8830192843",
        bankName: "BCA",
        openedAt: "15 Juli 2026",
      },
    ])
    .returning();

  // 3. Seed Shifts for each branch (Hari Ini: 26 Sep 2026)
  //
  // Rekonsiliasi Matematika:
  // Fatmawati: initial 200.000, cash 156.200, qris 60.500, expense 24.000 -> expectedCash 332.200
  // Margonda:  initial 150.000, cash 99.000,  qris 38.500, expense 23.000 -> expectedCash 226.000
  // Tebet:     initial 150.000, cash 66.000,  qris 46.200, expense 0      -> expectedCash 216.000
  const [shiftFatmawati] = await db
    .insert(shifts)
    .values({
      shiftCode: "SHIFT-20260926-01",
      branchId: b1.id,
      branchName: b1.name,
      branchCode: b1.branchCode,
      staffName: "Kasir Fatmawati",
      initialCash: 200000,
      cashSales: 156200,
      qrisSales: 60500,
      totalOrders: 5,
      expectedCash: 332200,
      actualCash: 332200,
      cashDifference: 0,
      status: "OPEN",
      isVerified: false,
      notes: "Shift pagi cabang pusat Fatmawati berjalan lancar.",
      startTime: new Date("2026-09-26T08:00:00+07:00"),
    })
    .returning();

  const [shiftMargonda] = await db
    .insert(shifts)
    .values({
      shiftCode: "SHIFT-20260926-02",
      branchId: b2.id,
      branchName: b2.name,
      branchCode: b2.branchCode,
      staffName: "Kasir Margonda",
      initialCash: 150000,
      cashSales: 99000,
      qrisSales: 38500,
      totalOrders: 3,
      expectedCash: 226000,
      actualCash: 226000,
      cashDifference: 0,
      status: "OPEN",
      isVerified: false,
      notes: "Shift pagi cabang Margonda Depok siap melayani.",
      startTime: new Date("2026-09-26T08:30:00+07:00"),
    })
    .returning();

  const [shiftTebet] = await db
    .insert(shifts)
    .values({
      shiftCode: "SHIFT-20260926-03",
      branchId: b3.id,
      branchName: b3.name,
      branchCode: b3.branchCode,
      staffName: "Kasir Tebet",
      initialCash: 150000,
      cashSales: 66000,
      qrisSales: 46200,
      totalOrders: 2,
      expectedCash: 216000,
      actualCash: 216000,
      cashDifference: 0,
      status: "OPEN",
      isVerified: false,
      notes: "Shift pagi cabang Tebet Timur melayani takeaway.",
      startTime: new Date("2026-09-26T09:00:00+07:00"),
    })
    .returning();

  // 4. Seed Synchronized Orders (Exact 10 Nota Hari Ini)
  const initialOrdersData = [
    // --- FATMAWATI (5 Nota: 3 Cash, 2 QRIS) ---
    {
      id: "ord-fatmawati-01",
      orderNumber: "MAC-20260926-1001",
      branchId: b1.id,
      branchName: b1.name,
      shiftId: shiftFatmawati.id,
      cashierName: "Kasir Fatmawati",
      customerName: "Pelanggan 01",
      subtotal: 52000,
      discount: 0,
      tax: 5200,
      total: 57200,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      amountTendered: 60000,
      changeAmount: 2800,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T08:30:00+07:00"),
      items: [
        {
          productName: "Super Mac",
          quantity: 2,
          price: 20000,
          subtotal: 40000,
          notes: "Extra saus keju",
        },
        {
          productName: "Es Lemon Tea",
          quantity: 2,
          price: 6000,
          subtotal: 12000,
        },
      ],
    },
    {
      id: "ord-fatmawati-02",
      orderNumber: "MAC-20260926-1002",
      branchId: b1.id,
      branchName: b1.name,
      shiftId: shiftFatmawati.id,
      cashierName: "Kasir Fatmawati",
      customerName: "Pelanggan 02",
      subtotal: 27000,
      discount: 0,
      tax: 2700,
      total: 29700,
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      amountTendered: 29700,
      changeAmount: 0,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T09:15:00+07:00"),
      items: [
        {
          productName: "Potato Mac",
          quantity: 1,
          price: 15000,
          subtotal: 15000,
        },
        {
          productName: "Crispy French Fries",
          quantity: 1,
          price: 8000,
          subtotal: 8000,
        },
        {
          productName: "Es Teh Manis",
          quantity: 1,
          price: 4000,
          subtotal: 4000,
        },
      ],
    },
    {
      id: "ord-fatmawati-03",
      orderNumber: "MAC-20260926-1003",
      branchId: b1.id,
      branchName: b1.name,
      shiftId: shiftFatmawati.id,
      cashierName: "Kasir Fatmawati",
      customerName: "Pelanggan 03",
      subtotal: 36000,
      discount: 0,
      tax: 3600,
      total: 39600,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      amountTendered: 50000,
      changeAmount: 10400,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T10:20:00+07:00"),
      items: [
        {
          productName: "Spicy Smokey Mac",
          quantity: 1,
          price: 18000,
          subtotal: 18000,
          notes: "Pedas mantap",
        },
        {
          productName: "Chicken Katsu Ala Carte",
          quantity: 1,
          price: 12000,
          subtotal: 12000,
        },
        {
          productName: "Es Lemon Tea",
          quantity: 1,
          price: 6000,
          subtotal: 6000,
        },
      ],
    },
    {
      id: "ord-fatmawati-04",
      orderNumber: "MAC-20260926-1004",
      branchId: b1.id,
      branchName: b1.name,
      shiftId: shiftFatmawati.id,
      cashierName: "Kasir Fatmawati",
      customerName: "Pelanggan 04",
      subtotal: 28000,
      discount: 0,
      tax: 2800,
      total: 30800,
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      amountTendered: 30800,
      changeAmount: 0,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T11:45:00+07:00"),
      items: [
        {
          productName: "Classic Mac",
          quantity: 2,
          price: 10000,
          subtotal: 20000,
        },
        {
          productName: "Es Teh Manis",
          quantity: 2,
          price: 4000,
          subtotal: 8000,
        },
      ],
    },
    {
      id: "ord-fatmawati-05",
      orderNumber: "MAC-20260926-1005",
      branchId: b1.id,
      branchName: b1.name,
      shiftId: shiftFatmawati.id,
      cashierName: "Kasir Fatmawati",
      customerName: "Pelanggan 05",
      subtotal: 60000,
      discount: 6000,
      promoCode: "MACMOOD10",
      promoName: "Promo Opening Mac & Cheese 10%",
      tax: 5400,
      total: 59400,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      amountTendered: 100000,
      changeAmount: 40600,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T12:30:00+07:00"),
      items: [
        {
          productName: "Super Mac",
          quantity: 2,
          price: 20000,
          subtotal: 40000,
        },
        {
          productName: "Crispy French Fries",
          quantity: 1,
          price: 8000,
          subtotal: 8000,
        },
        {
          productName: "Es Lemon Tea",
          quantity: 2,
          price: 6000,
          subtotal: 12000,
        },
      ],
    },

    // --- MARGONDA (3 Nota: 2 Cash, 1 QRIS) ---
    {
      id: "ord-margonda-01",
      orderNumber: "MAC-20260926-2001",
      branchId: b2.id,
      branchName: b2.name,
      shiftId: shiftMargonda.id,
      cashierName: "Kasir Margonda",
      customerName: "Pelanggan Depok 01",
      subtotal: 38000,
      discount: 0,
      tax: 3800,
      total: 41800,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      amountTendered: 50000,
      changeAmount: 8200,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T09:40:00+07:00"),
      items: [
        {
          productName: "Potato Mac",
          quantity: 2,
          price: 15000,
          subtotal: 30000,
        },
        {
          productName: "Es Teh Manis",
          quantity: 2,
          price: 4000,
          subtotal: 8000,
        },
      ],
    },
    {
      id: "ord-margonda-02",
      orderNumber: "MAC-20260926-2002",
      branchId: b2.id,
      branchName: b2.name,
      shiftId: shiftMargonda.id,
      cashierName: "Kasir Margonda",
      customerName: "Pelanggan Depok 02",
      subtotal: 35000,
      discount: 0,
      tax: 3500,
      total: 38500,
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      amountTendered: 38500,
      changeAmount: 0,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T10:50:00+07:00"),
      items: [
        {
          productName: "Super Mac",
          quantity: 1,
          price: 20000,
          subtotal: 20000,
        },
        {
          productName: "Chicken Katsu Ala Carte",
          quantity: 1,
          price: 12000,
          subtotal: 12000,
        },
        {
          productName: "Air Mineral Botol",
          quantity: 1,
          price: 3000,
          subtotal: 3000,
        },
      ],
    },
    {
      id: "ord-margonda-03",
      orderNumber: "MAC-20260926-2003",
      branchId: b2.id,
      branchName: b2.name,
      shiftId: shiftMargonda.id,
      cashierName: "Kasir Margonda",
      customerName: "Pelanggan Depok 03",
      subtotal: 52000,
      discount: 0,
      tax: 5200,
      total: 57200,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      amountTendered: 60000,
      changeAmount: 2800,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T12:15:00+07:00"),
      items: [
        {
          productName: "Spicy Smokey Mac",
          quantity: 2,
          price: 18000,
          subtotal: 36000,
        },
        {
          productName: "Crispy French Fries",
          quantity: 1,
          price: 8000,
          subtotal: 8000,
        },
        {
          productName: "Es Teh Manis",
          quantity: 2,
          price: 4000,
          subtotal: 8000,
        },
      ],
    },

    // --- TEBET (2 Nota: 1 Cash, 1 QRIS) ---
    {
      id: "ord-tebet-01",
      orderNumber: "MAC-20260926-3001",
      branchId: b3.id,
      branchName: b3.name,
      shiftId: shiftTebet.id,
      cashierName: "Kasir Tebet",
      customerName: "Pelanggan Tebet 01",
      subtotal: 42000,
      discount: 0,
      tax: 4200,
      total: 46200,
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      amountTendered: 46200,
      changeAmount: 0,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T10:10:00+07:00"),
      items: [
        {
          productName: "Classic Mac",
          quantity: 3,
          price: 10000,
          subtotal: 30000,
        },
        {
          productName: "Es Teh Manis",
          quantity: 3,
          price: 4000,
          subtotal: 12000,
        },
      ],
    },
    {
      id: "ord-tebet-02",
      orderNumber: "MAC-20260926-3002",
      branchId: b3.id,
      branchName: b3.name,
      shiftId: shiftTebet.id,
      cashierName: "Kasir Tebet",
      customerName: "Pelanggan Tebet 02",
      subtotal: 60000,
      discount: 0,
      tax: 6000,
      total: 66000,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      amountTendered: 70000,
      changeAmount: 4000,
      syncStatus: "SYNCED",
      createdAt: new Date("2026-09-26T11:25:00+07:00"),
      items: [
        {
          productName: "Super Mac",
          quantity: 2,
          price: 20000,
          subtotal: 40000,
        },
        {
          productName: "Crispy French Fries",
          quantity: 1,
          price: 8000,
          subtotal: 8000,
        },
        {
          productName: "Es Lemon Tea",
          quantity: 2,
          price: 6000,
          subtotal: 12000,
        },
      ],
    },
  ];

  const allCatalogProducts = await db.select().from(products);
  const productMapByName = new Map(allCatalogProducts.map((p) => [p.name, p]));

  for (const o of initialOrdersData) {
    const { items, ...orderData } = o;
    await db.insert(orders).values(orderData);
    await db.insert(orderItems).values(
      items.map((it) => {
        const prod = productMapByName.get(it.productName);
        return {
          orderId: orderData.id,
          productId: prod?.id || null,
          productName: it.productName,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal,
          notes: (it as { notes?: string }).notes || null,
        };
      }),
    );
  }

  // 5. Seed Matching Expenses (Terkait Shift & Kasir Cabang)
  await db.insert(expenses).values([
    {
      branchId: b1.id,
      branchName: b1.name,
      title: "Es Batu Kristal Higienis 2 Bal",
      amount: 24000,
      category: "INGREDIENT",
      paymentSource: "CASH_DRAWER",
      staffName: "Kasir Fatmawati",
      receiptNumber: "NOTA-ES-882",
      notes:
        "Kebutuhan es batu mendesak untuk es teh & lemon tea cabang Fatmawati.",
      createdAt: new Date("2026-09-26T09:30:00+07:00"),
    },
    {
      branchId: b2.id,
      branchName: b2.name,
      title: "Isi Ulang Gas LPG 3kg",
      amount: 23000,
      category: "UTILITY",
      paymentSource: "CASH_DRAWER",
      staffName: "Kasir Margonda",
      receiptNumber: "GAS-MRG-102",
      notes: "Penggantian tabung kompor memasak makaroni Margonda.",
      createdAt: new Date("2026-09-26T11:00:00+07:00"),
    },
    {
      branchId: b1.id,
      branchName: b1.name,
      title: "Kantong Kresek Takeaway Ramah Lingkungan",
      amount: 35000,
      category: "PACKAGING",
      paymentSource: "OWNER_TRANSFER",
      staffName: "Muhammad Afrizal (Owner)",
      receiptNumber: "INV-PLASTIK-44",
      notes: "Restock kemasan takeaway langsung ditransfer oleh Owner.",
      createdAt: new Date("2026-09-26T12:00:00+07:00"),
    },
  ]);

  // 6. Seed Clean Audit Logs
  await db.insert(auditLogs).values([
    {
      userName: "Muhammad Afrizal",
      userRole: "owner",
      action: "BRANCHES_INITIALIZED",
      actionLabel: "Inisialisasi Jaringan Cabang",
      entityType: "Cabang",
      entityId: "MAC-HQ",
      oldValue: "-",
      newValue: "3 Cabang Aktif (Fatmawati, Margonda, Tebet)",
      reason: "Penyelarasan akun outlet operasional MacMood POS.",
      createdAt: new Date("2026-09-26T07:00:00+07:00"),
    },
    {
      userName: "Muhammad Afrizal",
      userRole: "owner",
      action: "PROMO_CREATED",
      actionLabel: "Pembuatan Voucher Baru",
      entityType: "Promo",
      entityId: "MACMOOD10",
      oldValue: "-",
      newValue: "Diskon 10% s.d Rp 10.000 (Min. Rp 30.000)",
      reason: "Kampanye promosi pembukaan outlet.",
      createdAt: new Date("2026-09-26T07:30:00+07:00"),
    },
    {
      userName: "Kasir Fatmawati",
      userRole: "cashier",
      action: "SHIFT_OPENED",
      actionLabel: "Pembukaan Shift Kasir",
      entityType: "Shift",
      entityId: shiftFatmawati.shiftCode,
      oldValue: "-",
      newValue: "Modal Awal Rp 200.000",
      reason: "Shift pagi mulai operasional.",
      createdAt: new Date("2026-09-26T08:00:00+07:00"),
    },
  ]);
}
