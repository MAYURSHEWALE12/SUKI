"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  toggleWishlist: async () => {},
  loading: true,
});

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    const token = localStorage.getItem('suki_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.wishlist) {
        setWishlist(data.wishlist.map((p: any) => typeof p === 'string' ? p : p._id));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId: string) => {
    const token = localStorage.getItem('suki_token');
    if (!token) {
      alert("Please login to save items to your wishlist.");
      return;
    }

    // Optimistic update
    const isWishlisted = wishlist.includes(productId);
    setWishlist(prev => 
      isWishlisted ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    try {
      // It hits auth/wishlist
      const res = await fetch('/api/auth/wishlist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId })
      });
      if (!res.ok) {
        // Revert on failure
        fetchWishlist();
      } else {
        const data = await res.json();
        setWishlist(data.map((p: any) => typeof p === 'string' ? p : p._id));
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      fetchWishlist(); // Revert
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};
