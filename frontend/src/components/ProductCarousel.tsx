"use client";
import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import './ProductCarousel.css';

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

export default function ProductCarousel({ title }: { title: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = trackRef.current.clientWidth * 0.8; // Scroll 80% of container width
      trackRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="carousel-loading">Loading new arrivals...</div>;
  }

  return (
    <section className="product-carousel-section">
      <div className="container">
        <div className="section-header-row">
          <h2 className="section-title-left">{title}</h2>
          <div className="carousel-controls">
            <button className="carousel-control-btn prev-btn" aria-label="Previous" onClick={() => scroll('left')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button className="carousel-control-btn next-btn" aria-label="Next" onClick={() => scroll('right')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
        
        <div className="carousel-track-container" ref={trackRef}>
          <div className="carousel-track">
            {products.map((product) => (
              <div className="carousel-slide" key={product._id}>
                <ProductCard product={product as any} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
