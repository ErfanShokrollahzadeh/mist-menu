"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function NavBar() {
  const pathname = usePathname();
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <nav className="nav-bar" id="navBar">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          <img src="/logo.jpg" alt="Mist Cafe Logo" className="nav-logo" style={{ objectFit: 'cover' }} />
          <span className="nav-brand-text">MIST CAFÉ</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>{t('menu')}</Link>
          <Link href="/wifi" className={`nav-link ${pathname === '/wifi' ? 'active' : ''}`}>{t('wifi')}</Link>
          <Link href="/announcements" className={`nav-link ${pathname === '/announcements' ? 'active' : ''}`}>{t('announcements')}</Link>
          <Link href="/feedback" className={`nav-link ${pathname === '/feedback' ? 'active' : ''}`}>{t('feedback')}</Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={toggleLanguage}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '20px',
              padding: '0.3rem 0.8rem',
              color: 'var(--white)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.9rem'
            }}
          >
            {lang === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
          </button>
          <button className="nav-waiter-btn" onClick={() => alert(t('callWaiterSuccess'))}>
            {t('callWaiter')}
          </button>
        </div>
      </div>
    </nav>
  );
}
