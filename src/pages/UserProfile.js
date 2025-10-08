import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import TravelsData from '../data/travelsData';
// ...existing code...
import { FaCheck, FaStar, FaFlag, FaBan, FaEllipsisV, FaEdit, FaUserMinus, FaClock, FaUserPlus, FaChartBar, FaMapMarkerAlt } from 'react-icons/fa';
import { request } from '../axios_helper';
import Toast from '../components/Toast';

// Dados fictícios para perfis de utilizador
const mockProfiles = [
  {
    username: 'tiago',
    name: 'Tiago',
    profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
    bio: 'Amante de viagens e fotografia!',
    country: 'Portugal',
    city: 'Lisboa',
    travelCount: 8,
    followersCount: 120,
    followingCount: 50,
    privacy: 'public',
    followers: ['AnaSilva', 'PedroCosta', 'SofiaRamos'],
    following: ['AnaSilva', 'JoaoPereira'],
  },
  {
    username: 'AnaSilva',
    name: 'Ana',
    profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg',
    bio: 'Exploradora de montanhas.',
    country: 'Brasil',
    city: 'Rio de Janeiro',
    travelCount: 5,
    followersCount: 200,
    followingCount: 30,
    privacy: 'private',
    followers: ['TiagoMiranda', 'MariaOliveira'],
    following: ['PedroCosta'],
  },
  {
    username: 'PedroCosta',
    name: 'Pedro',
    profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg',
    bio: 'Apaixonado por culturas.',
    country: 'Espanha',
    city: 'Madrid',
    travelCount: 12,
    followersCount: 80,
    followingCount: 40,
    privacy: 'public',
    followers: ['TiagoMiranda', 'AnaSilva'],
    following: ['SofiaRamos', 'JoaoPereira'],
  }
];

