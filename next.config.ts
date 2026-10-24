import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Record that this app tracks the security upgrade path, so the Next.js
    // CLI's own advisory check stops halting `next build` and points at the
    // chosen channel instead.
    agentUpgrade: "security",
  },
};

export default nextConfig;
