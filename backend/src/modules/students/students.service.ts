import { Service, Inject } from "@/common/decorators";
import { StudentsRepository } from "./students.repository";
import { CreateStudentRequest, UpdateStudentRequest, StudentResponse } from "./students.types";
import { NotFoundError, BadRequestError } from "@/common/errors/http.error";
import { redis } from "@/database/redis";
import { env } from "@/config/env";
import { logger } from "@/common/logger/logger";
import { posthog } from "@/config/posthog";

import { BatchesRepository } from "../batches/batches.repository";

@Service()
export class StudentsService {
  constructor(
    @Inject(StudentsRepository) private readonly repository: StudentsRepository,
    @Inject(BatchesRepository) private readonly batchesRepo: BatchesRepository
  ) {}

  private mapToResponse(student: any, phones: any[]): StudentResponse {
    return {
      id: student.id,
      batchId: student.batchId,
      batchName: student.batchName,
      name: student.name,
      photoUrl: student.photoUrl ? (student.photoUrl.startsWith("http") ? student.photoUrl : `${env.R2_PUBLIC_URL}${student.photoUrl}`) : null,
      schoolName: student.schoolName,
      board: student.board,
      monthlyFee: student.monthlyFee,
      feeStartDate: student.feeStartDate,
      status: student.status,
      phones: phones.map(p => ({
        id: p.id,
        number: p.number,
        label: p.label,
        receiveNotifications: p.receiveNotifications,
        isPrimary: p.isPrimary,
      })),
      createdAt: student.createdAt.toISOString(),
    };
  }

  private async invalidateStudentsCache(tenantId: string) {
    try {
      let cursor = '0';
      const pattern = `tenant:${tenantId}:*students:*`;
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (e) {
      logger.warn({ error: e }, "Failed to invalidate Redis cache");
    }
  }

  async createStudent(tenantId: string, actorId: string, data: CreateStudentRequest): Promise<StudentResponse> {
    const hasPrimary = data.phones.some(p => p.isPrimary);
    if (!hasPrimary) {
      throw new BadRequestError("Student must have at least one primary phone number");
    }

    const batch = await this.batchesRepo.findById(tenantId, data.batchId);
    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    const { student, phones } = await this.repository.createStudentWithPhones(tenantId, actorId, {
      batchId: data.batchId,
      name: data.name,
      photoUrl: data.photoUrl,
      schoolName: data.schoolName,
      board: data.board,
      monthlyFee: data.monthlyFee ? data.monthlyFee.toString() : null,
      feeStartDate: data.feeStartDate,
    }, data.phones);

    await this.invalidateStudentsCache(tenantId);

    posthog.capture({
      distinctId: actorId,
      event: 'student_created',
      properties: {
        tenantId,
        batchId: data.batchId
      }
    });

    return this.mapToResponse(student, phones);
  }

  async getStudent(tenantId: string, studentId: string): Promise<StudentResponse> {
    const result = await this.repository.findById(tenantId, studentId);
    if (!result) throw new NotFoundError("Student not found");
    
    return this.mapToResponse(result.student, result.phones);
  }

  async updateStudent(tenantId: string, actorId: string, studentId: string, data: UpdateStudentRequest): Promise<StudentResponse> {
    const existing = await this.repository.findById(tenantId, studentId);
    if (!existing) {
      throw new NotFoundError("Student not found");
    }

    if (data.batchId && data.batchId !== existing.student.batchId) {
      const batch = await this.batchesRepo.findById(tenantId, data.batchId);
      if (!batch) throw new NotFoundError("Target batch not found");
    }

    if (data.phones) {
      const hasPrimary = data.phones.some(p => p.isPrimary);
      if (!hasPrimary) {
        throw new BadRequestError("Student must have at least one primary phone number");
      }
    }

    const { phones, monthlyFee, ...studentData } = data;
    const updateData: any = { ...studentData };
    
    if (monthlyFee !== undefined) {
      updateData.monthlyFee = monthlyFee === null ? null : monthlyFee.toString();
    }

    await this.repository.updateStudentAndPhones(tenantId, actorId, studentId, updateData, phones);
    
    await this.invalidateStudentsCache(tenantId);
    const updated = await this.repository.findById(tenantId, studentId);
    return this.mapToResponse(updated!.student, updated!.phones);
  }

  async listStudents(tenantId: string, filters: { batchId?: string; status?: "active" | "inactive"; search?: string; sort?: "name" | "createdAt" | "monthlyFee"; order?: "asc" | "desc"; page?: number; limit?: number }) {
    const isSearch = !!filters.search;
    const cacheKey = `tenant:${tenantId}:v2:students:page:${filters.page || 1}:limit:${filters.limit || 10}:batch:${filters.batchId || 'all'}:status:${filters.status || 'all'}:sort:${filters.sort || 'createdAt'}:order:${filters.order || 'desc'}`;
    
    if (!isSearch) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        logger.warn({ error: e }, "Failed to read from Redis cache");
      }
    }

    const result = await this.repository.list(tenantId, filters);
    const response = {
      data: result.data.map((s: any) => this.mapToResponse(s, s.phones)),
      meta: result.meta,
    };

    if (!isSearch) {
      try {
        // Cache for 5 minutes (300 seconds)
        await redis.set(cacheKey, JSON.stringify(response), "EX", 300);
      } catch (e) {
        logger.warn({ error: e }, "Failed to write to Redis cache");
      }
    }

    return response;
  }

  async bulkUpdate(tenantId: string, actorId: string, data: BulkUpdateStudentsRequest): Promise<void> {
    const { studentIds, batchId, status } = data;
    await this.repository.bulkUpdate(tenantId, actorId, studentIds, { batchId, status });
    await this.invalidateStudentsCache(tenantId);
  }

  async deleteStudent(tenantId: string, actorId: string, studentId: string): Promise<void> {
    const existing = await this.repository.findById(tenantId, studentId);
    if (!existing) {
      throw new NotFoundError("Student not found");
    }
    await this.repository.deleteStudent(tenantId, actorId, studentId);
    await this.invalidateStudentsCache(tenantId);
  }

  async bulkDeleteStudents(tenantId: string, actorId: string, studentIds: string[]): Promise<void> {
    if (studentIds.length > 0) {
      await this.repository.bulkDelete(tenantId, actorId, studentIds);
      await this.invalidateStudentsCache(tenantId);
    }
  }
}
