import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow the sharper q=90 used for the large hero photos.
  images: { qualities: [75, 90] },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
