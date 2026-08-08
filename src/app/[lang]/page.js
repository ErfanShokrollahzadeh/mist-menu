"use client";

import Hero from '@/components/Hero';
import HomeNavBar from '@/components/HomeNavBar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

export default function Home() {
  const { lang, t } = useLanguage();

  const portalCards = [
    {
      title: t('menu'),
      href: `/${lang}/menu`,
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
    },
    {
      title: t('cart') || 'Sepet',
      href: `/${lang}/cart`,
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      )
    },
    {
      title: t('bill') || 'Hesap',
      href: `/${lang}/bill`,
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      title: t('feedback'),
      href: `/${lang}/feedback`,
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      )
    },
    {
      title: t('callWaiter'),
      href: '#',
      onClick: (e) => {
        e.preventDefault();
        alert(t('callWaiterSuccess'));
      },
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    },
    {
      title: t('qr') || 'QR Kodu Tara',
      href: `/${lang}/qr`,
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <rect x="7" y="7" width="3" height="3" />
          <rect x="14" y="7" width="3" height="3" />
          <rect x="7" y="14" width="3" height="3" />
          <rect x="14" y="14" width="3" height="3" />
        </svg>
      )
    }
  ];

  return (
    <>
      <HomeNavBar />
      <Hero />
      <main className="portal-main">
        <div className="portal-grid">
          {portalCards.map((card, i) => (
            <Link 
              key={i} 
              href={card.href} 
              className="portal-card"
              onClick={card.onClick}
            >
              <div className="portal-card-icon">
                {card.icon}
              </div>
              <h2 className="portal-card-title">{card.title}</h2>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
