"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('suki_token');
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    
    setIsLoggedIn(true);

    const fetchWishlistProducts = async () => {
      try {
        const res = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.wishlist) {
          setWishlistProducts(data.wishlist);
        }
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Loading your wishlist...</h2>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', minHeight: '60vh' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '1rem' }}>Please Login</h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>You need to be logged in to view and save items to your wishlist.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 0', minHeight: '60vh' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>My Wishlist</h1>
      
      {wishlistProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Your wishlist is currently empty.</p>
          <Link href="/collections/lehengas" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
            Explore Collections
          </Link>
        </div>
      ) : (
        <div className="product-grid" style={{ marginTop: '2rem' }}>
          {wishlistProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
