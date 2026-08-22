"use client";
import React, { useEffect, useState, useCallback } from 'react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpend: number;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Features State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchCustomers = useCallback(() => {
    const req = async () => {
      const token = localStorage.getItem('suki_admin_token');
      const params = new URLSearchParams({ page: String(currentPage), limit: String(itemsPerPage) });
      if (debouncedSearch.trim()) params.set('keyword', debouncedSearch.trim());
      const res = await fetch(`/api/auth/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return { ok: res.ok, customers: data.data ?? [], total: data.total ?? 0, pages: data.pages ?? 1 };
    };
    req()
      .then(({ ok, customers, total, pages }) => {
        if (ok) {
          setCustomers(customers);
          setTotalCustomers(total);
          setTotalPages(pages);
        }
      })
      .catch((error) => {
        console.error('Error fetching customers:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const currentCustomers = customers;

  if (loading && customers.length === 0) return <div>Loading customers...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Customers Management</h1>
        <div className="admin-list-header-actions">
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="admin-search-input"
          />
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Desktop Table */}
        <div className="admin-customers-desktop">
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
              {currentCustomers.map((customer: Customer) => (
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
        </div>

        {/* Mobile Card List */}
        <div className="admin-customers-mobile-list">
          {currentCustomers.map((customer: Customer) => (
            <div key={customer._id} className="admin-customer-mobile-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="admin-customer-card-name">{customer.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="admin-customer-card-meta">{customer.email}</div>
              <div className="admin-customer-card-meta">{customer.phone || 'N/A'}</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                <span style={{ background: '#eef2ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                  {customer.totalOrders} order{customer.totalOrders === 1 ? '' : 's'}
                </span>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                  ₹{customer.totalSpend.toFixed(2)} spent
                </span>
              </div>
            </div>
          ))}
          {currentCustomers.length === 0 && (
            <div className="admin-customer-mobile-card empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No customers found.
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              Showing {totalCustomers === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCustomers)} of {totalCustomers} customers
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
