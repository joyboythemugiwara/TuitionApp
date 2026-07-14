import "reflect-metadata";
import { seedLogger } from "./helpers/logger";
import { seedTenants } from "./tenant.seed";
import { seedAdmins } from "./admin.seed";
import { seedTeachers } from "./teacher.seed";
import { seedBatches } from "./batch.seed";
import { seedStudents } from "./student.seed";
import { seedFees } from "./fee.seed";

async function main() {
  seedLogger.divider();
  seedLogger.info("Starting Database Seeding Process...");
  seedLogger.divider();

  const customEmail = process.argv[2];
  if (customEmail) {
    seedLogger.info(`Custom admin email provided: ${customEmail}`);
  }

  try {
    // 1. Core Tenant & Admin setup
    const tenants = await seedTenants();
    const primaryTenant = tenants[0];
    
    await seedAdmins(primaryTenant, customEmail);

    // 2. Staff setup (Teachers)
    const teachers = await seedTeachers(primaryTenant);

    // 3. Academic setup (Batches)
    const batches = await seedBatches(primaryTenant, teachers);

    // 4. Students
    const students = await seedStudents(primaryTenant, batches);

    // 5. Operations (Fees & Payments)
    await seedFees(primaryTenant, students);

    seedLogger.divider();
    seedLogger.success("Database Seeding Completed Successfully!");
    seedLogger.divider();
    process.exit(0);
  } catch (error) {
    seedLogger.error("Database Seeding Failed!", error);
    process.exit(1);
  }
}

main();
