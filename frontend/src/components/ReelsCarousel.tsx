"use client";
import React, { useRef, useEffect } from 'react';

export default function ReelsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (trackRef.current) {
        const firstCard = trackRef.current.querySelector('.reel-card');
        const cardWidth = firstCard ? firstCard.clientWidth + 24 : 224;
        
        // If we are about to scroll past the first duplicated set
        if (trackRef.current.scrollLeft >= trackRef.current.scrollWidth / 2 - cardWidth) {
          // Snap instantly back to the corresponding position in the first set
          trackRef.current.scrollTo({ left: trackRef.current.scrollLeft - (trackRef.current.scrollWidth / 2), behavior: 'auto' });
          
          // Then smoothly animate to the next card after a tiny delay to let the DOM settle
          setTimeout(() => {
            trackRef.current?.scrollBy({ left: cardWidth, behavior: 'smooth' });
          }, 50);
        } else {
          trackRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3000); // Auto slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const reels = [
    {
      id: 1,
      video: "/videos/reel1.mp4",
      title: "Pista Banarasi Silk Gadwal Pattu Saree",
      views: "5L",
      thumb: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&q=80"
    },
    {
      id: 2,
      video: "/videos/reel2.mp4",
      title: "Off White Ethnic Motif Silk Blend Saree",
      views: "5L",
      thumb: "https://images.unsplash.com/photo-1583391733958-d15fa693d502?w=100&q=80"
    },
    {
      id: 3,
      video: "/videos/reel3.mp4",
      title: "Cream Colour Double Border Chex Weaving",
      views: "4L",
      thumb: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&q=80"
    },
    {
      id: 4,
      video: "/videos/reel4.mp4",
      title: "Sky Blue Satin Georgette Saree",
      views: "4L",
      thumb: "https://images.unsplash.com/photo-1617261075727-46323497d51b?w=100&q=80"
    },
    {
      id: 5,
      video: "/videos/reel5.mp4",
      title: "Pink Embroidered Saree",
      views: "3L",
      thumb: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&q=80"
    },
    {
      id: 6,
      video: "/videos/reel1.mp4",
      title: "Deepika Singh Rani Pink Silk Woven Saree",
      views: "2L",
      thumb: "https://images.unsplash.com/photo-1583391733959-f58318c47f58?w=100&q=80"
    },
    {
      id: 7,
      video: "/videos/reel2.mp4",
      title: "Mouni Roy Green Floral Blossom Saree",
      views: "1L",
      thumb: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&q=80"
    },
    {
      id: 8,
      video: "/videos/reel3.mp4",
      title: "Purple Bhagalpuri Silk Printed Saree",
      views: "50K",
      thumb: "https://images.unsplash.com/photo-1617261075727-46323497d51b?w=100&q=80"
    }
  ];

  return (
    <section className="reels-section">
      <div className="reels-decorative-border"></div>
      <div className="container">
        <h2 className="section-title reels-title">Trending Styles</h2>
      </div>
      <div className="reels-container" ref={trackRef}>
        <div className="reels-track">
          {[...reels, ...reels].map((reel, index) => (
            <div className="reel-card" key={`${reel.id}-${index}`}>
              <div className="reel-video-container">
                <div className="reel-views">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  {reel.views}
                </div>
                <video className="reel-video" autoPlay loop muted playsInline>
                  <source src={reel.video} type="video/mp4" />
                </video>
                <div className="reel-product-info">
                  <p className="reel-product-title">{reel.title}</p>
                </div>
              </div>
              <button className="reel-add-cart-btn">Add To Cart</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
