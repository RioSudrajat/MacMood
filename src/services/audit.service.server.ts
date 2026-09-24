import { db } from "@/db/index.server";
import { auditLogs } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { desc } from "drizzle-orm";

export interface RecordAuditLogInput {
  userName: string;
  userRole: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export async function listAuditLogs(limit = 100) {
  await ensureSeededData();
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function recordAuditLog(input: RecordAuditLogInput, userId?: string) {
  const [log] = await db
    .insert(auditLogs)
    .values({
      userId: userId || null,
      userName: input.userName,
      userRole: input.userRole,
      action: input.action,
      actionLabel: input.actionLabel,
      entityType: input.entityType,
      entityId: input.entityId || null,
      oldValue: input.oldValue || null,
      newValue: input.newValue || null,
      reason: input.reason || null,
    })
    .returning();
  return log;
}
