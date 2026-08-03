import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.5'],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "resources.tidal.com" },
      { protocol: "https", hostname: "images.tidal.com" },
    ],
  },
};

export default nextConfig;
