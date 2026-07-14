import {
    pgTable,
    uuid,
    text,
    numeric,
    date,
    timestamp,
    pgEnum,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { students } from "./students";

export const feeStatusEnum = pgEnum("fee_status", [
    "pending",
    "partial",
    "paid",
    "waived",
    "overdue",
]);

export const feeRecords = pgTable(
    "fee_records",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        studentId: uuid("student_id")
            .notNull()
            .references(() => students.id, { onDelete: "restrict" }),

        // Immutable snapshot
        month: date("month").notNull(),           // 2026-07-01
        amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
        amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
        dueDate: date("due_date").notNull(),

        status: feeStatusEnum("fee_status").notNull().default("pending"),
        waiverReason: text("waiver_reason"),

        // Razorpay
        paymentLinkToken: text("payment_link_token"),
        paymentLinkUrl: text("payment_link_url"),
        razorpayLinkId: text("razorpay_link_id"),

        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index("fee_records_student_idx").on(table.studentId),

        index("fee_records_month_idx").on(table.month),

        index("fee_records_status_idx").on(table.status),

        index("fee_records_due_date_idx").on(table.dueDate),

        uniqueIndex("fee_records_student_month_unique").on(
            table.studentId,
            table.month,
        ),
    ]
);

export type FeeRecord = typeof feeRecords.$inferSelect;
export type NewFeeRecord = typeof feeRecords.$inferInsert;