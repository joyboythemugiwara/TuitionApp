import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";

export const authActionEnum = pgEnum("auth_action", [
  "login",
  "logout",
  "token_refresh",
  "password_change",
  "login_failed",
]);

export const authStatusEnum = pgEnum("auth_status", [
  "success",
  "failed",
]);

export const authLogs = pgTable("auth_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),

  action: authActionEnum("action").notNull(),
  status: authStatusEnum("status").notNull(),

  // Device info
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  // Failure reason
  reason: text("reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuthLog = typeof authLogs.$inferSelect;
export type NewAuthLog = typeof authLogs.$inferInsert;