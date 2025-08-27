import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import TravelsData from '../data/travelsData';
// ...existing code...
import { FaCheck, FaFlag, FaBan, FaEllipsisV } from 'react-icons/fa';

const Users = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
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
    plagiarism: false,
    harassment: false,
    violation: false,
    other: false
  });
  const [otherReason, setOtherReason] = useState('');

  const mockUsers = [
    { id: 1, username: 'tiago', name: 'Tiago', profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', bio: 'Amante de viagens e fotografia!', travelCount: 0, followersCount: 120, trendingScore: 80, joinDate: '2024-01-15', privacy: 'public' },
    { id: 2, username: 'AnaSilva', name: 'Ana Silva', profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg', bio: 'Exploradora de montanhas.', travelCount: 0, followersCount: 200, trendingScore: 90, joinDate: '2023-06-10', privacy: 'private' },
    { id: 3, username: 'PedroCosta', name: 'Pedro Costa', profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg', bio: 'Apaixonado por culturas.', travelCount: 0, followersCount: 80, trendingScore: 60, joinDate: '2024-03-22', privacy: 'public' },
    { id: 4, username: 'SofiaRamos', name: 'Sofia Ramos', profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg', bio: 'Viajante urbana e foodie.', travelCount: 0, followersCount: 150, trendingScore: 85, joinDate: '2023-09-05', privacy: 'private' },
    { id: 5, username: 'JoaoPereira', name: 'João Pereira', profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg', bio: 'Aventura é meu lema!', travelCount: 0, followersCount: 90, trendingScore: 70, joinDate: '2024-02-18', privacy: 'public' },
    { id: 6, username: 'MariaOliveira', name: 'Maria Oliveira', profilePicture: 'https://randomuser.me/api/portraits/women/6.jpg', bio: 'História e arte em cada destino.', travelCount: 0, followersCount: 110, trendingScore: 75, joinDate: '2023-11-30', privacy: 'private' },
    { id: 7, username: 'LucasSantos', name: 'Lucas Santos', profilePicture: 'https://randomuser.me/api/portraits/men/7.jpg', bio: 'Sempre em busca do próximo voo.', travelCount: 0, followersCount: 130, trendingScore: 88, joinDate: '2024-04-01', privacy: 'public' },
    { id: 8, username: 'BeatrizLima', name: 'Beatriz Lima', profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'Natureza é meu refúgio.', travelCount: 0, followersCount: 170, trendingScore: 92, joinDate: '2023-08-12', privacy: 'private' },
    { id: 9, username: 'Teste', name: 'Teste User', profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'Natureza é meu refúgio.', travelCount: 0, followersCount: 50, trendingScore: 55, joinDate: '2024-04-20', privacy: 'private' },
  ];

  useEffect(() => {
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
      setLoading(false);
    }, 1000);
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
      alert('Faça login para seguir usuários.');
      return;
    }
    if (targetUser.privacy === 'public') {
      setFollowing([...following, targetUser.username]);
    } else {
      setPendingRequests([...pendingRequests, targetUser.username]);
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
  };

  const handleCancelRequest = (targetUsername, e) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingRequests(pendingRequests.filter((username) => username !== targetUsername));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const handleReportUser = (targetUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Faça login para denunciar usuários.');
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
      alert('Faça login para bloquear usuários.');
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
        alert('Por favor, selecione pelo menos um motivo para a denúncia.');
        return;
      }

      setReportedUsers([...reportedUsers, selectedUser.username]);
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
        plagiarism: false,
        harassment: false,
        violation: false,
        other: false
      });
      setOtherReason('');
    }
  };

  const confirmBlockUser = () => {
    if (selectedUser) {
      setBlockedUsers([...blockedUsers, selectedUser.username]);
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
  const filteredUsers = usersList.filter((listedUser) =>
    (listedUser.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listedUser.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    !blockedUsers.includes(listedUser.username)
  );

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

  if (loading) return <div className="users-page"><div className="loading-spinner"></div></div>;

  return (
    <div className="users-page">
      <div className="search-filter-container">
        {!isMobile && (
          <div className="users-filters">
            <div className="search-bar" style={{ marginRight: 12 }}>
              <input
                type="text"
                placeholder="Pesquisar Viajantes por nome ou usuário..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            <button
              className={sortOption === 'all' ? 'filter-button active' : 'filter-button'}
              onClick={() => handleSortChange('all')}
            >
              Todos os Viajantes
            </button>
            <button
              className={sortOption === 'trending' ? 'filter-button active' : 'filter-button'}
              onClick={() => handleSortChange('trending')}
            >
              Viajantes em Destaque
            </button>
            <button
              className={sortOption === 'mostFollowers' ? 'filter-button active' : 'filter-button'}
              onClick={() => handleSortChange('mostFollowers')}
            >
              Viajantes Mais Seguidos
            </button>
            <button
              className={sortOption === 'newTravelers' ? 'filter-button active' : 'filter-button'}
              onClick={() => handleSortChange('newTravelers')}
            >
              Novos Viajantes
            </button>
            <button
              className={sortOption === 'mostTravels' ? 'filter-button active' : 'filter-button'}
              onClick={() => handleSortChange('mostTravels')}
            >
              Perfis com Mais Viagens
            </button>
          </div>
        )}
        {isMobile && (
          <div className="search-bar">
            <input
              type="text"
              placeholder="Pesquisar Viajantes por nome ou usuário..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
        )}
      </div>

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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()}>
            <h2>Sucesso!</h2>
            <p>Pedido enviado com sucesso.<br />Aguarde até que o Viajante aceite o seu pedido!</p>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2>Denunciar Viajante</h2>
            <p>Por que deseja denunciar <strong>{selectedUser?.username}</strong>?</p>
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
            <p>Você não verá mais este viajante na lista e ele não poderá interagir consigo.</p>
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
    </div>
  );
};

export default Users;