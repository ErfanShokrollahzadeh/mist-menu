"use client";
import { useState } from "react";
import MistParticles from "@/components/MistParticles";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import HomeNavBar from "@/components/HomeNavBar";

export default function ContactPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("success");
    e.target.reset();
  };

  return (
    <>
      <MistParticles />
      <HomeNavBar />
      <main className="page-container reveal visible">
        <h1 className="page-title">{t('contactTitle')}</h1>
        <p>{t('contactDesc')}</p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '3rem',
          textAlign: 'left'
        }}>
          {/* Contact Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--card-radius)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-400)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Bizi Arayın</h3>
                <p style={{ color: 'var(--gray-400)' }}>05323407464</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-400)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Adres</h3>
                <p style={{ color: 'var(--gray-400)', lineHeight: 1.4 }}>Yenibağlar, Yılmaz Büyükerşen Blv No:63<br/>Tepebaşı / Eskişehir</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-400)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Çalışma Saatleri</h3>
                <p style={{ color: 'var(--gray-400)' }}>10:00 - 06:00</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <form className="fancy-form" onSubmit={handleSubmit}>
              <input type="text" className="fancy-input" placeholder={t('feedbackName')} required />
              <input type="email" className="fancy-input" placeholder={t('feedbackEmail')} required />
              <textarea className="fancy-textarea" placeholder={t('feedbackMessage')} required style={{ minHeight: '150px' }}></textarea>
              <button type="submit" className="fancy-button">{t('feedbackSubmit')}</button>
              
              {status === 'success' && (
                <p style={{ color: '#4ade80', marginTop: '1rem', textAlign: 'center' }}>Mesajınız başarıyla gönderildi!</p>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
