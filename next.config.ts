import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/blog/blogpost-sampurna-grantha",
        destination: "/blog/aporimeyo-sampurna",
        permanent: true,
      },
      {
        source: "/blog/xuchipatr",
        destination: "/blog/aporimeyo-suchipatra",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
