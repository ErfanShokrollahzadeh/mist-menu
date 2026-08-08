import NavBar from "@/components/NavBar";
import MistParticles from "@/components/MistParticles";
import Footer from "@/components/Footer";

export default function WifiPage() {
  return (
    <>
      <MistParticles />
      <NavBar />
      <main className="page-container reveal visible">
        <h1 className="page-title">Wi-Fi Bilgileri</h1>
        <p>Hızlı ve ücretsiz internetimize bağlanın.</p>
        
        <div className="fancy-form" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: 'var(--gray-400)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ağ Adı (SSID)</h3>
            <p style={{ fontSize: '1.8rem', color: 'var(--white)', fontWeight: 'bold', margin: '0.5rem 0 1.5rem' }}>MIST_CAFE_WIFI</p>
            
            <h3 style={{ color: 'var(--gray-400)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Şifre</h3>
            <p style={{ fontSize: '1.8rem', color: 'var(--gold-300)', fontWeight: 'bold', margin: '0.5rem 0 0' }}>mistcafe2024</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
