"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  isNewArrival?: boolean;
  numReviews?: number;
  rating?: number;
}

export default function SareesGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?category=Sarees', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setProducts(data.slice(0, 8));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching trending products:', err);
        setLoading(false);
      });
  }, []);

  return (
    <section className="trending sarees-banner-grid" style={{ paddingTop: '15px' }}>

      {loading ? (
        <div className="trending-grid">
          {Array(8).fill(0).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="trending-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product as any} />
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <a href="/collections/sarees" className="btn btn-outline" style={{ display: 'inline-block', padding: '12px 32px', border: '1px solid #C2185B', backgroundColor: '#C2185B', color: '#fff', textDecoration: 'none', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>
          View All Sarees
        </a>
      </div>
    </section>
  );
}
