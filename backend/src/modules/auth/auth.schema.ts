import { t } from "elysia";

export const FirebaseLoginSchema = {
  body: t.Object({
    token: t.String({ description: "Firebase ID token" }),
    fcmToken: t.Optional(t.String({ description: "FCM token for push notifications" })),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Object({
        user: t.Object({
          id: t.String(),
          name: t.String(),
          email: t.String(),
          role: t.String(),
          tenantId: t.String(),
          avatarUrl: t.Optional(t.Union([t.String(), t.Null()])),
        }),
        tokens: t.Object({
          accessToken: t.String(),
          refreshToken: t.String(),
        }),
      }),
    }),
  },
  detail: {
    tags: ["Auth"],
    summary: "Login with Firebase token",
  },
};

export const RegisterSchema = {
  body: t.Object({
    name: t.String({ minLength: 2 }),
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 6 }),
    tuitionCenterName: t.String({ minLength: 2 }),
  }),
  response: FirebaseLoginSchema.response,
  detail: {
    tags: ["Auth"],
    summary: "Register a new admin and tuition center",
  },
};

export const FirebaseRegisterSchema = {
  body: t.Object({
    token: t.String({ description: "Firebase ID token" }),
    tuitionCenterName: t.String({ minLength: 2 }),
    fcmToken: t.Optional(t.String()),
  }),
  response: FirebaseLoginSchema.response,
  detail: {
    tags: ["Auth"],
    summary: "Register a new admin and tuition center via Firebase",
  },
};

export const ManualLoginSchema = {
  body: t.Object({
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 6 }),
  }),
  response: FirebaseLoginSchema.response,
  detail: {
    tags: ["Auth"],
    summary: "Login with Email and Password",
  },
};

export const ChangePasswordSchema = {
  body: t.Object({
    oldPassword: t.String(),
    newPassword: t.String({ minLength: 6 }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    })
  },
  detail: {
    tags: ["Auth"],
    summary: "Change user password",
    security: [{ bearerAuth: [] }]
  },
};

export const ForgotPasswordSchema = {
  body: t.Object({
    email: t.String({ format: "email" }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    })
  },
  detail: {
    tags: ["Auth"],
    summary: "Request a password reset email",
  },
};

export const RefreshTokenSchema = {
  body: t.Object({
    refreshToken: t.String(),
  }),
  response: FirebaseLoginSchema.response,
  detail: {
    tags: ["Auth"],
    summary: "Refresh access token",
  }
};

export const LogoutSchema = {
  body: t.Object({
    refreshToken: t.String(),
    allDevices: t.Optional(t.Boolean()),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    })
  },
  detail: {
    tags: ["Auth"],
    summary: "Logout user",
    security: [{ bearerAuth: [] }]
  }
};

export const ResetPasswordSchema = {
  body: t.Object({
    token: t.String(),
    newPassword: t.String({ minLength: 6 }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    })
  },
  detail: {
    tags: ["Auth"],
    summary: "Confirm password reset using token",
  }
};

export const VerifyEmailSchema = {
  body: t.Object({
    token: t.String(),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    })
  },
  detail: {
    tags: ["Auth"],
    summary: "Verify user email using token",
  }
};

export const ResendVerificationSchema = {
  body: t.Object({
    email: t.String({ format: "email" }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    })
  },
  detail: {
    tags: ["Auth"],
    summary: "Resend email verification token",
  }
};

export const CheckEmailSchema = {
  body: t.Object({
    email: t.String({ format: "email" }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Object({
        isAvailable: t.Boolean(),
      })
    })
  },
  detail: {
    tags: ["Auth"],
    summary: "Check if an email is already registered",
  }
};

export const AcceptInvitationSchema = {
  body: t.Object({
    token: t.String(),
    name: t.String({ minLength: 2 }),
    password: t.String({ minLength: 6 }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    })
  },
  detail: {
    tags: ["Auth"],
    summary: "Accept an invitation to join a tuition center",
  }
};
