"use client";
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/context/ToastContext';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  totalPrice: number;
  itemsPrice?: number;
  discountAmount?: number;
  shippingPrice?: number;
  createdAt?: string;
  status?: string;
  isPaid?: boolean;
  paymentMethod?: string;
  email?: string;
  user?: { name?: string; email?: string } | null;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    city?: string;
    address?: string;
    postalCode?: string;
  } | null;
  orderItems?: OrderItem[];
}

interface ChartDatum {
  name: string;
  revenue: number;
}

const filterByRange = (orders: Order[], days: number): Order[] => {
  const filterDate = new Date();
  filterDate.setDate(filterDate.getDate() - days);
  return orders.filter((order) => {
    if (!order.createdAt) return true;
    return new Date(order.createdAt) >= filterDate;
  });
};

// Orders between (now - 2*days) and (now - days): the period preceding the current range
const filterPreviousRange = (orders: Order[], days: number): Order[] => {
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 2 * days);
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() - days);
  return orders.filter((order) => {
    if (!order.createdAt) return false;
    const date = new Date(order.createdAt);
    return date >= rangeStart && date < rangeEnd;
  });
};

const pctDelta = (current: number, previous: number): number | null => {
  if (previous <= 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
};

const formatDelta = (delta: number | null, label: string) => {
  if (delta === null) return <span>No prior data</span>;
  const rounded = Math.abs(delta).toFixed(1);
  const up = delta >= 0;
  return (
    <span>
      <span style={{ color: up ? '#16a34a' : '#dc2626' }}>{up ? '↑' : '↓'} {rounded}%</span> {label}
    </span>
  );
};

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [rawProducts, setRawProducts] = useState<{ _id: string }[]>([]);
  const [dateRange, setDateRange] = useState(7);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('suki_admin_token');
        const headers = { Authorization: `Bearer ${token}` };

        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/orders', { headers }),
          fetch('/api/products')
        ]);

        if (ordersRes.ok && productsRes.ok) {
          const orders = await ordersRes.json();
          const products = await productsRes.json();
          setRawOrders(orders);
          setRawProducts(products);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const filteredOrders = filterByRange(rawOrders, dateRange);
  const previousOrders = filterPreviousRange(rawOrders, dateRange);

  const stats = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((acc, order) => acc + order.totalPrice, 0),
    totalProducts: rawProducts.length
  };

  const prevStats = {
    totalOrders: previousOrders.length,
    totalRevenue: previousOrders.reduce((acc, order) => acc + order.totalPrice, 0)
  };

  const revenueDelta = pctDelta(stats.totalRevenue, prevStats.totalRevenue);
  const ordersDelta = pctDelta(stats.totalOrders, prevStats.totalOrders);

  // Process data for charts
  const chartDays = [...Array(dateRange)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - ((dateRange - 1) - i));
    return d.toISOString().split('T')[0];
  });

  const revenueByDate: Record<string, number> = {};
  chartDays.forEach(date => revenueByDate[date] = 0);

  filteredOrders.forEach((order) => {
    if (order.createdAt) {
      const date = order.createdAt.split('T')[0];
      if (revenueByDate[date] !== undefined) {
        revenueByDate[date] += order.totalPrice;
      }
    }
  });

  const chartData: ChartDatum[] = Object.keys(revenueByDate).map(date => ({
    name: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    revenue: revenueByDate[date]
  }));

  const handleExport = () => {
    if (!rawOrders.length) {
      showToast('No orders available to export', 'info');
      return;
    }

    const rangeOrders = filterByRange(rawOrders, dateRange);

    if (!rangeOrders.length) {
      showToast(`No orders found in the last ${dateRange} days`, 'info');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Time',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'City',
      'Items Purchased',
      'Total Qty',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Subtotal (INR)',
      'Discount (INR)',
      'Shipping (INR)',
      'Total Amount (INR)'
    ];

    // Build styled HTML Excel Spreadsheet (.xls) with colors
    const getStatusStyle = (status: string) => {
      switch (status) {
        case 'Delivered':
          return 'background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; border-radius: 4px; padding: 4px 8px;';
        case 'Shipped':
          return 'background-color: #dbeafe; color: #1d4ed8; font-weight: bold; text-align: center; border-radius: 4px; padding: 4px 8px;';
        case 'Processing':
          return 'background-color: #fef3c7; color: #b45309; font-weight: bold; text-align: center; border-radius: 4px; padding: 4px 8px;';
        case 'Cancelled':
          return 'background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; border-radius: 4px; padding: 4px 8px;';
        default:
          return 'text-align: center;';
      }
    };

    const getPaymentStyle = (isPaid: boolean) => {
      return isPaid
        ? 'background-color: #ecfdf5; color: #047857; font-weight: bold; text-align: center; padding: 4px 8px;'
        : 'background-color: #fffbeb; color: #b45309; font-weight: bold; text-align: center; padding: 4px 8px;';
    };

    let sumQty = 0;
    let sumSubtotal = 0;
    let sumDiscount = 0;
    let sumShipping = 0;
    let sumTotal = 0;

    const tableRowsHtml = rangeOrders.map((order, idx) => {
      const isEven = idx % 2 === 0;
      const bg = isEven ? '#ffffff' : '#f8fafc';
      const dateObj = order.createdAt ? new Date(order.createdAt) : null;
      const formattedDate = dateObj ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
      const formattedTime = dateObj ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
      
      const customerName = order.shippingAddress?.fullName || order.user?.name || 'Guest Customer';
      const customerEmail = order.email || order.user?.email || 'N/A';
      const customerPhone = order.shippingAddress?.phone || 'N/A';
      const city = order.shippingAddress?.city || 'N/A';
      
      const itemsList = (order.orderItems || []).map(i => `${i.quantity}x ${i.name}`).join(' | ') || '1x Item';
      const itemsQty = (order.orderItems || []).reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;
      
      const subtotal = order.itemsPrice ?? (order.totalPrice - (order.shippingPrice || 0) + (order.discountAmount || 0));
      const discount = order.discountAmount || 0;
      const shipping = order.shippingPrice || 0;
      const total = order.totalPrice || 0;

      sumQty += itemsQty;
      sumSubtotal += subtotal;
      sumDiscount += discount;
      sumShipping += shipping;
      sumTotal += total;

      return `
        <tr style="background-color: ${bg};">
          <td style="mso-number-format:'\\@'; padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #111d4a; text-align: center;">#${order._id.substring(0, 8).toUpperCase()}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${formattedDate}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${formattedTime}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 500;">${customerName}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #4b5563;">${customerEmail}</td>
          <td style="mso-number-format:'\\@'; padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${customerPhone}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${city}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${itemsList}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">${itemsQty}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${order.paymentMethod || 'Online'}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; ${getPaymentStyle(!!order.isPaid)}">${order.isPaid ? 'Paid' : 'Pending'}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; ${getStatusStyle(order.status || 'Processing')}">${order.status || 'Processing'}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">₹${subtotal.toFixed(2)}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; color: ${discount > 0 ? '#dc2626' : '#6b7280'};">${discount > 0 ? `-₹${discount.toFixed(2)}` : '₹0.00'}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right;">₹${shipping.toFixed(2)}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #111d4a;">₹${total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const headersHtml = headers.map(h => `
      <th style="background-color: #111d4a; color: #ffffff; padding: 12px 14px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #0b1333;">${h}</th>
    `).join('');

    const summaryRowHtml = `
      <tr style="background-color: #111d4a; color: #ffffff; font-weight: bold; font-size: 13px;">
        <td style="padding: 12px 14px; border: 1px solid #0b1333; text-align: center; color: #ffffff;">GRAND TOTAL</td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; text-align: center; color: #ffffff;">${rangeOrders.length} Orders</td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; color: #ffffff;"></td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; color: #ffffff;"></td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; color: #ffffff;"></td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; color: #ffffff;"></td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; color: #ffffff;"></td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; color: #ffffff;"></td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; text-align: center; font-size: 14px; color: #ffffff;">${sumQty}</td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; color: #ffffff;"></td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; color: #ffffff;"></td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; color: #ffffff;"></td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; text-align: right; color: #ffffff;">₹${sumSubtotal.toFixed(2)}</td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; text-align: right; color: #fca5a5;">${sumDiscount > 0 ? `-₹${sumDiscount.toFixed(2)}` : '₹0.00'}</td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; text-align: right; color: #ffffff;">₹${sumShipping.toFixed(2)}</td>
        <td style="padding: 12px 14px; border: 1px solid #0b1333; text-align: right; font-size: 14px; color: #4ade80;">₹${sumTotal.toFixed(2)}</td>
      </tr>
    `;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th colspan="${headers.length}" style="background-color: #111d4a; color: #ffffff; font-size: 16px; font-weight: bold; padding: 14px; text-align: left;">
                ✨ SUKI ETHNIC - SALES & ORDERS REPORT (Last ${dateRange} Days)
              </th>
            </tr>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
            ${summaryRowHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Suki_Sales_Report_${dateRange}Days_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Styled Excel report downloaded successfully!', 'success');
  };


  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.95rem' }}>Welcome back, Admin! Here&apos;s what&apos;s happening with your store. 👋</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div 
            style={{ position: 'relative' }} 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsDateDropdownOpen(false);
              }
            }}
          >
            <div 
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              style={{ background: '#fff', border: '1px solid #111d4a', padding: '0.5rem 2.5rem 0.5rem 2.5rem', borderRadius: isDateDropdownOpen ? '6px 6px 0 0' : '6px', color: '#111d4a', fontSize: '0.9rem', fontWeight: 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg style={{ position: 'absolute', left: '12px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111d4a" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Last {dateRange} Days
              <svg style={{ position: 'absolute', right: '12px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            {isDateDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #111d4a', borderTop: 'none', borderRadius: '0 0 6px 6px', zIndex: 10, overflow: 'hidden' }}>
                {[7, 30, 90].map(days => (
                  <div 
                    key={days}
                    onClick={() => { setDateRange(days); setIsDateDropdownOpen(false); }}
                    style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', cursor: 'pointer', fontSize: '0.9rem', background: dateRange === days ? '#111d4a' : '#fff', color: dateRange === days ? '#fff' : '#111d4a', transition: 'background 0.2s', textAlign: 'left' }}
                    onMouseEnter={(e) => { if (dateRange !== days) { e.currentTarget.style.background = '#f3f4f6'; } }}
                    onMouseLeave={(e) => { if (dateRange !== days) { e.currentTarget.style.background = '#fff'; } }}
                  >
                    Last {days} Days
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleExport} className="admin-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Report
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 100 20" preserveAspectRatio="none"><path fill="#eef2ff" d="M0,20 L100,20 L100,10 C80,20 60,0 40,10 C20,20 0,0 0,10 Z"/></svg>
          <div className="icon-circle icon-purple" style={{ zIndex: 1 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div style={{ zIndex: 1 }}>
            <h3 style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Total Revenue</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111d4a', marginBottom: '0.25rem' }}>
              ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDelta(revenueDelta, `vs previous ${dateRange} days`)}</div>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 100 20" preserveAspectRatio="none"><path fill="#dcfce7" d="M0,20 L100,20 L100,10 C80,20 60,0 40,10 C20,20 0,0 0,10 Z"/></svg>
          <div className="icon-circle icon-green" style={{ zIndex: 1 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <div style={{ zIndex: 1 }}>
            <h3 style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Total Orders</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111d4a', marginBottom: '0.25rem' }}>
              {stats.totalOrders}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDelta(ordersDelta, `vs previous ${dateRange} days`)}</div>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 100 20" preserveAspectRatio="none"><path fill="#ffedd5" d="M0,20 L100,20 L100,10 C80,20 60,0 40,10 C20,20 0,0 0,10 Z"/></svg>
          <div className="icon-circle icon-orange" style={{ zIndex: 1 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div style={{ zIndex: 1 }}>
            <h3 style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Total Products</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111d4a', marginBottom: '0.25rem' }}>
              {stats.totalProducts}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Live catalog size</div>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', margin: 0 }}>Revenue Overview (Last 7 Days)</h3>
          <div style={{ position: 'relative' }}>
            <select style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '0.4rem 2rem 0.4rem 1rem', borderRadius: '8px', color: '#374151', fontSize: '0.8rem', fontWeight: 500, appearance: 'none', cursor: 'pointer' }}>
              <option>Daily</option>
              <option>Weekly</option>
            </select>
            <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
              />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                labelStyle={{ color: '#111827', fontWeight: 500, marginBottom: '4px' }}
                itemStyle={{ color: '#111d4a', fontSize: '0.9rem' }}
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Revenue ']}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111d4a" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#111d4a" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
              <Bar dataKey="revenue" fill="#111d4a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Insight Pill */}
      {chartData.length > 0 && (() => {
        const bestDay = [...chartData].sort((a, b) => b.revenue - a.revenue)[0];
        return (
          <div style={{ marginTop: '1.5rem', background: '#eef2ff', padding: '1rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#111d4a', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>i</div>
            <div style={{ color: '#111d4a', fontSize: '0.9rem', fontWeight: 500 }}>
              Most of your revenue came from {bestDay.name}.
            </div>
          </div>
        );
      })()}
    </div>
  );
}
