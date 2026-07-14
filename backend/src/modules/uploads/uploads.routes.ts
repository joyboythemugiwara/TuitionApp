import { Elysia } from "elysia";
import { container } from "tsyringe";

import { UploadsController } from "./uploads.controller";
import { GeneratePresignedUrlSchema } from "./uploads.schema";
import { jwtAuth } from "@/common/middleware/auth.middleware";

const uploadsController = container.resolve(UploadsController);

export const uploadsRoutes = new Elysia({ prefix: "/uploads" })
  .use(jwtAuth)
  .post(
    "/presigned-url",
    async ({ body, user, set }) => {
      const response = await uploadsController.generatePresignedUrl(user.tenantId, body);
      set.status = response.statusCode;
      return response.body;
    },
    GeneratePresignedUrlSchema
  );
