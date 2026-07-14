import { seedLogger } from "./helpers/logger";
import { type Tenant } from "@/database/schemas/public/tenants";
import { feeRecords } from "@/database/schemas/tenant/fee-records";
import { payments } from "@/database/schemas/tenant/payments";
import { getTenantDb, getTenantSchemaName } from "@/database/client";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker/locale/en_IN";

export async function seedFees(tenant: Tenant, students: any[]) {
  seedLogger.info(`Seeding Fee Records and Payments for Tenant: ${tenant.name}...`);
  const tenantDb = getTenantDb(getTenantSchemaName(tenant.id));

  const currentMonth = dayjs().startOf('month').format("YYYY-MM-DD");
  const previousMonth = dayjs().subtract(1, 'month').startOf('month').format("YYYY-MM-DD");

  await tenantDb.transaction(async (tx) => {
    // Generate records for previous month (Most paid, some pending)
    const prevFeeRecords = students.map(student => ({
      studentId: student.id,
      month: previousMonth,
      amount: student.monthlyFee,
      amountPaid: "0",
      dueDate: dayjs(previousMonth).date(5).format("YYYY-MM-DD"),
      status: "pending" as const,
    }));
    
    const prevInserted = await tx.insert(feeRecords).values(prevFeeRecords).returning();

    // Mark 90% of them as Paid (Mocking Payments)
    const mockPayments = [];
    for (const record of prevInserted) {
      if (Math.random() > 0.1) {
        mockPayments.push({
          feeRecordId: record.id,
          amount: record.amount,
          mode: Math.random() > 0.5 ? "cash" : "online",
          reference: faker.string.uuid(),
          paidAt: dayjs(previousMonth).add(Math.floor(Math.random() * 10), 'day').toDate(),
          recordedBy: "system"
        });
        
        await tx.update(feeRecords).set({ status: "paid", amountPaid: record.amount }).where({ id: record.id } as any);
      } else {
        await tx.update(feeRecords).set({ status: "overdue" }).where({ id: record.id } as any);
      }
    }
    
    if (mockPayments.length > 0) {
      await tx.insert(payments).values(mockPayments);
    }

    // Generate records for current month
    const currentFeeRecords = students.map(student => ({
      studentId: student.id,
      month: currentMonth,
      amount: student.monthlyFee,
      amountPaid: "0",
      dueDate: dayjs(currentMonth).date(5).format("YYYY-MM-DD"),
      status: "pending" as const,
    }));

    const currentInserted = await tx.insert(feeRecords).values(currentFeeRecords).returning();
    
    // Mark 30% of them as Paid (Current month)
    const currentMockPayments = [];
    for (const record of currentInserted) {
      if (Math.random() > 0.7) {
        currentMockPayments.push({
          feeRecordId: record.id,
          amount: record.amount,
          mode: Math.random() > 0.2 ? "online" : "cash",
          reference: faker.string.uuid(),
          paidAt: new Date(),
          recordedBy: "system"
        });
        await tx.update(feeRecords).set({ status: "paid", amountPaid: record.amount }).where({ id: record.id } as any);
      }
    }

    if (currentMockPayments.length > 0) {
      await tx.insert(payments).values(currentMockPayments);
    }
  });

  seedLogger.info(`Successfully generated mock Fee Records and Payments`);
}
