import "reflect-metadata";
import { container } from "tsyringe";
import { DashboardRepository } from "./src/modules/dashboard/dashboard.repository";

async function run() {
  const repo = container.resolve(DashboardRepository);
  // Need a valid tenant ID. I can fetch one from DB.
  const { db } = await import("./src/database/client");
  const { tenants } = await import("./src/database/schemas/public/tenants");
  const allTenants = await db.select().from(tenants);
  const tenantId = allTenants[0].id;
  
  try {
    const stats = await repo.getDashboardStats(tenantId);
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
