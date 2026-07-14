import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
  pgEnum,
  index
} from "drizzle-orm/pg-core";
import { batches } from "./batches";

export const studentStatusEnum = pgEnum("student_status", [
  "active",
  "inactive",
]);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "restrict" }),

  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  schoolName: text("school_name"),
  board: text("board"),

  // Fee config
  monthlyFee: numeric("monthly_fee", { precision: 10, scale: 2 }), // null = use batch default
  feeStartDate: date("fee_start_date").notNull(),


  status: studentStatusEnum("student_status").notNull().default("active"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("students_batch_id_idx").on(table.batchId),
  index("students_status_idx").on(table.status),
]);

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;