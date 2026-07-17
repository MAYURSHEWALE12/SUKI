"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-section">
          <div className="footer-brand">
            <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', lineHeight: '1', color: 'var(--color-primary)', textTransform: 'lowercase' }}>suki</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', letterSpacing: '8px', color: 'var(--color-text-primary)', textTransform: 'uppercase', marginLeft: '8px' }}>Ethnic</span>
            </Link>
            <p className="footer-tagline">Wear the trend. Own the moment.</p>
          </div>
          
          <div className="footer-social-main">
            <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
            <a href="https://www.instagram.com/suki__ethnic" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg></a>
          </div>
        </div>

        <div className="footer-links-container">
          <div className="footer-links">
            <h3 className="footer-accordion-header" onClick={() => toggleSection('shop')}>
              SHOP <span className="accordion-icon">{openSection === 'shop' ? '-' : '+'}</span>
            </h3>
            <ul className={`footer-accordion-content ${openSection === 'shop' ? 'open' : ''}`}>
              <li><Link href="/lehengas">Lehengas</Link></li>
              <li><Link href="/sarees">Sarees</Link></li>
              <li><Link href="/party-wear">Party Wear</Link></li>
              <li><Link href="/sale">Sale</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h3 className="footer-accordion-header" onClick={() => toggleSection('support')}>
              SUPPORT <span className="accordion-icon">{openSection === 'support' ? '-' : '+'}</span>
            </h3>
            <ul className={`footer-accordion-content ${openSection === 'support' ? 'open' : ''}`}>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/shipping">Shipping Policy</Link></li>
              <li><Link href="/returns">Returns & Refunds</Link></li>
            </ul>
          </div>
          <div className="footer-newsletter footer-links">
            <h3 className="footer-accordion-header" onClick={() => toggleSection('newsletter')}>
              STAY UPDATED <span className="accordion-icon">{openSection === 'newsletter' ? '-' : '+'}</span>
            </h3>
            <div className={`footer-accordion-content ${openSection === 'newsletter' ? 'open' : ''}`}>
              <p>Subscribe for festive offers and new arrivals.</p>
              <form className="newsletter-form">
                <input type="email" placeholder="Your email address" required />
                <button type="submit" className="btn btn-primary">Subscribe</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar with copyright and socials */}
      <div className="footer-bottom-wrapper">
        <div className="container footer-bottom">
          <p>&copy; {new Date().getFullYear()} &copy; Suki Ethnic Private Limited. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
