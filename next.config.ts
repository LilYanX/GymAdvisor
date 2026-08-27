import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  // Évite que Next prenne un package-lock hors du repo (ex. C:\Users\Lilia).
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;
