import { logger } from "@serverless-backend-starter/core";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  logger.info({ path: event.path }, "Login request received");

  try {
    const body = JSON.parse(event.body || "{}");

    // Example DB call using your shared Prisma package
    // const user = await db.user.findUnique({ where: { email: body.email } });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Login successful" }),
    };
  } catch (error) {
    logger.error(error, "Failed to process login");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
