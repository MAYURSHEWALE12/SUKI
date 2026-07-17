"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  numReviews?: number;
}

export default function BestSellersGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await fetch('/api/products?sort=rating');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch best sellers', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  return (
    <section className="best-sellers-section container">
      <div className="section-header-row">
        <h2 className="section-title-left">Best Sellers</h2>
        <Link href="/collections/best-sellers" className="btn-view-all">View All</Link>
      </div>
      {loading ? (
        <div className="carousel-loading">Loading best sellers...</div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
