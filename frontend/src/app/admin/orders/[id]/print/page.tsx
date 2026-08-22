"use client";
import React, { useEffect, useState, use } from 'react';

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  _id: string;
  user?: { name?: string; phone?: string };
  shippingAddress: {
    fullName?: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  orderItems: OrderItem[];
}

export default function PrintOrderLabel({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('suki_admin_token');
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          const foundOrder = data.find((o: Order) => o._id === id);
          setOrder(foundOrder);
        }
      } catch (error) {
        console.error('Error fetching order for print:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  

  if (loading) return <div style={{ padding: '2rem', color: 'black', background: 'white', minHeight: '100vh' }}>Loading label...</div>;
  if (!order) return <div style={{ padding: '2rem', color: 'black', background: 'white', minHeight: '100vh' }}>Order not found.</div>;

  return (
    <div style={{ background: '#f4f4f5', color: 'black', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '4in', margin: '0 auto 2rem auto', display: 'flex', justifyContent: 'flex-end' }} className="no-print">
        <button 
          onClick={() => window.print()}
          style={{
            background: '#C2185B',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(194, 24, 91, 0.2)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Save / Print Receipt
        </button>
      </div>
      <div className="print-label-container" style={{
        width: '4in',
        height: '6in',
        padding: '0.25in',
        background: 'white',
        color: 'black',
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
        border: '1px solid #ccc',
        margin: '0 auto',
        position: 'relative'
      }}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-label-container, .print-label-container * {
              visibility: visible;
            }
            .print-label-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 4in;
              height: 6in;
              border: none !important;
              padding: 0.1in !important;
              margin: 0 !important;
            }
            @page { size: 4in 6in; margin: 0; }
          }
        `}} />

        <div style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '2px' }}>SUKI ETHNIC</h1>
          <div style={{ fontSize: '12px', textAlign: 'right' }}>
            <strong>ORDER ID:</strong><br />
            #{order._id.substring(0, 8).toUpperCase()}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px', textTransform: 'uppercase' }}>Ship To:</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{order.user?.name || order.shippingAddress.fullName || 'Customer'}</div>
          <div style={{ fontSize: '14px', lineHeight: '1.4', marginTop: '4px' }}>
            {order.shippingAddress.address}<br />
            {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.country}
          </div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Phone: {order.shippingAddress.phone || order.user?.phone || 'N/A'}
          </div>
        </div>

        <div style={{ borderTop: '2px solid black', paddingTop: '10px' }}>
          <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px', textTransform: 'uppercase' }}>Packing Slip (Items):</div>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                <th style={{ paddingBottom: '4px' }}>Item</th>
                <th style={{ paddingBottom: '4px', textAlign: 'center' }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item: OrderItem, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 0' }}>{item.name}</td>
                  <td style={{ padding: '6px 0', textAlign: 'center' }}><strong>{item.quantity}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ position: 'absolute', bottom: '0.25in', left: '0.25in', right: '0.25in', textAlign: 'center', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
          <div style={{ fontSize: '10px', color: '#555' }}>
            Thank you for shopping with Suki Ethnic!<br />
            sukiethnic.com
          </div>
        </div>
      </div>
    </div>
  );
}
