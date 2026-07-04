import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    // Tree-shake icon and date-fns imports for smaller client bundles.
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;
