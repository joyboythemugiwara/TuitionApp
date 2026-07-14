import { Service, Inject } from "@/common/decorators";
import { BatchesRepository } from "./batches.repository";
import { UsersRepository } from "@/modules/users/users.repository";
import { CreateBatchRequest, UpdateBatchRequest, BatchResponse, BatchWithTeachersResponse } from "./batches.types";
import { NotFoundError } from "@/common/errors/http.error";

@Service()
export class BatchesService {
  constructor(
    @Inject(BatchesRepository) private readonly repository: BatchesRepository,
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository
  ) {}

  private mapBatch(batch: any): BatchResponse {
    return {
      id: batch.id,
      name: batch.name,
      schedule: batch.schedule,
      defaultFee: batch.defaultFee,
      archived: batch.archived,
      createdAt: batch.createdAt.toISOString(),
    };
  }

  async createBatch(tenantId: string, actorId: string, data: CreateBatchRequest): Promise<BatchResponse> {
    const batch = await this.repository.create(
      tenantId,
      actorId,
      {
        name: data.name,
        schedule: data.schedule,
        defaultFee: data.defaultFee.toString(),
      },
      data.teacherIds
    );

    return this.mapBatch(batch);
  }

  async getBatch(tenantId: string, batchId: string): Promise<BatchWithTeachersResponse> {
    const result = await this.repository.findById(tenantId, batchId);
    if (!result) throw new NotFoundError("Batch not found");

    const teacherIds = result.teachers.map(t => t.userId);
    const users = teacherIds.length > 0 ? await this.usersRepo.findManyByIds(teacherIds) : [];
    const usersMap = new Map(users.map(u => [u.id, u.name]));

    return {
      ...this.mapBatch(result.batch),
      teachers: result.teachers.map(t => ({
        userId: t.userId,
        name: usersMap.get(t.userId) || "Unknown Teacher",
        assignedAt: t.assignedAt.toISOString(),
      })),
    };
  }

  async listBatches(tenantId: string, filters: { archived?: boolean; search?: string; sort?: "name" | "createdAt" | "defaultFee" | "studentCount"; order?: "asc" | "desc"; page?: number; limit?: number; minFee?: number; maxFee?: number; minStudents?: number; maxStudents?: number; schedule?: string; }) {
    const result = await this.repository.list(tenantId, filters);
    return {
      data: result.data.map(b => ({
        ...this.mapBatch(b.batch),
        studentCount: b.studentCount
      })),
      meta: result.meta
    };
  }

  async updateBatch(tenantId: string, actorId: string, batchId: string, data: UpdateBatchRequest): Promise<BatchWithTeachersResponse> {
    const updateData: any = { ...data };
    if (data.defaultFee !== undefined) {
      updateData.defaultFee = data.defaultFee.toString();
    }

    await this.repository.update(tenantId, actorId, batchId, updateData);
    return await this.getBatch(tenantId, batchId);
  }

  async assignTeachers(tenantId: string, actorId: string, batchId: string, data: AssignTeachersRequest): Promise<void> {
    // Verify batch exists
    const result = await this.repository.findById(tenantId, batchId);
    if (!result) throw new NotFoundError("Batch not found");

    await this.repository.assignTeachers(tenantId, actorId, batchId, data.teacherIds);
  }

  async bulkUpdateBatches(tenantId: string, actorId: string, data: { batchIds: string[], updates: { archived?: boolean } }): Promise<void> {
    const updateData: any = {};
    if (data.updates.archived !== undefined) {
      updateData.archived = data.updates.archived;
    }
    
    if (Object.keys(updateData).length > 0 && data.batchIds.length > 0) {
      await this.repository.bulkUpdate(tenantId, actorId, data.batchIds, updateData);
    }
  }

  async deleteBatch(tenantId: string, actorId: string, batchId: string): Promise<void> {
    const existing = await this.repository.findById(tenantId, batchId);
    if (!existing) {
      throw new NotFoundError("Batch not found");
    }
    // Dependency check will be handled by the database (onDelete: restrict for students)
    // We catch it in the repository and throw a custom error if needed.
    await this.repository.deleteBatch(tenantId, actorId, batchId);
  }

  async bulkDeleteBatches(tenantId: string, actorId: string, batchIds: string[]): Promise<void> {
    if (batchIds.length > 0) {
      await this.repository.bulkDelete(tenantId, actorId, batchIds);
    }
  }
}
