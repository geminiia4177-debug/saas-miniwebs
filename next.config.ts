import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  // @ts-ignore eslint is a valid Next.js config property
  eslint: {
    ignoreDuringBuilds: true,
  },
  // @ts-ignore typescript is a valid Next.js config property
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
