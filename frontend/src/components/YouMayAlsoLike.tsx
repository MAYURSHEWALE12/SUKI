"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

interface Product {
  _id: string;
  name: string;
  images: string[];
  price: number;
  numReviews?: number;
  rating?: number;
}

export default function YouMayAlsoLike() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=4', { cache: 'no-store' });
        const data = await res.json();
        // Just take 4 products
        setProducts(data.products ? data.products.slice(0, 4) : []);
      } catch (e) {
        console.error("Failed to fetch products", e);
      }
    };
    fetchProducts();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="recent-section" style={{ marginTop: '0', paddingTop: '20px' }}>
      <div className="recent-container">
        
        <div className="recent-header">
          <div className="recent-title-group">
            <h2 className="recent-title">You May Also Like</h2>
            <p className="recent-subtitle">Handpicked recommendations for you</p>
          </div>
          <Link href="/collections" className="recent-view-all">
            View All &rarr;
          </Link>
        </div>

        <div className="trending-grid">
          {products.map((product) => {
            // Map the `images` array (from the API) to `image` for the ProductCard interface
            const productForCard = {
              ...product,
              image: product.images && product.images.length > 0 ? product.images[0] : undefined
            };
            return <ProductCard key={product._id} product={productForCard} />;
          })}
        </div>

      </div>
    </section>
  );
}
