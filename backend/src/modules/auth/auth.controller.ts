import { AuthService } from "./auth.service";
import { 
  FirebaseLoginRequest, ManualLoginRequest, ChangePasswordRequest, 
  ResetPasswordRequest, RefreshTokenRequest, LogoutRequest,
  RegisterRequest, ForgotPasswordRequest, VerifyEmailRequest,
  ResendVerificationRequest, CheckEmailRequest, AcceptInvitationRequest,
  FirebaseRegisterRequest
} from "./auth.types";
import { Controller, Inject } from "@/common/decorators";
import { successResponse } from "@/common/responses";
import { posthog } from "@/config/posthog";

@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly service: AuthService) {}

  /**
   * Handles the Firebase login request.
   * Extracts parameters, calls the service, and formats the HTTP response.
   */
  async loginWithFirebase(
    body: FirebaseLoginRequest,
    jwtSign: (payload: any) => Promise<string>
  ): Promise<AuthResponse> {
    const user = await this.service.verifyAndGetUser(body.token, body.fcmToken);
    
    // Sign our internal JWT
    const token = await jwtSign({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });
    
    const refreshToken = await this.service.createSession(user.id, user.tenantId);

    posthog.capture({
      distinctId: user.id,
      event: 'user_logged_in',
      properties: {
        tenantId: user.tenantId,
        method: 'firebase'
      }
    });

    // Return formatted success response
    return successResponse("Successfully logged in", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ? (user.avatarUrl.startsWith("http") ? user.avatarUrl : `${process.env.R2_PUBLIC_URL}${user.avatarUrl}`) : null,
        tenantId: user.tenantId,
      },
      tokens: {
        accessToken: token,
        refreshToken,
      },
    });
  }

  /**
   * Handles manual email/password login.
   */
  async loginWithEmail(
    body: ManualLoginRequest,
    jwtSign: (payload: any) => Promise<string>
  ) {
    const user = await this.service.loginWithEmail(body);
    
    const token = await jwtSign({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });
    
    const refreshToken = await this.service.createSession(user.id, user.tenantId);

    posthog.capture({
      distinctId: user.id,
      event: 'user_logged_in',
      properties: {
        tenantId: user.tenantId,
        method: 'email'
      }
    });

    return successResponse("Successfully logged in", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ? (user.avatarUrl.startsWith("http") ? user.avatarUrl : `${process.env.R2_PUBLIC_URL}${user.avatarUrl}`) : null,
        tenantId: user.tenantId,
      },
      tokens: {
        accessToken: token,
        refreshToken,
      },
    });
  }

  /**
   * Handles refreshing the access token.
   */
  async refresh(body: RefreshTokenRequest, jwtSign: (payload: any) => Promise<string>) {
    const user = await this.service.refreshSession(body.refreshToken);
    
    const token = await jwtSign({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });
    
    const newRefreshToken = await this.service.createSession(user.id, user.tenantId);

    return successResponse("Tokens refreshed successfully", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ? (user.avatarUrl.startsWith("http") ? user.avatarUrl : `${process.env.R2_PUBLIC_URL}${user.avatarUrl}`) : null,
        tenantId: user.tenantId,
      },
      tokens: {
        accessToken: token,
        refreshToken: newRefreshToken,
      },
    });
  }

  /**
   * Handles logout.
   */
  async logout(userId: string, body: LogoutRequest) {
    await this.service.logout(userId, body.refreshToken, body.allDevices);
    return successResponse("Successfully logged out", null);
  }

  /**
   * Handles password change for authenticated users.
   */
  async changePassword(userId: string, body: ChangePasswordRequest) {
    await this.service.changePassword(userId, body);
    return successResponse("Password updated successfully", null);
  }

  /**
   * Handles password reset request (Forgot Password).
   */
  async forgotPassword(body: ForgotPasswordRequest) {
    await this.service.forgotPassword(body.email);
    return successResponse("If that email address exists, we have sent a password reset link", null);
  }

  /**
   * Confirms password reset.
   */
  async confirmPasswordReset(body: ResetPasswordRequest) {
    await this.service.confirmPasswordReset(body);
    return successResponse("Password has been reset successfully", null);
  }

  // --- Registration & Email Verification ---

  /**
   * Handles registering a new tuition center and admin.
   */
  async register(body: RegisterRequest, jwtSign: (payload: any) => Promise<string>) {
    const user = await this.service.register(body);
    
    posthog.capture({
      distinctId: user.id,
      event: 'user_registered',
      properties: {
        tenantId: user.tenantId,
        method: 'email'
      }
    });

    // They still need to verify email before they can use the app fully,
    // but we can log them in if desired, or just return success.
    return successResponse("Registration successful! Please check your email to verify your account.", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ? (user.avatarUrl.startsWith("http") ? user.avatarUrl : `${process.env.R2_PUBLIC_URL}${user.avatarUrl}`) : null,
        tenantId: user.tenantId,
      }
    });
  }

  /**
   * Handles registering a new tuition center and admin via Firebase.
   */
  async registerWithFirebase(
    body: FirebaseRegisterRequest,
    jwtSign: (payload: any) => Promise<string>
  ) {
    const user = await this.service.registerWithFirebase(body);
    
    // Sign our internal JWT
    const token = await jwtSign({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });
    
    const refreshToken = await this.service.createSession(user.id, user.tenantId);

    // Return formatted success response
    return successResponse("Successfully registered via Google", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ? (user.avatarUrl.startsWith("http") ? user.avatarUrl : `${process.env.R2_PUBLIC_URL}${user.avatarUrl}`) : null,
        tenantId: user.tenantId,
      },
      tokens: {
        accessToken: token,
        refreshToken,
      },
    });
  }

  /**
   * Checks if an email is available.
   */
  async checkEmail(body: CheckEmailRequest) {
    const isAvailable = await this.service.checkEmail(body.email);
    return successResponse("Email checked", { isAvailable });
  }

  /**
   * Verifies an email using the token.
   */
  async verifyEmail(body: VerifyEmailRequest) {
    await this.service.verifyEmail(body.token);
    return successResponse("Email verified successfully. You can now log in.", null);
  }

  /**
   * Resends the verification email.
   */
  async resendVerification(body: ResendVerificationRequest) {
    await this.service.sendVerificationEmail(body.email);
    return successResponse("If the email exists and is unverified, a new link has been sent.", null);
  }

  /**
   * Accepts an invitation link.
   */
  async acceptInvitation(body: AcceptInvitationRequest) {
    await this.service.acceptInvitation(body);
    return successResponse("Invitation accepted. You can now log in.", null);
  }
}
