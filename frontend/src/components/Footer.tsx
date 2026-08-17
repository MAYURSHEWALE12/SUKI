"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaInstagram, FaFacebookF, FaPinterestP, FaYoutube } from 'react-icons/fa';

const EXPLORE_LINKS = [
  { href: '/collections/lehengas', label: 'Lehengas' },
  { href: '/collections/sarees', label: 'Sarees' },
  { href: '/collections/half-sarees', label: 'Half Sarees' },
  { href: '/collections/navratri-ghagra', label: 'Navratri Ghagra' },
  { href: '/collections/new-arrivals', label: 'New Arrivals' },
  { href: '/collections/best-sellers', label: 'Best Sellers' },
];

const POLICY_LINKS = [
  { href: '/return-policy', label: 'Exchange & Returns' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-and-conditions', label: 'Terms & Conditions' },
  { href: '/faq', label: 'FAQs' },
];

const SOCIALS = [
  {
    label: 'Instagram',
    href: '#',
    icon: <FaInstagram size={20} />,
  },
  {
    label: 'Facebook',
    href: '#',
    icon: <FaFacebookF size={18} />,
  },
  {
    label: 'Pinterest',
    href: '#',
    icon: <FaPinterestP size={18} />,
  },
  {
    label: 'YouTube',
    href: '#',
    icon: <FaYoutube size={20} />,
  },
];


export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', message: 'Thanks for subscribing!' });
        setEmail('');
      } else {
        setStatus({ type: 'error', message: data.message || 'Subscription failed.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error. Try again later.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const chevronIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s ease' }}>
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );

  return (
    <footer className="luxury-footer">
      <div className="footer-overlay"></div>

      <div className="footer-container">
        {/* DESKTOP GRID */}
        <div className="footer-grid desktop-only">
          <div className="footer-col brand-col">
            <Link href="/" className="footer-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
              <span className="logo-brand">suki</span>
              <span className="logo-sub" style={{ marginTop: '4px', marginLeft: '10px' }}>ETHNIC</span>
            </Link>
            <p className="tagline">"Where tradition meets modern elegance."</p>
            <p className="description">
              Discover handcrafted sarees, lehengas and festive wear that celebrate the spirit of India.
            </p>
            <div className="socials">
              {SOCIALS.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label} className="social-icon">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <nav className="footer-col links-col">
            <h3 className="heading">EXPLORE</h3>
            <ul>
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-col links-col">
            <h3 className="heading">POLICIES</h3>
            <ul>
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-col newsletter-col">
            <h3 className="heading">STAY IN TOUCH</h3>
            <p className="description">
              Subscribe for festive offers, exclusive collections, styling inspiration and early access to new arrivals.
            </p>
            <form className="luxury-newsletter-form" onSubmit={handleSubscribe}>
              <div className="luxury-input-group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="luxury-subscribe-btn" disabled={loading}>
                  {loading ? 'WAIT...' : 'SUBSCRIBE'}
                </button>
              </div>
              {status.message && (
                <p className={`newsletter-status ${status.type === 'error' ? 'error-text' : 'success-text'}`}>
                  {status.message}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* MOBILE ACCORDION LAYOUT */}
        <div className="mobile-footer mobile-only">
          <div className="mobile-brand-section">
            <Link href="/" className="footer-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
              <span className="logo-brand">suki</span>
              <span className="logo-sub" style={{ marginTop: '4px', marginLeft: '10px' }}>ETHNIC</span>
            </Link>
            <p className="tagline">Timeless Elegance. Made for You.</p>
            <div className="socials">
              {SOCIALS.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label} className="social-icon">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="accordion-container">
            {/* EXPLORE */}
            <div className="accordion-item" onClick={() => toggleSection('explore')}>
              <div className="accordion-header">
                <div className="accordion-title">
                  <span>EXPLORE</span>
                </div>
                <div className="accordion-chevron" style={{ transform: openSection === 'explore' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  {chevronIcon}
                </div>
              </div>
              {openSection === 'explore' && (
                <div className="accordion-content">
                  <ul className="accordion-list">
                    {EXPLORE_LINKS.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="accordion-link">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* POLICIES */}
            <div className="accordion-item" onClick={() => toggleSection('policies')}>
              <div className="accordion-header">
                <div className="accordion-title">
                  <span>POLICIES</span>
                </div>
                <div className="accordion-chevron" style={{ transform: openSection === 'policies' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  {chevronIcon}
                </div>
              </div>
              {openSection === 'policies' && (
                <div className="accordion-content">
                  <ul className="accordion-list">
                    {POLICY_LINKS.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="accordion-link">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* STAY IN TOUCH */}
            <div className="accordion-item" onClick={() => toggleSection('stay-in-touch')}>
              <div className="accordion-header">
                <div className="accordion-title">
                  <span>STAY IN TOUCH</span>
                </div>
                <div className="accordion-chevron" style={{ transform: openSection === 'stay-in-touch' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  {chevronIcon}
                </div>
              </div>
              {openSection === 'stay-in-touch' && (
                <div className="accordion-content">
                  Subscribe for exclusive offers, styling inspiration and early access to new arrivals.
                </div>
              )}
            </div>
          </div>

          <form className="mobile-newsletter-form" onSubmit={handleSubscribe}>
            <div className="mobile-input-pill">

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'WAIT...' : 'SUBSCRIBE'}
              </button>
            </div>
            {status.message && (
              <p className={`newsletter-status ${status.type === 'error' ? 'error-text' : 'success-text'}`} style={{textAlign: 'center', width: '100%', bottom: '-30px'}}>
                {status.message}
              </p>
            )}
          </form>
        </div>

        <div className="bottom-bar">
          <div className="bottom-content">
            <p>&copy; 2026 Suki Ethnic Private Limited. All Rights Reserved.</p>
            <p className="crafted-with">Crafted with ❤️ for lovers of Indian tradition.</p>
            <p className="made-in">Made in India</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .luxury-footer {
          position: relative;
          width: 100%;
          min-height: 500px;
          font-family: var(--font-body);
          color: #666666;
          background: #FFFDFB;
          overflow: hidden;
        }

        .footer-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #FFFDFB;
          opacity: 1;
          z-index: 1;
        }

        .footer-container {
          position: relative;
          z-index: 2;
          max-width: 1400px;
          margin: 0 auto;
          padding: 80px 100px 40px;
        }

        .mobile-only { display: none; }
        .desktop-only { display: grid; }

        .footer-grid {
          grid-template-columns: 1.2fr 1fr 1fr 1.5fr;
          gap: 80px;
          margin-bottom: 80px;
        }

        .footer-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          margin-bottom: 24px;
          width: fit-content;
        }
        
        .logo-brand {
          font-family: var(--font-logo);
          font-size: 42px;
          line-height: 1;
          color: #C2185B;
          text-transform: lowercase;
          font-weight: 400;
          letter-spacing: 2px;
        }

        .logo-sub {
          font-family: var(--font-body);
          font-size: 11px;
          letter-spacing: 10px;
          color: #C2185B;
          text-transform: uppercase;
          margin-top: 4px;
          font-weight: 400;
          margin-left: 10px;
        }

        .brand-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .tagline {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          color: #C2185B;
          font-size: 18px;
          margin-bottom: 20px;
        }

        .description {
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 30px;
          color: #666666;
        }

        .socials {
          display: flex;
          gap: 15px;
        }

        .social-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid #F7D8E2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C2185B;
          transition: all 0.3s ease;
          background: transparent;
        }

        .social-icon:hover {
          background: #C2185B;
          border-color: #C2185B;
          color: #FFF;
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(194, 24, 91, 0.2);
        }

        .heading {
          font-family: var(--font-body);
          font-size: 24px;
          color: #222222;
          margin-bottom: 30px;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .links-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-link {
          font-size: 18px;
          color: #666666;
          text-decoration: none;
          position: relative;
          transition: color 0.3s ease;
          display: inline-block;
        }

        .footer-link:hover { color: #C2185B; }

        .luxury-newsletter-form {
          margin-bottom: 30px;
          position: relative;
        }

        .luxury-input-group {
          display: flex;
          align-items: center;
          border-bottom: 1px solid #C2185B;
          padding-bottom: 8px;
        }

        .luxury-input-group input {
          flex-grow: 1;
          border: none;
          background: transparent;
          outline: none;
          font-family: var(--font-body);
          font-size: 15px;
          color: #4a1523;
        }

        .luxury-subscribe-btn {
          background: transparent;
          border: none;
          color: #C2185B;
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          cursor: pointer;
          padding: 0 0 0 16px;
        }

        .newsletter-status {
          font-size: 13px;
          margin-top: 10px;
          position: absolute;
          bottom: -25px;
          left: 0;
        }
        
        .success-text { color: #28a745; }
        .error-text { color: #dc3545; }

        .bottom-bar {
          border-top: 1px solid #F7D8E2;
          padding-top: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-size: 14px;
          color: #666666;
          width: 100%;
        }
        .bottom-content p {
          margin-bottom: 12px;
        }
        .crafted-with {
          font-style: italic;
          color: #C2185B;
          font-size: 15px;
        }
        .made-in {
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #C2185B;
          margin-top: 5px;
        }

        @media (max-width: 1200px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .footer-container { padding: 60px 40px; }
        }

        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block !important; }
          .footer-container { padding: 40px 20px 20px; }
          
          .mobile-brand-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin-bottom: 40px;
          }
          .mobile-brand-section .footer-logo {
            margin-bottom: 10px;
          }
          .mobile-brand-section .socials {
            margin-top: 15px;
          }

          .accordion-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 30px;
          }

          .accordion-item {
            background: rgba(247, 216, 226, 0.25);
            border: 1px solid rgba(247, 216, 226, 0.6);
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .accordion-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
          }

          .accordion-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: var(--font-heading);
            font-weight: 500;
            color: #4a1523;
            font-size: 15px;
            letter-spacing: 1px;
          }

          .accordion-chevron {
            color: #C2185B;
          }

          .accordion-content {
            padding: 0 20px 20px 20px;
            font-size: 14px;
            line-height: 1.6;
            color: #666;
            animation: fadeIn 0.3s ease;
          }

          .accordion-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .accordion-link {
            text-decoration: none;
            color: #666;
            transition: color 0.2s ease;
          }

          .accordion-link:hover {
            color: #C2185B;
          }

          .mobile-newsletter-form {
            margin-bottom: 40px;
            position: relative;
          }

          .mobile-input-pill {
            display: flex;
            align-items: center;
            background: #fff;
            border: 1px solid #C2185B;
            border-radius: 50px;
            overflow: hidden;
            padding: 4px;
          }

          .mobile-input-pill input {
            flex-grow: 1;
            border: none;
            outline: none;
            padding: 10px 20px;
            font-size: 14px;
            background: transparent;
            color: #333;
          }

          .mobile-input-pill button {
            background: #C2185B;
            color: #fff;
            border: none;
            padding: 12px 20px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            transition: opacity 0.2s;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>
    </footer>
  );
}
