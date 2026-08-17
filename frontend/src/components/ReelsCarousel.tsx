"use client";
import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface ReelProduct {
  _id: string;
  name: string;
  image: string;
  video: string;
  price: number;
}

export default function ReelsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [reels, setReels] = useState<ReelProduct[]>([]);
  const { addToCart, setIsCartOpen } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          // Filter products that actually have a video attached
          const videoProducts = data.filter((p: ReelProduct) => p.video && p.video.trim() !== '');
          setReels(videoProducts);
        }
      } catch (err) {
        console.error('Error fetching reel products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReels();
  }, []);

  // Force play all videos
  useEffect(() => {
    if (reels.length > 0 && trackRef.current) {
      const videos = trackRef.current.querySelectorAll('video');
      videos.forEach(video => {
        // Mute is required for programmatic autoplay
        video.muted = true;
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });
    }
  }, [reels]);

  useEffect(() => {
    if (reels.length === 0) return;

    const interval = setInterval(() => {
      if (trackRef.current) {
        const firstCard = trackRef.current.querySelector('.reel-card');
        const cardWidth = firstCard ? firstCard.clientWidth + 24 : 224;
        
        // If we are about to scroll past the first duplicated set
        if (trackRef.current.scrollLeft >= trackRef.current.scrollWidth / 2 - cardWidth) {
          // Snap instantly back to the corresponding position in the first set
          trackRef.current.scrollTo({ left: trackRef.current.scrollLeft - (trackRef.current.scrollWidth / 2), behavior: 'auto' });
          
          // Then smoothly animate to the next card after a tiny delay to let the DOM settle
          setTimeout(() => {
            trackRef.current?.scrollBy({ left: cardWidth, behavior: 'smooth' });
          }, 50);
        } else {
          trackRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3000); // Auto slide every 3 seconds

    return () => clearInterval(interval);
  }, [reels]);

  const handleAddToCart = (product: ReelProduct, e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      countInStock: 99
    });
    setIsCartOpen(true);
  };

  if (loading) return null;
  if (reels.length === 0) return null; // Don't show the section if no products have videos

  return (
    <section className="reels-section">
      <div className="reels-decorative-border"></div>
      <div className="container">
        <h2 className="section-title reels-title">Trending Styles</h2>
      </div>
      <div className="reels-container" ref={trackRef}>
        <div className="reels-track">
          {/* Duplicate the array to allow for infinite scrolling effect */}
          {[...reels, ...reels].map((product, index) => (
            <div className="reel-card" key={`${product._id}-${index}`}>
              <Link href={`/product/${product._id}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="reel-video-container">

                  <video className="reel-video" src={`${product.video}?id=${index}`} poster={product.image} autoPlay loop muted playsInline style={{ pointerEvents: 'none' }} />
                  <div className="reel-product-info" style={{ zIndex: 10, position: 'absolute' }}>
                    <p className="reel-product-title">{product.name}</p>
                    {product.price > 0 && <p style={{ color: '#fff', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 'bold' }}>₹{product.price}</p>}
                  </div>
                </div>
              </Link>
              <button className="reel-add-cart-btn" onClick={(e) => handleAddToCart(product, e)}>Add To Cart</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
