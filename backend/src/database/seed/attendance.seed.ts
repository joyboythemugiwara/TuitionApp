import { seedLogger } from "./helpers/logger";
import { type Tenant } from "@/database/schemas/public/tenants";

export async function seedAttendance(tenant: Tenant) {
  seedLogger.info(`Seeding Attendance for Tenant: ${tenant.name}...`);
  // TODO: Add attendance seeding logic when schema is ready
}
