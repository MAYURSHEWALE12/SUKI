"use client";
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

const CATEGORIES = [
  { slug: 'lehengas', name: 'Lehengas' },
  { slug: 'sarees', name: 'Sarees' },
  { slug: 'normal-sarees', name: 'Normal Sarees' },
  { slug: 'party-sarees', name: 'Party Sarees' },
  { slug: 'silk-sarees', name: 'Silk Sarees' },
  { slug: 'half-sarees', name: 'Half Sarees' },
  { slug: 'navratri-ghagra', name: 'Navratri Ghagra' },
  { slug: 'celeb-styles', name: 'Celeb & Influencer Edit' },
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

  const currentCategoryObj = CATEGORIES.find(c => c.slug === category);
  const displayCategory = currentCategoryObj ? currentCategoryObj.name : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  // URL slugs (normal-sarees, navratri-ghagra, ...) differ from the category
  // names stored on products (Normal Sarees, ...); always query by the real name.
  const queryCategory = currentCategoryObj ? currentCategoryObj.name : category;

  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    price: true,
    category: true,
    celebrity: true,
    occasion: true,
    fabric: true,
  });

  const toggleFilter = (section: string) => {
    setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
        let url = `/api/products?category=${encodeURIComponent(queryCategory)}`;

        if (priceFilter === 'under_5k') {
          url += '&maxPrice=5000';
        } else if (priceFilter === '5k_10k') {
          url += '&minPrice=5000&maxPrice=10000';
        } else if (priceFilter === '10k_25k') {
          url += '&minPrice=10000&maxPrice=25000';
        } else if (priceFilter === 'over_25k') {
          url += '&minPrice=25000';
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
  }, [queryCategory, priceFilter, ratingFilter, sort]);

  useEffect(() => {
    const timeout = setTimeout(() => setMobileFiltersOpen(false), 0);
    return () => clearTimeout(timeout);
  }, [category]);

  const renderFilterGroup = (
    id: string,
    title: string,
    options: { value: string; label: string }[],
    selectedValue: string,
    onChange: (val: string) => void,
    type: 'radio' | 'checkbox' = 'radio'
  ) => {
    const isOpen = expandedFilters[id];
    return (
      <div className="filter-group">
        <div className="filter-group-header" onClick={() => toggleFilter(id)}>
          <h4>{title}</h4>
          <svg className={`filter-group-icon ${isOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div className="filter-group-content" style={{ maxHeight: isOpen ? '500px' : '0', opacity: isOpen ? 1 : 0, marginTop: isOpen ? '0.5rem' : '0' }}>
          {options.map((opt) => (
            <label key={opt.value} className={selectedValue === opt.value ? 'active' : ''}>
              <input 
                type={type} 
                name={id} 
                checked={selectedValue === opt.value} 
                onChange={() => onChange(opt.value)} 
              /> 
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="filter-block">
      <div className="filter-header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>Clear all</button>
        )}
      </div>

      {renderFilterGroup('price', 'Price', [
        { value: '', label: 'All Prices' },
        { value: 'under_5k', label: 'Under ₹5,000' },
        { value: '5k_10k', label: '₹5,000 – ₹10,000' },
        { value: '10k_25k', label: '₹10,000 – ₹25,000' },
        { value: 'over_25k', label: 'Above ₹25,000' }
      ], priceFilter, setPriceFilter)}

      {renderFilterGroup('category', 'Category', [
        { value: 'lehengas', label: 'Lehengas' },
        { value: 'sarees', label: 'Sarees' },
        { value: 'half-sarees', label: 'Half Sarees' },
        { value: 'navratri-ghagra', label: 'Navratri Ghagra' }
      ], '', () => {}, 'checkbox')}

      {renderFilterGroup('celebrity', 'Celebrity', [
        { value: 'deepika', label: 'Deepika Inspired' },
        { value: 'alia', label: 'Alia Inspired' },
        { value: 'kiara', label: 'Kiara Inspired' },
        { value: 'kriti', label: 'Kriti Inspired' },
        { value: 'mrunal', label: 'Mrunal Inspired' }
      ], '', () => {}, 'checkbox')}

      {renderFilterGroup('occasion', 'Occasion', [
        { value: 'wedding', label: 'Wedding' },
        { value: 'reception', label: 'Reception' },
        { value: 'haldi', label: 'Haldi' },
        { value: 'mehendi', label: 'Mehendi' },
        { value: 'festive', label: 'Festive' },
        { value: 'party', label: 'Party Wear' }
      ], '', () => {}, 'checkbox')}

      {renderFilterGroup('fabric', 'Fabric', [
        { value: 'silk', label: 'Silk' },
        { value: 'organza', label: 'Organza' },
        { value: 'georgette', label: 'Georgette' },
        { value: 'velvet', label: 'Velvet' },
        { value: 'net', label: 'Net' }
      ], '', () => {}, 'checkbox')}
    </div>
  );

  return (
    <div className="category-page">
      {category === 'celeb-styles' ? (
        <div className="celeb-banner">
          <div className="celeb-banner-content">
            <h1 className="celeb-banner-title">Celeb & Influencer Edit</h1>
            <div className="celeb-banner-divider"></div>
            <p className="celeb-banner-subtitle">Iconic looks spotted on your favorite stars</p>
          </div>
        </div>
      ) : category === 'sarees' ? (
        <section className="banner-section" style={{ width: '100%' }}>
          <Image 
            src="/images/sarees_banner.png" 
            alt="Sarees Banner" 
            width={1774}
            height={887}
            sizes="100vw"
            style={{ width: '100%', display: 'block', height: 'auto' }} 
          />
        </section>
      ) : category === 'lehengas' ? (
        <section className="banner-section" style={{ width: '100%' }}>
          <Image 
            src="/images/banner.png" 
            alt="Lehengas Banner" 
            width={1717}
            height={677}
            sizes="100vw"
            style={{ width: '100%', display: 'block', height: 'auto' }} 
          />
        </section>
      ) : (
        <div className="category-header">
          <h1 className="category-title">Shop {displayCategory}</h1>
          <p className="category-subtitle">Explore our exclusive collection of premium {displayCategory}</p>
        </div>
      )}
      <div className="category-container">
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
            <div className="product-grid">
              {Array(12).fill(0).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              <h3>No matching celebrity looks found</h3>
              <p>Try changing your filters or explore our latest designer collections.</p>
              <div className="empty-actions">
                <Link href="/collections/new-arrivals" className="btn-primary">Continue Shopping</Link>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn-outline">Clear Filters</button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
