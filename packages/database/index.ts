// packages/database/index.ts
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// Auto-register Prisma error mapper with the core ErrorMapperRegistry
import "./src/prisma-error-mapper.ts";

// In production, this URL will point to your AWS RDS Proxy or actual Postgres DB
// Fallback is provided so local HMR (sst dev) catches it without restarting
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/vertiaccess";

const adapter = new PrismaPg({ connectionString });

export const db = new PrismaClient({ adapter });

// Re-export Prisma types for convenience
export { PrismaClient } from "./generated/prisma/client.js";
