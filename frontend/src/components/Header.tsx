"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import PromoStrip from './PromoStrip';
import LoginModal from './LoginModal';

export default function Header() {
  const pathname = usePathname();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  
  const { cartTotalQuantity } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

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
    // Check auth status
    const token = localStorage.getItem('suki_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('suki_token');
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    window.location.reload();
  };
  
  // Search bar typing effect
  const searchTerms = ['sarees...', 'lehengas...', 'party wear...'];
  const [placeholder, setPlaceholder] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
      setIsDeleting(false);
      setTermIndex((prev) => (prev + 1) % searchTerms.length);
      return;
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

  return (
    <>
      <PromoStrip />
      <header className="site-header">
      <div className="header-main container">
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
          {isMobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>
        <form className="search-bar" onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
          }
        }}>
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder={`Search ${placeholder}`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <div className="logo">
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', lineHeight: '1', color: 'var(--color-primary)', textTransform: 'lowercase' }}>suki</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '6px', color: 'var(--color-text-primary)', textTransform: 'uppercase', marginLeft: '6px' }}>Ethnic</span>
          </Link>
        </div>
        <div className="header-actions">
          <Link href="/whatsapp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </Link>
          {isLoggedIn ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
              {isDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 0', minWidth: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
                  <div style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--color-text-primary)' }} onClick={() => setIsDropdownOpen(false)}><Link href="/account" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>Profile</Link></div>
                  <div style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--color-text-primary)' }} onClick={() => setIsDropdownOpen(false)}>My Orders</div>
                  <div style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--color-primary)', borderTop: '1px solid var(--color-border)', marginTop: '4px', paddingTop: '12px' }} onClick={handleLogout}>Logout</div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </button>
          )}
          <Link href="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            {cartTotalQuantity > 0 && (
              <span className="cart-count" style={{ position: 'absolute', top: '-6px', right: '-8px' }}>{cartTotalQuantity}</span>
            )}
          </Link>
        </div>
      </div>
      <nav className="primary-nav container desktop-only">
        <ul>
          <li className="nav-item"><Link href="/new-arrivals" onClick={() => setIsMobileMenuOpen(false)}>New Arrivals</Link></li>
          
          <li className="nav-item has-dropdown">
            <Link href="/collections/lehengas">Lehengas</Link>
            <div className="mega-menu">
              <div className="mega-menu-inner container">
                <div className="mega-featured">
                  <h4 className="mega-heading">Trending Now</h4>
                  <div className="mega-images-row">
                    <Link href="/collections/lehengas" className="mega-image-item">
                      <div className="mega-image-circle" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80)' }}></div>
                      <span className="mega-image-label">Bridal</span>
                    </Link>
                    <Link href="/collections/lehengas" className="mega-image-item">
                      <div className="mega-image-circle" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1583391733958-d15fa693d502?w=300&q=80)' }}></div>
                      <span className="mega-image-label">Party Wear</span>
                    </Link>
                    <Link href="/collections/lehengas" className="mega-image-item">
                      <div className="mega-image-circle" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&q=80)' }}></div>
                      <span className="mega-image-label">Pastel</span>
                    </Link>
                  </div>
                </div>
                <div className="mega-links">
                  <div className="mega-column">
                    <h4 className="mega-heading">Shop By Occasion</h4>
                    <ul>
                      <li><Link href="#">Bridal Lehengas</Link></li>
                      <li><Link href="#">Bridesmaid</Link></li>
                      <li><Link href="#">Haldi & Mehendi</Link></li>
                      <li><Link href="#">Party Wear</Link></li>
                      <li><Link href="#">Reception</Link></li>
                    </ul>
                  </div>
                  <div className="mega-column">
                    <h4 className="mega-heading">Shop By Fabric</h4>
                    <ul>
                      <li><Link href="#">Velvet Lehengas</Link></li>
                      <li><Link href="#">Printed Lehengas</Link></li>
                      <li><Link href="#">Georgette</Link></li>
                      <li><Link href="#">Silk Lehengas</Link></li>
                      <li><Link href="#">Net Lehengas</Link></li>
                    </ul>
                  </div>
                  <div className="mega-promo" style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1)), url(https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80)' }}>
                    <div className="mega-promo-content">
                      <h4>New Arrivals</h4>
                      <Link href="/new-arrivals">Explore Collection &rarr;</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>

          <li className="nav-item has-dropdown">
            <Link href="/collections/sarees">Sarees</Link>
            <div className="mega-menu">
              <div className="mega-menu-inner container">
                <div className="mega-featured">
                  <h4 className="mega-heading">Top Picks</h4>
                  <div className="mega-images-row">
                    <Link href="/collections/sarees" className="mega-image-item">
                      <div className="mega-image-circle" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&q=80)' }}></div>
                      <span className="mega-image-label">Sequin</span>
                    </Link>
                    <Link href="/collections/sarees" className="mega-image-item">
                      <div className="mega-image-circle" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1617261075727-46323497d51b?w=300&q=80)' }}></div>
                      <span className="mega-image-label">Silk</span>
                    </Link>
                    <Link href="/collections/sarees" className="mega-image-item">
                      <div className="mega-image-circle" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1583391733958-d15fa693d502?w=300&q=80)' }}></div>
                      <span className="mega-image-label">Banarasi</span>
                    </Link>
                  </div>
                </div>
                <div className="mega-links">
                  <div className="mega-column">
                    <h4 className="mega-heading">Shop By Fabric</h4>
                    <ul>
                      <li><Link href="#">Silk Sarees</Link></li>
                      <li><Link href="#">Cotton Sarees</Link></li>
                      <li><Link href="#">Banarasi</Link></li>
                      <li><Link href="#">Kanjeevaram</Link></li>
                      <li><Link href="#">Georgette</Link></li>
                    </ul>
                  </div>
                  <div className="mega-column">
                    <h4 className="mega-heading">Shop By Work</h4>
                    <ul>
                      <li><Link href="#">Embroidered</Link></li>
                      <li><Link href="#">Printed</Link></li>
                      <li><Link href="#">Zari Work</Link></li>
                      <li><Link href="#">Stone Work</Link></li>
                      <li><Link href="#">Handloom</Link></li>
                    </ul>
                  </div>
                  <div className="mega-promo" style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1)), url(https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80)' }}>
                    <div className="mega-promo-content">
                      <h4>Wedding Ready</h4>
                      <Link href="/sarees">Shop Sarees &rarr;</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>

          <li className="nav-item"><Link href="/best-sellers">Best Sellers</Link></li>
          <li className="nav-item"><Link href="/under-999">Under ₹999</Link></li>
          <li className="nav-item"><Link href="/sale" className="sale-link">Sale</Link></li>
        </ul>
      </nav>
      
      {/* Premium Off-Canvas Mobile Menu */}
      <div className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: '1', color: 'var(--color-primary)', textTransform: 'lowercase' }}>suki</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.5rem', letterSpacing: '4px', color: 'var(--color-text-primary)', textTransform: 'uppercase', marginLeft: '4px' }}>Ethnic</span>
          </Link>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="1" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="mobile-drawer-content">
          <ul className="mobile-nav-links">
            <li style={{ animationDelay: '0.1s' }}><Link href="/best-sellers" onClick={() => setIsMobileMenuOpen(false)}>Best Sellers</Link></li>
            
            <li className="accordion-item" style={{ animationDelay: '0.2s' }}>
              <div className="accordion-header" onClick={() => setExpandedMenu(expandedMenu === 'lehengas' ? null : 'lehengas')}>
                <span>Lehengas</span>
                <span className="accordion-icon">{expandedMenu === 'lehengas' ? '-' : '+'}</span>
              </div>
              <div className={`accordion-body ${expandedMenu === 'lehengas' ? 'expanded' : ''}`}>
                <Link href="/collections/lehengas" onClick={() => setIsMobileMenuOpen(false)}>Bridal Lehengas</Link>
                <Link href="/collections/lehengas" onClick={() => setIsMobileMenuOpen(false)}>Party Wear</Link>
                <Link href="/collections/lehengas" onClick={() => setIsMobileMenuOpen(false)}>Pastel Collection</Link>
              </div>
            </li>

            <li className="accordion-item" style={{ animationDelay: '0.3s' }}>
              <div className="accordion-header" onClick={() => setExpandedMenu(expandedMenu === 'sarees' ? null : 'sarees')}>
                <span>Sarees</span>
                <span className="accordion-icon">{expandedMenu === 'sarees' ? '-' : '+'}</span>
              </div>
              <div className={`accordion-body ${expandedMenu === 'sarees' ? 'expanded' : ''}`}>
                <Link href="/collections/sarees" onClick={() => setIsMobileMenuOpen(false)}>Silk Sarees</Link>
                <Link href="/collections/sarees" onClick={() => setIsMobileMenuOpen(false)}>Banarasi</Link>
                <Link href="/collections/sarees" onClick={() => setIsMobileMenuOpen(false)}>Sequin</Link>
              </div>
            </li>

            <li style={{ animationDelay: '0.5s' }}><Link href="/new-arrivals" onClick={() => setIsMobileMenuOpen(false)}>New Arrivals</Link></li>
            <li style={{ animationDelay: '0.6s' }}><Link href="/under-999" onClick={() => setIsMobileMenuOpen(false)}>Under ₹ 999</Link></li>
            <li style={{ animationDelay: '0.7s' }}><Link href="/sale" onClick={() => setIsMobileMenuOpen(false)}>Sale</Link></li>
          </ul>
          
          <div className="mobile-drawer-bottom" style={{ animationDelay: '0.8s' }}>
            <button className="drawer-btn primary" onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}>LOGIN / REGISTER</button>
            <button className="drawer-btn text-only">Track Order</button>
          </div>
        </div>
      </div>
    </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
