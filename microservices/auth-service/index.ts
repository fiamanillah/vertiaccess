// services/auth-service/index.ts
import { handle } from "hono/aws-lambda";
import { createServiceApp } from "@vertiaccess/core";
import { authRoutes } from "./src/routes.ts";

// Create a Hono app with all global middleware pre-configured
const app = createServiceApp({
  serviceName: "auth-service",
  basePath: "/auth/v1",
});

// Mount auth routes under /auth/v1
app.route("/auth/v1", authRoutes);

// Export the Lambda handler
export const handler = handle(app);