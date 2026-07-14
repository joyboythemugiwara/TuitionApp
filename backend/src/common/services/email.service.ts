import { Resend } from "resend";
import { env } from "@/config/env";
import { logger } from "@/common/logger/logger";
import { Service } from "@/common/decorators";
import { getPasswordResetTemplate, getEmailVerificationTemplate } from "@/common/templates/email";

@Service()
export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
      logger.info("Resend Email Service initialized");
    } else {
      logger.warn("RESEND_API_KEY not found. Emails will be mocked.");
    }
  }

  /**
   * Generic method to send an email
   */
  async sendEmail(to: string, subject: string, html: string, attachments?: { filename: string; content: string | Buffer }[]): Promise<void> {
    if (!this.resend) {
      logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      logger.info(`[MOCK EMAIL BODY]\n${html}`);
      if (attachments) {
        logger.info(`[MOCK ATTACHMENTS] ${attachments.map(a => a.filename).join(', ')}`);
      }
      return;
    }

    try {
      await this.resend.emails.send({
        from: env.RESEND_EMAIL_FROM,
        to,
        subject,
        html,
        attachments,
      });
      logger.info(`Email sent to ${to} (Subject: ${subject})`);
    } catch (error) {
      logger.error({ error, to, subject }, "Failed to send email");
    }
  }

  /**
   * Sends a password reset email
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = getPasswordResetTemplate(resetLink);
    await this.sendEmail(email, "Reset your TuitionHub password", html);
  }

  /**
   * Sends an email verification link
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = getEmailVerificationTemplate(verifyLink);
    await this.sendEmail(email, "Verify your TuitionHub email", html);
  }
}
