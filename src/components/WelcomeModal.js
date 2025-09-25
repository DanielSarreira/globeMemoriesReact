import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
  FaGlobe,
  FaCamera,
  FaMapMarkedAlt,
  FaUsers,
  FaStar,
  FaHeart
} from 'react-icons/fa';

import '../styles/pages/WelcomeModal.css';

const WelcomeModal = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [videoUrl] = useState('https://www.youtube.com/embed/mPFakMSvysM');

  // Debug: Log when modal opens
  useEffect(() => {
    console.log('WelcomeModal isOpen:', isOpen);
  }, [isOpen]);

  const features = [
    {
      icon: <FaCamera />,
      title: "Galeria Premium",
      description: "Organize fotos com geolocalização automática e filtros profissionais"
    },
    {
      icon: <FaMapMarkedAlt />,
      title: "Mapas Interativos",
      description: "Visualize rotas, pontos de interesse e crie roteiros personalizados"
    },
    {
      icon: <FaUsers />,
      title: "Rede Social de Viagem",
      description: "Conecte-se com viajantes, partilhe dicas e descubra destinos"
    },
    {
      icon: <FaStar />,
      title: "Sistema de Reviews",
      description: "Avalie hotéis, restaurantes e atrações com sistema de 5 estrelas"
    },
    {
      icon: <FaHeart />,
      title: "Feed Personalizado",
      description: "Descubra conteúdo baseado nos seus interesses e destinos favoritos"
    },
    {
      icon: <FaGlobe />,
      title: "Explorador Mundial",
      description: "Acesso a informações de 195+ países e milhares de cidades"
    }
  ];

  const slides = [
    {
      title: "Bem-vindo à Globe Memories",
      subtitle: "Descubra experiências de viagem reais partilhadas por pessoas como você. Inspire-se, explore destinos e crie as suas próprias memórias pelo mundo.",
      showVideo: true
    },
    {
      title: "Funcionalidades Extraordinárias",
      subtitle: "Desde mapas interativos até reviews detalhados, temos todas as ferramentas para tornar as suas viagens inesquecíveis.",
      showVideo: false,
      showFeatures: true
    }
  ];

  // Debug: Log when slide changes
  useEffect(() => {
    console.log('Current slide changed to:', currentSlide, 'of', slides.length);
  }, [currentSlide, slides.length]);

  useEffect(() => {
    if (currentSlide === 1) {
      const timer = setTimeout(() => setShowFeatures(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowFeatures(false);
    }
  }, [currentSlide]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('globeMemoriesWelcomeShown', 'true');
      console.log('Modal set to not show again');
    }
    onClose();
  };

  const nextSlide = () => {
    console.log('Current slide:', currentSlide, 'Total slides:', slides.length);
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      console.log('Moving to slide:', currentSlide + 1);
    } else {
      console.log('Closing modal');
      handleClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleVideo = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="welcome-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="welcome-modal-container-wide"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            {/* Header */}
            <div className="welcome-modal-header-wide">
              <div className="welcome-modal-logo">
                <span>Globe Memories</span>
              </div>
              <button 
                className="welcome-modal-close-wide"
                onClick={handleClose}
                aria-label="Fechar modal"
              >
                ×
              </button>
            </div>

            {/* Progress Bar */}
            <div className="welcome-modal-progress">
              <div className="progress-bar">
                <motion.div 
                  className="progress-fill"
                  initial={{ width: "33%" }}
                  animate={{ 
                    width: `${((currentSlide + 1) / slides.length) * 100}%` 
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="welcome-modal-content-wide">
              <AnimatePresence mode="wait" custom={1}>
                <motion.div
                  key={currentSlide}
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="slide-content"
                >
                  <div className="slide-header">
                    <motion.h2
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {slides[currentSlide].title}
                    </motion.h2>
                    <motion.p
                      className="slide-subtitle"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {slides[currentSlide].subtitle}
                    </motion.p>
                  </div>

                  {/* Video Section */}
                  {slides[currentSlide].showVideo && (
                    <motion.div
                      className="video-container-wide"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="video-wrapper-wide">
                        <iframe
                          width="100%"
                          height="180%"
                          src={`${videoUrl}?autoplay=${isVideoPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}`}
                          title="Globe Memories Introduction"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
               
                      </div>
                    </motion.div>
                  )}

                  {/* Features Section */}
                  {slides[currentSlide].showFeatures && (
                    <motion.div
                      className="features-grid-wide"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {features.map((feature, index) => (
                        <motion.div
                          key={index}
                          className="feature-card-wide"
                          custom={index}
                          variants={featureVariants}
                          initial="hidden"
                          animate={showFeatures ? "visible" : "hidden"}
                        >
                          <div className="feature-icon-wide">
                            {feature.icon}
                          </div>
                          <h4>{feature.title}</h4>
                          <p>{feature.description}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* CTA Section */}
                  {slides[currentSlide].showCTA && (
                    <motion.div
                      className="cta-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="cta-stats">
                        <div className="stat-item">
                          <strong>25K+</strong>
                          <span>Viajantes Ativos</span>
                        </div>
                        <div className="stat-item">
                          <strong>150K+</strong>
                          <span>Memórias Partilhadas</span>
                        </div>
                        <div className="stat-item">
                          <strong>195+</strong>
                          <span>Países Explorados</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Benefits Section for 3rd slide */}
                  {slides[currentSlide].showBenefits && (
                    <motion.div
                      className="benefits-section-wide"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="benefits-grid-wide">
                        <motion.div 
                          className="benefit-item-wide highlight"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          <div className="benefit-icon-wide premium">🎯</div>
                          <h4>Totalmente Gratuito</h4>
                          <p>Acesso completo a todas as funcionalidades sem custos</p>
                          <div className="benefit-badge">Popular</div>
                        </motion.div>
                        <motion.div 
                          className="benefit-item-wide"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          <div className="benefit-icon-wide">🌐</div>
                          <h4>Comunidade Global</h4>
                          <p>Conecte-se com viajantes de todo o mundo</p>
                        </motion.div>
                        <motion.div 
                          className="benefit-item-wide"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          <div className="benefit-icon-wide">📱</div>
                          <h4>App Mobile</h4>
                          <p>Disponível para iOS e Android</p>
                        </motion.div>
                        <motion.div 
                          className="benefit-item-wide"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9 }}
                        >
                          <div className="benefit-icon-wide">🔒</div>
                          <h4>Privacidade Garantida</h4>
                          <p>Os seus dados estão sempre protegidos</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* Testimonial Section for 3rd slide */}
                  {slides[currentSlide].showTestimonial && (
                    <motion.div
                      className="testimonial-section-wide"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                    >
                      <div className="testimonial-card-wide">
                        <div className="testimonial-stars">
                          ⭐⭐⭐⭐⭐
                        </div>
                        <blockquote>
                          "O Globe Memories transformou completamente a forma como documento as minhas viagens. 
                          A comunidade é incrível e as funcionalidades são exatamente o que precisava!"
                        </blockquote>
                        <div className="testimonial-author">
                          <div className="author-avatar">👨‍🦱</div>
                          <div className="author-info">
                            <strong>Miguel Santos</strong>
                            <span>Viajante • 47 países visitados</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Special CTA Section - replacing the stats */}
                  {slides[currentSlide].showCTA && (
                    <motion.div
                      className="special-cta-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 }}
                    >
                      <div className="cta-highlight">
                        <div className="cta-icon">🎉</div>
                        <div className="cta-text">
                          <h3>Comece a sua jornada hoje!</h3>
                          <p>Registe-se agora e receba um guia completo de viagem gratuito</p>
                        </div>
                      </div>
                      <div className="cta-stats-compact">
                        <div className="stat-compact">
                          <strong>25K+</strong>
                          <span>Viajantes</span>
                        </div>
                        <div className="stat-compact">
                          <strong>150K+</strong>
                          <span>Memórias</span>
                        </div>
                        <div className="stat-compact">
                          <strong>195+</strong>
                          <span>Países</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

               
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="welcome-modal-footer-wide">
              <div className="dont-show-again">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    Não mostrar novamente esta mensagem
                  </span>
                </label>
              </div>

              <div className="welcome-modal-actions">
                {currentSlide > 0 && (
                  <button 
                    className="btn-secondary"
                    onClick={prevSlide}
                  >
                    Anterior
                  </button>
                )}
                <button 
                  className="btn-primary"
                  onClick={nextSlide}
                >
                  {(() => {
                    const buttonText = currentSlide < slides.length - 1 ? 'Continuar' : 'Começar';
                    console.log('Button text for slide', currentSlide, ':', buttonText);
                    return buttonText;
                  })()}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
