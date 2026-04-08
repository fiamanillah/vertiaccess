// packages/database/index.ts
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// Auto-register Prisma error mapper with the core ErrorMapperRegistry
import "./src/prisma-error-mapper.ts";

// @ts-ignore - Resource is injected by SST
import { Resource } from "sst";

// Prioritize Resource.DatabaseUrl.value (SST Secret) in production/cloud,
// fallback to env var, then finally default to local Docker postgres.
const connectionString = 
  // @ts-ignore
  Resource.DatabaseUrl?.value || 
  process.env.DATABASE_URL || 
  "postgresql://postgres:postgres@localhost:5432/vertiaccess";

const adapter = new PrismaPg({ connectionString });

export const db = new PrismaClient({ adapter });

// Re-export Prisma types for convenience
export { PrismaClient } from "./generated/prisma/client.js";
