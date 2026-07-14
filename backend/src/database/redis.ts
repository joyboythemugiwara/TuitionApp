import IORedis from "ioredis";

import { env } from "@/config/env";
import { logger } from "@/common/logger/logger";

// ── Redis Client ──────────────────────────────────────────────────────────────
export const redis = new IORedis(env.REDIS_URL, {
  family: 0,                    // Required for Upstash IPv6 resolution
  maxRetriesPerRequest: null,   // required for BullMQ
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    logger.warn({ times, delay }, "Redis reconnecting...");
    return delay;
  },
  reconnectOnError(error) {
    logger.error({ error }, "Redis connection error");
    return true;
  },
  lazyConnect: true,            // don't connect until first command
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (error) => {
  logger.error({ error }, "Redis error");
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

// ── Health Check ──────────────────────────────────────────────────────────────
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    logger.info("Redis connection established");
    return true;
  } catch (error) {
    logger.error({ error }, "Redis connection failed");
    return false;
  }
}

// ── BullMQ Connection Options ─────────────────────────────────────────────────
// BullMQ needs its own connection — cannot share with main redis client
export const bullMQConnection = new IORedis(env.REDIS_URL, {
  family: 0,                    // Required for Upstash IPv6 resolution
  maxRetriesPerRequest: null,   // required by BullMQ
  enableReadyCheck: false,      // required by BullMQ
});