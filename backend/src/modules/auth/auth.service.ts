import { auth as firebaseAuth } from "@/firebase";
import { UnauthorizedError, BadRequestError } from "@/common/errors/http.error";
import { logger } from "@/common/logger/logger";
import { AuthRepository } from "./auth.repository";
import { EmailService } from "@/common/services/email.service";
import { User } from "@/database/schemas/public/users";
import { redis } from "@/database/redis";
import { Service, Inject } from "@/common/decorators";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { 
  FirebaseLoginRequest, ManualLoginRequest, ChangePasswordRequest, 
  ResetPasswordRequest, RegisterRequest, AcceptInvitationRequest,
  FirebaseRegisterRequest
} from "./auth.types";
import { Session } from "@/database/schemas/public/sessions";
import { getPasswordResetTemplate, getEmailVerificationTemplate } from "@/common/templates/email";
import { notificationQueue } from "@/common/queue/notification.queue";

@Service()
export class AuthService {
  constructor(
    @Inject(AuthRepository) private readonly repository: AuthRepository,
    @Inject(EmailService) private readonly emailService: EmailService
  ) {}

  /**
   * Validates a Firebase token, ensures the user exists and is active,
   * and optionally updates their FCM token.
   */
  async verifyAndGetUser(token: string, fcmToken?: string): Promise<User> {
    try {
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      
      if (!decodedToken.email) {
        throw new UnauthorizedError("Firebase token is missing an email address");
      }

      const user = await this.repository.findUserByEmail(decodedToken.email);

      if (!user) {
        throw new UnauthorizedError("User does not exist in our records");
      }

      if (!user.isActive) {
        throw new UnauthorizedError("Your account has been deactivated");
      }

      if (fcmToken && user.fcmToken !== fcmToken) {
        await this.repository.updateFcmToken(user.id, fcmToken);
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      logger.error({ error }, "Firebase login error");
      throw new UnauthorizedError("Invalid or expired Firebase token");
    }
  }

  /**
   * Validates manual email/password login
   */
  async loginWithEmail(body: ManualLoginRequest): Promise<User> {
    const user = await this.repository.findUserByEmail(body.email);
    
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }
    
    if (!user.isActive) {
      throw new UnauthorizedError("Your account has been deactivated");
    }

    if (user.passwordHash === "firebase_auth" || user.passwordHash === "firebase_auth_no_password") {
      throw new UnauthorizedError("Please sign in with Google or Phone");
    }

    const isValid = await argon2.verify(user.passwordHash, body.password);
    
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return user;
  }

  /**
   * Changes the password of an existing user
   */
  async changePassword(userId: string, body: ChangePasswordRequest): Promise<void> {
    const user = await this.repository.findUserById(userId);
    
    if (!user) {
      throw new BadRequestError("User not found");
    }

    if (user.passwordHash === "firebase_auth" || user.passwordHash === "firebase_auth_no_password") {
      throw new BadRequestError("Account is managed by external provider (Google/Phone)");
    }

    const isOldValid = await argon2.verify(user.passwordHash, body.oldPassword);
    
    if (!isOldValid) {
      throw new BadRequestError("Incorrect current password");
    }

    const newHash = await argon2.hash(body.newPassword);
    await this.repository.updatePasswordHash(userId, newHash);
  }

  /**
   * Initiates a password reset request (Forgot Password)
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.repository.findUserByEmail(email);
    
    // We don't throw an error if the user doesn't exist to prevent email enumeration attacks
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    if (user.passwordHash === "firebase_auth" || user.passwordHash === "firebase_auth_no_password") {
      logger.info(`Password reset requested for external provider email: ${email}`);
      return;
    }

    const token = randomBytes(32).toString("hex");
    await redis.set(`pwd_reset:${token}`, user.id, "EX", 3600); // Expires in 1 hour

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = getPasswordResetTemplate(resetLink);
    
    await notificationQueue.add("send_email", {
      to: email,
      subject: "Reset your TuitionHub password",
      html
    });
  }

  /**
   * Confirms a password reset using the Redis token
   */
  async confirmPasswordReset(body: ResetPasswordRequest): Promise<void> {
    const userId = await redis.get(`pwd_reset:${body.token}`);
    if (!userId) {
      throw new BadRequestError("Invalid or expired password reset token");
    }

    const newHash = await argon2.hash(body.newPassword);
    await this.repository.updatePasswordHash(userId, newHash);
    
    // Invalidate the token so it can't be reused
    await redis.del(`pwd_reset:${body.token}`);
    
    // Also log the user out of all devices for security
    await this.repository.deleteAllSessionsForUser(userId);
  }

  // --- Registration & Email Verification ---

