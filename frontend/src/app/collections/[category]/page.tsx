"use client";
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import './category.css';

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

const CATEGORIES = [
  { slug: 'lehengas', name: 'Lehengas' },
  { slug: 'sarees', name: 'Sarees' },
  { slug: 'suits', name: 'Suits' },
  { slug: 'dresses', name: 'Dresses' },
];

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceFilter, setPriceFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sort, setSort] = useState('recommended');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);

  const clearFilters = () => {
    setPriceFilter('');
    setRatingFilter('');
    setSort('recommended');
  };

  const hasActiveFilters = priceFilter !== '' || ratingFilter !== '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `/api/products?category=${category}`;

        if (priceFilter === 'under_5k') {
          url += '&maxPrice=5000';
        } else if (priceFilter === '5k_10k') {
          url += '&minPrice=5000&maxPrice=10000';
        } else if (priceFilter === 'over_10k') {
          url += '&minPrice=10000';
        }

        if (ratingFilter === '4') {
          url += '&minRating=4';
        } else if (ratingFilter === '3') {
          url += '&minRating=3';
        }

        if (sort === 'price_asc') {
          url += '&sort=price_asc';
        } else if (sort === 'price_desc') {
          url += '&sort=price_desc';
        } else if (sort === 'newest') {
          url += '&sort=newest';
        } else if (sort === 'rating') {
          url += '&sort=rating';
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, priceFilter, ratingFilter, sort]);

  useEffect(() => {
    setMobileFiltersOpen(false);
  }, [category]);

  const sidebarContent = (
    <div className="filter-block">
      <div className="filter-header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>Clear all</button>
        )}
      </div>

      <div className="filter-group">
        <h4>Price</h4>
        <label className={priceFilter === '' ? 'active' : ''}>
          <input type="radio" name="price" checked={priceFilter === ''} onChange={() => setPriceFilter('')} /> All Prices
        </label>
        <label className={priceFilter === 'under_5k' ? 'active' : ''}>
          <input type="radio" name="price" checked={priceFilter === 'under_5k'} onChange={() => setPriceFilter('under_5k')} /> Under ₹5,000
        </label>
        <label className={priceFilter === '5k_10k' ? 'active' : ''}>
          <input type="radio" name="price" checked={priceFilter === '5k_10k'} onChange={() => setPriceFilter('5k_10k')} /> ₹5,000 – ₹10,000
        </label>
        <label className={priceFilter === 'over_10k' ? 'active' : ''}>
          <input type="radio" name="price" checked={priceFilter === 'over_10k'} onChange={() => setPriceFilter('over_10k')} /> Over ₹10,000
        </label>
      </div>

      <div className="filter-group">
        <h4>Rating</h4>
        <label className={ratingFilter === '' ? 'active' : ''}>
          <input type="radio" name="rating" checked={ratingFilter === ''} onChange={() => setRatingFilter('')} /> Any Rating
        </label>
        <label className={ratingFilter === '4' ? 'active' : ''}>
          <input type="radio" name="rating" checked={ratingFilter === '4'} onChange={() => setRatingFilter('4')} /> 4★ & above
        </label>
        <label className={ratingFilter === '3' ? 'active' : ''}>
          <input type="radio" name="rating" checked={ratingFilter === '3'} onChange={() => setRatingFilter('3')} /> 3★ & above
        </label>
      </div>
    </div>
  );

  return (
    <div className="category-page">
      <div className="category-header">
        <h1 className="category-title">Shop {displayCategory}</h1>
        <p className="category-subtitle">Explore our exclusive collection of premium {category}</p>
      </div>
      
      <div className="category-container container">
        {/* Sidebar Filters (desktop) */}
        <aside className="category-sidebar">
          {sidebarContent}
        </aside>

        {/* Mobile filter backdrop */}
        {mobileFiltersOpen && (
          <div className="mobile-filter-backdrop" onClick={() => setMobileFiltersOpen(false)} />
        )}

        {/* Sidebar Filters (mobile drawer) */}
        <aside className={`category-sidebar-mobile ${mobileFiltersOpen ? 'open' : ''}`}>
          <div className="mobile-filter-header">
            <h3>Filters</h3>
            <button className="mobile-filter-close" onClick={() => setMobileFiltersOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          {sidebarContent}
          <button className="btn btn-primary mobile-filter-done" onClick={() => setMobileFiltersOpen(false)}>Done</button>
        </aside>

        {/* Product Grid */}
        <main className="category-main">
          <div className="category-toolbar">
            <div className="toolbar-left">
              <button className="mobile-filter-toggle" onClick={() => setMobileFiltersOpen(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="8" y1="12" x2="20" y2="12"></line><line x1="12" y1="18" x2="20" y2="18"></line></svg>
                Filters
                {hasActiveFilters && <span className="filter-badge" />}
              </button>
              <span className="results-count">{products.length} result{products.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="custom-dropdown" tabIndex={0} onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsSortOpen(false);
            }}>
              <div className={`custom-dropdown-header ${isSortOpen ? 'open' : ''}`} onClick={() => setIsSortOpen(!isSortOpen)}>
                <span>
                  {sort === 'recommended' && 'Sort: Recommended'}
                  {sort === 'price_asc' && 'Price: Low to High'}
                  {sort === 'price_desc' && 'Price: High to Low'}
                  {sort === 'newest' && 'Newest Arrivals'}
                  {sort === 'rating' && 'Highest Rated'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`dropdown-arrow ${isSortOpen ? 'open' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              {isSortOpen && (
                <div className="custom-dropdown-menu">
                  <div className={`custom-dropdown-item ${sort === 'recommended' ? 'active' : ''}`} onClick={() => { setSort('recommended'); setIsSortOpen(false); }}>Sort: Recommended</div>
                  <div className={`custom-dropdown-item ${sort === 'price_asc' ? 'active' : ''}`} onClick={() => { setSort('price_asc'); setIsSortOpen(false); }}>Price: Low to High</div>
                  <div className={`custom-dropdown-item ${sort === 'price_desc' ? 'active' : ''}`} onClick={() => { setSort('price_desc'); setIsSortOpen(false); }}>Price: High to Low</div>
                  <div className={`custom-dropdown-item ${sort === 'newest' ? 'active' : ''}`} onClick={() => { setSort('newest'); setIsSortOpen(false); }}>Newest Arrivals</div>
                  <div className={`custom-dropdown-item ${sort === 'rating' ? 'active' : ''}`} onClick={() => { setSort('rating'); setIsSortOpen(false); }}>Highest Rated</div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-state"><div className="spinner" /><p>Loading products...</p></div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <h3>No products found</h3>
              <p>Try adjusting your filters or exploring another category.</p>
              <div className="empty-suggestions">
                {CATEGORIES.filter(c => c.slug !== category).map(c => (
                  <Link key={c.slug} href={`/collections/${c.slug}`} className="btn btn-outline">{c.name}</Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
