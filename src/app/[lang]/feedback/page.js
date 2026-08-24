"use client";
import { useState } from "react";
import NavBar from "@/components/NavBar";
import MistParticles from "@/components/MistParticles";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(t('feedbackSuccess').replace('{rating}', rating));
  };

  return (
    <>
      <MistParticles />
      <NavBar />
      <main className="page-container reveal visible">
        <h1 className="page-title">{t('feedbackTitle')}</h1>
        <p>{t('feedbackDesc')}</p>
        
        <form className="fancy-form" onSubmit={handleSubmit}>
          <input type="text" className="fancy-input" placeholder={t('feedbackName')} required />
          <input type="email" className="fancy-input" placeholder={t('feedbackEmail')} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--white)', fontSize: '1rem', marginRight: '0.5rem' }}>{t('feedbackRating')}</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className="star-btn"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(rating)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.8rem',
                  color: star <= (hover || rating) ? 'var(--gold-500)' : 'rgba(255,255,255,0.2)',
                  transition: 'color 0.2s',
                  padding: 0
                }}
              >
                ★
              </button>
            ))}
          </div>

          <textarea className="fancy-textarea" placeholder={t('feedbackMessage')} required></textarea>
          <button type="submit" className="fancy-button">{t('feedbackSubmit')}</button>
        </form>
      </main>
      <Footer />
    </>
  );
}
