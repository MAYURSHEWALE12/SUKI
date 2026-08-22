"use client";
import React, { useEffect, useState, useCallback } from 'react';

interface Discount {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderValue: number;
  isActive: boolean;
  expiryDate: string;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: 0,
    minOrderValue: 0,
    isActive: true,
    expiryDate: '',
  });

  const fetchDiscounts = useCallback(() => {
    const req = async () => {
      const token = localStorage.getItem('suki_admin_token');
      const res = await fetch('/api/discounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return { ok: res.ok, discounts: data };
    };
    req()
      .then(({ ok, discounts }) => {
        if (ok) {
          setDiscounts(discounts);
        }
      })
      .catch((error) => {
        console.error('Error fetching discounts:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const openAddModal = () => {
    setEditingDiscount(null);
    setFormData({
      code: '', 
      type: 'percentage', 
      value: 0, 
      minOrderValue: 0, 
      isActive: true, 
      expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] // Default +30 days
    });
    setShowModal(true);
  };

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minOrderValue: discount.minOrderValue,
      isActive: discount.isActive,
      expiryDate: discount.expiryDate ? new Date(discount.expiryDate).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    });
  };

  const saveDiscount = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('suki_admin_token');
      const method = editingDiscount ? 'PUT' : 'POST';
      const url = editingDiscount 
        ? `/api/discounts/${editingDiscount._id}`
        : `/api/discounts`;
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchDiscounts();
        setShowModal(false);
      } else {
        const err = await res.json();
        alert('Error saving discount: ' + err.message);
      }
    } catch (error) {
      console.error('Error saving discount:', error);
      alert('Network error while saving discount.');
    } finally {
      setSaving(false);
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) return;
    
    try {
      const token = localStorage.getItem('suki_admin_token');
      const res = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDiscounts();
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
    }
  };

  if (loading) return <div>Loading discounts...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Discount Codes</h1>
        <button className="admin-btn-primary" onClick={openAddModal}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create Discount
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Desktop Table */}
        <div className="admin-discounts-desktop">
          <table>
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.5rem' }}>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount: Discount) => (
                <tr key={discount._id}>
                  <td style={{ paddingLeft: '1.5rem', fontWeight: 700, color: '#111', textTransform: 'uppercase' }}>
                    {discount.code}
                  </td>
                  <td style={{ color: '#4b5563', textTransform: 'capitalize' }}>
                    {discount.type.replace('_', ' ')}
                  </td>
                  <td style={{ fontWeight: 600, color: '#111' }}>
                    {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                  </td>
                  <td style={{ color: '#4b5563' }}>₹{discount.minOrderValue}</td>
                  <td>
                    <span className={`status-badge ${discount.isActive ? 'delivered' : 'processing'}`} style={{ backgroundColor: discount.isActive ? '#dcfce7' : '#f3f4f6', color: discount.isActive ? '#166534' : '#4b5563' }}>
                      {discount.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ color: '#4b5563' }}>
                    {new Date(discount.expiryDate).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => openEditModal(discount)}
                        aria-label="Edit discount"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button 
                        onClick={() => deleteDiscount(discount._id)}
                        aria-label="Delete discount"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No discounts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="admin-discounts-mobile-list">
          {discounts.map((discount: Discount) => (
            <div key={discount._id} className="admin-discount-mobile-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="admin-discount-code">{discount.code}</span>
                <span className={`status-badge ${discount.isActive ? 'delivered' : 'processing'}`} style={{ backgroundColor: discount.isActive ? '#dcfce7' : '#f3f4f6', color: discount.isActive ? '#166534' : '#4b5563' }}>
                  {discount.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                <span style={{ background: '#eef2ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '12px', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {discount.type.replace('_', ' ')}{discount.type !== 'free_shipping' ? ` · ${discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}` : ''}
                </span>
                <span style={{ background: '#f3f4f6', color: '#4b5563', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                  Min ₹{discount.minOrderValue}
                </span>
              </div>
              <div className="admin-discount-meta">
                Expires: {new Date(discount.expiryDate).toLocaleDateString()}
              </div>
              <div className="admin-discount-card-actions">
                <button 
                  onClick={() => openEditModal(discount)}
                  aria-label="Edit discount"
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.5rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button 
                  onClick={() => deleteDiscount(discount._id)}
                  aria-label="Delete discount"
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          ))}
          {discounts.length === 0 && (
            <div className="admin-discount-mobile-card empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No discounts found.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>{editingDiscount ? 'Edit Discount' : 'Create Discount'}</h2>
            <div className="admin-form-grid">
              <div className="form-group full-width">
                <label>Discount Code (e.g. FESTIVE20)</label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="FESTIVE20" style={{ textTransform: 'uppercase' }} />
              </div>
              <div className="form-group">
                <label>Discount Type</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div className="form-group">
                <label>Discount Value</label>
                <input type="number" name="value" value={formData.value} onChange={handleChange} placeholder={formData.type === 'percentage' ? '20' : '500'} disabled={formData.type === 'free_shipping'} />
              </div>
              <div className="form-group">
                <label>Minimum Order Value (₹)</label>
                <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange} placeholder="0 for no minimum" />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
              </div>
              <div className="form-group full-width" style={{ flexDirection: 'row', alignItems: 'center', marginTop: '1rem' }}>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} style={{ width: 'auto' }} />
                <label style={{ margin: 0, cursor: 'pointer' }}>Active (Customers can use this code)</label>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={saveDiscount} disabled={saving}>
                {saving ? 'Saving...' : (editingDiscount ? 'Update Discount' : 'Create Discount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
