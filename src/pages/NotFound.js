import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaSearch, FaArrowLeft, FaCompass, FaMap, FaGlobe } from 'react-icons/fa';
import '../styles/pages/notfound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after initial delay
    setTimeout(() => setShowContent(true), 300);
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleSearch = () => {
    navigate('/travels');
  };

  return (
    <div className="notfound-container">
      {/* Animated background particles */}
      <div className="notfound-particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`notfound-particle notfound-particle-${i}`}></div>
        ))}
      </div>
      
      {/* Floating travel icons */}
      <div className="notfound-floating-icons">
        <div className="notfound-icon-plane">✈️</div>
        <div className="notfound-icon-globe">🌍</div>
        <div className="notfound-icon-camera">📸</div>
        <div className="notfound-icon-compass">🧭</div>
        <div className="notfound-icon-map">🗺️</div>
        <div className="notfound-icon-suitcase">🧳</div>
      </div>

      <motion.div 
        className={`notfound-content ${showContent ? 'show' : ''}`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Main Error Display */}
        <motion.div 
          className="notfound-error-display"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="notfound-404">
            <span className="notfound-digit">4</span>
            <span className="notfound-digit notfound-middle">0</span>
            <span className="notfound-digit">4</span>
          </div>
          <div className="notfound-glitch-overlay">
            <div className="notfound-glitch-text">404</div>
          </div>
        </motion.div>

        {/* Title and Description */}
        <motion.div 
          className="notfound-text-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h1 className="notfound-title">
            <span className="notfound-title-word">Ops!</span>{' '}
            <br></br>
            <span className="notfound-title-word">Página</span>{' '}
            <span className="notfound-title-word">não encontrada</span>
          </h1>
          

          <div className="notfound-suggestions">
            <h3>📍 Sugestões para continuar a explorar:</h3>
            <ul>
              <li>🏠 Volte à página inicial para descobrir novas aventuras</li>
              <li>🔍 Explore as viagens da comunidade</li>
              <li>📝 Partilhe as suas próprias memórias de viagem</li>
              <li>🗺️ Use o mapa interativo para planear a próxima aventura</li>
            </ul>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="notfound-actions"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >


          <motion.button
            className="notfound-btn notfound-btn-secondary"
            onClick={handleGoBack}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft />
            Voltar Atrás
          </motion.button>


        </motion.div>


      </motion.div>

      {/* Decorative elements */}
      <div className="notfound-corner-decoration notfound-top-left"></div>
      <div className="notfound-corner-decoration notfound-top-right"></div>
      <div className="notfound-corner-decoration notfound-bottom-left"></div>
      <div className="notfound-corner-decoration notfound-bottom-right"></div>
    </div>
  );
};

export default NotFound;
