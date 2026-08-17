"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import PromoStrip from './PromoStrip';
import LoginModal from './LoginModal';

interface SearchSuggestion {
  _id: string;
  name: string;
}

export default function Header() {
  const pathname = usePathname();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    typeof window !== 'undefined' ? !!localStorage.getItem('suki_token') : false
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { cartTotalQuantity, setIsCartOpen } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    // Global listener to open login modal
    const handleOpenLogin = () => setIsLoginModalOpen(true);
    window.addEventListener('openLoginModal', handleOpenLogin);
    return () => window.removeEventListener('openLoginModal', handleOpenLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('suki_token');
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    window.location.reload();
  };
  
  // Search bar typing effect
  const searchTerms = ['lehengas...', 'sarees...', 'half sarees...', 'navratri ghagra...'];
  const [placeholder, setPlaceholder] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [termIndex, setTermIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentTerm = searchTerms[termIndex];
    let typingSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && placeholder === currentTerm) {
      typingSpeed = 2000; // Pause when word is fully typed
      const timeout = setTimeout(() => setIsDeleting(true), typingSpeed);
      return () => clearTimeout(timeout);
    } else if (isDeleting && placeholder === '') {
      const timeout = setTimeout(() => {
        setIsDeleting(false);
        setTermIndex((prev) => (prev + 1) % searchTerms.length);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setPlaceholder((prev) => 
        isDeleting 
          ? currentTerm.substring(0, prev.length - 1)
          : currentTerm.substring(0, prev.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [placeholder, isDeleting, termIndex, searchTerms]);

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      (async () => {
        try {
          const res = await fetch(`/api/products?keyword=${encodeURIComponent(searchQuery.trim())}&inStock=true&limit=5`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const renderSuggestionsDropdown = () => {
    if (!searchQuery.trim()) return null;
    const lowerSearch = searchQuery.toLowerCase();
    
    return (
      <div className="search-suggestions-dropdown" style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        border: '1px solid var(--line)',
        borderRadius: '8px',
        padding: '20px 0',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        zIndex: 50,
        textAlign: 'left'
      }}>
        <div style={{ padding: '0 20px', marginBottom: '15px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '1px', color: '#999', textTransform: 'uppercase', marginBottom: '15px' }}>Popular Suggestions</div>
          {isSearching ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#666', padding: '10px 0' }}>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {suggestions.map((product) => {
                const regex = new RegExp(`(${searchQuery})`, 'gi');
                const parts = product.name.split(regex);
                
                return (
                  <li key={product._id} style={{ marginBottom: '16px' }}>
                    <Link href={`/product/${product._id}`} onClick={() => { setSearchQuery(''); setIsMobileSearchOpen(false); }} style={{ textDecoration: 'none', color: '#333', fontSize: '15px', display: 'block' }}>
                      {parts.map((part: string, i: number) => 
                        part.toLowerCase() === lowerSearch
                          ? <span key={i} style={{ color: '#666' }}>{part}</span> 
                          : <strong key={i} style={{ fontWeight: 600 }}>{part}</strong>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div style={{ fontSize: '14px', color: '#666', padding: '10px 0' }}>No products found</div>
          )}
        </div>
        
        <div style={{ padding: '15px 20px 0', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: '11px', letterSpacing: '1px', color: '#999', textTransform: 'uppercase', marginBottom: '15px' }}>Categories</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li><Link href="/collections/lehengas" onClick={() => { setSearchQuery(''); setIsMobileSearchOpen(false); }} style={{ textDecoration: 'none', color: '#333', fontSize: '15px' }}>Lehengas</Link></li>
            <li><Link href="/collections/sarees" onClick={() => { setSearchQuery(''); setIsMobileSearchOpen(false); }} style={{ textDecoration: 'none', color: '#333', fontSize: '15px' }}>Sarees</Link></li>
            <li><Link href="/collections/half-sarees" onClick={() => { setSearchQuery(''); setIsMobileSearchOpen(false); }} style={{ textDecoration: 'none', color: '#333', fontSize: '15px' }}>Half Sarees</Link></li>
            <li><Link href="/collections/navratri-ghagra" onClick={() => { setSearchQuery(''); setIsMobileSearchOpen(false); }} style={{ textDecoration: 'none', color: '#333', fontSize: '15px' }}>Navratri Ghagra</Link></li>
          </ul>
        </div>
      </div>
    );
  };

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <PromoStrip />
      <header className="site-header">
        <div className="header-main container">
          <div className="header-left">
            <button className="mobile-menu-btn desktop-hide" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
              {isMobileMenuOpen ? (
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              ) : (
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              )}
            </button>
            <form className="search-box mobile-hide" style={{ position: 'relative' }} onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                placeholder={`Search ${placeholder}`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'inherit' }}
              />
              {renderSuggestionsDropdown()}
            </form>
          </div>

          <div className="logo">
            <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
              <span className="brand" style={{ fontFamily: 'var(--font-logo)', fontSize: '42px', lineHeight: '1', color: '#C2185B', textTransform: 'lowercase', fontWeight: 400, letterSpacing: '2px' }}>suki</span>
              <span className="sub" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '10px', color: '#C2185B', textTransform: 'uppercase', marginTop: '4px', fontWeight: 400, marginLeft: '10px' }}>Ethnic</span>
            </Link>
          </div>

          <div className="icon-row">
            <button onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className="desktop-hide" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', alignItems: 'center' }}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>

            <Link href="/whatsapp" className="mobile-hide">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </Link>
            {isLoggedIn ? (
              <div style={{ position: 'relative' }} ref={dropdownRef} className="mobile-hide">
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </button>
                {isDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: 'white', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 0', minWidth: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
                    <div style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--wine)' }} onClick={() => setIsDropdownOpen(false)}><Link href="/account" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>Profile</Link></div>
                    <div style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--wine)' }} onClick={() => setIsDropdownOpen(false)}>My Orders</div>
                    <div style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--rose)', borderTop: '1px solid var(--line)', marginTop: '4px', paddingTop: '12px' }} onClick={handleLogout}>Logout</div>
                  </div>
                )}
              </div>
            ) : (
              <button className="mobile-hide" onClick={() => setIsLoginModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            )}
            <Link href="/wishlist" className="mobile-hide">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path></svg>
            </Link>
            <button onClick={() => setIsCartOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative' }}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {cartTotalQuantity > 0 && (
                <span className="cart-count" style={{ position: 'absolute', top: '-6px', right: '-8px' }}>{cartTotalQuantity}</span>
              )}
            </button>
          </div>
        </div>

        {isMobileSearchOpen && (
          <div className="mobile-search-popdown" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            padding: '12px 20px',
            borderBottom: '1px solid var(--line)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                }
              }} style={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #C2185B',
                borderRadius: '50px',
                padding: '8px 16px',
                background: '#fff'
              }}>
                <input 
                  type="text" 
                  placeholder="Search" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    border: 'none', 
                    background: 'transparent', 
                    outline: 'none', 
                    width: '100%', 
                    color: '#333',
                    fontSize: '15px'
                  }}
                  autoFocus
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" style={{ marginLeft: '10px' }}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </form>
              <button onClick={() => setIsMobileSearchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {searchQuery.trim() && (
              <div style={{ width: '100%', position: 'relative' }}>
                {renderSuggestionsDropdown()}
              </div>
            )}
          </div>
        )}
        <nav className="primary-nav container desktop-only">
        <ul>
          <li className="nav-item"><Link href="/collections/new-arrivals">New Arrivals</Link></li>
          <li className="nav-item"><Link href="/collections/lehengas">Lehengas</Link></li>
          
          <li className="nav-item has-dropdown">
            <Link href="/collections/sarees">Sarees</Link>
            <div className="mega-menu">
              <div className="mega-menu-inner container">
                
                <div className="mega-featured">
                  <h4 className="mega-heading" style={{ color: 'var(--wine)' }}>Top Picks</h4>
                  <div className="mega-images-row">
                    <Link href="/collections/party-sarees" className="mega-image-item">
                      <div className="mega-image-circle" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1617261075727-46323497d51b?w=300&q=80)' }}></div>
                      <span className="mega-image-label">Party</span>
                    </Link>
                    <Link href="/collections/silk-sarees" className="mega-image-item">
                      <div className="mega-image-circle" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1583391733958-d15fa693d502?w=300&q=80)' }}></div>
                      <span className="mega-image-label">Silk</span>
                    </Link>
                  </div>
                </div>

                <div className="mega-links">
                  <div className="mega-column">
                    <h4 className="mega-heading" style={{ color: 'var(--wine)' }}>Shop By Category</h4>
                    <ul>
                      <li><Link href="/collections/normal-sarees">Normal Sarees</Link></li>
                      <li><Link href="/collections/party-sarees">Party Sarees</Link></li>
                      <li><Link href="/collections/silk-sarees">Silk Sarees</Link></li>
                    </ul>
                  </div>

                  {/* Empty column placeholder to keep layout balanced */}
                  <div></div>

                  <div className="mega-promo" style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1)), url(/images/sarees_banner.png)' }}>
                    <div className="mega-promo-content">
                      <h4>Wedding Ready</h4>
                      <Link href="/collections/sarees">Shop Sarees &rarr;</Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </li>

          <li className="nav-item"><Link href="/collections/half-sarees">Half Sarees</Link></li>
          <li className="nav-item"><Link href="/collections/navratri-ghagra">Navratri Ghagra</Link></li>
          <li className="nav-item"><Link href="/collections/best-sellers">Best Sellers</Link></li>
          <li className="nav-item"><Link href="/collections/under-999">Under ₹999</Link></li>
          <li className="nav-item"><Link href="/collections/celeb-styles">Celeb & Influencer Edit</Link></li>
          <li className="nav-item sale-item"><Link href="/collections/sale" style={{ color: '#C2185B', fontWeight: 600 }}>Sale</Link></li>
        </ul>
      </nav>
      
      {/* Premium Off-Canvas Mobile Menu */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
            <span className="brand" style={{ fontFamily: 'var(--font-logo)', fontSize: '42px', lineHeight: '1', color: '#C2185B', textTransform: 'lowercase', fontWeight: 400, letterSpacing: '2px' }}>suki</span>
            <span className="sub" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '10px', color: '#C2185B', textTransform: 'uppercase', marginTop: '4px', fontWeight: 400, marginLeft: '10px' }}>Ethnic</span>
          </Link>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="1" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="mobile-drawer-content">
          <ul className="mobile-nav-links">
            <li style={{ animationDelay: '0.05s' }}><Link href="/collections/new-arrivals" onClick={() => setIsMobileMenuOpen(false)}>New Arrivals</Link></li>
            <li style={{ animationDelay: '0.1s' }}><Link href="/collections/lehengas" onClick={() => setIsMobileMenuOpen(false)}>Lehengas</Link></li>
            
            <li className="accordion-item" style={{ animationDelay: '0.15s' }}>
              <div className="accordion-header" onClick={() => setExpandedMenu(expandedMenu === 'sarees' ? null : 'sarees')}>
                <span>Sarees</span>
                <span className="accordion-icon">{expandedMenu === 'sarees' ? '-' : '+'}</span>
              </div>
              <div className={`accordion-body ${expandedMenu === 'sarees' ? 'expanded' : ''}`}>
                <Link href="/collections/normal-sarees" onClick={() => setIsMobileMenuOpen(false)}>Normal Sarees</Link>
                <Link href="/collections/party-sarees" onClick={() => setIsMobileMenuOpen(false)}>Party Sarees</Link>
                <Link href="/collections/silk-sarees" onClick={() => setIsMobileMenuOpen(false)}>Silk Sarees</Link>
              </div>
            </li>

            <li style={{ animationDelay: '0.2s' }}><Link href="/collections/half-sarees" onClick={() => setIsMobileMenuOpen(false)}>Half Sarees</Link></li>
            <li style={{ animationDelay: '0.25s' }}><Link href="/collections/navratri-ghagra" onClick={() => setIsMobileMenuOpen(false)}>Navratri Ghagra</Link></li>
            <li style={{ animationDelay: '0.3s' }}><Link href="/collections/best-sellers" onClick={() => setIsMobileMenuOpen(false)}>Best Sellers</Link></li>
            <li style={{ animationDelay: '0.35s' }}><Link href="/collections/under-999" onClick={() => setIsMobileMenuOpen(false)}>Under ₹999</Link></li>
            <li style={{ animationDelay: '0.4s' }}><Link href="/collections/celeb-styles" onClick={() => setIsMobileMenuOpen(false)}>Celeb & Influencer Edit</Link></li>
            <li style={{ animationDelay: '0.45s' }}><Link href="/collections/sale" onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#C2185B', fontWeight: 600 }}>Sale</Link></li>
          </ul>
          
          <div className="mobile-drawer-bottom" style={{ animationDelay: '0.8s' }}>
            {isLoggedIn ? (
              <>
                <Link href="/account" className="drawer-btn primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>MY ACCOUNT</Link>
                <button className="drawer-btn text-only" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>LOGOUT</button>
              </>
            ) : (
              <button className="drawer-btn primary" onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}>LOGIN / REGISTER</button>
            )}
            <button className="drawer-btn text-only">Track Order</button>
          </div>
        </div>
      </div>
    </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
