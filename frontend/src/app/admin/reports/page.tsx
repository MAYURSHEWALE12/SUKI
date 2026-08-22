"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';

const PENDING_STATUSES = ['Pending Payment', 'Payment Failed'];

// Compact axis labels: 5000 -> ₹5k, 150000 -> ₹1.5L, 25000000 -> ₹2.5Cr
const formatCompactINR = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (value >= 1000) {
    const k = value / 1000;
    return `₹${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `₹${value}`;
};

const truncateLabel = (label: string, max: number) =>
  label.length > max ? `${label.slice(0, max - 1).trimEnd()}…` : label;

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  user?: { name?: string; email?: string };
  shippingAddress?: { fullName?: string };
  orderItems?: OrderItem[];
}

interface Customer {
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpend: number;
  createdAt: string;
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsNarrowScreen(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Quick range presets
  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const fetchData = useCallback(() => {
    const req = async () => {
      const token = localStorage.getItem('suki_admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [ordersRes, customersRes] = await Promise.all([
        fetch('/api/orders?includePending=true', { headers }),
        fetch('/api/auth/users', { headers })
      ]);

      return {
        orders: ordersRes.ok ? await ordersRes.json() : undefined,
        customers: customersRes.ok ? await customersRes.json() : undefined
      };
    };
    req()
      .then((result) => {
        if (result.orders) setOrders(result.orders);
        if (result.customers) setCustomers(result.customers);
      })
      .catch((error) => {
        console.error('Error fetching report data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter((o: Order) => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, startDate, endDate]);

  // Aggregated stats
  const stats = useMemo(() => {
    const paidOrders = filteredOrders.filter((o: Order) => !PENDING_STATUSES.includes(o.status));
    const totalRevenue = paidOrders.reduce((acc: number, o: Order) => acc + o.totalPrice, 0);
    const totalOrders = filteredOrders.length;
    const paidOrderCount = paidOrders.length;
    const avgOrderValue = paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0;
    const conversionRate = totalOrders > 0 ? (paidOrderCount / totalOrders) * 100 : 0;

    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach((o: Order) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    // Revenue + order count by day, sorted chronologically for charts
    const byDay = new Map<string, { date: string; revenue: number; orders: number }>();
    [...filteredOrders]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((o: Order) => {
        const key = new Date(o.createdAt).toISOString().split('T')[0];
        const label = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const entry = byDay.get(key) || { date: label, revenue: 0, orders: 0 };
        if (!PENDING_STATUSES.includes(o.status)) entry.revenue += o.totalPrice;
        entry.orders += 1;
        byDay.set(key, entry);
      });
    const dailySeries = [...byDay.values()];

    const revenueByDay: Record<string, number> = {};
    dailySeries.forEach((d) => { revenueByDay[d.date] = d.revenue; });

    // Top products
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    paidOrders.forEach((o: Order) => {
      o.orderItems?.forEach((item: OrderItem) => {
        const key = item.name;
        if (!productSales[key]) productSales[key] = { name: key, qty: 0, revenue: 0 };
        productSales[key].qty += item.quantity;
        productSales[key].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return { totalRevenue, totalOrders, paidOrderCount, avgOrderValue, conversionRate, statusCounts, revenueByDay, dailySeries, topProducts };
  }, [filteredOrders]);

  // CSV Export functions
  const downloadCSV = (data: string[][], filename: string) => {
    const csvContent = '\uFEFF' + data.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const exportOrdersCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Items', 'Status', 'Total (₹)'];
    const rows = filteredOrders.map((o: Order) => [
      o._id,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      o.user?.name || o.shippingAddress?.fullName || 'Guest',
      o.user?.email || 'N/A',
      (o.orderItems || []).map((i: OrderItem) => `${i.quantity}x ${i.name}`).join('; '),
      o.status,
      o.totalPrice.toFixed(2)
    ]);
    downloadCSV([headers, ...rows], `suki-orders-${startDate}-to-${endDate}.csv`);
  };

  const exportRevenueCSV = () => {
    const headers = ['Date', 'Revenue (₹)'];
    const rows = Object.entries(stats.revenueByDay).map(([date, rev]) => [date, (rev as number).toFixed(2)]);
    downloadCSV([headers, ...rows], `suki-revenue-${startDate}-to-${endDate}.csv`);
  };

  const exportCustomersCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Total Orders', 'Lifetime Spend (₹)', 'Joined'];
    const rows = customers.map((c: Customer) => [
      c.name,
      c.email,
      c.phone || 'N/A',
      c.totalOrders.toString(),
      c.totalSpend.toFixed(2),
      new Date(c.createdAt).toLocaleDateString('en-IN')
    ]);
    downloadCSV([headers, ...rows], `suki-customers-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportProductsCSV = () => {
    const headers = ['Product Name', 'Units Sold', 'Revenue (₹)'];
    const rows = stats.topProducts.map(p => [p.name, p.qty.toString(), p.revenue.toFixed(2)]);
    downloadCSV([headers, ...rows], `suki-product-sales-${startDate}-to-${endDate}.csv`);
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Sales Reports</h1>
      </div>

      {/* Date Range Filter */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <div className="admin-reports-filter-row">
          <span style={{ fontWeight: 600, color: '#111', fontSize: '0.9rem' }}>Date Range:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="admin-reports-date-input" />
          <span style={{ color: '#6b7280' }}>to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="admin-reports-date-input" />
          <div className="admin-reports-quick-ranges">
            <button onClick={() => setQuickRange(7)} className="admin-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Last 7 Days</button>
            <button onClick={() => setQuickRange(30)} className="admin-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Last 30 Days</button>
            <button onClick={() => setQuickRange(90)} className="admin-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Last 90 Days</button>
            <button onClick={() => setQuickRange(365)} className="admin-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>This Year</button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="reports-summary-grid">
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>Total Revenue</h3>
          <div className="admin-stat-value">₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>Total Orders</h3>
          <div className="admin-stat-value">{stats.totalOrders}</div>
        </div>
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>Avg Order Value</h3>
          <div className="admin-stat-value">₹{stats.avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>Conversion Rate</h3>
          <div className="admin-stat-value">{stats.conversionRate.toFixed(1)}%</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{stats.paidOrderCount} of {stats.totalOrders} orders paid</div>
        </div>
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>Total Customers</h3>
          <div className="admin-stat-value">{customers.length}</div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#111', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Export Reports as CSV</h3>
        <div className="admin-reports-export-grid">
          <button onClick={exportOrdersCSV} className="admin-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Orders Report
          </button>
          <button onClick={exportRevenueCSV} className="admin-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Revenue Report
          </button>
          <button onClick={exportCustomersCSV} className="admin-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Customers Report
          </button>
          <button onClick={exportProductsCSV} className="admin-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Product Sales Report
          </button>
        </div>
      </div>

      {/* Revenue + Orders Charts */}
      <div className="admin-reports-grid-2">
        <div className="admin-card">
          <h3 style={{ color: '#111', fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Revenue Trend</h3>
          {stats.dailySeries.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D81B60" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#D81B60" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: isNarrowScreen ? 10 : 11 }} dy={10} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => formatCompactINR(Number(v))} width={isNarrowScreen ? 52 : 80} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#D81B60" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>No revenue data in this range</div>
          )}
        </div>

        <div className="admin-card">
          <h3 style={{ color: '#111', fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Orders Per Day</h3>
          {stats.dailySeries.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} width={40} />
                  <Tooltip formatter={(value) => [`${value}`, 'Orders']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="orders" fill="#111d4a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>No orders in this range</div>
          )}
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="admin-reports-grid-2">
        <div className="admin-card">
          <h3 style={{ color: '#111', fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Status Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const total = stats.totalOrders || 1;
              const percent = ((count as number) / total * 100).toFixed(1);
              const barColor = status === 'Delivered' ? '#22c55e'
                : status === 'Shipped' ? '#3b82f6'
                : status === 'Processing' ? '#f59e0b'
                : status === 'Pending Payment' ? '#a855f7'
                : status === 'Payment Failed' ? '#ef4444'
                : '#9ca3af';
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 500, color: '#111' }}>{status}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{count} ({percent}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.statusCounts).length === 0 && (
              <div style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>No orders in this date range</div>
            )}
          </div>
        </div>

        {/* Daily Revenue Table */}
        <div className="admin-card">
          <h3 style={{ color: '#111', fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Daily Revenue</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.revenueByDay).map(([date, revenue]) => (
                  <tr key={date}>
                    <td style={{ color: '#4b5563' }}>{date}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#111' }}>₹{(revenue as number).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {Object.keys(stats.revenueByDay).length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>No revenue data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="admin-card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <h3 style={{ color: '#111', fontSize: '1rem', fontWeight: 600, marginBottom: '0' }}>Top Selling Products</h3>
        </div>
        {stats.topProducts.length > 0 && (
          <div style={{ padding: '1.5rem 1.5rem 0.5rem', height: isNarrowScreen ? 280 : 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topProducts.slice(0, 6)} layout="vertical" margin={{ top: 0, right: isNarrowScreen ? 12 : 30, left: isNarrowScreen ? 0 : 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: isNarrowScreen ? 10 : 11 }}
                  tickFormatter={(v) => formatCompactINR(Number(v))}
                  tickCount={isNarrowScreen ? 4 : 5}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#111', fontSize: isNarrowScreen ? 10 : 12 }}
                  width={isNarrowScreen ? 96 : 150}
                  tickFormatter={(name) => truncateLabel(String(name), isNarrowScreen ? 12 : 20)}
                />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="revenue" fill="#D81B60" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th style={{ paddingLeft: '1.5rem' }}>#</th>
              <th>Product Name</th>
              <th>Units Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.topProducts.map((product, idx) => (
              <tr key={product.name}>
                <td style={{ paddingLeft: '1.5rem', color: '#6b7280' }}>{idx + 1}</td>
                <td style={{ fontWeight: 600, color: '#111' }}>{product.name}</td>
                <td style={{ color: '#4b5563' }}>{product.qty}</td>
                <td style={{ fontWeight: 600, color: '#111' }}>₹{product.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {stats.topProducts.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No product sales in this date range</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
