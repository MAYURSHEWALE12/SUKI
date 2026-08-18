"use client";

import React, { useEffect, useState } from 'react';
import './ExitIntentPopup.css';

const DISCOUNT_CODE = 'WELCOME10';
const SESSION_KEY = 'suki_exit_intent_shown';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'subscribed' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin') || path.startsWith('/checkout')) return;

    const onMouseOut = (e: MouseEvent) => {
      if (e.relatedTarget !== null) return;
      if (e.clientY > 10) return;
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, '1');
      setVisible(true);
    };

    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, []);

  const close = () => setVisible(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok && res.status !== 400) {
        setStatus('error');
        return;
      }
      setStatus('subscribed');
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(DISCOUNT_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visible) return null;

  return (
    <div className="exit-intent-overlay" onClick={close}>
      <div className="exit-intent-card" onClick={(e) => e.stopPropagation()}>
        <button className="exit-intent-close" onClick={close} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="exit-intent-badge">SPECIAL OFFER</div>
        <h2 className="exit-intent-title">Wait! Get 10% off your first order</h2>
        <p className="exit-intent-subtitle">
          Subscribe and we&apos;ll email you an exclusive <strong>WELCOME10</strong> code. Fresh looks, festive drops and member-only deals.
        </p>

        {status === 'subscribed' ? (
          <div className="exit-intent-code-box">
            <p className="exit-intent-code-label">Your discount code:</p>
            <div className="exit-intent-code-row">
              <span className="exit-intent-code">{DISCOUNT_CODE}</span>
              <button type="button" className="exit-intent-copy-btn" onClick={copyCode}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="exit-intent-code-hint">Apply it at checkout before paying.</p>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="exit-intent-form">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Subscribing...' : 'Get My Code'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="exit-intent-error">Something went wrong. Please try again.</p>
        )}

        <button className="exit-intent-dismiss" onClick={close}>No thanks, I&apos;ll pay full price</button>
      </div>
    </div>
  );
}