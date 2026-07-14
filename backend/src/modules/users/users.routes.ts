import { Elysia } from "elysia";
import { container } from "tsyringe";

import { UsersController } from "./users.controller";
import { GetProfileSchema, UpdateProfileSchema, ListUsersSchema, InviteUserSchema } from "./users.schema";
import { jwtAuth } from "@/common/middleware/auth.middleware";
import { roleAuth } from "@/common/middleware/role.middleware";

// Dependency Injection setup
const usersController = container.resolve(UsersController);

export const usersRoutes = new Elysia({ prefix: "/users" })
  .use(jwtAuth) // All user routes require authentication
  
  // Profile Routes (Any authenticated user)
  .get(
    "/me",
    async ({ user, set }) => {
      const response = await usersController.getProfile(user.userId);
      set.status = response.statusCode;
      return response.body;
    },
    GetProfileSchema
  )
  .patch(
    "/me",
    async ({ body, user, set }) => {
      const response = await usersController.updateProfile(user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    UpdateProfileSchema
  )
  
  // Admin-Only Routes
  .use(roleAuth(["admin"])) // Restrict below routes to admins only
  .get(
    "/",
    async ({ user, set }) => {
      const response = await usersController.listUsers(user.tenantId);
      set.status = response.statusCode;
      return response.body;
    },
    ListUsersSchema
  )
  .post(
    "/invite",
    async ({ body, user, set }) => {
      const response = await usersController.inviteUser(user.tenantId, body);
      set.status = response.statusCode;
      return response.body;
    },
    InviteUserSchema
  );
