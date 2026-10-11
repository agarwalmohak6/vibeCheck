import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/card/',
          '/customize',
          '/receipt/',
          '/view/',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
