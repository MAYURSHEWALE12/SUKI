"use client";
import React, { useState, useEffect } from 'react';

const announcements = [
  "Free Shipping Over ₹1499",
  "Shipping Worldwide",
  "Easy Return & Exchange*"
];

export default function PromoStrip() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? announcements.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div className="promo-strip">
      <div className="promo-content container">
        <button className="promo-arrow" onClick={handlePrev} aria-label="Previous announcement">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <p className="promo-text" key={currentIndex}>{announcements[currentIndex]}</p>
        <button className="promo-arrow" onClick={handleNext} aria-label="Next announcement">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}
