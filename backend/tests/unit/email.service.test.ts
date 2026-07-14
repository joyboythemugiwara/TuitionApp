import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailService } from "@/common/services/email.service";
import { env } from "@/config/env";
import { Resend } from "resend";
import { getPasswordResetTemplate, getEmailVerificationTemplate } from "@/common/templates/email";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

// Mock Resend SDK
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: sendMock };
    },
  };
});

// Mock environment variables
vi.mock("@/config/env", () => ({
  env: {
    RESEND_API_KEY: "test_api_key",
    RESEND_EMAIL_FROM: "test@tuitionhub.app",
    FRONTEND_URL: "http://localhost:3000",
  },
}));

describe("EmailService", () => {
  let emailService: EmailService;
  beforeEach(() => {
    vi.clearAllMocks();
    emailService = new EmailService();
  });

  it("should initialize Resend if API key is present", () => {
    expect(sendMock).not.toBeNull();
  });

  describe("sendEmail", () => {
    it("should send an email using Resend SDK", async () => {
      sendMock.mockResolvedValueOnce({ id: "email_id" });

      await emailService.sendEmail("user@example.com", "Test Subject", "<p>HTML content</p>");

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith({
        from: "test@tuitionhub.app",
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>HTML content</p>",
      });
    });
  });

  describe("sendPasswordReset", () => {
    it("should format the reset link and send the template", async () => {
      sendMock.mockResolvedValueOnce({ id: "email_id" });

      await emailService.sendPasswordReset("user@example.com", "fake_token");

      const expectedLink = "http://localhost:3000/reset-password?token=fake_token";
      const expectedHtml = getPasswordResetTemplate(expectedLink);

      expect(sendMock).toHaveBeenCalledWith({
        from: "test@tuitionhub.app",
        to: "user@example.com",
        subject: "Reset your TuitionHub password",
        html: expectedHtml,
      });
    });
  });

  describe("sendVerificationEmail", () => {
    it("should format the verification link and send the template", async () => {
      sendMock.mockResolvedValueOnce({ id: "email_id" });

      await emailService.sendVerificationEmail("user@example.com", "fake_token");

      const expectedLink = "http://localhost:3000/verify-email?token=fake_token";
      const expectedHtml = getEmailVerificationTemplate(expectedLink);

      expect(sendMock).toHaveBeenCalledWith({
        from: "test@tuitionhub.app",
        to: "user@example.com",
        subject: "Verify your TuitionHub email",
        html: expectedHtml,
      });
    });
  });
});
