import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: the dataset lives one level up; pin the workspace root to web/.
  turbopack: {
    root: path.join(import.meta.dirname),
  },
};

export default nextConfig;
