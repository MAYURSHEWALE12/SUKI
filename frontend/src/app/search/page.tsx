"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

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

const PRICE_PRESETS = [
  { id: '', label: 'Any price' },
  { id: 'under-5000', label: 'Under ₹5,000' },
  { id: '5000-10000', label: '₹5,000 – ₹10,000' },
  { id: 'over-10000', label: 'Over ₹10,000' },
];

function priceBounds(presetId: string): { minPrice?: number; maxPrice?: number } {
  if (presetId === 'under-5000') return { maxPrice: 5000 };
  if (presetId === '5000-10000') return { minPrice: 5000, maxPrice: 10000 };
  if (presetId === 'over-10000') return { minPrice: 10000 };
  return {};
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recommended');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [pricePreset, setPricePreset] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/products?limit=100');
        if (res.ok) {
          const data = await res.json();
          const unique = [...new Set(data.map((p: Product) => p.category))].filter((c): c is string => Boolean(c)).sort();
          setCategories(unique);
        }
      } catch {
        // categories are optional UI; absence must not break the page
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('keyword', query);
        if (category) params.set('category', category);
        const { minPrice, maxPrice } = priceBounds(pricePreset);
        if (minPrice) params.set('minPrice', String(minPrice));
        if (maxPrice) params.set('maxPrice', String(maxPrice));
        if (inStockOnly) params.set('inStock', 'true');
        if (sort !== 'recommended') params.set('sort', sort);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch search results', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, sort, category, pricePreset, inStockOnly]);

  const hasActiveFilters = Boolean(category || pricePreset || inStockOnly);

  const clearFilters = () => {
    setCategory('');
    setPricePreset('');
    setInStockOnly(false);
  };

  return (
    <div className="category-page">
      <div className="category-header">
        <h1 className="category-title">Search Results</h1>
        <p className="category-subtitle">
          {query ? `Showing results for "${query}"` : 'Enter a search term to find products'}
        </p>
      </div>

      <div className="category-container container" style={{ display: 'block' }}>
        <main className="category-main">
          {query && (
            <>
              <div className="search-filters">
                <div className="search-filters-row">
                  <span className="search-filters-label">Category</span>
                  <div className="filter-chips">
                    <button
                      className={`filter-chip ${category === '' ? 'active' : ''}`}
                      onClick={() => setCategory('')}
                    >
                      All
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c}
                        className={`filter-chip ${category === c ? 'active' : ''}`}
                        onClick={() => setCategory(category === c ? '' : c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="search-filters-row">
                  <span className="search-filters-label">Price</span>
                  <div className="filter-chips">
                    {PRICE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        className={`filter-chip ${pricePreset === preset.id ? 'active' : ''}`}
                        onClick={() => setPricePreset(preset.id)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="search-filters-row">
                  <span className="search-filters-label">Availability</span>
                  <button
                    className={`filter-chip ${inStockOnly ? 'active' : ''}`}
                    onClick={() => setInStockOnly(!inStockOnly)}
                  >
                    In stock only
                  </button>
                  {hasActiveFilters && (
                    <button className="filter-chip clear" onClick={clearFilters}>
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>

              <div className="category-toolbar">
                <div className="toolbar-left">
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
            </>
          )}

          {loading ? (
            <div className="product-grid">
              {Array(12).fill(0).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : !query ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <h3>Start searching</h3>
              <p>Type a keyword in the header above to find products.</p>
            </div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <h3>No products found</h3>
              <p>We couldn&apos;t find anything matching &quot;{query}&quot;{hasActiveFilters ? ' with the current filters' : ''}. Try checking your spelling, removing filters, or using more general terms.</p>
              <div className="empty-suggestions">
                {hasActiveFilters && (
                  <button className="btn btn-outline" onClick={clearFilters}>Clear all filters</button>
                )}
                <Link href="/collections/lehengas" className="btn btn-outline">Shop Lehengas</Link>
                <Link href="/collections/sarees" className="btn btn-outline">Shop Sarees</Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="loading-state"><div className="spinner" /></div>}>
      <SearchContent />
    </Suspense>
  );
}