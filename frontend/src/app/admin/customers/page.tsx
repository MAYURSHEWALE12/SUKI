"use client";
import React, { useEffect, useState, useMemo } from 'react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Features State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('suki_admin_token');
      const res = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and Pagination Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c: any) => {
      const searchStr = searchTerm.toLowerCase();
      const nameMatch = (c.name || '').toLowerCase().includes(searchStr);
      const emailMatch = (c.email || '').toLowerCase().includes(searchStr);
      return nameMatch || emailMatch;
    });
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && customers.length === 0) return <div>Loading customers...</div>;

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Customers Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.6rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '300px' }}
          />
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th style={{ paddingLeft: '1.5rem' }}>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Total Orders</th>
              <th>Lifetime Spend</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {currentCustomers.map((customer: any) => (
              <tr key={customer._id}>
                <td style={{ paddingLeft: '1.5rem', fontWeight: 600, color: '#111' }}>{customer.name}</td>
                <td style={{ color: '#4b5563' }}>{customer.email}</td>
                <td style={{ color: '#4b5563' }}>{customer.phone || 'N/A'}</td>
                <td style={{ fontWeight: 600, color: '#111' }}>{customer.totalOrders}</td>
                <td style={{ fontWeight: 600, color: '#111' }}>₹{customer.totalSpend.toFixed(2)}</td>
                <td style={{ color: '#4b5563' }}>{new Date(customer.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {currentCustomers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="admin-btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="admin-btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
