import type { MetadataRoute } from 'next';
import { articles } from './knowledge/data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fateinsight.site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/knowledge', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/try', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/demo', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.6, changeFrequency: 'yearly' as const },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/register', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/login', priority: 0.5, changeFrequency: 'monthly' as const },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/knowledge/${article.slug}`,
    lastModified: new Date(article.publishDate),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes];
}
