"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

interface WishlistProduct {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  numReviews?: number;
  category?: string;
  countInStock?: number;
}

export default function WishlistPage() {
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem('suki_token'));

  useEffect(() => {
    const token = localStorage.getItem('suki_token');
    if (!token) {
      queueMicrotask(() => setLoading(false));
      return;
    }

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
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', color: '#C2185B' }}>Loading your wishlist...</h2>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', display: 'flex', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          background: 'white',
          border: '1px solid #FCE4EC',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#FFF0F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.8rem', fontWeight: 600, color: '#111', marginBottom: '0.8rem' }}>Please Login</h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>You need to be logged in to view and save items to your wishlist.</p>
          <Link href="/account" className="btn btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '6px', fontWeight: '600', textDecoration: 'none', background: '#C2185B', color: '#fff' }}>
            Go to Account / Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '100%', maxWidth: '1100px' }}>
        
        {/* White Card Container */}
        <div style={{
          background: 'white',
          border: '1px solid #FCE4EC',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        }} className="wishlist-card">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .wishlist-card {
                padding: 1.2rem 0.8rem !important;
              }
            }
          `}} />
          
          {/* Header Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#FFF0F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', color: '#111', fontFamily: 'Poppins, sans-serif' }}>My Wishlist</h2>
              <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: 'clamp(12px, 2.5vw, 14px)', lineHeight: '1.2', fontFamily: 'Poppins, sans-serif' }}>Manage your favorite items.</p>
            </div>
          </div>

          {/* Floral Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#FCE4EC' }}></div>
            <span style={{ color: '#C2185B', display: 'flex', alignItems: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 5.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" />
                <path d="M12 12.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" />
                <path d="M5.5 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z" />
                <path d="M12.5 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z" />
                <path d="M7.4 7.4a3 3 0 1 0 4.2 4.2 3 3 0 1 0-4.2-4.2z" />
                <path d="M12.4 12.4a3 3 0 1 0 4.2 4.2 3 3 0 1 0-4.2-4.2z" />
                <path d="M7.4 16.6a3 3 0 1 0 4.2-4.2 3 3 0 1 0-4.2 4.2z" />
                <path d="M16.6 7.4a3 3 0 1 0-4.2 4.2 3 3 0 1 0 4.2-4.2z" />
              </svg>
            </span>
            <div style={{ flex: 1, height: '1px', background: '#FCE4EC' }}></div>
          </div>

          {wishlistProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '2rem', fontFamily: 'Poppins, sans-serif' }}>Your wishlist is currently empty.</p>
              <Link 
                href="/collections/lehengas" 
                className="btn btn-primary" 
                style={{
                  borderRadius: '6px',
                  padding: '0.8rem 2rem',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#C2185B',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                Explore Collections
              </Link>
            </div>
          ) : (
            <div className="product-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '2rem',
              marginTop: '1rem'
            }}>
              {wishlistProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
