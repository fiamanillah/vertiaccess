// packages/database/index.ts
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// Auto-register Prisma error mapper with the core ErrorMapperRegistry
import "./src/prisma-error-mapper.ts";

// @ts-ignore - Resource is injected by SST
import { Resource } from "sst";

// Prioritize DATABASE_URL from environment (set by SST Cloud with Proxy)
// Fallback to local Docker postgres for development.
const connectionString = 
  process.env.DATABASE_URL || 
  "postgresql://postgres:postgres@localhost:5432/vertiaccess";

const adapter = new PrismaPg({ connectionString });

export const db = new PrismaClient({ adapter });

// Re-export Prisma types for convenience
export { PrismaClient } from "./generated/prisma/client.js";
export * from "./src/subscription-guard.ts";
