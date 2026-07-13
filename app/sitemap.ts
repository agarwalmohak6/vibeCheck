import type { MetadataRoute } from 'next';
import { absoluteUrl, PUBLIC_SEO_ROUTES } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_SEO_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
