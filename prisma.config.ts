import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

// Migrate prefers the direct (non-pooled) Neon connection; CI passes it as DATABASE_URL. Read process.env
// rather than prisma/config's env() so `prisma generate` still works without either at build time.
export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
