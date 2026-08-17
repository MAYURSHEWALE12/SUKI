"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  countInStock?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotalQuantity: number;
  cartTotalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const savedCart = localStorage.getItem('suki_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
      } catch (error) {
        console.error("Could not parse cart from localStorage", error);
      }
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('suki_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i._id === item._id);
      
      if (existingItem) {
        // Increase quantity but cap at countInStock if it exists
        const increment = item.quantity || 1;
        const newQuantity = existingItem.countInStock !== undefined 
          ? Math.min(existingItem.quantity + increment, existingItem.countInStock)
          : existingItem.quantity + increment;
          
        return prevItems.map(i => 
          i._id === item._id
            ? { ...i, quantity: newQuantity } 
            : i
        );
      }
      
      return [...prevItems, item];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(i => i._id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(i => {
        if (i._id === id) {
          const newQuantity = i.countInStock !== undefined 
            ? Math.min(quantity, i.countInStock) 
            : quantity;
          return { ...i, quantity: newQuantity };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity,
      clearCart,
      cartTotalQuantity,
      cartTotalPrice,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
