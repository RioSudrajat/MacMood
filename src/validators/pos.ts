import { z } from "zod";

export const orderItemSchema = z
  .object({
    productId: z.string().optional(),
    productName: z.string().min(1).max(150),
    price: z.coerce.number().int().min(0),
    quantity: z.coerce.number().int().min(1),
    subtotal: z.coerce.number().int().min(0),
    notes: z.string().max(250).optional(),
  })
  .strict();

export const createOrderSchema = z
  .object({
    id: z.string().optional(),
    orderNumber: z.string().optional(),
    shiftId: z.string().optional(),
    cashierName: z.string().min(1).max(100),
    customerName: z.string().max(100).default("Pelanggan"),
    items: z.array(orderItemSchema).min(1),
    subtotal: z.coerce.number().int().min(0),
    discount: z.coerce.number().int().min(0).default(0),
    promoCode: z.string().max(50).optional(),
    promoName: z.string().max(150).optional(),
    tax: z.coerce.number().int().min(0).default(0),
    total: z.coerce.number().int().min(0),
    paymentMethod: z.enum(["CASH", "QRIS", "QRIS_MANUAL"]),
    amountTendered: z.coerce.number().int().optional(),
    changeAmount: z.coerce.number().int().min(0).default(0),
    notes: z.string().max(500).optional(),
    syncStatus: z.enum(["SYNCED", "PENDING_SYNC"]).default("SYNCED"),
  })
  .strict();

export const syncOfflineOrdersSchema = z
  .object({
    orders: z.array(createOrderSchema),
  })
  .strict();

export const openShiftSchema = z
  .object({
    cashierName: z.string().min(1).max(100),
    initialCash: z.coerce.number().int().min(0),
    notes: z.string().max(500).optional(),
  })
  .strict();

export const closeShiftSchema = z
  .object({
    actualCash: z.coerce.number().int().min(0),
    notes: z.string().max(500).optional(),
  })
  .strict();

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OpenShiftInput = z.infer<typeof openShiftSchema>;
export type CloseShiftInput = z.infer<typeof closeShiftSchema>;
