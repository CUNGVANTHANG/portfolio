import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let phones/tablets on the same Wi-Fi open the dev server by IP
  // (e.g. http://10.1.164.201:3000). Private LAN ranges only.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*", "*.local"],

  // Files in /public are served with max-age=0, so every visit re-checks the
  // 1.3 MB robot scene, its WebAssembly and the images. Let browsers reuse them
  // for a day, then refresh in the background (a replaced image shows up within a day).
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return ["/models/:path*", "/spline/:path*", "/images/:path*"].map((source) => ({ source, headers: cache }));
  },
};

export default nextConfig;
