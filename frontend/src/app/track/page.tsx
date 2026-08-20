"use client";
import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface TrackedItem {
  name: string;
  quantity: number;
  image: string;
  price: number;
}

interface TrackedOrder {
  _id: string;
  status: string;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
  updatedAt?: string;
  trackingLink?: string;
  totalPrice: number;
  orderItems: TrackedItem[];
}

type Step = { label: string; done: boolean; date?: string };

function buildSteps(order: TrackedOrder): Step[] {
  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined;

  if (order.status === 'Pending Payment' || order.status === 'Payment Failed') {
    return [{ label: 'Order placed', done: true, date: fmt(order.createdAt) }];
  }

  const steps: Step[] = [
    { label: 'Order placed', done: true, date: fmt(order.createdAt) },
    { label: 'Processing', done: order.status !== 'Pending Payment' && order.status !== 'Payment Failed', date: fmt(order.updatedAt) },
    { label: 'Shipped', done: order.status === 'Shipped' || order.status === 'Delivered', date: order.status === 'Shipped' || order.status === 'Delivered' ? fmt(order.updatedAt) : undefined },
    { label: 'Delivered', done: order.status === 'Delivered', date: fmt(order.deliveredAt) },
  ];
  return steps;
}

function TrackContent() {
  const searchParams = useSearchParams();
  const [orderIdInput, setOrderIdInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('token');
    if (orderId) {
      setOrderIdInput(orderId);
      if (token) setTokenInput(token);
    }
  }, [searchParams]);

  const lookUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = orderIdInput.trim();
    if (!orderId) {
      setError('Please enter your order ID.');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const params = new URLSearchParams({ orderId });
      if (tokenInput.trim()) params.set('token', tokenInput.trim());
      const headers: Record<string, string> = {};
      const authToken = localStorage.getItem('suki_token');
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      if (tokenInput.trim()) headers['x-session-token'] = tokenInput.trim();

      const res = await fetch(`/api/orders/track/${orderId}?${params.toString()}`, { headers });
      if (res.ok) {
        setOrder(await res.json());
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Order not found or you are not authorized to view it.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setTracked(true);
    }
  };

  const steps = order ? buildSteps(order) : [];

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '760px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ color: '#C2185B', fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 700, textAlign: 'center' }}>Track Your Order</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem', textAlign: 'center' }}>
        Enter the order ID from your confirmation email to see the latest status.
      </p>

      <form onSubmit={lookUp} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Order ID (e.g. 62f1a9c1b3d4e5f6a7b8c9d0)"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem' }}
        />
        <input
          type="text"
          placeholder="Session token (for guest orders, optional)"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: 'none', background: '#C2185B', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Checking…' : 'Track Order'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '8px', background: '#ffe8e8', color: '#d32f2f', textAlign: 'center', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {order && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Order ID</div>
              <div style={{ fontWeight: 600, color: '#111' }}>{order._id}</div>
            </div>
            <span style={{ padding: '0.4rem 0.9rem', borderRadius: '999px', fontWeight: 600, fontSize: '0.85rem', background: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Shipped' ? '#e0e7ff' : order.status === 'Processing' ? '#ffedd5' : '#fee2e2', color: order.status === 'Delivered' ? '#15803d' : order.status === 'Shipped' ? '#4338ca' : order.status === 'Processing' ? '#ea580c' : '#b91c1c' }}>
              {order.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2rem' }}>
            {steps.map((step, i) => (
              <React.Fragment key={step.label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '0 0 auto', width: '100px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: step.done ? '#C2185B' : '#e5e7eb', border: step.done ? 'none' : '3px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {step.done && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: step.done ? 600 : 400, color: step.done ? '#111' : '#9ca3af' }}>{step.label}</div>
                  {step.date && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>{step.date}</div>}
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: '3px', marginTop: '9px', background: steps[i + 1].done ? '#C2185B' : '#e5e7eb' }} />}
              </React.Fragment>
            ))}
          </div>

          {order.status === 'Pending Payment' && (
            <div style={{ padding: '1rem', borderRadius: '8px', background: '#fef3c7', color: '#b45309', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Your order is awaiting payment. Once payment is confirmed, we&apos;ll start processing it.
            </div>
          )}
          {order.status === 'Payment Failed' && (
            <div style={{ padding: '1rem', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Payment for this order failed. Please <Link href="/cart" style={{ color: '#b91c1c', textDecoration: 'underline' }}>try again</Link> or contact support.
            </div>
          )}

          {order.trackingLink && (
            <div style={{ marginBottom: '1.5rem' }}>
              <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#C2185B', fontWeight: 600, textDecoration: 'underline' }}>
                View courier tracking →
              </a>
            </div>
          )}

          <div style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', background: '#fafafa', fontWeight: 600, color: '#111', borderBottom: '1px solid #eee' }}>Items</div>
            {order.orderItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: i < order.orderItems.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <Image src={item.image || '/placeholder.jpg'} alt={item.name} width={48} height={48} style={{ borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#111' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Qty {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 600, color: '#111' }}>₹{item.price * item.quantity}</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#fafafa', fontWeight: 700, color: '#111' }}>
              <span>Total</span>
              <span>₹{order.totalPrice}</span>
            </div>
          </div>
        </div>
      )}

      {!order && !loading && !error && tracked && (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>We couldn&apos;t load that order. Double-check the ID and try again.</p>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}><div className="spinner" /></div>}>
      <TrackContent />
    </Suspense>
  );
}