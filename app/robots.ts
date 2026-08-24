import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fateinsight.site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/dashboard', '/account', '/profile', '/history', '/feedback', '/chat', '/panel', '/report', '/membership'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
