"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import './suki-card.css';

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
  countInStock?: number;
  fabric?: string;
  occasion?: string;
  category?: string;
  celebrity?: string;
  createdAt?: string;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export default function ProductCard({ product }: { product: Product }) {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const productId = product._id || (product.id ? product.id.toString() : '');
  const isWishlisted = wishlist.includes(productId);
  const isOutOfStock = product.countInStock !== undefined && product.countInStock <= 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  const currentPrice = product.price || 0;
  // Only show a strikethrough/discount when an honest MRP exists - never invent one
  const oldPrice = product.originalPrice || 0;
  const rating = product.rating || 0;
  const numReviews = product.numReviews || product.reviews || 0;

  // Show NEW badge for 8 days after creation
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!product.createdAt) return;
    const createdAt = new Date(product.createdAt).getTime();
    const timeout = setTimeout(() => {
      setIsNew((Date.now() - createdAt) < 8 * 24 * 60 * 60 * 1000);
    }, 0);
    return () => clearTimeout(timeout);
  }, [product.createdAt]);

  const isCelebPage = typeof window !== 'undefined' && window.location.pathname.includes('celeb-styles');

  const mockPremiumBadges = ["Celebrity Pick", "Trending", "Limited Edition", "Exclusive"];
  const premiumSeed = hashString(productId);
  const randomPremiumBadge = premiumSeed % 10 > 6 ? mockPremiumBadges[premiumSeed % mockPremiumBadges.length] : null;
  const displayBadge = isNew ? "NEW" : (product.badge || (isCelebPage ? randomPremiumBadge : product.badge));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart({
        _id: productId,
        name: product.name,
        price: currentPrice,
        image: product.image || product.imageUrl || '/placeholder.jpg',
        quantity: 1,
        countInStock: product.countInStock,
      });
    }
  };

  return (
    <div className={`product-card luxury-style-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <Link href={`/product/${productId}`} className="luxury-image-link">
        <div className="luxury-image-wrapper">
          <Image 
            src={product.image || product.imageUrl || '/placeholder.jpg'} 
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="luxury-image"
          />
          
          <button 
            className={`luxury-wishlist-btn ${isWishlisted ? 'active' : ''}`} 
            onClick={handleWishlistClick}
            aria-label="Toggle Wishlist"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          {displayBadge && (
            <div className={`luxury-badge ${isNew ? 'luxury-badge-new' : 'luxury-badge-premium'}`}>
              {displayBadge}
            </div>
          )}

          {/* Hover Add to Cart button */}
          <button 
            className="luxury-atc-btn" 
            onClick={handleAddToCart} 
            aria-label={isOutOfStock ? "Out of stock" : "Add to cart"}
            disabled={isOutOfStock}
            style={{ opacity: isOutOfStock ? 0.7 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
          </button>
        </div>
      </Link>
      
      <div className="luxury-info">
        <Link href={`/product/${productId}`} style={{ textDecoration: 'none' }}>
          <h4 className="luxury-title">{product.name}</h4>
        </Link>

        <div className="luxury-rating-row">
          <div className="luxury-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`luxury-star-icon ${star <= Math.round(rating) ? 'filled' : 'empty'}`}>
                ★
              </span>
            ))}
          </div>
          <span className="luxury-rating-count">({numReviews})</span>
        </div>
        
        <div className="luxury-price-row">
          <span className="luxury-price">₹{currentPrice.toLocaleString('en-IN')}</span>
          {oldPrice > currentPrice && (
            <>
              <span className="luxury-old-price">₹{oldPrice.toLocaleString('en-IN')}</span>
              <span className="luxury-discount-badge">{Math.round(((oldPrice - currentPrice) / oldPrice) * 100)}% OFF</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
