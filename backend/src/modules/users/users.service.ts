import { Service, Inject } from "@/common/decorators";
import { UsersRepository } from "./users.repository";
import { EmailService } from "@/common/services/email.service";
import { UpdateProfileRequest, InviteUserRequest, UserResponse } from "./users.types";
import { NotFoundError, BadRequestError } from "@/common/errors/http.error";
import { env } from "@/config/env";
import { redis } from "@/database/redis";
import { randomBytes } from "crypto";
import { getInvitationTemplate } from "@/common/templates/email";
import { notificationQueue } from "@/common/queue/notification.queue";

@Service()
export class UsersService {
  constructor(
    @Inject(UsersRepository) private readonly repository: UsersRepository,
    @Inject(EmailService) private readonly emailService: EmailService
  ) {}

  /**
   * Transforms a DB user to a public DTO
   */
  private toUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ? (user.avatarUrl.startsWith("http") ? user.avatarUrl : `${env.R2_PUBLIC_URL}${user.avatarUrl}`) : null,
      tenantId: user.tenantId,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return this.toUserResponse(user);
  }

  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserResponse> {
    const user = await this.repository.update(userId, data);
    if (!user) throw new NotFoundError("User not found");
    return this.toUserResponse(user);
  }

  async listUsersByTenant(tenantId: string): Promise<UserResponse[]> {
    const users = await this.repository.findByTenantId(tenantId);
    return users.map(u => this.toUserResponse(u));
  }

  async inviteUser(tenantId: string, data: InviteUserRequest): Promise<void> {
    // 1. Check if user already exists
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new BadRequestError("User with this email already exists");
    }

    // 2. Create the user as inactive with a random placeholder password hash
    // They will set their own password when accepting the invitation
    const user = await this.repository.create({
      tenantId,
      name: data.name,
      email: data.email,
      passwordHash: "INVITED_NO_PASSWORD",
      role: data.role as any,
      isActive: false,
    });

    // 3. Generate invitation token in Redis
    const token = randomBytes(32).toString("hex");
    await redis.set(`invite:${token}`, user.id, "EX", 172800); // Expires in 48 hours

    // 4. Send email
    const tuitionCenterName = await this.repository.getTenantName(tenantId);
    const inviteLink = `${env.FRONTEND_URL}/accept-invitation?token=${token}`;
    
    const html = getInvitationTemplate(inviteLink, data.role, tuitionCenterName);
    
    // Dispatch to BullMQ for robust, non-blocking email delivery
    await notificationQueue.add("send_email", {
      to: data.email,
      subject: `You've been invited to ${tuitionCenterName}`,
      html
    });
  }
}
