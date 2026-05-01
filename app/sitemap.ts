import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://padel-leaf.vercel.app";
  const now  = new Date().toISOString();

  return [
    { url: base,              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/book`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/courts`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`,   lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/find-us`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
