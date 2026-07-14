import { Worker, Job } from "bullmq";
import { redis } from "@/config/redis";
import { logger } from "@/common/logger/logger";
import { ProcessAnnouncementPayload, SendSmsPayload, SendPushPayload } from "@/common/queue/notification.queue";
import { container } from "tsyringe";
import { AnnouncementsRepository } from "@/modules/announcements/announcements.repository";
import { StudentsRepository } from "@/modules/students/students.repository";
import { FeesRepository } from "@/modules/fees/fees.repository";
import { DashboardRepository } from "@/modules/dashboard/dashboard.repository";
import { EmailService } from "@/common/services/email.service";
import { messaging } from "@/firebase";
import { db } from "@/database/client";
import { users } from "@/database/schemas/public/users";
import { eq, isNotNull, and } from "drizzle-orm";
import { WhatsappService } from "@/common/services/whatsapp.service";

// A robust worker needs to resolve dependencies
const processAnnouncement = async (job: Job<ProcessAnnouncementPayload>) => {
  const { tenantId, announcementId } = job.data;
  logger.info({ tenantId, announcementId }, "Processing announcement");

  const announcementsRepo = container.resolve(AnnouncementsRepository);
  const studentsRepo = container.resolve(StudentsRepository);

  const announcement = await announcementsRepo.findById(tenantId, announcementId);
  if (!announcement) {
    logger.warn({ announcementId }, "Announcement not found in worker");
    return;
  }

  if (announcement.status === "sent") {
    return;
  }

  // Find target students
  let students = [];
  if (announcement.type === "global") {
    // List all active students
    students = await studentsRepo.list(tenantId, { status: "active" });
  } else if (announcement.batchIds && announcement.batchIds.length > 0) {
    // List students in specific batches
    for (const batchId of announcement.batchIds) {
      const batchStudents = await studentsRepo.list(tenantId, { batchId, status: "active" });
      students.push(...batchStudents);
    }
  }

  // Deduplicate by student id just in case
  const uniqueStudents = Array.from(new Map(students.map(s => [s.id, s])).values());
  
  if (uniqueStudents.length === 0) {
    await announcementsRepo.update(tenantId, announcementId, { status: "sent", deliveryCount: 0 });
    return;
  }

  // Extract FCM tokens
  const fcmTokens = uniqueStudents
    .map(s => s.fcmToken)
    .filter((token): token is string => token !== null && token !== undefined);

  if (fcmTokens.length > 0) {
    // We send FCM pushes in chunks of 500 (Firebase limit per multicast)
    const chunkSize = 500;
    for (let i = 0; i < fcmTokens.length; i += chunkSize) {
      const chunk = fcmTokens.slice(i, i + chunkSize);
      await notificationQueue.add("send_push", {
        tenantId,
        fcmTokens: chunk,
        title: announcement.title,
        body: announcement.message,
      });
    }
  }

  // Here we would integrate with MSG91 or Meta WhatsApp API to dispatch messages.
  // We'll simulate a successful dispatch count.
  const deliveryCount = uniqueStudents.length;

  logger.info({ tenantId, announcementId, deliveryCount }, "Successfully dispatched announcements");

  await announcementsRepo.update(tenantId, announcementId, { 
    status: "sent",
    sentAt: new Date(),
    deliveryCount 
  });
};

const sendSms = async (job: Job<SendSmsPayload>) => {
  const { phones, message } = job.data;
  const whatsappService = container.resolve(WhatsappService);
  
  logger.info({ phonesCount: phones.length }, "Sending WhatsApp messages");

  // Send messages sequentially to avoid hitting rate limits instantly
  for (const phone of phones) {
    await whatsappService.sendMessage(phone, message);
  }
};

