import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import TravelsData from '../data/travelsData';
import '../styles/pages/users.css';
import '../styles/pages/globe-memories-interactive-map.css'; // Para usar o estilo do modal
import { FaCheck, FaFlag, FaBan, FaEllipsisV } from 'react-icons/fa';
import Toast from '../components/Toast';
import { usersModalUtils } from '../utils/modalUtils';

const Users = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sortOption, setSortOption] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportReasons, setReportReasons] = useState({
    inappropriate: false,
    falseInfo: false,
    abusive: false,
    spam: false,
    identity: false,
    harassment: false,
    other: false
  });
  const [otherReason, setOtherReason] = useState('');

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Welcome modal state  
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => usersModalUtils.shouldShow());
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Filtro de países selecionados
  const [selectedCountries, setSelectedCountries] = useState([]);

  // Toast functions
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 2600);
  };

  const closeToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  // Gerar lista de países únicos dos viajantes
  const countryList = Array.from(new Set(usersList.map(u => u.nationality).filter(Boolean))).sort();

  const handleCountryFilterChange = (country) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  // Mapeamento de países para bandeiras (emoji flags)
  const countryFlags = {
    'Portugal': '🇵🇹',
    'Brasil': '🇧🇷',
    'Espanha': '🇪🇸',
    'França': '🇫🇷',
    'Alemanha': '🇩🇪',
    'Reino Unido': '🇬🇧',
    'Itália': '🇮🇹',
    'Estados Unidos': '🇺🇸',
    'Canadá': '🇨🇦',
    'Holanda': '🇳🇱',
    'Bélgica': '🇧🇪',
    'Suíça': '🇨🇭',
    'Áustria': '🇦🇹',
    'Noruega': '🇳🇴',
    'Suécia': '🇸🇪',
    'Dinamarca': '🇩🇰',
    'Finlândia': '🇫🇮',
    'Polônia': '🇵🇱',
    'República Checa': '🇨🇿',
    'Hungria': '🇭🇺',
    'Grécia': '🇬🇷',
    'Turquia': '🇹🇷',
    'Rússia': '🇷🇺',
    'Japão': '🇯🇵',
    'China': '🇨🇳',
    'Coreia do Sul': '🇰🇷',
    'Austrália': '🇦🇺',
    'Nova Zelândia': '🇳🇿',
    'Argentina': '🇦🇷',
    'Chile': '🇨🇱',
    'México': '🇲🇽',
    'Colômbia': '🇨🇴',
    'Peru': '🇵🇪',
    'Outros': '🌍'
  };

  const mockUsers = [
    { id: 1, username: 'tiago', name: 'Tiago', nationality: 'Bahamas', profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', bio: 'Amante de viagens e fotografia!', travelCount: 0, followersCount: 120, trendingScore: 80, joinDate: '2024-01-15', privacy: 'public' },
    { id: 2, username: 'AnaSilva', name: 'Ana Silva', nationality: 'Uganda', profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg', bio: 'Exploradora de montanhas.', travelCount: 0, followersCount: 200, trendingScore: 90, joinDate: '2023-06-10', privacy: 'private' },
    { id: 3, username: 'PedroCosta', name: 'Pedro Costa', nationality: 'Omã', profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg', bio: 'Apaixonado por culturas.', travelCount: 0, followersCount: 80, trendingScore: 60, joinDate: '2024-03-22', privacy: 'public' },
    { id: 4, username: 'SofiaRamos', name: 'Sofia Ramos', nationality: 'França', profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg', bio: 'Viajante urbana e foodie.', travelCount: 0, followersCount: 150, trendingScore: 85, joinDate: '2023-09-05', privacy: 'private' },
    { id: 5, username: 'JoaoPereira', name: 'João Pereira', nationality: 'Portugal', profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg', bio: 'A aventura é o meu lema!', travelCount: 0, followersCount: 90, trendingScore: 70, joinDate: '2024-02-18', privacy: 'public' },
    { id: 6, username: 'MariaOliveira', name: 'Maria Oliveira', nationality: 'Reino Unido', profilePicture: 'https://randomuser.me/api/portraits/women/6.jpg', bio: 'História e arte em cada destino.', travelCount: 0, followersCount: 110, trendingScore: 75, joinDate: '2023-11-30', privacy: 'private' },
    { id: 7, username: 'LucasSantos', name: 'Lucas Santos', nationality: 'Itália', profilePicture: 'https://randomuser.me/api/portraits/men/7.jpg', bio: 'Sempre em busca do próximo voo.', travelCount: 0, followersCount: 130, trendingScore: 88, joinDate: '2024-04-01', privacy: 'public' },
    { id: 8, username: 'BeatrizLima', name: 'Beatriz Lima', nationality: 'Estados Unidos', profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'A natureza é o meu refúgio.', travelCount: 0, followersCount: 170, trendingScore: 92, joinDate: '2023-08-12', privacy: 'private' },
    { id: 9, username: 'Teste', name: 'Teste User', nationality: 'Canadá', profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'A natureza é o meu refúgio.', travelCount: 0, followersCount: 50, trendingScore: 55, joinDate: '2024-04-20', privacy: 'private' },
    { id: 10, username: 'BeatrizLima', name: 'Beatriz Lima', nationality: 'Gabão', profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'A natureza é o meu refúgio.', travelCount: 0, followersCount: 170, trendingScore: 92, joinDate: '2023-08-12', privacy: 'private' },
    { id: 11, username: 'cris', name: 'Cristiano', nationality: 'Croácia', profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'A natureza é o meu refúgio.', travelCount: 0, followersCount: 170, trendingScore: 92, joinDate: '2023-08-12', privacy: 'private' },
    { id: 12, username: 'cristisilva', name: 'Cristi silva', nationality: 'Croácia', profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'A natureza é o meu refúgio.', travelCount: 0, followersCount: 170, trendingScore: 92, joinDate: '2023-08-12', privacy: 'private' },
  ];

  useEffect(() => {
    // Primeiro carrega os filtros/controles imediatamente
    setLoadingFilters(false);

    // Depois carrega os viajantes com um pequeno delay para melhor UX
    setTimeout(() => {
      const updatedUsers = mockUsers.map((mockUser) => {
        const userTravels = TravelsData.filter((travel) => travel.user === mockUser.username);
        return {
          ...mockUser,
          travelCount: userTravels.length,
        };
      });

      if (!user) {
        setUsersList(updatedUsers.filter((u) => u.privacy === 'public'));
      } else {
        setUsersList(updatedUsers.filter((u) => u.username !== user.username));
        setFollowing(['AnaSilva', 'PedroCosta']);
      }
      setLoadingUsers(false);
    }, 300);
  }, [user]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleFollow = (targetUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Inicie sessão para seguir viajantes.', 'error');
      return;
    }
    if (targetUser.privacy === 'public') {
      setFollowing([...following, targetUser.username]);
      showToast(`Agora segues ${targetUser.name}!`, 'success');
    } else {
      setPendingRequests([...pendingRequests, targetUser.username]);
      showToast(`Pedido enviado com sucesso para: ${targetUser.name}!`, 'success');
      setShowModal(true);
      setTimeout(() => {
        setShowModal(false);
      }, 3000);
    }
  };

  const handleUnfollow = (targetUsername, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFollowing(following.filter((username) => username !== targetUsername));
    setPendingRequests(pendingRequests.filter((username) => username !== targetUsername));
    showToast('Deixaste de seguir este viajante!', 'success');
  };

  const handleCancelRequest = (targetUsername, e) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingRequests(pendingRequests.filter((username) => username !== targetUsername));
  };

  // Função para sanitizar inputs de pesquisa
  const sanitizeSearchInput = (input) => {
    if (!input) return '';
    
    // Remove apenas conteúdo perigoso, MAS MANTÉM ESPAÇOS
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '');
    // REMOVIDO .trim() para permitir espaços
  };

  const handleSearchChange = (e) => {
    const rawValue = e.target.value;
    
    if (rawValue.length > 50) {
      showToast('Pesquisa não pode exceder 50 caracteres!', 'error');
      return;
    }

    const sanitized = sanitizeSearchInput(rawValue);
    
    // Verificar apenas se caracteres perigosos foram removidos (não comparar trim)
    if (sanitized !== rawValue && rawValue !== '') {
      showToast('Pesquisa contém caracteres não permitidos que foram removidos!', 'error');
    }

    setSearchTerm(sanitized);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const handleReportUser = (targetUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Inicie sessão para denunciar viajantes.', 'error');
      return;
    }
    setSelectedUser(targetUser);
    setShowReportModal(true);
    setShowDropdown(null);
  };

  const handleBlockUser = (targetUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Inicie sessão para bloquear viajantes.', 'error');
      return;
    }
    setSelectedUser(targetUser);
    setShowBlockModal(true);
    setShowDropdown(null);
  };

  const handleReasonChange = (reason) => {
    setReportReasons(prev => ({
      ...prev,
      [reason]: !prev[reason]
    }));
  };

  const confirmReportUser = () => {
    if (selectedUser) {
      // Check if at least one reason is selected
      const hasSelectedReason = Object.values(reportReasons).some(value => value) || 
                               (reportReasons.other && otherReason.trim());
      
      if (!hasSelectedReason) {
        showToast('Por favor, selecione pelo menos um motivo para a denúncia.', 'error');
        return;
      }

      setReportedUsers([...reportedUsers, selectedUser.username]);
      showToast('Viajante denunciado com sucesso!', 'success');
      setShowReportModal(false);
      setSelectedUser(null);
      // Remove from following if currently following
      setFollowing(following.filter(username => username !== selectedUser.username));
      
      // Reset form
      setReportReasons({
        inappropriate: false,
        falseInfo: false,
        abusive: false,
        spam: false,
        identity: false,
        harassment: false,
        other: false
      });
      setOtherReason('');
    }
  };

  const confirmBlockUser = () => {
    if (selectedUser) {
      setBlockedUsers([...blockedUsers, selectedUser.username]);
      showToast('Viajante bloqueado com sucesso!', 'success');
      setShowBlockModal(false);
      setSelectedUser(null);
      // Remove from following if currently following
      setFollowing(following.filter(username => username !== selectedUser.username));
    }
  };

  const toggleDropdown = (userId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(showDropdown === userId ? null : userId);
  };

  // Search by username or name and filter out blocked users
  // Filtro por país + busca + bloqueados
  const filteredUsers = usersList.filter((listedUser) => {
    const matchesSearch = listedUser.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listedUser.name.toLowerCase().includes(searchTerm.toLowerCase());
    const notBlocked = !blockedUsers.includes(listedUser.username);
    const matchesCountry =
      selectedCountries.length === 0 || selectedCountries.includes(listedUser.nationality);
    return matchesSearch && notBlocked && matchesCountry;
  });

  // Sort users based on selected option
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortOption) {
      case 'trending':
        return b.trendingScore - a.trendingScore;
      case 'mostFollowers':
        return b.followersCount - a.followersCount;
      case 'newTravelers':
        return new Date(b.joinDate) - new Date(a.joinDate); // Newest first
      case 'mostTravels':
        return b.travelCount - a.travelCount;
      case 'all':
      default:
        return 0; // No sorting
    }
  });

  return (
    <div className="users-page">
      {/* Modal de Boas-vindas */}
      {showWelcomeModal && (
        <div className="gm-map-welcome-overlay">
          <div className="gm-map-welcome-modal">
            <div className="gm-map-welcome-header">
              <h2>Rede Social de Viajantes Globe Memories</h2>
              <button className="gm-map-close-btn" onClick={() => setShowWelcomeModal(false)}>×</button>
            </div>
            <div className="gm-map-welcome-content">
              <p>Conecte-se a uma comunidade global de exploradores, descubra novos companheiros de viagem e partilhe experiências verdadeiramente únicas!</p>
              <div className="gm-map-features-grid">
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🌎</span>
                  <div>
                    <strong>Pesquisa Global de Viajantes</strong>
                    <p>Encontre outros utilizadores pelo nome, nacionalidade ou interesses de viagem em comum.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">👥</span>
                  <div>
                    <strong>Sistema de Seguir Inteligente</strong>
                    <p>Siga viajantes inspiradores e receba notificações sempre que partilhem novas aventuras.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🔍</span>
                  <div>
                    <strong>Filtros Avançados de Descoberta</strong>
                    <p>Procure pessoas com afinidades semelhantes filtrando por país, tipo de viagem ou experiência vivida.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🛡️</span>
                  <div>
                    <strong>Ambiente Seguro e Moderado</strong>
                    <p>Desfrute de uma comunidade saudável com um sistema completo de denúncias e bloqueios, pensado para garantir a sua segurança.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gm-map-welcome-footer">
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
              <button className="gm-map-welcome-btn primary" onClick={() => {
                if (dontShowAgain) {
                  usersModalUtils.dismiss();
                }
                setShowWelcomeModal(false);
              }}>
                Descobrir viajantes!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {loadingFilters ? (
        <div className="users-controls">
          <div className="loading-spinner-gradient">
            <div className="spinner-inner"></div>
            <p>A carregar filtros...</p>
          </div>
        </div>
      ) : (
        <div className="users-controls">
    
        
        {/* Linha principal: Pesquisa + Filtros de ordenação */}
        <div className="main-filters-row">
          {/* Barra de pesquisa */}
          <div className="search-bar-inline">
            <div className="search-input-wrapper">
              <span className="search-icon"></span>
              <input
                type="text"
                placeholder="Pesquisar por nome ou viajante..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
                maxLength={50}
              />
            </div>
          </div>

          {/* Filtros de ordenação */}
          <div className="sort-filters-inline">
            <button
              className={`filter-button ${sortOption === 'all' ? 'active' : ''}`}
              onClick={() => handleSortChange('all')}
            >
              Todos os Viajantes
            </button>
            <button
              className={`filter-button ${sortOption === 'trending' ? 'active' : ''}`}
              onClick={() => handleSortChange('trending')}
            >
              Em Destaque
            </button>
            <button
              className={`filter-button ${sortOption === 'mostFollowers' ? 'active' : ''}`}
              onClick={() => handleSortChange('mostFollowers')}
            >
              Mais Seguidos
            </button>
            <button
              className={`filter-button ${sortOption === 'newTravelers' ? 'active' : ''}`}
              onClick={() => handleSortChange('newTravelers')}
            >
              Novos Viajantes
            </button>
            <button
              className={`filter-button ${sortOption === 'mostTravels' ? 'active' : ''}`}
              onClick={() => handleSortChange('mostTravels')}
            >
              Mais Viagens
            </button>
          </div>
        </div>

        {/* Filtros de países por baixo */}
        {countryList.length > 0 && (
          <div className="country-filters-section">
            <label className="filter-label">Filtrar pessoas por País</label>
            <div className="country-filters">
              {countryList.map((country) => (
                <label key={country} className={`country-filter ${selectedCountries.includes(country) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedCountries.includes(country)}
                    onChange={() => handleCountryFilterChange(country)}
                    className="country-checkbox"
                  />
                  <img
                    src={`https://flagcdn.com/24x18/${getCountryCode(country)}.png`}
                    alt={country}
                    className="country-flag-img"
                  />
                  <span className="country-name">{country}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        </div>
      )}

      {loadingUsers ? (
        <div className="users-grid">
          <div className="loading-spinner-gradient">
            <div className="spinner-inner"></div>
          </div>
        </div>
      ) : (
        <div className="users-grid">
        {sortedUsers.length > 0 ? (
          sortedUsers.map((listedUser) => (
            <Link
              to={`/profile/${listedUser.username}`}
              key={listedUser.id}
              className="user-card"
              onClick={(e) => {
                // Only navigate if the click is not on a button
                if (e.target.tagName === 'BUTTON' || e.target.closest('.user-actions')) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >

<div className="dropdown-container" style={{ position: 'relative' }}>
                    <button
                      className="dropdown-toggle"
                      onClick={(e) => toggleDropdown(listedUser.id, e)}
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
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <FaEllipsisV />
                    </button>
                    {showDropdown === listedUser.id && (
                      <div className="dropdown-menu" style={{
                        position: 'absolute',
                        top: '20%',
                        right: '60px',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        zIndex: 5000,
                        minWidth: '160px'
                      }}>
                        <button
                          className="dropdown-item"
                          onClick={(e) => handleReportUser(listedUser, e)}
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
                            fontSize: '14px'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <FaFlag /> Denunciar Viajante
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={(e) => handleBlockUser(listedUser, e)}
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
                            borderTop: '1px solid #eee'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <FaBan /> Bloquear Viajante
                        </button>
                      </div>
                    )}

{user && following.includes(listedUser.username) && (
                  <span
                    className="following-text"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: -9, // move further right, outside avatar
                      background: 'rgba(0, 128, 0, 0.8)',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.85em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 2,
                    }}
                  >
                    <FaCheck className="following-icon" /> A seguir
                  </span>
                )}

                  </div>

              <div className="user-avatar-container" style={{ position: 'relative' }}>
                <img
                  src={listedUser.profilePicture || defaultAvatar}
                  alt={`${listedUser.username}'s avatar`}
                  className="user-avatar"
                />
          
              </div>
              <div className="user-info">
                <h3>
                  {listedUser.username}
                </h3>
                <div className="user-country" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', margin: '0.5rem 0' }}>
                  <img
                    className="country-flag"
                    src={`https://flagcdn.com/24x18/${listedUser.nationality ? getCountryCode(listedUser.nationality) : 'un'}.png`}
                    alt={listedUser.nationality || 'País desconhecido'}
                    style={{ width: '24px', height: '18px', objectFit: 'cover', borderRadius: '3px', marginRight: '0.2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                  />
                  <span className="country-name" style={{ fontWeight: '500', color: '#333', fontSize: '0.95rem' }}>
                    {listedUser.nationality || 'País não especificado'}
                  </span>
                </div>
                <p><strong>{listedUser.travelCount}</strong> Viagens</p>
              </div>
              {user && (
                <div className="user-actions">
                  <div className="main-actions">
                    {following.includes(listedUser.username) ? (
                      <button
                        className="unfollow-button"
                        onClick={(e) => handleUnfollow(listedUser.username, e)}
                      >
                        Não seguir
                      </button>
                    ) : pendingRequests.includes(listedUser.username) ? (
                      <button
                        className="pending-button"
                        onClick={(e) => handleCancelRequest(listedUser.username, e)}
                      >
                        Pendente
                      </button>
                    ) : (
                      <button
                        className="follow-button"
                        onClick={(e) => handleFollow(listedUser, e)}
                      >
                        {listedUser.privacy === 'public' ? 'Seguir' : 'Pedir para seguir'}
                      </button>
                    )}
                  </div>
                  
                </div>
              )}
          </Link>
        ))
      ) : (
        <p className="no-users">Nenhum Viajante encontrado.</p>
      )}
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', overflowY: 'auto' }}>
            <br></br><br></br>
            <h2>Denunciar Viajante</h2>

            <p>Porque deseja denunciar o viajante <strong>"{selectedUser?.username}"</strong>?</p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Esta ação irá reportar o viajante aos administradores.</p>
            
           
            
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
                    <div style={{ color: '#666', fontSize: '12px' }}>(imagens, descrições ou publicações ofensivas, nudez, etc.)</div>
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
                    <div style={{ color: '#666', fontSize: '12px' }}>(viagens inventadas, perfis falsos, dados incorretos, etc.)</div>
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
                    <div style={{ color: '#666', fontSize: '12px' }}>(linguagem agressiva, insultos, bullying, provocações)</div>
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
                    <div style={{ color: '#666', fontSize: '12px' }}>(publicidade excessiva, links externos, promoção constante de marcas)</div>
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
                    <div style={{ color: '#666', fontSize: '12px' }}>(uso de fotos ou informações de outra pessoa sem autorização)</div>
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
                    <div style={{ color: '#666', fontSize: '12px' }}>(mensagens, comentários ou perseguição indesejada)</div>
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
                className="button-danger" 
                onClick={() => {
                  setShowReportModal(false);
                  // Reset form when canceling
                  setReportReasons({
                    inappropriate: false,
                    falseInfo: false,
                    abusive: false,
                    spam: false,
                    identity: false,
                    harassment: false,
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
                  backgroundColor: '#6c757d',
                  color: 'white'
                }}
              >
                Cancelar
              </button>
              <button 
                className="button-orange" 
                onClick={confirmReportUser}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#e74c3c',
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
            <p>Tem certeza de que deseja bloquear <strong>{selectedUser?.username}</strong>?</p>
            <p>Não verá mais este viajante na lista e ele não poderá interagir consigo.</p>
            <div className="modal-buttons">
              <button 
                className="button-danger" 
                onClick={() => setShowBlockModal(false)}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#6c757d',
                  color: 'white'
                }}
              >
                Cancelar
              </button>
              <button 
                className="button-orange" 
                onClick={confirmBlockUser}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#e74c3c',
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

// Função utilitária para converter nome do país em código ISO 3166-1 alpha-2
function getCountryCode(countryName) {
  // Mapeamento completo dos 195 países reconhecidos pela ONU (nomes em português)
  const map = {
    'Afeganistão': 'af',
    'África do Sul': 'za',
    'Albânia': 'al',
    'Alemanha': 'de',
    'Andorra': 'ad',
    'Angola': 'ao',
    'Antígua e Barbuda': 'ag',
    'Arábia Saudita': 'sa',
    'Argélia': 'dz',
    'Argentina': 'ar',
    'Armênia': 'am',
    'Austrália': 'au',
    'Áustria': 'at',
    'Azerbaijão': 'az',
    'Bahamas': 'bs',
    'Bangladesh': 'bd',
    'Barbados': 'bb',
    'Bahrein': 'bh',
    'Bélgica': 'be',
    'Belize': 'bz',
    'Benin': 'bj',
    'Bielorrússia': 'by',
    'Bolívia': 'bo',
    'Bósnia e Herzegovina': 'ba',
    'Botsuana': 'bw',
    'Brasil': 'br',
    'Brunei': 'bn',
    'Bulgária': 'bg',
    'Burquina Faso': 'bf',
    'Burundi': 'bi',
    'Butão': 'bt',
    'Cabo Verde': 'cv',
    'Camarões': 'cm',
    'Camboja': 'kh',
    'Canadá': 'ca',
    'Catar': 'qa',
    'Cazaquistão': 'kz',
    'Chade': 'td',
    'Chile': 'cl',
    'China': 'cn',
    'Chipre': 'cy',
    'Colômbia': 'co',
    'Comores': 'km',
    'Congo': 'cg',
    'República Democrática do Congo': 'cd',
    'Coreia do Norte': 'kp',
    'Coreia do Sul': 'kr',
    'Costa do Marfim': 'ci',
    'Costa Rica': 'cr',
    'Croácia': 'hr',
    'Cuba': 'cu',
    'Dinamarca': 'dk',
    'Djibuti': 'dj',
    'Dominica': 'dm',
    'Egito': 'eg',
    'El Salvador': 'sv',
    'Emirados Árabes Unidos': 'ae',
    'Equador': 'ec',
    'Eritreia': 'er',
    'Eslováquia': 'sk',
    'Eslovênia': 'si',
    'Espanha': 'es',
    'Estados Unidos': 'us',
    'Estônia': 'ee',
    'Etiópia': 'et',
    'Fiji': 'fj',
    'Filipinas': 'ph',
    'Finlândia': 'fi',
    'França': 'fr',
    'Gabão': 'ga',
    'Gâmbia': 'gm',
    'Gana': 'gh',
    'Geórgia': 'ge',
    'Granada': 'gd',
    'Grécia': 'gr',
    'Guatemala': 'gt',
    'Guiana': 'gy',
    'Guiné': 'gn',
    'Guiné Equatorial': 'gq',
    'Guiné-Bissau': 'gw',
    'Haiti': 'ht',
    'Holanda': 'nl',
    'Honduras': 'hn',
    'Hungria': 'hu',
    'Iémen': 'ye',
    'Ilhas Marshall': 'mh',
    'Ilhas Maurício': 'mu',
    'Ilhas Salomão': 'sb',
    'Índia': 'in',
    'Indonésia': 'id',
    'Irã': 'ir',
    'Iraque': 'iq',
    'Irlanda': 'ie',
    'Islândia': 'is',
    'Israel': 'il',
    'Itália': 'it',
    'Jamaica': 'jm',
    'Japão': 'jp',
    'Jordânia': 'jo',
    'Kiribati': 'ki',
    'Kosovo': 'xk',
    'Kuwait': 'kw',
    'Laos': 'la',
    'Lesoto': 'ls',
    'Letônia': 'lv',
    'Líbano': 'lb',
    'Libéria': 'lr',
    'Líbia': 'ly',
    'Liechtenstein': 'li',
    'Lituânia': 'lt',
    'Luxemburgo': 'lu',
    'Macedônia do Norte': 'mk',
    'Madagáscar': 'mg',
    'Malásia': 'my',
    'Malawi': 'mw',
    'Maldivas': 'mv',
    'Mali': 'ml',
    'Malta': 'mt',
    'Marrocos': 'ma',
    'Mauritânia': 'mr',
    'México': 'mx',
    'Micronésia': 'fm',
    'Moçambique': 'mz',
    'Moldávia': 'md',
    'Mônaco': 'mc',
    'Mongólia': 'mn',
    'Montenegro': 'me',
    'Myanmar': 'mm',
    'Namíbia': 'na',
    'Nauru': 'nr',
    'Nepal': 'np',
    'Nicarágua': 'ni',
    'Níger': 'ne',
    'Nigéria': 'ng',
    'Noruega': 'no',
    'Nova Zelândia': 'nz',
    'Omã': 'om',
    'Países Baixos': 'nl',
    'Palau': 'pw',
    'Palestina': 'ps',
    'Panamá': 'pa',
    'Papua-Nova Guiné': 'pg',
    'Paquistão': 'pk',
    'Paraguai': 'py',
    'Peru': 'pe',
    'Polônia': 'pl',
    'Portugal': 'pt',
    'Quênia': 'ke',
    'Quirguistão': 'kg',
    'Reino Unido': 'gb',
    'República Centro-Africana': 'cf',
    'República Checa': 'cz',
    'República Dominicana': 'do',
    'Romênia': 'ro',
    'Ruanda': 'rw',
    'Rússia': 'ru',
    'Saara Ocidental': 'eh',
    'Saint Kitts e Nevis': 'kn',
    'Saint Vincent e Granadinas': 'vc',
    'Samoa': 'ws',
    'San Marino': 'sm',
    'Santa Lúcia': 'lc',
    'São Tomé e Príncipe': 'st',
    'Senegal': 'sn',
    'Serra Leoa': 'sl',
    'Sérvia': 'rs',
    'Singapura': 'sg',
    'Síria': 'sy',
    'Somália': 'so',
    'Sri Lanka': 'lk',
    'Suazilândia': 'sz',
    'Sudão': 'sd',
    'Sudão do Sul': 'ss',
    'Suécia': 'se',
    'Suíça': 'ch',
    'Suriname': 'sr',
    'Tailândia': 'th',
    'Taiwan': 'tw',
    'Tajiquistão': 'tj',
    'Tanzânia': 'tz',
    'Timor-Leste': 'tl',
    'Togo': 'tg',
    'Tonga': 'to',
    'Trindade e Tobago': 'tt',
    'Tunísia': 'tn',
    'Turcomenistão': 'tm',
    'Turquia': 'tr',
    'Tuvalu': 'tv',
    'Ucrânia': 'ua',
    'Uganda': 'ug',
    'Uruguai': 'uy',
    'Uzbequistão': 'uz',
    'Vanuatu': 'vu',
    'Vaticano': 'va',
    'Venezuela': 've',
    'Vietnã': 'vn',
    'Zâmbia': 'zm',
    'Zimbábue': 'zw',
    // fallback para outros nomes ou não reconhecidos
    'Outros': 'un',
    'Desconhecido': 'un'
  };
  // Normaliza acentuação e espaços para garantir correspondência
  const normalized = countryName ? countryName.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '') : '';
  // Busca direta
  if (map[countryName]) return map[countryName];
  // Busca por nome normalizado
  for (const key in map) {
    const keyNorm = key.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (keyNorm.toLowerCase() === normalized.toLowerCase()) return map[key];
  }
  return 'un';
}

export default Users;