"use client";
import React, { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0
  });
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
          <h3 style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '1rem' }}>Total Revenue</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: '#d4af37' }}>
            ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '1rem' }}>Total Orders</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: '#fff' }}>
            {stats.totalOrders}
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '1rem' }}>Total Products</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: '#fff' }}>
            {stats.totalProducts}
          </div>
        </div>
      </div>
    </div>
  );
}
