import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// 🎯 CONFIGURAÇÕES CINEMATOGRÁFICAS
const CINEMATIC_CONFIG = {
  arrowDuration: 1200,
  zoomDuration: 900,
  planeDelayAfterImpact: 3000,
  planeDuration: 1800,
  modalDelayAfterPlane: 3000,
  trailStrokeWidth: 3,
  trailGlowBlur: 4
};

// 🌍 CIDADES DESTINO
const WORLD_DESTINATIONS = [
  { name: "Tóquio", country: "Japão", lat: 35.6762, lon: 139.6503, emoji: "🗾" },
  { name: "Paris", country: "França", lat: 48.8566, lon: 2.3522, emoji: "🗼" },
  { name: "Nova York", country: "EUA", lat: 40.7128, lon: -74.0060, emoji: "🗽" },
  { name: "Rio de Janeiro", country: "Brasil", lat: -22.9068, lon: -43.1729, emoji: "🇧🇷" },
  { name: "Sydney", country: "Austrália", lat: -33.8688, lon: 151.2093, emoji: "🦘" },
  { name: "Cairo", country: "Egito", lat: 30.0444, lon: 31.2357, emoji: "🏺" },
  { name: "Reykjavik", country: "Islândia", lat: 64.1466, lon: -21.9426, emoji: "🌋" },
  { name: "Dubai", country: "EAU", lat: 25.2048, lon: 55.2708, emoji: "🏗️" },
  { name: "Santorini", country: "Grécia", lat: 36.3932, lon: 25.4615, emoji: "🏛️" },
  { name: "Bali", country: "Indonésia", lat: -8.3405, lon: 115.0920, emoji: "🏝️" }
];

