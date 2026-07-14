import { Service, Inject } from "@/common/decorators";
import { FeesRepository } from "./fees.repository";
import { GenerateFeesRequest, MarkPaymentRequest, FeeRecordResponse } from "./fees.types";
import { NotFoundError, BadRequestError } from "@/common/errors/http.error";
import { TenantsRepository } from "@/modules/tenants/tenants.repository";
import { StudentsRepository } from "@/modules/students/students.repository";
import { notificationQueue } from "@/common/queue/notification.queue";
import { db } from "@/database/client";
import { users } from "@/database/schemas/public/users";
import { eq, inArray, isNotNull, and } from "drizzle-orm";
import Razorpay from "razorpay";
import dayjs from "dayjs";

@Service()
export class FeesService {
  constructor(
    @Inject(FeesRepository) private readonly repository: FeesRepository,
    @Inject(TenantsRepository) private readonly tenantsRepo: TenantsRepository,
    @Inject(StudentsRepository) private readonly studentsRepo: StudentsRepository
  ) {}

  private mapToResponse(fee: any): FeeRecordResponse {
    return {
      id: fee.id,
      studentId: fee.studentId,
      studentName: fee.studentName,
      studentPhone: fee.studentPhone,
      month: fee.month,
      amount: fee.amount,
      amountPaid: fee.amountPaid,
      dueDate: fee.dueDate,
      status: fee.status,
      waiverReason: fee.waiverReason,
      paymentLinkUrl: fee.paymentLinkUrl,
      createdAt: fee.createdAt.toISOString(),
    };
  }

  async generateFees(tenantId: string, request: GenerateFeesRequest): Promise<number> {
    const [tenant, students] = await Promise.all([
      this.tenantsRepo.findById(tenantId),
      this.repository.getActiveStudents(tenantId, { batchId: request.batchId, studentId: request.studentId })
    ]);
    if (!tenant) throw new NotFoundError("Tenant not found");
    
    const records = students.map(s => {
      const student = s.student;
      const batchFee = s.batchDefaultFee;
      
      // Calculate due date based on tenant settings
      const dueDate = dayjs(request.month).date(tenant.feeDueDay).format("YYYY-MM-DD");
      
      return {
        studentId: student.id,
        month: request.month,
        amount: student.monthlyFee?.toString() || batchFee?.toString() || "0",
        dueDate: dueDate,
        status: "pending" as const,
      };
    }).filter(record => parseFloat(record.amount) > 0);

    return await this.repository.generateFeeRecords(tenantId, records);
  }

  async listFees(tenantId: string, filter?: any): Promise<FeeRecordResponse[]> {
    const list = await this.repository.listFees(tenantId, filter);
    return list.map(fee => this.mapToResponse(fee));
  }

  async markManualPayment(tenantId: string, actorId: string, data: RecordManualPaymentRequest) {
    const feeRecord = await this.repository.findFeeRecord(tenantId, data.feeRecordId);
    if (!feeRecord) {
      throw new NotFoundError("Fee record not found");
    }

    const currentPaid = parseFloat(feeRecord.amountPaid);
    const payingAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    const totalAmount = parseFloat(feeRecord.amount);

    const newPaidAmount = currentPaid + payingAmount;

    let newStatus: "pending" | "partial" | "paid" = "partial";
    if (newPaidAmount >= totalAmount) {
      newStatus = "paid";
    }

    const payment = await this.repository.markPayment(tenantId, {
      feeRecordId: feeRecord.id,
      amount: data.amount.toString(),
      mode: data.mode,
      transactionId: (data as any).transactionId || null,
      paidAt: new Date(),
      markedBy: actorId,
    }, {
      amountPaid: newPaidAmount.toString(),
      status: newStatus
    });

    // --- DISPATCH PUSH NOTIFICATION TO ADMINS/TEACHERS ---
    // Background execution so we don't slow down the API response
    this.notifyStaffAboutPayment(tenantId, feeRecord.studentId, data.amount, newStatus).catch(console.error);

    return payment;
  }

