import { db } from "@/database/client";
import { tenants, Tenant } from "@/database/schemas/public/tenants";
import { eq } from "drizzle-orm";
import { Repository } from "@/common/decorators";

@Repository()
export class TenantsRepository {
  async findById(tenantId: string): Promise<Tenant | undefined> {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    return tenant;
  }

  async update(tenantId: string, data: Partial<Tenant>): Promise<Tenant | undefined> {
    const [updatedTenant] = await db
      .update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId))
      .returning();
    return updatedTenant;
  }
}
