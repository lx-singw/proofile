import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy API calls in dev and e2e to the backend service inside Docker
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
