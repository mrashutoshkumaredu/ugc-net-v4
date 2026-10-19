import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hindi question pictures rarely change: let browsers and the CDN keep them for a day,
  // so moving between questions does not wait for the network each time.
  async headers() {
    return [
      {
        source: "/hindi/:folder(q|ref)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
