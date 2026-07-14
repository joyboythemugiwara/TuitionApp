import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysia/server-timing";

import { swaggerConfig } from "@/config/swagger";

import { logger } from "@/common/logger/logger";
import { AppError } from "@/common/errors";
import { errorResponse } from "@/common/responses";
import { env } from "@/config/env";
import { authRoutes } from "@/modules/auth";
import { usersRoutes } from "@/modules/users";
import { studentsRoutes } from "@/modules/students";
import { batchesRoutes } from "@/modules/batches";
import { tenantsRoutes } from "@/modules/tenants";
import { announcementsRoutes } from "@/modules/announcements";
import { feesRoutes } from "@/modules/fees";
import { webhooksRoutes } from "@/modules/webhooks";
import { uploadsRoutes } from "@/modules/uploads";
import { dashboardRoutes } from "@/modules/dashboard";
import { commonRoutes } from "./common/routes/common.routes";

export const app = new Elysia()

  // ── Plugins ────────────────────────────────────────────────────────────────
  .use(serverTiming())

  .use(
    cors({
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      maxAge: 86400, // Cache preflight requests for 24 hours to reduce network overhead
    }),
  )

  .use(swaggerConfig)

  // ── Request Logger & Timing ────────────────────────────────────────────────
  .onRequest(({ request }) => {
    logger.info(
      {
        method: request.method,
        url: request.url,
      },
      "Incoming request",
    );
  })
  .derive(() => ({
    startTime: performance.now(),
  }))
  .onAfterResponse(({ request, set, startTime }) => {
    const durationMs = Math.round(performance.now() - startTime);
    logger.info(
      {
        method: request.method,
        url: request.url,
        status: set.status,
        durationMs,
      },
      `Request completed in ${durationMs}ms`,
    );
  })

  // ── Global Error Handler ───────────────────────────────────────────────────
  .onError(({ error, set, request, startTime, code }: any) => {
    const durationMs = startTime ? Math.round(performance.now() - startTime) : 0;

    // Handle Elysia 404 Not Found
    if (code === "NOT_FOUND") {
      logger.warn({ url: request.url, method: request.method, durationMs }, "Route not found");
      set.status = 404;
      return errorResponse("Route not found", "NOT_FOUND", 404);
    }

    // Operational errors — known, expected
    if (error instanceof AppError) {
      logger.warn(
        {
          code: error.code,
          statusCode: error.statusCode,
          url: request.url,
          method: request.method,
          durationMs,
        },
        error.message,
      );

      set.status = error.statusCode;
      return errorResponse(error.message, error.code, error.statusCode);
    }

    // Elysia validation error
    if (error instanceof Error && error.message === "Validation") {
      logger.warn({ url: request.url, durationMs }, "Validation error");
      set.status = 422;
      return errorResponse("Validation failed", "VALIDATION_ERROR", 422);
    }

    // Unknown / unexpected errors
    logger.error(
      {
        error: error instanceof Error ? error.stack : error,
        url: request.url,
        method: request.method,
        durationMs,
      },
      `Unexpected error in ${durationMs}ms`,
    );

    set.status = 500;
    return errorResponse(
      "Internal server error",
      "INTERNAL_SERVER_ERROR",
      500,
    );
  })

  // ── Health Check ───────────────────────────────────────────────────────────
  .get(
    "/health",
    () => ({
      success: true,
      message: "TuitionHub API is running",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    }),
    {
      detail: {
        tags: ["Health"],
        summary: "Health check",
      },
    },
  )

  // ── Application Routes ─────────────────────────────────────────────────────
  .use(authRoutes)
  .use(usersRoutes)
  .use(studentsRoutes)
  .use(batchesRoutes)
  .use(tenantsRoutes)
  .use(announcementsRoutes)
  .use(feesRoutes)
  .use(webhooksRoutes)
  .use(uploadsRoutes)
  .use(dashboardRoutes);