"use client";
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('suki_admin_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Orders
        const ordersRes = await fetch('/api/orders', { headers });
        const orders = await ordersRes.json();

        // Fetch Products
        const productsRes = await fetch('/api/products');
        const products = await productsRes.json();

        if (ordersRes.ok && productsRes.ok) {
          const revenue = orders.reduce((acc: number, order: any) => acc + order.totalPrice, 0);
          setStats({
            totalOrders: orders.length,
            totalRevenue: revenue,
            totalProducts: products.length
          });

          // Process data for charts (last 7 days of revenue)
          const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0]; // YYYY-MM-DD
          });

          const revenueByDate: Record<string, number> = {};
          last7Days.forEach(date => revenueByDate[date] = 0);

          orders.forEach((order: any) => {
            if (order.createdAt) {
              const date = order.createdAt.split('T')[0];
              if (revenueByDate[date] !== undefined) {
                revenueByDate[date] += order.totalPrice;
              }
            }
          });

          const formattedChartData = Object.keys(revenueByDate).map(date => ({
            name: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            revenue: revenueByDate[date]
          }));

          setChartData(formattedChartData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Dashboard Overview</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 1rem 0' }}>Total Revenue</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#111' }}>
            ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 1rem 0' }}>Total Orders</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#111' }}>
            {stats.totalOrders}
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 1rem 0' }}>Total Products</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#111' }}>
            {stats.totalProducts}
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#4b5563', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', margin: '0 0 1.5rem 0' }}>Revenue Overview (Last 7 Days)</h3>
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
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#111111" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
