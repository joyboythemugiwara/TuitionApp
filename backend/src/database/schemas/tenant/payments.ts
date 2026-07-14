import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { feeRecords } from "./fee-records";

export const paymentModeEnum = pgEnum("payment_mode", [
  "online",
  "cash",
]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    feeRecordId: uuid("fee_record_id")
      .notNull()
      .references(() => feeRecords.id, { onDelete: "restrict" }),

    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    mode: paymentModeEnum("payment_mode").notNull(),

    // Online payment
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpayOrderId: text("razorpay_order_id"),
    transactionId: text("transaction_id"),

    // Cash payment
    markedBy: uuid("marked_by"), // references public.users — cross-schema

    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_fee_record_idx").on(table.feeRecordId),
    index("payments_paid_at_idx").on(table.paidAt),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;