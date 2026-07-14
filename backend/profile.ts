import "reflect-metadata";
import { db, getTenantDb, getTenantSchemaName } from "./src/database/client";
import { DashboardRepository } from "./src/modules/dashboard/dashboard.repository";
import { performance } from "perf_hooks";

async function run() {
    const tenants = await db.execute(`SELECT id FROM tenants LIMIT 1`);
    if (tenants.length === 0) {
        console.log("No tenants found");
        process.exit(0);
    }
    const tenantId = tenants[0].id;

    console.log(`Testing dashboard for tenant ${tenantId}`);
    const repo = new DashboardRepository();
    
    // Warmup
    await repo.getDashboardStats(tenantId);

    const start = performance.now();
    await repo.getDashboardStats(tenantId);
    const end = performance.now();
    
    console.log(`Total getDashboardStats (hot) took: ${end - start} ms`);
    process.exit(0);
}

run();
