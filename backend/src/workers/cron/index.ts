import cron from "node-cron";
import { logger } from "@/common/logger/logger";
import { db } from "@/database/client";
import { tenants } from "@/database/schemas/public/tenants";
import { notificationQueue } from "@/common/queue/notification.queue";

export const initCronJobs = () => {
  // Run every day at 09:00 AM
  cron.schedule("0 9 * * *", async () => {
    logger.info("Running daily overdue fee check...");
    try {
      const allTenants = await db.select().from(tenants);

      for (const tenant of allTenants) {
        // Dispatch a background job for EACH tenant so the cron doesn't hang
        await notificationQueue.add("process_overdue_fees", {
          tenantId: tenant.id
        });
      }
    } catch (error) {
      logger.error("Failed to run daily overdue fee cron", error as any);
    }
  });

  logger.info("Cron jobs initialized successfully");
};
