import { db } from "@/db/index.server";
import { orders, orderItems, shifts, products, promos } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { desc, eq, sql } from "drizzle-orm";
import type { CreateOrderInput, OpenShiftInput, CloseShiftInput } from "@/validators/pos";

export async function getActiveShift() {
  await ensureSeededData();
  const [activeShift] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.status, "OPEN"))
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
  const [shift] = await db.select().from(shifts).where(eq(shifts.id, shiftId)).limit(1);
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
  return db.select().from(shifts).orderBy(desc(shifts.startTime));
}

export async function createOrder(input: CreateOrderInput, userId?: string) {
  await ensureSeededData();

  const orderId = input.id || crypto.randomUUID();
  const now = new Date();
  const dateFormatted = now.toISOString().slice(0, 10).replace(/-/g, "");
  const orderNumber =
    input.orderNumber || `MAC-${dateFormatted}-${Date.now().toString().slice(-4)}`;

  // Find active shift if not provided
  let activeShiftId = input.shiftId;
  if (!activeShiftId) {
    const active = await getActiveShift();
    activeShiftId = active?.id;
  }

  const result = await db.transaction(async (tx) => {
    // 1. Insert order
    const [insertedOrder] = await tx
      .insert(orders)
      .values({
        id: orderId,
        orderNumber,
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
      const [existing] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      return existing;
    }

    // 2. Insert items
    if (input.items && input.items.length > 0) {
      await tx.insert(orderItems).values(
        input.items.map((it) => ({
          orderId,
          productId: it.productId || null,
          productName: it.productName,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal,
          notes: it.notes || null,
        })),
      );

      // 3. Decrement stock for products if tracked
      for (const it of input.items) {
        if (it.productId) {
          await tx
            .update(products)
            .set({
              currentStock: sql`GREATEST(0, ${products.currentStock} - ${it.quantity})`,
            })
            .where(eq(products.id, it.productId));
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

export async function syncOfflineOrders(ordersList: CreateOrderInput[], userId?: string) {
  const synced = [];
  for (const o of ordersList) {
    const res = await createOrder({ ...o, syncStatus: "SYNCED" }, userId);
    synced.push(res);
  }
  return synced;
}

export async function listOrders(filter?: { limit?: number; offset?: number; shiftId?: string }) {
  await ensureSeededData();
  const limit = filter?.limit || 50;
  const offset = filter?.offset || 0;

  const orderRows = await db
    .select()
    .from(orders)
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
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
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
