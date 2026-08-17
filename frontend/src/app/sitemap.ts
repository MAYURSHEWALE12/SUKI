import { MetadataRoute } from 'next';

interface SitemapProduct {
  _id: string;
  updatedAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sukiethnic.com';

  // Fetch all products to include in sitemap
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${apiUrl}/api/products`);
    if (res.ok) {
      const data = await res.json();
      // Assuming the API returns an array or an object with a 'products' array
      const products = Array.isArray(data) ? data : data.products || [];
      
      productUrls = products.map((product: SitemapProduct) => ({
        url: `${baseUrl}/product/${product._id}`,
        lastModified: new Date(product.updatedAt || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch products for sitemap', error);
  }

  // Static and category routes
  const staticRoutes = [
    '',
    '/collections/lehengas',
    '/collections/sarees',
    '/collections/normal-sarees',
    '/collections/party-sarees',
    '/collections/silk-sarees',
    '/collections/half-sarees',
    '/collections/navratri-ghagra',
    '/collections/new-arrivals',
    '/collections/best-sellers',
    '/search',
    '/account'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : 0.9,
  }));

  return [...staticRoutes, ...productUrls];
}