const UserProfile = () => {
  const { user } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', list: [], type: '' });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [showTravelDropdown, setShowTravelDropdown] = useState(null);
  const [showReportTravelModal, setShowReportTravelModal] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [reportedTravels, setReportedTravels] = useState([]);
  const [reportTravelReasons, setReportTravelReasons] = useState({
    inappropriate: false,
    falseInfo: false,
    abusive: false,
    spam: false,
    violation: false,
    plagiarism: false,
    other: false,
  });
  const [otherTravelReason, setOtherTravelReason] = useState('');
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [reportReasons, setReportReasons] = useState({
    inappropriate: false,
    falseInfo: false,
    abusive: false,
    spam: false,
    identity: false,
    plagiarism: false,
    harassment: false,
    violation: false,
    other: false
  });
  const [otherReason, setOtherReason] = useState('');

  // Toast functions
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 1000);
  };

  const closeToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Dados temporários enquanto o backend não está pronto
        // Tenta obter dados de capa do localStorage (simulação de persistência)
        const coverPhoto = localStorage.getItem(`${username}_coverPhoto`) || '';
        const coverPhotoScale = parseFloat(localStorage.getItem(`${username}_coverPhotoScale`)) || 1;
        const coverPhotoPosition = JSON.parse(localStorage.getItem(`${username}_coverPhotoPosition`) || '{"x":0,"y":0}');
        const tempProfile = {
          username: username,
          name: username,
          profilePicture: defaultAvatar,
          bio: 'Viajante apaixonado',
          country: 'Portugal',
          city: 'Lisboa',
          travelCount: 0,
          followersCount: 0,
          followingCount: 0,
          privacy: 'public',
          followers: [],
          following: [],
          coverPhoto,
          coverPhotoScale,
          coverPhotoPosition
        };

        setProfile(tempProfile);
        setFollowers(tempProfile.followers);
        const userTravels = TravelsData.filter((travel) => travel.user === username);
        setTravels(userTravels);
        if (user) {
          setFollowing(tempProfile.following);
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        showToast('Erro ao carregar perfil do utilizador. Tente novamente.', 'error');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  useEffect(() => {
    const handleClickOutsideTravel = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowTravelDropdown(null);
      }
    };
    if (showTravelDropdown) {
      document.addEventListener('click', handleClickOutsideTravel);
      return () => document.removeEventListener('click', handleClickOutsideTravel);
    }
  }, [showTravelDropdown]);

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  const handleFollow = () => {
    if (!user) {
      showToast('Inicie sessão para seguir utilizadores.', 'error');
      return;
    }
    if (profile.privacy === 'public') {
      setFollowing([...following, profile.username]);
      setFollowers([...followers, user.username]);
      showToast(`Agora segues ${profile.name}!`, 'success');
    } else {
      setPendingRequests([...pendingRequests, profile.username]);
      showToast(`Pedido de seguimento enviado para ${profile.name}!`, 'success');
      setShowRequestModal(true);
      setTimeout(() => {
        setShowRequestModal(false);
      }, 3000);
    }
  };

  const handleUnfollow = () => {
    setFollowing(following.filter((u) => u !== profile.username));
    setFollowers(followers.filter((u) => u !== user.username));
    setPendingRequests(pendingRequests.filter((u) => u !== profile.username));
    showToast('Deixaste de seguir este utilizador!', 'success');
  };

  const handleCancelRequest = () => {
    setPendingRequests(pendingRequests.filter((u) => u !== profile.username));
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const toggleTravelDropdown = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTravelDropdown(showTravelDropdown === travelId ? null : travelId);
  };

  const handleReportUser = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Faça login para denunciar utilizadores.', 'error');
      return;
    }
    setShowReportModal(true);
    setShowDropdown(false);
  };

  const handleBlockUser = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Faça login para bloquear utilizadores.', 'error');
      return;
    }
    setShowBlockModal(true);
    setShowDropdown(false);
  };

  const handleReasonChange = (reason) => {
    setReportReasons(prev => ({
      ...prev,
      [reason]: !prev[reason]
    }));
  };

  const handleTravelReasonChange = (reason) => {
    setReportTravelReasons(prev => ({
      ...prev,
      [reason]: !prev[reason]
    }));
  };

  const confirmReportUser = () => {
    if (profile) {
      // Check if at least one reason is selected
      const hasSelectedReason = Object.values(reportReasons).some(value => value) || 
                               (reportReasons.other && otherReason.trim());
      
      if (!hasSelectedReason) {
        showToast('Por favor, selecione pelo menos um motivo para a denúncia.', 'error');
        return;
      }

      setReportedUsers([...reportedUsers, profile.username]);
      showToast('Utilizador denunciado com sucesso!', 'success');
      setShowReportModal(false);
      // Remove from following if currently following
      setFollowing(following.filter(username => username !== profile.username));
      
      // Reset form
      setReportReasons({
        inappropriate: false,
        falseInfo: false,
        abusive: false,
        spam: false,
        identity: false,
        plagiarism: false,
        harassment: false,
        violation: false,
        other: false
      });
      setOtherReason('');
    }
  };

  const confirmBlockUser = () => {
    if (profile) {
      setBlockedUsers([...blockedUsers, profile.username]);
      showToast('Utilizador bloqueado com sucesso!', 'success');
      setShowBlockModal(false);
      // Remove from following if currently following
      setFollowing(following.filter(username => username !== profile.username));
    }
  };

  const handleReportTravel = (travel, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Faça login para denunciar viagens.', 'error');
      return;
    }
    setSelectedTravel(travel);
    setShowReportTravelModal(true);
    setShowTravelDropdown(null);
  };

  const confirmReportTravel = () => {
    if (selectedTravel) {
      const hasSelectedReason = Object.values(reportTravelReasons).some(v => v) ||
        (reportTravelReasons.other && otherTravelReason.trim());
      if (!hasSelectedReason) {
        showToast('Por favor, selecione pelo menos um motivo para a denúncia.', 'error');
        return;
      }
      setReportedTravels([...reportedTravels, selectedTravel.id]);
      showToast('Viagem denunciada com sucesso!', 'success');
      setShowReportTravelModal(false);
      setSelectedTravel(null);
      setReportTravelReasons({
        inappropriate: false,
        falseInfo: false,
        abusive: false,
        spam: false,
        violation: false,
        plagiarism: false,
        other: false,
      });
      setOtherTravelReason('');
    }
  };

  const handleUnblockUser = () => {
    if (profile) {
      setBlockedUsers(blockedUsers.filter(username => username !== profile.username));
    }
  };

  const openFollowModal = (title, list) => {
    console.log('Abrindo Follow Modal:', title, list);
    setModalContent({ title, list, type: 'follow' });
    setShowFollowModal(true);
  };

  const closeFollowModal = () => {
    console.log('Fechando Follow Modal');
    setShowFollowModal(false);
    setModalContent({ title: '', list: [], type: '' });
  };

  const openStatsModal = (title, list, type = '') => {
    console.log('Abrindo Stats Modal:', title, list, type);
    setModalContent({ title, list, type });
    setShowStatsModal(true);
  };

  const closeStatsModal = () => {
    console.log('Fechando Stats Modal');
    setShowStatsModal(false);
    setModalContent({ title: '', list: [], type: '' });
  };

  if (loading) return <div className="user-profile-page"><div className="loading-spinner"></div></div>;
  if (!profile) return <div className="user-profile-page"><p>Viajante não encontrado.</p></div>;

  const isOwnProfile = user && user.username === profile.username;
  const isFollowing = user && following.includes(profile.username);
  const isPending = user && pendingRequests.includes(profile.username);
  const isBlocked = user && blockedUsers.includes(profile.username);
  const canViewDetails = isOwnProfile || (profile.privacy === 'public') || isFollowing;
  const canViewFollowStats = isOwnProfile || (profile.privacy === 'public') || isFollowing;
  const visibleTravels = travels;

  const totalTravels = canViewDetails ? visibleTravels.length : 0;
  const uniqueCountries = canViewDetails ? [...new Set(visibleTravels.map((travel) => travel.country))] : [];
  const uniqueCities = canViewDetails ? [...new Set(visibleTravels.map((travel) => travel.city || travel.country))] : [];
  const totalSpent = canViewDetails ? visibleTravels.reduce((sum, travel) => sum + (travel.price || 0), 0) : 0;
  const averageSpent = canViewDetails && totalTravels > 0 ? (totalSpent / totalTravels).toFixed(2) : 0;

  const calculateDaysDifference = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  const totalDays = canViewDetails ? visibleTravels.reduce((sum, travel) => {
    if (travel.startDate && travel.endDate) {
      return sum + calculateDaysDifference(travel.startDate, travel.endDate);
    }
    return sum;
  }, 0) : 0;
  const averageDays = canViewDetails && totalTravels > 0 ? (totalDays / totalTravels).toFixed(1) : 0;

  const countryCounts = canViewDetails ? visibleTravels.reduce((acc, travel) => {
    acc[travel.country] = (acc[travel.country] || 0) + 1;
    return acc;
  }, {}) : {};
  const cityCounts = canViewDetails ? visibleTravels.reduce((acc, travel) => {
    acc[travel.city || travel.country] = (acc[travel.city || travel.country] || 0) + 1;
    return acc;
  }, {}) : {};
  const topCountries = canViewDetails ? Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([country]) => country) : [];
  const topCities = canViewDetails ? Object.entries(cityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([city]) => city) : [];

  const totalLikes = canViewDetails ? visibleTravels.reduce((sum, travel) => sum + (travel.likes || 0), 0) : 0;
  const totalComments = canViewDetails ? visibleTravels.reduce((sum, travel) => sum + (travel.comments?.length || 0), 0) : 0;

  const sortedByPrice = canViewDetails ? [...visibleTravels].sort((a, b) => (b.price || 0) - (a.price || 0)) : [];
  const topExpensive = canViewDetails ? sortedByPrice.slice(0, 3) : [];
  const topCheap = canViewDetails ? sortedByPrice.slice(-3).reverse() : [];

  // If user is blocked, show blocked interface
  if (isBlocked && !isOwnProfile) {
    return (
      <div className="user-profile-page">
        <div className="blocked-user-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <div className="blocked-user-avatar" style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '3px solid #ddd'
          }}>
            <FaBan size={60} color="#999" />
          </div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>{profile.username}</h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px' }}>
            Bloqueou este viajante.
          </p>
          <div style={{ display: 'flex', gap: '15px', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={handleUnblockUser}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Desbloquear
            </button>
            <Link
              to="/blocked-users"
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
            >
              VER TODOS OS VIAJANTES BLOQUEADOS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Lógica para coverPhoto e transformações
  const coverPhoto = profile?.coverPhoto;
  const coverPhotoScale = profile?.coverPhotoScale || 1;
  const coverPhotoPosition = profile?.coverPhotoPosition || { x: 0, y: 0 };

  return (
    <div className="user-profile-page">
      <header
        className="profile-header"
        style={coverPhoto ? {
          backgroundImage: `url(${coverPhoto})`,
          backgroundSize: `cover`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden',
          position: 'relative',
        } : {}}
      >
        {/* Overlay para escurecer a imagem e garantir legibilidade */}
        {coverPhoto && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 0,
          }} />
        )}
        <div className="profile-header-main" style={coverPhoto ? {
          position: 'relative',
          zIndex: 1,
        } : {}}>
          <div className="profile-avatar-section">
            <div className="profile-picture-container">
              <img
                src={profile.profilePicture || defaultAvatar}
                alt={`${profile.username}'s avatar`}
                className="profile-picture"
              />
              <div className="profile-picture-overlay">
                <div className="profile-status-indicator">
                  <div className="status-dot"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-info-section">
            <div className="profile-header-top">
              <div className="profile-name-container">
                <h1 className="profile-name">
                  {profile.name}
                  {user && following.includes(profile.username) && (
                    <span className="following-badge">
                      <FaCheck className="following-icon" />
                      A Seguir
                    </span>
                  )}
                </h1>
                <p className="profile-username">@{profile.username}</p>
              </div>

              <div className="profile-actions-section">
                {isOwnProfile && (
                  <Link to={`/profile/edit/${profile.username}`} className="button">
                    <FaEdit />
                    <span>Editar Perfil</span>
                  </Link>
                )}
                {!isOwnProfile && user && (
                  <div className="social-actions">
                    {isFollowing ? (
                      <button className="unfollow-button" onClick={handleUnfollow}>
                        <FaUserMinus />
                        <span>Deixar de Seguir</span>
                      </button>
                    ) : isPending ? (
                      <button className="pending-button" onClick={handleCancelRequest}>
                        <FaClock />
                        <span>Pendente</span>
                      </button>
                    ) : (
                      <button className="follow-button" onClick={handleFollow}>
                        <FaUserPlus />
                        <span>{profile.privacy === 'public' ? 'Seguir' : 'Solicitar'}</span>
                      </button>
                    )}
                  </div>
                )}
          
                {!isOwnProfile && user && (
                  <div className="dropdown-container">
                    <button
                      className="action-button menu-btn"
                      onClick={toggleDropdown}
                    >
                      <FaEllipsisV />
                    </button>
                    {showDropdown && (
                      <div className="dropdown-menu">
                        <button
                          className="dropdown-item"
                          onClick={handleReportUser}
                        >
                          <FaFlag /> Denunciar
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={handleBlockUser}
                        >
                          <FaBan /> Bloquear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-details-section">
              {profile.bio && (
                <div className="bio-container">
                  <p className="bio">{profile.bio}</p>
                </div>
              )}
              {(profile.city || profile.country) && (
                <div className="location-container">
                  <FaMapMarkerAlt className="location-icon" />
                  <span className="location-text">
                    {profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.city || profile.country}
                  </span>
                </div>
              )}
            </div>

            <div className="profile-stats-section">
              <div className="stats-grid">
                <div
                  className={`stat-card ${canViewFollowStats ? 'clickable' : 'non-clickable'}`}
                  onClick={() => canViewFollowStats && openFollowModal('Seguidores', followers)}
                >
                  <div className="stat-number">{followers.length}</div>
                  <div className="stat-label">Seguidores</div>
                </div>
                <div
                  className={`stat-card ${canViewFollowStats ? 'clickable' : 'non-clickable'}`}
                  onClick={() => canViewFollowStats && openFollowModal('A Seguir', profile.following)}
                >
                  <div className="stat-number">{profile.following.length}</div>
                  <div className="stat-label">A seguir</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{visibleTravels.length}</div>
                  <div className="stat-label">Viagens</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="profile-content">
        {canViewDetails ? (
          <>
            <div className="travels-section">
              
                {isOwnProfile && user && (
                  <Link to="/my-travels" className="button">
                    Gerir as minhas Viagens
                  </Link>
                  
                )}
           
             
              {visibleTravels.length > 0 ? (
                <div className="travels-grid">
                  {visibleTravels.map((travel) => (
                    <div key={travel.id} className="travel-card">
                      <Link to={`/travel/${travel.id}`}>
                        <div className="travel-content">
                          {!isOwnProfile && user && (
                            <div className="dropdown-container" style={{ position: 'relative' }}>
                              <button
                                className="dropdown-toggle"
                                onClick={(e) => toggleTravelDropdown(travel.id, e)}
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
                                <FaEllipsisV />
                              </button>
                              {showTravelDropdown === travel.id && (
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
                          )}
                          <img src={travel.highlightImage} alt={travel.name} className="highlight-image" />
                          <div className="travel-text">
                            <h2>{travel.name}</h2>
                            <p><b>👤 Utilizador:</b> {travel.user}</p>
                            <p><b>🌍 País:</b> {travel.country}</p>
                            <p><b>🏙️ Cidade:</b> {travel.city}</p>
                            <p><b>🗂️ Categoria:</b> {travel.category.join(', ')}</p>
                            <p><b>📅 Duração da Viagem:</b> {travel.days} dias</p>
                            <p><b>💰 Preço Total da Viagem:</b> {travel.price}€</p>
                            <p><strong>A Avaliação Geral:</strong> {renderStars(travel.stars)}</p>
                            <Link to={`/travel/${travel.id}`} className="button">Ver mais detalhes</Link>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
                
              ) : (
                <p className="no-travels">Nenhuma viagem partilhada ainda.</p>
              )}
            </div>
<br></br><br></br>
            <div className="traveler-stats-section" id="traveler-stats">
              
              <h2>Estatísticas do Viajante</h2>
              <div className="stats-grid">
                <div className="stat-item-box">
                  <h3>Total de Viagens</h3>
                  <p><strong>{totalTravels}</strong></p>
                </div>
                <div className="stat-item-box">
                  <h3 onClick={() => openStatsModal('Países Visitados', uniqueCountries)}>
                    Países Visitados
                    <p><span className="stat-clickable"><strong>{uniqueCountries.length}</strong></span></p>
                  </h3>
                </div>
                <div className="stat-item-box">
                  <h3 onClick={() => openStatsModal('Cidades Visitadas', uniqueCities)}>
                    Cidades Visitadas
                    <p><span className="stat-clickable"><strong>{uniqueCities.length}</strong></span></p>
                  </h3>
                </div>
                <div className="stat-item-box">
                  <h3 onClick={() => openStatsModal('Gastos por Viagem', [...topExpensive, ...topCheap], 'expense')}>
                    Total Gasto (€)
                    <p><span className="stat-clickable"><strong>{totalSpent.toLocaleString()}</strong></span></p>
                  </h3>
                </div>
                <div className="stat-item-box">
                  <h3>Média por Viagem (€)</h3>
                  <p><strong>{averageSpent}</strong></p>
                </div>
                <div className="stat-item-box">
                  <h3>Média Viagens (dias)</h3>
                  <p><strong>{averageDays}</strong></p>
                </div>
              </div>
<br></br><br></br>
              <div className="top-destinations-section">
                <h2>Melhores Destinos</h2>
                <div className="destinations-grid">
                  {topCountries.length > 0 && (
                    <div className="destination-box">
                      <h3>Top Países</h3>
                      <ul>
                        {topCountries.map((country, index) => (
                          <li key={index}>{country} ({countryCounts[country]} visita(s))</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {topCities.length > 0 && (
                    <div className="destination-box">
                      <h3>Top Cidades</h3>
                      <ul>
                        {topCities.map((city, index) => (
                          <li key={index}>{city} ({cityCounts[city]} visita(s))</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="engagement-stats-section">
                <h2>Estatísticas do Perfil</h2>
                <div className="stats-grid">
                  <div className="stat-item-box">
                    <h3>Total de Likes</h3>
                    <p><strong>{totalLikes}</strong></p>
                  </div>
                  <div className="stat-item-box">
                    <h3>Total de Comentários</h3>
                    <p><strong>{totalComments}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="private-profile-message">
            <p>
              {isPending
                ? 'Aguarde até que o Viajante aceite o seu pedido!'
                : 'Este perfil é privado. Siga o Viajante para ver as viagens e estatísticas.'}
            </p>
          </div>
        )}
      </section>

      {showFollowModal && (
        <div className="follow-modal-overlay" onClick={closeFollowModal}>
          <div className="follow-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalContent.title}</h2>
            {modalContent.list.length > 0 ? (
              <ul className="follow-user-list">
                {modalContent.list.map((username, index) => {
                  const userProfile = mockProfiles.find((p) => p.username === username);
                  return (
                    <li key={index} className="follow-user-list-item">
                      <Link to={`/profile/${username}`} className="follow-user-link">
                        <img
                          src={userProfile?.profilePicture || defaultAvatar}
                          alt={`${username}'s avatar`}
                          className="follow-user-avatar"
                        />
                        <span>{username}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Nenhum {modalContent.title.toLowerCase()} ainda.</p>
            )}
            <button className="follow-modal-close-button" onClick={closeFollowModal}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {showReportTravelModal && (
        <div className="modal-overlay" onClick={() => setShowReportTravelModal(false)}>
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
                    checked={reportTravelReasons.inappropriate}
                    onChange={() => handleTravelReasonChange('inappropriate')}
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
                    checked={reportTravelReasons.falseInfo}
                    onChange={() => handleTravelReasonChange('falseInfo')}
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
                    checked={reportTravelReasons.abusive}
                    onChange={() => handleTravelReasonChange('abusive')}
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
                    checked={reportTravelReasons.spam}
                    onChange={() => handleTravelReasonChange('spam')}
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
                    checked={reportTravelReasons.plagiarism}
                    onChange={() => handleTravelReasonChange('plagiarism')}
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
                    checked={reportTravelReasons.violation}
                    onChange={() => handleTravelReasonChange('violation')}
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
                    checked={reportTravelReasons.other}
                    onChange={() => handleTravelReasonChange('other')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Outro (especificar)</strong>
                  </div>
                </label>
                {reportTravelReasons.other && (
                  <textarea
                    value={otherTravelReason}
                    onChange={(e) => setOtherTravelReason(e.target.value)}
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
                className="cancel-button"
                onClick={() => {
                  setShowReportTravelModal(false);
                  setReportTravelReasons({
                    inappropriate: false,
                    falseInfo: false,
                    abusive: false,
                    spam: false,
                    violation: false,
                    plagiarism: false,
                    other: false,
                  });
                  setOtherTravelReason('');
                }}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#dc3545',
                  color: 'white',
                }}
              >
                Cancelar
              </button>
              <button
                className="confirm-button"
                onClick={confirmReportTravel}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: 'var (--danger-color)',
                  color: 'white',
                }}
              >
                Denunciar
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="stats-modal-overlay" onClick={closeStatsModal}>
          <div className="stats-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalContent.title}</h2>
            {modalContent.type === 'expense' ? (
              <>
                <h3>Top 3 - Viagens Mais Caras</h3>
                <ul>
                  {modalContent.list.slice(0, 3).map((travel) => (
                    <Link to={`/travel/${travel.id}`} key={travel.id}>
                      <li>
                        {travel.name} - {travel.price ? `${travel.price.toLocaleString()} €` : 'Preço não disponível'}
                      </li>
                    </Link>
                  ))}
                </ul>
                <h3>Top 3 - Viagens Mais Baratas</h3>
                <ul>
                  {modalContent.list.slice(-3).map((travel) => (
                    <Link to={`/travel/${travel.id}`} key={travel.id}>
                      <li>
                        {travel.name} - {travel.price ? `${travel.price.toLocaleString()} €` : 'Preço não disponível'}
                      </li>
                    </Link>
                  ))}
                </ul>
              </>
            ) : (
              modalContent.list.length > 0 ? (
                <ul>
                  {modalContent.list.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum {modalContent.title.toLowerCase()} ainda.</p>
              )
            )}
            <button className="stats-modal-close-button" onClick={closeStatsModal}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="request-modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="request-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Sucesso!</h2>
            <p>Pedido enviado com sucesso.<br />Aguarde até que o Viajante aceite o seu pedido!</p>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2>Denunciar Viajante</h2>
            <p>Por que deseja denunciar <strong>{profile?.username}</strong>?</p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Esta acção irá reportar o utilizador aos administradores.</p>
            
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
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: viagens inventadas, locais inexistentes, preços manipulados, etc.)</div>
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
                    <strong>Comportamento abusivo ou ofensivo</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: linguagem agressiva, insultos, bullying)</div>
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
                    <strong>Spam ou autopromoção excessiva</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: promoção constante de marcas, links externos, publicidade abusiva)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input 
                    type="checkbox" 
                    checked={reportReasons.identity}
                    onChange={() => handleReasonChange('identity')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Roubo de identidade</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: perfis falsos, uso de fotos de outras pessoas sem autorização)</div>
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
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: viagens copiadas de outros utilizadores sem créditos)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input 
                    type="checkbox" 
                    checked={reportReasons.harassment}
                    onChange={() => handleReasonChange('harassment')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Assédio ou comportamento inadequado</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: mensagens ou comentários inapropriados, perseguição)</div>
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
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: uso da plataforma para fins ilegais ou proibidos)</div>
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
                      minHeight: '80px'
                    }}
                  />
                )}
              </div>
            </div>

            <div className="modal-buttons">
              <button 
                className="cancel-button" 
                onClick={() => {
                  setShowReportModal(false);
                  // Reset form when canceling
                  setReportReasons({
                    inappropriate: false,
                    falseInfo: false,
                    abusive: false,
                    spam: false,
                    identity: false,
                    plagiarism: false,
                    harassment: false,
                    violation: false,
                    other: false
                  });
                  setOtherReason('');
                }}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#dc3545',
                  color: 'white'
                }}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button" 
                onClick={confirmReportUser}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  background: 'var (--danger-color)',
                  color: 'white'
                }}
              >
                Denunciar
              </button>
            </div>
          </div>
        </div>
      )}

      {showBlockModal && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()}>
            <h2>Bloquear Viajante</h2>
            <p>Tem certeza de que deseja bloquear <strong>{profile?.username}</strong>?</p>
            <p>Não verá mais este utilizador na lista e ele não poderá interagir consigo.</p>
            <div className="modal-buttons">
              <button 
                className="cancel-button" 
                onClick={() => setShowBlockModal(false)}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#dc3545',
                  color: 'white'
                }}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button" 
                onClick={confirmBlockUser}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  background: 'var (--danger-color)',
                  color: 'white'
                }}
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Component */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default UserProfile;