"use client";
import React, { useEffect, useState } from 'react';

export default function AdminHomepageManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroBanners, setHeroBanners] = useState([
    {
      image: '',
      heading: '',
      subheading: '',
      buttonText: '',
      buttonLink: ''
    }
  ]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/homepage');
      const data = await res.json();
      if (res.ok && data.heroBanners) {
        setHeroBanners(data.heroBanners);
      }
    } catch (error) {
      console.error('Error fetching homepage config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHeroBanners(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
  };

  const uploadFileHandler = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Image upload failed');
      }

      const imageUrl = await res.text();
      setHeroBanners(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], image: `${imageUrl}` };
        return updated;
      });
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    }
  };

  const handleAddBanner = () => {
    setHeroBanners(prev => [
      ...prev,
      {
        image: '',
        heading: 'New Collection',
        subheading: 'Discover our latest arrivals',
        buttonText: 'SHOP NOW',
        buttonLink: '/'
      }
    ]);
  };

  const handleRemoveBanner = (index: number) => {
    setHeroBanners(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('suki_admin_token');
      const res = await fetch('/api/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ heroBanners })
      });
      if (res.ok) {
        alert('Homepage configuration updated successfully!');
      } else {
        const err = await res.json();
        alert(`Failed to update: ${err.message}`);
      }
    } catch (error) {
      console.error('Error saving config', error);
      alert('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Homepage Manager</h1>
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>Hero Banners Settings</h2>
          <button className="btn pdp-btn-outline" onClick={handleAddBanner} style={{ padding: '0.5rem 1rem' }}>
            + Add Banner
          </button>
        </div>
        
        {heroBanners.map((banner, index) => (
          <div key={index} className="admin-form-grid" style={{ border: '1px solid rgba(212, 175, 55, 0.2)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', position: 'relative' }}>
            <h3 style={{ gridColumn: '1 / -1', marginBottom: '1rem', color: '#d4af37' }}>Banner #{index + 1}</h3>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
              <button 
                type="button"
                onClick={() => handleRemoveBanner(index)}
                style={{ background: 'none', border: 'none', color: '#ff8a8a', cursor: 'pointer', fontWeight: 'bold', padding: '0.5rem' }}
              >
                Remove
              </button>
            </div>
            
            <div className="form-group full-width">
              <label>Banner Image</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  name="image" 
                  value={banner.image} 
                  onChange={(e) => handleChange(index, e)} 
                  placeholder="https://images.unsplash.com/..." 
                  style={{ flex: 1 }}
                />
                <span style={{ color: '#888' }}>OR</span>
                <input 
                  type="file" 
                  onChange={(e) => uploadFileHandler(index, e)} 
                  style={{ flex: 1, padding: '0.4rem', border: '1px solid #333', borderRadius: '4px' }}
                />
              </div>
              {banner.image && (
                <div style={{ marginTop: '1rem', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', height: '200px' }}>
                  <img src={banner.image} alt="Hero Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
            
            <div className="form-group full-width">
              <label>Heading</label>
              <input 
                type="text" 
                name="heading" 
                value={banner.heading} 
                onChange={(e) => handleChange(index, e)} 
              />
            </div>
            
            <div className="form-group full-width">
              <label>Subheading</label>
              <textarea 
                name="subheading" 
                value={banner.subheading} 
                onChange={(e) => handleChange(index, e)} 
                rows={3}
              ></textarea>
            </div>
            
            <div className="form-group">
              <label>Button Text</label>
              <input 
                type="text" 
                name="buttonText" 
                value={banner.buttonText} 
                onChange={(e) => handleChange(index, e)} 
              />
            </div>
            
            <div className="form-group">
              <label>Button Link</label>
              <input 
                type="text" 
                name="buttonLink" 
                value={banner.buttonLink} 
                onChange={(e) => handleChange(index, e)} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
