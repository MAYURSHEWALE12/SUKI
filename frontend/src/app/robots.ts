import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sukiethnic.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/checkout', '/wishlist', '/success', '/search'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}