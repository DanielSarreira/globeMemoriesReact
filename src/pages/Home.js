import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import { FaHeart, FaComment, FaSync, FaShareAlt, FaChevronDown, FaSearch, FaBell, FaList, FaTh, FaChevronLeft, FaChevronRight, FaEllipsisV, FaFlag, FaReply, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { FaStar } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import TravelsData from '../data/travelsData';
import '../styles/pages/qanda.css';

// Dados mockados para notificações (simulando o backend)
const mockNotifications = [];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feedTravels, setFeedTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCountry, setFilterCountry] = useState('');
  const [showComments, setShowComments] = useState(null);
  const [sortOption, setSortOption] = useState('date');
  const [newComment, setNewComment] = useState({});
  const [newReply, setNewReply] = useState({});
  const [replyOpen, setReplyOpen] = useState({});
  const [likedTravels, setLikedTravels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const travelsPerPage = 5;

  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const feedContainerRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(null);
  const [likedComments, setLikedComments] = useState([]);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);
  const [isFeedRefreshed, setIsFeedRefreshed] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [reportReasons, setReportReasons] = useState({
    inappropriate: false,
    falseInfo: false,
    abusive: false,
    spam: false,
    violation: false,
    plagiarism: false,
    other: false,
  });
  const [otherReason, setOtherReason] = useState('');

  // Adiciona o estado para expandir descrição no mobile
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      try {
        let travels = [];

        if (user && user.id) {
          const followedUsers = ['Tiago Miranda'];
          travels = TravelsData.filter((travel) =>
            followedUsers.includes(travel.user) && (travel.privacy === 'public' || travel.privacy === 'followers')
          );
        }

        const publicTravels = TravelsData.filter((travel) => travel.privacy === 'public');
        const combinedTravels = [
          ...travels,
          ...publicTravels.filter(
            (publicTravel) => !travels.some((followedTravel) => followedTravel.id === publicTravel.id)
          ),
        ];

        setFeedTravels(combinedTravels);
        const initialIndices = combinedTravels.reduce((acc, travel) => {
          acc[travel.id] = 0;
          return acc;
        }, {});
        setCurrentImageIndices(initialIndices);

        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar o feed. Tente novamente mais tarde.');
        setLoading(false);
        console.error('Erro ao buscar feed:', err);
      }
    }, 1000);
  }, [user]);

  useEffect(() => {
    const handleRefreshEvent = () => {
      setLoading(true);
      setTimeout(() => {
        setFeedTravels(TravelsData);
        setCurrentPage(1);
        setLoading(false);
        setIsFeedRefreshed(true);
      }, 1000);
    };
    window.addEventListener('refreshHomeTravels', handleRefreshEvent);
    return () => window.removeEventListener('refreshHomeTravels', handleRefreshEvent);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowDropdown(null);
      }
    };
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permissão para notificações concedida!');
      setShowNotificationPrompt(false);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('Globe Memories', {
            body: 'Bem-vindo! Você ativou as notificações.',
            icon: '/icons/icon-192x192.png',
            data: { type: 'welcome', relatedId: '' },
          });
        });
      }
    } else {
      console.log('Permissão para notificações negada.');
      setShowNotificationPrompt(false);
    }
  };

  const dismissNotificationPrompt = () => {
    setShowNotificationPrompt(false);
  };

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  useEffect(() => {
    const intervals = feedTravels.map((travel) => {
      return setInterval(() => {
        setCurrentImageIndices((prev) => ({
          ...prev,
          [travel.id]: (prev[travel.id] + 1) % (travel.images_generalInformation?.length || 1),
        }));
      }, 8000);
    });

    return () => intervals.forEach((interval) => interval && clearInterval(interval));
  }, [feedTravels]);

  useEffect(() => {
    // Only observe on mobile and when feed container exists
    if (!isMobile || !feedContainerRef.current) return;

    const container = feedContainerRef.current.querySelector('.feed-snap');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.feed-item'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        });
      },
      { root: container, threshold: [0.5] }
    );

    items.forEach((it) => observer.observe(it));

    return () => observer.disconnect();
  }, [isMobile, feedTravels, currentPage, sortOption, searchQuery]);

  const handleLike = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Faça login para curtir!');
      return;
    }

    if (likedTravels.includes(travelId)) {
      setLikedTravels(likedTravels.filter((id) => id !== travelId));
      setFeedTravels(
        feedTravels.map((travel) =>
          travel.id === travelId ? { ...travel, likes: travel.likes - 1 } : travel
        )
      );
    } else {
      setLikedTravels([...likedTravels, travelId]);
      setFeedTravels(
        feedTravels.map((travel) =>
          travel.id === travelId ? { ...travel, likes: travel.likes + 1 } : travel
        )
      );
    }
  };

  const handleRefreshFeed = () => {
    setLoading(true);
    setIsRefreshing(true);
    setIsFeedRefreshed(true);
    setTimeout(() => {
      setFeedTravels(TravelsData);
      setCurrentPage(1);
      setLoading(false);
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }, 1000);
  };

  const handleAddComment = (travelId, parentIds = [], text) => {
    if (!user) {
      alert('Faça login para comentar!');
      return;
    }

    const commentText = text || newComment[travelId];
    
    if (!commentText?.trim()) {
      alert('Escreva um comentário antes de enviar!');
      return;
    }

    if (commentText.trim().length < 3) {
      alert('O comentário deve ter pelo menos 3 caracteres!');
      return;
    }

    setCommentLoading(true);
    setCommentSuccess(null);

    // Simulate API delay
    setTimeout(() => {
      const updateComments = (comments, path) => {
        if (path.length === 0) {
          return [
            ...comments,
            {
              id: Date.now(),
              user: user.username,
              userProfilePicture: user.profilePicture || null,
              text: commentText.trim(),
              createdAt: new Date().toISOString(),
              likes: 0,
              replies: [],
            },
          ];
        }
        const [currentId, ...rest] = path;
        return comments.map((c) =>
          c.id === currentId
            ? { ...c, replies: updateComments(c.replies || [], rest) }
            : c
        );
      };

      const updatedTravels = feedTravels.map((travel) => {
        if (travel.id === travelId) {
          return {
            ...travel,
            comments: updateComments(travel.comments, parentIds),
          };
        }
        return travel;
      });

      setFeedTravels(updatedTravels);

      // Clear inputs
      if (parentIds.length === 0) {
        setNewComment((prev) => ({ ...prev, [travelId]: '' }));
      } else {
        const replyKey = `${travelId}-${parentIds.join('-')}`;
        setNewReply((prev) => ({ ...prev, [replyKey]: '' }));
        setReplyOpen((prev) => ({ ...prev, [replyKey]: false }));
      }

      setCommentLoading(false);
      setCommentSuccess('Comentário publicado!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setCommentSuccess(null), 3000);
    }, 1000);
  };

  const handleCommentLike = (travelId, commentId, parentIds = []) => {
    if (!user) {
      alert('Faça login para curtir comentários!');
      return;
    }

    const key = `${travelId}-${parentIds.join('-')}-${commentId}`;
    
    const updateLikes = (comments, path, isLiked) => {
      if (path.length === 0) {
        return comments.map((comment) =>
          comment.id === commentId ? { ...comment, likes: comment.likes + (isLiked ? -1 : 1) } : comment
        );
      }
      const [currentId, ...rest] = path;
      return comments.map((comment) =>
        comment.id === currentId
          ? { ...comment, replies: updateLikes(comment.replies || [], rest, isLiked) }
          : comment
      );
    };

    const isLiked = likedComments.includes(key);
    setLikedComments((prev) => (isLiked ? prev.filter((k) => k !== key) : [...prev, key]));
    
    setFeedTravels((prev) =>
      prev.map((travel) =>
        travel.id === travelId
          ? { ...travel, comments: updateLikes(travel.comments, parentIds, isLiked) }
          : travel
      )
    );
  };

  const toggleReply = (key) => {
    setReplyOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);
    
    if (diffInSeconds < 60) {
      return 'agora mesmo';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    }
    
    return commentDate.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short'
    });
  };

  const renderComment = (comment, travelId, parentIds = [], index = 0) => {
    const key = `${travelId}-${parentIds.concat(comment.id).join('-')}`;
    const likeKey = `${travelId}-${[...parentIds].join('-')}-${comment.id}`;
    const isLiked = likedComments.includes(likeKey);
    
    return (
      <motion.div 
        key={comment.id} 
        className="comment-item-modern"
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
                  handleCommentLike(travelId, comment.id, parentIds);
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
                      onChange={(e) => setNewReply({ ...newReply, [key]: e.target.value })}
                      placeholder="Escreva uma resposta..."
                      className="reply-input-modern"
                      rows="2"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="reply-actions">
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
                          handleAddComment(travelId, parentIds.concat(comment.id), newReply[key]);
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
              renderComment(reply, travelId, parentIds.concat(comment.id), replyIndex)
            )}
          </motion.div>
        )}
      </motion.div>
    );
  };

  const handleShare = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const travelUrl = `http://localhost:3000/travel/${travelId}`;
    navigator.clipboard.writeText(travelUrl).then(() => {
      alert('Link da viagem copiado!');
    });
  };

  const handleLoadMore = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handleNextImage = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndices((prev) => ({
      ...prev,
      [travelId]: (prev[travelId] + 1) % (feedTravels.find((t) => t.id === travelId)?.images_generalInformation?.length || 1),
    }));
  };

  const handlePrevImage = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndices((prev) => ({
      ...prev,
      [travelId]: (prev[travelId] - 1 + (feedTravels.find((t) => t.id === travelId)?.images_generalInformation?.length || 1)) % (feedTravels.find((t) => t.id === travelId)?.images_generalInformation?.length || 1),
    }));
  };

  const handleDragStart = (travelId, e) => {
    if (!isMobile) return; // Only enable swipe on mobile
    
    const isTouch = e.type === 'touchstart';
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;
    let hasDragged = false;
    let dragDistance = 0;

    const handleDragMove = (moveEvent) => {
      moveEvent.preventDefault();
      const currentX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;
      
      dragDistance = Math.abs(diffX);

      // Only trigger horizontal swipe if movement is more horizontal than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && dragDistance > 30) {
        hasDragged = true;
        
        // Add visual feedback during swipe
        const feedItem = moveEvent.target.closest('.feed-item');
        if (feedItem) {
          const transform = Math.min(dragDistance / 5, 20);
          feedItem.style.transform = diffX > 0 ? 
            `translateX(-${transform}px)` : 
            `translateX(${transform}px)`;
        }

        // Trigger image change when swipe distance is significant
        if (dragDistance > 80) {
          if (diffX > 0) {
            handleNextImage(travelId, moveEvent);
          } else {
            handlePrevImage(travelId, moveEvent);
          }
          handleDragEnd();
        }
      }
    };

    const handleDragEnd = () => {
      // Reset transform
      const feedItem = document.querySelector(`[data-travel-id="${travelId}"]`);
      if (feedItem) {
        feedItem.style.transform = '';
      }

      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchend', handleDragEnd);
    };

    const handleClick = (clickEvent) => {
      if (hasDragged) {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      }
    };

    document.addEventListener('mousemove', handleDragMove, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('click', handleClick, { once: true });
  };

  const handleImageNavigation = (travelId, targetIndex) => {
    const travel = displayedTravels.find(t => t.id === travelId);
    if (!travel) return;

    setCurrentImageIndices(prevState => ({
      ...prevState,
      [travelId]: targetIndex
    }));
  };

  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && isMobile && displayedTravels.length === sortedTravels.length) {
      return;
    }
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (isMobile && displayedTravels.length === sortedTravels.length) {
      e.preventDefault();
      return;
    }
    if (!isPulling) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 0) {
      setPullDistance(Math.min(distance, 150));
    }
  };

  const handleTouchEnd = () => {
    if (isMobile && displayedTravels.length === sortedTravels.length) {
      setPullDistance(0);
      setIsPulling(false);
      return;
    }
    if (pullDistance > 100) {
      handleRefreshFeed();
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  };

  const toggleComments = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (showComments === travelId) {
      setShowComments(null);
    } else {
      setShowComments(travelId);
    }
  };

  const handleCloseComments = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(null);
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const toggleDescription = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDescriptions((prev) => ({
      ...prev,
      [travelId]: !prev[travelId],
    }));
  };

  const toggleDropdown = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(prev => (prev === travelId ? null : travelId));
  };

  const handleReasonChange = (reason) => {
    setReportReasons((prev) => ({ ...prev, [reason]: !prev[reason] }));
  };

  const handleReportTravel = (travel, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Faça login para denunciar viagens.');
      return;
    }
    setSelectedTravel(travel);
    setShowReportModal(true);
    setShowDropdown(null);
  };

  const confirmReportTravel = () => {
    if (selectedTravel) {
      const hasSelectedReason = Object.values(reportReasons).some((v) => v) ||
        (reportReasons.other && otherReason.trim());
      if (!hasSelectedReason) {
        alert('Por favor, selecione pelo menos um motivo para a denúncia.');
        return;
      }
      console.log('Travel reported:', selectedTravel.id, 'Reasons:', reportReasons, 'Other:', otherReason);
      setShowReportModal(false);
      setSelectedTravel(null);
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
    }
  };

  const renderReportModal = () => (
    <AnimatePresence>
      {showReportModal && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowReportModal(false)}
        >
          <motion.div
            className="modal-content-users"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <h2>Denunciar Viagem</h2>
            <p>
              Por que deseja denunciar a viagem <strong>{selectedTravel?.name}</strong>?
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
                onClick={confirmReportTravel}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderTravelItem = (travel) => {
    const currentIndex = currentImageIndices[travel.id] || 0;
    const images = travel.images_generalInformation || [];
    const totalImages = images.length;
    const maxDescriptionLength = 400; // Limite de caracteres para a descrição
    const backgroundImage = images[currentIndex] || 'https://via.placeholder.com/300';
    const isDescriptionExpanded = expandedDescriptions[travel.id] || false;

    // Função para truncar a descrição
    const truncateDescription = (text) => {
      if (!text) return 'Descrição não disponível.';
      if (text.length <= maxDescriptionLength) return text;
      return text.substring(0, maxDescriptionLength) + '...';
    };

    // Layout especial para grelha desktop
    const isGridDesktop = viewMode === 'grid' && !isMobile;

    if (isGridDesktop) {
      return (
        <div key={travel.id} className="feed-item feed-item-grid">
          <Link to={`/travel/${travel.id}`} className="feed-link" style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
            <div className="dropdown-container" style={{ position: 'relative' }}>
              {!(user && travel.user && user.username === travel.user) && (
                <button
                  className="dropdown-toggle"
                  onClick={(e) => toggleDropdown(travel.id, e)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    transition: 'background-color 0.2s',
                    zIndex: 2,
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  <FaEllipsisV color="#666" />
                </button>
              )}
              {showDropdown === travel.id && (
                <div
                  className="dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: '10px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 5000,
                    minWidth: '180px',
                  }}
                >
                  <button
                    className="dropdown-item"
                    onClick={(e) => handleReportTravel(travel, e)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#e74c3c',
                      fontSize: '14px',
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                  >
                    <FaFlag /> Denunciar Viagem
                  </button>
                </div>
              )}
            </div>
            <div className="feed-user feed-user-grid" onClick={(e) => e.preventDefault()}>
              <Link to={`/profile/${travel.user}`} onClick={(e) => e.stopPropagation()}>
                <img
                  src={travel.userProfilePicture || defaultAvatar}
                  alt={`${travel.user}'s avatar`}
                  className="feed-avatar"
                />
              </Link>
              <Link to={`/profile/${travel.user}`} onClick={(e) => e.stopPropagation()}>
                {travel.user}
              </Link>
              <span className="travel-date">Publicado em: {travel.createdAt || 'Data não disponível'}</span>
            </div>
            <div className="travel-info-grid">
              <h1>{travel.name}</h1>
              <div className="travel-details-infoadditional">
                <p><strong>🌍</strong> {travel.country} <strong>🏙️</strong> {travel.city}</p>
                <p><strong>🏷️</strong> {travel.category.join(', ')}</p>
                <p><strong>📅</strong> {travel.startDate} <strong>📅</strong> {travel.endDate}</p>
                <p><strong>💰</strong> {travel.price}€</p>
                <p><strong></strong> {renderStars(travel.stars)}</p>
              </div>
              <p className="travel-description">{isDescriptionExpanded ? travel.description : truncateDescription(travel.description)}</p>
            </div>
            <div className="travel-gallery-grid" style={{ position: 'relative' }}>
              {totalImages > 1 && (
                <button
                  className="gallery-arrow left"
                  onClick={e => handlePrevImage(travel.id, e)}
                  style={{ position: 'absolute', left: 10, top: '55%', transform: 'translateY(-50%)', zIndex: 2 }}
                  aria-label="Imagem anterior"
                >
                  <FaChevronLeft size={45} color="#111" />
                </button>
              )}
              <img
                src={backgroundImage}
                alt={`${travel.name} - Imagem ${currentIndex + 1}`}
                className="feed-image"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
              />
              {totalImages > 1 && (
                <button
                  className="gallery-arrow right"
                  onClick={e => handleNextImage(travel.id, e)}
                  style={{ position: 'absolute', right: 10, top: '55%', transform: 'translateY(-50%)', zIndex: 2 }}
                  aria-label="Próxima imagem"
                >
                  <FaChevronRight size={45} color="#111" />
                </button>
              )}
              <div className="feed-actions-grid">
                <button
                  className={`like-btn  ${likedTravels.includes(travel.id) ? 'liked' : ''}`}
                  onClick={(e) => handleLike(travel.id, e)}
                >
                  <FaHeart /> {travel.likes}
                </button>
                <button className="comments-btn" onClick={(e) => toggleComments(travel.id, e)}>
                  <FaComment /> {travel.comments.length}
                </button>
              </div>
            </div>
          </Link>
          {showComments === travel.id && (
            <div className={`comments-section-modern`} onClick={(e) => e.stopPropagation()}>
              <div className="comments-header-modern">
                <h4>💬 Comentários ({travel.comments.length})</h4>
                <motion.button
                  className="close-comments-btn"
                  onClick={handleCloseComments}
                  aria-label="Fechar comentários"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaTimes />
                </motion.button>
              </div>
              
              <div className="comments-container-modern">
                {travel.comments.length > 0 ? (
                  <div className="comments-list-modern">
                    <AnimatePresence>
                      {travel.comments.map((comment, commentIndex) => 
                        renderComment(comment, travel.id, [], commentIndex)
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div 
                    className="no-comments"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span>💭 Ainda não há comentários. Seja o primeiro a comentar!</span>
                  </motion.div>
                )}
                
                {user && (
                  <motion.div 
                    className="add-comment-modern"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <img 
                      src={user.profilePicture || defaultAvatar} 
                      alt="Seu avatar" 
                      className="comment-user-avatar" 
                    />
                    <div className="comment-input-container">
                      <textarea
                        value={newComment[travel.id] || ''}
                        onChange={(e) => {
                          if (e.target.value.length <= 250) {
                            setNewComment({ ...newComment, [travel.id]: e.target.value });
                          }
                        }}
                        onClick={stopPropagation}
                        onMouseDown={stopPropagation}
                        onFocus={stopPropagation}
                        placeholder="Escreva um comentário..."
                        className="comment-input-modern"
                        rows="2"
                        maxLength={250}
                      />
                      <AnimatePresence>
                        {newComment[travel.id]?.trim() && (
                          <motion.button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddComment(travel.id, [], newComment[travel.id]);
                            }}
                            className="send-comment-btn"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={commentLoading}
                          >
                            <FaPaperPlane />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {commentSuccess && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="comment-success"
                  style={{ color: '#28a745', textAlign: 'center', marginTop: '10px' }}
                >
                  {commentSuccess}
                </motion.p>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={travel.id} className={`feed-item ${isMobile ? 'feed-item-mobile' : viewMode === 'grid' ? 'feed-item-grid' : ''}`} data-travel-id={travel.id}>
        <div className="feed-user" onClick={(e) => e.preventDefault()}>
          <Link to={`/profile/${travel.user}`} onClick={(e) => e.stopPropagation()}>
            <img
              src={travel.userProfilePicture || defaultAvatar}
              alt={`${travel.user}'s avatar`}
              className="feed-avatar"
            />
          </Link>
          <Link to={`/profile/${travel.user}`} onClick={(e) => e.stopPropagation()}>
            {travel.user}
          </Link>
          <span className="travel-date">Publicado em: {travel.createdAt || 'Data não disponível'}</span>
          <div className="dropdown-container" style={{ position: 'relative', marginLeft: 'auto' }}>
            {user && travel.user && user.username !== travel.user && (
              <button
                className="dropdown-toggle"
                onClick={(e) => toggleDropdown(travel.id, e)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                <FaEllipsisV color="#666" />
              </button>
            )}
            {showDropdown === travel.id && (
              <div
                className="dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '36px',
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  zIndex: 5000,
                  minWidth: '180px',
                }}
              >
                <button
                  className="dropdown-item"
                  onClick={(e) => handleReportTravel(travel, e)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#e74c3c',
                    fontSize: '14px',
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  <FaFlag /> Denunciar Viagem
                </button>
              </div>
            )}
          </div>
        </div>
        <Link to={`/travel/${travel.id}`} className="feed-link">
          <div
            className="feed-content"
            style={isMobile ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            onError={(e) => { e.target.style.backgroundImage = `url(https://via.placeholder.com/300)`; }}
            onTouchStart={isMobile ? (e) => handleDragStart(travel.id, e) : undefined}
            onMouseDown={isMobile ? (e) => handleDragStart(travel.id, e) : undefined}
          >
            <div className="dropdown-container" style={{ position: 'relative' }}>
              {!(user && travel.user && user.username === travel.user) && (
                <button
                  className="dropdown-toggle"
                  onClick={(e) => toggleDropdown(travel.id, e)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    transition: 'background-color 0.2s',
                    zIndex: 2,
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  <FaEllipsisV color="#666" />
                </button>
              )}
              {showDropdown === travel.id && (
                <div
                  className="dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: '10px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 5000,
                    minWidth: '180px',
                  }}
                >
                  <button
                    className="dropdown-item"
                    onClick={(e) => handleReportTravel(travel, e)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#e74c3c',
                      fontSize: '14px',
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                  >
                    <FaFlag /> Denunciar Viagem
                  </button>
                </div>
              )}
            </div>
            <div className="travel-gallery" style={{ position: 'relative', display: isMobile ? 'none' : 'flex' }}>
              {!isMobile && totalImages > 1 && (
                <button
                  className="gallery-arrow left"
                  onClick={e => handlePrevImage(travel.id, e)}
                  style={{ position: 'absolute', left: 10, top: '55%', transform: 'translateY(-50%)', zIndex: 2 }}
                  aria-label="Imagem anterior"
                >
                  <FaChevronLeft size={45} color="#111" />
                </button>
              )}
              {!isMobile && (
                <img
                  src={backgroundImage}
                  alt={`${travel.name} - Imagem ${currentIndex + 1}`}
                  className="feed-image"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
                  onTouchStart={e => handleDragStart(travel.id, e)}
                  onMouseDown={e => handleDragStart(travel.id, e)}
                />
              )}
              {!isMobile && totalImages > 1 && (
                <button
                  className="gallery-arrow right"
                  onClick={e => handleNextImage(travel.id, e)}
                  style={{ position: 'absolute', right: 10, top: '55%', transform: 'translateY(-50%)', zIndex: 2 }}
                  aria-label="Próxima imagem"
                >
                  <FaChevronRight size={45} color="#111" />
                </button>
              )}
              {!isMobile && (
                <div className="feed-actions-grid">
                  <button
                    className={`like-btn ${likedTravels.includes(travel.id) ? 'liked' : ''}`}
                    onClick={(e) => handleLike(travel.id, e)}
                  >
                    <FaHeart /> {travel.likes}
                  </button>
                  <button className="comments-btn" onClick={(e) => toggleComments(travel.id, e)}>
                    <FaComment /> {travel.comments.length}
                  </button>
                  {/* Removido o botão de partilhar */}
                </div>
              )}
            </div>

            {/* Image indicators for mobile */}
            {isMobile && totalImages > 1 && (
              <div className="image-indicators">
                {Array.from({ length: totalImages }).map((_, index) => (
                  <span
                    key={index}
                    className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleImageNavigation(travel.id, index);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Mobile action buttons */}
            {isMobile && (
              <div className="feed-actions-mobile">
                <button
                  className={`like-btn ${likedTravels.includes(travel.id) ? 'liked' : ''}`}
                  onClick={(e) => handleLike(travel.id, e)}
                >
                  <FaHeart />
                  <span>{travel.likes}</span>
                </button>
                <button className="comments-btn" onClick={(e) => toggleComments(travel.id, e)}>
                  <FaComment />
                  <span>{travel.comments.length}</span>
                </button>
              </div>
            )}
         
            <div className={isMobile ? 'travel-info-mobile' : 'travel-info-feed'}>
              <h1>{travel.name}</h1>
              <div className="travel-details-infoadditional">
                <p>
                  <strong>🌍</strong> {travel.country} <strong>🏙️</strong> {travel.city}
                </p>
                <p>
                  <strong>🏷️</strong> {travel.category.join(', ')}
                </p>
                <p>
                  <strong>📅</strong> {travel.startDate}{' '}
                  <strong>📅</strong> {travel.endDate}
                </p>
                <p>
                  <strong>💰</strong> {travel.price}€
                </p>
                <p>
                  <strong></strong> {renderStars(travel.stars)}
                </p>
                {/* Botão para expandir descrição */}
                {isMobile && (
                  <button
                    className="expand-description-btn"
                    style={{ margin: '8px auto', display: 'block', background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}
                    onClick={() => setIsDescriptionExpanded(prev => !prev)}
                  >
                    ...
                  </button>
                )}
              </div>
              {/* Só mostra descrição se expandido */}
              {isMobile && isDescriptionExpanded && (
                <p className="travel-description expanded">
                  {travel.description}
                </p>
              )}
              {/* Desktop: mostra descrição normal */}
              {!isMobile && (
                <p className="travel-description">
                  {truncateDescription(travel.description)}
                  <span style={{ display: 'block', marginTop: 8 }}>
                    <Link
                      to={`/travel/${travel.id}`}
                      className="feed-details-link"
                      style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 500, fontSize: '0.98rem' }}
                      onClick={e => e.stopPropagation()}
                    >
                      Ver mais detalhes
                    </Link>
                  </span>
                </p>
              )}
            </div>
            {isMobile && (
              <div className="feed-actions-mobile">
                <button
                  className={`like-btn ${likedTravels.includes(travel.id) ? 'liked' : ''}`}
                  onClick={(e) => handleLike(travel.id, e)}
                >
                  <FaHeart /> <span>{travel.likes}</span>
                </button>
                <button className="comments-btn" onClick={(e) => toggleComments(travel.id, e)}>
                  <FaComment /> <span>{travel.comments.length}</span>
                </button>
                {/* Removido o botão de partilhar */}
              </div>
            )}
          </div>
        </Link>
        {showComments === travel.id && isMobile && (
          <>
            <div
              className="comments-overlay"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.25)',
                zIndex: 1000
              }}
              onClick={handleCloseComments}
            />
            <div
              className="comments-section-modern comments-section-mobile"
              style={{
                position: 'fixed',
                left: '50%',
                top: '35%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1001,
                maxWidth: '100vw',
                width: '100vw',
                maxHeight: '95vh',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="comments-header-modern" style={{ padding: '20px' }}>
                <h4>💬 Comentários ({travel.comments.length})</h4>
                <motion.button
                  className="close-comments-btn"
                  onClick={handleCloseComments}
                  aria-label="Fechar comentários"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '5px'
                  }}
                >
                  <FaTimes />
                </motion.button>
              </div>
              
              <div
                className="comments-container-modern"
                style={{
                  maxHeight: '45vh',
                  overflowY: 'auto',
                  paddingRight: '8px',
                  padding: '0 20px'
                }}
              >
                {travel.comments.length > 0 ? (
                  <div className="comments-list-modern">
                    <AnimatePresence>
                      {travel.comments.map((comment, commentIndex) => 
                        renderComment(comment, travel.id, [], commentIndex)
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div 
                    className="no-comments"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ textAlign: 'center', padding: '20px' }}
                  >
                    <span>💭 Ainda não há comentários. Seja o primeiro a comentar!</span>
                  </motion.div>
                )}
              </div>
              
              {user && (
                <motion.div 
                  className="add-comment-modern"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ padding: '20px', borderTop: '1px solid #eee' }}
                >
                  <img 
                    src={user.profilePicture || defaultAvatar} 
                    alt="Seu avatar" 
                    className="comment-user-avatar" 
                  />
                  <div className="comment-input-container">
                    <textarea
                      value={newComment[travel.id] || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= 250) {
                          setNewComment({ ...newComment, [travel.id]: e.target.value });
                        }
                      }}
                      onClick={stopPropagation}
                      onMouseDown={stopPropagation}
                      onFocus={stopPropagation}
                      placeholder="Escreva um comentário..."
                      className="comment-input-modern"
                      rows="2"
                      maxLength={250}
                    />
                    <AnimatePresence>
                      {newComment[travel.id]?.trim() && (
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddComment(travel.id, [], newComment[travel.id]);
                          }}
                          className="send-comment-btn"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={commentLoading}
                        >
                          <FaPaperPlane />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
              
              {commentSuccess && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="comment-success"
                  style={{ color: '#28a745', textAlign: 'center', marginTop: '10px', padding: '0 20px' }}
                >
                  {commentSuccess}
                </motion.p>
              )}
            </div>
          </>
        )}
        {showComments === travel.id && !isMobile && (
          <motion.div 
            className="comments-section-modern"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="comments-header-modern">
              <h4>💬 Comentários ({travel.comments.length})</h4>
              <motion.button
                className="close-comments-btn"
                onClick={handleCloseComments}
                aria-label="Fechar comentários"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes />
              </motion.button>
            </div>
            
            <div className="comments-container-modern">
              {travel.comments.length > 0 ? (
                <div className="comments-list-modern">
                  <AnimatePresence>
                    {travel.comments.map((comment, commentIndex) => 
                      renderComment(comment, travel.id, [], commentIndex)
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div 
                  className="no-comments"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span>💭 Ainda não há comentários. Seja o primeiro a comentar!</span>
                </motion.div>
              )}
              
              {user && (
                <motion.div 
                  className="add-comment-modern"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <img 
                    src={user.profilePicture || defaultAvatar} 
                    alt="Seu avatar" 
                    className="comment-user-avatar" 
                  />
                  <div className="comment-input-container">
                    <textarea
                      value={newComment[travel.id] || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= 250) {
                          setNewComment({ ...newComment, [travel.id]: e.target.value });
                        }
                      }}
                      onClick={stopPropagation}
                      onMouseDown={stopPropagation}
                      onFocus={stopPropagation}
                      placeholder="Escreva um comentário..."
                      className="comment-input-modern"
                      rows="2"
                      maxLength={250}
                    />
                    <AnimatePresence>
                      {newComment[travel.id]?.trim() && (
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddComment(travel.id, [], newComment[travel.id]);
                          }}
                          className="send-comment-btn"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={commentLoading}
                        >
                          <FaPaperPlane />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
              
              {commentSuccess && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="comment-success"
                >
                  {commentSuccess}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      {isFeedRefreshed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="feed-refreshed-message"
        >
          O feed foi atualizado com sucesso!
        </motion.div>
      )}
      {renderReportModal()}
      </div>
    );
  };

  const filteredTravels = feedTravels
    .filter((travel) => travel.country === filterCountry || filterCountry === '')
    .filter((travel) =>
      travel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      travel.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      travel.country?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sortedTravels = [...filteredTravels].sort((a, b) => {
    if (sortOption === 'likes') {
      return b.likes - a.likes;
    }
    return new Date(b.startDate) - new Date(a.startDate);
  });

  const featuredTravels = [...feedTravels]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 2);

  const displayedTravels = isMobile ? sortedTravels : sortedTravels.slice(0, currentPage * travelsPerPage);
  const hasMoreTravels = !isMobile && !isFeedRefreshed && displayedTravels.length < sortedTravels.length;

  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  return (
    <div className="home-page">
     
      <header className="home-header">
        <h1>Bem-vindo ao Globe Memories</h1>
        {user ? (
          <p>Olá, {user.username}! Veja as viagens dos seus amigos e as viagens públicas.</p>
        ) : (
          <p>Explore as viagens públicas ou faça login para um feed personalizado!</p>
        )}
        {user && (
          <Link to="/notifications" className="notifications-icon">
            <FaBell />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </Link>
        )}
      </header>

      {!isMobile && (
        <div className="feed-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Pesquisar por Nome, País ou Cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <FaSearch className="search-icon" />
          </div>
          <div className="feed-controls-right">
            <div className="sort-container">
              <label htmlFor="sortOption">Ordenar por: </label>
              <select
                id="sortOption"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="sort-filter"
              >
                <option value="date">Data (Mais Recente)</option>
                <option value="likes">Popularidade (Likes)</option>
              </select>
            </div>
            <button onClick={handleRefreshFeed} className="refresh-button">
              <FaSync /> Atualizar Feed
            </button>
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn${viewMode === 'list' ? ' active' : ''}`}
                title="Ver em Lista"
                onClick={() => setViewMode('list')}
              >
                <FaList size={20} />
              </button>
              <button
                className={`view-mode-btn${viewMode === 'grid' ? ' active' : ''}`}
                title="Ver em Grelha"
                onClick={() => setViewMode('grid')}
              >
                <FaTh size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {featuredTravels.length > 0 && (
        <div className="featured-travels">
          <h2>Viagens em Destaque</h2>
          <div className="featured-list">
            {featuredTravels.map((travel) => (
              <div key={travel.id} className="featured-item">
                <img
                  src={travel.highlightImage || 'https://via.placeholder.com/300'}
                  alt={travel.name}
                  className="featured-image"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
                />
                <div className="featured-info">
                  <h3>{travel.name}</h3>
                  <p>Por: <Link to={`/profile/${travel.user}`}>{travel.user}</Link></p>
                  <p><strong>Categoria:</strong> {travel.category.join(', ')}</p>
                  <p><strong>País:</strong> {travel.country} | <strong>Cidade:</strong> {travel.city}</p>
                  <p><strong>Data:</strong> {travel.startDate} a {travel.endDate}</p>
                  <p><strong>Preço:</strong> {travel.price}€ | <strong>Avaliação:</strong> {travel.stars}★</p>
                  <Link to={`/travel/${travel.id}`} className="featured-details-link">
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="feed-container"
        ref={feedContainerRef}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
  
        {loading ? (
          <div className="loading-spinner"></div>
        ) : error ? (
          <p>{error}</p>
        ) : displayedTravels.length > 0 ? (
          <div className={isMobile ? 'feed-snap' : viewMode === 'grid' ? 'feed-grid' : 'feed-list'}>
            {displayedTravels.map(renderTravelItem)}
          </div>
        ) : (
          <p>
            Nenhuma viagem disponível.{' '}
            {user ? (
              <>Siga mais pessoas ou explore mais conteúdo!</>
            ) : (
              <>As viagens públicas aparecerão aqui.</>
            )}
          </p>
        )}
        {hasMoreTravels && (
          <button onClick={handleLoadMore} className="load-more-button">
            Carregar Mais <FaChevronDown />
          </button>
        )}
      </div>

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div
            className="modal-content-users"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <h2>Denunciar Viagem</h2>
            <p>
              Por que deseja denunciar a viagem <strong>{selectedTravel?.name}</strong>?
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
                onClick={confirmReportTravel}
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
    </div>
  );
};

export default Home;