"use client";
import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

interface ViewedProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  numReviews?: number;
  rating?: number;
}

export default function RecentlyViewed() {
  const [products, setProducts] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    const fetchValidProducts = async () => {
      try {
        const stored: ViewedProduct[] = JSON.parse(localStorage.getItem('suki_recently_viewed') || '[]');
        if (!stored.length) return;
        
        // Take up to 10 to ensure we have enough after filtering, but only display 4
        const candidates = stored.slice(0, 10);
        
        const results = await Promise.all(
          candidates.map(async (p) => {
            try {
              const res = await fetch(`/api/products/${p._id}`);
              return res.ok ? p : null;
            } catch {
              return null;
            }
          })
        );
        
        const valid = results.filter((r): r is ViewedProduct => r !== null);
        
        // Clean up localStorage to remove deleted items
        if (valid.length !== candidates.length) {
          const validIds = valid.map((v) => v._id);
          const newStored = stored.filter((s) => 
            validIds.includes(s._id) || !candidates.find((c) => c._id === s._id)
          );
          localStorage.setItem('suki_recently_viewed', JSON.stringify(newStored));
        }

        setProducts(valid.slice(0, 4));
      } catch (e) {
        console.error('Failed to parse recently viewed', e);
      }
    };

    fetchValidProducts();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="continue">
      <div className="continue-head">
        <h2 className="serif">Continue shopping</h2>
      </div>
      <p className="subtitle">Products you&apos;ve recently viewed</p>

        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

      <style jsx>{`
        .continue {
          max-width: 100%;
          margin: 0 auto;
          padding: 16px 16px 0px;
        }
        .continue-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 8px;
        }
        .continue-head h2 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 38px;
          color: var(--wine);
          margin-bottom: 0;
        }
        .view-all {
          font-size: 13px;
          font-weight: 500;
          color: var(--rose);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .view-all:hover {
          text-decoration: underline;
        }
        .subtitle {
          font-size: 14px;
          color: #B78098;
          margin: 8px 0 30px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .card {
          background: var(--blush-2);
          border: 1px solid var(--line);
          border-radius: 6px 6px 14px 14px;
          overflow: hidden;
          position: relative;
          transition: transform .25s, box-shadow .25s;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 30px -18px rgba(158,16,73,.35);
        }
        .card-media {
          height: 320px;
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          overflow: hidden;
        }
        .card.swatch-1 .card-media { background: linear-gradient(170deg,#EC7EA8 0%,#C6185C 50%,#7A1240 100%); }
        .card.swatch-2 .card-media { background: linear-gradient(170deg,#EAD9BE 0%,#C9974B 50%,#8A6531 100%); }
        .card.swatch-3 .card-media { background: linear-gradient(170deg,#EC7EA8 0%,#C6185C 50%,#7A1240 100%); }
        .card.swatch-4 .card-media { background: linear-gradient(170deg,#FBE4EC 0%,#F0A9C4 50%,#D4527E 100%); }
        
        .card-media::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,.35) 1px, transparent 1.4px);
          background-size: 16px 16px;
          opacity: .55;
          pointer-events: none;
        }
        .silhouette {
          width: 54%;
          height: 80%;
          background: rgba(255,255,255,.16);
          border-radius: 50% 50% 18% 18% / 62% 62% 14% 14%;
          margin-bottom: -4px;
        }
        .wishlist-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,.92);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
          border: none;
        }
        .wishlist-btn svg {
          width: 15px;
          height: 15px;
          color: var(--rose);
        }
        .card-body {
          padding: 16px 18px 20px;
        }
        .card-body h3 {
          font-size: 15px;
          font-weight: 500;
          color: var(--wine);
          margin-bottom: 8px;
          font-family: var(--font-body);
        }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 9px;
          margin-bottom: 8px;
        }
        .price-row .now {
          font-size: 16px;
          font-weight: 600;
          color: var(--rose);
        }
        .price-row .was {
          font-size: 13px;
          color: #C9A0B2;
          text-decoration: line-through;
        }
        .stars {
          font-size: 12px;
          color: var(--gold);
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .stars .count {
          color: #B78098;
        }

        @media (max-width: 1100px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .continue-head { flex-direction: column; align-items: flex-start; gap: 10px; }
          .continue { padding: 32px 24px 60px; }
        }
      `}</style>
    </section>
  );
}
