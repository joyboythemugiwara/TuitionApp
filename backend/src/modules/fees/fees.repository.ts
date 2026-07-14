import { getTenantDb, getTenantSchemaName, withTenantTx } from "@/database/client";
import { feeRecords, NewFeeRecord, FeeRecord } from "@/database/schemas/tenant/fee-records";
import { payments, NewPayment, Payment } from "@/database/schemas/tenant/payments";
import { students } from "@/database/schemas/tenant/students";
import { studentPhones } from "@/database/schemas/tenant/student-phones";
import { eq, and } from "drizzle-orm";
import { batches } from "@/database/schemas/tenant/batches";
import { Repository, Inject } from "@/common/decorators";
import { AuditService } from "@/common/services/audit.service";

@Repository()
export class FeesRepository {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}
  async getActiveStudents(tenantId: string, filter?: { batchId?: string; studentId?: string }) {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      let query = tx.select({
        student: students,
        batchDefaultFee: batches.defaultFee
      }).from(students)
      .leftJoin(batches, eq(students.batchId, batches.id))
      .where(eq(students.status, "active")).$dynamic();
      
      const conditions = [eq(students.status, "active")];
      if (filter?.batchId) conditions.push(eq(students.batchId, filter.batchId));
      if (filter?.studentId) conditions.push(eq(students.id, filter.studentId));

      return await tx.select({
        student: students,
        batchDefaultFee: batches.defaultFee
      }).from(students)
      .leftJoin(batches, eq(students.batchId, batches.id))
      .where(and(...conditions));
    });
  }

  async generateFeeRecords(tenantId: string, records: NewFeeRecord[]): Promise<number> {
    if (records.length === 0) return 0;
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    
    return await withTenantTx(tenantId, async (tx) => {
      const inserted = await tx
        .insert(feeRecords)
        .values(records)
        .onConflictDoNothing({ target: [feeRecords.studentId, feeRecords.month] })
        .returning();

      if (inserted.length > 0) {
        // Log generation
        await this.auditService.logWithinTransaction(tx, {
          tenantId,
          // actorId: undefined, // System action
          action: "fee_record.bulk_generate",
          entity: "fee_record",
          entityId: "00000000-0000-0000-0000-000000000000",
          newValue: { count: inserted.length, records: inserted.map(r => r.id) }
        });
      }
      
      return inserted.length;
    });
  }

  async listFees(tenantId: string, filter?: { month?: string; status?: "pending" | "partial" | "paid" | "waived" | "overdue", studentId?: string }): Promise<any[]> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      let query = tx.select({
        id: feeRecords.id,
        studentId: feeRecords.studentId,
        month: feeRecords.month,
        amount: feeRecords.amount,
        amountPaid: feeRecords.amountPaid,
        dueDate: feeRecords.dueDate,
        status: feeRecords.status,
        waiverReason: feeRecords.waiverReason,
        paymentLinkUrl: feeRecords.paymentLinkUrl,
        createdAt: feeRecords.createdAt,
        studentName: students.name,
        studentPhone: studentPhones.number,
      }).from(feeRecords)
      .innerJoin(students, eq(feeRecords.studentId, students.id))
      .leftJoin(studentPhones, and(eq(students.id, studentPhones.studentId), eq(studentPhones.isPrimary, true)))
      .$dynamic();
      
      const conditions = [];
      if (filter?.month) conditions.push(eq(feeRecords.month, filter.month));
      if (filter?.status) conditions.push(eq(feeRecords.status, filter.status));
      if (filter?.studentId) conditions.push(eq(feeRecords.studentId, filter.studentId));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query;
    });
  }

  async findFeeRecord(tenantId: string, id: string): Promise<FeeRecord | undefined> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      const [record] = await tx.select().from(feeRecords).where(eq(feeRecords.id, id)).limit(1);
      return record;
    });
    
  }

  async markPayment(tenantId: string, paymentData: NewPayment, feeUpdates: { amountPaid: string; status: "pending" | "partial" | "paid" }): Promise<Payment> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    return await withTenantTx(tenantId, async (tx) => {
      // 1. Insert payment
      const [payment] = await tx.insert(payments).values(paymentData).returning();

      // 2. Update fee record
      await tx
        .update(feeRecords)
        .set({
          amountPaid: feeUpdates.amountPaid,
          status: feeUpdates.status,
          updatedAt: new Date()
        })
        .where(eq(feeRecords.id, paymentData.feeRecordId));

      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId: paymentData.markedBy,
        action: "payment.create",
        entity: "payment",
        entityId: payment.id,
        newValue: paymentData
      });

      return payment;
    });
  }

  async updateFeeRecord(tenantId: string, actorId: string | undefined, id: string, updates: Partial<FeeRecord>): Promise<void> {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));
    await withTenantTx(tenantId, async (tx) => {
      const [oldRecord] = await tx.select().from(feeRecords).where(eq(feeRecords.id, id));
      
      await tx.update(feeRecords).set(updates).where(eq(feeRecords.id, id));

      await this.auditService.logWithinTransaction(tx, {
        tenantId,
        actorId,
        action: "fee_record.update",
        entity: "fee_record",
        entityId: id,
        oldValue: oldRecord,
        newValue: { ...oldRecord, ...updates }
      });
    });
  }
}
