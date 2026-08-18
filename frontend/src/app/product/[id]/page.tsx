"use client";
import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/context/ToastContext';
import ProductCard from '@/components/ProductCard';
import Draggable from 'react-draggable';


interface Review {
  _id?: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

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
  reviews?: Review[];
  material?: string;
  video?: string;
  shortDescription?: string;
  highlights?: string;
  careInstructions?: string;
  whatsIncluded?: string;
}

interface RecentlyViewedProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

interface RelatedProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating?: number;
  numReviews?: number;
  countInStock?: number;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('');
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>('details');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedPill, setSelectedPill] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [previewReview, setPreviewReview] = useState<Review | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [deliveryDates] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 3);
    const end = new Date(today);
    end.setDate(today.getDate() + 6);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    return { start: formatDate(start), end: formatDate(end) };
  });
  const [isFloatingVideoOpen, setIsFloatingVideoOpen] = useState(true);
  const draggableNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          setMainImage(data.image);

          // Save to Recently Viewed in localStorage
          try {
            const stored = JSON.parse(localStorage.getItem('suki_recently_viewed') || '[]') as RecentlyViewedProduct[];
            const filtered = stored.filter((p: RecentlyViewedProduct) => p._id !== data._id);
            const viewedProduct = {
              _id: data._id,
              name: data.name,
              image: data.image,
              price: data.price,
              category: data.category,
            };
            const updated = [viewedProduct, ...filtered].slice(0, 10);
            localStorage.setItem('suki_recently_viewed', JSON.stringify(updated));
          } catch {
            // Silently fail if localStorage is unavailable
          }
        }
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      const stock = product.countInStock;

      queueMicrotask(() => {
        if (quantity > stock && stock > 0) {
          setQuantity(stock);
        } else if (stock === 0) {
          setQuantity(1);
        }
      });
    }
  }, [product, quantity]);

  // Fetch related products from the same category
  useEffect(() => {
    if (!product) return;
    const fetchRelated = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const allProducts = await res.json();
          const related = allProducts
            .filter((p: RelatedProduct) => p.category === product.category && p._id !== product._id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error('Failed to fetch related products', error);
      }
    };
    fetchRelated();
  }, [product]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('suki_token');
    if (!token) {
      setReviewError('Please login to submit a review');
      return false;
    }
    
    setReviewLoading(true);
    setReviewError('');
    try {
      let imagePaths: string[] = [];
      if (uploadedImages.length > 0) {
        const formData = new FormData();
        uploadedImages.forEach(file => formData.append('images', file));
        
        const uploadRes = await fetch('/api/upload/multiple', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
        if (uploadRes.ok) {
          imagePaths = await uploadRes.json();
        } else {
          showToast('Failed to upload images', 'error');
          setReviewLoading(false);
          return false;
        }
      }

      const res = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment, images: imagePaths })
      });
      if (res.ok) {
        showToast('Review submitted successfully!', 'success');
        setComment('');
        setRating(5);
        window.location.reload();
        return true;
      } else {
        const data = await res.json();
        setReviewError(data.message || 'Failed to submit review');
        return false;
      }
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
      return false;
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
      showToast('Product link copied to clipboard!', 'info');
    }
  };

  if (loading) {
    return <div className="product-loading">Loading product details...</div>;
  }

  if (!product) {
    return <div className="product-not-found">Product not found</div>;
  }

  const isWishlisted = wishlist.includes(product._id);

  const stockAvailable = product.countInStock;
  const isOutOfStock = stockAvailable === 0;



  const accordionItems = [
    {
      id: 'description',
      title: 'Description',
      content: (
        <>
          {product.highlights && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Highlights:</strong>
              <p style={{ marginTop: '0.25rem', whiteSpace: 'pre-line' }}>{product.highlights}</p>
            </div>
          )}
          {product.whatsIncluded && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>What&apos;s Included:</strong>
              <p style={{ marginTop: '0.25rem' }}>{product.whatsIncluded}</p>
            </div>
          )}
          <ul>
            {(product.description || 'Elevate your wardrobe with this exquisite piece. Carefully crafted with premium materials for maximum comfort and style.')
              .split(/[.;]+/)
              .map((point) => point.trim())
              .filter(Boolean)
              .slice(0, 5)
              .map((point, i) => (
                <li key={i}>{point}.</li>
              ))}
          </ul>
        </>
      ),
    },
    {
      id: 'shipping',
      title: 'Shipping Policy',
      content: (
        <>
          <p>Free standard shipping on all orders over ₹2000. Delivery typically takes 3-5 business days.</p>
        </>
      ),
    },
    {
      id: 'returns',
      title: 'Exchange, Return & Refund Policy',
      content: (
        <>
          <p>We offer a hassle-free 7-day return and exchange policy. Items must be unworn with all tags attached.</p>
        </>
      ),
    },
    {
      id: 'care',
      title: 'Wash Care & Manufacturer Info',
      content: (
        <>
          {product.careInstructions ? (
            <p style={{ whiteSpace: 'pre-line' }}>{product.careInstructions}</p>
          ) : (
            <>
              <p>We recommend gentle dry cleaning to preserve the rich texture and embellishments of this garment. Store in a cool, dry place away from direct sunlight.</p>
              <ul>
                <li>Dry clean only for best results</li>
                <li>Do not bleach or tumble dry</li>
                <li>Iron on low heat, inside out</li>
              </ul>
            </>
          )}
        </>
      ),
    },
  ];

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (product?.reviews) {
    product.reviews.forEach((r: Review) => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingCounts[r.rating as keyof typeof ratingCounts]++;
      }
    });
  }
  const totalReviewsCount = product?.reviews?.length || 0;

  const quickFeedbackOptions = [
    "Stunning designs, rich fabrics, and perfect fit. Highly recommended!",
    "Traditional elegance meets modern flair—loved every piece I wore",
    "Beautiful ethnic collection, great quality, fits like a dream!",
    "Excellent stitching, vibrant colors, premium feel—totally worth the price!",
    "Gorgeous outfits, festive ready, received so many compliments, super happy!",
    "Superb quality, comfortable wear, perfect for all Indian celebrations!",
    "Amazing craftsmanship, flawless detailing, timely delivery—absolutely loved my outfit!"
  ];

  return (
    <div className="product-detail-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div className="breadcrumbs" style={{ margin: 0, padding: 0 }}>
          <Link href="/" className="breadcrumb-link">Home</Link>
          <svg className="breadcrumb-separator" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          <Link href={`/collections/${product.category.toLowerCase()}`} className="breadcrumb-link">{product.category}</Link>
          <svg className="breadcrumb-separator" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          <span className="breadcrumb-current">{product.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginLeft: 'auto' }}>

          <button onClick={handleShare} aria-label="Share" style={{ background: '#FDF2F8', border: '1px solid #FCE7F3', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C2185B' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
          <button 
            onClick={() => {
              const url = window.location.href;
              const text = `Can I get more details about this ${product.name}?\n${url}`;
              window.open(`https://wa.me/917768875524?text=${encodeURIComponent(text)}`, '_blank');
            }}
            aria-label="WhatsApp" style={{ background: '#FDF2F8', border: '1px solid #FCE7F3', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C2185B' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
          <button 
            onClick={() => toggleWishlist(product._id)}
            aria-label="Toggle Wishlist" style={{ background: '#FDF2F8', border: '1px solid #FCE7F3', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#C2185B' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="product-layout">
        {/* Left Side: Images */}
        <div className="product-gallery">
          <div 
            className="main-image-container"
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={(e) => {
              const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - left) / width) * 100;
              const y = ((e.clientY - top) / height) * 100;
              setZoomPos({ x, y });
            }}
          >

            <button className="pdp-wishlist-float" onClick={() => toggleWishlist(product._id)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>


            <Image 
              key={mainImage} 
              src={mainImage} 
              alt={product.name} 
              className={`main-image ${isZooming ? 'zooming' : ''}`} 
              width={600}
              height={750}
              sizes="(max-width: 768px) 100vw, 50vw"
              style={isZooming ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
            />

            <div className="pdp-carousel-dots">
              <span className={`dot ${mainImage === product.image ? 'active' : ''}`} onClick={() => setMainImage(product.image)}></span>
              {product.hoverImage && (
                <span className={`dot ${mainImage === product.hoverImage ? 'active' : ''}`} onClick={() => setMainImage(product.hoverImage!)}></span>
              )}
            </div>
          </div>
          
          <div className="thumbnail-list">
            <button 
              className={`thumbnail-btn ${mainImage === product.image ? 'active' : ''}`}
              onClick={() => setMainImage(product.image)}
              aria-label="View main image"
            >
              <Image src={product.image} alt="Thumbnail 1" width={80} height={100} />
            </button>
            {product.hoverImage && (
              <button 
                className={`thumbnail-btn ${mainImage === product.hoverImage ? 'active' : ''}`}
                onClick={() => setMainImage(product.hoverImage!)}
                aria-label="View alternate image"
              >
                <Image src={product.hoverImage} alt="Thumbnail 2" width={80} height={100} />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Info */}
        <div className="product-info">
          <h1 className="pdp-title" style={{ textTransform: 'uppercase', margin: 0, marginBottom: '0.5rem', fontFamily: '"Poppins", sans-serif', fontWeight: 600, letterSpacing: '1px', color: '#4a1523' }}>{product.name}</h1>
          {product.shortDescription && (
            <p style={{ color: '#6b7280', fontSize: '1.05rem', marginTop: 0, marginBottom: '1rem', lineHeight: 1.5 }}>{product.shortDescription}</p>
          )}

          <div 
            style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}
            onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span style={{ color: '#4b5563', fontWeight: 600 }}>Rating ({(product.rating || 5.0).toFixed(1)})</span>
            <div className="pdp-stars" style={{ display: 'flex', gap: '2px' }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.floor(product.rating || 5.0) ? "#FACC15" : "#E9E9EA"} stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ))}
            </div>
            <span style={{ color: '#4b5563', marginLeft: '0.2rem' }}>Reviews</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ color: '#C2185B', fontWeight: 700, fontSize: '0.95rem' }}>{product.numReviews || 0}</span>
          </div>

          <div className="pdp-price" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 600, color: '#C2185B', fontFamily: 'Inter, sans-serif' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '1.25rem', fontFamily: 'Inter, sans-serif' }}>₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </>
            )}
          </div>


          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', backgroundColor: '#FDF2F8', padding: '1.2rem', borderRadius: '12px', border: '1px solid #FCE7F3' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.5 }}>
              Delivery between<br/>
              <strong style={{ color: '#111827' }}>{deliveryDates.start || '...'}</strong> and<br/>
              <strong style={{ color: '#111827' }}>{deliveryDates.end || '...'}</strong>.<br/>
              ( Prepaid Order* )
            </div>
          </div>

          {/* Action Row */}
          <div className="pdp-new-actions">
            <div className="pdp-cart-actions">
              {/* Quantity selector removed as per request */}
              <button 
                className="btn-add-bag"
                disabled={isOutOfStock}
                onClick={() => {
                  addToCart({
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantity,
                    countInStock: stockAvailable
                  });
                  setIsAdded(true);
                  showToast('Added to cart successfully!', 'success');
                  setTimeout(() => setIsAdded(false), 2000);
                }}
              >
                {stockAvailable > 0 ? (isAdded ? 'Added ✓' : 'Add to cart') : 'Out of stock'}
              </button>
            </div>
            
          </div>




          {/* Elegant Accordion Sections */}
          <div className="pdp-accordion-wrapper">
            {accordionItems.map((item) => (
              <div className={`pdp-accordion-item ${openAccordion === item.id ? 'open' : ''}`} key={item.id}>
                <button className="pdp-accordion-header" onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}>
                  <span className="pdp-accordion-title-wrap">
                    <span className="pdp-accordion-title">{item.title}</span>
                  </span>
                  <span className={`pdp-accordion-icon ${openAccordion === item.id ? 'open' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </button>
                <div className={`pdp-accordion-content-wrapper ${openAccordion === item.id ? 'open' : ''}`}>
                  <div className="pdp-accordion-content">
                    {item.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className="product-reviews" id="reviews">
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="pdp-reviews-heading">Customer Reviews</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
            <div style={{ width: '120px', height: '1.5px', background: '#FDF2F8' }}></div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--pdp-primary)" stroke="none">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"></path>
            </svg>
            <div style={{ flex: 1, height: '1.5px', background: '#FDF2F8' }}></div>
          </div>
        </div>

        {/* Reviews Summary */}
        <div className="pdp-reviews-panel-wrapper">
          {/* Left Panel */}
          <div className="pdp-reviews-panel-col">
            <span className="pdp-reviews-score" style={{ color: 'var(--pdp-primary)' }}>{(product.rating || 0).toFixed(1)}</span>
            <div className="pdp-stars pdp-stars-lg" style={{ margin: '0.5rem 0' }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill={i < Math.round(product.rating || 0) ? "var(--pdp-primary)" : "#E9E9EA"} stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ))}
            </div>
            <span className="pdp-reviews-count">{totalReviewsCount} reviews</span>
          </div>

          {/* Middle Panel - Progress bars */}
          <div className="pdp-reviews-panel-col center-col">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingCounts[star as keyof typeof ratingCounts] || 0;
              const percent = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
              return (
                <div key={star} className="pdp-rating-bar-row">
                  <span style={{ width: '20px' }}>{star}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--pdp-primary)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <div className="pdp-rating-bar-track">
                    <div className="pdp-rating-bar-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                  <span style={{ width: '30px', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Right Panel */}
          <div className="pdp-reviews-panel-col">
            <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--pdp-primary)', marginBottom: '0.5rem' }}>Click to review</span>
            <div className="pdp-review-stars-action">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg 
                  key={star} 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="transparent" 
                  stroke="var(--pdp-primary)" 
                  strokeWidth="1.2"
                  onClick={() => {
                    setRating(star);
                    setIsReviewModalOpen(true);
                  }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ))}
            </div>
          </div>
        </div>

        {(!product.reviews || product.reviews.length === 0) ? (
          <p style={{ color: '#777', marginBottom: '2rem' }}>No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="pdp-reviews-masonry">
            {product.reviews.map((rev: Review, idx: number) => {
              const initials = rev.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div 
                  key={idx} 
                  className="pdp-review-card"
                  style={{ cursor: rev.images && rev.images.length > 0 ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (rev.images && rev.images.length > 0) {
                      setPreviewReview(rev);
                      setPreviewImageIndex(0);
                    }
                  }}
                >
                  {rev.images && rev.images.length > 0 && (
                    <Image src={rev.images[0]} alt="Review photo" className="pdp-review-card-img" width={400} height={500} />
                  )}
                  <div className="pdp-review-card-body">
                    <div className="pdp-review-user-row">
                      <div className="pdp-review-avatar">
                        {initials}
                        <div className="pdp-review-verified">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      </div>
                      <div className="pdp-review-name">{rev.name}</div>
                    </div>
                    <div className="pdp-review-stars-row">
                      <div className="stars" style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rev.rating ? "var(--pdp-primary)" : "#E9E9EA"} stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        ))}
                      </div>
                      <div className="pdp-review-date">{new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
                    </div>
                    <p style={{ color: 'var(--pdp-muted)', lineHeight: '1.5', fontSize: '0.9rem' }}>{rev.comment}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}


      </div>

      {/* You May Also Like Section */}
      {relatedProducts.length > 0 && (
        <div className="pdp-related-wrapper" >
          <div className="pdp-related-header">
            <h2 className="pdp-related-title">You May Also Like</h2>
            <div className="pdp-related-separator">
              <span></span>
              <svg width="16" height="16" viewBox="0 0 100 100" fill="var(--pdp-primary)" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 0 Q 50 50 100 50 Q 50 50 50 100 Q 50 50 0 50 Q 50 50 50 0 Z" />
              </svg>
              <span></span>
            </div>
            <p className="pdp-related-subtitle">Handpicked just for you</p>
          </div>

          <div className="pdp-related-carousel">
            {relatedProducts.map((rp: RelatedProduct) => (
              <ProductCard key={rp._id} product={rp} />
            ))}
          </div>

          <div className="pdp-related-footer">
            <a href="/shop" className="pdp-related-view-all">
              VIEW ALL
            </a>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <div className={`pdp-review-modal-overlay ${isReviewModalOpen ? 'open' : ''}`}>
        <div className="pdp-review-modal-content">
          <button className="pdp-modal-close" onClick={() => setIsReviewModalOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <h2 className="pdp-modal-title">Tell us about your reviews</h2>
          
          <Image src={mainImage} alt={product.name} className="pdp-modal-img" width={140} height={180} />
          <div className="pdp-modal-product-title">{product.name}</div>
          
          <div className="pdp-modal-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg 
                key={star}
                width="36" 
                height="36" 
                viewBox="0 0 24 24" 
                fill={(hoverRating || rating) >= star ? "var(--pdp-primary)" : "transparent"} 
                stroke={(hoverRating || rating) >= star ? "var(--pdp-primary)" : "#FDF2F8"} 
                strokeWidth="1.5"
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={() => setHoverRating(star)}
                onClick={() => setRating(star)}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            ))}
          </div>
          <div className="pdp-modal-rating-text">
            {rating === 5 ? "Excellent" : rating === 4 ? "Good" : rating === 3 ? "Average" : rating === 2 ? "Poor" : "Terrible"}
          </div>

          <form onSubmit={async (e) => {
            const success = await submitReview(e);
            if (success) {
              setIsReviewModalOpen(false);
            }
          }}>
            <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 600, color: 'var(--pdp-ink)', fontSize: '0.95rem' }}>
              Feedback <span style={{ color: 'var(--pdp-primary)' }}>*</span>
            </label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              rows={3} 
              required
              style={{ 
                width: '100%', 
                padding: '1rem', 
                border: '1px solid #FDF2F8', 
                borderRadius: '8px',
                fontFamily: 'Inter',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'vertical',
                marginBottom: '1.5rem',
                transition: 'border-color 0.2s',
                backgroundColor: '#fff'
              }}
              placeholder="Write your feedback..."
              onFocus={(e) => e.target.style.borderColor = 'var(--pdp-primary)'}
              onBlur={(e) => e.target.style.borderColor = '#FDF2F8'}
            />

            <div className="pdp-feedback-pills">
              {quickFeedbackOptions.map((opt, i) => (
                <div 
                  key={i} 
                  className={`pdp-feedback-pill ${selectedPill === opt ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedPill(opt);
                    setComment(opt);
                  }}
                >
                  <span>{opt}</span>
                </div>
              ))}
            </div>

            <div className="pdp-media-upload" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    const totalFiles = [...uploadedImages, ...newFiles];
                    if (totalFiles.length > 3) {
                      showToast('You can only upload a maximum of 3 images', 'error');
                      setUploadedImages(totalFiles.slice(0, 3));
                    } else {
                      setUploadedImages(totalFiles);
                    }
                  }
                }}
              />
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem', margin: '0 auto 0.5rem auto', display: 'block' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <div style={{ marginBottom: '0.25rem', color: 'var(--pdp-ink)', fontWeight: 500 }}>Upload photos (Optional)</div>
              <div style={{ color: 'var(--pdp-muted)' }}>(Accepts .gif, .jpg, .png and 5MB limit)</div>
            </div>

            {uploadedImages.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {uploadedImages.map((file, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                    <Image src={URL.createObjectURL(file)} alt="Preview" unoptimized width={60} height={60} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedImages(uploadedImages.filter((_, i) => i !== idx));
                      }}
                      style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="pdp-btn-solid" disabled={reviewLoading} style={{ width: '100%', padding: '1rem', background: 'var(--pdp-primary)', color: '#fff', fontSize: '1.1rem', borderRadius: '4px', border: 'none', fontWeight: 600, letterSpacing: '0.5px' }}>
              {reviewLoading ? 'SUBMITTING...' : 'NEXT'}
            </button>
            {reviewError && <p style={{ color: '#E53E3E', marginTop: '1rem', textAlign: 'center' }}>{reviewError}</p>}
          </form>
        </div>
      </div>
      {/* Review Preview Modal */}
      {previewReview && previewReview.images && previewReview.images.length > 0 && (
        <div className="pdp-review-preview-overlay" onClick={() => setPreviewReview(null)}>
          <div className="pdp-review-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="pdp-review-preview-left">
              <div className="pdp-review-preview-img-wrapper">
                <Image src={previewReview.images[previewImageIndex]} alt="Review preview" className="pdp-review-preview-img" fill sizes="(max-width: 768px) 100vw, 50vw" />
                
                {previewReview.images.length > 1 && (
                  <>
                    <button className="pdp-preview-nav-btn left" onClick={() => setPreviewImageIndex(prev => prev === 0 ? previewReview.images!.length - 1 : prev - 1)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button className="pdp-preview-nav-btn right" onClick={() => setPreviewImageIndex(prev => prev === previewReview.images!.length - 1 ? 0 : prev + 1)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </>
                )}
              </div>
              
              {previewReview.images.length > 1 && (
                <div className="pdp-preview-thumbnails">
                  {previewReview.images.map((img: string, idx: number) => (
                    <Image 
                      key={idx} 
                      src={img} 
                      alt="Thumbnail" 
                      className={`pdp-preview-thumb ${idx === previewImageIndex ? 'active' : ''}`} 
                      width={56}
                      height={70}
                      onClick={() => setPreviewImageIndex(idx)} 
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="pdp-review-preview-details">
              <button className="pdp-preview-close" onClick={() => setPreviewReview(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pdp-primary)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              <div className="pdp-review-user-row" style={{ marginTop: '1rem' }}>
                <div className="pdp-review-avatar" style={{ background: '#FCE7F3', color: '#9D174D' }}>
                  {previewReview.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  <div className="pdp-review-verified" style={{ background: 'var(--pdp-primary)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
                <div className="pdp-review-name" style={{ fontSize: '1.05rem' }}>{previewReview.name}</div>
              </div>
              <div className="pdp-review-stars-row" style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                <div className="stars" style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < previewReview.rating ? "var(--pdp-primary)" : "#E9E9EA"} stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  ))}
                </div>
                <div className="pdp-review-date" style={{ color: '#aaa', fontWeight: 500 }}>{new Date(previewReview.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
              </div>
              <p style={{ color: '#4B5563', lineHeight: '1.7', fontSize: '1rem', marginTop: '1rem' }}>{previewReview.comment}</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Video Widget */}
      {product?.video && isFloatingVideoOpen && (
        <Draggable bounds="parent" nodeRef={draggableNodeRef}>
          <div ref={draggableNodeRef} className="pdp-floating-video">
            <button 
              onClick={() => setIsFloatingVideoOpen(false)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '12px',
              }}
            >
              ✕
            </button>
            <video 
              src={product.video} 
              autoPlay 
              loop 
              muted 
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </Draggable>
      )}

    </div>
  );
}
