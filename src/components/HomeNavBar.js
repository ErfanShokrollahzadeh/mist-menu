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
          <div className="side-menu-header">
            <span className="side-menu-title">Menü</span>
            <button className="close-menu-btn" onClick={closeMenu}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="side-menu-content">
            <div className="side-menu-links">
              <Link href={`/${lang}`} className="side-nav-link" onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>{lang === 'tr' ? 'Ana Sayfa' : 'Home'}</span>
              </Link>
              <Link href={`/${lang}/menu`} className={`side-nav-link ${pathname === `/${lang}/menu` ? 'active' : ''}`} onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>
                <span>{t('menu')}</span>
              </Link>
              <Link href={`/${lang}/wifi`} className={`side-nav-link ${pathname === `/${lang}/wifi` ? 'active' : ''}`} onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                <span>{t('wifi')}</span>
              </Link>
              <Link href={`/${lang}/feedback`} className={`side-nav-link ${pathname === `/${lang}/feedback` ? 'active' : ''}`} onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span>{t('feedback')}</span>
              </Link>
              <Link href={`/${lang}/announcements`} className={`side-nav-link ${pathname === `/${lang}/announcements` ? 'active' : ''}`} onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                <span>{t('announcements')}</span>
              </Link>
              <Link href={`/${lang}/bill`} className={`side-nav-link ${pathname === `/${lang}/bill` ? 'active' : ''}`} onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                <span>{t('bill') || 'Hesap'}</span>
              </Link>
              <Link href={`/${lang}/reservation`} className={`side-nav-link ${pathname === `/${lang}/reservation` ? 'active' : ''}`} onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>{t('reservation') || 'Reservation'}</span>
              </Link>
              <Link href={`/${lang}/contact`} className={`side-nav-link ${pathname === `/${lang}/contact` ? 'active' : ''}`} onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>{t('contact') || 'Contact'}</span>
              </Link>
            </div>

            <div className="side-menu-footer">
              <div className="side-menu-socials-title">BİZİ TAKİP EDİN</div>
              <div className="side-menu-socials">
                <a href="https://www.instagram.com/mistcoffeelounge" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="https://www.instagram.com/mistcoffeelounge/" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="https://www.instagram.com/mistcoffeelounge" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
                <a href="https://www.instagram.com/mistcoffeelounge" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </a>
              </div>

              <div className="side-menu-contact">
                <div className="contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <div className="contact-text">
                    <strong>Bizi Arayın</strong>
                    <span>05323407464</span>
                  </div>
                </div>
                <div className="contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <div className="contact-text">
                    <strong>Adres</strong>
                    <span>Yenibağlar, Yılmaz Büyükerşen Blv No:63 Tepebaşı/Eskişehir</span>
                  </div>
                </div>
                <div className="contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <div className="contact-text">
                    <strong>Çalışma Saatleri</strong>
                    <span>10:00 - 06:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
    </>
  );
}
