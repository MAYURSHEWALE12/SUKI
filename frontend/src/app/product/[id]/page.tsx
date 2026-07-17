"use client";
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import './product.css';

interface Product {
  _id: string;
  name: string;
  image: string;
  hoverImage?: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  rating?: number;
  numReviews?: number;
  countInStock: number;
  reviews?: any[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('S');
  const [mainImage, setMainImage] = useState<string>('');
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'Custom'];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          setMainImage(data.image);
        }
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');
    const token = localStorage.getItem('suki_token');
    if (!token) {
      setReviewError('Please login to submit a review');
      setReviewLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      if (res.ok) {
        alert('Review submitted successfully!');
        setComment('');
        setRating(5);
        window.location.reload();
      } else {
        const data = await res.json();
        setReviewError(data.message || 'Failed to submit review');
      }
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Suki Ethnic Product',
          text: `Check out this amazing ${product?.name} at Suki Ethnic!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  if (loading) {
    return <div className="product-loading">Loading product details...</div>;
  }

  if (!product) {
    return <div className="product-not-found">Product not found</div>;
  }

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const isWishlisted = wishlist.includes(product._id);

  return (
    <div className="product-detail-page container">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Home</Link>
        <svg className="breadcrumb-separator" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        <Link href={`/collections/${product.category.toLowerCase()}`} className="breadcrumb-link">{product.category}</Link>
        <svg className="breadcrumb-separator" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div className="product-layout">
        {/* Left Side: Images */}
        <div className="product-gallery">
          <div className="thumbnail-list">
            <button 
              className={`thumbnail-btn ${mainImage === product.image ? 'active' : ''}`}
              onClick={() => setMainImage(product.image)}
            >
              <img src={product.image} alt="Thumbnail 1" />
            </button>
            {product.hoverImage && (
              <button 
                className={`thumbnail-btn ${mainImage === product.hoverImage ? 'active' : ''}`}
                onClick={() => setMainImage(product.hoverImage)}
              >
                <img src={product.hoverImage} alt="Thumbnail 2" />
              </button>
            )}
          </div>
          <div className="main-image-container">
            <img src={mainImage} alt={product.name} className="main-image" />
          </div>
        </div>

        {/* Right Side: Info */}
        <div className="product-info-panel">
          
          <div className="pdp-top-actions">
            <div className="pdp-reviews-top">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < Math.floor(product.rating || 5) ? "var(--color-primary)" : "none"} stroke="var(--color-primary)" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <span className="review-count">{product.numReviews || 39} reviews</span>
            </div>
            
            <div className="pdp-share-icons">
              <button className="icon-btn" onClick={() => toggleWishlist(product._id)} style={{ color: isWishlisted ? 'var(--color-primary)' : 'inherit' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </button>
              <button className="icon-btn" onClick={handleShare} aria-label="Share product">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
              </button>
            </div>
          </div>

          <h1 className="pdp-title">{product.name}</h1>
          
          <div className="pdp-price">
            ₹ {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          
          <hr className="pdp-divider" />

          {/* Size Selector */}
          <div className="pdp-selector-group">
            <div className="pdp-selector-header">
              <span className="pdp-label">Size: <span className="pdp-value">{selectedSize}</span></span>
              <button className="size-chart-link">Size chart</button>
            </div>
            <div className="pdp-size-options">
              {sizes.map((size) => (
                <button 
                  key={size}
                  className={`pdp-size-btn ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color & Material Selectors Row */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'stretch' }}>
            {/* Color Selector */}
            <div className="pdp-selector-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="pdp-selector-header">
                <span className="pdp-label">Color: <span className="pdp-value">Wine</span></span>
              </div>
              <div className="pdp-color-options">
                <button className="pdp-material-btn active" style={{ width: '100%' }}>Wine</button>
              </div>
            </div>

            {/* Material Selector */}
            <div className="pdp-selector-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="pdp-selector-header">
                <span className="pdp-label">Material: <span className="pdp-value">Poly Georgette</span></span>
              </div>
              <div className="pdp-material-options">
                <button className="pdp-material-btn active" style={{ width: '100%', height: '100%' }}>Poly Georgette</button>
              </div>
            </div>
          </div>
          
          {/* Quantity Selector & Actions Grid */}
          <div className="pdp-selector-group" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
            <div className="pdp-selector-header">
              <span className="pdp-label">Quantity:</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
              
              {/* Left Column: Qty & Add to Cart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="pdp-qty-selector" style={{ height: '3.5rem', margin: 0 }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
                
                <button 
                  className="btn pdp-btn-outline"
                  style={{ flex: 1, height: '3.5rem', margin: 0, fontSize: '0.85rem', padding: '0 0.5rem' }}
                  disabled={product.countInStock === 0}
                  onClick={() => {
                    addToCart({
                      _id: product._id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                      size: selectedSize,
                      quantity: quantity,
                      countInStock: product.countInStock
                    });
                    setIsAdded(true);
                    setTimeout(() => setIsAdded(false), 2000);
                  }}
                >
                  {product.countInStock > 0 ? (isAdded ? 'ADDED ✓' : 'ADD TO CART') : 'OUT OF STOCK'}
                </button>
              </div>

              {/* Right Column: Buy It Now */}
              <button 
                className="btn pdp-btn-solid"
                style={{ height: '100%', margin: 0, fontSize: '0.9rem' }}
                disabled={product.countInStock === 0}
              >
                BUY IT NOW
              </button>

            </div>
          </div>
        </div>
      </div>
          
      {/* Accordion Sections */}
          <div className="pdp-accordion-wrapper">
            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')}>
                <div className="pdp-accordion-title">
                  <span>Description</span>
                </div>
                <span className="pdp-accordion-icon" style={{ transform: openAccordion === 'description' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>{openAccordion === 'description' ? '−' : '+'}</span>
              </button>
              <div className={`pdp-accordion-content-wrapper ${openAccordion === 'description' ? 'open' : ''}`}>
                <div className="pdp-accordion-content">
                  <p>{product.description || 'Elevate your wardrobe with this exquisite piece. Carefully crafted with premium materials for maximum comfort and style.'}</p>
                </div>
              </div>
            </div>

            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'return' ? null : 'return')}>
                <div className="pdp-accordion-title">
                  <span>Return & Exchange</span>
                </div>
                <span className="pdp-accordion-icon" style={{ transform: openAccordion === 'return' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>{openAccordion === 'return' ? '−' : '+'}</span>
              </button>
              <div className={`pdp-accordion-content-wrapper ${openAccordion === 'return' ? 'open' : ''}`}>
                <div className="pdp-accordion-content">
                  <p>We offer a hassle-free 7-day return and exchange policy. Items must be unworn with all tags attached.</p>
                </div>
              </div>
            </div>

            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}>
                <div className="pdp-accordion-title">
                  <span>Shipping Policy</span>
                </div>
                <span className="pdp-accordion-icon" style={{ transform: openAccordion === 'shipping' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>{openAccordion === 'shipping' ? '−' : '+'}</span>
              </button>
              <div className={`pdp-accordion-content-wrapper ${openAccordion === 'shipping' ? 'open' : ''}`}>
                <div className="pdp-accordion-content">
                  <p>Free standard shipping on all orders over ₹2000. Delivery typically takes 3-5 business days.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="product-reviews" style={{ marginTop: '3rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Customer Reviews</h3>
            
            {(!product.reviews || product.reviews.length === 0) ? (
              <p style={{ color: '#777', marginBottom: '2rem' }}>No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="reviews-list" style={{ marginBottom: '2rem' }}>
                {product.reviews.map((rev: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontFamily: 'var(--font-body)' }}>{rev.name}</strong>
                      <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="stars" style={{ marginBottom: '0.5rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rev.rating ? "var(--color-primary)" : "none"} stroke="var(--color-primary)" strokeWidth="1">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      ))}
                    </div>
                    <p style={{ color: '#555', lineHeight: '1.5' }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="review-form-container" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--color-border)' }}>
              <h4 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>Write a Review</h4>
              {reviewError && <p style={{ color: '#e74c3c', marginBottom: '1rem', fontSize: '0.9rem', padding: '0.75rem', background: '#fdf0ed', borderRadius: '4px' }}>{reviewError}</p>}
              <form onSubmit={submitReview}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Rating</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }} onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star}
                        width="28" 
                        height="28" 
                        viewBox="0 0 24 24" 
                        fill={(hoverRating || rating) >= star ? "var(--color-primary)" : "transparent"} 
                        stroke={(hoverRating || rating) >= star ? "var(--color-primary)" : "#ccc"} 
                        strokeWidth="1.5"
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => setRating(star)}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Comment</label>
                  <textarea 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)}
                    rows={4} 
                    required
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: '8px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.2s'
                    }}
                    placeholder="Share your experience with this product..."
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
                <button type="submit" className="btn pdp-btn-solid" disabled={reviewLoading} style={{ padding: '0.9rem 2.5rem', borderRadius: '6px' }}>
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
    </div>
  );
}
