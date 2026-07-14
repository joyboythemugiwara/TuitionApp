import { Controller, Inject } from "@/common/decorators";
import { DashboardService } from "./dashboard.service";
import { successResponse } from "@/common/responses";

@Controller()
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly service: DashboardService) {}

  async getDashboardStats(tenantId: string) {
    const data = await this.service.getDashboardStats(tenantId);
    return successResponse("Dashboard stats retrieved", data);
  }

  async exportDashboard(tenantId: string, email: string) {
    await this.service.exportDashboard(tenantId, email);
    return successResponse("Export started. You will receive an email shortly.", null, 202);
  }
}
