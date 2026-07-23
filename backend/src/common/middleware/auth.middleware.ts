import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { UnauthorizedError } from "@/common/errors/http.error";
import { auth as firebaseAuthInstance } from "@/firebase";
import { env } from "@/config/env";
import { logger } from "@/common/logger/logger";

export interface FirebaseAuthUser {
  uid: string;
  email?: string;
  phoneNumber?: string;
}

export interface JwtAuthUser {
  userId: string;
  tenantId?: string;
  role: string;
  [key: string]: any;
}

// ── Firebase Authentication Middleware ──────────────────────────────────────
export const firebaseAuth = (app: Elysia) => app
  .derive(async ({ headers }) => {
    const authHeader = headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("Malformed authorization header");
    }

    try {
      const decodedToken = await firebaseAuthInstance.verifyIdToken(token);
      const user: FirebaseAuthUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        phoneNumber: decodedToken.phone_number,
      };

      return { user };
    } catch (error) {
      logger.warn({ error }, "Firebase token verification failed");
      throw new UnauthorizedError("Invalid or expired Firebase token");
    }
  });

// ── Internal JWT Authentication Middleware ──────────────────────────────────
export const jwtAuth = (app: Elysia) => app
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
    })
  )
  .derive(async ({ headers, jwt }) => {
    const authHeader = headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("Malformed authorization header");
    }

    const payload = await jwt.verify(token);

    if (!payload) {
      throw new UnauthorizedError("Invalid or expired JWT token");
    }

    const user = payload as unknown as JwtAuthUser;

    return { user };
  });
