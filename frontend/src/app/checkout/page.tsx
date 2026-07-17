"use client";
import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import './checkout.css';

export default function CheckoutPage() {
  const { cartItems, cartTotalPrice, clearCart } = useCart();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India',
    phone: '',
  });
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('suki_token');
    if (token) {
      fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.addresses && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const defaultAddress = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
          handleSelectAddress(defaultAddress);
        } else if (data && data.name) {
          setShippingAddress(prev => ({ ...prev, fullName: data.name }));
        }
      })
      .catch(console.error);
    }
  }, []);

  // If cart is empty, redirect back to cart
  if (cartItems.length === 0 && !isProcessing) {
    router.push('/cart');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleSelectAddress = (addr: any) => {
    setShippingAddress({
      fullName: addr.fullName,
      address: addr.address,
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country || 'India',
      phone: addr.phone,
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          image: item.image,
          price: item.price,
          size: item.size,
          product: item._id,
        })),
        shippingAddress,
        paymentMethod,
        itemsPrice: cartTotalPrice,
        shippingPrice: 0,
        totalPrice: cartTotalPrice,
      };

      // Check if user is logged in
      const token = localStorage.getItem('suki_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      if (!res.ok) {
        throw new Error('Failed to place order');
      }

      // Success
      clearCart();
      router.push('/success');

    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="checkout-page container">
      <h1 className="checkout-title">Secure Checkout</h1>
      
      {error && <div className="checkout-error">{error}</div>}

      <div className="checkout-layout">
        {/* Left Column: Form */}
        <form onSubmit={handlePlaceOrder} className="checkout-form-section">
          
          <div className="checkout-card">
            <h2>1. Shipping Details</h2>
            
            {savedAddresses.length > 0 && (
              <div className="saved-addresses-section">
                <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>Select a saved address or enter a new one below:</p>
                <div className="address-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  {savedAddresses.map((addr, idx) => {
                    const isSelected = shippingAddress.address === addr.address && shippingAddress.postalCode === addr.postalCode;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => handleSelectAddress(addr)}
                        style={{
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid #eee',
                          backgroundColor: isSelected ? 'rgba(244, 69, 134, 0.05)' : '#fff',
                          padding: '1rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s'
                        }}
                      >
                        {addr.isDefault && <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--color-primary)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Default</span>}
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>{addr.fullName}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
                          {addr.address}<br/>
                          {addr.city}, {addr.postalCode}<br/>
                          Ph: {addr.phone}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderBottom: '1px solid #eee', margin: '2rem 0' }}></div>
              </div>
            )}

            <div className="form-grid">
              <div className="input-group full-width">
                <label>Full Name</label>
                <input type="text" name="fullName" required value={shippingAddress.fullName} onChange={handleChange} />
              </div>
              <div className="input-group full-width">
                <label>Phone Number</label>
                <input type="tel" name="phone" required value={shippingAddress.phone} onChange={handleChange} />
              </div>
              <div className="input-group full-width">
                <label>Street Address</label>
                <input type="text" name="address" required value={shippingAddress.address} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>City</label>
                <input type="text" name="city" required value={shippingAddress.city} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>PIN Code</label>
                <input type="text" name="postalCode" required value={shippingAddress.postalCode} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="checkout-card">
            <h2>2. Payment Method</h2>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'Cash On Delivery' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="Cash On Delivery" 
                  checked={paymentMethod === 'Cash On Delivery'} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="payment-option-content">
                  <span className="payment-option-title">Cash On Delivery (COD)</span>
                  <span className="payment-option-desc">Pay when you receive the package</span>
                </div>
              </label>
              
              <label className={`payment-option ${paymentMethod === 'Credit Card' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="Credit Card" 
                  checked={paymentMethod === 'Credit Card'} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="payment-option-content">
                  <span className="payment-option-title">Credit/Debit Card</span>
                  <span className="payment-option-desc">Simulated Payment Gateway</span>
                </div>
              </label>
            </div>
          </div>

        </form>

        {/* Right Column: Order Summary */}
        <div className="checkout-summary-section">
          <div className="checkout-summary-card">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={`${item._id}-${item.size}`} className="summary-item">
                  <div className="summary-item-img">
                    <img src={item.image} alt={item.name} />
                    <span className="summary-item-qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item-details">
                    <span className="summary-item-name">{item.name}</span>
                    <span className="summary-item-size">Size: {item.size}</span>
                  </div>
                  <div className="summary-item-price">₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>
            
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartTotalPrice}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row total-row">
              <span>Total To Pay</span>
              <span>₹{cartTotalPrice}</span>
            </div>

            <button 
              type="submit"
              className="btn btn-primary place-order-btn" 
              disabled={isProcessing}
              onClick={handlePlaceOrder}
            >
              {isProcessing ? 'Processing Order...' : 'Place Order'}
            </button>
            <p className="checkout-guarantee">
              By placing your order, you agree to our Terms & Conditions and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
