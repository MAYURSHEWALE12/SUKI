"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  numReviews?: number;
  category?: string;
}

export default function BestSellersGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await fetch('/api/products?sort=rating', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch best sellers', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  return (
    <section className="best">
      <div className="best-head">
        <div>
          <h2>Best sellers</h2>
          <div className="rule"></div>
        </div>
        <Link href="/collections/best-sellers" className="view-all-btn">View all &rarr;</Link>
      </div>

      {loading ? (
        <div className="grid">
          {Array(4).fill(0).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      <style jsx>{`
        .best {
          max-width: 100%;
          margin: 0 auto;
          padding: 48px 16px 90px;
        }
        .best-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 34px;
        }
        .best-head h2 {
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 38px;
          color: var(--wine);
        }
        .best-head .rule {
          width: 64px;
          height: 3px;
          background: var(--rose);
          border-radius: 3px;
          margin-top: 10px;
        }
        .view-all-btn {
          background: var(--rose);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: .5px;
          padding: 13px 30px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: .2s;
        }
        .view-all-btn:hover {
          background: var(--rose-deep);
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
        .card.swatch-2 .card-media { background: linear-gradient(170deg,#F0A9C4 0%,#D4527E 50%,#8A0E3E 100%); }
        .card.swatch-3 .card-media { background: linear-gradient(170deg,#F3A6C4 0%,#E8618F 50%,#9E1049 100%); }
        .card.swatch-4 .card-media { background: linear-gradient(170deg,#EAD9BE 0%,#C9974B 50%,#8A6531 100%); }
        
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
          padding: 18px 18px 20px;
        }
        .card-body .cat {
          font-size: 11px;
          letter-spacing: 1px;
          color: var(--gold);
          font-weight: 600;
          margin-bottom: 6px;
        }
        .card-body h3 {
          font-family: var(--font-body);
          font-size: 20px;
          font-weight: 600;
          line-height: 1.22;
          margin-bottom: 10px;
          color: var(--wine);
        }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 8px;
        }
        .price-row .now {
          font-size: 17px;
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
          .best-head { flex-direction: column; align-items: flex-start; gap: 16px; }
          .best { padding: 32px 16px 60px; }
        }
      `}</style>
    </section>
  );
}
