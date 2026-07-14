import { db } from "@/database/client";
import { users } from "@/database/schemas/public/users";
import { type Tenant } from "@/database/schemas/public/tenants";
import { seedLogger } from "./helpers/logger";
import { faker } from "./helpers/faker";
import { eq } from "drizzle-orm";

export async function seedAdmins(tenant: Tenant, customEmail?: string) {
  seedLogger.info(`Seeding Admins for Tenant: ${tenant.name}...`);
  
  const existing = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (existing.length > 0) {
    seedLogger.success(`Using existing Admin: ${existing[0].email}`);
    return existing;
  }

  const email = customEmail || faker.internet.email();
  const passwordHash = await Bun.password.hash("Admin@123");

  const [admin] = await db.insert(users).values({
    tenantId: tenant.id,
    name: faker.person.fullName(),
    email: email,
    passwordHash: passwordHash,
    role: "admin",
    isActive: true,
  }).returning();

  seedLogger.success(`Created Admin: ${admin.email}`);
  return [admin];
}
