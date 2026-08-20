"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Logged in successfully
        // Check if user is actually admin directly from login response
        if (data.role === 'admin') {
          localStorage.setItem('suki_admin_token', data.token);
          router.push('/admin');
        } else {
          setError('Access Denied: You do not have administrator privileges.');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-brand">SUKI ADMIN</div>
        <h2>Restricted Access</h2>
        <p className="admin-subtitle">Please enter your credentials to access the luxury portal.</p>
        
        {error && <div className="admin-error">{error}</div>}
        
        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="admin-input-group">
            <label>Admin Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sukiethnic.com"
            />
          </div>
          <div className="admin-input-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
