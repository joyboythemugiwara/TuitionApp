import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { students } from "./students";
import { feeRecords } from "./fee-records";
import { announcements } from "./announcements";

export const notificationChannelEnum = pgEnum("notification_channel", [
  "whatsapp",
  "sms",
  "fcm",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "fee_due",
  "fee_reminder",
  "fee_overdue",
  "fee_paid",
  "announcement",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "sent",
  "delivered",
  "failed",
]);

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
    feeRecordId: uuid("fee_record_id").references(() => feeRecords.id, { onDelete: "set null" }),
    announcementId: uuid("announcement_id").references(() => announcements.id, { onDelete: "set null" }),

    channel: notificationChannelEnum("channel").notNull(),
    type: notificationTypeEnum("type").notNull(),
    phoneNumber: text("phone_number"),
    message: text("message").notNull(),

    status: notificationStatusEnum("status").notNull(),
    errorReason: text("error_reason"),

    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notification_logs_student_idx").on(table.studentId),
    index("notification_logs_type_idx").on(table.type),
    index("notification_logs_status_idx").on(table.status),
    index("notification_logs_sent_at_idx").on(table.sentAt),
  ],
);

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;