import { Service } from "@/common/decorators";
import { env } from "@/config/env";
import { logger } from "@/common/logger/logger";

@Service()
export class WhatsappService {
  /**
   * Sends a plain text message via WhatsApp Cloud API.
   * Note: If you want to send template messages, you will need to adjust the payload structure.
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!env.META_WABA_TOKEN || !env.META_PHONE_NUMBER_ID) {
      logger.warn("WhatsApp integration not configured (Missing token or phone number ID)");
      return false;
    }

    // WhatsApp expects the phone number without the '+' sign
    const cleanPhone = to.replace(/[^0-9]/g, "");

    try {
      const response = await fetch(
        `https://graph.facebook.com/${env.META_API_VERSION}/${env.META_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.META_WABA_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "text",
            text: {
              preview_url: false,
              body: message,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        logger.error({ error: data }, "Failed to send WhatsApp message");
        return false;
      }

      logger.info({ to: cleanPhone, messageId: data.messages?.[0]?.id }, "WhatsApp message sent successfully");
      return true;
    } catch (error: any) {
      logger.error({ error: error.message }, "Exception while sending WhatsApp message");
      return false;
    }
  }
}
