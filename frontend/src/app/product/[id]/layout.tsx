import { Metadata } from 'next';
import Script from 'next/script';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${apiUrl}/api/products/${id}`, { next: { revalidate: 60 } });
    
    if (!res.ok) return { title: 'Product | Suki Ethnic' };
    
    const product = await res.json();
    return {
      title: `${product.name} | Suki Ethnic`,
      description: product.description ? product.description.substring(0, 160) : 'Premium ethnic wear from Suki Ethnic.',
      openGraph: {
        images: [product.image],
        title: `${product.name} | Suki Ethnic`,
        description: product.description ? product.description.substring(0, 160) : '',
      }
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

  return (
    <>
      {product && (
        <Script id="product-schema" type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: product.image,
            description: product.description,
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: product.price,
              availability: product.countInStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sukiethnic.com'}/product/${id}`
            }
          })
        }} />
      )}
      {children}
    </>
  );
}
