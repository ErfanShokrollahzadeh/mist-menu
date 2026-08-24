"use client";
import NavBar from "@/components/NavBar";
import MistParticles from "@/components/MistParticles";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function AnnouncementsPage() {
  const { lang, t } = useLanguage();

  const announcementsTR = [
    {
      id: 1,
      title: "Yaz Menümüz Yayında!",
      date: "15 Haziran",
      content: "Serinletici yeni frozen ve smoothie çeşitlerimizle yaz aylarına hazırız. Menümüzdeki Soğuk İçecekler sekmesinden inceleyebilirsiniz."
    },
    {
      id: 2,
      title: "Canlı Müzik Akşamları",
      date: "Her Cuma & Cumartesi",
      content: "Hafta sonları canlı akustik performanslarımızla sizlerleyiz. Rezervasyon için bizimle iletişime geçin."
    }
  ];

  const announcementsEN = [
    {
      id: 1,
      title: "Our Summer Menu is Live!",
      date: "June 15",
      content: "We are ready for the summer months with our refreshing new frozen and smoothie varieties. You can review them from the Cold Drinks tab in our menu."
    },
    {
      id: 2,
      title: "Live Music Nights",
      date: "Every Friday & Saturday",
      content: "We are with you on weekends with our live acoustic performances. Contact us for reservation."
    }
  ];

  const announcements = lang === 'tr' ? announcementsTR : announcementsEN;

  return (
    <>
      <MistParticles />
      <NavBar />
      <main className="page-container reveal visible">
        <h1 className="page-title">{t('announcementsTitle')}</h1>
        <p>{t('announcementsDesc')}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
          {announcements.map(ann => (
            <div key={ann.id} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--white)', fontSize: '1.2rem' }}>{ann.title}</h3>
                <span style={{ background: 'rgba(234,179,8,0.1)', color: 'var(--gold-300)', padding: '0.2rem 0.8rem', borderRadius: '50px', fontSize: '0.85rem' }}>
                  {ann.date}
                </span>
              </div>
              <p style={{ color: 'var(--gray-300)', lineHeight: '1.6', fontSize: '0.95rem' }}>{ann.content}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
