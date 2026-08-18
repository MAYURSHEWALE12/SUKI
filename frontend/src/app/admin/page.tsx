"use client";
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Order {
  _id: string;
  totalPrice: number;
  createdAt?: string;
  status?: string;
  user?: { name?: string } | null;
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
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [rawProducts, setRawProducts] = useState<{ _id: string }[]>([]);
  const [dateRange, setDateRange] = useState(7);
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
    if (!rawOrders.length) return alert('No data to export');

    const rangeOrders = filterByRange(rawOrders, dateRange);

    const headers = ['Order ID', 'Date', 'Total Price', 'Status', 'Customer'];
    const rows = rangeOrders.map(order => [
      order._id || 'N/A',
      order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A',
      order.totalPrice,
      order.status || 'Processing',
      order.user?.name || 'Guest'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `suki_orders_${dateRange}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '0.5rem 2rem 0.5rem 2.2rem', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', appearance: 'none', cursor: 'pointer' }}
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <button onClick={handleExport} className="admin-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Report
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="icon-circle icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div>
            <h3 style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Total Revenue</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '0.25rem' }}>
              ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDelta(revenueDelta, `vs previous ${dateRange} days`)}</div>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="icon-circle icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <div>
            <h3 style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Total Orders</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '0.25rem' }}>
              {stats.totalOrders}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDelta(ordersDelta, `vs previous ${dateRange} days`)}</div>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="icon-circle icon-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div>
            <h3 style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Total Products</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '0.25rem' }}>
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
                itemStyle={{ color: '#4c1d95', fontSize: '0.9rem' }}
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Revenue ']}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#4c1d95" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
              <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Insight Pill */}
      {chartData.length > 0 && (() => {
        const bestDay = [...chartData].sort((a, b) => b.revenue - a.revenue)[0];
        return (
          <div style={{ marginTop: '1rem', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6d28d9', fontSize: '0.9rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            Most of your revenue came from {bestDay.name}.
          </div>
        );
      })()}
    </div>
  );
}
