"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSubscribersPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const token = localStorage.getItem('suki_admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSubscribers(data);
      } else {
        setError(data.message || 'Failed to fetch subscribers');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Newsletter Subscribers</h1>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading subscribers...</div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No one has subscribed to the newsletter yet.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email Address</th>
                  <th>Subscribed Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub: any) => (
                  <tr key={sub._id}>
                    <td>
                      <div style={{ fontWeight: 500, color: '#222' }}>{sub.email}</div>
                    </td>
                    <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`admin-badge ${sub.active ? 'badge-success' : 'badge-danger'}`}>
                        {sub.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
