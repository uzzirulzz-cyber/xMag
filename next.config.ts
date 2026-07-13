import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "magxtv.click", "www.magxtv.click", "*.magxtv.click"],
};

export default nextConfig;
