"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeroBanner {
  heading: string;
  subheading: string;
  image: string;
  buttonLink: string;
  buttonText: string;
}

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([
    {
      id: 1,
      title: "Wear The Trend. Own The Moment.",
      subtitle: "Exquisite ethnic wear curated for the modern Indian woman.",
      image: "/hero_banner_suki.png",
      link: "/new-arrivals",
      buttonText: "Shop Now",
    }
  ]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/homepage');
        const data = await res.json();
        if (data.heroBanners && data.heroBanners.length > 0) {
          const newSlides = data.heroBanners.map((b: HeroBanner, index: number) => ({
            id: index + 1,
            title: b.heading,
            subtitle: b.subheading,
            image: b.image,
            link: b.buttonLink,
            buttonText: b.buttonText
          }));
          setSlides(newSlides);
        }
      } catch (err) {
        console.error('Failed to load hero banner config', err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="hero">
      <div 
        className="hero-slides-container" 
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="hero-slide">
            <div className="hero-left">
              <h2>{slide.title}</h2>
              <p>{slide.subtitle}</p>
              <Link href={slide.link} className="btn btn-hero">{slide.buttonText}</Link>
            </div>
            <div className="hero-right" style={{ position: 'relative' }}>
              <Image 
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                style={{ objectFit: 'cover', objectPosition: 'center' }} 
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Dots centered exactly on the 50% split line */}
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, index) => (
            <span 
              key={index}
              className={`dot ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            ></span>
          ))}
        </div>
      )}
      
      <div className="hero-bottom-border"></div>
    </section>
  );
}
