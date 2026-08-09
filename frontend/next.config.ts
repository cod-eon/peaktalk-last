import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
