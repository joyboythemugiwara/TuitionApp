import { Elysia, t } from "elysia";
import { container } from "tsyringe";
import { WebhooksController } from "./webhooks.controller";

const webhooksController = container.resolve(WebhooksController);

export const webhooksRoutes = new Elysia({ prefix: "/webhooks" })
  .post(
    "/razorpay",
    async ({ request, headers, set }) => {
      const signature = headers["x-razorpay-signature"];
      if (!signature) {
        set.status = 400;
        return { success: false, message: "Missing signature" };
      }

      // To validate the webhook properly, we need the exact raw string body.
      // Elysia's request object allows us to read it as text before any JSON parser mangles it.
      const rawBody = await request.text();
      
      const result = await webhooksController.handleRazorpayWebhook(rawBody, signature);
      set.status = 200;
      return result;
    }
  );
