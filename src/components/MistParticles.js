"use client";

import { useEffect, useState } from "react";

export default function MistParticles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate random values only on the client
    const newParticles = Array.from({ length: 12 }).map(() => ({
      size: 80 + Math.random() * 200,
      left: Math.random() * 100,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 20,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="mist-particles" aria-hidden="true">
      {particles.map((p, i) => (
        <div
          key={i}
          className="mist-particle"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

