"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';


import React, { Suspense } from 'react';

interface OrderItem {
  _id?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  size?: string;
}

interface Order {
  _id?: string;
  createdAt?: string;
  itemsPrice?: number;
  shippingPrice?: number;
  totalPrice?: number;
  orderItems?: OrderItem[];
  user?: { name?: string; phone?: string };
  shippingAddress?: {
    fullName?: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [verified, setVerified] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [fallbackOrderDate] = useState(() => Date.now());
  const [estimatedDelivery = ''] = useState(() =>
    new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
  );

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.self !== window.top) {
        window.top!.location.href = window.location.href;
      } else if (window.opener && !window.opener.closed) {
        window.opener.location.href = window.location.href;
        window.close();
      }
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      router.replace('/');
      return;
    }

    const verifyOrder = async () => {
      try {
        const token = localStorage.getItem('suki_token');
        const sessionToken = sessionStorage.getItem(`suki_order_token_${orderId}`);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (sessionToken) headers['x-session-token'] = sessionToken;

        const res = await fetch(`/api/orders/${orderId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          setVerified(true);
          clearCart(); // Clear the cart now that the order is confirmed
        } else {
          router.replace('/');
        }
      } catch {
        router.replace('/');
      }
    };

    verifyOrder();
  }, [orderId, router, clearCart]);

  
  const handleDownloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const element = document.getElementById('pdf-receipt-template');
      if (!element) return;
      
      element.style.display = 'block';
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      
      element.style.display = 'none';
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Suki_Receipt_${order?._id?.substring(0, 8) || 'Order'}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };


  if (!verified) {
    return (
      <div className="success-page container">
        <div className="success-card verifying-card">
          <div className="verifying-spinner-container">
            <div className="verifying-spinner"></div>
            <svg className="verifying-sparkle" viewBox="0 0 24 24" fill="#D81B60"><path d="M12 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z"/></svg>
          </div>
          <h2 className="verifying-title">Verifying your order...</h2>
          <div className="verifying-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page container">
      <div className="success-card receipt-card">
        <div className="success-icon">
          {/* Sparkles around checkmark */}
          <svg style={{position:'absolute', top:'-10px', right:'-5px'}} width="20" height="20" viewBox="0 0 24 24" fill="#F472B6"><path d="M12 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z"/></svg>
          <svg style={{position:'absolute', bottom:'-5px', left:'-5px'}} width="14" height="14" viewBox="0 0 24 24" fill="#F472B6"><path d="M12 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z"/></svg>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1 className="success-title">Order Confirmed!</h1>
        <p className="success-message">
          Thank you for your purchase.<br />
          We&apos;ve received your order and are getting it<br />
          ready to be shipped.
        </p>

        <div className="receipt-container">
          <div className="receipt-header">
            <div className="receipt-header-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <div className="receipt-header-info">
                <span className="receipt-label">Order Number</span>
                <span className="receipt-value">#{order?._id?.substring(0, 8).toUpperCase() || 'CFB8967'}</span>
              </div>
            </div>
            <div className="receipt-header-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <div className="receipt-header-info">
                <span className="receipt-label">Order Date</span>
                <span className="receipt-value">{new Date(order?.createdAt || fallbackOrderDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="order-summary-divider">
            <span>Order Summary</span>
          </div>

          <div className="receipt-items">
            {order?.orderItems?.map((item: OrderItem, index: number) => (
              <div key={index} className="receipt-item">
                <div className="receipt-item-image">
                  <Image src={item.image || '/placeholder.jpg'} alt={item.name} width={60} height={80} style={{ objectFit: 'cover' }} />
                </div>
                <div className="receipt-item-details">
                  <div className="receipt-item-name">{item.name}</div>
                  <div className="receipt-item-meta">Size: {item.size || 'Free Size'} | Qty: {item.quantity}</div>
                </div>
                <div className="receipt-item-price">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>

          <div className="receipt-summary">
            <div className="receipt-summary-col">
              <span className="summary-col-label">Subtotal</span>
              <span className="summary-col-value">₹{(order?.itemsPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="receipt-summary-col">
              <span className="summary-col-label">Shipping</span>
              <span className={`summary-col-value ${(order?.shippingPrice || 0) === 0 ? 'free' : ''}`}>{(order?.shippingPrice || 0) === 0 ? 'Free' : `₹${(order?.shippingPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
            </div>
            <div className="receipt-summary-col">
              <span className="summary-col-label">Total Amount</span>
              <span className="summary-col-value total">₹{(order?.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="delivery-estimate-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            <span>Estimated delivery by <strong>{estimatedDelivery}</strong></span>
          </div>
        </div>

        <div className="success-actions">
          <Link href="/" className="continue-shopping-btn">
            Continue Shopping
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
          <button className="btn-print no-print" onClick={() => setShowReceiptModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            DOWNLOAD RECEIPT
          </button>
        </div>
      
      {showReceiptModal && order && (
        <div className="receipt-modal-overlay no-print" onClick={() => setShowReceiptModal(false)}>
          <div className="receipt-modal-content-wrapper" style={{ maxWidth: "850px" }} onClick={e => e.stopPropagation()}>
            <div className="receipt-modal-header no-print">
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#111' }}>Receipt Preview</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleDownloadPDF} className="btn-modal-print">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download PDF
                </button>
                <button onClick={() => setShowReceiptModal(false)} className="btn-modal-close">✕</button>
              </div>
            </div>
            
            {/* Visible Responsive Preview */}
            <div id="visible-receipt-preview" style={{
              width: '100%',
              maxWidth: '800px',
              background: 'white',
              fontFamily: 'Inter, sans-serif',
              color: '#111',
              boxSizing: 'border-box',
              margin: '0 auto',
            }}>
              <style dangerouslySetInnerHTML={{__html: `
                .r-body { padding: 5vw; }
                .r-flex-col { display: flex; flex-direction: column; gap: 20px; }
                .r-title { font-size: clamp(24px, 5vw, 32px); }
                .r-box { padding: 15px; min-width: 100%; border-radius: 8px; }
                .r-total-box { flex-direction: column; align-items: flex-start !important; gap: 10px; }
                .r-total-text { font-size: 20px !important; }
                .r-total-val { font-size: 24px !important; }
                @media (min-width: 600px) {
                  .r-body { padding: 30px 40px; }
                  .r-flex-col { flex-direction: row; justify-content: space-between; }
                  .r-box { min-width: 220px; padding: 15px 20px; }
                  .r-total-box { flex-direction: row; align-items: center !important; }
                  .r-total-text { font-size: 22px !important; }
                  .r-total-val { font-size: 28px !important; }
                }
              `}} />
              <div style={{ border: 'clamp(3px, 1vw, 8px) solid #FCE4EC', padding: '2px', background: 'white' }}>
                <div style={{ border: '2px solid #C2185B', background: 'white', padding: '0' }}>
                  
                  <div style={{ background: '#FFF6F8', padding: '20px 20px 10px', textAlign: 'center', borderBottom: '2px solid #C2185B', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Philosopher, serif', fontSize: 'clamp(40px, 8vw, 64px)', lineHeight: '1', color: '#C2185B', textTransform: 'lowercase', letterSpacing: '2px' }}>suki</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(10px, 2vw, 14px)', letterSpacing: 'clamp(6px, 1.5vw, 12px)', color: '#C2185B', textTransform: 'uppercase', marginTop: '8px', marginLeft: '12px' }}>Ethnic</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 10px', color: '#C2185B' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>
                    </div>
                  </div>

                  <div className="r-body">
                    <div className="r-flex-col">
                      <div>
                        <h1 className="r-title" style={{ color: '#C2185B', margin: '0 0 10px 0', textTransform: 'uppercase' }}>PACKING SLIP</h1>
                        <p style={{ margin: 0, color: '#444', fontSize: 'clamp(14px, 3vw, 16px)' }}>Thank you for shopping with Suki Ethnic!</p>
                        
                        <div style={{ marginTop: '25px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C2185B', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            SHIP TO
                          </div>
                          <div style={{ borderTop: '1px solid #FCE4EC', paddingTop: '15px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: 'clamp(14px, 3vw, 16px)', textTransform: 'uppercase', marginBottom: '8px' }}>{order?.user?.name || order?.shippingAddress?.fullName || 'Customer'}</div>
                            <div style={{ color: '#444', fontSize: 'clamp(12px, 2.5vw, 14px)', lineHeight: '1.5', marginBottom: '8px' }}>
                              {order?.shippingAddress?.address} <br/>
                              {order?.shippingAddress?.city}, {order?.shippingAddress?.postalCode}<br/>
                              {order?.shippingAddress?.country}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="r-box" style={{ background: '#FFF6F8' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <div style={{ background: '#FCE4EC', padding: '10px', borderRadius: '50%', color: '#C2185B', height: 'fit-content' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>ORDER ID</div>
                            <div style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 'bold', color: '#C2185B', marginBottom: '15px' }}>#{order?._id?.substring(0, 8).toUpperCase()}</div>
                            
                            <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>ORDER DATE</div>
                            <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: '#111', marginTop: '4px' }}>
                              {new Date(order?.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderBottom: '1px dashed #F8BBD0', margin: '15px 0' }}></div>

                    <div style={{ background: '#FFF6F8', borderRadius: '8px', padding: '15px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', color: '#C2185B', fontSize: '12px', paddingBottom: '10px' }}>ITEM</th>
                            <th style={{ textAlign: 'right', color: '#C2185B', fontSize: '12px', paddingBottom: '10px' }}>QTY</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order?.orderItems?.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: '6px 0', borderTop: '1px dashed #F8BBD0', fontWeight: '500', fontSize: 'clamp(13px, 3vw, 15px)' }}>{item.name}</td>
                              <td style={{ padding: '6px 0', borderTop: '1px dashed #F8BBD0', textAlign: 'right', fontWeight: 'bold', fontSize: 'clamp(13px, 3vw, 15px)' }}>{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="r-total-box" style={{ background: '#FFF6F8', borderRadius: '8px', padding: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="r-total-text" style={{ fontWeight: '900', color: '#111' }}>TOTAL PAID</span>
                      </div>
                      <div className="r-total-val" style={{ fontWeight: '900', color: '#C2185B' }}>
                        Rs {(order?.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ background: '#FFF6F8', padding: '10px', display: 'flex', justifyContent: 'center', borderTop: '2px solid #C2185B' }}>
                    <span style={{ color: '#C2185B', fontSize: '12px', fontWeight: 'bold' }}>sukiethnic.com</span>
                  </div>
                </div>
              </div>
            </div>
            {/* End Visible Preview */}

            {/* Hidden PDF Template */}
            <div id="pdf-receipt-template" style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px', width: '800px', background: 'white', fontFamily: 'Inter, sans-serif', color: '#111', boxSizing: 'border-box' }}>
              <div style={{ border: '8px solid #FCE4EC', padding: '2px', background: 'white' }}>
                <div style={{ border: '2px solid #C2185B', background: 'white', padding: '0' }}>
                  
                  {/* Header */}
                  <div style={{ background: '#FFF6F8', padding: '20px 20px 10px', textAlign: 'center', borderBottom: '2px solid #C2185B', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Philosopher, serif', fontSize: '64px', lineHeight: '1', color: '#C2185B', textTransform: 'lowercase', letterSpacing: '2px' }}>suki</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', letterSpacing: '12px', color: '#C2185B', textTransform: 'uppercase', marginTop: '8px', marginLeft: '12px' }}>Ethnic</span>
                    </div>
                    
                    <div style={{ position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 10px', color: '#C2185B' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '30px 40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h1 style={{ color: '#C2185B', fontSize: '32px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>PACKING SLIP</h1>
                        <p style={{ margin: 0, color: '#444', fontSize: '16px' }}>Thank you for shopping with Suki Ethnic!</p>
                        
                        <div style={{ marginTop: '25px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C2185B', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            SHIP TO
                          </div>
                          <div style={{ borderTop: '1px solid #FCE4EC', paddingTop: '15px', width: '250px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', marginBottom: '8px' }}>{order?.user?.name || order?.shippingAddress?.fullName || 'Customer'}</div>
                            <div style={{ color: '#444', fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' }}>
                              {order?.shippingAddress?.address} <br/>
                              {order?.shippingAddress?.city}, {order?.shippingAddress?.postalCode}<br/>
                              {order?.shippingAddress?.country}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#444', fontSize: '14px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                              {order?.shippingAddress?.phone || order?.user?.phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#FFF6F8', padding: '15px 20px', borderRadius: '12px', minWidth: '220px' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                          <div style={{ background: '#FCE4EC', padding: '12px', borderRadius: '50%', color: '#C2185B', height: 'fit-content' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>ORDER ID</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#C2185B', marginBottom: '15px' }}>#{order?._id?.substring(0, 8).toUpperCase()}</div>
                            
                            <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>ORDER DATE</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: '#111', marginTop: '4px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                              {new Date(order?.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderBottom: '1px dashed #F8BBD0', margin: '20px 0' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C2185B', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      ITEMS (PACKING SLIP)
                    </div>

                    <div style={{ background: '#FFF6F8', borderRadius: '12px', padding: '20px 30px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', color: '#C2185B', fontSize: '12px', paddingBottom: '15px' }}>ITEM</th>
                            <th style={{ textAlign: 'right', color: '#C2185B', fontSize: '12px', paddingBottom: '15px' }}>QTY</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order?.orderItems?.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: '8px 0', borderTop: '1px dashed #F8BBD0', fontWeight: '500', fontSize: '15px' }}>{item.name}</td>
                              <td style={{ padding: '8px 0', borderTop: '1px dashed #F8BBD0', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ background: '#FFF6F8', borderRadius: '12px', padding: '15px 20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#FCE4EC', padding: '10px', borderRadius: '50%', color: '#C2185B', border: '2px solid #C2185B' }}>
                          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>₹</span>
                        </div>
                        <span style={{ fontSize: '22px', fontWeight: '900', color: '#111' }}>TOTAL PAID</span>
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: '#C2185B' }}>
                        Rs {(order?.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '25px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#C2185B" stroke="#C2185B" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                      <div style={{ fontFamily: 'var(--font-title)', fontSize: '28px', color: '#555', fontStyle: 'italic', marginTop: '10px' }}>
                        Thank you for shopping with Suki Ethnic!
                      </div>
                      <div style={{ display: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                        <div style={{ width: '60px', height: '1px', background: '#F8BBD0', margin: 'auto 0' }}></div>
                        <div style={{ width: '60px', height: '1px', background: '#F8BBD0', margin: 'auto 0' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div style={{ background: '#FFF6F8', padding: '10px', display: 'flex', justifyContent: 'center', gap: '15px', borderTop: '2px solid #C2185B' }}>
                    <span style={{ color: '#C2185B', fontSize: '14px', fontWeight: 'bold' }}>sukiethnic.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="success-page container"><div className="spinner" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
