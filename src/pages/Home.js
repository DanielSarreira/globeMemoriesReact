import React from 'react';
import TravelCard from '../components/TravelCard';
import { FaSearch } from 'react-icons/fa'; // Para adicionar ícones, se necessário
import '../styles/Home.css'; // Adicione um arquivo de CSS específico para a Home

const Home = () => {
  // Exemplo de dados de viagens (pode ser obtido de uma API ou banco de dados)
  const travels = [
    { id: 1, title: 'Viagem a Paris', description: 'Descubra a Cidade Luz.', category: 'Cidade', imageUrl: '' },
    { id: 2, title: 'Aventura na Amazônia', description: 'Explore a selva.', category: 'Aventura', imageUrl: '' },
    
    { id: 4, title: 'Viagem ao Egito', description: 'Misteriosa Terra dos Faraós.', category: 'História', imageUrl: '' },
  ];

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

      {/* Categorias de Viagem */}
      <section className="categories-section">
        <h2>Categorias Populares</h2>
        <div className="categories-list">
          <div className="category-item">Praias</div>
          <div className="category-item">Montanhas</div>
          <div className="category-item">Aventura</div>
          <div className="category-item">Cidades Históricas</div>
        </div>
      </section>

      {/* Viagens em Destaque */}
      <section className="featured-travels-section">
        <h2>Viagens em Destaque</h2>
        <div className="travel-list">
          {travels.map(travel => (
            <TravelCard key={travel.id} travel={travel} />
          ))}
        </div>
      </section>

      {/* Depoimentos de Usuários */}
      <section className="testimonials-section">
        <h2>O que dizem os nossos utilizadores?</h2>
        <div className="testimonials-list">
          <div className="testimonial">
            <p>"Esta plataforma me ajudou a planejar minha viagem dos sonhos para Paris!"</p>
            <span>- João Silva</span>
          </div>
          <div className="testimonial">
            <p>"Adoro compartilhar minhas viagens e encontrar novas aventuras por aqui!"</p>
            <span>- Maria Oliveira</span>
          </div>
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
