import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import { FaHeart, FaComment, FaSync, FaShareAlt, FaChevronDown, FaSearch, FaChevronLeft, FaChevronRight, FaPause, FaPlay, FaBell } from 'react-icons/fa';
import { FaStar } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import TravelsData from '../data/travelsData';
import '../styles/styles.css';

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
  const [newComment, setNewComment] = useState('');
  const [likedTravels, setLikedTravels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const travelsPerPage = 5;

  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [isPaused, setIsPaused] = useState({});

  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const feedContainerRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(null);
  const [likedComments, setLikedComments] = useState(new Set());

  // Estado para notificações
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);

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

        const initialPaused = combinedTravels.reduce((acc, travel) => {
          acc[travel.id] = false;
          return acc;
        }, {});
        setIsPaused(initialPaused);

        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar o feed. Tente novamente mais tarde.');
        setLoading(false);
        console.error('Erro ao buscar feed:', err);
      }
    }, 1000);
  }, [user]);

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
      if (isPaused[travel.id]) return null;
      return setInterval(() => {
        setCurrentImageIndices((prev) => ({
          ...prev,
          [travel.id]: (prev[travel.id] + 1) % (travel.images_generalInformation?.length || 1),
        }));
      }, 8000);
    });

    return () => intervals.forEach((interval) => interval && clearInterval(interval));
  }, [feedTravels, isPaused]);

  const togglePause = (travelId) => {
    setIsPaused((prev) => ({
      ...prev,
      [travelId]: !prev[travelId],
    }));
  };

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
    setTimeout(() => {
      setFeedTravels(TravelsData);
      setCurrentPage(1);
      setLoading(false);
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }, 1000);
  };

  const handleAddComment = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Faça login para comentar!');
      return;
    }
    if (!newComment.trim()) {
      alert('Escreva um comentário antes de enviar!');
      return;
    }

    setCommentLoading(true);
    setCommentSuccess(null);

    setTimeout(() => {
      const updatedTravels = feedTravels.map((travel) => {
        if (travel.id === travelId) {
          return {
            ...travel,
            comments: [
              ...travel.comments,
              {
                id: travel.comments.length + 1,
                user: user.username,
                text: newComment,
                date: new Date().toLocaleString('pt-PT'),
              },
            ],
          };
        }
        return travel;
      });

      setFeedTravels(updatedTravels);
      setNewComment('');
      setCommentLoading(false);
      setCommentSuccess('Comentário publicado!');
    }, 1000);
  };

  const handleCommentLike = (travelId, commentId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Faça login para curtir comentários!');
      return;
    }

    const commentKey = `${travelId}-${commentId}`;
    setLikedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentKey)) {
        newSet.delete(commentKey);
      } else {
        newSet.add(commentKey);
      }
      return newSet;
    });
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
    const startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const dragRef = { startX, travelId };

    const handleDragMove = (moveEvent) => {
      const currentX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const diffX = startX - currentX;

      if (diffX > 50) {
        handleNextImage(travelId, moveEvent);
      } else if (diffX < -50) {
        handlePrevImage(travelId, moveEvent);
      }
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchend', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
  };

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 0) {
      setPullDistance(Math.min(distance, 150));
    }
  };

  const handleTouchEnd = () => {
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

  const renderTravelItem = (travel) => {
    const currentIndex = currentImageIndices[travel.id] || 0;
    const images = travel.images_generalInformation || [];
    const totalImages = images.length;
    const maxCommentLength = 250;

    return (
      <div key={travel.id} className="feed-item fade-in">
        <Link to={`/travel/${travel.id}`} className="feed-link">
          <div className="feed-user" onClick={(e) => e.preventDefault()}>
            <Link to={`/profile/${travel.user}`} onClick={(e) => e.stopPropagation()}>
              <img
                src={travel.userProfilePicture || defaultAvatar}
                alt={`${travel.user}'s avatar`}
                className="feed-avatar"
              />
            </Link>
            <Link to={`/profile/${travel.user}`} onClick={(e) => e.stopPropagation()}>{travel.user}</Link>
            <span className="travel-date">Publicado em: {travel.createdAt || 'Data não disponível'}</span>
          </div>
          <div className="feed-content">
            <div className="travel-info-feed">
              <h1>{travel.name}</h1>
              <p className="travel-description">{travel.description || 'Descrição não disponível.'}</p>
              <br />
              <p><strong>🌍 País:</strong> {travel.country} <strong>🏙️ Cidade:</strong> {travel.city}</p>
              <p><strong>🏷️ Categoria:</strong> {travel.category.join(', ')}</p>
              <p><strong>📅 Data de Início:</strong> {travel.startDate} <strong>📅 Data de Fim:</strong> {travel.endDate}</p>
              <p><strong>💰 Preço Total Da Viagem:</strong> {travel.price}€ </p>
              <p><strong>Avaliação Geral:</strong> {renderStars(travel.stars)}</p>
              <br />
              <Link to={`/travel/${travel.id}`} className="feed-details-link" onClick={(e) => e.stopPropagation()}>
                Ver mais detalhes
              </Link>
              <div className="feed-actions">
                <button
                  className={`like-button ${likedTravels.includes(travel.id) ? 'liked' : ''}`}
                  onClick={(e) => handleLike(travel.id, e)}
                >
                  <FaHeart /> {travel.likes}
                </button>
                <button className="comment-button" onClick={(e) => toggleComments(travel.id, e)}>
                  <FaComment /> {travel.comments.length}
                </button>
                <button className="share-button" onClick={(e) => handleShare(travel.id, e)}>
                  <FaShareAlt /> Compartilhar
                </button>
              </div>
              {travel.comments.length > 0 && (
                <div className="comments-preview">
                  {travel.comments.slice(0, 2).map((comment) => (
                    <p key={comment.id} className="comment-preview">
                      <strong>{comment.user}</strong> {comment.text}
                    </p>
                  ))}
                  {travel.comments.length > 2 && (
                    <button className="view-more-comments" onClick={(e) => toggleComments(travel.id, e)}>
                      Ver todos os {travel.comments.length} comentários
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="travel-gallery">
              <div className="gallery-container">
                <button className="gallery-arrow left" onClick={(e) => handlePrevImage(travel.id, e)}>
                  <FaChevronLeft />
                </button>
                <img
                  src={images[currentIndex] || 'https://via.placeholder.com/300'}
                  alt={`${travel.name} - Imagem ${currentIndex + 1}`}
                  className="feed-image"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
                />
                <button className="gallery-arrow right" onClick={(e) => handleNextImage(travel.id, e)}>
                  <FaChevronRight />
                </button>
                <div className="gallery-controls">
                  <button className="pause-play-button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePause(travel.id); }}>
                    {isPaused[travel.id] ? <FaPlay /> : <FaPause />}
                  </button>
                  <span className="image-counter">{`${currentIndex + 1}/${totalImages}`}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
        {showComments === travel.id && (
          <div className="comments-section" onClick={(e) => e.stopPropagation()}>
            <div className="comments-list">
              {travel.comments.length > 0 ? (
                <ul>
                  <AnimatePresence>
                    {travel.comments.map((comment) => {
                      const commentKey = `${travel.id}-${comment.id}`;
                      const isLiked = likedComments.has(commentKey);
                      return (
                        <motion.li
                          key={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="comment-item"
                        >
                          <img
                            src={defaultAvatar}
                            alt={`${comment.user}'s avatar`}
                            className="comment-avatar"
                          />
                          <div className="comment-content">
                            <p className="comment-text">
                              <strong>{comment.user}</strong> {comment.text}
                            </p>
                            <div className="comment-meta">
                              <span className="comment-date">Agora</span>
                              {isLiked && (
                                <span className="comment-likes-count">
                                  1 Like
                                </span>
                              )}
                              <button
                                className={`comment-like-button ${isLiked ? 'liked' : ''}`}
                                onClick={(e) => handleCommentLike(travel.id, comment.id, e)}
                              >
                                <FaHeart />
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              ) : (
                <p className="no-comments">Nenhum comentário publicado ainda.</p>
              )}
            </div>
            <button onClick={handleCloseComments} className="close-comments-button">
              Fechar
            </button>
            <div className="add-comment">
              <img
                src={defaultAvatar}
                alt={`${user?.username}'s avatar`}
                className="comment-avatar"
              />
              <textarea
                value={newComment}
                onChange={(e) => {
                  if (e.target.value.length <= maxCommentLength) {
                    setNewComment(e.target.value);
                  }
                }}
                onClick={stopPropagation}
                onMouseDown={stopPropagation}
                onFocus={stopPropagation}
                placeholder="Adicione um comentário..."
                className="comment-input"
                maxLength={maxCommentLength}
              />
              <button
                onClick={(e) => handleAddComment(travel.id, e)}
                className="submit-comment-button"
                disabled={commentLoading || !newComment.trim()}
              >
                {commentLoading ? 'A Publicar...' : 'Publicar'}
              </button>
            </div>
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
        )}
      </div>
    );
  };

  const filteredTravels = feedTravels
    .filter((travel) => travel.country === filterCountry || filterCountry === '')
    .filter((travel) =>
      travel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      travel.city?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const paginatedTravels = sortedTravels.slice(0, currentPage * travelsPerPage);
  const hasMoreTravels = paginatedTravels.length < sortedTravels.length;

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

      <div className="feed-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Pesquisar por nome ou cidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <FaSearch className="search-icon" />
        </div>
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
        {!isMobile && (
          <button onClick={handleRefreshFeed} className="refresh-button">
            <FaSync /> Atualizar Feed
          </button>
        )}
      </div>

      <div
        className="feed-container"
        ref={feedContainerRef}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {isMobile && (
          <div
            className="pull-to-refresh-indicator"
            style={{
              height: `${pullDistance}px`,
              opacity: pullDistance > 0 ? 1 : 0,
            }}
          >
            {isRefreshing ? (
              <div className="loading-spinner"></div>
            ) : pullDistance > 100 ? (
              <p>Solte para atualizar</p>
            ) : (
              <p>Arraste para baixo para atualizar</p>
            )}
          </div>
        )}
        {loading ? (
          <div className="loading-spinner"></div>
        ) : error ? (
          <p>{error}</p>
        ) : paginatedTravels.length > 0 ? (
          <>
            <div className="feed-list">
              {paginatedTravels.map(renderTravelItem)}
            </div>
            {hasMoreTravels && (
              <button onClick={handleLoadMore} className="load-more-button">
                Carregar Mais <FaChevronDown />
              </button>
            )}
          </>
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
      </div>
    </div>
  );
};

export default Home;