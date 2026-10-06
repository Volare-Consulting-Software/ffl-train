import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

// Migrate needs the direct (non-pooled) Neon connection. Read process.env rather than
// prisma/config's env() so `prisma generate` still works without it at build time.
export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? "",
  },
});
