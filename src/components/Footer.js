export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <img src="/logo.jpg" alt="Mist Cafe Logo" className="footer-logo-circle" style={{ objectFit: 'cover', padding: '0' }} />
          <span className="footer-brand">MIST CAFÉ</span>
        </div>
        <p className="footer-text">Lezzetin en güzel hali</p>
        <div className="footer-divider" />
        <p className="footer-copyright">
          © 2026 Mist Café — Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
