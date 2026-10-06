import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  // Lambda's filesystem is read-only outside /tmp, so skip the on-disk image optimization cache.
  images: { unoptimized: true },
};

export default nextConfig;
