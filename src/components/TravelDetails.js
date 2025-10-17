import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaHeart, FaComment, FaChevronLeft, FaChevronRight, FaReply, FaPaperPlane, FaFlag, FaEllipsisV } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import { COMMENT_LIMITS, validateComment } from '../config/commentConfig';
import '../styles/components/TravelDetailsModern.css';
import '../styles/pages/qanda.css'; // Import para estilos modernos de comentários

// Mock data for recommended travels
const mockRecommendedTravels = [
  {
    id: 1,
    name: "Lisboa",
    city: "Lisboa",
    country: "Portugal",
    highlightImage: require("../images/Globe-Memories.jpg"),
    price: "500",
    stars: 4,
    category: ["Cultural", "Cidade", "História", "Gastronomia", "Arquitetura"],
    user: "Maria Silva"
  },
  {
    id: 2,
    name: "Porto",
    city: "Porto", 
    country: "Portugal",
    highlightImage: require("../images/Globe-Memories.png"),
    price: "350",
    stars: 5,
    category: ["Cultural", "Cidade", "História", "Gastronomia"],
    user: "João Santos"
  },
  {
    id: 3,
    name: "Coimbra",
    city: "Coimbra",
    country: "Portugal", 
    highlightImage: require("../images/Globe-Memories.jpg"),
    price: "300",
    stars: 4,
    category: ["Cultural", "História", "Arquitetura"],
    user: "Ana Costa"
  },
  {
    id: 4,
    name: "Óbidos",
    city: "Óbidos",
    country: "Portugal",
    highlightImage: require("../images/Globe-Memories.png"),
    price: "200",
    stars: 5,
    category: ["Cultural", "História", "Arquitetura", "Paisagem"],
    user: "Pedro Lima"
  },
  {
    id: 5,
    name: "Sintra",
    city: "Sintra",
    country: "Portugal",
    highlightImage: require("../images/Globe-Memories.jpg"),
    price: "400",
    stars: 4,
    category: ["Natureza", "História", "Arquitetura", "Paisagem"],
    user: "Sofia Pereira"
  }
];

// Componente para setas customizadas (igual ao Home.js)
const ArrowLeft = () => (
  <svg
    width="60"
    height="60"
    viewBox="0 0 60 60"
    fill="none"
    role="img"
    aria-label="Anterior"
    style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' }}
  >
    <path
      d="M37 6 L14 30 L37 54 L44 47 L27 30 L44 13 Z"
      fill="white"
      shapeRendering="geometricPrecision"
    />
  </svg>
);

const ArrowRight = () => (
  <svg
    width="60"
    height="60"
    viewBox="0 0 60 60"
    fill="none"
    role="img"
    aria-label="Seguinte"
    style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' }}
  >
    <path
      d="M23 6 L46 30 L23 54 L16 47 L33 30 L16 13 Z"
      fill="white"
      shapeRendering="geometricPrecision"
    />
  </svg>
);

// Avatar padrão
const defaultAvatar = require("../images/Globe-Memories.jpg");

const TravelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [travel, setTravel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('generalInformation');
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const carouselRef = useRef(null);
  
  // Estados para viagens recomendadas
  const [recommendedCurrentIndex, setRecommendedCurrentIndex] = useState(0);
  const [recommendedItemsPerView, setRecommendedItemsPerView] = useState(3);
  const recommendedCarouselRef = useRef(null);
  
  // Slideshow states
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
  // Like and comment states (estrutura igual ao Home.js)
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [newReply, setNewReply] = useState({});
  const [replyOpen, setReplyOpen] = useState({});
  const [likedComments, setLikedComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(null);

  // Estados para denunciar viagem
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReasons, setReportReasons] = useState({
    inappropriate: false,
    falseInfo: false,
    abusive: false,
    spam: false,
    plagiarism: false,
    violation: false,
    other: false,
  });
  const [otherReason, setOtherReason] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  // Filtrar viagens recomendadas pela mesma categoria
  const getRecommendedTravels = () => {
    if (!travel || !travel.category) return mockRecommendedTravels;
    
    return mockRecommendedTravels.filter(recommendedTravel => 
      recommendedTravel.category.some(cat => travel.category.includes(cat))
    );
  };

  const recommendedTravels = getRecommendedTravels();

  // Funções de navegação do carrossel de viagens recomendadas (paginação por grid)
  const handleRecommendedPrev = () => {
    setRecommendedCurrentIndex(prev => {
      const newIndex = prev - recommendedItemsPerView;
      return newIndex < 0 ? 0 : newIndex;
    });
  };

  const handleRecommendedNext = () => {
    setRecommendedCurrentIndex(prev => {
      const newIndex = prev + recommendedItemsPerView;
      return newIndex >= recommendedTravels.length ? prev : newIndex;
    });
  };

  // UseEffect para definir items por view responsivamente
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 768) {
        setRecommendedItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setRecommendedItemsPerView(2);
      } else {
        setRecommendedItemsPerView(4);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // useEffect para detectar mudanças no tamanho da tela (mobile)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // useEffect para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  // Render stars function
  const renderStars = (stars) => {
    return [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={16} />
    ));
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to user profile
  const handleUserClick = (username) => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  // Open modal function
  const openModal = (image) => {
    setSelectedImage(image);
  };

  // Close modal function
  const closeModal = () => {
    setSelectedImage(null);
  };

  // Modal functions
  const openPriceModal = () => setShowPriceModal(true);
  const closePriceModal = () => setShowPriceModal(false);
  
  const openCategoriesModal = () => setShowCategoriesModal(true);
  const closeCategoriesModal = () => setShowCategoriesModal(false);
  
  const openTransportModal = () => setShowTransportModal(true);
  const closeTransportModal = () => setShowTransportModal(false);
  
  const openDatesModal = () => setShowDatesModal(true);
  const closeDatesModal = () => setShowDatesModal(false);

  // Funções do toast (igual ao Home.js)
  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(prev => !prev);
  };

  // Like function (igual ao Home.js)
  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Faça login para dar like!');
      return;
    }

    setIsLiked(!isLiked);
    setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
  };

  // Comments functions (estrutura igual ao Home.js)
  const toggleComments = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCommentsModal(!showCommentsModal);
  };

  const handleCloseComments = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCommentsModal(false);
  };

  // Função para sanitizar conteúdo contra XSS (igual ao Home.js)
  const sanitizeContent = (content) => {
    if (!content) return '';
    
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gi
    ];
    
    let sanitized = content;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  };

  const handleAddComment = (parentIds = [], text) => {
    if (!user) {
      alert('Faça login para comentar!');
      return;
    }

    const commentText = text || newComment;
    
    const validation = validateComment(commentText);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    const sanitizedComment = sanitizeContent(commentText);
    if (!sanitizedComment) {
      alert(COMMENT_LIMITS.MESSAGES.INVALID_CONTENT);
      return;
    }

    if (sanitizedComment !== commentText.trim()) {
      alert(COMMENT_LIMITS.MESSAGES.DANGEROUS_CONTENT);
      return;
    }

    setCommentLoading(true);
    setCommentSuccess(null);

    setTimeout(() => {
      const newCommentObj = {
        id: Date.now(),
        user: user.username || 'Usuario',
        userProfilePicture: user.profilePicture || defaultAvatar,
        text: sanitizedComment,
        createdAt: new Date().toISOString(),
        likes: 0,
        replies: []
      };

      if (parentIds.length === 0) {
        // Comentários principais: novos no topo
        setComments(prev => [newCommentObj, ...prev]);
        setNewComment('');
      } else {
        const addReplyToComment = (comments, path, reply) => {
          return comments.map(comment => {
            if (path.length === 1 && comment.id === path[0]) {
              // Respostas também no topo
              return { ...comment, replies: [reply, ...(comment.replies || [])] };
            } else if (path.length > 1 && comment.id === path[0]) {
              return { ...comment, replies: addReplyToComment(comment.replies || [], path.slice(1), reply) };
            }
            return comment;
          });
        };

        setComments(prev => addReplyToComment(prev, parentIds, newCommentObj));
        setNewReply(prev => ({ ...prev, [`travel-${travel.id}-${parentIds.join('-')}`]: '' }));
        setReplyOpen(prev => ({ ...prev, [`travel-${travel.id}-${parentIds.join('-')}`]: false }));
      }

      setCommentLoading(false);
      setCommentSuccess(COMMENT_LIMITS.MESSAGES.SUCCESS);
      setTimeout(() => setCommentSuccess(null), 2600);
    }, 1000);
  };

  const handleCommentLike = (commentId, parentIds = []) => {
    if (!user) return;

    const key = `travel-${travel.id}-${parentIds.join('-')}-${commentId}`;
    
    const updateLikes = (comments, path, isLiked) => {
      return comments.map(comment => {
        if (path.length === 0 && comment.id === commentId) {
          return { ...comment, likes: isLiked ? comment.likes - 1 : comment.likes + 1 };
        } else if (path.length > 0 && comment.id === path[0]) {
          return { ...comment, replies: updateLikes(comment.replies || [], path.slice(1), isLiked) };
        }
        return comment;
      });
    };

    const isLiked = likedComments.includes(key);
    setLikedComments((prev) => (isLiked ? prev.filter((k) => k !== key) : [...prev, key]));
    
    setComments((prev) => updateLikes(prev, parentIds, isLiked));
  };

  const toggleReply = (key) => {
    setReplyOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);
    
    if (diffInSeconds < 60) return 'Há poucos segundos';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Há ${diffInDays} dias`;
    
    return commentDate.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Função renderComment - Sistema moderno unificado (Home.js/Forum)
  const renderComment = (comment, parentIds = [], index = 0) => {
    const key = `travel-${travel.id}-${parentIds.concat(comment.id).join('-')}`;
    const likeKey = `travel-${travel.id}-${[...parentIds].join('-')}-${comment.id}`;
    const isLiked = likedComments.includes(likeKey);
    
    return (
      <motion.div 
        key={comment.id} 
        className="comment-item-modern" // Classe unificada
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <div className="comment-main">
          <img 
            src={comment.userProfilePicture || defaultAvatar} 
            alt={`Avatar de ${comment.user}`} 
            className="comment-avatar-modern" 
          />
          <div className="comment-content-modern">
            <div className="comment-header-modern">
              <span className="comment-username">{comment.user}</span>
              <span className="comment-time">{getRelativeTime(comment.createdAt)}</span>
            </div>
            <p className="comment-text">{comment.text}</p>
            <div className="comment-actions-modern">
              <motion.button
                className={`comment-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCommentLike(comment.id, parentIds);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHeart className={`heart-icon ${isLiked ? 'liked' : ''}`} />
                {comment.likes > 0 && <span>{comment.likes}</span>}
              </motion.button>
              <motion.button
                className="reply-btn-modern"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleReply(key);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaReply /> Responder
              </motion.button>
            </div>
            
            <AnimatePresence>
              {replyOpen[key] && (
                <motion.div 
                  className="reply-input-container"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img 
                    src={user?.profilePicture || defaultAvatar} 
                    alt="Seu avatar" 
                    className="reply-user-avatar" 
                  />
                  <div className="reply-input-wrapper">
                    <textarea
                      value={newReply[key] || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= COMMENT_LIMITS.MAX_LENGTH) {
                          setNewReply(prev => ({ ...prev, [key]: e.target.value }));
                        }
                      }}
                      placeholder="Escreva uma resposta..."
                      className="reply-input-modern"
                      rows="2"
                      maxLength={COMMENT_LIMITS.MAX_LENGTH}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="reply-actions">
                      <span className="char-count">{(newReply[key] || '').length}/{COMMENT_LIMITS.MAX_LENGTH}</span>
                      <motion.button
                        className="cancel-reply-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleReply(key);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddComment(parentIds.concat(comment.id), newReply[key]);
                        }}
                        className="send-reply-btn"
                        disabled={!newReply[key]?.trim()}
                        whileHover={newReply[key]?.trim() ? { scale: 1.05 } : {}}
                        whileTap={newReply[key]?.trim() ? { scale: 0.95 } : {}}
                      >
                        <FaPaperPlane />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {comment.replies?.length > 0 && (
          <motion.div 
            className="replies-container-modern"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {comment.replies.map((reply, replyIndex) => 
              renderComment(reply, parentIds.concat(comment.id), replyIndex)
            )}
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Funções para denunciar viagem
  const handleReportTravel = (travelToReport, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) {
      showToast('Inicie sessão para denunciar viagens.', 'error');
      return;
    }
    setSelectedTravel(travelToReport || travel);
    setShowReportModal(true);
    setShowDropdown(false);
  };

  const handleReasonChange = (reason) => {
    setReportReasons(prev => ({
      ...prev,
      [reason]: !prev[reason]
    }));
  };

  const submitReport = () => {
    const selectedReasons = Object.keys(reportReasons).filter(key => reportReasons[key]);
    
    if (selectedReasons.length === 0) {
      showToast('Selecione pelo menos um motivo para a denúncia.', 'error');
      return;
    }

    if (reportReasons.other && !otherReason.trim()) {
      showToast('Por favor, especifique o motivo da denúncia.', 'error');
      return;
    }

    // Aqui seria feita a chamada à API para enviar a denúncia
    console.log('Denúncia enviada:', {
      travelId: (selectedTravel || travel).id,
      reasons: selectedReasons,
      otherReason: reportReasons.other ? otherReason : null
    });

    showToast('Viagem denunciada com sucesso!', 'success');
    
    // Reset do modal
    setShowReportModal(false);
    setSelectedTravel(null);
    setReportReasons({
      inappropriate: false,
      falseInfo: false,
      abusive: false,
      spam: false,
      plagiarism: false,
      violation: false,
      other: false,
    });
    setOtherReason('');
  };

  // Handle image error
  const handleImageError = (e) => {
    e.target.src = require("../images/Globe-Memories.jpg");
  };

  // Navigation functions for images
  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentHeroIndex(prevIndex => 
      prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentHeroIndex(prevIndex => 
      (prevIndex + 1) % allImages.length
    );
  };

  // Mock travel data (in real app, this would come from API)
  useEffect(() => {
    const mockTravel = {
      id: parseInt(id),
      name: "Viagem a Aveiro com a família",
      city: "Aveiro",
      country: "Portugal",
      user: "Tiago",
      highlightImage: require("../images/highlightImage/aveiro.jpg"),
      price: "750",
      days: 5,
      views: 1250,
      likes: 87,
      comments: 23,
      stars: 4.5,
      category: ["Natureza", "Cultural", "Cidade", "História", "Gastronomia", "Arquitetura", "Paisagem"],
      transports: ["Comboio", "Metro", "Autocarro", "Táxi", "Bicicleta", "A pé", "Trotineta"],
      startDate: "2024-06-15",
      endDate: "2024-06-20",
      BookingTripPaymentDate: "2024-05-15",
      priceDetails: {
        hotel: "200",
        flight: "150",
        food: "300",
        extras: "100"
      },
      description: "Uma viagem incrível pela cidade dos canais portugueses.",
      longDescription: "Aveiro é conhecida como a 'Veneza de Portugal' devido aos seus canais e barcos moliceiros coloridos. Esta cidade encantadora oferece uma mistura perfeita de tradição e modernidade. Aveiro é conhecida como a 'Veneza de Portugal' devido aos seus canais e barcos moliceiros coloridos. Esta cidade encantadora oferece uma mistura perfeita de tradição e modernidade. Aveiro é conhecida como a 'Veneza de Portugal' devido aos seus canais e barcos moliceiros coloridos. Esta cidade encantadora oferece uma mistura perfeita de tradição e modernidade. Aveiro é conhecida como a 'Veneza de Portugal' devido aos seus canais e barcos moliceiros coloridos. Esta cidade encantadora oferece uma mistura perfeita de tradição e modernidade. Aveiro é conhecida como a 'Veneza de Portugal' devido aos seus canais e barcos moliceiros coloridos. Esta cidade encantadora oferece uma mistura perfeita de tradição e modernidade. Aveiro é conhecida como a 'Veneza de Portugal' devido aos seus canais e barcos moliceiros coloridos. Esta cidade encantadora oferece uma mistura perfeita de tradição e modernidade. Aveiro é conhecida como a 'Veneza de Portugal' devido aos seus canais e barcos moliceiros coloridos. Esta cidade encantadora oferece uma mistura perfeita de tradição e modernidade.",
      climate: "Temperado oceânicoTemperado oceânicoTemperado oceânicoTemperado oceânicoTemperado oceânico",
      language: "Português",
      languages: ["Português", "Inglês"],
      travelVideos: ["/videos/aveiro.mp4"],
      images_generalInformation: [
        require("../images/travels/aveiro1.jpg"),
        require("../images/travels/aveiro2.jpg"),
        require("../images/travels/aveiro3.jpg"),
        require("../images/travels/aveiro4.jpg")
      ],
      accommodations: [
        {
          name: "Hotel Aveiro Center",
          type: "Hotel",
          description: "Hotel moderno no centro da cidade",
          rating: 4,
          nights: "4",
          checkInDate: "2024-06-15",
          checkOutDate: "2024-06-20",
          regime: "Pequeno-almoço incluído",
          images: [require("../images/travels/aveiro5.jpg")]
        }
      ],
      foodRecommendations: [
        {
          name: "Ovos Moles",
          description: "Doce tradicional de Aveiro feito com ovos e açúcar"
        },
        {
          name: "Caldeirada de Enguias",
          description: "Prato típico da região com enguias da ria"
        }
      ],
      images_foodRecommendations: [
        require("../images/travels/aveiro10.jpg"),
        require("../images/travels/aveiro11.jpg")
      ],
      transportMethods: [
        {
          name: "Comboio",
          description: "Transporte principal utilizado para chegar a Aveiro desde Lisboa. Viagem confortável e com belas paisagens."
        },
         {
          name: "teste",
          description: "Transporte principal utilizado para chegar a Aveiro desde Lisboa. Viagem confortável e com belas paisagens."
        },
        {
          name: "Metro",
          description: "Sistema de transporte rápido e eficiente para deslocações na cidade."
        },
        {
          name: "Autocarro",
          description: "Rede de autocarros urbanos que cobrem toda a cidade e arredores."
        },
        {
          name: "Bicicleta",
          description: "Sistema de bicicletas partilhadas disponível pela cidade, ideal para passeios pela ria."
        }
      ],
      images_transportMethods: [
        require("../images/travels/aveiro1.jpg"),
        require("../images/travels/aveiro2.jpg"),
        require("../images/travels/aveiro3.jpg")
      ],
      pointsOfInterest: [
        {
          name: "Museu de Aveiro",
          description: "Antigo Convento de Jesus com rica história",
          type: "Museu",
        }
      ],
      images_referencePoints: [
        require("../images/travels/aveiro7.jpg"),
        require("../images/travels/aveiro8.jpg")
      ],
      localTransport: [
        {
          name: "Autocarro urbano",
          images: [require("../images/travels/aveiro9.jpg")]
        }
      ],
      itinerary: [
        {
          day: 1,
          activities: ["Chegada ao hotel", "Passeio pelos canais", "Jantar típico"]
        },
        {
          day: 2,
          activities: ["Visita ao Museu de Aveiro", "Prova de ovos moles", "Passeio de moliceiro"]
        }
      ],
      activities: ["Passeio de moliceiro", "Visita a museus", "Gastronomia local"],
      negativePoints: [
        {
          name: "Chuva inesperada",
          description: "Houve alguns dias de chuva que limitaram as atividades ao ar livre"
        }
      ],
      safety: {
        tips: ["Cidade muito segura", "Atenção nas zonas dos canais"],
        vaccinations: []
      }
    };
    
    console.log('Mock Travel Data:', mockTravel);
    console.log('Transports:', mockTravel.transports);
    setTravel(mockTravel);
    setLikeCount(mockTravel.likes);
    // Comentários ordenados do mais recente para o mais antigo
    setComments([
      {
        id: 4,
        user: "Carlos Oliveira",
        userProfilePicture: defaultAvatar,
        text: "Acabei de voltar de Aveiro após ler esta review! Obrigado pela inspiração 🙌",
        createdAt: new Date().toISOString(), // Agora mesmo
        likes: 2,
        replies: []
      },
      {
        id: 3,
        user: "Maria Costa",
        userProfilePicture: defaultAvatar,
        text: "Os ovos moles são mesmo deliciosos! Recomendo a todos que provem na Casa do Bacalhau.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
        likes: 5,
        replies: [
          {
            id: 31,
            user: "Tiago",
            userProfilePicture: defaultAvatar,
            text: "Exato! Esse lugar tem os melhores ovos moles da cidade 😋",
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
            likes: 1,
            replies: []
          }
        ]
      },
      {
        id: 2,
        user: "João Santos",
        userProfilePicture: defaultAvatar,
        text: "Adorei as fotos dos canais! Vou definitivamente visitar no próximo verão.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
        likes: 8,
        replies: []
      },
      {
        id: 1,
        user: "Ana Silva",
        userProfilePicture: defaultAvatar,
        text: "Que viagem incrível! Aveiro é mesmo uma cidade encantadora. As cores dos moliceiros são lindíssimas!",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 semana atrás
        likes: 12,
        replies: [
          {
            id: 11,
            user: "Tiago",
            userProfilePicture: defaultAvatar,
            text: "Obrigado Ana! Foi mesmo uma experiência fantástica. Os moliceiros são únicos!",
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 dias atrás
            likes: 3,
            replies: []
          }
        ]
      }
    ]);
    setLoading(false);
  }, [id]);

  // Função para obter todas as imagens da viagem
  const getAllImages = () => {
    if (!travel) return [];
    
    const images = [];
    
    // 1º - Imagem de Destaque
    if (travel.highlightImage) {
      images.push({
        url: travel.highlightImage,
        type: 'highlight',
        caption: 'Imagem de Destaque'
      });
    }
    
    // 2º - Fotografias das Informações Gerais
    if (travel.images_generalInformation && travel.images_generalInformation.length > 0) {
      travel.images_generalInformation.forEach((img, index) => {
        images.push({
          url: img,
          type: 'general',
          caption: `Informações Gerais ${index + 1}`
        });
      });
    }
    
    // 3º - Fotografias da Estadia
    if (travel.accommodations && travel.accommodations.length > 0) {
      travel.accommodations.forEach(acc => {
        if (acc.images && acc.images.length > 0) {
          acc.images.forEach((img, index) => {
            images.push({
              url: img,
              type: 'accommodation',
              caption: `Estadia: ${acc.name}`
            });
          });
        }
      });
    }
    
    // 4º - Fotografias das Recomendações Alimentares
    if (travel.images_foodRecommendations && travel.images_foodRecommendations.length > 0) {
      travel.images_foodRecommendations.forEach((img, index) => {
        images.push({
          url: img,
          type: 'food',
          caption: `Gastronomia ${index + 1}`
        });
      });
    }
    
    // 5º - Fotografias dos Métodos de Transporte
    if (travel.images_transportMethods && travel.images_transportMethods.length > 0) {
      travel.images_transportMethods.forEach((img, index) => {
        images.push({
          url: img,
          type: 'transport',
          caption: `Métodos de Transporte ${index + 1}`
        });
      });
    }
    
    // Também incluir imagens do localTransport se existir (compatibilidade)
    if (travel.localTransport && travel.localTransport.length > 0) {
      travel.localTransport.forEach(transport => {
        if (transport.images && transport.images.length > 0) {
          transport.images.forEach((img, index) => {
            images.push({
              url: img,
              type: 'transport',
              caption: `Transporte: ${transport.name}`
            });
          });
        }
      });
    }
    
    // 6º - Fotografias dos Pontos de Referência
    if (travel.images_referencePoints && travel.images_referencePoints.length > 0) {
      travel.images_referencePoints.forEach((img, index) => {
        images.push({
          url: img,
          type: 'reference',
          caption: `Pontos de Interesse ${index + 1}`
        });
      });
    }
    
    return images;
  };

  // Obter vídeos da viagem (prioridade)
  const getVideos = () => {
    if (!travel) return [];
    return travel.travelVideos && travel.travelVideos.length > 0 ? travel.travelVideos : [];
  };

  const allImages = getAllImages();
  const videos = getVideos();
  const hasVideos = videos.length > 0;

  // useEffect para gerenciar o slideshow (apenas imagens no hero)
  useEffect(() => {
    let slideInterval;

    if (allImages.length > 1) {
      // Slideshow de imagens a cada 4.5 segundos
      slideInterval = setInterval(() => {
        setCurrentHeroIndex(prevIndex => (prevIndex + 1) % allImages.length);
      }, 4500); // 4.5 segundos por imagem
    }

    return () => {
      if (slideInterval) {
        clearInterval(slideInterval);
      }
    };
  }, [allImages.length]);

  // Inicializar com primeira imagem
  useEffect(() => {
    setCurrentHeroIndex(0);
  }, [allImages.length]);

  // Obter imagem atual para exibir no hero
  const getCurrentImage = () => {
    if (allImages.length > 0) {
      return allImages[currentHeroIndex];
    }
    return null;
  };

  const currentImage = getCurrentImage();

  if (loading) {
    return <div className="loading">A carregar detalhes da viagem...</div>;
  }

  if (!travel) {
    return <div className="error">Viagem não encontrada.</div>;
  }

  return (
    <div className="travel-details-container-travel-details">
   


      {/* Hero Section */}
      <div className="travel-hero-travel-details">
        <div className="hero-image-container-travel-details">
          {currentImage && (
            <>
              <img 
                src={currentImage.url} 
                alt={currentImage.caption || `Imagem de destaque de ${travel.name}`} 
                className="hero-background-image-travel-details"
                onError={handleImageError}
              />
              
              {/* Navigation arrows (igual ao Home.js) */}
              {allImages.length > 1 && (
                <>
                  <button className="hero-nav-btn-travel-details hero-nav-prev-travel-details" onClick={handlePrevImage}>
                    <ArrowLeft />
                  </button>
                  <button className="hero-nav-btn-travel-details hero-nav-next-travel-details" onClick={handleNextImage}>
                    <ArrowRight />
                  </button>
                </>
              )}
              
              {/* Image counter */}
              {allImages.length > 1 && (
                <div className="hero-image-counter-travel-details">
                  {currentHeroIndex + 1} / {allImages.length}
                </div>
              )}
              
              <div className="hero-overlay-travel-details">
                <div className="hero-content-travel-details">
                  {/* Travel Header */}
                  <div className="hero-header-travel-details">
                    <div className="travel-info-top-travel-details">
                      <h2 className="travel-title-travel-details">{travel.name}</h2>
                      <div className="travel-meta-top-travel-details">
                        <div className="travel-location-travel-details">
                          <span className="location-icon-travel-details">📍</span>
                          <span>{travel.city}, {travel.country}</span>
                        </div>
                        <div className="travel-author-travel-details">
                          <span className="author-icon-travel-details">👤</span>
                          <span>Por: <span 
                            className="author-name-link-travel-details" 
                            onClick={() => handleUserClick(travel.user)}
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {travel.user}
                          </span></span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Travel Rating */}
                    <div className="travel-rating-travel-details">
                      <div className="rating-stars-travel-details">
                        {renderStars(Math.floor(travel.stars))}
                        <span className="rating-value-travel-details"></span>
                      </div>
                      <span className="rating-label-travel-details"></span>
                    </div>
                  </div>
                  
                  {/* Travel Stats */}
                  <div className="hero-stats-travel-details">
                      <div className="stat-item-travel-details" onClick={openDatesModal} style={{ cursor: 'pointer' }}>
                        <span className="stat-icon-travel-details">📅</span>
                        <span className="stat-value-travel-details">{travel.days}</span>
                        <span className="stat-label-travel-details">dias</span>
                      </div>
                    <div className="stat-item-travel-details" onClick={handleLike}>
                      <FaHeart className={`stat-icon-travel-details ${isLiked ? 'liked' : ''}`} />
                      <span className="stat-value-travel-details">{likeCount}</span>
                      <span className="stat-label-travel-details">gostos</span>
                    </div>
                    <div className="stat-item-travel-details" onClick={toggleComments}>
                      <FaComment className="stat-icon-travel-details" />
                      <span className="stat-value-travel-details">{comments.length}</span>
                      <span className="stat-label-travel-details">comentários</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="hero-actions-travel-details">
                    <button 
                      className={`action-btn-travel-details like-btn-travel-details ${isLiked ? 'liked' : ''}`}
                      onClick={handleLike}
                    >
                      <FaHeart />
                      {isLiked ? 'Gostei' : 'Gostar'}
                    </button>
                    <button className="action-btn-travel-details comment-btn-travel-details" onClick={toggleComments}>
                      <FaComment />
                      Comentar
                    </button>
                    
                    {/* Desktop: Botão Denunciar direto */}
                    {!isMobile && (
                      <button 
                        className="action-btn-travel-details report-btn-travel-details" 
                        onClick={(e) => handleReportTravel(travel, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <FaFlag />
                        Denunciar
                      </button>
                    )}
                    
                    {/* Mobile: Botão Denunciar compacto */}
                    {isMobile && (
                      <button 
                        className="action-btn-travel-details report-btn-travel-details" 
                        onClick={(e) => handleReportTravel(travel, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 10px' }}
                      >
                        <FaFlag />
                        <span style={{ display: window.innerWidth > 480 ? 'inline' : 'none' }}>
                          Denunciar
                        </span>
                      </button>
                    )}
                  </div>
                  
                  {/* Image Caption */}
                  {currentImage && (
                    <div className="hero-caption-travel-details">
                      <span className="caption-type-travel-details">
                        {currentImage.type === 'highlight' ? '🌟' : 
                         currentImage.type === 'general' ? 'ℹ️' :
                         currentImage.type === 'accommodation' ? '🏨' :
                         currentImage.type === 'food' ? '🍽️' :
                         currentImage.type === 'transport' ? '🚗' :
                         currentImage.type === 'reference' ? '📍' : '📸'}
                      </span>
                      <span className="caption-text-travel-details">{currentImage.caption}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Comentários (igual ao Home.js) */}
      <AnimatePresence>
        {showCommentsModal && (
          <motion.div
            className="modal-overlay-travel-details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseComments}
          >
            <motion.div
              className="comments-modal-travel-details"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="comments-modal-header-travel-details">
                <h3>Comentários ({comments.length})</h3>
                <button className="close-comments-travel-details" onClick={handleCloseComments}>×</button>
              </div>
              
              {/* Modal Content com Scroll */}
              <div className="comments-modal-content-travel-details">
                {/* Add Comment - Sistema moderno unificado */}
                {user && (
                  <div className="add-comment-modern comments-modal-section">
                    <img 
                      src={user.profilePicture || defaultAvatar} 
                      alt="Seu avatar" 
                      className="comment-user-avatar" 
                    />
                    <div className="comment-form-wrapper-modern">
                      <textarea
                        value={newComment}
                        onChange={(e) => {
                          if (e.target.value.length <= COMMENT_LIMITS.MAX_LENGTH) {
                            setNewComment(e.target.value);
                          }
                        }}
                        placeholder="Escreva um comentário..."
                        className="comment-input-modern"
                        rows="3"
                        maxLength={COMMENT_LIMITS.MAX_LENGTH}
                      />
                      <div className="comment-form-actions">
                        <span className="char-count">{newComment.length}/{COMMENT_LIMITS.MAX_LENGTH}</span>
                        <button 
                          className="comment-submit-btn-modern"
                          onClick={() => handleAddComment()}
                          disabled={!newComment.trim() || commentLoading}
                        >
                          {commentLoading ? 'Publicando...' : 'Publicar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!user && (
                  <div className="login-prompt-modern comments-modal-section">
                    <p>🔒 Faça login para comentar nesta viagem</p>
                  </div>
                )}

                {commentSuccess && (
                  <div className="comment-success-modern comments-modal-section">
                    ✅ {commentSuccess}
                  </div>
                )}
                
                {/* Comments List - Sistema moderno unificado */}
                <div className="comments-list-modern comments-modal-section">
                  {comments.length > 0 ? (
                    comments.map((comment, index) => renderComment(comment, [], index))
                  ) : (
                    <div className="no-comments-modern">
                      <span className="no-comments-icon">💬</span>
                      <p>Ainda não há comentários.</p>
                      <p>Seja o primeiro a comentar!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Travel Summary Cards */}
      <div className="travel-summary-travel-details">
        <div className="summary-cards-travel-details">
          <div className="summary-card-travel-details price-card-travel-details" onClick={openPriceModal}>
            <div className="card-icon-travel-details">💰</div>
            <div className="card-content-travel-details">
              <h3>Preço Total</h3>
              <p className="price-travel-details">{travel.price || 'N/A'}€</p>
              <button className="price-toggle-travel-details" onClick={openPriceModal}>
                Ver Detalhes
              </button>
            </div>
          </div>

          <div className="summary-card-travel-details category-card-travel-details" onClick={openCategoriesModal}>
            <div className="card-icon-travel-details">🏷️</div>
            <div className="card-content-travel-details">
              <h3>Categorias</h3>
              <div className="categories-display-travel-details">
                {travel.category && travel.category.length > 0 ? (
                  <div className="category-tags-travel-details">
                    {travel.category.slice(0, 3).map((cat, index) => (
                      <span key={index} className="category-tag-travel-details">{cat}</span>
                    ))}
                    {travel.category.length > 3 && (
                      <span className="more-categories-travel-details">+{travel.category.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <span className="no-categories-travel-details">Não categorizada</span>
                )}
              </div>
              <button className="view-all-btn-travel-details">Ver Todas</button>
            </div>
          </div>

          <div className="summary-card-travel-details dates-card-travel-details" onClick={openDatesModal}>
            <div className="card-icon-travel-details">📅</div>
            <div className="card-content-travel-details">
              <h3>Datas da Viagem</h3>
              <div className="dates-display-travel-details">
                {travel.startDate && travel.endDate ? (
                  <div className="date-tags-travel-details">
                    <span className="date-tag-travel-details">
                      Início: 📅 {new Date(travel.startDate).toLocaleDateString('pt-PT')}
                    </span>
                    <span className="date-tag-travel-details">
                      Fim: 🏁 {new Date(travel.endDate).toLocaleDateString('pt-PT')}
                    </span>
                    {travel.BookingTripPaymentDate && (
                      <span className="date-tag-travel-details">
                        Reserva: 💳 {new Date(travel.BookingTripPaymentDate).toLocaleDateString('pt-PT')}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="no-dates-travel-details">Datas não definidas</span>
                )}
              </div>
              <button className="view-all-btn-travel-details">Ver Detalhes</button>
            </div>
          </div>

          <div className="summary-card-travel-details transport-card-travel-details" onClick={openTransportModal}>
            <div className="card-icon-travel-details">🚗</div>
            <div className="card-content-travel-details">
              <h3>Transportes</h3>
              <div className="transport-display-travel-details">
                {Array.isArray(travel && travel.transports) && travel.transports.length > 0 ? (
                  <div className="transport-tags-travel-details">
                    {travel.transports.slice(0, 3).map((transport, index) => (
                      <span key={index} className="transport-tag-travel-details">{transport}</span>
                    ))}
                    {travel.transports.length > 3 && (
                      <span className="more-transports-travel-details">+{travel.transports.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <span className="no-transports-travel-details">Sem transportes</span>
                )}
              </div>
              <button className="view-all-btn-travel-details">Ver Todos</button>
            </div>
          </div>
        </div>
      </div>





      <div className="moreDetails-travel-details">
        <div className="tabs-travels-travel-details">
          <button
            className={`tab-button-travel-details ${activeTab === 'generalInformation' ? 'active' : ''}`}
            onClick={() => setActiveTab('generalInformation')}
          >
            Informações Gerais
          </button>
          <button
            className={`tab-button-travel-details ${activeTab === 'accommodations' ? 'active' : ''}`}
            onClick={() => setActiveTab('accommodations')}
          >
            Estadia
          </button>
          <button
            className={`tab-button-travel-details ${activeTab === 'foodRecommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('foodRecommendations')}
          >
            Alimentação
          </button>
          <button
            className={`tab-button-travel-details ${activeTab === 'transportMethods' ? 'active' : ''}`}
            onClick={() => setActiveTab('transportMethods')}
          >
            Transportes
          </button>
          <button
            className={`tab-button-travel-details ${activeTab === 'referencePoints' ? 'active' : ''}`}
            onClick={() => setActiveTab('referencePoints')}
          >
            Pontos de Referência
          </button>
          <button
            className={`tab-button-travel-details ${activeTab === 'itinerary' ? 'active' : ''}`}
            onClick={() => setActiveTab('itinerary')}
          >
            Itinerário
          </button>
          {hasVideos && (
            <button
              className={`tab-button-travel-details ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              Vídeos
            </button>
          )}
          <button
            className={`tab-button-travel-details ${activeTab === 'negativePoints' ? 'active' : ''}`}
            onClick={() => setActiveTab('negativePoints')}
          >
            Pontos Negativos
          </button>
        </div>

        <div className="tab-content-travels-travel-details">
          {activeTab === 'generalInformation' && (
            <div className="tab-content-travels-travel-details">
              <div className="tab-header-travel-details">
                <h2>ℹ️ Informações Gerais</h2>
                <p>Detalhes essenciais sobre esta viagem</p>
              </div>

              {/* Conteúdo movido da seção de descrição */}
              <div className="general-info-content-travel-details">
                <h3>Sobre esta Viagem:</h3>
                <div className="description-content-travel-details">
                  {travel.longDescription && (
                    <div className="long-description-travel-details">
                      <p>{travel.longDescription}</p>
                    </div>
                  )}
                  <br />
                  {travel.description && travel.description !== travel.longDescription && (
                    <div className="short-description-travel-details">
                      <h3>Resumo:</h3>
                      <p>{travel.description}</p>
                    </div>
                  )}
                  {!travel.longDescription && !travel.description && (
                    <p className="no-description-travel-details">Descrição não disponível.</p>
                  )}
                </div>
                
                {/* Climate and Language Info */}
                <div className="additional-info-travel-details">
                  {travel.climate && (
                    <div className="climate-info-travel-details">
                      <span className="info-icon-travel-details">🌤️</span>
                      <span><strong>Clima:</strong> {travel.climate}</span>
                    </div>
                  )}
                  {travel.language && (
                    <div className="language-info-travel-details">
                      <span className="info-icon-travel-details">�️</span>
                      <span><strong>Línguas Utilizadas:</strong> {travel.language}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Galeria de fotos mantida */}
              {travel.images_generalInformation && travel.images_generalInformation.length > 0 && (
                <div className="general-gallery">
                  <h3>📷 Galeria de Fotos</h3>
                  <div className="images-grid">
                    {travel.images_generalInformation.map((image, index) => (
                      <div key={index} className="image-item" onClick={() => openModal(image)}>
                        <img src={image} alt={`Informação geral ${index + 1}`} />
                        <div className="image-overlay">
                          <span className="image-icon">🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'accommodations' && (
            <div className="tab-content-travels">
              <div className="tab-header">
                <h2>🏨 Estadia</h2>
                <p>Informações sobre onde ficaste durante a viagem</p>
              </div>

              <div className="accommodations-grid">
                {travel.accommodations && travel.accommodations.length > 0 ? (
                  travel.accommodations.map((acc, index) => (
                    <div key={index} className="accommodation-card">
                      <div className="accommodation-header">
                        <h3 className="accommodation-name">{acc.name}</h3>
                        <div className="accommodation-rating">
                          {renderStars(acc.rating || 0)}
                          <span className="rating-value">({acc.rating || 0}/5)</span>
                        </div>
                      </div>

                      <div className="accommodation-details">
                        <div className="detail-row">
                          <span className="detail-icon">🏨</span>
                          <span className="detail-label">Tipo:</span>
                          <span className="detail-value">{acc.type || 'Não especificado'}</span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-icon">🍽️</span>
                          <span className="detail-label">Regime:</span>
                          <span className="detail-value">{acc.regime || 'Não especificado'}</span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-icon">🌙</span>
                          <span className="detail-label">Noites:</span>
                          <span className="detail-value">{acc.nights || 'N/A'}</span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-icon">📅</span>
                          <span className="detail-label">Check-in:</span>
                          <span className="detail-value">
                            {acc.checkInDate ? new Date(acc.checkInDate).toLocaleDateString('pt-PT') : 'N/A'}
                          </span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-icon">📅</span>
                          <span className="detail-label">Check-out:</span>
                          <span className="detail-value">
                            {acc.checkOutDate ? new Date(acc.checkOutDate).toLocaleDateString('pt-PT') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {acc.description && (
                        <div className="accommodation-description">
                          <p>{acc.description}</p>
                        </div>
                      )}

                      {acc.images && acc.images.length > 0 && (
                        <div className="accommodation-images">
                          
                          <div className="images-grid">
                            {acc.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="image-item" onClick={() => openModal(image)}>
                                <img src={image} alt={`${acc.name} - Foto ${imgIndex + 1}`} />
                                <div className="image-overlay">
                                  <span className="image-icon">🔍</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">🏨</div>
                    <h3>Nenhuma estadia registada</h3>
                    <p>Não há informações sobre acomodações para esta viagem.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'foodRecommendations' && (
            <div className="tab-content-travels">
              <div className="tab-header">
                <h2>🍽️ Gastronomia</h2>
                <p>Descobrir os sabores desta viagem</p>
              </div>

              <div className="food-recommendations">
                {travel.foodRecommendations && travel.foodRecommendations.length > 0 ? (
                  <div className="food-grid">
                    {travel.foodRecommendations.map((food, index) => (
                      <div key={index} className="food-card">
                        <div className="food-header">
                          <h3 className="food-name">{food.name}</h3>
                          <span className="food-icon">🍽️</span>
                        </div>
                        <div className="food-description">
                          <p>{food.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">🍽️</div>
                    <h3>Nenhuma recomendação gastronómica</h3>
                    <p>Não há recomendações alimentares registadas para esta viagem.</p>
                  </div>
                )}
              </div>

              {travel.images_foodRecommendations && travel.images_foodRecommendations.length > 0 && (
                <div className="food-gallery">
                  <h3>Galeria de Fotos da Gastronomia</h3>
                  <div className="images-grid">
                    {travel.images_foodRecommendations.map((image, index) => (
                      <div key={index} className="image-item" onClick={() => openModal(image)}>
                        <img
                          src={image instanceof File ? URL.createObjectURL(image) : image}
                          alt={`Gastronomia ${index + 1}`}
                          onError={(e) => (e.target.src = '/default-image.jpg')}
                        />
                        <div className="image-overlay">
                          <span className="image-icon">🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transportMethods' && (
            <div className="tab-content-travels">
              <div className="tab-header">
                <h2>🚗 Métodos de Transporte</h2>
                <p>Descobre os meios de transporte utilizados nesta viagem</p>
              </div>

              <div className="food-recommendations">
                {travel.transportMethods && travel.transportMethods.length > 0 ? (
                  <div className="food-grid">
                    {travel.transportMethods.map((transport, index) => (
                      <div key={index} className="food-card">
                        <div className="food-header">
                          <h3 className="food-name">{transport.name}</h3>
                          <span className="food-icon">🚗</span>
                        </div>
                        <div className="food-description">
                          <p>{transport.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">🚗</div>
                    <h3>Nenhum método de transporte registado</h3>
                    <p>Não há métodos de transporte registados para esta viagem.</p>
                  </div>
                )}
              </div>

              {travel.images_transportMethods && travel.images_transportMethods.length > 0 && (
                <div className="food-gallery">
                  <h3>Galeria de Fotos dos Métodos de Transporte</h3>
                  <div className="images-grid">
                    {travel.images_transportMethods.map((image, index) => (
                      <div key={index} className="image-item" onClick={() => openModal(image)}>
                        <img
                          src={image instanceof File ? URL.createObjectURL(image) : image}
                          alt={`Método de transporte ${index + 1}`}
                          onError={(e) => (e.target.src = '/default-image.jpg')}
                        />
                        <div className="image-overlay">
                          <span className="image-icon">🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'referencePoints' && (
            <div className="tab-content-travels">
              <div className="tab-header">
                <h2>📍 Pontos de Interesse</h2>
                <p>Locais especiais visitados durante a viagem</p>
              </div>

              <div className="points-of-interest">
                {travel.pointsOfInterest && travel.pointsOfInterest.length > 0 ? (
                  <div className="points-grid">
                    {travel.pointsOfInterest.map((point, index) => (
                      <div key={index} className="point-card">
                        <div className="point-header">
                          <h3 className="point-name">{point.name}</h3>
                          <span className="point-type">{point.type}</span>
                        </div>
                        <div className="point-description">
                          <p>{point.description}</p>
                        </div>
                        {point.link && (
                          <div className="point-link">
                            <a href={point.link} target="_blank" rel="noopener noreferrer">
                              🔗 Mais informações
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">📍</div>
                    <h3>Nenhum ponto de interesse</h3>
                    <p>Não há pontos de interesse registados para esta viagem.</p>
                  </div>
                )}
              </div>

              {travel.images_referencePoints && travel.images_referencePoints.length > 0 && (
                <div className="points-gallery">
                  <h3>Galeria dos Pontos de Interesse</h3>
                  <div className="images-grid">
                    {travel.images_referencePoints.map((image, index) => (
                      <div key={index} className="image-item" onClick={() => openModal(image)}>
                        <img src={image} alt={`Ponto de interesse ${index + 1}`} />
                        <div className="image-overlay">
                          <span className="image-icon">🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'itinerary' && (
            <div className="tab-content-travels">
              <div className="tab-header">
                <h2>📅 Itinerário da Viagem</h2>
                <p>Plano dia a dia da tua aventura</p>
              </div>

              <div className="itinerary-container">
                {travel.itinerary && travel.itinerary.length > 0 ? (
                  <div className="itinerary-timeline">
                    {travel.itinerary.map((day, index) => (
                      <div key={index} className="itinerary-day">
                        <div className="day-marker">
                          <div className="day-number">Dia {day.day}</div>
                          <div className="day-line"></div>
                        </div>
                        
                        <div className="day-content">
                          {day.activities && day.activities.length > 0 ? (
                            <div className="activities-list">
                              {day.activities.map((activity, actIndex) => (
                                <div key={actIndex} className="activity-item">
                                  <div className="activity-icon">📍</div>
                                  <div className="activity-content">
                                    <h4 className="activity-name">{activity}</h4>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="no-activities">
                              <span className="no-activities-text">Sem atividades planeadas</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">📅</div>
                    <h3>Nenhum itinerário disponível</h3>
                    <p>Não há plano dia a dia registado para esta viagem.</p>
                  </div>
                )}
              </div>

              {travel.activities && travel.activities.length > 0 && (
                <div className="activities-summary">
                  <h3>Resumo das Atividades</h3>
                  <div className="activities-grid">
                    {travel.activities.map((activity, index) => (
                      <div key={index} className="activity-tag">
                        <span className="activity-icon">🎯</span>
                        <span className="activity-text">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="tab-content-travels">
              <div className="tab-header">
                <h2>🎥 Vídeos da Viagem</h2>
                <p>Revive os momentos especiais através dos vídeos</p>
              </div>

              <div className="videos-section">
                {videos && videos.length > 0 ? (
                  <div className="videos-grid">
                    {videos.map((video, index) => (
                      <div key={index} className="video-card">
                        <div className="video-header">
                          <h3>Vídeo {index + 1}</h3>
                          <span className="video-icon">🎬</span>
                        </div>
                        <div className="video-container">
                          <video 
                            controls 
                            preload="metadata"
                            className="travel-video"
                          >
                            <source src={video} type="video/mp4" />
                            O seu navegador não suporta vídeos HTML5.
                          </video>
                        </div>
                        <div className="video-info">
                          <p>Vídeo da viagem - {travel.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">🎥</div>
                    <h3>Nenhum vídeo disponível</h3>
                    <p>Não há vídeos registados para esta viagem.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'negativePoints' && (
            <div className="tab-content-travels">
              <div className="tab-header">
                <h2>⚠️ Pontos Negativos</h2>
                <p>Aspetos menos positivos desta experiência</p>
              </div>

              <div className="negative-points">
                {travel.negativePoints && travel.negativePoints.length > 0 ? (
                  <div className="negative-points-list">
                    {travel.negativePoints.map((point, index) => (
                      <div key={index} className="negative-point-card">
                        <div className="negative-point-header">
                          <span className="negative-icon">⚠️</span>
                          <h3 className="negative-point-name">{point.name}</h3>
                        </div>
                        <div className="negative-point-description">
                          <p>{point.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">✅</div>
                    <h3>Nenhum ponto negativo reportado</h3>
                    <p>Esta viagem não tem aspetos negativos registados!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Viagens Recomendadas */}
      {recommendedTravels.length > 0 && (
        <div className="recommended-travels-section-travel-details">
          <div className="recommended-header-travel-details">
            <h2>🌟 Viagens Recomendadas</h2>
            <p>Outras viagens da mesma categoria que pode interessar</p>
          </div>
          
          <div className="recommended-carousel-container-travel-details">
            <button 
              className="carousel-nav-btn-travel-details carousel-prev-travel-details"
              onClick={handleRecommendedPrev}
              disabled={recommendedCurrentIndex === 0}
              style={{ 
                position: 'absolute', 
                left: 10, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                zIndex: 20,
                background: '#ff9900',
                border: 'none',
                cursor: 'pointer',
                padding: '10px',
                transition: 'all 0.3s ease'
              }}
              aria-label="Viagem anterior"
              onMouseEnter={(e) => {
                
                e.target.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))';
              }}
              onMouseLeave={(e) => {
               
                e.target.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
              }}
            >
              <ArrowLeft />
            </button>
            
            <div className="recommended-carousel-travel-details" ref={recommendedCarouselRef}>
              <div className="recommended-carousel-track-travel-details">
                {recommendedTravels
                  .slice(recommendedCurrentIndex, recommendedCurrentIndex + recommendedItemsPerView)
                  .map((recommendedTravel) => (
                  <div 
                    key={recommendedTravel.id} 
                    className="recommended-travel-card-travel-details"
                    onClick={() => window.location.href = `/travel/${recommendedTravel.id}`}
                  >
                    <div className="recommended-travel-image-travel-details">
                      <img 
                        src={recommendedTravel.highlightImage} 
                        alt={recommendedTravel.name}
                        onError={handleImageError}
                      />
                      <div className="recommended-travel-overlay-travel-details">
                        <div className="recommended-travel-rating-travel-details">
                          {renderStars(recommendedTravel.stars)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="recommended-travel-info-travel-details">
                      <h3 className="recommended-travel-name-travel-details">
                        {recommendedTravel.name}
                      </h3>
                      <p className="recommended-travel-location-travel-details">
                        📍 {recommendedTravel.city}, {recommendedTravel.country}
                      </p>
                      <p className="recommended-travel-author-travel-details">
                        👤 Por: <span 
                          className="author-name-link-travel-details" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(recommendedTravel.user);
                          }}
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {recommendedTravel.user}
                        </span>
                      </p>
                      
                      <div className="recommended-travel-categories-travel-details">
                        {recommendedTravel.category.slice(0, 3).map((cat, index) => (
                          <span key={index} className="recommended-category-tag-travel-details">
                            {cat}
                          </span>
                        ))}
                        {recommendedTravel.category.length > 3 && (
                          <span className="recommended-more-categories-travel-details">
                            +{recommendedTravel.category.length - 3}
                          </span>
                        )}
                      </div>
                      
                      <button className="recommended-view-btn-travel-details">
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              className="carousel-nav-btn-travel-details carousel-next-travel-details"
              onClick={handleRecommendedNext}
              disabled={recommendedCurrentIndex >= recommendedTravels.length - recommendedItemsPerView}
              style={{ 
                position: 'absolute', 
                right: 10, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                zIndex: 20,
                background: '#ff9900',
                border: 'none',
                cursor: 'pointer',
                padding: '10px',
                transition: 'all 0.3s ease'
              }}
              aria-label="Próxima viagem"
              onMouseEnter={(e) => {
                
                e.target.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))';
              }}
              onMouseLeave={(e) => {
                
                e.target.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
              }}
            >
              <ArrowRight />
            </button>
          </div>
          
          {/* Indicadores de página */}
          {recommendedTravels.length > recommendedItemsPerView && (
            <div className="recommended-pagination-travel-details">
              <span className="pagination-info-travel-details">
                {Math.floor(recommendedCurrentIndex / recommendedItemsPerView) + 1} de {Math.ceil(recommendedTravels.length / recommendedItemsPerView)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-travel-details" onClick={closeModal}>
          <div className="modal-content-image-travel-details" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close-image-travel-details" onClick={closeModal}>
              ×
            </span>
            <img
              src={selectedImage instanceof File ? URL.createObjectURL(selectedImage) : selectedImage}
              alt="Imagem ampliada"
            />
          </div>
        </div>
      )}

      {/* Price Details Modal */}
      {showPriceModal && (
        <div className="details-modal-travel-details" onClick={closePriceModal}>
          <div className="modal-content-details-travel-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-travel-details">
              <h3>💰 Detalhes dos Custos</h3>
              <span className="modal-close-travel-details" onClick={closePriceModal}>×</span>
            </div>
            <div className="modal-body-travel-details">
              <div className="price-breakdown-modal-travel-details">
                <div className="breakdown-item-modal-travel-details">
                  <span className="breakdown-icon-travel-details">🏨</span>
                  <span className="breakdown-label-travel-details">Hotel</span>
                  <span className="breakdown-value-travel-details">{travel.priceDetails?.hotel || '0'}€</span>
                </div>
                <div className="breakdown-item-modal-travel-details">
                  <span className="breakdown-icon-travel-details">✈️</span>
                  <span className="breakdown-label-travel-details">Voo</span>
                  <span className="breakdown-value-travel-details">{travel.priceDetails?.flight || '0'}€</span>
                </div>
                <div className="breakdown-item-modal-travel-details">
                  <span className="breakdown-icon-travel-details">🍽️</span>
                  <span className="breakdown-label-travel-details">Comida</span>
                  <span className="breakdown-value-travel-details">{travel.priceDetails?.food || '0'}€</span>
                </div>
                <div className="breakdown-item-modal-travel-details">
                  <span className="breakdown-icon-travel-details">🎁</span>
                  <span className="breakdown-label-travel-details">Extras</span>
                  <span className="breakdown-value-travel-details">{travel.priceDetails?.extras || '0'}€</span>
                </div>   
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCategoriesModal && (
        <div className="details-modal-travel-details" onClick={closeCategoriesModal}>
          <div className="modal-content-details-travel-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-travel-details">
              <h3>🏷️ Todas as Categorias</h3>
              <span className="modal-close-travel-details" onClick={closeCategoriesModal}>×</span>
            </div>
            <div className="modal-body-travel-details">
              <div className="categories-grid-modal-travel-details">
                {travel.category && travel.category.map((cat, index) => (
                  <div key={index} className="category-item-modal-travel-details">
                    <span className="category-text-travel-details">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transport Modal */}
      {showTransportModal && (
        <div className="details-modal-travel-details" onClick={closeTransportModal}>
          <div className="modal-content-details-travel-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-travel-details">
              <h3>🚗 Detalhes do Transporte</h3>
              <span className="modal-close-travel-details" onClick={closeTransportModal}>×</span>
            </div>
            <div className="modal-body-travel-details">
              <div className="transport-details-modal-travel-details">
                {travel.transports && travel.transports.length > 0 ? (
                  <div className="transport-grid-modal-travel-details">
                    {travel.transports.map((transport, index) => (
                      <div key={index} className="transport-item-modal-travel-details">
                        <span className="transport-text-travel-details">{transport}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-transports-modal-travel-details">
                    <span>Nenhum transporte registado para esta viagem.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dates Modal */}
      {showDatesModal && (
        <div className="details-modal-travel-details" onClick={closeDatesModal}>
          <div className="modal-content-details-travel-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-travel-details">
              <h3>📅 Todas as Datas</h3>
              <span className="modal-close-travel-details" onClick={closeDatesModal}>×</span>
            </div>
            <div className="modal-body-travel-details">
              <div className="dates-details-modal-travel-details">
                {travel.startDate && travel.endDate ? (
                  <>
                    <div className="date-item-modal-travel-details">
                      <div className="date-icon-travel-details">📅</div>
                      <div className="date-info-travel-details">
                        <span className="date-label-travel-details">Data de Início</span>
                        <span className="date-value-travel-details">
                          {new Date(travel.startDate).toLocaleDateString('pt-PT', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="date-item-modal-travel-details">
                      <div className="date-icon-travel-details">🏁</div>
                      <div className="date-info-travel-details">
                        <span className="date-label-travel-details">Data de Fim</span>
                        <span className="date-value-travel-details">
                          {new Date(travel.endDate).toLocaleDateString('pt-PT', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="date-item-modal-travel-details">
                      <div className="date-icon-travel-details">⏱️</div>
                      <div className="date-info-travel-details">
                        <span className="date-label-travel-details">Duração da Viagem</span>
                        <span className="date-value-travel-details">
                          {Math.ceil((new Date(travel.endDate) - new Date(travel.startDate)) / (1000 * 60 * 60 * 24))} dias
                        </span>
                      </div>
                    </div>

                    {travel.BookingTripPaymentDate && (
                      <div className="date-item-modal-travel-details">
                        <div className="date-icon-travel-details">💳</div>
                        <div className="date-info-travel-details">
                          <span className="date-label-travel-details">Data de Reserva</span>
                          <span className="date-value-travel-details">
                            {new Date(travel.BookingTripPaymentDate).toLocaleDateString('pt-PT', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-dates-modal-travel-details">
                    <span>Nenhuma data foi definida para esta viagem.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Denúncia - Igual ao Home.js */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div
            className="modal-content-users"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <h2>Denunciar Viagem</h2>
            <p>
              Por que deseja denunciar a viagem <strong>{travel?.name}</strong>?
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Esta ação irá reportar a viagem aos administradores.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.inappropriate}
                    onChange={() => handleReasonChange('inappropriate')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Conteúdo inapropriado</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: imagens ofensivas, descrições inapropriadas, nudez, etc.)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.falseInfo}
                    onChange={() => handleReasonChange('falseInfo')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Informação falsa ou enganosa</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: locais inexistentes, preços manipulados, etc.)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.abusive}
                    onChange={() => handleReasonChange('abusive')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Assédio/Abuso nos conteúdos</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: linguagem agressiva ou ofensiva)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.spam}
                    onChange={() => handleReasonChange('spam')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Spam ou autopromoção</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: publicidade abusiva, links externos)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.plagiarism}
                    onChange={() => handleReasonChange('plagiarism')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Plágio de conteúdo</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: fotos/textos copiados sem créditos)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.violation}
                    onChange={() => handleReasonChange('violation')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Violação das regras da plataforma</strong>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.other}
                    onChange={() => handleReasonChange('other')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Outro (especificar)</strong>
                  </div>
                </label>
                {reportReasons.other && (
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Descreva o motivo da denúncia..."
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                      resize: 'vertical',
                      minHeight: '80px',
                    }}
                  />
                )}
              </div>
            </div>

            <div className="modal-buttons">
              <button
                className="button-danger"
                onClick={() => {
                  setShowReportModal(false);
                  setReportReasons({
                    inappropriate: false,
                    falseInfo: false,
                    abusive: false,
                    spam: false,
                    violation: false,
                    plagiarism: false,
                    other: false,
                  });
                  setOtherReason('');
                }}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#6c757d',
                  color: 'white',
                }}
              >
                Cancelar
              </button>
              <button
                className="button-orange"
                onClick={submitReport}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                }}
              >
                Denunciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast para notificações */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default TravelDetails;