import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled cacheComponents to allow dynamic route pages to work properly
  // cacheComponents: true,
  output: "standalone",
};

export default nextConfig;
