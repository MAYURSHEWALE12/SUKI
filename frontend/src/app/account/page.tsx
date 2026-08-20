"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';


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
        <button 
          className={`sidebar-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => handleTabChange('wishlist')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          My Wishlist
        </button>
        <button 
          className="sidebar-btn logout-btn"
          onClick={handleLogout}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Logout
        </button>
      </div>

      <div className="account-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h2 className="section-title">My Profile</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={user.name} 
                  onChange={handleChange} 
                  placeholder="Enter your full name" 
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={user.phone} 
                  onChange={handleChange} 
                  placeholder="Enter your phone number" 
                />
              </div>
              <div className="form-group full-width">
                <label>Email ID</label>
                <input 
                  type="email" 
                  name="email" 
                  value={user.email} 
                  disabled 
                  className="disabled-input"
                />
                <span className="help-text">Email address cannot be changed.</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                className="btn btn-primary save-btn" 
                onClick={handleSave} 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn"
                style={{ background: '#fff', color: '#ef4444', border: '1px solid #ef4444', padding: '0.8rem 2rem', fontWeight: 600, borderRadius: '4px' }}
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
            {message && <p className="success-message" style={{ marginTop: '1rem' }}>{message}</p>}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="addresses-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>My Addresses</h2>
              {!showAddressForm && (
                <button className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.95rem' }} onClick={() => openAddressForm()}>
                  Add New Address
                </button>
              )}
            </div>

            {showAddressForm ? (
              <div className="address-form-container">
                <h3>{editingAddressIndex !== null ? 'Edit Address' : 'Add New Address'}</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Full Name</label>
                    <input type="text" name="fullName" value={addressForm.fullName} onChange={handleAddressChange} placeholder="John Doe" />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <input type="text" name="address" value={addressForm.address} onChange={handleAddressChange} placeholder="123 Luxury Lane" />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="city" value={addressForm.city} onChange={handleAddressChange} placeholder="Mumbai" />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input type="text" name="postalCode" value={addressForm.postalCode} onChange={handleAddressChange} placeholder="400001" />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input type="text" name="country" value={addressForm.country} onChange={handleAddressChange} placeholder="India" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" name="phone" value={addressForm.phone} onChange={handleAddressChange} placeholder="+91 9876543210" />
                  </div>
                  <div className="form-group full-width" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="isDefault" name="isDefault" checked={addressForm.isDefault} onChange={handleAddressChange} style={{ width: 'auto' }} />
                    <label htmlFor="isDefault" style={{ marginBottom: 0, cursor: 'pointer' }}>Set as default shipping address</label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button className="btn btn-primary" onClick={saveAddress}>Save Address</button>
                  <button className="btn" style={{ background: '#f4f4f4', color: '#333' }} onClick={() => setShowAddressForm(false)}>Cancel</button>
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
                    <div className="address-actions">
                      <button onClick={() => openAddressForm(index)}>Edit</button>
                      <button onClick={() => deleteAddress(index)} style={{ color: '#ef4444' }}>Delete</button>
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
              <div className={`orders-list ${orders.length === 1 ? 'single-order' : 'multi-order'}`}>
                {orders.map((order: Order) => (
                  <div key={order._id} className="order-card new-card-design">
                    <div className="order-header" style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#fff' }}>
                      <div className="order-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span className="order-id" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#2c2c2c', letterSpacing: '0' }}>Order #{order._id.substring(0, 8).toUpperCase()}</span>
                        <span className="order-date" style={{ fontSize: '0.8rem', color: '#666', textTransform: 'none', letterSpacing: '0' }}>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} &bull; {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="order-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <div className="order-status-badge" style={{
                          backgroundColor: (order.status === 'Pending Payment' || order.status === 'Payment Failed') ? '#ffe8e8' : (order.status || 'Processing') === 'Processing' ? '#fcf5d2' : ((order.status || 'Processing') === 'Shipped' ? '#e0f1ff' : '#e2f5e9'),
                          color: (order.status === 'Pending Payment' || order.status === 'Payment Failed') ? '#d32f2f' : (order.status || 'Processing') === 'Processing' ? '#8a6e00' : ((order.status || 'Processing') === 'Shipped' ? '#0056b3' : '#1e7534'),
                          textTransform: 'uppercase',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '50px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          border: 'none'
                        }}>
                          <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                          {order.status || 'Processing'}
                        </div>
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
                      <a href={`/success?orderId=${order._id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#D81B60', border: '1px solid #ffccde', textDecoration: 'none', borderRadius: '4px', backgroundColor: '#fff5f8' }}>
                        View Receipt / Bill
                      </a>
                    </div>
                  </div>
                ))}
              </div>
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
