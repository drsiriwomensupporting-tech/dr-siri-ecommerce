import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@drsiri/ui", "@drsiri/types", "@drsiri/config", "@drsiri/utils"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ogspfwdfwnwiwhrwlfva.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
