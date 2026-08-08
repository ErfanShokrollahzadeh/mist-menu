"use client";
import { useState } from "react";
import MistParticles from "@/components/MistParticles";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import HomeNavBar from "@/components/HomeNavBar";

export default function ReservationPage() {
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
        <h1 className="page-title">{t('reservationTitle')}</h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>{t('reservationDesc')}</p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '3rem',
          textAlign: 'left'
        }}>
          {/* Reservation Form */}
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <form className="fancy-form" onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <input type="text" className="fancy-input" placeholder={t('resName')} required />
                <input type="tel" className="fancy-input" placeholder={t('resPhone')} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginLeft: '0.8rem' }}>{t('resDate')}</label>
                  <input type="date" className="fancy-input" style={{ colorScheme: 'dark', width: '100%' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginLeft: '0.8rem' }}>{t('resTime')}</label>
                  <input type="time" className="fancy-input" style={{ colorScheme: 'dark', width: '100%' }} required />
                </div>
              </div>

              <select className="fancy-input" required defaultValue="" style={{ width: '100%', color: 'var(--gray-300)', appearance: 'none', backgroundColor: 'var(--glass-bg)' }}>
                <option value="" disabled>{t('resGuests')}</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6+</option>
              </select>

              <textarea className="fancy-textarea" placeholder={t('resRequests')} style={{ minHeight: '120px' }}></textarea>
              
              <button type="submit" className="fancy-button">{t('resSubmit')}</button>
              
              {status === 'success' && (
                <p style={{ color: '#4ade80', marginTop: '1rem', textAlign: 'center' }}>{t('resSuccess')}</p>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
