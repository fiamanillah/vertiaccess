// services/auth-service/src/routes.ts
import { Hono } from "hono";
import { validateRequest, cognitoAuth } from "@serverless-backend-starter/core";
import {
  createUserSchema,
  createAdminSchema,
  loginSchema,
  confirmSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendCodeSchema,
} from "./schemas/auth.dto.ts";
import { updateVerificationSchema, submitIdentitySchema } from "./schemas/verification.dto.ts";
import { registerHandler } from "./controllers/register.ts";
import { adminRegisterHandler } from "./controllers/admin-register.ts";
import { loginHandler } from "./controllers/login.ts";
import { confirmHandler } from "./controllers/confirm.ts";
import { refreshHandler } from "./controllers/refresh.ts";
import { forgotPasswordHandler } from "./controllers/forgot-password.ts";
import { resetPasswordHandler } from "./controllers/reset-password.ts";
import { resendCodeHandler } from "./controllers/resend-code.ts";
import { meHandler } from "./controllers/me.ts";
import { submitIdentityHandler } from "./controllers/identity.ts";
import { listUsersHandler, listVerificationsHandler, updateVerificationHandler } from "./controllers/admin.ts";

/**
 * Auth service routes — mounted at /auth/v1
 */
const authRoutes = new Hono();

// Public routes (no auth required)
authRoutes.post("/register", validateRequest(createUserSchema), registerHandler);
authRoutes.post("/login", validateRequest(loginSchema), loginHandler);
authRoutes.post("/confirm", validateRequest(confirmSchema), confirmHandler);
authRoutes.post("/refresh", validateRequest(refreshSchema), refreshHandler);
authRoutes.post("/forgot-password", validateRequest(forgotPasswordSchema), forgotPasswordHandler);
authRoutes.post("/reset-password", validateRequest(resetPasswordSchema), resetPasswordHandler);
authRoutes.post("/resend-code", validateRequest(resendCodeSchema), resendCodeHandler);

// Protected routes (require valid Cognito token)
authRoutes.get("/me", cognitoAuth(), meHandler);
authRoutes.post("/users/me/identity", cognitoAuth(), validateRequest(submitIdentitySchema), submitIdentityHandler);

authRoutes.post("/admin/register", cognitoAuth(), validateRequest(createAdminSchema), adminRegisterHandler);
authRoutes.get("/admin/users", cognitoAuth(), listUsersHandler);
authRoutes.get("/admin/verifications", cognitoAuth(), listVerificationsHandler);
authRoutes.put("/admin/verifications/:id", cognitoAuth(), validateRequest(updateVerificationSchema), updateVerificationHandler);

export { authRoutes };
