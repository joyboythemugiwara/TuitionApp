import { Service, Inject } from "@/common/decorators";
import { TenantsRepository } from "./tenants.repository";
import { UpdateTenantRequest, TenantResponse } from "./tenants.types";
import { NotFoundError } from "@/common/errors/http.error";

@Service()
export class TenantsService {
  constructor(@Inject(TenantsRepository) private readonly repository: TenantsRepository) {}

  private mapToResponse(tenant: any): TenantResponse {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      wabaId: tenant.wabaId,
      phoneNumberId: tenant.phoneNumberId,
      whatsappVerified: tenant.whatsappVerified,
      razorpayKeyId: tenant.razorpayKeyId,
      // Omit RazorpayKeySecret for security
      feeDueDay: tenant.feeDueDay,
      status: tenant.status,
      createdAt: tenant.createdAt.toISOString(),
    };
  }

  async getTenant(tenantId: string): Promise<TenantResponse> {
    const tenant = await this.repository.findById(tenantId);
    if (!tenant) throw new NotFoundError("Tenant not found");
    return this.mapToResponse(tenant);
  }

  async updateTenant(tenantId: string, data: UpdateTenantRequest): Promise<TenantResponse> {
    // Basic verification logic could be added here later (e.g. testing Razorpay keys before saving)
    const updated = await this.repository.update(tenantId, data);
    if (!updated) throw new NotFoundError("Tenant not found");
    return this.mapToResponse(updated);
  }
}
