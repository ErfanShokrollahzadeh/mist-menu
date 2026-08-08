"use client";
import NavBar from "@/components/NavBar";
import MistParticles from "@/components/MistParticles";
import Footer from "@/components/Footer";

export default function FeedbackPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Görüşleriniz için teşekkür ederiz!");
  };

  return (
    <>
      <MistParticles />
      <NavBar />
      <main className="page-container reveal visible">
        <h1 className="page-title">Bize Ulaşın</h1>
        <p>Görüşleriniz bizim için çok değerli. Hizmetimizi iyileştirmemize yardımcı olun.</p>
        
        <form className="fancy-form" onSubmit={handleSubmit}>
          <input type="text" className="fancy-input" placeholder="Adınız Soyadınız" required />
          <input type="email" className="fancy-input" placeholder="E-posta Adresiniz" />
          <textarea className="fancy-textarea" placeholder="Mesajınız..." required></textarea>
          <button type="submit" className="fancy-button">Gönder</button>
        </form>
      </main>
      <Footer />
    </>
  );
}
