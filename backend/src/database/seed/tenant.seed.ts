import { db } from "@/database/client";
import { tenants, type Tenant } from "@/database/schemas/public/tenants";
import { seedLogger } from "./helpers/logger";
import { faker } from "./helpers/faker";

export async function seedTenants(): Promise<Tenant[]> {
  seedLogger.info("Seeding Tenants...");
  
  const existing = await db.select().from(tenants).limit(1);
  if (existing.length > 0) {
    seedLogger.success(`Using existing Tenant: ${existing[0].name}`);
    return existing;
  }
  
  const [tenant] = await db.insert(tenants).values({
    name: faker.company.name() + " Tuition Center",
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase() + "-tuitions",
  }).returning();

  seedLogger.success(`Created Tenant: ${tenant.name}`);
  return [tenant];
}
