import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { students } from "./students";

export const phoneLabelEnum = pgEnum("phone_label", [
  "student",
  "father",
  "mother",
  "guardian",
]);

export const studentPhones = pgTable(
  "student_phones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),

    number: text("number").notNull(),
    label: phoneLabelEnum("label").notNull().default("student"),
    receiveNotifications: boolean("receive_notifications").notNull().default(true),
    isPrimary: boolean("is_primary").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    numberIdx: index("student_phones_number_idx").on(table.number),
    studentIdx: index("student_phones_student_idx").on(table.studentId),
  }),
);

export type StudentPhone = typeof studentPhones.$inferSelect;
export type NewStudentPhone = typeof studentPhones.$inferInsert;