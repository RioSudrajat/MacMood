import { db } from "@/db/index.server";
import { orders, orderItems, shifts, products, promos } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { desc, eq, sql } from "drizzle-orm";
import type {
  CreateOrderInput,
  OpenShiftInput,
  CloseShiftInput,
} from "@/validators/pos";

export async function getActiveShift(branchId?: string) {
  await ensureSeededData();
  const conditions = [eq(shifts.status, "OPEN")];
  if (branchId) {
    conditions.push(eq(shifts.branchId, branchId));
  }
  const [activeShift] = await db
    .select()
    .from(shifts)
    .where(
      conditions.length > 1
        ? sql`${shifts.status} = 'OPEN' AND ${shifts.branchId} = ${branchId}`
        : eq(shifts.status, "OPEN"),
    )
    .orderBy(desc(shifts.startTime))
    .limit(1);
  return activeShift || null;
}

export async function openShift(input: OpenShiftInput, userId?: string) {
  await ensureSeededData();
  const now = new Date();
  const shiftCode = `SHIFT-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;

  const [newShift] = await db
    .insert(shifts)
    .values({
      userId: userId || null,
      shiftCode,
      branchId: input.branchId || null,
      branchName: input.branchName || null,
      branchCode: input.branchCode || null,
      staffName: input.cashierName,
      initialCash: input.initialCash,
      expectedCash: input.initialCash,
      status: "OPEN",
      notes: input.notes,
      startTime: now,
    })
    .returning();

  return newShift;
}

export async function closeShift(shiftId: string, input: CloseShiftInput) {
  const [shift] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, shiftId))
    .limit(1);
  if (!shift) {
    throw new Error("Shift not found");
  }

  const expected = shift.expectedCash;
  const actual = input.actualCash;
  const difference = actual - expected;

  const [updatedShift] = await db
    .update(shifts)
    .set({
      actualCash: actual,
      cashDifference: difference,
      status: "CLOSED",
      endTime: new Date(),
      notes: input.notes || shift.notes,
    })
    .where(eq(shifts.id, shiftId))
    .returning();

  return updatedShift;
}

export async function listPastShifts() {
  await ensureSeededData();
  return db
    .select()
    .from(shifts)
    .where(eq(shifts.status, "CLOSED"))
    .orderBy(desc(shifts.startTime));
}

export async function createOrder(input: CreateOrderInput, userId?: string) {
  await ensureSeededData();

  const orderId = input.id || crypto.randomUUID();
  const now = new Date();
  const dateFormatted = now.toISOString().slice(0, 10).replace(/-/g, "");
  const orderNumber =
    input.orderNumber ||
    `MAC-${dateFormatted}-${Date.now().toString().slice(-4)}`;

  // Find active shift if not provided
  let activeShiftId = input.shiftId;
  if (!activeShiftId) {
    const active = await getActiveShift(input.branchId);
    activeShiftId = active?.id;
  }

  const result = await db.transaction(async (tx) => {
    // 1. Insert order
    const [insertedOrder] = await tx
      .insert(orders)
      .values({
        id: orderId,
        orderNumber,
        branchId: input.branchId || null,
        branchName: input.branchName || null,
        shiftId: activeShiftId || null,
        userId: userId || null,
        cashierName: input.cashierName,
        customerName: input.customerName || "Pelanggan",
        subtotal: input.subtotal,
        discount: input.discount || 0,
        promoCode: input.promoCode || null,
        promoName: input.promoName || null,
        tax: input.tax || 0,
        total: input.total,
        paymentMethod: input.paymentMethod,
        paymentStatus: "PAID",
        amountTendered: input.amountTendered || null,
        changeAmount: input.changeAmount || 0,
        notes: input.notes || null,
        syncStatus: input.syncStatus || "SYNCED",
        createdAt: now,
      })
      .onConflictDoNothing({ target: orders.id })
      .returning();

    if (!insertedOrder) {
      // Idempotency: order already exists (offline sync repeat)
      const [existing] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
      return existing;
    }

    // 2. Insert items with verified relational product foreign keys
    if (input.items && input.items.length > 0) {
      const allDbProducts = await tx.select().from(products);
      const prodById = new Map(allDbProducts.map((p) => [p.id, p]));
      const prodByName = new Map(
        allDbProducts.map((p) => [p.name.toLowerCase().trim(), p]),
      );

      const itemsWithProd = input.items.map((it) => {
        const matched =
          (it.productId && prodById.get(it.productId)) ||
          prodByName.get(it.productName.toLowerCase().trim());
        return {
          orderId,
          productId: matched?.id || null,
          productName: it.productName,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal,
          notes: it.notes || null,
          matchedProduct: matched,
        };
      });

      await tx.insert(orderItems).values(
        itemsWithProd.map((it) => ({
          orderId: it.orderId,
          productId: it.productId,
          productName: it.productName,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal,
          notes: it.notes,
        })),
      );

      // 3. Decrement stock for products if tracked
      for (const it of itemsWithProd) {
        if (it.matchedProduct && it.matchedProduct.trackStock) {
          await tx
            .update(products)
            .set({
              currentStock: sql`GREATEST(0, ${products.currentStock} - ${it.quantity})`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, it.matchedProduct.id));
        }
      }
    }

    // 4. Update Shift metrics
    if (activeShiftId) {
      if (input.paymentMethod === "CASH") {
        await tx
          .update(shifts)
          .set({
            cashSales: sql`${shifts.cashSales} + ${input.total}`,
            expectedCash: sql`${shifts.expectedCash} + ${input.total}`,
            totalOrders: sql`${shifts.totalOrders} + 1`,
          })
          .where(eq(shifts.id, activeShiftId));
      } else {
        await tx
          .update(shifts)
          .set({
            qrisSales: sql`${shifts.qrisSales} + ${input.total}`,
            totalOrders: sql`${shifts.totalOrders} + 1`,
          })
          .where(eq(shifts.id, activeShiftId));
      }
    }

    // 5. Update promo usage count if applicable
    if (input.promoCode) {
      await tx
        .update(promos)
        .set({
          currentUsage: sql`${promos.currentUsage} + 1`,
        })
        .where(eq(promos.code, input.promoCode));
    }

    return insertedOrder;
  });

  return result;
}

export async function syncOfflineOrders(
  ordersList: CreateOrderInput[],
  userId?: string,
) {
  const synced = [];
  for (const o of ordersList) {
    const res = await createOrder({ ...o, syncStatus: "SYNCED" }, userId);
    synced.push(res);
  }
  return synced;
}

export async function listOrders(filter?: {
  limit?: number;
  offset?: number;
  shiftId?: string;
  branchId?: string;
}) {
  await ensureSeededData();
  const limit = filter?.limit || 100;
  const offset = filter?.offset || 0;

  const conditions = [];
  if (filter?.branchId && filter.branchId !== "all") {
    conditions.push(eq(orders.branchId, filter.branchId));
  }
  if (filter?.shiftId) {
    conditions.push(eq(orders.shiftId, filter.shiftId));
  }

  const query = db.select().from(orders);

  if (conditions.length > 0) {
    query.where(
      conditions.length === 1
        ? conditions[0]
        : sql`${conditions[0]} AND ${conditions[1]}`,
    );
  }

  const orderRows = await query
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch items for these orders
  if (orderRows.length === 0) return [];

  const items = await db.select().from(orderItems);

  return orderRows.map((ord) => ({
    ...ord,
    items: items.filter((it) => it.orderId === ord.id),
  }));
}

export async function getOrder(id: string) {
  await ensureSeededData();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));
  return { ...order, items };
}

export async function refundOrder(id: string, reason?: string) {
  const [order] = await db
    .update(orders)
    .set({
      paymentStatus: "REFUNDED",
      notes: sql`CONCAT(COALESCE(${orders.notes}, ''), ' [VOID/REFUND: ', ${reason || "Dibatalkan oleh kasir/owner"}, ']')`,
    })
    .where(eq(orders.id, id))
    .returning();

  return order;
}
