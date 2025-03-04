import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the DATABASE_URL from environment variables or use a default value
const databaseUrl = process.env.DATABASE_URL || "postgresql://textsummarizer:password123@localhost:5432/summarizer_db";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
