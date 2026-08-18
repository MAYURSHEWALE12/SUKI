"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';

interface OrderItem {
  name: string;
  image?: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  user?: { name?: string; phone?: string; email?: string };
  shippingAddress: {
    fullName?: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  orderItems: OrderItem[];
  trackingLink?: string;
  adminNotes?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // New Features State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  
  // Notes and Tracking state for inputs
  const [trackingLinks, setTrackingLinks] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const downloadPDFLabel = (order: Order) => {
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
    order.orderItems.forEach((item: OrderItem) => {
      const itemText = `${item.quantity}x ${item.name}`;
      const splitItem = doc.splitTextToSize(itemText, 3.5);
      doc.text(splitItem, 0.25, currentY);
      currentY += (splitItem.length * 0.18) + 0.05;
    });

    doc.line(0.25, 5.5, 3.75, 5.5);
    doc.setFontSize(8);
    doc.text("Thank you for shopping with Suki Ethnic!", 2, 5.7, { align: "center" });

    doc.save(`suki-label-${order._id.substring(0,8).toUpperCase()}.pdf`);
  };

  const fetchOrders = useCallback(() => {
    const req = async () => {
      const token = localStorage.getItem('suki_admin_token');
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return { ok: res.ok, orders: data };
    };
    req()
      .then(({ ok, orders }) => {
        if (ok) {
          setOrders(orders);

          // Initialize tracking/notes state
          const initialTracking: Record<string, string> = {};
          const initialNotes: Record<string, string> = {};
          orders.forEach((o: Order) => {
            initialTracking[o._id] = o.trackingLink || '';
            initialNotes[o._id] = o.adminNotes || '';
          });
          setTrackingLinks(initialTracking);
          setAdminNotes(initialNotes);
        }
      })
      .catch((error) => {
        console.error('Error fetching orders:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
        body: JSON.stringify({ 
          status: newStatus,
          trackingLink: trackingLinks[orderId],
          adminNotes: adminNotes[orderId]
        })
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

  const handleBulkUpdate = async (status: string) => {
    if (selectedOrders.size === 0) return;
    setLoading(true);
    const token = localStorage.getItem('suki_admin_token');
    
    // Process sequentially to avoid overwhelming server
    for (const orderId of Array.from(selectedOrders)) {
      try {
        await fetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status })
        });
      } catch (err) {
        console.error("Bulk update failed for", orderId, err);
      }
    }
    
    setSelectedOrders(new Set());
    await fetchOrders();
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(new Set(currentOrders.map((o: Order) => o._id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const toggleSelectOrder = (id: string) => {
    const next = new Set(selectedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrders(next);
  };

  // Filter and Pagination Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o: Order) => {
      const searchStr = searchTerm.toLowerCase();
      const customerName = (o.user?.name || o.shippingAddress?.fullName || '').toLowerCase();
      const idMatch = o._id.toLowerCase().includes(searchStr);
      const nameMatch = customerName.includes(searchStr);
      return idMatch || nameMatch;
    });
  }, [orders, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && orders.length === 0) return <div>Loading orders...</div>;

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '0.25rem' }}>Orders Management</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>View and manage all customer orders efficiently.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search Order ID or Customer..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.6rem 1rem 0.6rem 2.2rem', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '320px', fontSize: '0.85rem' }}
            />
          </div>
          <button className="admin-btn-primary" style={{ background: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Orders
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Bulk Actions Toolbar */}
        {selectedOrders.size > 0 && (
          <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedOrders.size} selected</span>
            <select onChange={(e) => { if(e.target.value) handleBulkUpdate(e.target.value); e.target.value = ''; }} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="">Bulk Actions...</option>
              <option value="Processing">Mark as Processing</option>
              <option value="Shipped">Mark as Shipped</option>
              <option value="Delivered">Mark as Delivered</option>
            </select>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th style={{ width: '40px', paddingLeft: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={currentOrders.length > 0 && selectedOrders.size === currentOrders.length}
                  onChange={toggleSelectAll}
                  style={{ borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </th>
              <th><div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>ORDER ID <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="7 15 12 20 17 15"></polyline><polyline points="7 9 12 4 17 9"></polyline></svg></div></th>
              <th><div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>DATE <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="7 15 12 20 17 15"></polyline><polyline points="7 9 12 4 17 9"></polyline></svg></div></th>
              <th><div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>TOTAL <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="7 15 12 20 17 15"></polyline><polyline points="7 9 12 4 17 9"></polyline></svg></div></th>
              <th><div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>STATUS <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="7 15 12 20 17 15"></polyline><polyline points="7 9 12 4 17 9"></polyline></svg></div></th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order: Order) => (
              <React.Fragment key={order._id}>
                <tr style={{ borderBottom: expandedOrderId === order._id ? 'none' : '1px solid #f3f4f6', backgroundColor: selectedOrders.has(order._id) ? '#f0f9ff' : 'transparent' }}>
                  <td style={{ paddingLeft: '1.5rem' }}>
                    <input type="checkbox" checked={selectedOrders.has(order._id)} onChange={() => toggleSelectOrder(order._id)} style={{ borderRadius: '4px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td style={{ fontWeight: 600, color: '#4c1d95', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button 
                        onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedOrderId === order._id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      #{order._id.substring(0, 8).toUpperCase()}
                    </div>
                  </td>
                  <td style={{ color: '#4b5563', fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ fontWeight: 600, color: '#111', fontSize: '0.9rem' }}>₹{order.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      backgroundColor: order.status === 'Processing' ? '#fef3c7' : order.status === 'Shipped' ? '#e0e7ff' : order.status === 'Delivered' ? '#dcfce3' : '#f3f4f6',
                      color: order.status === 'Processing' ? '#d97706' : order.status === 'Shipped' ? '#4338ca' : order.status === 'Delivered' ? '#15803d' : '#4b5563',
                      border: `1px solid ${order.status === 'Processing' ? '#fde68a' : order.status === 'Shipped' ? '#c7d2fe' : order.status === 'Delivered' ? '#bbf7d0' : '#e5e7eb'}`
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      disabled={updating === order._id}
                      style={{ padding: '0.4rem 1.8rem 0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', fontSize: '0.85rem', color: '#374151', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em 1em' }}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                </tr>
                {expandedOrderId === order._id && (
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <td colSpan={6} style={{ padding: '2rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#111' }}>Order Items</h4>
                            <button 
                              onClick={() => downloadPDFLabel(order)}
                              className="admin-btn-secondary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                            >
                              ⬇️ Download PDF Label
                            </button>
                          </div>
                          {order.orderItems.map((item: OrderItem, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                              <img src={item.image} alt={item.name} style={{ width: '50px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb' }} />
                              <div>
                                <div style={{ fontWeight: 600, color: '#111' }}>{item.name}</div>
                                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Qty: {item.quantity}</div>
                              </div>
                              <div style={{ marginLeft: 'auto', fontWeight: 600, color: '#111' }}>₹{item.price * item.quantity}</div>
                            </div>
                          ))}

                          <div style={{ marginTop: '2rem' }}>
                            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#111' }}>Fulfillment (Tracking & Notes)</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <input 
                                type="text" 
                                placeholder="Tracking Link (e.g. BlueDart URL)" 
                                value={trackingLinks[order._id] || ''}
                                onChange={(e) => setTrackingLinks({...trackingLinks, [order._id]: e.target.value})}
                                style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%' }}
                              />
                              <textarea 
                                placeholder="Admin Notes (Internal only)" 
                                value={adminNotes[order._id] || ''}
                                onChange={(e) => setAdminNotes({...adminNotes, [order._id]: e.target.value})}
                                style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', minHeight: '60px' }}
                              />
                              <button 
                                onClick={() => updateOrderStatus(order._id, order.status)}
                                className="admin-btn-primary"
                                style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                disabled={updating === order._id}
                              >
                                {updating === order._id ? 'Saving...' : 'Save Tracking & Notes'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#111' }}>Shipping Details</h4>
                          <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', lineHeight: '1.6', fontSize: '0.9rem' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#111' }}>{order.user?.name || order.shippingAddress.fullName || 'Customer'}</div>
                            <div>{order.shippingAddress.address}</div>
                            <div>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</div>
                            <div>{order.shippingAddress.country}</div>
                            <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>Phone: {order.shippingAddress.phone || order.user?.phone || 'N/A'}</div>
                            <div style={{ color: '#6b7280' }}>Email: {order.user?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {currentOrders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No orders found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> of <strong>{filteredOrders.length}</strong> orders
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', color: currentPage === 1 ? '#d1d5db' : '#374151', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              
              {/* Pagination Numbers */}
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                // Simple logic: show first, last, and surrounding pages
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: pageNum === currentPage ? 'none' : '1px solid #e5e7eb', background: pageNum === currentPage ? '#5b21b6' : '#fff', color: pageNum === currentPage ? '#fff' : '#374151', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', color: '#9ca3af' }}>...</span>;
                }
                return null;
              })}
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', color: currentPage === totalPages ? '#d1d5db' : '#374151', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
