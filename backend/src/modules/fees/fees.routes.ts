import { Elysia } from "elysia";
import { container } from "tsyringe";

import { FeesController } from "./fees.controller";
import { GenerateFeesSchema, ListFeesSchema, MarkPaymentSchema, GeneratePaymentLinkSchema } from "./fees.schema";
import { jwtAuth } from "@/common/middleware/auth.middleware";
import { roleAuth } from "@/common/middleware/role.middleware";

const feesController = container.resolve(FeesController);

export const feesRoutes = new Elysia({ prefix: "/fees" })
  .use(jwtAuth)
  .use(roleAuth(["admin", "super_admin"])) // Fees can only be managed by admins

  .post(
    "/generate",
    async ({ body, user, set }) => {
      const response = await feesController.generateFees(user.tenantId!, body);
      set.status = response.statusCode;
      return response.body;
    },
    GenerateFeesSchema
  )
  .get(
    "/",
    async ({ query, user, set }) => {
      const response = await feesController.listFees(user.tenantId!, query);
      set.status = response.statusCode;
      return response.body;
    },
    ListFeesSchema
  )
  .post(
    "/payments/manual",
    async ({ user, body, set }) => {
      const response = await feesController.markManualPayment(user.tenantId!, user.userId!, body);
      set.status = response.statusCode;
      return response.body;
    },
    MarkPaymentSchema
  )
  .post(
    "/:id/payment-link",
    async ({ params: { id }, body, user, set }) => {
      const response = await feesController.generatePaymentLink(user.tenantId!, id, body as any);
      set.status = response.statusCode;
      return response.body;
    },
    GeneratePaymentLinkSchema
  );
