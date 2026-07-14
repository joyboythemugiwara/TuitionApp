import { Controller, Inject } from "@/common/decorators";
import { FeesService } from "./fees.service";
import { GenerateFeesRequest, MarkPaymentRequest } from "./fees.types";
import { successResponse } from "@/common/responses";

@Controller()
export class FeesController {
  constructor(@Inject(FeesService) private readonly service: FeesService) {}

  async generateFees(tenantId: string, body: GenerateFeesRequest) {
    const count = await this.service.generateFees(tenantId, body);
    const message = count > 0 
      ? `Generated ${count} new fee record(s)` 
      : "No new fee records generated (they may already exist)";
    return successResponse(message, { generatedCount: count }, 201);
  }

  async listFees(tenantId: string, query: any) {
    const fees = await this.service.listFees(tenantId, query);
    return successResponse("Fees retrieved successfully", fees);
  }

  async markManualPayment(tenantId: string, actorId: string, body: MarkPaymentRequest) {
    const payment = await this.service.markManualPayment(tenantId, actorId, body);
    return successResponse("Payment recorded successfully", payment, 201);
  }

  async generatePaymentLink(tenantId: string, feeRecordId: string, body?: { isReminder?: boolean }) {
    const link = await this.service.generatePaymentLink(tenantId, feeRecordId, body?.isReminder);
    return successResponse(body?.isReminder ? "Reminder sent successfully" : "Payment link generated successfully", link, 201);
  }
}
