// services/billing-service/index.ts
import { handle } from "hono/aws-lambda";
import { createServiceApp } from "@serverless-backend-starter/core";
import { billingRoutes } from "./src/routes.ts";

const app = createServiceApp({
  serviceName: "billing-service",
  basePath: "/billing/v1",
});

app.route("/billing/v1", billingRoutes);

export const handler = handle(app);
