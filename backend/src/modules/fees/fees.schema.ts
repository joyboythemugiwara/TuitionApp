import { t } from "elysia";

export const GenerateFeesSchema = {
  body: t.Object({
    month: t.String({ format: "date", description: "Format: YYYY-MM-DD (should be the 1st of the month)" }),
    batchId: t.Optional(t.String({ format: "uuid" })),
    studentId: t.Optional(t.String({ format: "uuid" })),
  }),
  response: {
    201: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        generatedCount: t.Number()
      }),
    })
  },
  detail: {
    tags: ["Fees"],
    summary: "Generate fee records for a specific month",
    security: [{ bearerAuth: [] }]
  }
};

export const ListFeesSchema = {
  query: t.Object({
    month: t.Optional(t.String({ format: "date" })),
    status: t.Optional(t.Union([
      t.Literal("pending"),
      t.Literal("partial"),
      t.Literal("paid"),
      t.Literal("waived"),
      t.Literal("overdue")
    ])),
    studentId: t.Optional(t.String({ format: "uuid" })),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Array(t.Any()),
    })
  },
  detail: {
    tags: ["Fees"],
    summary: "List fee records",
    security: [{ bearerAuth: [] }]
  }
};

export const MarkPaymentSchema = {
  body: t.Object({
    feeRecordId: t.String({ format: "uuid" }),
    amount: t.Numeric({ minimum: 1 }),
    mode: t.Union([t.Literal("online"), t.Literal("cash")]),
    razorpayPaymentId: t.Optional(t.String()),
    razorpayOrderId: t.Optional(t.String()),
    transactionId: t.Optional(t.String()),
  }),
  response: {
    201: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Fees"],
    summary: "Record a payment against a fee record",
    security: [{ bearerAuth: [] }]
  }
};

export const GeneratePaymentLinkSchema = {
  body: t.Optional(t.Object({
    isReminder: t.Optional(t.Boolean()),
  })),
  response: {
    201: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        paymentLinkUrl: t.String(),
        paymentLinkId: t.String(),
      }),
    })
  },
  detail: {
    tags: ["Fees"],
    summary: "Generate a Razorpay payment link for a fee record",
    security: [{ bearerAuth: [] }]
  }
};
