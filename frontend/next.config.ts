import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year for versioned images
  },

  // Bundle optimization
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,

  // Performance headers
  async headers() {
    try {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
          has: [
            {
              type: "query",
              key: "v",
            },
          ],
        },
      ];
    } catch {
      return [];
    }
  },


  // Enable API proxy rewrites for development
  async rewrites() {
    return [
      {
        // This rule intercepts any request starting with /api/ on the frontend
        // and proxies it to the backend while preserving the /api prefix so
        // backend routes like /api/v1/* continue to work unchanged.
        // e.g., /api/v1/users -> http://backend:8000/api/v1/users
        source: "/api/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://backend:8000"}/api/:path*`,
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // Webpack configuration for bundle optimization
  webpack: (config, { isServer }) => {
    const isProduction = process.env.NODE_ENV === "production";
    const isClientBundle = !isServer;
    
    if (isClientBundle && isProduction) {
      config.mode = "production";
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: "react-vendors",
              priority: 20,
              reuseExistingChunk: true,
              enforce: true,
            },
            query: {
              test: /[\\/]node_modules[\\/](@tanstack[\\/]react-query)[\\/]/,
              name: "query-vendors",
              priority: 15,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
