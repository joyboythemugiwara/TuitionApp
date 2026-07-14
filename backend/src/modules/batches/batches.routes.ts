import { Elysia } from "elysia";
import { container } from "tsyringe";

import { BatchesController } from "./batches.controller";
import { CreateBatchSchema, GetBatchSchema, UpdateBatchSchema, ListBatchesSchema, AssignTeachersSchema, BulkUpdateBatchSchema, DeleteBatchSchema, BulkDeleteBatchSchema } from "./batches.schema";
import { jwtAuth } from "@/common/middleware/auth.middleware";
import { roleAuth } from "@/common/middleware/role.middleware";

const batchesController = container.resolve(BatchesController);

export const batchesRoutes = new Elysia({ prefix: "/batches" })
  .use(jwtAuth)
  .use(roleAuth(["admin", "super_admin", "teacher"])) // All staff can interact with batches

  .post(
    "/",
    async ({ user, body, set }) => {
      const response = await batchesController.createBatch(user.tenantId, user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    CreateBatchSchema
  )
  .patch(
    "/bulk",
    async ({ user, body, set }) => {
      const response = await batchesController.bulkUpdateBatches(user.tenantId, user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    BulkUpdateBatchSchema
  )
  .delete(
    "/bulk",
    async ({ user, body, set }) => {
      const response = await batchesController.bulkDeleteBatches(user.tenantId, user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    BulkDeleteBatchSchema
  )
  .get(
    "/",
    async ({ query, user, set }) => {
      const response = await batchesController.listBatches(user.tenantId, query);
      set.status = response.statusCode;
      return response.body;
    },
    ListBatchesSchema
  )
  .get(
    "/:id",
    async ({ params: { id }, user, set }) => {
      const response = await batchesController.getBatch(user.tenantId, id);
      set.status = response.statusCode;
      return response.body;
    },
    GetBatchSchema
  )
  .put(
    "/:id",
    async ({ user, params: { id }, body, set }) => {
      const response = await batchesController.updateBatch(user.tenantId, user.userId, id, body);
      set.status = response.statusCode;
      return response.body;
    },
    UpdateBatchSchema
  )
  .post(
    "/:id/teachers",
    async ({ user, params: { id }, body, set }) => {
      const response = await batchesController.assignTeachers(user.tenantId, user.userId, id, body);
      set.status = response.statusCode;
      return response.body;
    },
    AssignTeachersSchema
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, set }) => {
      const response = await batchesController.deleteBatch(user.tenantId, user.userId, id);
      set.status = response.statusCode;
      return response.body;
    },
    DeleteBatchSchema
  );
