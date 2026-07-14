import { t } from "elysia";

export const UpdateTenantSchema = {
  body: t.Object({
    name: t.Optional(t.String({ minLength: 2 })),
    wabaId: t.Optional(t.String()),
    phoneNumberId: t.Optional(t.String()),
    razorpayKeyId: t.Optional(t.String()),
    razorpayKeySecret: t.Optional(t.String()),
    feeDueDay: t.Optional(t.Numeric({ minimum: 1, maximum: 28 })),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Tenants"],
    summary: "Update tenant settings (Admin only)",
    security: [{ bearerAuth: [] }]
  }
};

export const GetTenantSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Tenants"],
    summary: "Get current tenant configuration",
    security: [{ bearerAuth: [] }]
  }
};
