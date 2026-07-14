import { getTenantDb, getTenantSchemaName, withTenantTx } from "@/database/client";
import { announcements, NewAnnouncement, Announcement } from "@/database/schemas/tenant/announcements";
import { eq, and } from "drizzle-orm";
import { Repository } from "@/common/decorators";

@Repository()
export class AnnouncementsRepository {
  async create(tenantId: string, data: NewAnnouncement): Promise<Announcement> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      const [announcement] = await tx.insert(announcements).values(data).returning();
      return announcement;
    });
  }

  async findById(tenantId: string, id: string): Promise<Announcement | undefined> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      const [announcement] = await tx
        .select()
        .from(announcements)
        .where(eq(announcements.id, id))
        .limit(1);
      return announcement;
    });
  }

  async update(tenantId: string, id: string, data: Partial<NewAnnouncement>): Promise<Announcement | undefined> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      const [updated] = await tx
        .update(announcements)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(announcements.id, id))
        .returning();
      return updated;
    });
  }

  async list(tenantId: string, status?: "draft" | "scheduled" | "sent" | "failed"): Promise<Announcement[]> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      let query = tx.select().from(announcements).$dynamic();
      if (status) {
        query = query.where(eq(announcements.status, status));
      }
      return await query;
    });
  }
}
