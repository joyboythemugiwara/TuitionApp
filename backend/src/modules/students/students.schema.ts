import { t } from "elysia";

const PhoneSchema = t.Object({
  number: t.String({ minLength: 10, maxLength: 10, pattern: "^[1-9]\\d{9}$" }),
  label: t.Union([
    t.Literal("student"),
    t.Literal("father"),
    t.Literal("mother"),
    t.Literal("guardian"),
  ]),
  receiveNotifications: t.Boolean(),
  isPrimary: t.Boolean(),
});

export const CreateStudentSchema = {
  body: t.Object({
    batchId: t.String({ format: "uuid" }),
    name: t.String({ minLength: 2 }),
    photoUrl: t.Optional(t.String()),
    schoolName: t.Optional(t.String()),
    board: t.Optional(t.String()),
    monthlyFee: t.Optional(t.Numeric()),
    feeStartDate: t.String({ format: "date" }),
    phones: t.Array(PhoneSchema, { minItems: 1 }),
  }),
  response: {
    201: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Students"],
    summary: "Register a new student with phone numbers",
    security: [{ bearerAuth: [] }]
  }
};

export const UpdateStudentSchema = {
  body: t.Object({
    batchId: t.Optional(t.String({ format: "uuid" })),
    name: t.Optional(t.String({ minLength: 2 })),
    photoUrl: t.Optional(t.String()),
    schoolName: t.Optional(t.String()),
    board: t.Optional(t.String()),
    monthlyFee: t.Optional(t.Numeric()),
    status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
    phones: t.Optional(t.Array(PhoneSchema, { minItems: 1 })),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Students"],
    summary: "Update student details",
    security: [{ bearerAuth: [] }]
  }
};

export const GetStudentSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Students"],
    summary: "Get student by ID",
    security: [{ bearerAuth: [] }]
  }
};
export const BulkCreateStudentSchema = {
  body: t.Object({
    students: t.Array(CreateStudentSchema.body)
  }),
  response: {
    201: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Array(t.Any()),
    })
  },
  detail: {
    tags: ["Students"],
    summary: "Bulk create students",
    security: [{ bearerAuth: [] }]
  }
};

export const BulkUpdateStudentSchema = {
  body: t.Object({
    studentIds: t.Array(t.String({ format: "uuid" })),
    updates: t.Object({
      batchId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
      status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
    }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    })
  },
  detail: {
    tags: ["Students"],
    summary: "Bulk update students (e.g., assign multiple to a batch)",
    security: [{ bearerAuth: [] }]
  }
};
export const ListStudentsSchema = {
  query: t.Object({
    batchId: t.Optional(t.String({ format: "uuid" })),
    status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
    search: t.Optional(t.String()),
    sort: t.Optional(t.Union([t.Literal("name"), t.Literal("createdAt"), t.Literal("monthlyFee")])),
    order: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
    page: t.Optional(t.Numeric({ default: 1 })),
    limit: t.Optional(t.Numeric({ default: 10 })),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Array(t.Any()),
      meta: t.Object({
        total: t.Number(),
        page: t.Number(),
        limit: t.Number(),
        totalPages: t.Number(),
      })
    })
  },
  detail: {
    tags: ["Students"],
    summary: "List all students in the tenant",
    security: [{ bearerAuth: [] }]
  }
};

export const DeleteStudentSchema = {
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
    tags: ["Students"],
    summary: "Hard delete a student",
    security: [{ bearerAuth: [] }]
  }
};

export const BulkDeleteStudentSchema = {
  body: t.Object({
    studentIds: t.Array(t.String({ format: "uuid" }), { minItems: 1 })
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Students"],
    summary: "Bulk hard delete students",
    security: [{ bearerAuth: [] }]
  }
};
