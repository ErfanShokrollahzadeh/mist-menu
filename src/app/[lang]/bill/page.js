"use client";
import { useState, useMemo } from "react";
import MistParticles from "@/components/MistParticles";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import NavBar from "@/components/NavBar";

export default function BillPage() {
  const { t } = useLanguage();
  
  // Calculator State
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState(2);
  
  // Notification State
  const [status, setStatus] = useState(null);

  const perPerson = useMemo(() => {
    const amount = parseFloat(total);
    if (isNaN(amount) || amount <= 0 || people <= 0) return 0;
    return (amount / people).toFixed(2);
  }, [total, people]);

  const handleNotify = (e) => {
    e.preventDefault();
    setStatus("success");
    e.target.reset();
  };

  return (
    <>
      <MistParticles />
      <NavBar />
      <main className="page-container reveal visible">
        <h1 className="page-title">{t('billTitle')}</h1>
        <p style={{ textAlign: 'center', marginBottom: '3rem' }}>{t('billDesc')}</p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'left'
        }}>
          
          {/* Section 1: Split Calculator */}
          <div className="fancy-form" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--gold-400)', textAlign: 'center' }}>
              {t('splitTitle')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ fontSize: '0.9rem', color: 'var(--gray-300)', marginLeft: '0.5rem' }}>{t('totalAmount')} (₺)</label>
                <input 
                  type="number" 
                  className="fancy-input" 
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="0.00" 
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label style={{ fontSize: '0.9rem', color: 'var(--gray-300)', marginLeft: '0.5rem' }}>{t('numberOfPeople')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={people}
                    onChange={(e) => setPeople(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--gold-500)' }}
                  />
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{people}</span>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '1.5rem', 
              borderRadius: '16px', 
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('perPerson')}</p>
              <p style={{ color: 'var(--gold-400)', fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                {perPerson} <span style={{ fontSize: '1.2rem' }}>₺</span>
              </p>
            </div>
          </div>

          {/* Section 2: Notify Cashier */}
          <div className="fancy-form" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--gold-400)', textAlign: 'center' }}>
              {t('notifyCashier')}
            </h2>
            
            <form onSubmit={handleNotify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="number" 
                className="fancy-input" 
                placeholder={t('tableNumber')} 
                required 
                min="1"
              />
              
              <select className="fancy-input" required defaultValue="" style={{ appearance: 'none', backgroundColor: 'var(--glass-bg)', color: 'var(--gray-300)' }}>
                <option value="" disabled>{t('paymentMethod')}</option>
                <option value="cash">{t('cash')}</option>
                <option value="credit">{t('creditCard')}</option>
              </select>

              <button type="submit" className="fancy-button" style={{ marginTop: '1rem' }}>
                {t('notifyBtn')}
              </button>
              
              {status === 'success' && (
                <p style={{ color: '#4ade80', marginTop: '1rem', textAlign: 'center' }}>
                  {t('notifySuccess')}
                </p>
              )}
            </form>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
