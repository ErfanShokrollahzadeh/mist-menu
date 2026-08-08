"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function HomeNavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { lang, t } = useLanguage();

  const toggleLanguage = () => {
    const nextLang = lang === 'tr' ? 'en' : 'tr';
    const newPath = pathname.replace(`/${lang}`, `/${nextLang}`);
    
    document.cookie = `mist-lang=${nextLang}; path=/; max-age=31536000`;
    router.push(newPath);
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className="home-nav-bar">
        <div className="home-nav-inner">
          
          {/* Left: Hamburger (Blue icon) */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              className="home-hamburger-btn" 
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--white)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>

          {/* Center: Logo */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src="/logo.jpg" alt="Mist Cafe Logo" className="home-nav-logo" />
          </div>

          {/* Right: Language Toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button onClick={toggleLanguage} className="home-lang-toggle">
              {lang === 'tr' ? (
                <span className="flag-icon" style={{ fontSize: '1.5rem', lineHeight: 1 }}>🇹🇷</span>
              ) : (
                <span className="flag-icon" style={{ fontSize: '1.5rem', lineHeight: 1 }}>🇬🇧</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Fullscreen Overlay Menu */}
      <div className={`side-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={closeMenu}>
        <div className={`side-menu ${isMenuOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          <button className="close-menu-btn" onClick={closeMenu}>✕</button>
          <div className="side-menu-links">
            <Link href={`/${lang}/menu`} className={`side-nav-link ${pathname === `/${lang}/menu` ? 'active' : ''}`} onClick={closeMenu}>{t('menu')}</Link>
            <Link href={`/${lang}/wifi`} className={`side-nav-link ${pathname === `/${lang}/wifi` ? 'active' : ''}`} onClick={closeMenu}>{t('wifi')}</Link>
            <Link href={`/${lang}/announcements`} className={`side-nav-link ${pathname === `/${lang}/announcements` ? 'active' : ''}`} onClick={closeMenu}>{t('announcements')}</Link>
            <Link href={`/${lang}/feedback`} className={`side-nav-link ${pathname === `/${lang}/feedback` ? 'active' : ''}`} onClick={closeMenu}>{t('feedback')}</Link>
            <button className="side-waiter-btn" onClick={() => { alert(t('callWaiterSuccess')); closeMenu(); }}>
              {t('callWaiter')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
