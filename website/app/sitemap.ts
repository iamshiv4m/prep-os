import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/**
 * Sitemap for the marketing site. Currently a single landing
 * page (in-page anchors for #features / #download / #install — those don't
 * belong in a sitemap). Add new entries here as we ship dedicated routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
