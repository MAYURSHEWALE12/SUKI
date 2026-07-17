"use client";
import React, { useEffect, useState } from 'react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Suki Ethnic',
    category: '',
    description: '',
    price: 0,
    originalPrice: 0,
    countInStock: 0,
    image: '',
    hoverImage: '',
    isNewArrival: false,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '', brand: 'Suki Ethnic', category: '', description: '', price: 0, originalPrice: 0, countInStock: 0, image: '', hoverImage: '', isNewArrival: false
    });
    setShowModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      brand: product.brand || 'Suki Ethnic',
      category: product.category || '',
      description: product.description || '',
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      countInStock: product.countInStock || 0,
      image: product.image || '',
      hoverImage: product.hoverImage || '',
      isNewArrival: product.isNewArrival || false,
    });
    setShowModal(true);
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    });
  };

  const uploadFileHandler = async (e: React.ChangeEvent<HTMLInputElement>, imageField: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) throw new Error('Image upload failed');

      const imageUrl = await res.text();
      setFormData((prev: any) => ({
        ...prev,
        [imageField]: `${imageUrl}`
      }));
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    }
  };

  const saveProduct = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('suki_admin_token');
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct 
        ? `/api/products/${editingProduct._id}`
        : `/api/products`;
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchProducts();
        setShowModal(false);
      } else {
        const err = await res.json();
        alert('Error saving product: ' + err.message);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Network error while saving product.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = localStorage.getItem('suki_admin_token');
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Products Management</h1>
        <button className="admin-btn-primary" onClick={openAddModal}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Product
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Image</th>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Name</th>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Price</th>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Category</th>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Stock</th>
              <th style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textTransform: 'uppercase', color: '#d4af37' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product: any) => (
              <tr key={product._id}>
                <td style={{ padding: '1rem' }}>
                  <img src={product.image} alt={product.name} style={{ width: '50px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                </td>
                <td style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, color: '#fff' }}>{product.name}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#d4af37' }}>₹{product.price.toFixed(2)}</td>
                <td style={{ padding: '1rem', color: '#aaa' }}>{product.category}</td>
                <td style={{ padding: '1rem', color: '#aaa' }}>{product.countInStock}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => openEditModal(product)}
                      style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      onClick={() => deleteProduct(product._id)}
                      style={{ background: 'none', border: 'none', color: '#ff8a8a', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <div className="admin-form-grid">
              <div className="form-group full-width">
                <label>Product Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Silk Saree" />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Original Price (₹)</label>
                <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Sarees, Lehengas..." />
              </div>
              <div className="form-group">
                <label>Stock Count</label>
                <input type="number" name="countInStock" value={formData.countInStock} onChange={handleChange} />
              </div>
              <div className="form-group full-width">
                <label>Main Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="https://..." style={{ flex: 1 }} />
                  <span style={{ color: '#888' }}>OR</span>
                  <input type="file" onChange={(e) => uploadFileHandler(e, 'image')} style={{ flex: 1, padding: '0.4rem', border: '1px solid #333', borderRadius: '4px' }} />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Hover Image (Optional)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="text" name="hoverImage" value={formData.hoverImage} onChange={handleChange} placeholder="https://..." style={{ flex: 1 }} />
                  <span style={{ color: '#888' }}>OR</span>
                  <input type="file" onChange={(e) => uploadFileHandler(e, 'hoverImage')} style={{ flex: 1, padding: '0.4rem', border: '1px solid #333', borderRadius: '4px' }} />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3}></textarea>
              </div>
              <div className="form-group full-width" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <input type="checkbox" name="isNewArrival" checked={formData.isNewArrival} onChange={handleChange} style={{ width: 'auto' }} />
                <label style={{ margin: 0, cursor: 'pointer' }}>Mark as New Arrival</label>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn-primary" onClick={saveProduct} disabled={saving}>
                {saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
