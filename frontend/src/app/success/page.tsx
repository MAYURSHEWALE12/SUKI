"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './success.css';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verified, setVerified] = useState(false);
  const [order, setOrder] = useState<{ _id: string; totalPrice?: number } | null>(null);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      router.replace('/');
      return;
    }

    const verifyOrder = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          setVerified(true);
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
        <div className="success-card">
          <div className="spinner" />
          <p>Verifying your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page container">
      <div className="success-card">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1 className="success-title">Order Confirmed!</h1>
        <p className="success-message">
          Thank you for your purchase. We've received your order
          {order?._id && <> (ID: <strong>{order._id.slice(-8).toUpperCase()}</strong>)</>} and are getting it ready to be shipped.
          You will receive an email confirmation shortly.
        </p>
        <Link href="/" className="btn btn-primary continue-shopping-btn">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
