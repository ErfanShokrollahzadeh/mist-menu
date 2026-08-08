import NavBar from "@/components/NavBar";
import MistParticles from "@/components/MistParticles";
import Footer from "@/components/Footer";

export default function AnnouncementsPage() {
  const announcements = [
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

  return (
    <>
      <MistParticles />
      <NavBar />
      <main className="page-container reveal visible">
        <h1 className="page-title">Duyurular</h1>
        <p>Mist Café'den en güncel haberler ve etkinlikler.</p>
        
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
