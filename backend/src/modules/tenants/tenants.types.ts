export interface UpdateTenantRequest {
  name?: string;
  wabaId?: string;
  phoneNumberId?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  feeDueDay?: number;
}

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  wabaId: string | null;
  phoneNumberId: string | null;
  whatsappVerified: boolean | null;
  razorpayKeyId: string | null;
  // We explicitly DO NOT return razorpayKeySecret in the response for security
  feeDueDay: number;
  status: string;
  createdAt: string;
}
