import pino from "pino";

// In Lambda, we just want raw JSON. Locally, we want pretty text.
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(process.env.IS_LOCAL && {
    transport: { target: "pino-pretty" },
  }),
});
