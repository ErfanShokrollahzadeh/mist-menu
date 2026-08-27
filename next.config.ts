import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    /* WebP only. AVIF encodes several times slower, and a QR menu hits a cold
       optimizer cache constantly — each new group tab asks for a fresh burst of
       variants. The extra compression is not worth that latency here. */
    formats: ["image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
