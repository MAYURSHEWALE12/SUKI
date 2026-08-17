"use client";
import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating?: number;
  numReviews?: number;
}

export default function CartRecommendations({ excludeIds }: { excludeIds: string[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = trackRef.current.clientWidth * 0.8;
      trackRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const available = (data as Product[]).filter((p) => !excludeIds.includes(p._id));
          setProducts(available.slice(0, 8));
        }
      } catch (error) {
        console.error('Failed to fetch recommendations', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [excludeIds]);

  if (loading) {
    return <div className="cart-reco-loading">Loading recommendations...</div>;
  }

  if (products.length === 0) return null;

  return (
    <section className="cart-reco-section">
      <div className="cart-reco-header">
        <div className="cart-reco-title-group">
          <h2 className="cart-reco-title">Complete Your Look</h2>
          <p className="cart-reco-subtitle">Handpicked pieces to pair with your order</p>
        </div>
        <div className="cart-reco-controls">
          <button className="cart-reco-control-btn prev-btn" aria-label="Previous" onClick={() => scroll('left')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button className="cart-reco-control-btn next-btn" aria-label="Next" onClick={() => scroll('right')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

      <div className="cart-reco-track-container" ref={trackRef}>
        <div className="cart-reco-track">
          {products.map((product) => (
            <div className="cart-reco-slide" key={product._id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
