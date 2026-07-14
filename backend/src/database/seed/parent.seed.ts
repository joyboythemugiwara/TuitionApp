import { seedLogger } from "./helpers/logger";
import { type Tenant } from "@/database/schemas/public/tenants";

export async function seedParents(tenant: Tenant) {
  seedLogger.info(`Seeding Parents for Tenant: ${tenant.name}...`);
  // TODO: Add parent seeding logic when schema is ready
}
