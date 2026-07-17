"use client";
import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import './cart.css';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotalPrice, cartTotalQuantity } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-state container">
        <div className="empty-cart-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        </div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link href="/" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <h1 className="cart-title">Your Cart ({cartTotalQuantity} items)</h1>
      
      <div className="cart-layout">
        <div className="cart-items-section">
          <div className="cart-items-header">
            <span className="col-product">Product</span>
            <span className="col-price">Price</span>
            <span className="col-qty">Quantity</span>
            <span className="col-total">Total</span>
          </div>
          
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={`${item._id}-${item.size}`} className="cart-item">
                <div className="cart-item-product col-product">
                  <div className="cart-item-img-container">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="cart-item-details">
                    <Link href={`/product/${item._id}`} className="cart-item-name">{item.name}</Link>
                    <span className="cart-item-size">Size: {item.size}</span>
                    <button 
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item._id, item.size)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                <div className="cart-item-price col-price">
                  ₹{item.price}
                </div>
                
                <div className="cart-item-qty col-qty">
                  <div className="qty-control">
                    <button 
                      className="qty-btn" 
                      onClick={() => updateQuantity(item._id, item.size, item.quantity - 1)}
                    >-</button>
                    <span className="qty-number">{item.quantity}</span>
                    <button 
                      className="qty-btn" 
                      onClick={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                      disabled={item.quantity >= item.countInStock}
                    >+</button>
                  </div>
                </div>
                
                <div className="cart-item-total col-total">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-summary-section">
          <div className="cart-summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartTotalPrice}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{cartTotalPrice}</span>
            </div>
            <button className="btn btn-primary checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
            <div className="secure-checkout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
