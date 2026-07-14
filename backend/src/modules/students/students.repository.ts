import { db } from "@/database/client";
import { students, NewStudent } from "@/database/schemas/tenant/students";
import { studentPhones, NewStudentPhone } from "@/database/schemas/tenant/student-phones";
import { eq, and, or, inArray, sql, ilike, asc, desc } from "drizzle-orm";
import { batches } from "@/database/schemas/tenant/batches";
import { getTenantDb, getTenantSchemaName, withTenantTx } from "@/database/client";
import { Repository, Inject } from "@/common/decorators";
import { AuditService } from "@/common/services/audit.service";

@Repository()
export class StudentsRepository {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}
  
  async createStudentWithPhones(tenantId: string, actorId: string, studentData: NewStudent, phones: Omit<NewStudentPhone, "studentId">[]) {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      // 2. Insert student
      const [student] = await tx.insert(students).values(studentData).returning();

      // 3. Insert phones
      const phonesToInsert = phones.map(p => ({
        ...p,
        studentId: student.id
      }));
      
      const insertedPhones = await tx.insert(studentPhones).values(phonesToInsert).returning();

      // Write Audit Log within the exact same transaction!
      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "student.create",
        entity: "student",
        entityId: student.id,
        newValue: { ...student, phones: insertedPhones }
      });

      return { student, phones: insertedPhones };
    });
  }

  async findById(tenantId: string, studentId: string) {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      const resultRows = await tx.select({
        student: students,
        batchName: batches.name,
      })
      .from(students)
      .leftJoin(batches, eq(students.batchId, batches.id))
      .where(eq(students.id, studentId))
      .limit(1);
        
      if (resultRows.length === 0) return null;

      const phones = await tx.select()
        .from(studentPhones)
        .where(eq(studentPhones.studentId, studentId));
      
      const student = { ...resultRows[0].student, batchName: resultRows[0].batchName };

      return { student, phones };
    });
  }

  async list(tenantId: string, filters: { batchId?: string; status?: "active" | "inactive"; search?: string; sort?: "name" | "createdAt" | "monthlyFee"; order?: "asc" | "desc"; page?: number; limit?: number }) {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      let query = tx.select().from(students).$dynamic();
      const conditions = [];

      if (filters.batchId) conditions.push(eq(students.batchId, filters.batchId));
      if (filters.status) conditions.push(eq(students.status, filters.status));
      if (filters.search) {
        conditions.push(
          or(
            ilike(students.name, `%${filters.search}%`),
            ilike(students.schoolName, `%${filters.search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const [{ count }] = await tx
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(students)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      let sortColumn;
      switch (filters.sort) {
        case 'name': sortColumn = students.name; break;
        case 'monthlyFee': sortColumn = students.monthlyFee; break;
        case 'createdAt':
        default: sortColumn = students.createdAt; break;
      }
      
      const orderFn = filters.order === 'asc' ? asc : desc;

      const paginatedStudents = await tx
        .select({
          student: students,
          batchName: batches.name,
        })
        .from(students)
        .leftJoin(batches, eq(students.batchId, batches.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset);

      const studentIds = paginatedStudents.map(r => r.student.id);
      
      let allPhones = [] as any[];
      if (studentIds.length > 0) {
        allPhones = await tx
          .select()
          .from(studentPhones)
          .where(inArray(studentPhones.studentId, studentIds));
      }

      // Group by student
      const map = new Map();
      for (const row of paginatedStudents) {
        map.set(row.student.id, { ...row.student, batchName: row.batchName, phones: [] });
      }
      
      for (const phone of allPhones) {
        if (map.has(phone.studentId)) {
          map.get(phone.studentId).phones.push(phone);
        }
      }

      return {
        data: Array.from(map.values()),
        meta: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        }
      };
    });
  }

  async updateStudentAndPhones(tenantId: string, actorId: string, studentId: string, studentData: Partial<NewStudent>, newPhones?: Omit<NewStudentPhone, "studentId">[]) {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      // Fetch old value for auditing
      const [oldStudent] = await tx.select().from(students).where(eq(students.id, studentId));

      // 1. Update student
      if (Object.keys(studentData).length > 0) {
        await tx.update(students)
          .set({ ...studentData, updatedAt: new Date() })
          .where(eq(students.id, studentId));
      }

      // 2. Replace phones if provided
      if (newPhones) {
        await tx.delete(studentPhones).where(eq(studentPhones.studentId, studentId));
        
        const phonesToInsert = newPhones.map(p => ({
          ...p,
          studentId: studentId
        }));
        await tx.insert(studentPhones).values(phonesToInsert);
      }

      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "student.update",
        entity: "student",
        entityId: studentId,
        oldValue: oldStudent,
        newValue: { ...oldStudent, ...studentData, phonesUpdated: !!newPhones }
      });

      return true; // we just return success, service will re-fetch
    });
  }

  async bulkUpdate(tenantId: string, actorId: string, studentIds: string[], updates: { batchId?: string | null; status?: "active" | "inactive" }) {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      await tx
        .update(students)
        .set({ ...updates, updatedAt: new Date() })
        .where(inArray(students.id, studentIds));

      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "student.bulk_update",
        entity: "student",
        entityId: "00000000-0000-0000-0000-000000000000", // Bulk indicator
        newValue: { updatedIds: studentIds, updates }
      });
    });
  }

  async deleteStudent(tenantId: string, actorId: string, studentId: string): Promise<void> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    await withTenantTx(tenantId, async (tx) => {
      // Delete associated phones first if needed (usually handled by cascade in DB, but safe to explicitly delete or rely on DB)
      // Drizzle handles cascade if set in schema. Assuming schema has cascade or we just delete student
      await tx.delete(students).where(eq(students.id, studentId));
      
      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "student.delete",
        entity: "student",
        entityId: studentId,
        newValue: null
      });
    });
  }

  async bulkDelete(tenantId: string, actorId: string, studentIds: string[]): Promise<void> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    await withTenantTx(tenantId, async (tx) => {
      await tx.delete(students).where(inArray(students.id, studentIds));
      
      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "student.bulk_delete",
        entity: "student",
        entityId: "00000000-0000-0000-0000-000000000000",
        newValue: { deletedIds: studentIds }
      });
    });
  }
}
