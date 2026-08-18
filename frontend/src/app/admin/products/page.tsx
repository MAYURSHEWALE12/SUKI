"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  category: string;
  brand?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  countInStock: number;
  image?: string;
  images?: string[];
  celebrity?: string;
  occasion?: string;
  isNewArrival?: boolean;
  shortDescription?: string;
  highlights?: string;
  careInstructions?: string;
  whatsIncluded?: string;
}

interface ProductForm {
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  originalPrice: number;
  countInStock: number;
  image: string;
  images: string[];
  celebrity: string;
  occasion: string;
  isNewArrival: boolean;
  shortDescription: string;
  highlights: string;
  careInstructions: string;
  whatsIncluded: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  



  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    brand: 'Suki Ethnic',
    category: 'lehengas',
    description: '',
    price: 0,
    originalPrice: 0,
    countInStock: 0,
    image: '',
    images: ['', '', '', ''],
    celebrity: '',
    occasion: '',
    isNewArrival: false,
    shortDescription: '',
    highlights: '',
    careInstructions: '',
    whatsIncluded: '',
  });
  
  const [primaryCategory, setPrimaryCategory] = useState('lehengas');

  // New Features State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const fetchProducts = useCallback(() => {
    const req = async () => {
      const res = await fetch('/api/products');
      const data = await res.json();
      return { ok: res.ok, products: data };
    };
    req()
      .then(({ ok, products }) => {
        if (ok) {
          setProducts(products);
        }
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  const openAddModal = () => {
    setEditingProduct(null);
    setPrimaryCategory('lehengas');
    setFormData({
      name: '', brand: 'Suki Ethnic', category: 'lehengas', celebrity: '', occasion: '', description: '', shortDescription: '', highlights: '', careInstructions: '', whatsIncluded: '', price: 0, originalPrice: 0, countInStock: 0, image: '', images: ['', '', '', ''], isNewArrival: false
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const cat = product.category || 'lehengas';
    const isSareeType = ['sarees', 'normal-sarees', 'party-sarees', 'silk-sarees'].includes(cat);
    setPrimaryCategory(isSareeType ? 'sarees' : cat);
    
    setFormData({
      name: product.name || '',
      brand: product.brand || 'Suki Ethnic',
      category: cat,
      description: product.description || '',
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      countInStock: product.countInStock || 0,
      celebrity: product.celebrity || '',
      occasion: product.occasion || '',
      image: product.image || '',
      images: product.images || ['', '', '', ''],
      isNewArrival: product.isNewArrival || false,
      shortDescription: product.shortDescription || '',
      highlights: product.highlights || '',
      careInstructions: product.careInstructions || '',
      whatsIncluded: product.whatsIncluded || '',
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    });
  };

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const uploadFileHandler = (e: React.ChangeEvent<HTMLInputElement>, imageField: string, arrayIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(imageField + (arrayIndex !== undefined ? arrayIndex : ''));
    const uploadData = new FormData();
    uploadData.append('image', file);

    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem('suki_admin_token');
    xhr.open('POST', '/api/upload', true);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    
    xhr.onload = () => {
      setUploadingField(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        const imageUrl = xhr.responseText;
        setFormData((prev: ProductForm) => {
          if (imageField === 'images' && arrayIndex !== undefined) {
            const newImages = [...(prev.images || ['', '', '', ''])];
            newImages[arrayIndex] = imageUrl;
            return { ...prev, images: newImages };
          }
          return { ...prev, [imageField]: imageUrl };
        });
        alert(`File uploaded successfully!`);
      } else {
        console.error('Upload failed:', xhr.responseText);
        alert(`Error uploading file: ${xhr.responseText || 'Internal Server Error'}`);
      }
    };
    
    xhr.onerror = () => {
      setUploadingField(null);
      console.error('XHR network error');
      alert('Network error while uploading file.');
    };
    
    xhr.send(uploadData);
  };

  const saveProduct = async () => {
    setSaving(true);
    
    const payload = {
      ...formData,
    };
    
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
        body: JSON.stringify(payload)
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

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) return;
    setLoading(true);
    const token = localStorage.getItem('suki_admin_token');
    
    for (const id of Array.from(selectedProducts)) {
      try {
        await fetch(`/api/products/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Bulk delete failed for", id, err);
      }
    }
    
    setSelectedProducts(new Set());
    await fetchProducts();
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(new Set(currentProducts.map((p: Product) => p._id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const toggleSelectProduct = (id: string) => {
    const next = new Set(selectedProducts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProducts(next);
  };

  // Filter and Pagination Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const searchStr = searchTerm.toLowerCase();
      const nameMatch = (p.name || '').toLowerCase().includes(searchStr);
      const catMatch = (p.category || '').toLowerCase().includes(searchStr);
      return nameMatch || catMatch;
    });
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  if (loading && products.length === 0) return <div>Loading products...</div>;

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Products Management</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.6rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '250px' }}
          />
          <button className="admin-btn-primary" onClick={openAddModal}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Product
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Bulk Actions Toolbar */}
        {selectedProducts.size > 0 && (
          <div style={{ padding: '1rem 1.5rem', backgroundColor: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#b91c1c' }}>{selectedProducts.size} selected</span>
            <button 
              onClick={handleBulkDelete}
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Delete Selected
            </button>
          </div>
        )}

        {/* Product List */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>
            <input 
              type="checkbox" 
              checked={currentProducts.length > 0 && selectedProducts.size === currentProducts.length}
              onChange={toggleSelectAll}
              style={{ marginRight: '1rem' }}
            />
            <div style={{ flex: 1 }}>Product</div>
            <div style={{ width: '100px', textAlign: 'center' }}>Status</div>
            <div style={{ width: '100px', textAlign: 'right' }}>Actions</div>
          </div>

          {/* Product Rows */}
          {currentProducts.map((product: Product) => (
            <div 
              key={product._id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid #f1f1f1',
                backgroundColor: selectedProducts.has(product._id) ? '#f0f9ff' : 'transparent',
                transition: 'background-color 0.2s'
              }}
            >
              <input 
                type="checkbox" 
                checked={selectedProducts.has(product._id)} 
                onChange={() => toggleSelectProduct(product._id)} 
                style={{ marginRight: '1.5rem' }} 
              />
              
              {product.image && (
              <Image 
                src={product.image} 
                alt={product.name} 
                width={56}
                height={56}
                style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', marginRight: '1rem', border: '1px solid #f3f4f6' }} 
              />
            )}
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem' }}>{product.name}</div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
                  {product.countInStock > 0 ? <span style={{color: '#166534'}}>Available</span> : <span style={{color: '#ef4444'}}>Not Available</span>} &middot; {product.category}
                </div>
              </div>
              
              <div style={{ width: '100px', display: 'flex', justifyContent: 'center' }}>
                <span style={{ 
                  padding: '0.35rem 0.75rem', 
                  backgroundColor: '#bbf7d0', 
                  color: '#166534', 
                  borderRadius: '20px', 
                  fontSize: '0.8rem', 
                  fontWeight: 700 
                }}>
                  Active
                </span>
              </div>

              <div style={{ width: '100px', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button 
                  onClick={() => openEditModal(product)}
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.5rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button 
                  onClick={() => deleteProduct(product._id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          ))}

          {currentProducts.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No products found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
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

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <div className="admin-form-grid">
              <div className="form-group full-width">
                <label>Product Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Silk Saree" />
              </div>
              <div className="form-group">
                <label>Selling Price (₹)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Original MRP (₹) - Crossed out</label>
                <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={primaryCategory} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setPrimaryCategory(val);
                    setFormData({ ...formData, category: val });
                  }}
                >
                  <option value="lehengas">Lehengas</option>
                  <option value="sarees">Sarees</option>
                  <option value="half-sarees">Half Sarees</option>
                  <option value="navratri-ghagra">Navratri Ghagra</option>
                </select>
              </div>

              {primaryCategory === 'sarees' && (
                <div className="form-group">
                  <label>Saree Subcategory</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="sarees">All Sarees (No subcategory)</option>
                    <option value="normal-sarees">Normal Sarees</option>
                    <option value="party-sarees">Party Sarees</option>
                    <option value="silk-sarees">Silk Sarees</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Inspired By (Celebrity)</label>
                <input type="text" name="celebrity" value={formData.celebrity} onChange={handleChange} placeholder="e.g. Deepika Inspired" />
              </div>
              <div className="form-group">
                <label>Occasion</label>
                <select name="occasion" value={formData.occasion} onChange={handleChange}>
                  <option value="">None</option>
                  <option value="Diwali">Diwali</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Party">Party</option>
                  <option value="Daily Wear">Daily Wear</option>
                  <option value="Festive">Festive</option>
                </select>
              </div>

              <div className="form-group full-width" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <label>Images (Exact 5 Required: 1 Main + 4 Gallery)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Main Image */}
                  <div style={{ gridColumn: '1 / -1', border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#666' }}>Main Hero Image</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                      <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="/images/..." style={{ flex: 1 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="file" onChange={(e) => uploadFileHandler(e, 'image')} disabled={uploadingField === 'image'} style={{ width: '100px' }} />
                        {uploadingField === 'image' && <span style={{ fontSize: '0.85rem', color: '#C2185B' }}>Uploading...</span>}
                      </div>
                    </div>
                  </div>

                  {/* 4 Additional Images in 2x2 Grid */}
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: '#666' }}>Gallery Image {index + 1}</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="text" value={formData.images[index] || ''} onChange={(e) => {
                          const newImages = [...formData.images];
                          newImages[index] = e.target.value;
                          setFormData({ ...formData, images: newImages });
                        }} placeholder="/images/..." />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input type="file" onChange={(e) => uploadFileHandler(e, 'images', index)} disabled={uploadingField === `images${index}`} />
                          {uploadingField === `images${index}` && <span style={{ fontSize: '0.85rem', color: '#C2185B' }}>Uploading...</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              <div className="form-group full-width">
                <label>Short Description (1-2 lines)</label>
                <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleChange} placeholder="Brief summary highlighting the product" />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3}></textarea>
              </div>
              <div className="form-group full-width">
                <label>Product Highlights (e.g., embroidery, fabric, pattern)</label>
                <textarea name="highlights" value={formData.highlights} onChange={handleChange} rows={2} placeholder="Key features..."></textarea>
              </div>
              <div className="form-group full-width">
                <label>Care Instructions</label>
                <input type="text" name="careInstructions" value={formData.careInstructions} onChange={handleChange} placeholder="e.g. Dry clean only" />
              </div>
              <div className="form-group full-width">
                <label>What&apos;s Included</label>
                <input type="text" name="whatsIncluded" value={formData.whatsIncluded} onChange={handleChange} placeholder="e.g. Saree + Blouse piece" />
              </div>
              <div className="form-group full-width" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <input type="checkbox" name="isNewArrival" checked={formData.isNewArrival} onChange={handleChange} style={{ width: 'auto', accentColor: '#C2185B' }} />
                <label style={{ margin: 0, cursor: 'pointer' }}>Mark as New Arrival</label>
              </div>
              <div className="form-group full-width" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={formData.countInStock > 0} 
                  onChange={(e) => setFormData({ ...formData, countInStock: e.target.checked ? 100 : 0 })} 
                  style={{ width: 'auto', accentColor: '#C2185B' }} 
                />
                <label style={{ margin: 0, cursor: 'pointer' }}>Product is Available</label>
              </div>
            </div>
            <div className="admin-modal-actions" style={{ marginTop: '2rem' }}>
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
