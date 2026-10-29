import type { MetadataRoute } from "next";
import { data } from "@/lib/data";

/** /robots.txt — everything may be crawled; points crawlers to the sitemap. */
export default function robots(): MetadataRoute.Robots {
  const site = data.meta.siteUrl.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
