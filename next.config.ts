import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        port: "",
        pathname: "/b/id/**",
      },
      {
        protocol: "https",
        hostname: "assets.hardcover.app",
        port: "",
        pathname: "/**",
      },
    ],
    localPatterns: [
      {
        pathname: "/api/images/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts");

export default withNextIntl(nextConfig);
