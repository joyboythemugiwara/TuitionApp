import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const userRoleEnum = pgEnum("user_role", [
    "super_admin",
    "admin",
    "teacher",
]);

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("teacher").notNull(),
    avatarUrl: text("avatar_url"),

    // FCM token for push notifications
    fcmToken: text("fcm_token"),

    isActive: boolean("is_active").default(true).notNull(),

    // timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).default(new Date()).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;