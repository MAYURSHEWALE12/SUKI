"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
  active: boolean;
}

export default function AdminSubscribersPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubscribers = useCallback(() => {
    const req = async () => {
      const token = localStorage.getItem('suki_admin_token');
      if (!token) {
        router.push('/admin/login');
        return null;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return { ok: res.ok, data };
    };
    req()
      .then((result) => {
        if (!result) return;
        if (result.ok) {
          setSubscribers(result.data);
        } else {
          setError(result.data?.message || 'Failed to fetch subscribers');
        }
      })
      .catch(() => {
        setError('Network error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

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
                {subscribers.map((sub: Subscriber) => (
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
