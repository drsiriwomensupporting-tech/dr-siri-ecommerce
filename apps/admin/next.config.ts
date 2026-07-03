import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@drsiri/ui", "@drsiri/types", "@drsiri/config", "@drsiri/utils"],
  /* other config options here */
};

export default nextConfig;

