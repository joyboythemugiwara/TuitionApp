import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  schedule: text("schedule"),
  defaultFee: numeric("default_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  archived: boolean("archived").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("batches_name_idx").on(table.name),
  index("batches_archived_idx").on(table.archived),
]);

export type Batch = typeof batches.$inferSelect;
export type NewBatch = typeof batches.$inferInsert;