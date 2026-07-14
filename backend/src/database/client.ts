import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/config/env";
import { logger } from "@/common/logger/logger";
import * as publicSchema from "./schemas/public";
import * as tenantSchema from "./schemas/tenant";

// ── Public DB Client (shared schema) ─────────────────────────────────────────
// Used for tenants, users, sessions, auth_logs
const publicClient = postgres(env.DATABASE_URL, {
  max: 10,                    // max connections in pool
  idle_timeout: 30,           // close idle connections after 30s
  connect_timeout: 10,        // timeout if can't connect in 10s
  onnotice: (notice) => {
    logger.warn({ notice }, "PostgreSQL notice");
  },
});

export const db = drizzle(publicClient, {
  schema: publicSchema,
  logger: env.NODE_ENV === "development",
});

// ── Tenant DB Client (per-center schema) ──────────────────────────────────────
// Used for all tenant-specific tables
// Sets search_path to tenant schema so all queries go to correct schema
const tenantClients = new Map<string, ReturnType<typeof drizzle>>();

export function getTenantDb(tenantSchema_: string) {
  // Cache client per tenant schema to avoid creating new connections
  if (tenantClients.has(tenantSchema_)) {
    return tenantClients.get(tenantSchema_)!;
  }

  const client = postgres(env.DATABASE_URL, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    connection: {
      search_path: `${tenantSchema_},public`,
    },
    onnotice: (notice) => {
      logger.warn({ notice }, "PostgreSQL notice");
    },
  });

  const tenantDb = drizzle(client, {
    schema: tenantSchema,
    logger: env.NODE_ENV === "development",
  });

  tenantClients.set(tenantSchema_, tenantDb);
  return tenantDb;
}

// ── Tenant Schema Name Helper ─────────────────────────────────────────────────
// Converts tenant id to schema name
// e.g. "550e8400-e29b-41d4-a716" → "tenant_550e8400_e29b_41d4_a716"
export function getTenantSchemaName(tenantId: string): string {
  return `tenant_${tenantId.replace(/-/g, "_")}`;
}

import { sql } from "drizzle-orm";

export async function withTenantTx<T>(tenantId: string, fn: (tx: any) => Promise<T>): Promise<T> {
  const schemaName = getTenantSchemaName(tenantId);
  const tenantDb = getTenantDb(schemaName);
  return await tenantDb.transaction(async (tx) => {
    await tx.execute(sql.raw(`SET LOCAL search_path TO "${schemaName}", public`));
    return await fn(tx);
  });
}

// ── Health Check ──────────────────────────────────────────────────────────────
export async function checkDbConnection(): Promise<boolean> {
  try {
    await publicClient`SELECT 1`;
    logger.info("Database connection established");
    return true;
  } catch (error) {
    logger.error({ error }, "Database connection failed");
    return false;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type PublicDb = typeof db;
export type TenantDb = ReturnType<typeof getTenantDb>;