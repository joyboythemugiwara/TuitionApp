import "reflect-metadata";
import { Sentry } from "./config/sentry";

import { app } from "./app";
import { env } from "@/config/env";
import { logger } from "@/common/logger/logger";
import { checkDbConnection } from "@/database/client";
import { checkRedisConnection } from "@/database/redis";  
import { initFirebase } from "./firebase";
import { initCronJobs } from "./workers/cron";
import "@/workers/notification/notification.worker";

async function bootstrap() {
  // ── DB Health Check ────────────────────────────────────────────────────
  const isDbConnected = await checkDbConnection();
  if (!isDbConnected) {
    logger.error("Failed to connect to database. Exiting.");
    process.exit(1);
  }

  // ── Redis Health Check ─────────────────────────────────────────────────
  const isRedisConnected = await checkRedisConnection();  
  if (!isRedisConnected) {
    logger.error("Failed to connect to Redis. Exiting.");
    process.exit(1);
  }

  // ── Firebase Initialization ────────────────────────────────────────────
  initFirebase();

  // ── Start Server ───────────────────────────────────────────────────────
  app.listen(env.PORT, () => {
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TuitionHub API
  Environment : ${env.NODE_ENV}
  Port        : ${env.PORT}
  Docs        : http://localhost:${env.PORT}/docs
  Health      : http://localhost:${env.PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  });

  // ── Start Cron Jobs ────────────────────────────────────────────────────
  initCronJobs();

  // ── Graceful Shutdown ──────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    await app.stop();
    logger.info("Server stopped.");
    process.exit(0);
  };

  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(reason);
    logger.error({ reason }, "Unhandled promise rejection");
  });

  process.on("uncaughtException", (error) => {
    Sentry.captureException(error);
    logger.error({ error }, "Uncaught exception. Exiting.");
    process.exit(1);
  });
}

bootstrap();