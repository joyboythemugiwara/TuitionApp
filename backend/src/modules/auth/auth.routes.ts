import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { env } from "@/config/env";
import { container } from "tsyringe";

import { AuthController } from "./auth.controller";
import { 
  FirebaseLoginSchema, ManualLoginSchema, ChangePasswordSchema, ForgotPasswordSchema, 
  RefreshTokenSchema, LogoutSchema, RegisterSchema, ResetPasswordSchema,
  VerifyEmailSchema, ResendVerificationSchema, CheckEmailSchema, AcceptInvitationSchema,
  FirebaseRegisterSchema
} from "./auth.schema";
import { jwtAuth } from "@/common/middleware/auth.middleware";

// 1. Dependency Injection setup
const authController = container.resolve(AuthController);

// 2. Define Routes
export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
    })
  )
  .post(
    "/login/firebase",
    async ({ body, jwt, set }) => {
      const response = await authController.loginWithFirebase(body, jwt.sign);
      set.status = response.statusCode;
      return response.body;
    },
    FirebaseLoginSchema
  )
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const response = await authController.loginWithEmail(body, jwt.sign);
      set.status = response.statusCode;
      return response.body;
    },
    ManualLoginSchema
  )
  .post(
    "/password/forgot",
    async ({ body, set }) => {
      const response = await authController.forgotPassword(body);
      set.status = response.statusCode;
      return response.body;
    },
    ForgotPasswordSchema
  )
  .post(
    "/password/reset",
    async ({ body, set }) => {
      const response = await authController.confirmPasswordReset(body);
      set.status = response.statusCode;
      return response.body;
    },
    ResetPasswordSchema
  )
  .post(
    "/register",
    async ({ body, jwt, set }) => {
      const response = await authController.register(body, jwt.sign);
      set.status = response.statusCode;
      return response.body;
    },
    RegisterSchema
  )
  .post(
    "/register/firebase",
    async ({ body, jwt, set }) => {
      const response = await authController.registerWithFirebase(body, jwt.sign);
      set.status = response.statusCode;
      return response.body;
    },
    FirebaseRegisterSchema
  )
  .post(
    "/check-email",
    async ({ body, set }) => {
      const response = await authController.checkEmail(body);
      set.status = response.statusCode;
      return response.body;
    },
    CheckEmailSchema
  )
  .post(
    "/verify-email",
    async ({ body, set }) => {
      const response = await authController.verifyEmail(body);
      set.status = response.statusCode;
      return response.body;
    },
    VerifyEmailSchema
  )
  .post(
    "/resend-verification",
    async ({ body, set }) => {
      const response = await authController.resendVerification(body);
      set.status = response.statusCode;
      return response.body;
    },
    ResendVerificationSchema
  )
  .post(
    "/accept-invitation",
    async ({ body, set }) => {
      const response = await authController.acceptInvitation(body);
      set.status = response.statusCode;
      return response.body;
    },
    AcceptInvitationSchema
  )
  .post(
    "/refresh",
    async ({ body, jwt, set }) => {
      const response = await authController.refresh(body, jwt.sign);
      set.status = response.statusCode;
      return response.body;
    },
    RefreshTokenSchema
  )
  .use(jwtAuth) // Protect the routes below this point
  .post(
    "/logout",
    async ({ body, user, set }) => {
      const response = await authController.logout(user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    LogoutSchema
  )
  .post(
    "/password/change",
    async ({ body, user, set }) => {
      const response = await authController.changePassword(user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    ChangePasswordSchema
  );