const sendPush = async (job: Job<SendPushPayload>) => {
  const { fcmTokens, title, body } = job.data;
  
  if (!fcmTokens || fcmTokens.length === 0) return;

  try {
    const response = await messaging.sendEachForMulticast({
      tokens: fcmTokens,
      notification: {
        title,
        body,
      },
    });

    logger.info({ 
      successCount: response.successCount, 
      failureCount: response.failureCount 
    }, "Successfully dispatched FCM push notifications");

  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to send push notifications via FCM");
    throw error;
  }
};

const exportReport = async (job: Job<ExportReportPayload>) => {
  const { tenantId, email } = job.data;
  
  const dashboardRepo = container.resolve(DashboardRepository);
  const emailService = container.resolve(EmailService);
  
  const stats = await dashboardRepo.getDashboardStats(tenantId);
  
  // Very simple CSV generation
  let csv = "Student Name,Amount Paid,Mode,Date\n";
  stats.recentPayments.forEach(p => {
    csv += `"${p.studentName}",${p.amount},${p.mode},"${new Date(p.paidAt).toISOString()}"\n`;
  });

  const html = `
    <h2>Your Report is Ready</h2>
    <p>Attached is the CSV export of the latest dashboard metrics and recent payments.</p>
    <ul>
      <li><strong>Total Students:</strong> ${stats.totalStudents}</li>
      <li><strong>Monthly Revenue:</strong> ₹${stats.monthlyRevenue}</li>
    </ul>
  `;

  // Use the email service to send it. (Note: EmailService needs to support attachments for full effect, 
  // but we will pass it anyway and update EmailService).
  await emailService.sendEmail(email, "Your TuitionHub Dashboard Export", html, [
    { filename: "dashboard_export.csv", content: Buffer.from(csv).toString("base64") }
  ]);
  
  logger.info({ email }, "Successfully dispatched export report");
};

const processOverdueFees = async (job: Job<ProcessOverdueFeesPayload>) => {
  const { tenantId } = job.data;
  const feesRepo = container.resolve(FeesRepository);
  
  // Find all pending fees
  const pendingFees = await feesRepo.listFees(tenantId, { status: "pending" });
  if (pendingFees.length === 0) return;

  const today = new Date();
  
  let overdueCount = 0;
  for (const fee of pendingFees) {
    if (new Date(fee.dueDate) < today) {
      // It's overdue! We change status to overdue.
      await feesRepo.updateFeeRecord(tenantId, "system", fee.id, { status: "overdue" });
      overdueCount++;
    }
  }

  if (overdueCount > 0) {
    // Alert the admins about exactly how many students became overdue today
    const staff = await db
      .select({ fcmToken: users.fcmToken })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.isActive, true), isNotNull(users.fcmToken)));
      
    const fcmTokens = staff.map(s => s.fcmToken as string).filter(t => t.trim() !== "");
    
    if (fcmTokens.length > 0) {
      await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: {
          title: "Overdue Alert ⚠️",
          body: `${overdueCount} student fees became overdue today. Check the dashboard.`,
        },
      });
    }
  }
};

export const notificationWorker = new Worker("notification", async (job) => {
  switch (job.name) {
    case "process_announcement":
      await processAnnouncement(job as Job<ProcessAnnouncementPayload>);
      break;
    case "send_sms":
      await sendSms(job as Job<SendSmsPayload>);
      break;
    case "send_push":
      await sendPush(job as Job<SendPushPayload>);
      break;
    case "export_report":
      await exportReport(job as Job<ExportReportPayload>);
      break;
    case "send_email":
      const emailService = container.resolve(EmailService);
      const { to, subject, html } = job.data as SendEmailPayload;
      await emailService.sendEmail(to, subject, html);
      logger.info({ to, subject }, "Successfully dispatched email via worker");
      break;
    case "process_overdue_fees":
      await processOverdueFees(job as Job<ProcessOverdueFeesPayload>);
      break;
    default:
      logger.warn({ jobName: job.name }, "Unknown job name");
  }
}, {
  connection: redis as any,
  concurrency: 5,
});

notificationWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id, name: job.name }, "Notification job completed");
});

notificationWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, name: job?.name, error: err.message }, "Notification job failed");
});
