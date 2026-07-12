import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles output automatically; standalone is for Docker/self-host.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow the preview sandbox origin to fetch Next.js assets during dev.
  allowedDevOrigins: ["*.space-z.ai"],
};

export default nextConfig;