  /**
   * Registers a new tenant and admin via Firebase
   */
  async registerWithFirebase(body: FirebaseRegisterRequest): Promise<User> {
    const decodedToken = await firebaseAuth.verifyIdToken(body.token);
    if (!decodedToken.email) {
      throw new BadRequestError("Firebase token is missing an email address");
    }

    const existingUser = await this.repository.findUserByEmail(decodedToken.email);
    if (existingUser) {
      throw new BadRequestError("Email is already registered. Please login instead.");
    }

    // Generate a random password hash since they use Google to login
    const randomPassword = randomBytes(32).toString('hex');
    const passwordHash = await argon2.hash(randomPassword);
    
    // Use their Google name if available, otherwise fallback
    const name = decodedToken.name || decodedToken.email.split('@')[0];

    const user = await this.repository.createTenantAndUser(
      body.tuitionCenterName,
      decodedToken.email,
      passwordHash,
      name
    );

    // Mark user as active immediately since Google verified their email
    await this.repository.updateUserStatus(user.id, true);
    user.isActive = true;

    if (body.fcmToken) {
      await this.repository.updateFcmToken(user.id, body.fcmToken);
    }

    return user;
  }

  /**
   * Registers a new tenant and admin
   */
  async register(body: RegisterRequest): Promise<User> {
    const existingUser = await this.repository.findUserByEmail(body.email);
    if (existingUser) {
      throw new BadRequestError("Email is already in use");
    }

    const passwordHash = await argon2.hash(body.password);
    const user = await this.repository.createTenantAndUser(
      body.tuitionCenterName,
      body.email,
      passwordHash,
      body.name
    );

    await this.sendVerificationEmail(user.email, user.id);
    return user;
  }

  /**
   * Checks if an email is already registered
   */
  async checkEmail(email: string): Promise<boolean> {
    const user = await this.repository.findUserByEmail(email);
    return user === undefined;
  }

  /**
   * Sends or resends an email verification token
   */
  async sendVerificationEmail(email: string, userId?: string): Promise<void> {
    if (!userId) {
      const user = await this.repository.findUserByEmail(email);
      if (!user) return;
      userId = user.id;
    }

    const token = randomBytes(32).toString("hex");
    await redis.set(`email_verify:${token}`, userId, "EX", 86400); // Expires in 24 hours
    
    const verifyLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = getEmailVerificationTemplate(verifyLink);
    
    await notificationQueue.add("send_email", {
      to: email,
      subject: "Verify your TuitionHub email",
      html
    });
  }

  /**
   * Verifies an email address using the Redis token
   */
  async verifyEmail(token: string): Promise<void> {
    const userId = await redis.get(`email_verify:${token}`);
    if (!userId) {
      throw new BadRequestError("Invalid or expired verification token");
    }

    await this.repository.updateUserStatus(userId, true);
    await redis.del(`email_verify:${token}`);
  }

  /**
   * Accepts an invitation to join as a teacher/parent
   */
  async acceptInvitation(body: AcceptInvitationRequest): Promise<void> {
    const userId = await redis.get(`invite:${body.token}`);
    if (!userId) {
      throw new BadRequestError("Invalid or expired invitation token");
    }

    const passwordHash = await argon2.hash(body.password);
    await this.repository.updatePasswordHash(userId, passwordHash);
    await this.repository.updateUserStatus(userId, true);
    
    await redis.del(`invite:${body.token}`);
  }

  // --- Session Management (Refresh Tokens & Logout) ---

  /**
   * Creates a new refresh token session
   */
  async createSession(userId: string, tenantId: string): Promise<string> {
    const rawRefreshToken = randomBytes(40).toString("hex");
    const refreshTokenHash = await argon2.hash(rawRefreshToken);
    
    // Expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await this.repository.createSession({
      userId,
      tenantId,
      refreshTokenHash,
      expiresAt,
    });

    // We return "sessionId.rawToken" so we can look it up by ID later in O(1) time
    return `${session.id}.${rawRefreshToken}`;
  }

  /**
   * Refreshes a session, returning the user if valid
   */
  async refreshSession(tokenString: string): Promise<User> {
    const [sessionId, rawToken] = tokenString.split(".");
    
    if (!sessionId || !rawToken) {
      throw new UnauthorizedError("Invalid refresh token format");
    }

    const session = await this.repository.findSessionById(sessionId);
    
    if (!session) {
      throw new UnauthorizedError("Session not found");
    }

    if (new Date() > session.expiresAt) {
      await this.repository.deleteSession(sessionId);
      throw new UnauthorizedError("Session expired");
    }

    const isValid = await argon2.verify(session.refreshTokenHash, rawToken);
    
    if (!isValid) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await this.repository.findUserById(session.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("User is no longer active");
    }

    return user;
  }

  /**
   * Logs a user out by deleting their session(s)
   */
  async logout(userId: string, tokenString: string, allDevices: boolean = false): Promise<void> {
    if (allDevices) {
      await this.repository.deleteAllSessionsForUser(userId);
    } else {
      const [sessionId] = tokenString.split(".");
      if (sessionId) {
        // Ensure the session belongs to the user before deleting
        const session = await this.repository.findSessionById(sessionId);
        if (session && session.userId === userId) {
          await this.repository.deleteSession(sessionId);
        }
      }
    }
  }
}
