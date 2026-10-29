import type { MetadataRoute } from "next";
import { data } from "@/lib/data";

/**
 * /sitemap.xml — a one-page site, so a single URL. Its images are listed too so
 * they can show up in image search. Uses meta.siteUrl from portfolio.json.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = data.meta.siteUrl.replace(/\/$/, "");
  const images = [
    data.profile.avatar,
    ...data.projects.items.map((p) => p.image),
    ...data.certificates.items.map((c) => c.image),
  ]
    .filter(Boolean)
    .map((src) => `${site}${src}`);

  return [{ url: `${site}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1, images }];
}
