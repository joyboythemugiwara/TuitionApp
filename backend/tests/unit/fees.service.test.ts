import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeesService } from "@/modules/fees/fees.service";
import { FeesRepository } from "@/modules/fees/fees.repository";
import { TenantsRepository } from "@/modules/tenants/tenants.repository";
import { StudentsRepository } from "@/modules/students/students.repository";
import { NotFoundError, BadRequestError } from "@/common/errors/http.error";

const { findTenantMock, getActiveStudentsMock, generateFeeRecordsMock, findFeeRecordMock, findStudentMock } = vi.hoisted(() => ({
  findTenantMock: vi.fn(),
  getActiveStudentsMock: vi.fn(),
  generateFeeRecordsMock: vi.fn(),
  findFeeRecordMock: vi.fn(),
  findStudentMock: vi.fn(),
}));

vi.mock("@/modules/fees/fees.repository", () => {
  return {
    FeesRepository: class {
      getActiveStudents = getActiveStudentsMock;
      generateFeeRecords = generateFeeRecordsMock;
      findFeeRecord = findFeeRecordMock;
      listFees = vi.fn();
      markPayment = vi.fn();
      updateFeeRecord = vi.fn();
    }
  };
});

vi.mock("@/modules/tenants/tenants.repository", () => {
  return {
    TenantsRepository: class {
      findById = findTenantMock;
    }
  };
});

vi.mock("@/modules/students/students.repository", () => {
  return {
    StudentsRepository: class {
      findById = findStudentMock;
    }
  };
});

// Mock external dependencies
vi.mock("@/database/client", () => ({ db: { select: vi.fn() } }));
vi.mock("@/common/queue/notification.queue", () => ({ notificationQueue: { add: vi.fn() } }));

describe("FeesService", () => {
  let feesService: FeesService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    const repo = new FeesRepository(null as any);
    const tenantsRepo = new TenantsRepository();
    const studentsRepo = new StudentsRepository(null as any);
    feesService = new FeesService(repo, tenantsRepo, studentsRepo);
  });

  describe("generateFees", () => {
    it("should throw NotFoundError if tenant does not exist", async () => {
      findTenantMock.mockResolvedValueOnce(null);
      getActiveStudentsMock.mockResolvedValueOnce([]);

      await expect(feesService.generateFees("tenant-1", { month: "2023-10" })).rejects.toThrow(NotFoundError);
      expect(findTenantMock).toHaveBeenCalledWith("tenant-1");
      expect(getActiveStudentsMock).toHaveBeenCalledWith("tenant-1", { batchId: undefined, studentId: undefined });
    });

    it("should successfully generate fee records for active students using Promise.all optimization", async () => {
      findTenantMock.mockResolvedValueOnce({ id: "tenant-1", feeDueDay: 5, wabaId: "waba-1", phoneNumberId: "phone-1" });
      getActiveStudentsMock.mockResolvedValueOnce([
        { student: { id: "student-1", monthlyFee: 1500, name: "A" }, phones: [{ number: "1" }] },
        { student: { id: "student-2", monthlyFee: 0, name: "B" }, phones: [] }, // Should be filtered out
        { student: { id: "student-3", monthlyFee: 2000, name: "C" }, phones: [{ number: "2" }] }
      ]);
      generateFeeRecordsMock.mockResolvedValueOnce(2);

      const count = await feesService.generateFees("tenant-1", { month: "2023-10" });
      
      expect(count).toBe(2);
      expect(generateFeeRecordsMock).toHaveBeenCalledTimes(1);
      
      const recordsPassed = generateFeeRecordsMock.mock.calls[0]![1];
      expect(recordsPassed).toHaveLength(2);
      expect(recordsPassed[0]).toMatchObject({ studentId: "student-1", amount: "1500", dueDate: "2023-10-05" });
      expect(recordsPassed[1]).toMatchObject({ studentId: "student-3", amount: "2000", dueDate: "2023-10-05" });
    });
  });

  describe("generatePaymentLink", () => {
    it("should throw NotFoundError if fee record not found", async () => {
      findFeeRecordMock.mockResolvedValueOnce(null);
      await expect(feesService.generatePaymentLink("tenant-1", "fee-1")).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError if fee is already paid", async () => {
      findFeeRecordMock.mockResolvedValueOnce({ id: "fee-1", status: "paid" });
      await expect(feesService.generatePaymentLink("tenant-1", "fee-1")).rejects.toThrow(BadRequestError);
    });
    
    it("should return existing link if already generated", async () => {
      findFeeRecordMock.mockResolvedValueOnce({ 
        id: "fee-1", status: "pending", paymentLinkUrl: "http://link", razorpayLinkId: "rzp_123" 
      });
      const result = await feesService.generatePaymentLink("tenant-1", "fee-1");
      expect(result).toEqual({ paymentLinkUrl: "http://link", paymentLinkId: "rzp_123" });
    });

    it("should fetch tenant and student concurrently and throw if missing razorpay keys", async () => {
      findFeeRecordMock.mockResolvedValueOnce({ id: "fee-1", status: "pending", studentId: "student-1" });
      
      // Concurrently executed!
      findTenantMock.mockResolvedValueOnce({ id: "tenant-1" }); // No razorpay keys
      findStudentMock.mockResolvedValueOnce({ id: "student-1" });

      await expect(feesService.generatePaymentLink("tenant-1", "fee-1")).rejects.toThrow(/Razorpay is not configured/);
      expect(findTenantMock).toHaveBeenCalledWith("tenant-1");
      expect(findStudentMock).toHaveBeenCalledWith("tenant-1", "student-1");
    });
  });
});
