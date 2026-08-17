"use client";
import React, { useState } from 'react';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { name, email, phone, password };
      
      const res = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Store token in localStorage
      localStorage.setItem('suki_token', data.token);
      localStorage.setItem('suki_user', JSON.stringify({ id: data._id, name: data.name, email: data.email }));
      
      // Handle pending wishlist item
      const pendingWishlistItem = localStorage.getItem('pending_wishlist_item');
      if (pendingWishlistItem) {
        try {
          await fetch('/api/auth/wishlist', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.token}` 
            },
            body: JSON.stringify({ productId: pendingWishlistItem })
          });
          localStorage.removeItem('pending_wishlist_item');
        } catch (e) {
          console.error("Failed to add pending wishlist item", e);
        }
      }

      // Success! Close modal
      onClose();
      // Optionally trigger a page refresh or update context state here
      window.location.reload();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Left Side - Brand & Features */}
        <div className="modal-left">
          <button className="close-btn-mobile" onClick={onClose}>&times;</button>
          
          <div className="brand-header">
            <h1 className="modal-logo">Suki</h1>
          </div>
          
          <h2 className="welcome-text">Welcome! {isLogin ? 'Login' : 'Register'} to get best deals!</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              </div>
              <p>INDIA'S MOST<br/>AFFORDABLE</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
              </div>
              <p>PREMIUM<br/>QUALITY</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <p>EASY<br/>RETURNS</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="modal-right">
          <button className="close-btn-desktop" onClick={onClose}>&times;</button>
          
          <div className="login-form-container">
            <h3 className="login-heading">{isLogin ? 'Login Now!' : 'Create Account'}</h3>
            
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              
              {!isLogin && (
                <>
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <div className="input-prefix">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter Full Name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                  
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <div className="input-prefix">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <input 
                      type="tel" 
                      placeholder="Enter Phone Number (Optional)" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="input-group">
                <div className="input-prefix">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <input 
                  type="email" 
                  placeholder="Enter Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginTop: '1rem' }}>
                <div className="input-prefix">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <input 
                  type="password" 
                  placeholder="Enter Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {!isLogin && (
                <div className="checkbox-group" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="agreePolicies" 
                    required 
                    style={{ marginTop: '0.25rem', accentColor: '#C2185B' }}
                  />
                  <label htmlFor="agreePolicies" style={{ lineHeight: 1.4, fontSize: '0.85rem' }}>
                    I agree to the <a href="/terms-and-conditions" target="_blank" style={{ color: '#C2185B', textDecoration: 'underline' }}>Terms & Conditions</a> and <a href="/privacy-policy" target="_blank" style={{ color: '#C2185B', textDecoration: 'underline' }}>Privacy Policy</a>. <span style={{color:'red'}}>*</span>
                  </label>
                </div>
              )}
              <div className="checkbox-group" style={{ alignItems: 'flex-start' }}>
                <input 
                  type="checkbox" 
                  id="notify" 
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  style={{ marginTop: '0.25rem', accentColor: '#C2185B' }}
                />
                <label htmlFor="notify" style={{ lineHeight: 1.4, fontSize: '0.85rem' }}>I agree to receive offers, updates, and promotional messages from Suki Ethnic.</label>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Processing...' : 'Submit'}
              </button>
            </form>

            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
              <span style={{ color: '#666' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </div>

            <p className="terms-text" style={{ marginTop: '1.5rem' }}>
              I accept that I have read & understood your<br/>
              <a href="#">Privacy Policy</a> and <a href="#">T&Cs</a>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
