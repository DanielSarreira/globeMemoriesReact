import React from 'react';
import TravelCard from '../components/TravelCard';
import travelsData from '../data/travelsData'; // Importa os dados das viagens
import '../styles/Home.css';

const Home = () => {
  // Ordena as viagens por número de visualizações
  const sortedTravels = travelsData.sort((a, b) => b.views - a.views);

  return (
    <div className="home-container">
      {/* Header Section */}
      <header className="hero-section">
        <div className="hero-text">
          <h1>Explore o Mundo com a Globe Memories</h1>
          <p>Compartilhe as suas viagens e encontre inspirações para o seu próximo destino!</p>
          <button className="explore-button">Explorar Viagens</button>
        </div>
      </header>

      {/* Sobre a App */}
      <section className="about-section">
        <h2>Sobre a Globe Memories</h2>
        <p>
          A Globe Memories é uma rede social para viajantes, permitindo que você compartilhe suas aventuras,
          descubra destinos incríveis e conecte-se com outros exploradores ao redor do mundo.
        </p>
      </section>

      {/* Viagens Mais Vistas */}
      <section className="most-viewed-section">
        <h2>Viagens Mais Vistas</h2>
        <div className="travel-list">
          {sortedTravels.map((travel) => (
            <TravelCard key={travel.id} travel={travel} />
          ))}
        </div>
      </section>

      {/* Opinião dos Utilizadores */}
      <section className="testimonials-section">
        <h2>O que dizem os nossos utilizadores?</h2>
        <div className="testimonials-list">
          {travelsData.map((travel) => (
            <div className="testimonial" key={travel.id}>
              <p>"{travel.userReview}"</p>
              <span>- Viagem: {travel.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Chamada para Criar Conta */}
      <section className="cta-section">
        <h2>Junte-se a nós e compartilhe as suas aventuras!</h2>
        <button className="cta-button">Criar Conta</button>
      </section>

      {/* Rodapé */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#">Sobre</a>
          <a href="#">Termos de Uso</a>
          <a href="#">Política de Privacidade</a>
        </div>
        <div className="social-icons">
          <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
