import { Elysia } from "elysia";
import { container } from "tsyringe";

import { TenantsController } from "./tenants.controller";
import { GetTenantSchema, UpdateTenantSchema } from "./tenants.schema";
import { jwtAuth } from "@/common/middleware/auth.middleware";
import { roleAuth } from "@/common/middleware/role.middleware";

const tenantsController = container.resolve(TenantsController);

export const tenantsRoutes = new Elysia({ prefix: "/tenants" })
  .use(jwtAuth)
  .use(roleAuth(["admin", "super_admin"])) // Only Admins can view/edit tenant config
  
  .get(
    "/me",
    async ({ user, set }) => {
      const response = await tenantsController.getTenant(user.tenantId);
      set.status = response.statusCode;
      return response.body;
    },
    GetTenantSchema
  )
  .patch(
    "/me",
    async ({ body, user, set }) => {
      const response = await tenantsController.updateTenant(user.tenantId, body);
      set.status = response.statusCode;
      return response.body;
    },
    UpdateTenantSchema
  );
