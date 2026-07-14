import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { batches } from "./batches";

export const batchTeachers = pgTable(
  "batch_teachers",
  {
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),

    userId: uuid("user_id").notNull(),

    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.batchId, table.userId],
    }),
  ]
);

export type BatchTeacher = typeof batchTeachers.$inferSelect;
export type NewBatchTeacher = typeof batchTeachers.$inferInsert;