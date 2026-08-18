"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { notFound } from 'next/navigation';
import '../../collections/[category]/category.css';
import '../occasions.css';

interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating?: number;
  numReviews?: number;
}

const OCCASIONS: Record<string, { title: string; subtitle: string; description: string; image: string }> = {
  diwali: {
    title: 'Diwali Edit',
    subtitle: 'Light up the festival',
    description: 'Shimmering silks and festive zari work for the most radiant season of the year.',
    image: '/images/sarees_banner.png',
  },
  wedding: {
    title: 'Wedding Edit',
    subtitle: 'Bridal & guest ready',
    description: 'From bridal trousseaus to guest looks — make every wedding moment unforgettable.',
    image: '/images/banner.png',
  },
  party: {
    title: 'Party Edit',
    subtitle: 'Own the celebration',
    description: 'Statement lehengas and glamorous dresses for nights worth remembering.',
    image: '/images/banner.png',
  },
  'daily-wear': {
    title: 'Daily Wear Edit',
    subtitle: 'Effortless elegance',
    description: 'Comfortable, chic and easy — beautiful ethnic wear for your everyday moments.',
    image: '/images/sarees_banner.png',
  },
};

const OCCASION_VALUE: Record<string, string> = {
  diwali: 'Diwali',
  wedding: 'Wedding',
  party: 'Party',
  'daily-wear': 'Daily Wear',
};

export default function OccasionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const occasion = OCCASIONS[slug];
  const occasionValue = OCCASION_VALUE[slug];

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!occasionValue) return;
    let cancelled = false;
    fetch(`/api/products?occasion=${encodeURIComponent(occasionValue)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((data: Product[]) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [occasionValue]);

  if (!occasion || !occasionValue) {
    notFound();
  }

  return (
    <div className="category-page">
      <section className="banner-section" style={{ width: '100%' }}>
        <Image
          src={occasion.image}
          alt={occasion.title}
          width={1774}
          height={887}
          sizes="100vw"
          style={{ width: '100%', display: 'block', height: 'auto', maxHeight: '550px', objectFit: 'cover' }}
        />
      </section>

      <div className="occasions-page container">
        <div className="occasions-header">
          <span className="occasion-card-subtitle" style={{ display: 'block', marginBottom: '0.5rem' }}>{occasion.subtitle}</span>
          <h1 className="occasions-title">{occasion.title}</h1>
          <p className="occasions-subtitle">{occasion.description}</p>
        </div>

        <div className="product-grid">
          {loading
            ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
            : products.length === 0
              ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
                  No products in this edit yet — check back soon!
                </div>
              )
              : products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
        </div>

        <div style={{ textAlign: 'center', margin: '2rem 0 3rem' }}>
          <Link href="/shop" className="category-view-all">VIEW ALL PRODUCTS</Link>
        </div>
      </div>
    </div>
  );
}