import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibecheck.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/card/', '/view/', '/api/', '/customize'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
