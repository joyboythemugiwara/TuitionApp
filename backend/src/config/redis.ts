import Redis from "ioredis";
import { env } from "./env";
import { logger } from "@/common/logger/logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

redis.once("ready", async () => {
  logger.info("Redis connection established");
  try {
    // BullMQ absolutely requires the eviction policy to be 'noeviction' to guarantee jobs aren't deleted.
    // By dynamically setting this on startup, we silence the BullMQ warnings and protect our queues.
    await redis.config("SET", "maxmemory-policy", "noeviction");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Could not automatically set Redis maxmemory-policy. If using a managed Redis, you may need to set this in the provider dashboard.");
  }
});
