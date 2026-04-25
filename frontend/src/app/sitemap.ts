import type { MetadataRoute } from "next";
import { FALLBACK_SCENARIO_SLUGS } from "@/lib/scenarios-catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const baseUrl = "https://peaktalk.ru";

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/scenarios`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...FALLBACK_SCENARIO_SLUGS.map((slug) => ({
      url: `${baseUrl}/scenarios/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/contacts`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/personal-data`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
