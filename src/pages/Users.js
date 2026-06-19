import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import '../styles/pages/users.css';
import '../styles/pages/globe-memories-interactive-map.css'; // Para usar o estilo do modal
import { FaCheck, FaFlag, FaBan, FaEllipsisV } from 'react-icons/fa';
import Toast from '../components/Toast';
import { usersModalUtils } from '../utils/modalUtils';
import api from '../axios_helper';

const Users = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [followingStatusById, setFollowingStatusById] = useState({});
  const [pendingStatusById, setPendingStatusById] = useState({});
  const [followActionLoadingById, setFollowActionLoadingById] = useState({});
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sortOption, setSortOption] = useState('followers');
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

  // Filtro de país selecionado
  const [selectedCountry, setSelectedCountry] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const currentUserId = user?.id ? Number(user.id) : null;

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
    setSelectedCountry((prev) => (prev === country ? '' : country));
    setPage(0);
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

  useEffect(() => {
    setLoadingFilters(false);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const discoverUsers = async () => {
      if (!user) {
        setUsersList([]);
        setTotalPages(0);
        setTotalElements(0);
        setLoadingUsers(false);
        return;
      }

      setLoadingUsers(true);
      try {
        const params = {
          sortBy: sortOption,
          page,
          size,
        };

        if (selectedCountry) {
          params.nationality = selectedCountry;
        }

        if (debouncedSearchTerm) {
          params.username = debouncedSearchTerm;
        }

        const response = await api.get('/users/discover', { params });
        const data = response.data || {};
        const content = Array.isArray(data.content) ? data.content : [];

        const mappedUsers = content.map((backendUser) => {
          const fullName = [backendUser.firstName, backendUser.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();

          return {
            id: backendUser.id,
            username: backendUser.username,
            name: fullName || backendUser.username,
            nationality: backendUser.nationality || 'Desconhecido',
            profilePicture: backendUser.profilePhoto || defaultAvatar,
            travelCount: backendUser.totalTripPosts || 0,
            followersCount: backendUser.followersCount || 0,
            privacy: backendUser.privacy || 'public',
          };
        });

        setUsersList(mappedUsers);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } catch (error) {
        console.error('Erro ao descobrir viajantes:', error);
        setUsersList([]);
        setTotalPages(0);
        setTotalElements(0);
        showToast('Não foi possível carregar os viajantes neste momento.', 'error');
      } finally {
        setLoadingUsers(false);
      }
    };

    discoverUsers();
  }, [user, sortOption, selectedCountry, debouncedSearchTerm, page, size]);

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

  useEffect(() => {
    const loadRelationshipStatuses = async () => {
      if (!currentUserId || usersList.length === 0) {
        setFollowingStatusById({});
        setPendingStatusById({});
        return;
      }

      const nextFollowingStatus = {};
      const nextPendingStatus = {};

      await Promise.all(usersList.map(async (listedUser) => {
        const followedId = listedUser.id;
        if (!followedId) {
          return;
        }

        try {
          const followingResponse = await api.get('/users/is-following', {
            params: { followerId: currentUserId, followedId }
          });

          const isFollowing = Boolean(followingResponse.data);
          nextFollowingStatus[followedId] = isFollowing;

          if (isFollowing) {
            nextPendingStatus[followedId] = false;
            return;
          }

          const pendingResponse = await api.get('/users/follow-request-status', {
            params: { requesterId: currentUserId, targetId: followedId }
          });

          nextPendingStatus[followedId] = Boolean(pendingResponse.data);
        } catch (error) {
          nextFollowingStatus[followedId] = false;
          nextPendingStatus[followedId] = false;
        }
      }));

      setFollowingStatusById(nextFollowingStatus);
      setPendingStatusById(nextPendingStatus);
    };

    loadRelationshipStatuses();
  }, [currentUserId, usersList]);

  // Load blocked users list on component mount
  useEffect(() => {
    const loadBlockedUsers = async () => {
      if (!currentUserId || !user) {
        setBlockedUsers([]);
        return;
      }

      try {
        const response = await api.get('/users-management/blocked-list');
        const blockedList = Array.isArray(response.data) ? response.data : [];
        setBlockedUsers(blockedList.map(u => u.username || u));
      } catch (error) {
        console.error('Erro ao carregar utilizadores bloqueados:', error);
        setBlockedUsers([]);
      }
    };

    loadBlockedUsers();
  }, [currentUserId, user]);

  const refreshRelationshipStatus = async (targetUserId) => {
    if (!currentUserId || !targetUserId) {
      return null;
    }

    try {
      const followingResponse = await api.get('/users/is-following', {
        params: { followerId: currentUserId, followedId: targetUserId }
      });

      const isFollowing = Boolean(followingResponse.data);
      setFollowingStatusById((prev) => ({ ...prev, [targetUserId]: isFollowing }));

      if (isFollowing) {
        setPendingStatusById((prev) => ({ ...prev, [targetUserId]: false }));
        return { isFollowing: true, isPending: false };
      }

      const pendingResponse = await api.get('/users/follow-request-status', {
        params: { requesterId: currentUserId, targetId: targetUserId }
      });

      const isPending = Boolean(pendingResponse.data);
      setPendingStatusById((prev) => ({ ...prev, [targetUserId]: isPending }));
      return { isFollowing: false, isPending };
    } catch (error) {
      console.error('Erro ao verificar estado de seguimento:', error);
      return null;
    }
  };

  const handleFollow = async (targetUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Inicie sessão para seguir viajantes.', 'error');
      return;
    }

    const targetUserId = targetUser?.id;
    if (!targetUserId || followActionLoadingById[targetUserId]) {
      return;
    }

    setFollowActionLoadingById((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await api.post(`/users/${targetUserId}/follow`);
      const relationship = await refreshRelationshipStatus(targetUserId);

      if (relationship?.isFollowing) {
        showToast(`Agora segues ${targetUser.name}!`, 'success');
      } else {
        showToast(`Pedido enviado com sucesso para: ${targetUser.name}!`, 'success');
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao seguir viajante:', error);
      showToast('Não foi possível seguir este viajante.', 'error');
    } finally {
      setFollowActionLoadingById((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleUnfollow = async (targetUserId, targetUsername, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!targetUserId || followActionLoadingById[targetUserId]) {
      return;
    }

    setFollowActionLoadingById((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await api.post(`/users/${targetUserId}/unfollow`);
      setFollowingStatusById((prev) => ({ ...prev, [targetUserId]: false }));
      setPendingStatusById((prev) => ({ ...prev, [targetUserId]: false }));
      showToast(`Deixaste de seguir ${targetUsername}!`, 'success');
    } catch (error) {
      console.error('Erro ao deixar de seguir viajante:', error);
      showToast('Não foi possível deixar de seguir este viajante.', 'error');
    } finally {
      setFollowActionLoadingById((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleCancelRequest = (targetUserId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!targetUserId) {
      return;
    }
    showToast('Cancelamento de pedido pendente ainda não disponível na API.', 'error');
  };

  const handleUnblockUser = async (targetUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!targetUser) {
      return;
    }
    setFollowActionLoadingById((prev) => ({ ...prev, [targetUser.id]: true }));
    try {
      await api.delete(`/users-management/${targetUser.id}/unblock`);
      setBlockedUsers((prev) => prev.filter((username) => username !== targetUser.username));
      showToast(`${targetUser.username} foi desbloqueado.`, 'success');
    } catch (error) {
      console.error('Erro ao desbloquear viajante:', error);
      showToast('Não foi possível desbloquear este viajante.', 'error');
    } finally {
      setFollowActionLoadingById((prev) => ({ ...prev, [targetUser.id]: false }));
    }
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
    setPage(0);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    setPage(0);
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

  const confirmBlockUser = async () => {
    if (selectedUser) {
      try {
        await api.post(`/users-management/${selectedUser.id}/block`);
        setBlockedUsers([...blockedUsers, selectedUser.username]);
        showToast('Viajante bloqueado com sucesso!', 'success');
        setShowBlockModal(false);
        setSelectedUser(null);
      } catch (error) {
        console.error('Erro ao bloquear viajante:', error);
        showToast('Não foi possível bloquear este viajante.', 'error');
      }
    }
  };

  const toggleDropdown = (userId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(showDropdown === userId ? null : userId);
  };

  const visibleUsers = usersList; // Show all users, blocked ones display with blocked indicator

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
              className={`filter-button ${sortOption === 'followers' ? 'active' : ''}`}
              onClick={() => handleSortChange('followers')}
            >
              Mais Seguidos
            </button>
            <button
              className={`filter-button ${sortOption === 'trips' ? 'active' : ''}`}
              onClick={() => handleSortChange('trips')}
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
                <label key={country} className={`country-filter ${selectedCountry === country ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedCountry === country}
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
        {visibleUsers.length > 0 ? (
          visibleUsers.map((listedUser) => (
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
                        top: '90%',
                        right: '80px',
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

{user && followingStatusById[listedUser.id] && (
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
                {blockedUsers.includes(listedUser.username) && (
                  <div style={{
                    color: '#e74c3c',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    padding: '4px 8px',
                    backgroundColor: '#fee',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    🚫 Bloqueou este viajante
                  </div>
                )}
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
                    {blockedUsers.includes(listedUser.username) ? (
                      <button
                        className="unblock-button"
                        onClick={(e) => handleUnblockUser(listedUser, e)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ff9900',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        🔓 Desbloquear
                      </button>
                    ) : followingStatusById[listedUser.id] ? (
                      <button
                        className="unfollow-button"
                        onClick={(e) => handleUnfollow(listedUser.id, listedUser.username, e)}
                        disabled={Boolean(followActionLoadingById[listedUser.id])}
                      >
                        {followActionLoadingById[listedUser.id] ? 'A processar...' : 'Não seguir'}
                      </button>
                    ) : pendingStatusById[listedUser.id] ? (
                      <button
                        className="pending-button"
                        onClick={(e) => handleCancelRequest(listedUser.id, e)}
                        disabled={Boolean(followActionLoadingById[listedUser.id])}
                      >
                        {followActionLoadingById[listedUser.id] ? 'A processar...' : 'Pendente'}
                      </button>
                    ) : (
                      <button
                        className="follow-button"
                        onClick={(e) => handleFollow(listedUser, e)}
                        disabled={Boolean(followActionLoadingById[listedUser.id])}
                      >
                        {followActionLoadingById[listedUser.id] ? 'A processar...' : 'Seguir'}
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

      {!loadingUsers && totalPages > 0 && (
        <div className="users-controls" style={{ marginTop: '12px' }}>
          <div className="main-filters-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
              {totalElements} viajante(s) encontrado(s)
            </p>
            <div className="sort-filters-inline" style={{ gap: '8px' }}>
              <button
                className="filter-button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page === 0}
              >
                Anterior
              </button>
              <span style={{ alignSelf: 'center', fontSize: '14px', color: '#444' }}>
                Página {page + 1} de {Math.max(totalPages, 1)}
              </span>
              <button
                className="filter-button"
                onClick={() => setPage((prev) => (prev + 1 < totalPages ? prev + 1 : prev))}
                disabled={page + 1 >= totalPages}
              >
                Próxima
              </button>
            </div>
          </div>
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