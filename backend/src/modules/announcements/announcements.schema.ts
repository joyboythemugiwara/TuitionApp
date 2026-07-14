import { t } from "elysia";

export const CreateAnnouncementSchema = {
  body: t.Object({
    type: t.Union([t.Literal("global"), t.Literal("batch")]),
    batchIds: t.Optional(t.Array(t.String({ format: "uuid" }))),
    title: t.String({ minLength: 2, maxLength: 100 }),
    message: t.String({ minLength: 5, maxLength: 2000 }),
    scheduledAt: t.Optional(t.String({ format: "date-time" })),
  }),
  response: {
    201: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Announcements"],
    summary: "Create a new announcement",
    security: [{ bearerAuth: [] }]
  }
};

export const UpdateAnnouncementSchema = {
  body: t.Object({
    type: t.Optional(t.Union([t.Literal("global"), t.Literal("batch")])),
    batchIds: t.Optional(t.Array(t.String({ format: "uuid" }))),
    title: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
    message: t.Optional(t.String({ minLength: 5, maxLength: 2000 })),
    scheduledAt: t.Optional(t.String({ format: "date-time" })),
    status: t.Optional(t.Union([t.Literal("draft"), t.Literal("scheduled")])),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Announcements"],
    summary: "Update an announcement (if not yet sent)",
    security: [{ bearerAuth: [] }]
  }
};

export const GetAnnouncementSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Any(),
    })
  },
  detail: {
    tags: ["Announcements"],
    summary: "Get an announcement by ID",
    security: [{ bearerAuth: [] }]
  }
};

export const ListAnnouncementsSchema = {
  query: t.Object({
    status: t.Optional(t.Union([
      t.Literal("draft"), 
      t.Literal("scheduled"), 
      t.Literal("sent"), 
      t.Literal("failed")
    ])),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Array(t.Any()),
    })
  },
  detail: {
    tags: ["Announcements"],
    summary: "List all announcements in the tenant",
    security: [{ bearerAuth: [] }]
  }
};
