import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@drsiri/ui", "@drsiri/types", "@drsiri/config", "@drsiri/utils"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