// 🎈 COMPONENTE DO BALÃO
const BalloonComponent = ({ user, onLaunch, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="cinematic-balloon-container"
          initial={{ opacity: 0, y: -100, x: -50, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: [0, -10, 0], 
            x: [-10, 10, -10],
            scale: 1,
            rotate: [-1, 1, -1]
          }}
          exit={{ opacity: 0, y: -200, scale: 0.5 }}
          transition={{ 
            opacity: { duration: 0.8 },
            y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
            x: { repeat: Infinity, duration: 6, ease: "easeInOut" },
            scale: { duration: 0.8 },
            rotate: { repeat: Infinity, duration: 8, ease: "easeInOut" }
          }}
          style={{
            position: 'absolute',
            top: '15%',
            left: '15%',
            cursor: 'pointer',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
          }}
          onClick={onLaunch}
        >
          <svg width="180" height="240" viewBox="0 0 180 240">
            {/* Gradientes */}
            <defs>
              <linearGradient id="balloonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b35" />
                <stop offset="30%" stopColor="#f7931e" />
                <stop offset="70%" stopColor="#ffd23f" />
                <stop offset="100%" stopColor="#ff6b35" />
              </linearGradient>
              <linearGradient id="basketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b4513" />
                <stop offset="50%" stopColor="#cd853f" />
                <stop offset="100%" stopColor="#654321" />
              </linearGradient>
              <filter id="balloonShadow">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            {/* Balão principal */}
            <ellipse 
              cx="90" 
              cy="80" 
              rx="65" 
              ry="75" 
              fill="url(#balloonGradient)"
              filter="url(#balloonShadow)"
            />
            
            {/* Reflexo do balão */}
            <ellipse 
              cx="75" 
              cy="60" 
              rx="15" 
              ry="20" 
              fill="rgba(255,255,255,0.4)"
            />
            
            {/* Texto Globe Memories */}
            <text 
              x="90" 
              y="85" 
              textAnchor="middle" 
              fill="white" 
              fontSize="12" 
              fontWeight="bold"
              fontFamily="Montserrat"
            >
              Globe
            </text>
            <text 
              x="90" 
              y="100" 
              textAnchor="middle" 
              fill="white" 
              fontSize="12" 
              fontWeight="bold"
              fontFamily="Montserrat"
            >
              Memories
            </text>
            
            {/* Cordas do cesto */}
            <line x1="45" y1="145" x2="60" y2="170" stroke="#654321" strokeWidth="2"/>
            <line x1="90" y1="155" x2="90" y2="170" stroke="#654321" strokeWidth="2"/>
            <line x1="135" y1="145" x2="120" y2="170" stroke="#654321" strokeWidth="2"/>
            
            {/* Cesto */}
            <rect 
              x="60" 
              y="170" 
              width="60" 
              height="35" 
              rx="5"
              fill="url(#basketGradient)"
              stroke="#654321"
              strokeWidth="2"
            />
            
            {/* Textura do cesto */}
            <g stroke="#654321" strokeWidth="1" opacity="0.6">
              <line x1="70" y1="175" x2="70" y2="200"/>
              <line x1="80" y1="175" x2="80" y2="200"/>
              <line x1="90" y1="175" x2="90" y2="200"/>
              <line x1="100" y1="175" x2="100" y2="200"/>
              <line x1="110" y1="175" x2="110" y2="200"/>
              <line x1="65" y1="180" x2="115" y2="180"/>
              <line x1="65" y1="190" x2="115" y2="190"/>
            </g>
            
            {/* Avatar do utilizador */}
            <defs>
              <clipPath id="avatarClip">
                <circle cx="90" cy="187" r="18"/>
              </clipPath>
            </defs>
            
            {user?.profilePicture ? (
              <image 
                href={user.profilePicture} 
                x="72" 
                y="169" 
                width="36" 
                height="36" 
                clipPath="url(#avatarClip)"
              />
            ) : (
              <circle 
                cx="90" 
                cy="187" 
                r="18" 
                fill="#4a90e2" 
                stroke="white" 
                strokeWidth="2"
              />
            )}
            
            {/* Braço do boneco (animado) */}
            <motion.g
              animate={{
                rotate: [0, -30, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ transformOrigin: '85px 185px' }}
            >
              <line 
                x1="85" 
                y1="185" 
                x2="105" 
                y2="175" 
                stroke="#4a90e2" 
                strokeWidth="3" 
                strokeLinecap="round"
              />
            </motion.g>
          </svg>
          
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium">
            Clica para lançar! ✨
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 🏹 COMPONENTE DA SETA
const ArrowComponent = ({ startPos, endPos, onComplete, isVisible }) => {
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  
  // Calcular trajetória curva
  const controlX = (startPos.x + endPos.x) / 2 + (endPos.y - startPos.y) * 0.3;
  const controlY = Math.min(startPos.y, endPos.y) - 100;
  
  const pathData = `M ${startPos.x} ${startPos.y} Q ${controlX} ${controlY} ${endPos.x} ${endPos.y}`;
  
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [pathData]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="cinematic-arrow-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
              </linearGradient>
              <filter id="trailGlow">
                <feGaussianBlur stdDeviation={CINEMATIC_CONFIG.trailGlowBlur} result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Trail da seta */}
            <motion.path
              ref={pathRef}
              d={pathData}
              fill="none"
              stroke="url(#trailGradient)"
              strokeWidth={CINEMATIC_CONFIG.trailStrokeWidth}
              strokeLinecap="round"
              filter="url(#trailGlow)"
              initial={{ 
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength 
              }}
              animate={{ 
                strokeDashoffset: 0 
              }}
              transition={{ 
                duration: CINEMATIC_CONFIG.arrowDuration / 1000,
                ease: "easeOut"
              }}
            />
          </svg>
          
          {/* Seta física */}
          <motion.div
            initial={{ 
              x: startPos.x, 
              y: startPos.y,
              scale: 0.8,
              rotate: 0
            }}
            animate={{
              x: endPos.x,
              y: endPos.y,
              scale: 1,
              rotate: Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x) * 180 / Math.PI
            }}
            transition={{
              duration: CINEMATIC_CONFIG.arrowDuration / 1000,
              ease: "easeOut"
            }}
            onAnimationComplete={onComplete}
            style={{
              position: 'absolute',
              transformOrigin: 'center center'
            }}
          >
            <svg width="40" height="12" viewBox="0 0 40 12">
              <defs>
                <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c0c0c0" />
                  <stop offset="70%" stopColor="#e6e6e6" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              
              {/* Corpo da seta */}
              <rect x="0" y="4" width="30" height="4" fill="url(#arrowGradient)" rx="2"/>
              
              {/* Ponta da seta */}
              <polygon 
                points="30,2 40,6 30,10" 
                fill="#ffffff" 
                stroke="#e6e6e6" 
                strokeWidth="0.5"
              />
              
              {/* Penas */}
              <polygon points="2,3 8,1 8,5" fill="#ff6b35" opacity="0.8"/>
              <polygon points="2,9 8,7 8,11" fill="#ff6b35" opacity="0.8"/>
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 💥 COMPONENTE DO IMPACTO
const ImpactComponent = ({ position, onComplete, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="cinematic-impact"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [1, 1, 0],
            scale: [0, 1.15, 1]
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ 
            duration: 0.8,
            times: [0, 0.3, 1],
            ease: "easeOut"
          }}
          onAnimationComplete={onComplete}
          style={{
            position: 'absolute',
            left: position.x - 15,
            top: position.y - 15,
            pointerEvents: 'none'
          }}
        >
          {/* X de impacto */}
          <motion.svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8 }}
          >
            <defs>
              <filter id="impactGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <g filter="url(#impactGlow)">
              <line x1="8" y1="8" x2="22" y2="22" stroke="#ff4444" strokeWidth="3" strokeLinecap="round"/>
              <line x1="22" y1="8" x2="8" y2="22" stroke="#ff4444" strokeWidth="3" strokeLinecap="round"/>
            </g>
          </motion.svg>
          
          {/* Partículas radiais */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="impact-particle"
              initial={{ 
                opacity: 1,
                scale: 0,
                x: 15,
                y: 15
              }}
              animate={{
                opacity: 0,
                scale: 1,
                x: 15 + Math.cos(i * 60 * Math.PI / 180) * 25,
                y: 15 + Math.sin(i * 60 * Math.PI / 180) * 25
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut"
              }}
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                background: '#ff4444',
                borderRadius: '50%'
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ✈️ COMPONENTE DO AVIÃO
const PlaneComponent = ({ startPos, endPos, onComplete, isVisible }) => {
  const controlX = (startPos.x + endPos.x) / 2 - (endPos.y - startPos.y) * 0.2;
  const controlY = Math.min(startPos.y, endPos.y) - 80;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="cinematic-plane"
          initial={{ 
            x: startPos.x, 
            y: startPos.y,
            scale: 0.8,
            rotate: 0
          }}
          animate={{
            x: [startPos.x, controlX, endPos.x],
            y: [startPos.y, controlY, endPos.y],
            scale: [0.8, 1, 1.1, 1],
            rotate: [
              0,
              Math.atan2(controlY - startPos.y, controlX - startPos.x) * 180 / Math.PI,
              Math.atan2(endPos.y - controlY, endPos.x - controlX) * 180 / Math.PI
            ]
          }}
          transition={{
            duration: CINEMATIC_CONFIG.planeDuration / 1000,
            times: [0, 0.5, 1],
            ease: "easeInOut"
          }}
          onAnimationComplete={onComplete}
          style={{
            position: 'absolute',
            transformOrigin: 'center center',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }}
        >
          <svg width="60" height="24" viewBox="0 0 60 24">
            <defs>
              <linearGradient id="planeGradient" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#e6e6e6" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#cccccc" />
              </linearGradient>
            </defs>
            
            {/* Corpo do avião */}
            <ellipse cx="30" cy="12" rx="25" ry="4" fill="url(#planeGradient)"/>
            
            {/* Asas */}
            <ellipse cx="25" cy="12" rx="15" ry="8" fill="url(#planeGradient)" opacity="0.9"/>
            
            {/* Cauda */}
            <polygon points="5,10 15,8 15,16 5,14" fill="url(#planeGradient)"/>
            
            {/* Janelas */}
            <circle cx="35" cy="11" r="1.5" fill="#4a90e2" opacity="0.7"/>
            <circle cx="32" cy="11" r="1.5" fill="#4a90e2" opacity="0.7"/>
            <circle cx="29" cy="11" r="1.5" fill="#4a90e2" opacity="0.7"/>
            
            {/* Hélice/motor */}
            <motion.ellipse
              cx="50"
              cy="12"
              rx="3"
              ry="1"
              fill="#666666"
              animate={{ rotate: [0, 360] }}
              transition={{ 
                duration: 0.1, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ transformOrigin: '50px 12px' }}
            />
          </svg>
          
          {/* Rasto do avião */}
          <motion.div
            className="plane-trail"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 0.6, 0] }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              position: 'absolute',
              left: '-40px',
              top: '10px',
              width: '40px',
              height: '4px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 100%)',
              transformOrigin: 'right center',
              filter: 'blur(1px)'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 📋 COMPONENTE DO MODAL
const DestinationModal = ({ destination, onExplore, onTryAgain, onSkip, isVisible }) => {
  if (!destination) return null;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="cinematic-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <motion.div
            className="cinematic-modal-content"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '40px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              fontFamily: 'Montserrat, sans-serif',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                {destination.emoji}
              </div>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#333',
                margin: 0,
                lineHeight: '1.2'
              }}>
                {destination.name}
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#666',
                margin: '4px 0 0 0'
              }}>
                {destination.country}
              </p>
            </div>
            
            {/* Descrição */}
            <p style={{
              fontSize: '16px',
              color: '#555',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              ✨ A tua aventura épica chegou ao destino! Descobre viagens incríveis para este local mágico.
            </p>
            
            {/* Botões */}
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              flexDirection: 'column'
            }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onExplore}
                style={{
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                🧳 Explorar Viagens
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onTryAgain}
                style={{
                  background: 'transparent',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                🎯 Tentar Novamente
              </motion.button>
            </div>
            
            {/* Skip button */}
            <button
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '16px',
                fontFamily: 'inherit'
              }}
            >
              Pular animações futuras
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 🎬 COMPONENTE PRINCIPAL
const GlobeMemoriesCinematic = React.forwardRef(({ 
  onDestinationSelected, 
  mapDimensions = { width: window.innerWidth, height: window.innerHeight } 
}, ref) => {
  const { user } = useAuth();
  
  // Estados da sequência
  const [currentScene, setCurrentScene] = useState('idle'); // idle, balloon, arrow, impact, plane, modal
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [skipAnimations, setSkipAnimations] = useState(false);
  
  // Estados dos componentes
  const [showBalloon, setShowBalloon] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [showPlane, setShowPlane] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Posições
  const [arrowStart, setArrowStart] = useState({ x: 0, y: 0 });
  const [arrowEnd, setArrowEnd] = useState({ x: 0, y: 0 });
  
  // 🚀 FUNÇÃO PRINCIPAL - INICIAR SEQUÊNCIA
  const startCinematicSequence = useCallback(async () => {
    if (currentScene !== 'idle') return;
    
    console.log('🎬 Iniciando sequência cinematográfica Globe Memories');
    
    // Reset completo
    setShowBalloon(false);
    setShowArrow(false);
    setShowImpact(false);
    setShowPlane(false);
    setShowModal(false);
    
    // Escolher destino aleatório
    const destination = WORLD_DESTINATIONS[Math.floor(Math.random() * WORLD_DESTINATIONS.length)];
    setSelectedDestination(destination);
    
    // Calcular posições
    const startPos = { 
      x: mapDimensions.width * 0.15, 
      y: mapDimensions.height * 0.25 
    };
    const endPos = { 
      x: mapDimensions.width * 0.7, 
      y: mapDimensions.height * 0.6 
    };
    
    setArrowStart(startPos);
    setArrowEnd(endPos);
    
    try {
      // 🎈 FASE 1: BALÃO APARECE
      setCurrentScene('balloon');
      setShowBalloon(true);
      
    } catch (error) {
      console.error('Erro na sequência cinematográfica:', error);
      resetSequence();
    }
  }, [currentScene, mapDimensions]);
  
  // 🏹 LANÇAMENTO DA SETA
  const launchArrow = useCallback(async () => {
    console.log('🏹 Lançando seta mágica');
    
    setCurrentScene('arrow');
    setShowBalloon(false);
    setShowArrow(true);
    
    // Aguardar animação da seta
    await new Promise(resolve => {
      setTimeout(resolve, CINEMATIC_CONFIG.arrowDuration);
    });
    
    handleArrowComplete();
  }, []);
  
  // 💥 IMPACTO DA SETA
  const handleArrowComplete = useCallback(async () => {
    console.log('💥 Seta atingiu o alvo!');
    
    setCurrentScene('impact');
    setShowArrow(false);
    setShowImpact(true);
    
    // Aguardar impacto + zoom
    await new Promise(resolve => {
      setTimeout(resolve, 800);
    });
    
    handleImpactComplete();
  }, []);
  
  // ✈️ CHEGADA DO AVIÃO
  const handleImpactComplete = useCallback(async () => {
    console.log('✈️ Avião está chegando...');
    
    setCurrentScene('plane');
    setShowImpact(false);
    
    // Delay antes do avião
    await new Promise(resolve => {
      setTimeout(resolve, CINEMATIC_CONFIG.planeDelayAfterImpact);
    });
    
    setShowPlane(true);
  }, []);
  
  // 📋 ABERTURA DO MODAL
  const handlePlaneComplete = useCallback(async () => {
    console.log('🎉 Avião chegou! Abrindo modal...');
    
    setShowPlane(false);
    
    // Delay antes do modal
    await new Promise(resolve => {
      setTimeout(resolve, CINEMATIC_CONFIG.modalDelayAfterPlane);
    });
    
    setCurrentScene('modal');
    setShowModal(true);
  }, []);
  
  // 🔄 RESET DA SEQUÊNCIA
  const resetSequence = useCallback(() => {
    setCurrentScene('idle');
    setShowBalloon(false);
    setShowArrow(false);
    setShowImpact(false);
    setShowPlane(false);
    setShowModal(false);
    setSelectedDestination(null);
  }, []);
  
  // 🎯 HANDLERS DOS BOTÕES
  const handleExplore = useCallback(() => {
    if (selectedDestination && onDestinationSelected) {
      onDestinationSelected({
        ...selectedDestination,
        coordinates: [selectedDestination.lat, selectedDestination.lon]
      });
    }
    resetSequence();
  }, [selectedDestination, onDestinationSelected, resetSequence]);
  
  const handleTryAgain = useCallback(() => {
    resetSequence();
    setTimeout(startCinematicSequence, 500);
  }, [resetSequence, startCinematicSequence]);
  
  const handleSkipAnimations = useCallback(() => {
    setSkipAnimations(true);
    resetSequence();
  }, [resetSequence]);
  
  // Interface pública via ref
  useImperativeHandle(ref, () => ({
    start: startCinematicSequence,
    reset: resetSequence,
    isActive: currentScene !== 'idle'
  }));
  
  return (
    <div 
      className="globe-memories-cinematic"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    >
      {/* 🎈 BALÃO */}
      <BalloonComponent
        user={user}
        onLaunch={launchArrow}
        isVisible={showBalloon}
      />
      
      {/* 🏹 SETA */}
      <ArrowComponent
        startPos={arrowStart}
        endPos={arrowEnd}
        onComplete={handleArrowComplete}
        isVisible={showArrow}
      />
      
      {/* 💥 IMPACTO */}
      <ImpactComponent
        position={arrowEnd}
        onComplete={handleImpactComplete}
        isVisible={showImpact}
      />
      
      {/* ✈️ AVIÃO */}
      <PlaneComponent
        startPos={{ x: -60, y: mapDimensions.height / 2 }}
        endPos={arrowEnd}
        onComplete={handlePlaneComplete}
        isVisible={showPlane}
      />
      
      {/* 📋 MODAL */}
      <DestinationModal
        destination={selectedDestination}
        onExplore={handleExplore}
        onTryAgain={handleTryAgain}
        onSkip={handleSkipAnimations}
        isVisible={showModal}
      />
      
      {/* 🎮 CONTROLES DE DEBUG (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          pointerEvents: 'auto',
          zIndex: 10001
        }}>
          <div>Cena: {currentScene}</div>
          <button 
            onClick={startCinematicSequence}
            style={{ marginTop: '5px', fontSize: '10px' }}
          >
            🎬 Iniciar
          </button>
          <button 
            onClick={resetSequence}
            style={{ marginTop: '5px', marginLeft: '5px', fontSize: '10px' }}
          >
            🔄 Reset
          </button>
        </div>
      )}
    </div>
  );
});

// Exportar componente e API
export default GlobeMemoriesCinematic;
export { CINEMATIC_CONFIG, WORLD_DESTINATIONS };