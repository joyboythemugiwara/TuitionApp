import { Elysia } from "elysia";
import { ForbiddenError } from "../errors/http.error";
import { jwtAuth } from "./auth.middleware";

/**
 * Middleware that checks if the authenticated user has one of the allowed roles.
 * MUST be used after jwtAuth.
 * 
 * @param allowedRoles Array of roles that are permitted to access the route
 */
export const roleAuth = (allowedRoles: string[]) => (app: Elysia) =>
  app.onBeforeHandle(({ user }: any) => {
    if (!user) {
      throw new ForbiddenError("Not authenticated");
    }
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(`Access denied. Requires one of: ${allowedRoles.join(", ")}`);
    }
  });