  private async notifyStaffAboutPayment(tenantId: string, studentId: string, amount: number, status: string) {
    const student = await this.studentsRepo.findById(tenantId, studentId);
    if (!student) return;

    const studentName = student.student.name;

    // We want to alert:
    // 1. All Admins & Super Admins of this tenant
    // 2. The specific teachers assigned to this student's batch
    // (For now, we'll just alert all admins + anyone in the tenant to keep it simple, or query users table)
    
    // Fetch all active admins/teachers in this tenant who have an FCM token
    const staff = await db
      .select({ fcmToken: users.fcmToken })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.isActive, true),
          isNotNull(users.fcmToken)
        )
      );

    const fcmTokens = staff.map(s => s.fcmToken as string).filter(t => t.trim() !== "");

    if (fcmTokens.length > 0) {
      await notificationQueue.add("send_push", {
        tenantId,
        fcmTokens,
        title: "Payment Received 💰",
        body: `${studentName} just paid ₹${amount} (${status === 'paid' ? 'Fully Paid' : 'Partial Payment'})`,
      });
    }
  }

  async generatePaymentLink(tenantId: string, feeRecordId: string): Promise<{ paymentLinkUrl: string, paymentLinkId: string }> {
    const feeRecord = await this.repository.findFeeRecord(tenantId, feeRecordId);
    if (!feeRecord) throw new NotFoundError("Fee record not found");
    if (feeRecord.status === "paid") throw new BadRequestError("Fee is already paid");
    
    // Check if it already has an active link
    if (feeRecord.paymentLinkUrl && feeRecord.razorpayLinkId) {
      return {
        paymentLinkUrl: feeRecord.paymentLinkUrl,
        paymentLinkId: feeRecord.razorpayLinkId
      };
    }

    const [tenant, student] = await Promise.all([
      this.tenantsRepo.findById(tenantId),
      this.studentsRepo.findById(tenantId, feeRecord.studentId)
    ]);
    if (!tenant?.razorpayKeyId || !tenant?.razorpayKeySecret) {
      throw new BadRequestError("Razorpay is not configured for this center");
    }
    if (!student) throw new NotFoundError("Student not found");

    // Initialize Tenant's Razorpay Instance
    const razorpay = new Razorpay({
      key_id: tenant.razorpayKeyId,
      key_secret: tenant.razorpayKeySecret,
    });

    const amountDue = parseFloat(feeRecord.amount) - parseFloat(feeRecord.amountPaid);
    if (amountDue <= 0) throw new BadRequestError("No amount is due");

    // Primary phone number for the Razorpay link
    const primaryPhone = student.phones.find((p: any) => p.isPrimary)?.number || student.phones[0]?.number;

    try {
      const paymentLink = await razorpay.paymentLink.create({
        amount: Math.round(amountDue * 100), // Amount in paise
        currency: "INR",
        accept_partial: true,
        description: `Fee Payment for ${dayjs(feeRecord.month).format("MMMM YYYY")}`,
        customer: {
          name: student.name,
          contact: primaryPhone || undefined,
        },
        notify: {
          sms: true,
          email: false,
        },
        reminder_enable: true,
        notes: {
          tenantId: tenantId,
          feeRecordId: feeRecordId,
        },
      });

      await this.repository.updateFeeRecord(tenantId, undefined, feeRecordId, {
        razorpayLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.short_url,
        paymentLinkToken: paymentLink.id,
      });

      return {
        paymentLinkUrl: paymentLink.short_url,
        paymentLinkId: paymentLink.id
      };
    } catch (error: any) {
      const errorMsg = error.error?.description || error.message || JSON.stringify(error);
      throw new BadRequestError(`Failed to generate Razorpay link: ${errorMsg}`);
    }
  }
}
