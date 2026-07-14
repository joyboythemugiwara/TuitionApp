import { Controller, Inject } from "@/common/decorators";
import { BatchesService } from "./batches.service";
import { CreateBatchRequest, UpdateBatchRequest, AssignTeachersRequest } from "./batches.types";
import { successResponse } from "@/common/responses";

@Controller()
export class BatchesController {
  constructor(@Inject(BatchesService) private readonly service: BatchesService) { }

  async createBatch(tenantId: string, actorId: string, body: CreateBatchRequest) {
    const batch = await this.service.createBatch(tenantId, actorId, body);
    return successResponse("Batch created successfully", batch, 201);
  }

  async getBatch(tenantId: string, batchId: string) {
    const batch = await this.service.getBatch(tenantId, batchId);
    return successResponse("Batch retrieved successfully", batch);
  }

  async listBatches(tenantId: string, query: { archived?: boolean; search?: string; sort?: "name" | "createdAt" | "defaultFee" | "studentCount"; order?: "asc" | "desc"; page?: number; limit?: number; minFee?: number; maxFee?: number; minStudents?: number; maxStudents?: number; schedule?: string; }) {
    const response = await this.service.listBatches(tenantId, query);
    return {
      statusCode: 200,
      body: {
        success: true,
        message: "Batches retrieved successfully",
        data: response.data,
        meta: response.meta
      }
    };
  }

  async updateBatch(tenantId: string, actorId: string, batchId: string, body: UpdateBatchRequest) {
    const batch = await this.service.updateBatch(tenantId, actorId, batchId, body);
    return successResponse("Batch updated successfully", batch);
  }

  async assignTeachers(tenantId: string, actorId: string, batchId: string, body: AssignTeachersRequest) {
    await this.service.assignTeachers(tenantId, actorId, batchId, body);
    return successResponse("Teachers assigned successfully", null);
  }

  async bulkUpdateBatches(tenantId: string, actorId: string, body: { batchIds: string[], updates: { archived?: boolean } }) {
    await this.service.bulkUpdateBatches(tenantId, actorId, body);
    return successResponse("Batches updated successfully", null);
  }

  async deleteBatch(tenantId: string, actorId: string, batchId: string) {
    await this.service.deleteBatch(tenantId, actorId, batchId);
    return successResponse("Batch deleted successfully", null);
  }

  async bulkDeleteBatches(tenantId: string, actorId: string, body: { batchIds: string[] }) {
    await this.service.bulkDeleteBatches(tenantId, actorId, body.batchIds);
    return successResponse("Batches deleted successfully", null);
  }
}
