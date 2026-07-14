import { Controller, Inject } from "@/common/decorators";
import { TenantsService } from "./tenants.service";
import { UpdateTenantRequest } from "./tenants.types";
import { successResponse } from "@/common/responses";

@Controller()
export class TenantsController {
  constructor(@Inject(TenantsService) private readonly service: TenantsService) {}

  async getTenant(tenantId: string) {
    const tenant = await this.service.getTenant(tenantId);
    return successResponse("Tenant configuration retrieved successfully", tenant);
  }

  async updateTenant(tenantId: string, body: UpdateTenantRequest) {
    const tenant = await this.service.updateTenant(tenantId, body);
    return successResponse("Tenant configuration updated successfully", tenant);
  }
}
