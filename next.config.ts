import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Allow cover images hosted on your production API server
        protocol: "https",
        hostname: "*.onrender.com",
      },
    ],
  },

  /**
   * Development proxy: /api/* → http://localhost:5000/api/*
   *
   * Why: Browser makes same-origin requests to Next.js (:3000).
   * Next.js forwards them server-side to Express (:5000), eliminating
   * all CORS preflight issues.
   *
   * Production: Rewrites are disabled. NEXT_PUBLIC_API_URL must be set
   * to the full Render backend URL (e.g. https://eventbookings-api.onrender.com/api).
   * The browser then calls the API directly — CORS is handled by Express.
   */
  async rewrites() {
    if (process.env.NODE_ENV === "production") {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
