/**
 * Base wrapper for all HTML emails.
 * Ensures compatibility with Gmail, Outlook, etc.
 */
const BaseEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TuitionHub</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; color: #333333; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; }
    .header { background-color: #4F46E5; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
    .content { padding: 40px 30px; line-height: 1.6; font-size: 16px; color: #4b5563; }
    .content h2 { color: #111827; font-size: 20px; margin-top: 0; margin-bottom: 20px; }
    .btn { display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 25px 0; font-size: 16px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TuitionHub</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TuitionHub. All rights reserved.</p>
      <p>This email was sent securely because you are registered on our platform.</p>
    </div>
  </div>
</body>
</html>
`;

export const getPasswordResetTemplate = (resetLink: string) => {
  return BaseEmailTemplate(`
    <h2>Reset Your Password</h2>
    <p>We received a request to reset the password for your TuitionHub account. If you didn't make this request, you can safely ignore this email.</p>
    <p>Click the button below to choose a new password. For security reasons, this link will expire in <strong>1 hour</strong>.</p>
    <div style="text-align: center;">
      <a href="${resetLink}" class="btn">Reset Password</a>
    </div>
    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="word-break: break-all; font-size: 14px; color: #6b7280; background-color: #f3f4f6; padding: 12px; border-radius: 4px;">${resetLink}</p>
  `);
};

export const getEmailVerificationTemplate = (verifyLink: string) => {
  return BaseEmailTemplate(`
    <h2>Verify Your Email Address</h2>
    <p>Welcome to TuitionHub! We're excited to have you on board.</p>
    <p>Before you can get started, we just need to verify your email address. Please click the button below to confirm your account. This link will expire in <strong>24 hours</strong>.</p>
    <div style="text-align: center;">
      <a href="${verifyLink}" class="btn">Verify My Email</a>
    </div>
    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="word-break: break-all; font-size: 14px; color: #6b7280; background-color: #f3f4f6; padding: 12px; border-radius: 4px;">${verifyLink}</p>
  `);
};

export const getInvitationTemplate = (invitationLink: string, roleName: string, tuitionCenterName: string) => {
  return BaseEmailTemplate(`
    <h2>You've been invited!</h2>
    <p>You have been invited to join <strong>${tuitionCenterName}</strong> on TuitionHub as a <strong>${roleName}</strong>.</p>
    <p>Click the button below to accept the invitation and set up your account. This invitation will expire in <strong>48 hours</strong>.</p>
    <div style="text-align: center;">
      <a href="${invitationLink}" class="btn">Accept Invitation</a>
    </div>
  `);
};
