import { Queue } from "bullmq";
import { redis } from "@/config/redis";

export const notificationQueue = new Queue("notification", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export interface SendSmsPayload {
  tenantId: string;
  phones: string[];
  message: string;
}

export interface SendPushPayload {
  tenantId: string;
  fcmTokens: string[];
  title: string;
  body: string;
}

export interface ExportReportPayload {
  tenantId: string;
  email: string;
}

export interface ProcessOverdueFeesPayload {
  tenantId: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface ProcessAnnouncementPayload {
  tenantId: string;
  announcementId: string;
}
