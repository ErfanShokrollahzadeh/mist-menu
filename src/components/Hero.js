"use client";

import { useEffect, useRef } from "react";

export default function Hero() {
  const ctaRef = useRef(null);

  useEffect(() => {
    const btn = ctaRef.current;
    if (!btn) return;
    const handler = () => {
      const menu = document.getElementById("menuStart");
      if (menu) menu.scrollIntoView({ behavior: "smooth" });
    };
    btn.addEventListener("click", handler);
    return () => btn.removeEventListener("click", handler);
  }, []);

  return (
    <header className="hero" id="hero">
      {/* Animated gradient orbs */}
      <div className="hero-bg-orbs" aria-hidden="true">
        <div className="hero-orb" />
        <div className="hero-orb" />
        <div className="hero-orb" />
      </div>

      <div className="hero-content">
        <div className="logo-wrapper">
          <img src="/logo.jpg" alt="Mist Cafe Logo" className="logo-circle" style={{ objectFit: 'cover', padding: '0' }} />
        </div>
        <h1 className="hero-title">MIST CAFÉ</h1>
        <p className="hero-subtitle">Lezzet Burada Başlar</p>

        <div className="hero-divider">
          <span className="divider-line" />
          <span className="divider-icon">☕</span>
          <span className="divider-line" />
        </div>

        <button className="hero-cta" ref={ctaRef} aria-label="Menüyü keşfet">
          Menüyü Keşfet
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
