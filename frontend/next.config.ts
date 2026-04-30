import type { NextConfig } from "next";
import nextPWA from 'next-pwa';

const withPWA = nextPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA,
  skipTrailingSlashRedirect: true,
  turbopack: {},
};

export default withPWA(nextConfig);
