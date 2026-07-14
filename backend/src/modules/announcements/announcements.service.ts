import { Service, Inject } from "@/common/decorators";
import { AnnouncementsRepository } from "./announcements.repository";
import { CreateAnnouncementRequest, UpdateAnnouncementRequest, AnnouncementResponse } from "./announcements.types";
import { NotFoundError, BadRequestError } from "@/common/errors/http.error";
import { notificationQueue } from "@/common/queue";

@Service()
export class AnnouncementsService {
  constructor(@Inject(AnnouncementsRepository) private readonly repository: AnnouncementsRepository) {}

  private mapToResponse(ann: any): AnnouncementResponse {
    return {
      id: ann.id,
      type: ann.type,
      batchIds: ann.batchIds,
      title: ann.title,
      message: ann.message,
      scheduledAt: ann.scheduledAt ? ann.scheduledAt.toISOString() : null,
      sentAt: ann.sentAt ? ann.sentAt.toISOString() : null,
      deliveryCount: ann.deliveryCount,
      createdBy: ann.createdBy,
      status: ann.status,
      createdAt: ann.createdAt.toISOString(),
    };
  }

  async createAnnouncement(tenantId: string, userId: string, data: CreateAnnouncementRequest): Promise<AnnouncementResponse> {
    if (data.type === "batch" && (!data.batchIds || data.batchIds.length === 0)) {
      throw new BadRequestError("batchIds are required when type is 'batch'");
    }

    const scheduledDate = data.scheduledAt ? new Date(data.scheduledAt) : null;
    if (scheduledDate && isNaN(scheduledDate.getTime())) {
        throw new BadRequestError("Invalid scheduledAt date format");
    }

    const ann = await this.repository.create(tenantId, {
      type: data.type,
      batchIds: data.type === "batch" ? data.batchIds! : null,
      title: data.title,
      message: data.message,
      scheduledAt: scheduledDate,
      createdBy: userId,
      status: scheduledDate ? "scheduled" : "draft",
    });

    if (ann.status === "scheduled" && scheduledDate) {
      // Delay job until scheduled time
      const delay = scheduledDate.getTime() - Date.now();
      await notificationQueue.add("process_announcement", {
        tenantId,
        announcementId: ann.id
      }, { delay: Math.max(0, delay) });
    }

    return this.mapToResponse(ann);
  }

  async getAnnouncement(tenantId: string, id: string): Promise<AnnouncementResponse> {
    const ann = await this.repository.findById(tenantId, id);
    if (!ann) throw new NotFoundError("Announcement not found");
    return this.mapToResponse(ann);
  }

  async updateAnnouncement(tenantId: string, id: string, data: UpdateAnnouncementRequest): Promise<AnnouncementResponse> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) throw new NotFoundError("Announcement not found");

    if (existing.status === "sent" || existing.status === "failed") {
      throw new BadRequestError("Cannot update an announcement that has already been processed");
    }

    if (data.type === "batch" && existing.type !== "batch" && !data.batchIds) {
        throw new BadRequestError("batchIds are required when type is 'batch'");
    }
    
    const updateData: any = { ...data };
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    
    // Auto-update status if scheduling details change and status isn't explicitly provided
    if (!data.status && data.scheduledAt) {
      updateData.status = "scheduled";
    }

    const updated = await this.repository.update(tenantId, id, updateData);

    if (updated?.status === "scheduled" && updated.scheduledAt) {
      const delay = updated.scheduledAt.getTime() - Date.now();
      await notificationQueue.add("process_announcement", {
        tenantId,
        announcementId: updated.id
      }, { delay: Math.max(0, delay) });
    }

    return this.mapToResponse(updated!);
  }

  async listAnnouncements(tenantId: string, status?: "draft" | "scheduled" | "sent" | "failed"): Promise<AnnouncementResponse[]> {
    const list = await this.repository.list(tenantId, status);
    return list.map(a => this.mapToResponse(a));
  }
}
