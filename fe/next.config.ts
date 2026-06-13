import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal self-contained server (.next/standalone) for the Docker
  // production image — see fe/Dockerfile. No effect on `npm run dev`.
  output: "standalone",
};

export default nextConfig;
