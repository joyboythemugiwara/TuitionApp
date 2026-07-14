import { seedLogger } from "./helpers/logger";
import { type Tenant } from "@/database/schemas/public/tenants";
import { users } from "@/database/schemas/public/users";
import { db } from "@/database/client";
import { faker } from "@faker-js/faker/locale/en_IN";
import { eq } from "drizzle-orm";

export async function seedTeachers(tenant: Tenant) {
  seedLogger.info(`Seeding Teachers for Tenant: ${tenant.name}...`);
  
  const existing = await db.select().from(users).where(eq(users.role, "teacher")).limit(5);
  if (existing.length >= 5) {
    seedLogger.success(`Using existing ${existing.length} Teachers`);
    return existing;
  }

  const teacherData = [];
  const passwordHash = await Bun.password.hash("Teacher@123");

  for (let i = 0; i < 5; i++) {
    teacherData.push({
      tenantId: tenant.id,
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      passwordHash,
      role: "teacher" as const,
      isActive: true,
    });
  }

  const inserted = await db.insert(users).values(teacherData).returning();
  seedLogger.info(`Created ${inserted.length} Teachers`);
  return inserted;
}
