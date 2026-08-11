import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: the dataset lives one level up; pin the workspace root to web/.
  turbopack: {
    root: path.join(import.meta.dirname),
  },
  images: {
    // Default is webp only. AVIF takes roughly another quarter off these
    // photographs, which matters because the corpus is 25 MB of JPEG and the
    // hero of every spot page is one of them.
    formats: ["image/avif", "image/webp"],
    // The photos are immutable once staged; the default 4 h cache is wasteful.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
