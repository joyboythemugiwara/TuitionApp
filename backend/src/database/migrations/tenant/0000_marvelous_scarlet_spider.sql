CREATE TYPE "public"."announcement_status" AS ENUM('draft', 'scheduled', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."announcement_type" AS ENUM('global', 'batch');--> statement-breakpoint
CREATE TYPE "public"."audit_entity" AS ENUM('student', 'batch', 'fee_record', 'payment', 'announcement', 'user', 'tenant');--> statement-breakpoint
CREATE TYPE "public"."fee_status" AS ENUM('pending', 'partial', 'paid', 'waived', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."phone_label" AS ENUM('student', 'father', 'mother', 'guardian');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('online', 'cash');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('whatsapp', 'sms', 'fcm');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('sent', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('fee_due', 'fee_reminder', 'fee_overdue', 'fee_paid', 'announcement');--> statement-breakpoint
CREATE TYPE "public"."student_log_type" AS ENUM('note', 'status_change', 'batch_transfer', 'fee_waiver', 'payment', 'fee_change');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_type" "announcement_type" NOT NULL,
	"batch_ids" uuid[],
	"title" text NOT NULL,
	"message" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivery_count" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"announcement_status" "announcement_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" "audit_entity" NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_teachers" (
	"batch_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_teachers_batch_id_user_id_pk" PRIMARY KEY("batch_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"schedule" text,
	"default_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"month" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"due_date" date NOT NULL,
	"fee_status" "fee_status" DEFAULT 'pending' NOT NULL,
	"waiver_reason" text,
	"payment_link_token" text,
	"payment_link_url" text,
	"razorpay_link_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"name" text NOT NULL,
	"photo_url" text,
	"school_name" text,
	"board" text,
	"monthly_fee" numeric(10, 2),
	"fee_start_date" date NOT NULL,
	"student_status" "student_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_phones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"number" text NOT NULL,
	"label" "phone_label" DEFAULT 'student' NOT NULL,
	"receive_notifications" boolean DEFAULT true NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fee_record_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_mode" "payment_mode" NOT NULL,
	"razorpay_payment_id" text,
	"razorpay_order_id" text,
	"marked_by" uuid,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid,
	"fee_record_id" uuid,
	"announcement_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"type" "notification_type" NOT NULL,
	"phone_number" text,
	"message" text NOT NULL,
	"status" "notification_status" NOT NULL,
	"error_reason" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"type" "student_log_type" NOT NULL,
	"body" text NOT NULL,
	"metadata" jsonb,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batch_teachers" ADD CONSTRAINT "batch_teachers_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_phones" ADD CONSTRAINT "student_phones_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_fee_record_id_fee_records_id_fk" FOREIGN KEY ("fee_record_id") REFERENCES "public"."fee_records"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_fee_record_id_fee_records_id_fk" FOREIGN KEY ("fee_record_id") REFERENCES "public"."fee_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_logs" ADD CONSTRAINT "student_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_actor_idx" ON "activity_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "announcements_status_idx" ON "announcements" USING btree ("announcement_status");--> statement-breakpoint
CREATE INDEX "announcements_scheduled_at_idx" ON "announcements" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "batches_name_idx" ON "batches" USING btree ("name");--> statement-breakpoint
CREATE INDEX "batches_archived_idx" ON "batches" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "fee_records_student_idx" ON "fee_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "fee_records_month_idx" ON "fee_records" USING btree ("month");--> statement-breakpoint
CREATE INDEX "fee_records_status_idx" ON "fee_records" USING btree ("fee_status");--> statement-breakpoint
CREATE INDEX "fee_records_due_date_idx" ON "fee_records" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_records_student_month_unique" ON "fee_records" USING btree ("student_id","month");--> statement-breakpoint
CREATE INDEX "students_batch_id_idx" ON "students" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("student_status");--> statement-breakpoint
CREATE INDEX "student_phones_number_idx" ON "student_phones" USING btree ("number");--> statement-breakpoint
CREATE INDEX "student_phones_student_idx" ON "student_phones" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "payments_fee_record_idx" ON "payments" USING btree ("fee_record_id");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "notification_logs_student_idx" ON "notification_logs" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "notification_logs_type_idx" ON "notification_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_logs_status_idx" ON "notification_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_logs_sent_at_idx" ON "notification_logs" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "student_logs_student_idx" ON "student_logs" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_logs_created_at_idx" ON "student_logs" USING btree ("created_at");