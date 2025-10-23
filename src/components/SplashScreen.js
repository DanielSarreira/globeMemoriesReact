// src/components/SplashScreen.js
import React, { useState, useEffect } from 'react';
import logo from '../images/logo_white.png';
// ...existing code...

const SplashScreen = () => {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Simulate loading progress - 2.4 segundos
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.random() * 13;  // Ajustado para 2.4s
      });
    }, 200);  // Reduzido de 300ms para 200ms

    // Show content after initial delay
    setTimeout(() => setShowContent(true), 10);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="splash-screen">
      {/* Animated background particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i}`}></div>
        ))}
      </div>
      
      {/* Floating travel icons */}
      <div className="floating-icons">
        <div className="icon-plane">✈️</div>
        <div className="icon-globe">🌍</div>
        <div className="icon-camera">📸</div>
        <div className="icon-compass">🧭</div>
        <div className="icon-map">🗺️</div>
      </div>

      <div className={`splash-content ${showContent ? 'show' : ''}`}>
        <div className="logo-container">
          <img src={logo} alt="Globe Memories Logo" className="splash-logo" />
          <div className="logo-glow"></div>
        </div>
  

        <div className="loading-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${progress}%`}}></div>
          </div>
          <div className="loading-text">
            {progress < 100 ? '' : 'Pronto para explorar! 🎉'}
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="corner-decoration top-left"></div>
      <div className="corner-decoration top-right"></div>
      <div className="corner-decoration bottom-left"></div>
      <div className="corner-decoration bottom-right"></div>
    </div>
  );
};

export default SplashScreen;