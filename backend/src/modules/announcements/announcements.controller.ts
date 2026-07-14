import { Controller, Inject } from "@/common/decorators";
import { AnnouncementsService } from "./announcements.service";
import { CreateAnnouncementRequest, UpdateAnnouncementRequest } from "./announcements.types";
import { successResponse } from "@/common/responses";

@Controller()
export class AnnouncementsController {
  constructor(@Inject(AnnouncementsService) private readonly service: AnnouncementsService) {}

  async createAnnouncement(tenantId: string, userId: string, body: CreateAnnouncementRequest) {
    const ann = await this.service.createAnnouncement(tenantId, userId, body);
    return successResponse("Announcement created successfully", ann, 201);
  }

  async getAnnouncement(tenantId: string, id: string) {
    const ann = await this.service.getAnnouncement(tenantId, id);
    return successResponse("Announcement retrieved successfully", ann);
  }

  async updateAnnouncement(tenantId: string, id: string, body: UpdateAnnouncementRequest) {
    const ann = await this.service.updateAnnouncement(tenantId, id, body);
    return successResponse("Announcement updated successfully", ann);
  }

  async listAnnouncements(tenantId: string, query: { status?: "draft" | "scheduled" | "sent" | "failed" }) {
    const list = await this.service.listAnnouncements(tenantId, query.status);
    return successResponse("Announcements retrieved successfully", list);
  }
}
