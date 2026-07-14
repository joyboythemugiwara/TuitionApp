import { Service, Inject } from "@/common/decorators";
import { DashboardRepository } from "./dashboard.repository";
import { notificationQueue } from "@/common/queue/notification.queue";

@Service()
export class DashboardService {
  constructor(@Inject(DashboardRepository) private readonly repository: DashboardRepository) {}

  async getDashboardStats(tenantId: string) {
    return await this.repository.getDashboardStats(tenantId);
  }

  async exportDashboard(tenantId: string, email: string) {
    // Drop it in the background queue
    await notificationQueue.add("export_report", {
      tenantId,
      email
    });
  }
}
