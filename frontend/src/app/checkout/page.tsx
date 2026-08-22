"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


const STEPS = ['Cart', 'Checkout', 'Payment', 'Confirmation'];

interface SavedAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country?: string;
  phone: string;
  isDefault?: boolean;
}

export default function CheckoutPage() {
  const { cartItems, cartTotalPrice } = useCart();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India',
    phone: '',
  });
  const [customerEmail, setCustomerEmail] = useState('');
  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [agreePolicies, setAgreePolicies] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // Discount State
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: string; discountAmount: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  

  // Discount State
  const [deliveryDate, setDeliveryDate] = useState('');

  useEffect(() => {
    setDeliveryDate(
      new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    );
  }, []);
  
  // Custom Address Dropdown State
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(null);

  // Accordion State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    shipping: true,
    payment: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const totalAfterDiscount = cartTotalPrice - (appliedDiscount?.discountAmount || 0);

  const applyDiscountCode = async () => {
    const code = discountCode.trim();
    if (!code) {
      setDiscountError('Please enter a discount code.');
      return;
    }
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal: cartTotalPrice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscountError(data.message || 'Invalid discount code.');
        setAppliedDiscount(null);
        return;
      }
      setAppliedDiscount({ code: data.code, type: data.type, discountAmount: data.discountAmount });
      setDiscountCode('');
    } catch {
      setDiscountError('Could not validate the discount code. Please try again.');
    } finally {
      setDiscountLoading(false);
    }
  };

  const removeAppliedDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError('');
  };

  const applyAddress = (addr: SavedAddress) => {
    setShippingAddress({
      fullName: addr.fullName,
      address: addr.address,
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country || 'India',
      phone: addr.phone,
    });
  };

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
          const defaultAddress = data.addresses.find((a: SavedAddress) => a.isDefault) || data.addresses[0];
          applyAddress(defaultAddress);
        } else if (data && data.name) {
          setShippingAddress(prev => ({ ...prev, fullName: data.name }));
        }
        if (data && data.email) {
          setCustomerEmail(data.email);
        }
      })
      .catch(console.error);
    }
  }, []);

  useEffect(() => {
    // If cart is empty, redirect back to cart
    if (cartItems.length === 0 && !isProcessing) {
      router.push('/');
    }
  }, [cartItems.length, isProcessing, router]);

  if (cartItems.length === 0 && !isProcessing) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleSelectAddress = (addr: SavedAddress) => {
    applyAddress(addr);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreePolicies || !agreeMarketing) {
      setError('You must agree to the policies and opt-in to updates to proceed.');
      return;
    }
    setIsProcessing(true);
    setError('');

    if (!customerEmail.trim()) {
      setError('Please enter your email address for the payment receipt.');
      setIsProcessing(false);
      return;
    }

    // Open popup synchronously to bypass popup blockers
    // No popup needed anymore
    

    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          image: item.image,
          price: item.price,
          product: item._id,
        })),
        shippingAddress,
        paymentMethod,
        email: customerEmail.trim(),
        ...(appliedDiscount ? { discountCode: appliedDiscount.code } : {}),
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

      const createdOrder = await res.json();
      
      // Save session token to allow viewing the success page without logging in
      if (createdOrder.sessionToken) {
        sessionStorage.setItem(`suki_order_token_${createdOrder._id}`, createdOrder.sessionToken);
      }

      // For Online Payments, request PayU Hash
      const hashRes = await fetch(`/api/orders/${createdOrder._id}/payu-hash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: createdOrder.totalPrice,
          productinfo: 'Suki Ethnic Purchase',
          firstname: shippingAddress.fullName.split(' ')[0],
          email: customerEmail,
          phone: shippingAddress.phone
        })
      });

      if (!hashRes.ok) {
        throw new Error('Failed to initiate online payment');
      }

      const payuData = await hashRes.json();

      // Dynamically create a form and submit to PayU
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payuData.gatewayUrl || 'https://test.payu.in/_payment';
      
      const appendField = (name: string, value: string) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      appendField('key', payuData.key);
      appendField('txnid', payuData.txnid);
      appendField('hash', payuData.hash);
      appendField('amount', payuData.amount);
      appendField('productinfo', payuData.productinfo);
      appendField('firstname', payuData.firstname);
      appendField('email', payuData.email);
      appendField('phone', payuData.phone);
      appendField('surl', payuData.surl);
      appendField('furl', payuData.furl);

      form.target = '_self';
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      // The popup will redirect back to success page which will then redirect the main window
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during checkout');
      setIsProcessing(false);
      // Close the popup if it fails
      // No popup to close
    }
  };

  return (
    <div className="checkout-page container">

      {/* Progress Steps */}
      <div className="checkout-steps">
        {STEPS.map((label, i) => {
          const state = i < 1 ? 'done' : i === 1 ? 'active' : 'upcoming';
          return (
            <React.Fragment key={label}>
              {i > 0 && <span className={`step-line ${i <= 1 ? 'filled' : ''}`} />}
              <div className={`step-item ${state}`}>
                <span className="step-circle">
                  {state === 'done' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : i + 1}
                </span>
                <span className="step-label">{label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      {error && <div className="checkout-error">{error}</div>}

      <div className="checkout-layout">
        {/* Left Column: Form */}
        <form onSubmit={handlePlaceOrder} className="checkout-form-section" id="checkout-form">
          
          <div className={`checkout-card accordion-card ${expandedSections['shipping'] ? 'expanded' : ''}`}>
            <div className="accordion-header" onClick={() => toggleSection('shipping')}>
              <h2 className="checkout-card-title" style={{ margin: 0 }}>
                <span className="card-step-number">1</span> Shipping Details
              </h2>
              <svg className="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSections['shipping'] ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {expandedSections['shipping'] && (
              <div className="checkout-accordion-body" style={{ marginTop: '1.5rem' }}>
                {savedAddresses.length > 0 && (
                  <div className="saved-addresses-section" style={{ position: 'relative', zIndex: 10 }}>
                    <p className="saved-addresses-hint">Select a saved address or enter a new one below:</p>
                    <div className="custom-dropdown-container" style={{ position: 'relative' }}>
                      <div 
                        className="coupon-input custom-dropdown-trigger" 
                        onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span>
                          {selectedAddressIdx !== null 
                            ? `${savedAddresses[selectedAddressIdx].fullName} - ${savedAddresses[selectedAddressIdx].city}`
                            : '-- SELECT SAVED ADDRESS --'}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isAddressDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                      
                      {isAddressDropdownOpen && (
                        <div className="custom-dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E4E4E7', borderRadius: '12px', marginTop: '8px', zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                          {savedAddresses.map((addr, idx) => (
                            <div 
                              key={idx}
                              className="custom-dropdown-item"
                              onClick={() => {
                                handleSelectAddress(addr);
                                setSelectedAddressIdx(idx);
                                setIsAddressDropdownOpen(false);
                              }}
                              style={{ padding: '12px 16px', borderBottom: idx < savedAddresses.length - 1 ? '1px solid #f1f1f1' : 'none', cursor: 'pointer', transition: 'background 0.2s', fontSize: '0.9rem', color: '#333' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#FFF6F8'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ fontWeight: 600, marginBottom: '4px', color: '#D81B60' }}>{addr.fullName}</div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>{addr.address}, {addr.city} {addr.postalCode}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <h3 className="form-group-title">Personal Information</h3>
                  <div className="form-grid">
                    <div className="input-group full-width">
                      <label>Full Name</label>
                      <input type="text" name="fullName" required value={shippingAddress.fullName} onChange={handleChange} placeholder="Enter your full name" />
                    </div>
                    <div className="input-group full-width">
                      <label>Phone Number</label>
                      <input type="tel" name="phone" required value={shippingAddress.phone} onChange={handleChange} placeholder="Enter your phone number" />
                    </div>
                    <div className="input-group full-width">
                      <label>Email Address (for payment receipt)</label>
                      <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Enter your email address" />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <h3 className="form-group-title">Shipping Address</h3>
                  <div className="form-grid">
                    <div className="input-group full-width">
                      <label>Street Address</label>
                      <input type="text" name="address" required value={shippingAddress.address} onChange={handleChange} placeholder="House no, street, area" />
                    </div>
                    <div className="input-group">
                      <label>City</label>
                      <input type="text" name="city" required value={shippingAddress.city} onChange={handleChange} placeholder="Enter your city" />
                    </div>
                    <div className="input-group">
                      <label>PIN Code</label>
                      <input type="text" name="postalCode" required value={shippingAddress.postalCode} onChange={handleChange} placeholder="6-digit PIN" />
                    </div>
                    <div className="input-group full-width">
                      <label>Country</label>
                      <input type="text" name="country" required value={shippingAddress.country} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`checkout-card accordion-card ${expandedSections['payment'] ? 'expanded' : ''}`}>
            <div className="accordion-header" onClick={() => toggleSection('payment')}>
              <h2 className="checkout-card-title" style={{ margin: 0 }}>
                <span className="card-step-number">2</span> Payment Method
              </h2>
              <svg className="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSections['payment'] ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {expandedSections['payment'] && (
              <div className="checkout-accordion-body" style={{ marginTop: '1.5rem' }}>
                <div className="payment-options">
                  <div className="payu-notice" style={{ padding: '1rem', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #E9ECEF', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 600 }}>Secure Payment by PayU</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#6C757D' }}>All major Credit Cards, Debit Cards, UPI, and Netbanking are supported. You will be redirected to PayU securely to complete your purchase.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </form>

        {/* Right Column: Order Summary */}
        <div className="checkout-summary-section">
          <div className="checkout-summary-card">
            <h2 className="summary-card-title">Order Summary</h2>
            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={`${item._id}`} className="summary-item">
                  <div className="summary-item-img">
                    <Image src={item.image} alt={item.name} width={84} height={104} />
                    <span className="summary-item-qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item-details">
                    <span className="summary-item-name">{item.name}</span>
                    <span className="summary-item-meta">Qty: {item.quantity}</span>
                    <span className="summary-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="coupon-box">
              {appliedDiscount ? (
                <div className="coupon-applied">
                  <span className="coupon-applied-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: '-2px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {appliedDiscount.code} applied
                  </span>
                  <button type="button" className="coupon-remove-btn" onClick={removeAppliedDiscount}>Remove</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                    <input
                      type="text"
                      className="coupon-input"
                      placeholder="Enter coupon code"
                      value={discountCode}
                      onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(''); }}
                      style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #E4E4E7', borderRadius: '8px', fontSize: '0.85rem', textTransform: 'uppercase' }}
                    />
                    <button
                      type="button"
                      className="coupon-apply-btn"
                      onClick={applyDiscountCode}
                      disabled={discountLoading}
                      style={{ padding: '0.6rem 1rem', background: '#C2185B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: discountLoading ? 'wait' : 'pointer' }}
                    >
                      {discountLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {discountError && <div style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '0.4rem' }}>{discountError}</div>}
                </>
              )}
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartTotalPrice.toLocaleString('en-IN')}</span>
            </div>
            {appliedDiscount && appliedDiscount.discountAmount > 0 && (
              <div className="summary-row">
                <span>Discount ({appliedDiscount.code})</span>
                <span style={{ color: '#059669' }}>-₹{appliedDiscount.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>

            <div className="summary-divider dashed-pink"></div>

            <div className="delivery-estimate">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              <span>Estimated delivery by <strong>{deliveryDate}</strong></span>
            </div>
            <div className="summary-divider solid-pink"></div>
            <div className="summary-row total-row" style={{ flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span className="total-label">Total To Pay</span>
                <span className="total-amount">₹{Math.max(0, totalAfterDiscount).toLocaleString('en-IN')}</span>
              </div>
              <span className="total-subtext">(Taxes, discounts and shipping calculated at checkout)</span>
            </div>

            <button 
              type="submit"
              className="place-order-btn" 
              disabled={isProcessing}
              style={{ opacity: (agreePolicies && agreeMarketing) ? 1 : 0.5, transition: 'opacity 0.3s ease' }}
              form="checkout-form"
            >
              {isProcessing ? 'Processing Order...' : 'Place Order →'}
            </button>
            <div className="checkout-policies" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#4b5563', cursor: 'pointer', lineHeight: 1.4 }}>
                <input type="checkbox" checked={agreePolicies} onChange={(e) => { setAgreePolicies(e.target.checked); setError(''); }} style={{ marginTop: '0.2rem', accentColor: '#C2185B' }} />
                <span>I agree to the <Link href="/terms-and-conditions" target="_blank" style={{ color: '#C2185B', textDecoration: 'underline' }}>Terms & Conditions</Link> and <Link href="/privacy-policy" target="_blank" style={{ color: '#C2185B', textDecoration: 'underline' }}>Privacy Policy</Link> of Suki Ethnic. <span style={{color:'red'}}>*</span></span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: '#4b5563', cursor: 'pointer', lineHeight: 1.4 }}>
                <input type="checkbox" checked={agreeMarketing} onChange={(e) => setAgreeMarketing(e.target.checked)} style={{ marginTop: '0.2rem', accentColor: '#C2185B' }} />
                <span>I agree to receive offers, updates, and promotional messages from Suki Ethnic via Email, SMS, or WhatsApp. <span style={{color:'red'}}>*</span></span>
              </label>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
