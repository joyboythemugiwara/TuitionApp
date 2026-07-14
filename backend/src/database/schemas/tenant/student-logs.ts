import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { students } from "./students";

export const studentLogTypeEnum = pgEnum("student_log_type", [
  "note",
  "status_change",
  "batch_transfer",
  "fee_waiver",
  "payment",
  "fee_change",
]);

export const studentLogs = pgTable(
  "student_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),

    type: studentLogTypeEnum("type").notNull(),
    body: text("body").notNull(),
    metadata: jsonb("metadata"),    // { old_value, new_value } for changes

    actorId: uuid("actor_id"),      // references public.users — cross schema

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("student_logs_student_idx").on(table.studentId),
    index("student_logs_created_at_idx").on(table.createdAt),
    
  ],
);

export type StudentLog = typeof studentLogs.$inferSelect;
export type NewStudentLog = typeof studentLogs.$inferInsert;