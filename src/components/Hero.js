"use client";

import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { useState, useEffect } from 'react';



export default function Hero() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const SLIDES = [
    { image: '/slider1.jpg', title: t('slide1Title'), subtitle: t('slide1Subtitle') },
    { image: '/slider2.jpg', title: t('slide2Title'), subtitle: t('slide2Subtitle') },
    { image: '/slider3.jpg', title: t('slide3Title'), subtitle: t('slide3Subtitle') },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-slider">
      {SLIDES.map((slide, index) => (
        <div 
          key={index}
          className={`slide ${index === currentSlide ? 'active' : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="slide-overlay">
            <h1 className="slide-title">{slide.title}</h1>
            <p className="slide-subtitle">{slide.subtitle}</p>
          </div>
        </div>
      ))}
      
      <div className="slider-dots">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
