import type { Context } from "elysia";

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── API Response ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;        // user id
  tenantId: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tenantId: string;
  type: "refresh";
  iat?: number;
  exp?: number;
}

// ── Enums ─────────────────────────────────────────────────────────────────────
export type UserRole = "super_admin" | "admin" | "teacher";

export type TenantStatus = "active" | "suspended" | "inactive";

export type StudentStatus = "active" | "inactive";

export type FeeStatus = "pending" | "partial" | "paid" | "waived" | "overdue";

export type PaymentMode = "online" | "cash";

export type AnnouncementType = "global" | "batch";

export type AnnouncementStatus = "draft" | "scheduled" | "sent" | "failed";

export type StudentLogType =
  | "note"
  | "status_change"
  | "batch_transfer"
  | "fee_waiver"
  | "payment"
  | "fee_change";

export type NotificationType =
  | "fee_due"
  | "fee_reminder"
  | "fee_overdue"
  | "fee_paid"
  | "announcement";

export type NotificationChannel = "whatsapp" | "sms" | "fcm";

// ── Elysia Context ────────────────────────────────────────────────────────────
export interface AuthContext {
  user: JwtPayload;
  tenantSchema: string;
}

// ── Database ──────────────────────────────────────────────────────────────────
export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}

// ── Student ───────────────────────────────────────────────────────────────────
export interface StudentPhone {
  number: string;
  label: "student" | "parent" | "guardian";
  receiveNotifications: boolean;
}

// ── Workers / Jobs ────────────────────────────────────────────────────────────
export interface BaseJobData {
  tenantId: string;
  tenantSchema: string;
}

export interface FeeJobData extends BaseJobData {
  month: string;       // YYYY-MM-DD (first day of month)
}

export interface NotificationJobData extends BaseJobData {
  studentId: string;
  feeRecordId?: string;
  type: NotificationType;
  phones: StudentPhone[];
  message: string;
  paymentLink?: string;
}

export interface AnnouncementJobData extends BaseJobData {
  announcementId: string;
  message: string;
  targetPhones: string[];
  type: AnnouncementType;
}