import { seedLogger } from "./helpers/logger";
import { type Tenant } from "@/database/schemas/public/tenants";

export async function seedCourses(tenant: Tenant) {
  seedLogger.info(`Seeding Courses for Tenant: ${tenant.name}...`);
  // TODO: Add course seeding logic when schema is ready
}
