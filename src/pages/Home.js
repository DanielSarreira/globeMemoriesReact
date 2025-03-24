import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import { FaHeart, FaComment, FaSync, FaShareAlt, FaChevronDown, FaSearch, FaChevronLeft, FaChevronRight, FaPause, FaPlay } from 'react-icons/fa';
import { FaStar } from 'react-icons/fa';
import TravelsData from '../data/travelsData';
import '../styles/styles.css';

const Home = () => {
  const { user } = useAuth();
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

  // Estado para controlar o índice da imagem atual e o estado de pausa
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [isPaused, setIsPaused] = useState({});

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


   const renderStars = (stars) => (
      [...Array(5)].map((_, index) => (
        <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
      ))
    );

  // Transição automática a cada 8 segundos, com controle de pausa
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

    return () => intervals.forEach(interval => interval && clearInterval(interval));
  }, [feedTravels, isPaused]);

  const togglePause = (travelId) => {
    setIsPaused((prev) => ({
      ...prev,
      [travelId]: !prev[travelId],
    }));
  };

  const handleLike = (travelId) => {
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
    setTimeout(() => {
      setFeedTravels(TravelsData);
      setCurrentPage(1);
      setLoading(false);
    }, 1000);
  };

  const handleAddComment = (travelId) => {
    if (!user) {
      alert('Faça login para comentar!');
      return;
    }
    if (!newComment.trim()) {
      alert('Escreva um comentário antes de enviar!');
      return;
    }

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
            },
          ],
        };
      }
      return travel;
    });

    setFeedTravels(updatedTravels);
    setNewComment('');
  };

  const handleShare = (travelId) => {
    const travelUrl = `http://localhost:3000/travel/${travelId}`;
    navigator.clipboard.writeText(travelUrl).then(() => {
      alert('Link da viagem copiado!');
    });
  };

  const handleLoadMore = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handleNextImage = (travelId) => {
    setCurrentImageIndices((prev) => ({
      ...prev,
      [travelId]: (prev[travelId] + 1) % (feedTravels.find(t => t.id === travelId)?.images_generalInformation?.length || 1),
    }));
  };

  const handlePrevImage = (travelId) => {
    setCurrentImageIndices((prev) => ({
      ...prev,
      [travelId]: (prev[travelId] - 1 + (feedTravels.find(t => t.id === travelId)?.images_generalInformation?.length || 1)) % (feedTravels.find(t => t.id === travelId)?.images_generalInformation?.length || 1),
    }));
  };

  const handleDragStart = (travelId, e) => {
    const startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const dragRef = { startX, travelId };

    const handleDragMove = (moveEvent) => {
      const currentX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const diffX = startX - currentX;

      if (diffX > 50) {
        handleNextImage(travelId);
      } else if (diffX < -50) {
        handlePrevImage(travelId);
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

  const renderTravelItem = (travel) => {
    const currentIndex = currentImageIndices[travel.id] || 0;
    const images = travel.images_generalInformation || [];
    const totalImages = images.length;

    return (
      <div key={travel.id} className="feed-item fade-in">
        <div className="feed-user">
          <img
            src={travel.userProfilePicture || defaultAvatar}
            alt={`${travel.user}'s avatar`}
            className="feed-avatar"
          />
          <Link to={`/profile/${travel.user}`}>{travel.user}</Link>
          <span className="travel-date">Publicado em: {travel.createdAt || 'Data não disponível'}</span>
        </div>
        <div className="feed-content">
          <div className="travel-info-feed">
            <h1>{travel.name}</h1>
            <p className="travel-description">{travel.description || 'Descrição não disponível.'}</p>
            <br></br>
            <p><strong>🌍 País:</strong> {travel.country} <strong>🏙️ Cidade:</strong> {travel.city}</p>
            <p><strong>🏷️ Categoria:</strong> {travel.category.join(', ')}</p>
            <p><strong>📅 Data de Início:</strong> {travel.startDate}  <strong>📅 Data de Fim:</strong> {travel.endDate}</p>
            <p><strong>💰 Preço Total Da Viagem:</strong> {travel.price}€ </p> 
            <p><strong>Avaliação Geral:</strong> {renderStars(travel.stars)}</p>
            <br></br>
            <Link to={`/travel/${travel.id}`} className="feed-details-link">
              Ver mais detalhes
            </Link>
            <div className="feed-actions">
              <button
                className={`like-button ${likedTravels.includes(travel.id) ? 'liked' : ''}`}
                onClick={() => handleLike(travel.id)}
              >
                <FaHeart /> {travel.likes}
              </button>
              <button className="comment-button" onClick={() => setShowComments(travel.id)}>
                <FaComment /> {travel.comments.length}
              </button>
              <button className="share-button" onClick={() => handleShare(travel.id)}>
                <FaShareAlt /> Compartilhar
              </button>
            </div>
            {/* Pré-visualização de comentários */}
            {travel.comments.length > 0 && (
              <div className="comments-preview">
                {travel.comments.slice(0, 2).map((comment) => (
                  <p key={comment.id} className="comment-preview">
                    <strong>{comment.user}:</strong> {comment.text}
                  </p>
                ))}
                {travel.comments.length > 2 && (
                  <button className="view-more-comments" onClick={() => setShowComments(travel.id)}>
                    Ver mais comentários ({travel.comments.length - 2})
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="travel-gallery">
            <div className="gallery-container">
              <button className="gallery-arrow left" onClick={() => handlePrevImage(travel.id)}>
                <FaChevronLeft />
              </button>
              <img
                src={images[currentIndex] || 'https://via.placeholder.com/300'}
                alt={`${travel.name} - Imagem ${currentIndex + 1}`}
                className="feed-image"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
              />
              <button className="gallery-arrow right" onClick={() => handleNextImage(travel.id)}>
                <FaChevronRight />
              </button>
              <div className="gallery-controls">
                <button className="pause-play-button" onClick={() => togglePause(travel.id)}>
                  {isPaused[travel.id] ? <FaPlay /> : <FaPause />}
                </button>
                <span className="image-counter">{`${currentIndex + 1}/${totalImages}`}</span>
              </div>
            </div>
          </div>
        </div>
        {showComments === travel.id && (
          <div className="comments-section">
            <h4>Comentários</h4>
            {travel.comments.length > 0 ? (
              <ul>
                {travel.comments.map((comment) => (
                  <li key={comment.id}>
                    <strong>{comment.user}:</strong> {comment.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum comentário ainda.</p>
            )}
            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva seu comentário..."
                className="comment-input"
              />
              <button onClick={() => handleAddComment(travel.id)} className="submit-comment-button">
                Enviar
              </button>
            </div>
            <button onClick={() => setShowComments(null)} className="close-comments-button">
              Fechar
            </button>
          </div>
        )}
      </div>
    );
  };

  const filteredTravels = feedTravels
    .filter((travel) =>
      travel.country === filterCountry || filterCountry === ''
    )
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

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Bem-vindo ao Globe Memories</h1>
        {user ? (
          <p>Olá, {user.username}! Veja as viagens dos seus amigos e as viagens públicas.</p>
        ) : (
          <p>Explore as viagens públicas ou faça login para um feed personalizado!</p>
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
        <button onClick={handleRefreshFeed} className="refresh-button">
          <FaSync /> Atualizar Feed
        </button>
      </div>

      <div className="feed-container">
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