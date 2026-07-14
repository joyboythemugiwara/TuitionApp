import { db } from "@/database/client";
import { batches, NewBatch, Batch } from "@/database/schemas/tenant/batches";
import { batchTeachers } from "@/database/schemas/tenant/batch-teachers";
import { students } from "@/database/schemas/tenant/students";
import { eq, and, or, sql, ilike, asc, desc, inArray } from "drizzle-orm";
import { getTenantDb, getTenantSchemaName, withTenantTx } from "@/database/client";
import { Repository, Inject } from "@/common/decorators";
import { AuditService } from "@/common/services/audit.service";

@Repository()
export class BatchesRepository {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  async create(tenantId: string, actorId: string, batchData: NewBatch, teacherIds: string[] = []): Promise<Batch> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      // Create batch
      const [batch] = await tx.insert(batches).values(batchData).returning();

      // Assign teachers
      if (teacherIds.length > 0) {
        const assignments = teacherIds.map(userId => ({
          batchId: batch.id,
          userId,
        }));
        await tx.insert(batchTeachers).values(assignments);
      }

      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "batch.create",
        entity: "batch",
        entityId: batch.id,
        newValue: { ...batch, teachers: teacherIds }
      });

      return batch;
    });
  }

  async findById(tenantId: string, batchId: string) {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      const batchRows = await tx.select()
        .from(batches)
        .where(eq(batches.id, batchId))
        .limit(1);

      if (batchRows.length === 0) return null;

      const teachers = await tx.select()
        .from(batchTeachers)
        .where(eq(batchTeachers.batchId, batchId));

      const batch = batchRows[0];
      return { batch, teachers };
    });
  }

  async list(tenantId: string, filters: { archived?: boolean; search?: string; sort?: "name" | "createdAt" | "defaultFee" | "studentCount"; order?: "asc" | "desc"; page?: number; limit?: number; minFee?: number; maxFee?: number; minStudents?: number; maxStudents?: number; schedule?: string; }) {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    const conditions = [];
    if (filters.archived !== undefined) {
      conditions.push(eq(batches.archived, filters.archived));
    }
    if (filters.search) {
      conditions.push(ilike(batches.name, `%${filters.search}%`));
    }
    if (filters.minFee !== undefined) {
      conditions.push(sql`${batches.defaultFee} >= ${filters.minFee.toString()}`);
    }
    if (filters.maxFee !== undefined) {
      conditions.push(sql`${batches.defaultFee} <= ${filters.maxFee.toString()}`);
    }
    if (filters.schedule) {
      const days = filters.schedule.split(",");
      const scheduleConditions = days.map(day => {
        const trimmed = day.trim();
        const shortDay = trimmed.substring(0, 3);
        return or(
          ilike(batches.schedule, `%${trimmed}%`),
          ilike(batches.schedule, `%${shortDay}%`)
        );
      });
      if (scheduleConditions.length > 0) {
        conditions.push(or(...scheduleConditions));
      }
    }

    if (filters.minStudents !== undefined) {
      conditions.push(sql`(SELECT count(*) FROM ${students} WHERE ${students.batchId} = ${batches.id}) >= ${filters.minStudents}`);
    }
    if (filters.maxStudents !== undefined) {
      conditions.push(sql`(SELECT count(*) FROM ${students} WHERE ${students.batchId} = ${batches.id}) <= ${filters.maxStudents}`);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let sortColumn;
    switch (filters.sort) {
      case 'defaultFee': sortColumn = batches.defaultFee; break;
      case 'createdAt': sortColumn = batches.createdAt; break;
      case 'studentCount': sortColumn = sql`(SELECT count(*) FROM ${students} WHERE ${students.batchId} = ${batches.id})`; break;
      case 'name':
      default: sortColumn = batches.name; break;
    }
    
    const orderFn = filters.order === 'desc' ? desc : asc;
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await withTenantTx(tenantId, async (tx) => {
      const [{ c: count }] = await tx
        .select({ c: sql`count(*)`.mapWith(Number) })
        .from(batches)
        .where(whereClause);

      const paginatedBatches = await tx
        .select({
          batch: batches,
          studentCount: sql<number>`(SELECT count(*)::integer FROM ${students} WHERE ${students.batchId} = ${batches.id})`.mapWith(Number),
        })
        .from(batches)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset);

      return {
        data: paginatedBatches,
        meta: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        }
      };
    });
  }

  async update(tenantId: string, actorId: string, batchId: string, data: Partial<NewBatch>): Promise<void> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    await withTenantTx(tenantId, async (tx) => {
      const [oldBatch] = await tx.select().from(batches).where(eq(batches.id, batchId));
      
      await tx
        .update(batches)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(batches.id, batchId));

      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "batch.update",
        entity: "batch",
        entityId: batchId,
        oldValue: oldBatch,
        newValue: { ...oldBatch, ...data }
      });
    });
  }

  async assignTeachers(tenantId: string, actorId: string, batchId: string, teacherIds: string[]): Promise<void> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    await withTenantTx(tenantId, async (tx) => {
      // Remove existing
      await tx.delete(batchTeachers).where(eq(batchTeachers.batchId, batchId));

      // Insert new
      if (teacherIds.length > 0) {
        const assignments = teacherIds.map(userId => ({
          batchId,
          userId,
        }));
        await tx.insert(batchTeachers).values(assignments);
      }

      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "batch.assign_teachers",
        entity: "batch",
        entityId: batchId,
        newValue: { teachers: teacherIds }
      });
    });
  }

  async bulkUpdate(tenantId: string, actorId: string, batchIds: string[], data: Partial<NewBatch>): Promise<void> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    await withTenantTx(tenantId, async (tx) => {
      await tx
        .update(batches)
        .set({ ...data, updatedAt: new Date() })
        .where(inArray(batches.id, batchIds));

      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "batch.bulk_update",
        entity: "batch",
        entityId: "bulk",
        newValue: { batchIds, updates: data }
      });
    });
  }

  async deleteBatch(tenantId: string, actorId: string, batchId: string): Promise<void> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    try {
      await withTenantTx(tenantId, async (tx) => {
        await tx.delete(batches).where(eq(batches.id, batchId));
        
        await this.auditService.logWithinTransaction(tx, {
          tenantId,
          actorId,
          action: "batch.delete",
          entity: "batch",
          entityId: batchId,
          newValue: null
        });
      });
    } catch (e: any) {
      if (e.message?.includes("foreign key constraint") || e.code === "23503") {
        throw new Error("Cannot delete batch because it has students enrolled.");
      }
      throw e;
    }
  }

  async bulkDelete(tenantId: string, actorId: string, batchIds: string[]): Promise<void> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    try {
      await withTenantTx(tenantId, async (tx) => {
        await tx.delete(batches).where(inArray(batches.id, batchIds));
        
        await this.auditService.logWithinTransaction(tx, {
          tenantId,
          actorId,
          action: "batch.bulk_delete",
          entity: "batch",
          entityId: "bulk",
          newValue: { deletedIds: batchIds }
        });
      });
    } catch (e: any) {
      if (e.message?.includes("foreign key constraint") || e.code === "23503") {
        throw new Error("Cannot delete batches because one or more have students enrolled.");
      }
      throw e;
    }
  }
}
