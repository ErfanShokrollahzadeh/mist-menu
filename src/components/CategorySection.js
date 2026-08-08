"use client";

import { useRef, useEffect } from "react";
import MenuCard from "./MenuCard";

const categoryIcons = {
  Kahvaltı: "🍳",
  Omlet: "🥚",
  Menemen: "🍅",
  Gözleme: "🫓",
  Tost: "🧀",
  Bowl: "🥗",
  Salatalar: "🥬",
  Sandviç: "🥪",
  "Wrap & Quesedilla": "🌯",
  Vegan: "🌱",
  Aperatifler: "🍟",
  Burgerler: "🍔",
  "Makarna & Noodes": "🍝",
  Pizzalar: "🍕",
  "Beyaz Etler": "🍗",
  "Kırmızı Etler": "🥩",
  Tatlılar: "🍰",
  Çay: "🍵",
  "Soft İçecekler": "🥤",
  "Espresso Bazlı Kahveler": "☕",
  "Filtre Kahveler": "☕",
  "Redbull Kokteylleri": "🥫",
  "Sıcak İçecekler": "🫖",
  "Soğuk Kahveler": "🧋",
  "Ev Yapımı Sıkmalar": "🍊",
  "Türk Kahveleri": "☕",
  Milkshake: "🥛",
  Frozen: "🍧",
  "Smoothie Çeşitleri": "🫐",
  "Mist Özel Kokteyller": "🍹",
  Nargileler: "💨",
};

export default function CategorySection({ category, items }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const icon = categoryIcons[category] || "📋";

  return (
    <section
      className="category-section reveal"
      id={`cat-${category.replace(/\s+/g, "-")}`}
      ref={sectionRef}
    >
      <div className="category-header">
        <div className="category-header-icon">{icon}</div>
        <h2 className="category-title">{category}</h2>
        <span className="category-count">{items.length} ürün</span>
      </div>

      <div className="menu-grid reveal-stagger">
        {items.map((item, i) => (
          <MenuCard key={`${category}-${i}`} item={item} />
        ))}
      </div>
    </section>
  );
}
