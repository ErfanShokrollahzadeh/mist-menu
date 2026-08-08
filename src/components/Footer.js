"use client";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <img src="/logo.jpg" alt="Mist Cafe Logo" className="footer-logo-circle" style={{ objectFit: 'cover', padding: '0' }} />
          <span className="footer-brand">MiST CAFÉ</span>
        </div>
        <p className="footer-text">{t('footerText')}</p>
        <div className="footer-divider" />
        <p className="footer-copyright">
          {t('footerCopyright')}
        </p>
      </div>
    </footer>
  );
}
