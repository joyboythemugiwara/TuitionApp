import { getTenantDb, getTenantSchemaName, withTenantTx } from "@/database/client";
import { students } from "@/database/schemas/tenant/students";
import { batches } from "@/database/schemas/tenant/batches";
import { studentPhones } from "@/database/schemas/tenant/student-phones";
import { feeRecords } from "@/database/schemas/tenant/fee-records";
import { payments } from "@/database/schemas/tenant/payments";
import { announcements } from "@/database/schemas/tenant/announcements";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { Repository } from "@/common/decorators";
import dayjs from "dayjs";

@Repository()
export class DashboardRepository {
  async getDashboardStats(tenantId: string) {
    const tenantDb = getTenantDb(getTenantSchemaName(tenantId));

    // Monthly Revenue dates
    const startOfMonth = dayjs().startOf("month").toDate();
    const endOfMonth = dayjs().endOf("month").toDate();
    
    // Revenue History dates
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = dayjs().subtract(i, "month");
      return {
        label: d.format("MMM"),
        start: d.startOf("month").toDate(),
        end: d.endOf("month").toDate(),
      };
    }).reverse();
    const historyStartDate = months.at(0)!.start;
    const historyEndDate = months.at(-1)!.end;
    
    // Today's Classes string
    const todayStr = dayjs().format("ddd");

    return await withTenantTx(tenantId, async (tx) => {
      const statsResult = await tx.execute(sql`
        SELECT 
          (SELECT count(*)::integer FROM ${students} WHERE ${students.status} = 'active') as "totalStudents",
          (SELECT count(*)::integer FROM ${batches}) as "activeBatches",
          (SELECT coalesce(sum(${payments.amount}), 0)::float FROM ${payments} WHERE ${payments.paidAt} >= ${startOfMonth.toISOString()} AND ${payments.paidAt} <= ${endOfMonth.toISOString()}) as "monthlyRevenue",
          (SELECT coalesce(sum(${feeRecords.amount} - ${feeRecords.amountPaid}), 0)::float FROM ${feeRecords} WHERE ${feeRecords.status} IN ('pending', 'partial', 'overdue')) as "pendingFees"
      `);

      const recentPayments = await tx.select({
        id: payments.id,
        amount: payments.amount,
        mode: payments.mode,
        paidAt: payments.paidAt,
        studentName: students.name,
      })
      .from(payments)
      .innerJoin(feeRecords, eq(payments.feeRecordId, feeRecords.id))
      .innerJoin(students, eq(feeRecords.studentId, students.id))
      .orderBy(desc(payments.paidAt))
      .limit(5);

      const defaulters = await tx.execute(sql`
        WITH default_fees AS (
          SELECT student_id, sum(amount - amount_paid) as total_due
          FROM ${feeRecords}
          WHERE fee_status IN ('pending', 'partial', 'overdue')
          GROUP BY student_id
          HAVING sum(amount - amount_paid) > 0
          ORDER BY sum(amount - amount_paid) DESC
          LIMIT 5
        )
        SELECT 
          d.student_id as "studentId", 
          s.name as "studentName", 
          p.number as "studentPhone", 
          d.total_due::float as "totalDue"
        FROM default_fees d
        JOIN ${students} s ON d.student_id = s.id
        LEFT JOIN ${studentPhones} p ON p.student_id = s.id AND p.is_primary = true
        ORDER BY d.total_due DESC
      `);

      const todaysClasses = await tx.select({
        id: batches.id,
        name: batches.name,
        schedule: batches.schedule
      })
      .from(batches)
      .where(sql`${batches.schedule} ILIKE ${"%" + todayStr + "%"}`)
      .limit(5);

      const recentAnnouncements = await tx.select({
        id: announcements.id,
        title: announcements.title,
        message: announcements.message,
        type: announcements.type,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .orderBy(desc(announcements.createdAt))
      .limit(3);

      const revenueGrouped = await tx.select({
        monthTrunc: sql<string>`date_trunc('month', ${payments.paidAt})`,
        total: sql<number>`sum(${payments.amount})`
      })
      .from(payments)
      .where(and(gte(payments.paidAt, historyStartDate), lte(payments.paidAt, historyEndDate)))
      .groupBy(sql`date_trunc('month', ${payments.paidAt})`);

      const revenueMap = new Map(
        revenueGrouped.map((r: { monthTrunc: string; total: number | null }) => [
          dayjs(r.monthTrunc).format("MMM"),
          Number(r.total || 0)
        ])
      );

      const revenueHistory = months.map(m => ({
        month: m.label,
        revenue: revenueMap.get(m.label) || 0
      }));

      const stats = (statsResult[0] ?? {}) as any;

      return {
        totalStudents: stats.totalStudents || 0,
        activeBatches: stats.activeBatches || 0,
        monthlyRevenue: stats.monthlyRevenue || 0,
        pendingFees: stats.pendingFees || 0,
        recentPayments,
        defaulters,
        todaysClasses,
        recentAnnouncements,
        revenueHistory,
      };
    });
  }
}
