"use client";
import React, { useState } from 'react';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [resetMessage, setResetMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'forgot') {
        const resetRes = await fetch('/api/auth/forgotpassword', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
const resetData = await resetRes.json();
        if (!resetRes.ok) throw new Error(resetData.message || 'Something went wrong');
        setError('');
        setResetMessage('Password reset link sent to your email.');
        setLoading(false);
        return;
      }
      
      const endpoint = view === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = view === 'login' ? { email, password } : { name, email, phone, password };
      
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
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
              <span style={{ fontFamily: 'var(--font-logo)', fontSize: '56px', lineHeight: '1', color: '#C2185B', textTransform: 'lowercase', fontWeight: 400, letterSpacing: '2px' }}>suki</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', letterSpacing: '12px', color: '#C2185B', textTransform: 'uppercase', marginTop: '4px', fontWeight: 400, marginLeft: '12px' }}>ETHNIC</span>
            </div>
          </div>
          
          <h2 className="welcome-text">{view === 'login' ? 'Welcome Back!' : view === 'forgot' ? 'Reset Password' : 'Join Us!'}</h2>
          <p className="welcome-subtext">
            {view === 'login' 
              ? 'Login to unlock exclusive deals\nand a delightful shopping experience.' 
              : 'Sign up to unlock exclusive deals\nand a delightful shopping experience.'}
          </p>

          <div className="floral-divider-small">
            <span></span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-primary)"><circle cx="12" cy="12" r="6"/></svg>
            <span></span>
          </div>
          

          
        </div>

        {/* Right Side - Login Form */}
        <button className="close-btn-desktop" onClick={onClose}>&times;</button>
        <div className="modal-right">
          
          <div className="login-form-container">
            <h3 className="login-heading">{view === 'login' ? 'Login to Your Account' : view === 'forgot' ? 'Forgot Password' : 'Create Account'}</h3>
            <p className="login-subheading">{view === 'login' ? 'Enter your details to continue' : view === 'forgot' ? 'We will send you a reset link' : 'Enter your details to sign up'}</p>
            
            <div className="floral-divider-large">
              <span></span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-primary)"><circle cx="12" cy="12" r="6"/></svg>
              <span></span>
            </div>

            {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            {resetMessage && <div className="error-message" style={{ color: 'green', marginBottom: '1rem', fontSize: '0.85rem' }}>{resetMessage}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              
              {view === 'register' && (
                <>
                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <div className="auth-input-prefix">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter Full Name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={true}
                    />
                  </div>
                  
                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <div className="auth-input-prefix">
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

              <div className="auth-input-group">
                <div className="auth-input-prefix">
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

              {view !== 'forgot' && (
<div className="auth-input-group" style={{ marginTop: '1rem' }}>
                <div className="auth-input-prefix">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={true}
                />
                <button 
                  type="button" 
                  className="auth-input-suffix" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1rem' }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </button>
              </div>
)}
{view === 'login' && (
              <div style={{ textAlign: 'right', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                <span onClick={() => { setView('forgot'); setError(''); setResetMessage(''); }} style={{ color: 'var(--color-primary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>Forgot Password?</span>
              </div>
            )}

              {view === 'register' && (
                <div className="checkbox-group" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="agreePolicies" 
                    required 
                  />
                  <label htmlFor="agreePolicies">
                    I agree to the <a href="/terms-and-conditions" target="_blank">Terms & Conditions</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>. <span style={{color:'red'}}>*</span>
                  </label>
                </div>
              )}
              {view !== 'forgot' && (
              <div className="checkbox-group" style={{ alignItems: 'flex-start' }}>
                <input 
                  type="checkbox" 
                  id="notify" 
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                />
                <label htmlFor="notify">I agree to receive offers, updates, and promotional messages from Suki Ethnic.</label>
              </div>
            )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Processing...' : (view === 'login' ? 'Login' : view === 'forgot' ? 'Send Reset Link' : 'Register')}
              </button>
            </form>

            {view !== 'forgot' && (
              <>
                <div className="or-divider">
                  <span></span>
                  <span>OR</span>
                  <span></span>
                </div>

                <div className="social-buttons">
                  <button type="button" className="social-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="16" height="16">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>
              </>
            )}

            <div className="switch-mode">
              <span>{view === 'login' ? "Don't have an account? " : view === 'forgot' ? "Remember your password? " : "Already have an account? "}</span>
              <button type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')}>
                {view === 'login' ? 'Register' : 'Login'}
              </button>
            </div>

            <p className="terms-text-bottom">
              By continuing, you agree to our <a href="#">Privacy Policy</a> and <a href="#">T&Cs</a>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
