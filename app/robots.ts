// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'https://dominion.design';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/hippo/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
