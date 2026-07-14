import {
    pgTable,
    uuid,
    text,
    integer,
    timestamp,
    pgEnum,
    index,
} from "drizzle-orm/pg-core";

export const announcementTypeEnum = pgEnum("announcement_type", [
    "global",
    "batch",
]);

export const announcementStatusEnum = pgEnum("announcement_status", [
    "draft",
    "scheduled",
    "sent",
    "failed",
]);

export const announcements = pgTable(
    "announcements",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        type: announcementTypeEnum("announcement_type").notNull(),
        batchIds: uuid("batch_ids").array(),       // null for global
        title: text("title").notNull(),
        message: text("message").notNull(),

        scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
        sentAt: timestamp("sent_at", { withTimezone: true }),
        deliveryCount: integer("delivery_count").default(0),

        createdBy: uuid("created_by").notNull(),   // references public.users
        status: announcementStatusEnum("announcement_status").notNull().default("draft"),

        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index("announcements_status_idx").on(table.status),
        index("announcements_scheduled_at_idx").on(table.scheduledAt),
    ],
);

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;