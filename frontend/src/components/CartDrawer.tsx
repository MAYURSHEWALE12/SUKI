"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    cartTotalPrice,
    cartTotalQuantity
  } = useCart();

  // Prevent background scrolling when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="cart-drawer-container">
      <div 
        className="cart-drawer-overlay" 
        onClick={() => setIsCartOpen(false)}
      />
      
      <div className={`cart-drawer-panel ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h2>Your Cart ({cartTotalQuantity})</h2>
          <button 
            className="cart-drawer-close" 
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <p>Your cart is currently empty.</p>
              <button 
                className="btn-continue-shopping"
                onClick={() => setIsCartOpen(false)}
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={`${item._id}`} className="cart-item">
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  
                  <div className="cart-item-details">
                    <h3 className="cart-item-title">{item.name}</h3>
                    
                    <div className="cart-item-price">
                      ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>

                    <div className="cart-item-actions">
                      <div className="quantity-selector">
                        <button 
                          className="qty-btn"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        className="btn-remove"
                        onClick={() => removeFromCart(item._id)}
                        aria-label="Remove item"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">

            <div className="cart-subtotal">
              <span className="subtotal-label">Estimated Total</span>
              <span className="subtotal-value">
                ₹{cartTotalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <p className="tax-shipping-note">
              Taxes, discounts and shipping calculated at checkout.
            </p>

            <div className="cart-checkout-actions">
              <Link 
                href="/checkout" 
                className="btn-checkout-outside" 
                onClick={() => setIsCartOpen(false)}
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
