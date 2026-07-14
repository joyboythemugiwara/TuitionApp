import { Controller, Inject } from "@/common/decorators";
import { FeesService } from "@/modules/fees/fees.service";
import { env } from "@/config/env";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { logger } from "@/common/logger/logger";
import { BadRequestError } from "@/common/errors/http.error";

@Controller()
export class WebhooksController {
  constructor(
    @Inject(FeesService) private readonly feesService: FeesService
  ) {}

  async handleRazorpayWebhook(rawBody: string, signature: string) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      logger.error("Razorpay webhook secret is not configured");
      throw new BadRequestError("Webhook not configured");
    }

    try {
      // Validate signature
      const isValid = validateWebhookSignature(
        rawBody,
        signature,
        env.RAZORPAY_WEBHOOK_SECRET
      );

      if (!isValid) {
        logger.error("Invalid Razorpay webhook signature");
        throw new BadRequestError("Invalid signature");
      }

      const payload = JSON.parse(rawBody);
      const event = payload.event;

      // We only care about successful payments
      if (event === "payment.captured" || event === "payment_link.paid") {
        const paymentEntity = payload.payload.payment?.entity;
        const paymentLinkEntity = payload.payload.payment_link?.entity;
        
        // Notes could be on the payment link or the payment itself depending on the event
        const notes = paymentLinkEntity?.notes || paymentEntity?.notes || {};
        const tenantId = notes.tenantId;
        const feeRecordId = notes.feeRecordId;

        if (!tenantId || !feeRecordId) {
          logger.warn({ paymentId: paymentEntity?.id || paymentLinkEntity?.id }, "Payment missing tenantId or feeRecordId in notes");
          return { status: "ignored", reason: "missing_metadata" };
        }

        if (!paymentEntity) {
          return { status: "ignored", reason: "missing_payment_entity" };
        }

        // Amount is in paise, convert to rupees
        const amount = paymentEntity.amount / 100;

        await this.feesService.markManualPayment(tenantId, "SYSTEM", {
          feeRecordId,
          amount,
          mode: "online",
          razorpayPaymentId: paymentEntity.id,
          razorpayOrderId: paymentEntity.order_id,
        });

        logger.info({ tenantId, feeRecordId }, "Successfully processed Razorpay webhook payment");
        return { status: "success" };
      }

      return { status: "ignored", reason: "unhandled_event" };
    } catch (error: any) {
      logger.error({ error: error.message }, "Error processing Razorpay webhook");
      // Don't throw 500 or Razorpay will keep retrying unnecessarily if it's a structural error, 
      // but if it's a DB error, we should let it retry. Let's throw 400 for bad requests.
      if (error instanceof BadRequestError) throw error;
      throw new BadRequestError("Failed to process webhook");
    }
  }
}
