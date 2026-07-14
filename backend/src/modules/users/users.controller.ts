import { Controller, Inject } from "@/common/decorators";
import { UsersService } from "./users.service";
import { UpdateProfileRequest, InviteUserRequest } from "./users.types";
import { successResponse } from "@/common/responses";

@Controller()
export class UsersController {
  constructor(@Inject(UsersService) private readonly service: UsersService) {}

  async getProfile(userId: string) {
    const user = await this.service.getProfile(userId);
    return successResponse("Profile retrieved successfully", user);
  }

  async updateProfile(userId: string, body: UpdateProfileRequest) {
    const user = await this.service.updateProfile(userId, body);
    return successResponse("Profile updated successfully", user);
  }

  async listUsers(tenantId: string) {
    const users = await this.service.listUsersByTenant(tenantId);
    return successResponse("Users retrieved successfully", users);
  }

  async inviteUser(tenantId: string, body: InviteUserRequest) {
    await this.service.inviteUser(tenantId, body);
    return successResponse(`Invitation sent successfully to ${body.email}`, null);
  }
}
