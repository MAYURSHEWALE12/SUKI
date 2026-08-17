"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './GlobalReviews.css';

export default function GlobalReviews() {
  const [isOpen, setIsOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [previewReview, setPreviewReview] = useState<any | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && reviews.length === 0) {
      fetchReviews();
    }
  }, [isOpen]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products/reviews/all?limit=20');
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch global reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className="global-reviews-tab"
        onClick={() => setIsOpen(true)}
      >
        <span className="global-reviews-tab-star">★</span>
        <span className="global-reviews-tab-text">Our Reviews</span>
      </button>

      {/* Centered Modal */}
      {isOpen && (
        <>
          <div className="global-reviews-overlay" onClick={() => setIsOpen(false)}></div>
          <div className="global-reviews-modal">
            <div className="global-reviews-modal-header">
              <h2>Our Reviews</h2>
              <button className="global-reviews-modal-close" onClick={() => setIsOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="global-reviews-modal-filter">
              <select 
                className="global-reviews-filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All reviews</option>
                <option value="media">Review with media</option>
              </select>
            </div>

            <div className="global-reviews-modal-content">
          {loading ? (
            <div className="global-reviews-loading">
              <div className="spinner"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="global-reviews-empty">No reviews available.</div>
          ) : (
            <div className="global-reviews-feed">
              {reviews.filter(rev => filter === 'all' || (filter === 'media' && rev.images && rev.images.length > 0)).map((rev, idx) => {
                const initials = rev.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <div key={idx} className="global-review-card">
                    {/* Main Review Image (Top) */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="global-review-card-img-container" onClick={() => {
                        setPreviewReview(rev);
                        setPreviewImageIndex(0);
                      }}>
                        <img 
                          src={rev.images[0]} 
                          alt="Review photo" 
                          className="global-review-card-img"
                        />
                      </div>
                    )}
                    
                    <div className="global-review-card-body">
                      {/* User Info */}
                      <div className="global-review-user-row">
                        <div className="global-review-avatar">
                          {initials}
                        </div>
                        <div className="global-review-name">{rev.name}</div>
                      </div>
                      
                      {/* Stars and Date */}
                      <div className="global-review-stars-row">
                        <div className="stars" style={{ display: 'flex', gap: '2px' }}>
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < rev.rating ? "#FBBF24" : "#E9E9EA"} stroke="none">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                          ))}
                        </div>
                        <div className="global-review-date">{new Date(rev.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      </div>
                      
                      {/* Comment text */}
                      <p className="global-review-comment">{rev.comment}</p>
                    </div>

                    {/* Link to Product (Bottom) */}
                    {rev.product && (
                      <div className="global-review-product-bottom">
                        <Link href={`/product/${rev.product._id}`} className="global-review-product-link" onClick={() => setIsOpen(false)}>
                          <img src={rev.product.image} alt={rev.product.name} className="global-review-product-thumb" />
                          <span className="global-review-product-name">{rev.product.name}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* Fullscreen Image Preview */}
      {previewReview && (
        <div className="global-review-preview-overlay" onClick={() => setPreviewReview(null)}>
          <button className="global-review-preview-close" onClick={() => setPreviewReview(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          {previewReview.images.length > 1 && (
            <button 
              className="global-review-preview-nav prev"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImageIndex((prev) => prev > 0 ? prev - 1 : previewReview.images.length - 1);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}

          <div className="global-review-preview-content" onClick={(e) => e.stopPropagation()}>
            <img src={previewReview.images[previewImageIndex]} alt="Review preview" />
            
            <div className="global-review-preview-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="global-review-avatar">
                  {previewReview.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#111' }}>{previewReview.name}</div>
                  <div className="stars" style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < previewReview.rating ? "var(--pdp-primary)" : "#E9E9EA"} stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, color: '#444', fontSize: '0.9rem', lineHeight: '1.5' }}>{previewReview.comment}</p>
            </div>
          </div>

          {previewReview.images.length > 1 && (
            <button 
              className="global-review-preview-nav next"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImageIndex((prev) => prev < previewReview.images.length - 1 ? prev + 1 : 0);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
