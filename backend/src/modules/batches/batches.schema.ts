import { t } from "elysia";

export const CreateBatchSchema = {
  body: t.Object({
    name: t.String({ minLength: 2 }),
    schedule: t.Optional(t.String()),
    defaultFee: t.Numeric({ minimum: 0 }),
    teacherIds: t.Optional(t.Array(t.String({ format: "uuid" }))),
  }),
  response: {
    201: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Batches"],
    summary: "Create a new batch",
    security: [{ bearerAuth: [] }]
  }
};

export const UpdateBatchSchema = {
  body: t.Object({
    name: t.Optional(t.String({ minLength: 2 })),
    schedule: t.Optional(t.String()),
    defaultFee: t.Optional(t.Numeric({ minimum: 0 })),
    archived: t.Optional(t.Boolean()),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Batches"],
    summary: "Update batch details",
    security: [{ bearerAuth: [] }]
  }
};

export const GetBatchSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Batches"],
    summary: "Get batch by ID with teachers",
    security: [{ bearerAuth: [] }]
  }
};

export const ListBatchesSchema = {
  query: t.Object({
    archived: t.Optional(t.Boolean()),
    search: t.Optional(t.String()),
    sort: t.Optional(t.Union([t.Literal("name"), t.Literal("createdAt"), t.Literal("defaultFee"), t.Literal("studentCount")])),
    order: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
    page: t.Optional(t.Numeric()),
    limit: t.Optional(t.Numeric()),
    minFee: t.Optional(t.Numeric()),
    maxFee: t.Optional(t.Numeric()),
    minStudents: t.Optional(t.Numeric()),
    maxStudents: t.Optional(t.Numeric()),
    schedule: t.Optional(t.String()),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.Optional(t.String()),
      data: t.Array(t.Any()),
      meta: t.Optional(t.Object({
        total: t.Numeric(),
        page: t.Numeric(),
        limit: t.Numeric(),
        totalPages: t.Numeric(),
      }))
    })
  },
  detail: {
    tags: ["Batches"],
    summary: "List all batches",
    security: [{ bearerAuth: [] }]
  }
};

export const AssignTeachersSchema = {
  body: t.Object({
    teacherIds: t.Array(t.String({ format: "uuid" })),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    })
  },
  detail: {
    tags: ["Batches"],
    summary: "Assign teachers to a batch (Replaces existing assignments)",
    security: [{ bearerAuth: [] }]
  }
};

export const BulkUpdateBatchSchema = {
  body: t.Object({
    batchIds: t.Array(t.String({ format: "uuid" })),
    updates: t.Object({
      archived: t.Optional(t.Boolean()),
    })
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Batches"],
    summary: "Bulk update batches",
    security: [{ bearerAuth: [] }]
  }
};

export const DeleteBatchSchema = {
  params: t.Object({
    id: t.String({ format: "uuid" })
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Batches"],
    summary: "Hard delete a batch",
    security: [{ bearerAuth: [] }]
  }
};

export const BulkDeleteBatchSchema = {
  body: t.Object({
    batchIds: t.Array(t.String({ format: "uuid" }), { minItems: 1 })
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Batches"],
    summary: "Bulk hard delete batches",
    security: [{ bearerAuth: [] }]
  }
};
