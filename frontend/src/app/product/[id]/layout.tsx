import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sukiethnic.com';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${apiUrl}/api/products/${id}`, { next: { revalidate: 60 } });

    if (!res.ok) return { title: 'Product | Suki Ethnic' };

    const product = await res.json();
    const title = `${product.name} | Suki Ethnic`;
    const description = product.shortDescription
      || (product.description ? product.description.substring(0, 160) : 'Premium ethnic wear from Suki Ethnic.');
    const productUrl = `${siteUrl}/product/${id}`;
    const toAbsolute = (src: string) => src?.startsWith('http') ? src : `${siteUrl}${src}`;
    const imageUrl = toAbsolute(product.image);

    return {
      title,
      description,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        type: 'website',
        url: productUrl,
        siteName: 'Suki Ethnic',
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 1000,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: 'Product | Suki Ethnic',
    };
  }
}


export default async function ProductLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${apiUrl}/api/products/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      product = await res.json();
    }
  } catch {
    console.error('Failed to fetch product for schema');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sukiethnic.com';
  const productUrl = `${siteUrl}/product/${id}`;

  let jsonLd = null;
  if (product) {
    const toAbsolute = (src: string) => src.startsWith('http') ? src : `${siteUrl}${src}`;
    const images = [toAbsolute(product.image)];
    if (product.hoverImage) images.push(toAbsolute(product.hoverImage));

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${productUrl}#product`,
      name: product.name,
      image: images,
      description: product.description || product.shortDescription || product.name,
      sku: product._id || id,
      category: product.category,
      brand: {
        "@type": "Brand",
        name: "Suki Ethnic"
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: product.price,
        availability: product.countInStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: productUrl,
        seller: {
          "@type": "Organization",
          name: "Suki Ethnic",
          url: siteUrl
        }
      },
      ...(product.rating && product.reviews && product.reviews.length > 0 ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(product.rating).toFixed(1),
          reviewCount: product.reviews.length,
          bestRating: 5,
          worstRating: 1
        },
        review: product.reviews.slice(0, 5).map((rev: { name: string; rating: number; comment: string; createdAt?: string }) => ({
          "@type": "Review",
          author: { "@type": "Person", name: rev.name },
          ...(rev.createdAt && !Number.isNaN(Date.parse(rev.createdAt)) ? { datePublished: new Date(rev.createdAt).toISOString() } : {}),
          reviewRating: { "@type": "Rating", ratingValue: rev.rating, bestRating: 5 },
          ...(rev.comment ? { reviewBody: rev.comment } : {})
        }))
      } : {})
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}
      {children}
    </>
  );
}