"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import './QuickViewModal.css';

interface QuickViewProduct {
  _id: string;
  name: string;
  image: string;
  hoverImage?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  numReviews?: number;
  reviews?: number;
  shortDescription?: string;
  description?: string;
  fabric?: string;
  occasion?: string;
  category?: string;
  countInStock: number;
}

export default function QuickViewModal({
  productId,
  fallback,
  onClose,
}: {
  productId: string;
  fallback: { name: string; image: string; price: number };
  onClose: () => void;
}) {
  const { addToCart } = useCart();
  const [product, setProduct] = useState<QuickViewProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products/${productId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((data: QuickViewProduct) => {
        if (cancelled) return;
        setProduct(data);
        setActiveImage(data.image);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const name = product?.name || fallback.name;
  const image = activeImage || product?.image || fallback.image;
  const price = product?.price ?? fallback.price;
  const oldPrice = product?.originalPrice || 0;
  const rating = product?.rating || 0;
  const numReviews = product?.numReviews || product?.reviews || 0;
  const isOutOfStock = (product?.countInStock ?? 0) <= 0;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart({
        _id: productId,
        name,
        price,
        image,
        quantity: qty,
        countInStock: product?.countInStock,
      });
      onClose();
    }
  };

  return (
    <div className="quickview-overlay" onClick={onClose}>
      <div className="quickview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="quickview-close" onClick={onClose} aria-label="Close quick view">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="quickview-layout">
          <div className="quickview-image-col">
            {loading ? (
              <div className="quickview-loading"><div className="spinner"></div></div>
            ) : error ? (
              <Image src={fallback.image} alt={name} width={400} height={500} className="quickview-image" />
            ) : (
              <>
                <Image src={image} alt={name} width={400} height={500} className="quickview-image" />
                {product?.hoverImage && (
                  <div className="quickview-thumbs">
                    <button
                      className={`quickview-thumb ${activeImage === product.image ? 'active' : ''}`}
                      onClick={() => setActiveImage(product.image)}
                      aria-label="View main image"
                    >
                      <Image src={product.image} alt="" width={48} height={60} />
                    </button>
                    <button
                      className={`quickview-thumb ${activeImage === product.hoverImage ? 'active' : ''}`}
                      onClick={() => setActiveImage(product.hoverImage!)}
                      aria-label="View alternate image"
                    >
                      <Image src={product.hoverImage} alt="" width={48} height={60} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="quickview-info">
            <h3 className="quickview-name">{name}</h3>

            <div className="quickview-rating-row">
              <div className="quickview-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`quickview-star ${star <= Math.round(rating) ? 'filled' : 'empty'}`}>★</span>
                ))}
              </div>
              <span className="quickview-rating-count">({numReviews})</span>
            </div>

            <div className="quickview-price-row">
              <span className="quickview-price">₹{price.toLocaleString('en-IN')}</span>
              {oldPrice > price && (
                <>
                  <span className="quickview-old-price">₹{oldPrice.toLocaleString('en-IN')}</span>
                  <span className="quickview-discount">{Math.round(((oldPrice - price) / oldPrice) * 100)}% OFF</span>
                </>
              )}
            </div>

            {!loading && !error && (product?.shortDescription || product?.description) && (
              <p className="quickview-desc">
                {(product?.shortDescription || product?.description || '').substring(0, 140)}
                {(product?.shortDescription || product?.description || '').length > 140 ? '…' : ''}
              </p>
            )}

            <div className="quickview-meta">
              {product?.fabric && <span className="quickview-chip">{product.fabric}</span>}
              {product?.occasion && <span className="quickview-chip">{product.occasion}</span>}
              {product?.category && <span className="quickview-chip">{product.category}</span>}
              <span className="quickview-chip quickview-chip-size">Free Size</span>
            </div>

            <div className="quickview-actions">
              <div className="quickview-qty">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(qty + 1)} aria-label="Increase quantity">+</button>
              </div>
              <button
                className="quickview-atc"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Not Available' : 'ADD TO CART'}
              </button>
            </div>

            <Link href={`/product/${productId}`} className="quickview-details-link" onClick={onClose}>
              View Full Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}