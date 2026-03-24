import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// In production, this URL will point to your AWS RDS Proxy
const connectionString = process.env.DATABASE_URL || "";

const adapter = new PrismaPg({ connectionString });

export const db = new PrismaClient({ adapter });

