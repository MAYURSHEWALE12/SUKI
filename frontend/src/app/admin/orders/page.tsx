"use client";
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const downloadPDFLabel = (order: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [4, 6]
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SUKI ETHNIC", 0.25, 0.4);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("ORDER ID: #" + order._id.substring(0, 8).toUpperCase(), 0.25, 0.6);

    doc.line(0.25, 0.75, 3.75, 0.75);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", 0.25, 1.1);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(order.user?.name || order.shippingAddress.fullName || 'Customer', 0.25, 1.35);
    
    // Handle long addresses
    const splitAddress = doc.splitTextToSize(order.shippingAddress.address, 3.5);
    doc.text(splitAddress, 0.25, 1.55);
    
    const yAfterAddress = 1.55 + (splitAddress.length * 0.2);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`, 0.25, yAfterAddress);
    doc.text(order.shippingAddress.country, 0.25, yAfterAddress + 0.2);
    doc.text(`Phone: ${order.shippingAddress.phone || order.user?.phone || 'N/A'}`, 0.25, yAfterAddress + 0.4);

    const lineY = yAfterAddress + 0.65;
    doc.line(0.25, lineY, 3.75, lineY);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PACKING SLIP (ITEMS):", 0.25, lineY + 0.3);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let currentY = lineY + 0.55;
    order.orderItems.forEach((item: any) => {
      const itemText = `${item.quantity}x ${item.name} (Size: ${item.size})`;
      const splitItem = doc.splitTextToSize(itemText, 3.5);
      doc.text(splitItem, 0.25, currentY);
      currentY += (splitItem.length * 0.18) + 0.05;
    });

    doc.line(0.25, 5.5, 3.75, 5.5);
    doc.setFontSize(8);
    doc.text("Thank you for shopping with Suki Ethnic!", 2, 5.7, { align: "center" });

    doc.save(`suki-label-${order._id.substring(0,8).toUpperCase()}.pdf`);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('suki_admin_token');
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('suki_admin_token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Orders Management</h1>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Order ID</th>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Date</th>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Total</th>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Status</th>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <React.Fragment key={order._id}>
                <tr style={{ borderBottom: expandedOrderId === order._id ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                        style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}
                      >
                        {expandedOrderId === order._id ? '▼' : '▶'}
                      </button>
                      #{order._id.substring(0, 8).toUpperCase()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: '#aaa' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: '#d4af37' }}>₹{order.totalPrice.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.4rem 1rem', 
                      borderRadius: '50px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      backgroundColor: order.status === 'Processing' ? 'rgba(212, 175, 55, 0.15)' : (order.status === 'Shipped' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)'),
                      color: order.status === 'Processing' ? '#f3e5ab' : (order.status === 'Shipped' ? '#93c5fd' : '#86efac'),
                      border: `1px solid ${order.status === 'Processing' ? 'rgba(212, 175, 55, 0.3)' : (order.status === 'Shipped' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(34, 197, 94, 0.3)')}`
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      disabled={updating === order._id}
                      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(212, 175, 55, 0.3)', cursor: 'pointer', backgroundColor: '#111', color: '#fff' }}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                </tr>
                {expandedOrderId === order._id && (
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <td colSpan={5} style={{ padding: '2rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ color: '#d4af37', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Items</h4>
                            <button 
                              onClick={() => downloadPDFLabel(order)}
                              style={{ 
                                backgroundColor: '#d4af37', 
                                color: '#111', 
                                border: 'none', 
                                padding: '0.4rem 0.8rem', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem', 
                                fontWeight: 'bold', 
                                cursor: 'pointer', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.5px' 
                              }}
                            >
                              ⬇️ Download PDF Label
                            </button>
                          </div>
                          {order.orderItems.map((item: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                              <img src={item.image} alt={item.name} style={{ width: '50px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                              <div>
                                <div style={{ color: '#fff', fontWeight: 500 }}>{item.name}</div>
                                <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Size: {item.size} | Qty: {item.quantity}</div>
                              </div>
                              <div style={{ marginLeft: 'auto', color: '#fff' }}>₹{item.price * item.quantity}</div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <h4 style={{ color: '#d4af37', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Shipping Details</h4>
                          <div style={{ padding: '1rem', backgroundColor: '#111', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: '#ccc', lineHeight: '1.6', fontSize: '0.9rem' }}>
                            <div style={{ color: '#fff', fontWeight: 500, marginBottom: '0.5rem' }}>{order.user?.name || order.shippingAddress.fullName || 'Customer'}</div>
                            <div>{order.shippingAddress.address}</div>
                            <div>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</div>
                            <div>{order.shippingAddress.country}</div>
                            <div style={{ marginTop: '0.5rem', color: '#aaa' }}>Phone: {order.shippingAddress.phone || order.user?.phone || 'N/A'}</div>
                            <div style={{ color: '#aaa' }}>Email: {order.user?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
