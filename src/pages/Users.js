import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import TravelsData from '../data/travelsData';
import '../styles/styles.css';
import { FaCheck } from 'react-icons/fa';

const Users = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sortOption, setSortOption] = useState('all');

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

  // Search by username or name
  const filteredUsers = usersList.filter((listedUser) =>
    listedUser.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listedUser.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="search-bar">
          <input
            type="text"
            placeholder="Pesquisar Viajantes por nome ou usuário..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <div className="users-filters">
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
              <img
                src={listedUser.profilePicture || defaultAvatar}
                alt={`${listedUser.username}'s avatar`}
                className="user-avatar"
              />
              <div className="user-info">
                <h3>
                  {listedUser.username}
                  {user && following.includes(listedUser.username) && (
                    <span className="following-text">
                      <FaCheck className="following-icon" /> A seguir
                    </span>
                  )}
                </h3>
                <p><strong>{listedUser.travelCount}</strong> Viagens</p>
              </div>
              {user && (
                <div className="user-actions">
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
    </div>
  );
};

export default Users;