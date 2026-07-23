import * as Sentry from "@sentry/bun";
import { env } from "./env";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 1.0, // Capture 100% of transactions in dev (lower this in production)
  });
}

export { Sentry };
