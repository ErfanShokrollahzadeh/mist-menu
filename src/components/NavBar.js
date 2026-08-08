"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="nav-bar" id="navBar">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          <img src="/logo.jpg" alt="Mist Cafe Logo" className="nav-logo" style={{ objectFit: 'cover' }} />
          <span className="nav-brand-text">MIST CAFÉ</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Menü</Link>
          <Link href="/wifi" className={`nav-link ${pathname === '/wifi' ? 'active' : ''}`}>Wi-Fi</Link>
          <Link href="/announcements" className={`nav-link ${pathname === '/announcements' ? 'active' : ''}`}>Duyurular</Link>
          <Link href="/feedback" className={`nav-link ${pathname === '/feedback' ? 'active' : ''}`}>Görüşler</Link>
        </div>
        <button className="nav-waiter-btn" onClick={() => alert('Garson masanıza çağrıldı!')}>
          🛎 Garson Çağır
        </button>
      </div>
    </nav>
  );
}
