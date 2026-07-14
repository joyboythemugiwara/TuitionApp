import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const tenantsStatusEnum = pgEnum("tenant_status", ["active", "inactive", "suspended"]);

export const tenants = pgTable("tenants", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slud").notNull().unique(),

    // whatsapp Business API credentials
    wabaId: text("waba_id"),
    phoneNumberId: text("phone_number_id"),
    whatsappVerified: boolean("whatsapp_verified").default(false),

    // Razorpay credentials
    razorpayKeyId: text("razorpay_key_id"),
    razorpayKeySecret: text("razorpay_key_secret"),

    // Fee Settings
    feeDueDay: integer("fee_due_day").default(10).notNull(),

    // status
    status: tenantsStatusEnum("status").default("active").notNull(),

    // timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).default(new Date()).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(new Date()).notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;