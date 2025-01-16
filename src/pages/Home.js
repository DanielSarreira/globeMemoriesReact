import React from 'react';
import TravelCard from '../components/TravelCard';
import travelsData from '../data/travelsData'; // Importa os dados das viagens
import '../styles/Home.css';
import '../App.css';

const Home = () => {
  // Ordena as viagens por número de visualizações
  const sortedTravels = travelsData.sort((a, b) => b.views - a.views);

  return (
    <div className="home-container">
      {/* Header Section */}
   

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

    </div>
  );
};

export default Home;
