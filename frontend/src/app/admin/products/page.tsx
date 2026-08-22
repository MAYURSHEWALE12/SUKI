"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';

// ── Custom dropdown (fully styleable, matches admin navy theme) ──────────────
interface SelectOption { value: string; label: string; }
function AdminSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.55rem 0.85rem', background: '#fff',
          border: open ? '1.5px solid #111d4a' : '1px solid #e5e7eb',
          borderRadius: open ? '8px 8px 0 0' : '8px',
          cursor: 'pointer', fontSize: '0.9rem',
          color: selected ? '#111827' : '#9ca3af',
          boxShadow: open ? '0 0 0 3px rgba(17,29,74,0.08)' : '0 1px 2px rgba(0,0,0,0.02) inset',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          userSelect: 'none',
        }}
      >
        <span>{selected ? selected.label : (placeholder || 'Select…')}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#6b7280" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          background: '#fff', border: '1.5px solid #111d4a', borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 8px 24px rgba(17,29,74,0.12)',
          overflow: 'hidden',
        }}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: '0.7rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? 600 : 400,
                  background: isSelected ? '#111d4a' : '#fff',
                  color: isSelected ? '#fff' : '#111827',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'background 0.15s',
                  borderLeft: isSelected ? '3px solid #4f6eff' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f0f2ff'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
              >
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Custom Image Upload Field (Buttons Only, No text input) ──────────────────
function AdminImageField({
  label,
  value,
  onChange,
  onUpload,
  isUploading,
  isMain = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  isMain?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        border: value ? '1px solid #cbd5e1' : '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '0.85rem 1rem',
        background: isMain ? '#f8fafc' : '#ffffff',
        borderLeft: isMain ? '3px solid #111d4a' : (value ? '3px solid #16a34a' : '1px solid #e5e7eb'),
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onUpload}
        disabled={isUploading}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
          {label}
        </span>
        {value && (
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Uploaded
          </span>
        )}
      </div>

      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Thumbnail preview */}
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flex: 1, gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '0.5rem 0.85rem',
                background: '#111d4a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                opacity: isUploading ? 0.7 : 1,
              }}
            >
              {isUploading ? (
                'Uploading...'
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Change
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                padding: '0.5rem 0.75rem',
                background: '#fee2e2',
                color: '#b91c1c',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            border: '1.5px dashed #cbd5e1',
            borderRadius: '8px',
            background: '#f8fafc',
            color: '#111d4a',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isUploading) {
              e.currentTarget.style.borderColor = '#111d4a';
              e.currentTarget.style.background = '#f0f4ff';
            }
          }}
          onMouseLeave={(e) => {
            if (!isUploading) {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.background = '#f8fafc';
            }
          }}
        >
          {isUploading ? (
            'Uploading...'
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Image
            </>
          )}
        </button>
      )}
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────



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
  isBestSeller?: boolean;
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
  price: number | string;
  originalPrice: number | string;
  countInStock: number;
  image: string;
  images: string[];
  celebrity: string;
  occasion: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  shortDescription: string;
  highlights: string;
  careInstructions: string;
  whatsIncluded: string;
}

