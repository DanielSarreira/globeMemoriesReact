import React from 'react';
import { Link } from 'react-router-dom';
import { FaRocket, FaCalendarAlt, FaMapMarkedAlt, FaUsers, FaHeart } from 'react-icons/fa';
import MainLayout from '../components/MainLayout';
import '../styles/components/FutureTravels1.css';

const FutureTravelsComingSoon = () => {
  return (
    <MainLayout>
      <div className="future-travels-coming-soon">
        <div className="coming-soon-container">
          <div className="coming-soon-header">
            <FaRocket className="rocket-icon" />
            <h1>Funcionalidade em Desenvolvimento</h1>
            <p className="subtitle">A ferramenta de planeamento de viagens mais completa está a chegar!</p>
          </div>

          <div className="features-preview">
            <div className="feature-card">
              <FaCalendarAlt className="feature-icon" />
              <h3>Planeamento Inteligente</h3>
              <p>Crie itinerários detalhados com sugestões personalizadas baseadas nas suas preferências</p>
            </div>
            
            <div className="feature-card">
              <FaMapMarkedAlt className="feature-icon" />
              <h3>Pontos de Interesse</h3>
              <p>Descubra locais únicos e experiências imperdíveis no seu destino</p>
            </div>
            
            <div className="feature-card">
              <FaUsers className="feature-icon" />
              <h3>Viagens em Grupo</h3>
              <p>Organize viagens colaborativas e partilhe momentos especiais com amigos</p>
            </div>
          </div>

          <div className="timeline-section">
            <h2>O que está a chegar na Fase 2</h2>
            <div className="timeline-content">
              <div className="timeline-item">
                <div className="timeline-icon">✨</div>
                <div className="timeline-text">
                  <h4>Assistente de Viagem com IA</h4>
                  <p>Sugestões inteligentes baseadas no seu perfil e preferências</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-icon">📱</div>
                <div className="timeline-text">
                  <h4>Planeamento Colaborativo</h4>
                  <p>Convide amigos e familiares para planear juntos</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-icon">🗺️</div>
                <div className="timeline-text">
                  <h4>Mapas Interativos Avançados</h4>
                  <p>Visualize todo o seu itinerário num mapa dinâmico</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-icon">💰</div>
                <div className="timeline-text">
                  <h4>Gestão de Orçamento</h4>
                  <p>Controle todos os custos da sua viagem em tempo real</p>
                </div>
              </div>
            </div>
          </div>

          <div className="cta-section">
            <h3>Enquanto isso, explore as nossas outras funcionalidades</h3>
            <div className="cta-buttons">
              <Link to="/travels" className="cta-button primary">
                Descobrir Viagens
              </Link>
              <Link to="/my-travels" className="cta-button secondary">
                As Minhas Viagens
              </Link>
              <Link to="/interactive-map" className="cta-button tertiary">
                Mapa Mundial
              </Link>
            </div>
          </div>

          <div className="stay-updated">
            <FaHeart className="heart-icon" />
            <p>Fique atento às próximas atualizações da Globe Memories!</p>
            <small>Esta funcionalidade será lançada em breve com muitas surpresas</small>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FutureTravelsComingSoon;