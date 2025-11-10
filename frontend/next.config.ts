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
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
        // Only for static assets
        has: [
          {
            type: "query",
            key: "v",
          },
        ],
      },
    ];
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // Webpack configuration for bundle analysis
  webpack: (config, { isServer }) => {
    // Only in production and for client bundle
    if (!isServer && process.env.NODE_ENV === "production") {
      config.mode = "production";
      
      // Optimize chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            // Vendor libraries
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // React and core dependencies
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: "react-vendors",
              priority: 20,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Query and state management
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
