"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import StatusBadge from '@/components/StatusBadge';


interface Address {
  _id?: string;
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface OrderItem {
  _id?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  product?: string;
}

interface Order {
  _id: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  totalPrice: number;
  orderItems: OrderItem[];
}

interface WishlistItem {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  numReviews?: number;
  category?: string;
  countInStock?: number;
}

const lastWeekMs = Date.now() - 7 * 86400000;

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['profile', 'addresses', 'orders', 'wishlist'].includes(hash)) return hash;
    }
    return 'profile';
  });
  const [user, setUser] = useState({ name: '', email: '', phone: '', addresses: [] as Address[], wishlist: [] as WishlistItem[] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '', address: '', city: '', postalCode: '', country: '', phone: '', isDefault: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('suki_token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            addresses: data.addresses || [],
            wishlist: data.wishlist || []
          });
        } else {
          localStorage.removeItem('suki_token');
          router.push('/');
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        const token = localStorage.getItem('suki_token');
        try {
          const res = await fetch('/api/orders/myorders', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setOrders(data);
          }
        } catch (error) {
          console.error("Failed to fetch orders", error);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('suki_token');
    window.location.href = '/';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const token = localStorage.getItem('suki_token');
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(user)
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage('Failed to update profile.');
      }
    } catch (error) {
      console.error("Update error", error);
      setMessage('An error occurred.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    
    const token = localStorage.getItem('suki_token');
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        localStorage.removeItem('suki_token');
        window.location.href = '/';
      } else {
        alert('Failed to delete account.');
      }
    } catch (error) {
      console.error("Delete account error", error);
      alert('An error occurred.');
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setAddressForm({ ...addressForm, [e.target.name]: value });
  };

  const openAddressForm = (index: number | null = null) => {
    if (index !== null) {
      setAddressForm(user.addresses[index]);
      setEditingAddressIndex(index);
    } else {
      setAddressForm({ fullName: '', address: '', city: '', postalCode: '', country: '', phone: '', isDefault: false });
      setEditingAddressIndex(null);
    }
    setShowAddressForm(true);
  };

  const saveAddress = async () => {
    if (!addressForm.fullName || !addressForm.address || !addressForm.city || !addressForm.postalCode || !addressForm.country || !addressForm.phone) {
      alert("Please fill in all address fields before saving.");
      return;
    }

    let newAddresses = [...user.addresses];
    let addressToSave = addressForm;
    
    // Handle default status
    if (addressForm.isDefault) {
      newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
    } else if (newAddresses.length === 0) {
      addressToSave = { ...addressForm, isDefault: true };
    }

    if (editingAddressIndex !== null) {
      newAddresses[editingAddressIndex] = addressToSave;
    } else {
      newAddresses.push(addressToSave);
    }

    const token = localStorage.getItem('suki_token');
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...user, addresses: newAddresses })
      });

      if (response.ok) {
        setUser({ ...user, addresses: newAddresses });
        setShowAddressForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to save address. Please check your inputs.");
      }
    } catch (error) {
      console.error("Failed to save address", error);
      alert("A network error occurred while saving the address.");
    }
  };

  const deleteAddress = async (index: number) => {
    if (!window.confirm("Delete this address?")) return;
    
    const newAddresses = user.addresses.filter((_, i) => i !== index);
    if (user.addresses[index].isDefault && newAddresses.length > 0) {
      newAddresses[0].isDefault = true;
    }

    const token = localStorage.getItem('suki_token');
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...user, addresses: newAddresses })
      });

      if (response.ok) {
        setUser({ ...user, addresses: newAddresses });
      }
    } catch (error) {
      console.error("Failed to delete address", error);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="account-page container">
      <div className="account-sidebar">
        <button 
          className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          My Profile
        </button>
        <button 
          className={`sidebar-btn ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => handleTabChange('addresses')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          My Addresses
        </button>
        <button 
          className={`sidebar-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleTabChange('orders')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          My Orders
        </button>
        
      </div>

      <div className="account-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            {/* Header Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#FFF0F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', color: '#111', fontFamily: 'var(--font-title)' }}>My Profile</h2>
                <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: 'clamp(12px, 2.5vw, 14px)', lineHeight: '1.2' }}>Manage your personal information and account details.</p>
              </div>
            </div>

            {/* Floral Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.2rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#FCE4EC' }}></div>
              <span style={{ color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 5.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" />
                  <path d="M12 12.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" />
                  <path d="M5.5 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z" />
                  <path d="M12.5 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z" />
                  <path d="M7.4 7.4a3 3 0 1 0 4.2 4.2 3 3 0 1 0-4.2-4.2z" />
                  <path d="M12.4 12.4a3 3 0 1 0 4.2 4.2 3 3 0 1 0-4.2-4.2z" />
                  <path d="M7.4 16.6a3 3 0 1 0 4.2-4.2 3 3 0 1 0-4.2 4.2z" />
                  <path d="M16.6 7.4a3 3 0 1 0-4.2 4.2 3 3 0 1 0 4.2-4.2z" />
                </svg>
              </span>
              <div style={{ flex: 1, height: '1px', background: '#FCE4EC' }}></div>
            </div>

            <div className="form-grid">
              {/* Full Name */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '500', marginBottom: '8px' }}>
                  <span style={{ color: '#C2185B', display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  <input 
                    type="text" 
                    name="name" 
                    value={user.name} 
                    onChange={handleChange} 
                    placeholder="Enter your full name" 
                    style={{ width: '100%', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #FCE4EC' }}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '500', marginBottom: '8px' }}>
                  <span style={{ color: '#C2185B', display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </span>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </span>
                  <input 
                    type="text" 
                    name="phone" 
                    value={user.phone} 
                    onChange={handleChange} 
                    placeholder="Enter your phone number" 
                    style={{ width: '100%', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #FCE4EC' }}
                  />
                </div>
              </div>

              {/* Email ID */}
              <div className="form-group full-width">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '500', marginBottom: '8px' }}>
                  <span style={{ color: '#C2185B', display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  Email ID
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  <input 
                    type="email" 
                    name="email" 
                    value={user.email} 
                    disabled 
                    className="disabled-input"
                    style={{ width: '100%', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #FCE4EC', background: '#fafafa' }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFF0F5',
                  border: '1px solid #FCE4EC',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  color: '#C2185B',
                  fontSize: '12px',
                  marginTop: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span>Email address cannot be changed.</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
              <button 
                className="btn btn-primary" 
                style={{
                  borderRadius: '6px',
                  padding: '0.8rem 2rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#C2185B',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                onClick={handleSave} 
                disabled={saving}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn"
                style={{
                  background: '#fff',
                  color: '#C2185B',
                  border: '1px solid #C2185B',
                  padding: '0.8rem 2rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
                onClick={handleDeleteAccount}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                Delete Account
              </button>
            </div>
            {message && <p className="success-message" style={{ marginTop: '1rem' }}>{message}</p>}
          </div>
        )}

                {activeTab === 'addresses' && (
          <div className="addresses-section">
            {/* Header Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#FFF0F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', color: '#111', fontFamily: 'var(--font-title)' }}>My Addresses</h2>
                  <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: 'clamp(12px, 2.5vw, 14px)', lineHeight: '1.2' }}>Manage your shipping addresses.</p>
                </div>
              </div>
              
              {!showAddressForm && (
                <button 
                  className="btn btn-primary" 
                  style={{
                    borderRadius: '6px',
                    padding: '0.65rem 1.4rem',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#C2185B',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => openAddressForm()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add New Address
                </button>
              )}
            </div>

            {/* Floral Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.2rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#FCE4EC' }}></div>
              <span style={{ color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 5.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" />
                  <path d="M12 12.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" />
                  <path d="M5.5 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z" />
                  <path d="M12.5 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z" />
                  <path d="M7.4 7.4a3 3 0 1 0 4.2 4.2 3 3 0 1 0-4.2-4.2z" />
                  <path d="M12.4 12.4a3 3 0 1 0 4.2 4.2 3 3 0 1 0-4.2-4.2z" />
                  <path d="M7.4 16.6a3 3 0 1 0 4.2-4.2 3 3 0 1 0-4.2 4.2z" />
                  <path d="M16.6 7.4a3 3 0 1 0-4.2 4.2 3 3 0 1 0 4.2-4.2z" />
                </svg>
              </span>
              <div style={{ flex: 1, height: '1px', background: '#FCE4EC' }}></div>
            </div>

            {showAddressForm ? (
              <div className="address-form-container">
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', color: '#111', marginBottom: '1.5rem' }}>{editingAddressIndex !== null ? 'Edit Address' : 'Add New Address'}</h3>
                <div className="form-grid">
                  {/* Full Name */}
                  <div className="form-group full-width">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '500', marginBottom: '8px' }}>
                      <span style={{ color: '#C2185B', display: 'flex' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </span>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </span>
                      <input 
                        type="text" 
                        name="fullName" 
                        value={addressForm.fullName} 
                        onChange={handleAddressChange} 
                        placeholder="John Doe" 
                        style={{ width: '100%', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #FCE4EC' }}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="form-group full-width">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '500', marginBottom: '8px' }}>
                      <span style={{ color: '#C2185B', display: 'flex' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      </span>
                      Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      </span>
                      <input 
                        type="text" 
                        name="address" 
                        value={addressForm.address} 
                        onChange={handleAddressChange} 
                        placeholder="123 Luxury Lane" 
                        style={{ width: '100%', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #FCE4EC' }}
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '500', marginBottom: '8px' }}>
                      <span style={{ color: '#C2185B', display: 'flex' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="16"></line><line x1="15" y1="22" x2="15" y2="16"></line><line x1="9" y1="16" x2="15" y2="16"></line><path d="M8 6h3v3H8zm5 0h3v3h-3zm-5 5h3v3H8zm5 0h3v3h-3z"></path></svg>
                      </span>
                      City
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="16"></line><line x1="15" y1="22" x2="15" y2="16"></line><line x1="9" y1="16" x2="15" y2="16"></line><path d="M8 6h3v3H8zm5 0h3v3h-3zm-5 5h3v3H8zm5 0h3v3h-3z"></path></svg>
                      </span>
                      <input 
                        type="text" 
                        name="city" 
                        value={addressForm.city} 
                        onChange={handleAddressChange} 
                        placeholder="Mumbai" 
                        style={{ width: '100%', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #FCE4EC' }}
                      />
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '500', marginBottom: '8px' }}>
                      <span style={{ color: '#C2185B', display: 'flex' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M3 10h18"></path><path d="M8 10v4"></path><path d="M12 10v4"></path><path d="M16 10v4"></path></svg>
                      </span>
                      Postal Code
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M3 10h18"></path><path d="M8 10v4"></path><path d="M12 10v4"></path><path d="M16 10v4"></path></svg>
                      </span>
                      <input 
                        type="text" 
                        name="postalCode" 
                        value={addressForm.postalCode} 
                        onChange={handleAddressChange} 
                        placeholder="400001" 
                        style={{ width: '100%', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #FCE4EC' }}
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '500', marginBottom: '8px' }}>
                      <span style={{ color: '#C2185B', display: 'flex' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                      </span>
                      Country
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                      </span>
                      <input 
                        type="text" 
                        name="country" 
                        value={addressForm.country} 
                        onChange={handleAddressChange} 
                        placeholder="India" 
                        style={{ width: '100%', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #FCE4EC' }}
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontWeight: '500', marginBottom: '8px' }}>
                      <span style={{ color: '#C2185B', display: 'flex' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      </span>
                      Phone Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#C2185B', display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      </span>
                      <input 
                        type="text" 
                        name="phone" 
                        value={addressForm.phone} 
                        onChange={handleAddressChange} 
                        placeholder="+91 9876543210" 
                        style={{ width: '100%', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #FCE4EC' }}
                      />
                    </div>
                  </div>

                  {/* Default Checkbox */}
                  <div className="form-group full-width" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                    <input type="checkbox" id="isDefault" name="isDefault" checked={addressForm.isDefault} onChange={handleAddressChange} style={{ width: 'auto', accentColor: '#C2185B' }} />
                    <label htmlFor="isDefault" style={{ marginBottom: 0, cursor: 'pointer', color: '#111', fontWeight: '500' }}>Set as default shipping address</label>
                  </div>
                </div>
                
                {/* Form Buttons */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{
                      borderRadius: '6px',
                      padding: '0.65rem 1.4rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#C2185B',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                    onClick={saveAddress}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Save Address
                  </button>
                  <button 
                    className="btn" 
                    style={{
                      background: '#fff',
                      color: '#C2185B',
                      border: '1px solid #C2185B',
                      padding: '0.65rem 1.4rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : user.addresses.length === 0 ? (
              <div className="placeholder-section">
                <p>You have no saved addresses yet.</p>
              </div>
            ) : (
              <div className="address-grid">
                {user.addresses.map((addr: Address, index: number) => (
                  <div key={index} className={`address-card ${addr.isDefault ? 'default-address' : ''}`}>
                    {addr.isDefault && <div className="default-badge">Default</div>}
                    <h4>{addr.fullName}</h4>
                    <p>{addr.address}</p>
                    <p>{addr.city}, {addr.postalCode}</p>
                    <p>{addr.country}</p>
                    <p>Phone: {addr.phone}</p>
                    
                    {/* Card Actions */}
                    <div className="address-actions" style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #FCE4EC' }}>
                      <button 
                        onClick={() => openAddressForm(index)}
                        style={{
                          background: '#fff',
                          color: '#C2185B',
                          border: '1px solid #C2185B',
                          padding: '0.5rem 1rem',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        EDIT
                      </button>
                      <button 
                        onClick={() => deleteAddress(index)} 
                        style={{
                          background: '#fff',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          padding: '0.5rem 1rem',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <h2 className="section-title">My Orders</h2>
            {ordersLoading ? (
              <p>Loading your orders...</p>
            ) : orders.length === 0 ? (
              <div className="placeholder-section" style={{ padding: '2rem 0' }}>
                <p>You haven&apos;t placed any orders yet.</p>
              </div>
            ) : (
              <>
              <div className="orders-updates" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {orders
                  .filter((o: Order) => {
                    const updated = o.updatedAt ? new Date(o.updatedAt).getTime() : 0;
                    const created = new Date(o.createdAt).getTime();
                    return updated > created && updated >= lastWeekMs && o.status !== 'Pending Payment' && o.status !== 'Payment Failed';
                  })
                  .slice(0, 3)
                  .map((o: Order) => (
                    <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fff7fa', border: '1px solid #ffd9e6', borderRadius: '10px', padding: '0.7rem 1rem', fontSize: '0.9rem', color: '#6b1a3a' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D81B60" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                      <span style={{ flex: 1 }}>Order <strong>#{o._id.substring(0, 8).toUpperCase()}</strong> status updated to <StatusBadge status={o.status || 'Processing'} /> on {o.updatedAt ? new Date(o.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                      <Link href={`/track?orderId=${o._id}`} style={{ color: '#D81B60', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Track →</Link>
                    </div>
                  ))}
              </div>
              <div className={`orders-list ${orders.length === 1 ? 'single-order' : 'multi-order'}`}>
                {orders.map((order: Order) => (
                  <div key={order._id} className="order-card new-card-design">
                    <div className="order-header" style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#fff' }}>
                      <div className="order-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span className="order-id" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#2c2c2c', letterSpacing: '0' }}>Order #{order._id.substring(0, 8).toUpperCase()}</span>
                        <span className="order-date" style={{ fontSize: '0.8rem', color: '#666', textTransform: 'none', letterSpacing: '0' }}>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} &bull; {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="order-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <StatusBadge status={order.status || 'Processing'} />
                      </div>
                    </div>
                    
                    <div className="order-items" style={{ padding: '0 1rem' }}>
                      {order.orderItems.map((item: OrderItem, idx: number) => (
                        <div key={idx} className="order-item-row" style={{ display: 'flex', gap: '0.8rem', borderBottom: 'none', padding: '0.8rem 0' }}>
                          {item.image && (
                            <Link href={`/product/${item.product}`}>
                              <Image src={item.image} alt={item.name} className="order-item-img" width={55} height={75} style={{ cursor: 'pointer', borderRadius: '6px', objectFit: 'cover' }} />
                            </Link>
                          )}
                          <div className="order-item-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Link href={`/product/${item.product}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <h4 style={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 500, color: '#444', margin: '0 0 0.1rem 0', fontFamily: 'var(--font-display)' }}>{item.name}</h4>
                            </Link>
                            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0', textTransform: 'none', letterSpacing: '0' }}>Size: Free Size &bull; QTY: {item.quantity}</p>
                            <div className="order-item-price" style={{ color: '#D81B60', fontWeight: 600, fontSize: '1rem', marginTop: '0.2rem' }}>
                              ₹{item.price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
<div className="order-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
                        <div className="order-total-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                          <span className="total-label" style={{ fontSize: '0.8rem', color: '#666', textTransform: 'none', fontWeight: 400, letterSpacing: '0' }}>Total Amount</span>
                          <span className="total-value" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333' }}>₹{order.totalPrice}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Link href={`/track?orderId=${order._id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#D81B60', border: '1px solid #ffccde', textDecoration: 'none', borderRadius: '4px', backgroundColor: '#fff5f8' }}>
                            Track Order
                          </Link>
<a href={`/success?orderId=${order._id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#D81B60', border: '1px solid #ffccde', textDecoration: 'none', borderRadius: '4px', backgroundColor: '#fff5f8' }}>
                            View Receipt / Bill
                          </a>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        )}
        {activeTab === 'wishlist' && (
          <div className="wishlist-section">
            <h2 className="section-title">My Wishlist</h2>
            {user.wishlist.length === 0 ? (
              <div className="placeholder-section" style={{ padding: '2rem 0' }}>
                <p>Your wishlist is currently empty. Start saving your favorite styles!</p>
              </div>
            ) : (
              <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
                {user.wishlist.map((item: WishlistItem) => (
                  <ProductCard key={item._id} product={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
