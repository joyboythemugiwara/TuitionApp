import { t } from "elysia";

export const UpdateProfileSchema = {
  body: t.Object({
    name: t.Optional(t.String({ minLength: 2 })),
    avatarUrl: t.Optional(t.String()),
    fcmToken: t.Optional(t.Union([t.String(), t.Null()])),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Any(),
    }),
  },
  detail: {
    tags: ["Users"],
    summary: "Update current user profile",
    security: [{ bearerAuth: [] }]
  }
};

export const InviteUserSchema = {
  body: t.Object({
    email: t.String({ format: "email" }),
    name: t.String({ minLength: 2 }),
    role: t.Union([
      t.Literal("teacher"), 
      t.Literal("parent"), 
      t.Literal("admin"),
      t.Literal("student")
    ]),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
  },
  detail: {
    tags: ["Users"],
    summary: "Invite a new user to the tuition center (Admin only)",
    security: [{ bearerAuth: [] }]
  }
};

export const GetProfileSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Any(),
    }),
  },
  detail: {
    tags: ["Users"],
    summary: "Get current user profile",
    security: [{ bearerAuth: [] }]
  }
};

export const ListUsersSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Array(t.Any()),
    }),
  },
  detail: {
    tags: ["Users"],
    summary: "List all users in the tuition center (Admin only)",
    security: [{ bearerAuth: [] }]
  }
};
