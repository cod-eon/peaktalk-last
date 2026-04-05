import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://peaktalk.ru",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://peaktalk.ru/contacts",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://peaktalk.ru/privacy",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://peaktalk.ru/personal-data",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
