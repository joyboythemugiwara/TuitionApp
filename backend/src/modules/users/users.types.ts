export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
  fcmToken?: string | null;
}

export interface InviteUserRequest {
  email: string;
  name: string;
  role: "teacher" | "parent" | "admin" | "student";
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}
