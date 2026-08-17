"use client";
import React, { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";

interface LehengaProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  rating?: number;
  numReviews?: number;
  countInStock?: number;
  isNewArrival?: boolean;
  createdAt?: string;
}

export default function LehengasPage() {
  const [products, setProducts] = useState<LehengaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams({ category: 'lehengas' });
        if (sort) params.set('sort', sort);
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to load lehengas', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [sort]);

  return (
    <div className="container plp-layout">
      {/* Sidebar Filters */}
      <aside className="plp-sidebar">
        <h3>Filters</h3>
        <div className="filter-group">
          <h4>Price</h4>
          <label><input type="checkbox" /> Under ₹2,999</label>
          <label><input type="checkbox" /> ₹3,000 - ₹5,999</label>
          <label><input type="checkbox" /> ₹6,000 - ₹9,999</label>
          <label><input type="checkbox" /> Above ₹10,000</label>
        </div>
        <div className="filter-group">
          <h4>Color</h4>
          <label><input type="checkbox" /> Pink</label>
          <label><input type="checkbox" /> Red</label>
          <label><input type="checkbox" /> Gold</label>
          <label><input type="checkbox" /> Black</label>
        </div>
        <div className="filter-group">
          <h4>Occasion</h4>
          <label><input type="checkbox" /> Wedding</label>
          <label><input type="checkbox" /> Festive</label>
          <label><input type="checkbox" /> Party Wear</label>
        </div>
      </aside>

      {/* Main Content */}
      <main className="plp-main">
        <div className="plp-header">
          <h2>Lehengas</h2>
          <div className="sort-by">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Sort by: Best Selling</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading lehengas...</p>
        ) : products.length === 0 ? (
          <p>No lehengas currently available.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}