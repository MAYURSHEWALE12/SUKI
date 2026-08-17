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
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [verified, setVerified] = useState(false);
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
  }, [orderId, router]);

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
                <span className="receipt-value">#{order?._id?.slice(-8).toUpperCase() || 'CFB8967'}</span>
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
          <button className="btn-print" onClick={() => window.print()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Receipt
          </button>
        </div>
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
