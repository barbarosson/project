import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Isolated package inside monorepo — avoid picking parent lockfile as root
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