export default function AdminProductsPage() {
  const { showToast } = useToast();
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
    price: '',
    originalPrice: '',
    countInStock: 0,
    image: '',
    images: ['', '', '', ''],
    celebrity: '',
    occasion: '',
    isNewArrival: false,
    isBestSeller: false,
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
      name: '', brand: 'Suki Ethnic', category: 'lehengas', celebrity: '', occasion: '', description: '', shortDescription: '', highlights: '', careInstructions: '', whatsIncluded: '', price: '', originalPrice: '', countInStock: 0, image: '', images: ['', '', '', ''], isNewArrival: false, isBestSeller: false
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
      price: product.price ?? '',
      originalPrice: product.originalPrice ?? '',
      countInStock: product.countInStock || 0,
      celebrity: product.celebrity || '',
      occasion: product.occasion || '',
      image: product.image || '',
      images: product.images || ['', '', '', ''],
      isNewArrival: product.isNewArrival || false,
      isBestSeller: product.isBestSeller || false,
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
      // For number inputs: keep empty string when cleared, otherwise store as number
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value)
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
        showToast('Image uploaded successfully!', 'success');
      } else {
        console.error('Upload failed:', xhr.responseText);
        showToast(`Error uploading file: ${xhr.responseText || 'Internal Server Error'}`, 'error');
      }
    };
    
    xhr.onerror = () => {
      setUploadingField(null);
      console.error('XHR network error');
      showToast('Network error while uploading file.', 'error');
    };
    
    xhr.send(uploadData);
  };

  const saveProduct = async () => {
    setSaving(true);
    
    const payload = {
      ...formData,
      price: formData.price === '' ? 0 : Number(formData.price),
      originalPrice: formData.originalPrice === '' ? 0 : Number(formData.originalPrice),
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
        showToast(editingProduct ? 'Product updated successfully!' : 'Product created successfully!', 'success');
        fetchProducts();
        setShowModal(false);
      } else {
        const err = await res.json();
        showToast('Error saving product: ' + (err.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Network error while saving product.', 'error');
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
    <div className="admin-products-page">
      <div className="admin-page-header">
        <h1>Products Management</h1>
        <div className="admin-list-header-actions">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="admin-search-input"
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
          <div style={{ padding: '1rem 1.5rem', backgroundColor: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <div className="admin-products-list-header">
            <input 
              type="checkbox" 
              checked={currentProducts.length > 0 && selectedProducts.size === currentProducts.length}
              onChange={toggleSelectAll}
              style={{ marginRight: '1rem' }}
            />
            <div className="admin-col-product">Product</div>
            <div className="admin-col-status">Status</div>
            <div className="admin-col-actions">Actions</div>
          </div>

          {/* Product Rows */}
          {currentProducts.map((product: Product) => (
            <div 
              key={product._id} 
              className="admin-product-row"
              style={{ 
                backgroundColor: selectedProducts.has(product._id) ? '#f0f9ff' : 'transparent',
              }}
            >
              <input 
                type="checkbox" 
                checked={selectedProducts.has(product._id)} 
                onChange={() => toggleSelectProduct(product._id)} 
                style={{ marginRight: '1.5rem', flexShrink: 0 }} 
              />
              
              {product.image && (
              <Image 
                src={product.image} 
                alt={product.name} 
                width={56}
                height={56}
                className="admin-product-thumb"
              />
            )}
              
              <div className="admin-product-info">
                <div className="admin-product-name">
                  {product.name}
                  {product.isBestSeller && (
                    <span style={{ background: '#FFF3CD', color: '#92400E', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      ⭐ Best Seller
                    </span>
                  )}
                  {product.isNewArrival && (
                    <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                      New
                    </span>
                  )}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
                  {product.countInStock > 0 ? <span style={{color: '#166534'}}>Available</span> : <span style={{color: '#ef4444'}}>Not Available</span>} &middot; {product.category}
                </div>
              </div>
              
              <div className="admin-col-status">
                <span style={{ 
                  padding: '0.35rem 0.75rem', 
                  backgroundColor: '#bbf7d0', 
                  color: '#166534', 
                  borderRadius: '20px', 
                  fontSize: '0.8rem', 
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}>
                  Active
                </span>
              </div>

              <div className="admin-col-actions">
                <button 
                  onClick={() => openEditModal(product)}
                  aria-label="Edit product"
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.5rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button 
                  onClick={() => deleteProduct(product._id)}
                  aria-label="Delete product"
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
          <div className="admin-pagination">
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
                <AdminSelect
                  value={primaryCategory}
                  onChange={(val) => {
                    setPrimaryCategory(val);
                    setFormData({ ...formData, category: val });
                  }}
                  options={[
                    { value: 'lehengas', label: 'Lehengas' },
                    { value: 'sarees', label: 'Sarees' },
                    { value: 'half-sarees', label: 'Half Sarees' },
                    { value: 'navratri-ghagra', label: 'Navratri Ghagra' },
                  ]}
                />
              </div>

              {primaryCategory === 'sarees' && (
                <div className="form-group">
                  <label>Saree Subcategory</label>
                  <AdminSelect
                    value={formData.category as string}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={[
                      { value: 'sarees', label: 'All Sarees (No subcategory)' },
                      { value: 'normal-sarees', label: 'Normal Sarees' },
                      { value: 'party-sarees', label: 'Party Sarees' },
                      { value: 'silk-sarees', label: 'Silk Sarees' },
                    ]}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Inspired By (Celebrity)</label>
                <input type="text" name="celebrity" value={formData.celebrity} onChange={handleChange} placeholder="e.g. Deepika Inspired" />
              </div>
              <div className="form-group">
                <label>Occasion</label>
                <AdminSelect
                  value={formData.occasion}
                  onChange={(val) => setFormData({ ...formData, occasion: val })}
                  options={[
                    { value: '', label: 'None' },
                    { value: 'Diwali', label: 'Diwali' },
                    { value: 'Wedding', label: 'Wedding' },
                    { value: 'Party', label: 'Party' },
                    { value: 'Daily Wear', label: 'Daily Wear' },
                    { value: 'Festive', label: 'Festive' },
                  ]}
                />
              </div>

              <div className="form-group full-width" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                  Product Images (5 Required: 1 Hero + 4 Gallery)
                </label>
                <div className="admin-image-grid">
                  {/* Main Image - Spans full width */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <AdminImageField
                      label="Main Hero Image (Primary)"
                      value={formData.image}
                      onChange={(val) => setFormData({ ...formData, image: val })}
                      onUpload={(e) => uploadFileHandler(e, 'image')}
                      isUploading={uploadingField === 'image'}
                      isMain={true}
                    />
                  </div>

                  {/* 4 Gallery Images in 2x2 Grid */}
                  {[0, 1, 2, 3].map((index) => (
                    <AdminImageField
                      key={index}
                      label={`Gallery Image ${index + 1}`}
                      value={formData.images[index] || ''}
                      onChange={(val) => {
                        const newImages = [...(formData.images || ['', '', '', ''])];
                        newImages[index] = val;
                        setFormData({ ...formData, images: newImages });
                      }}
                      onUpload={(e) => uploadFileHandler(e, 'images', index)}
                      isUploading={uploadingField === `images${index}`}
                    />
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
                <input type="checkbox" name="isBestSeller" checked={formData.isBestSeller} onChange={handleChange} style={{ width: 'auto', accentColor: '#C2185B' }} />
                <label style={{ margin: 0, cursor: 'pointer' }}>⭐ Mark as Best Seller</label>
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
