/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "serverless-backend-starter",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const api = new sst.aws.ApiGatewayV2("MyApi");

    api.route("POST /auth/login", {
      handler: "services/auth-service/src/login.handler",
      environment: {
        DATABASE_URL: process.env.DATABASE_URL || "",
        IS_LOCAL: "true",
      },
    });
  },
});
