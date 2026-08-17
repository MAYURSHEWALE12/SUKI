"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';

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
        fetch('/api/orders', { headers }),
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
    const totalRevenue = filteredOrders.reduce((acc: number, o: Order) => acc + o.totalPrice, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach((o: Order) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    filteredOrders.forEach((o: Order) => {
      const day = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      revenueByDay[day] = (revenueByDay[day] || 0) + o.totalPrice;
    });

    // Top products
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredOrders.forEach((o: Order) => {
      o.orderItems?.forEach((item: OrderItem) => {
        const key = item.name;
        if (!productSales[key]) productSales[key] = { name: key, qty: 0, revenue: 0 };
        productSales[key].qty += item.quantity;
        productSales[key].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return { totalRevenue, totalOrders, avgOrderValue, statusCounts, revenueByDay, topProducts };
  }, [filteredOrders]);

  // CSV Export functions
  const downloadCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
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
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Sales Reports</h1>
      </div>

      {/* Date Range Filter */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#111', fontSize: '0.9rem' }}>Date Range:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
          <span style={{ color: '#6b7280' }}>to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
            <button onClick={() => setQuickRange(7)} className="admin-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Last 7 Days</button>
            <button onClick={() => setQuickRange(30)} className="admin-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Last 30 Days</button>
            <button onClick={() => setQuickRange(90)} className="admin-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Last 90 Days</button>
            <button onClick={() => setQuickRange(365)} className="admin-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>This Year</button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>Total Revenue</h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111' }}>₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>Total Orders</h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111' }}>{stats.totalOrders}</div>
        </div>
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>Avg Order Value</h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111' }}>₹{stats.avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>Total Customers</h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111' }}>{customers.length}</div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#111', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Export Reports as CSV</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={exportOrdersCSV} className="admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Orders Report
          </button>
          <button onClick={exportRevenueCSV} className="admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Revenue Report
          </button>
          <button onClick={exportCustomersCSV} className="admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Customers Report
          </button>
          <button onClick={exportProductsCSV} className="admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Product Sales Report
          </button>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="admin-card">
          <h3 style={{ color: '#111', fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Status Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const total = stats.totalOrders || 1;
              const percent = ((count as number) / total * 100).toFixed(1);
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 500, color: '#111' }}>{status}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{count} ({percent}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', backgroundColor: status === 'Delivered' ? '#22c55e' : status === 'Shipped' ? '#3b82f6' : '#f59e0b', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
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
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <h3 style={{ color: '#111', fontSize: '1rem', fontWeight: 600, marginBottom: '0' }}>Top Selling Products</h3>
        </div>
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
