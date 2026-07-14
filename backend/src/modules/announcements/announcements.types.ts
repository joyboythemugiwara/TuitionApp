export interface CreateAnnouncementRequest {
  type: "global" | "batch";
  batchIds?: string[];
  title: string;
  message: string;
  scheduledAt?: string;
}

export interface UpdateAnnouncementRequest {
  type?: "global" | "batch";
  batchIds?: string[];
  title?: string;
  message?: string;
  scheduledAt?: string;
  status?: "draft" | "scheduled"; // Can only update if not sent
}

export interface AnnouncementResponse {
  id: string;
  type: string;
  batchIds: string[] | null;
  title: string;
  message: string;
  scheduledAt: string | null;
  sentAt: string | null;
  deliveryCount: number;
  createdBy: string;
  status: string;
  createdAt: string;
}
