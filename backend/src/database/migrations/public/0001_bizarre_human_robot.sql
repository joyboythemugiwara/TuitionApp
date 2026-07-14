ALTER TABLE "tenants" ALTER COLUMN "created_at" SET DEFAULT '2026-07-13T11:24:50.803Z';--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "updated_at" SET DEFAULT '2026-07-13T11:24:50.803Z';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT '2026-07-13T11:24:50.805Z';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT '2026-07-13T11:24:50.805Z';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;