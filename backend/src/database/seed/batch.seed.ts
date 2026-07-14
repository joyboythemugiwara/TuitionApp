import { seedLogger } from "./helpers/logger";
import { type Tenant } from "@/database/schemas/public/tenants";
import { batches } from "@/database/schemas/tenant/batches";
import { batchTeachers } from "@/database/schemas/tenant/batch-teachers";
import { getTenantDb, getTenantSchemaName } from "@/database/client";

export async function seedBatches(tenant: Tenant, teachers: any[]) {
  seedLogger.info(`Seeding Batches for Tenant: ${tenant.name}...`);
  const tenantDb = getTenantDb(getTenantSchemaName(tenant.id));

  const batchList = [
    { name: "10th Grade Mathematics", schedule: "Mon, Wed, Fri 4:00 PM", defaultFee: "1500" },
    { name: "10th Grade Science", schedule: "Tue, Thu, Sat 4:00 PM", defaultFee: "1500" },
    { name: "11th Grade Physics", schedule: "Mon, Wed, Fri 5:30 PM", defaultFee: "2000" },
    { name: "11th Grade Chemistry", schedule: "Tue, Thu, Sat 5:30 PM", defaultFee: "2000" },
    { name: "12th Grade Crash Course", schedule: "Sat, Sun 9:00 AM", defaultFee: "3000" },
  ];

  const insertedBatches = await tenantDb.insert(batches).values(batchList).returning();

  // Assign 1-2 random teachers to each batch
  const assignments = [];
  for (const batch of insertedBatches) {
    const numTeachers = Math.floor(Math.random() * 2) + 1;
    const shuffled = [...teachers].sort(() => 0.5 - Math.random());
    for (let i = 0; i < numTeachers; i++) {
      assignments.push({
        batchId: batch.id,
        userId: shuffled[i].id,
      });
    }
  }

  await tenantDb.insert(batchTeachers).values(assignments);
  
  seedLogger.info(`Created ${insertedBatches.length} Batches`);
  return insertedBatches;
}
