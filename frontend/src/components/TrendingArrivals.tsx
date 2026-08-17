"use client";
import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

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

export default function TrendingArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?isNewArrival=true', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setProducts(data.slice(0, 4));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching trending products:', err);
        setLoading(false);
      });
  }, []);

  return (
    <section className="trending">
      <div className="trending-head">
        <div>
          <h2 className="serif">Trending arrivals</h2>
          <div className="rule"></div>
        </div>
        <div className="arrows">
          <div className="arrow-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <div className="arrow-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>
      <p className="tagline">Discover our most loved collections</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <div className="trending-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
