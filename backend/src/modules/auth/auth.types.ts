import { User } from "@/database/schemas/public/users";

export interface FirebaseLoginRequest {
  token: string;
  fcmToken?: string;
}

export interface ManualLoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  tuitionCenterName: string;
}

export interface FirebaseRegisterRequest {
  token: string;
  tuitionCenterName: string;
  fcmToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
  allDevices?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface CheckEmailRequest {
  email: string;
}

export interface AcceptInvitationRequest {
  token: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      tenantId: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}
