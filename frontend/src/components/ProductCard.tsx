"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';

interface Product {
  _id: string;
  name: string;
  mrp?: string;
  salePrice?: string;
  price?: number;
  originalPrice?: number;
  discount?: string;
  badge?: string;
  imageUrl?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  numReviews?: number;
  id?: number | string;
}

export default function ProductCard({ product }: { product: Product }) {
  const badgeWords = product.badge ? product.badge.split(' ') : [];
  const { wishlist, toggleWishlist } = useWishlist();
  const productId = product._id || (product.id ? product.id.toString() : '');
  const isWishlisted = wishlist.includes(productId);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  return (
    <div className="product-card">
      <Link href={`/product/${productId}`}>
        <div className="product-image-wrapper">
          <Image 
            src={product.image || product.imageUrl || ''} 
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            style={{ objectFit: 'cover' }}
            className="product-image"
          />
          
          <button 
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`} 
            onClick={handleWishlistClick}
            aria-label="Toggle Wishlist"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '35px',
              height: '35px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              color: isWishlisted ? 'var(--color-primary)' : '#999',
              transition: 'all 0.2s',
              zIndex: 10
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          {product.badge && (
            <div className="badge-seal" style={{ top: '1rem', left: '1rem', right: 'auto' }}>
              <div className="badge-inner">
                {badgeWords.map((word, i) => (
                  <span key={i}>{word}</span>
                ))}
              </div>
            </div>
          )}

          {/* Rating Pill */}
          <div className="rating-pill">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ))}
            </div>
            <span className="rating-score">{product.rating || "4.8"}</span>
            <span className="rating-divider">|</span>
            <span className="rating-count">{product.numReviews || product.reviews || "12"}</span>
          </div>

        </div>
      </Link>
      
      <div className="product-info">
        <Link href={`/product/${productId}`}>
          <h4>{product.name}</h4>
        </Link>
        <div className="price-row">
          <span className="sale-price">{product.price ? `₹${product.price}` : product.salePrice}</span>
          {(product.originalPrice || product.mrp) && <span className="mrp">{product.originalPrice ? `₹${product.originalPrice}` : product.mrp}</span>}
          {product.discount && <span className="discount">{product.discount}</span>}
        </div>
      </div>
    </div>
  );
}
