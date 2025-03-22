// src/components/Users.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import TravelsData from '../data/travelsData';
import '../styles/styles.css';
import { FaCheck } from 'react-icons/fa'; // Importar o ícone de check

const Users = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const mockUsers = [
    { id: 1, username: 'tiago', name: 'Tiago', profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', bio: 'Amante de viagens e fotografia!', travelCount: 0, privacy: 'public' },
    { id: 2, username: 'AnaSilva', profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg', bio: 'Exploradora de montanhas.', travelCount: 0, privacy: 'private' },
    { id: 3, username: 'PedroCosta', profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg', bio: 'Apaixonado por culturas.', travelCount: 0, privacy: 'public' },
    { id: 4, username: 'SofiaRamos', profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg', bio: 'Viajante urbana e foodie.', travelCount: 0, privacy: 'private' },
    { id: 5, username: 'JoaoPereira', profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg', bio: 'Aventura é meu lema!', travelCount: 0, privacy: 'public' },
    { id: 6, username: 'MariaOliveira', profilePicture: 'https://randomuser.me/api/portraits/women/6.jpg', bio: 'História e arte em cada destino.', travelCount: 0, privacy: 'private' },
    { id: 7, username: 'LucasSantos', profilePicture: 'https://randomuser.me/api/portraits/men/7.jpg', bio: 'Sempre em busca do próximo voo.', travelCount: 0, privacy: 'public' },
    { id: 8, username: 'BeatrizLima', profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'Natureza é meu refúgio.', travelCount: 0, privacy: 'private' },
    { id: 9, username: 'Teste', profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'Natureza é meu refúgio.', travelCount: 0, privacy: 'private' },
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
        setUsersList(updatedUsers);
        setFollowing(['AnaSilva', 'PedroCosta']);
      }
      setLoading(false);
    }, 1000);
  }, [user]);

  const handleFollow = (targetUser) => {
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

  const handleUnfollow = (targetUsername) => {
    setFollowing(following.filter((username) => username !== targetUsername));
    setPendingRequests(pendingRequests.filter((username) => username !== targetUsername));
  };

  const handleCancelRequest = (targetUsername) => {
    setPendingRequests(pendingRequests.filter((username) => username !== targetUsername));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = usersList.filter((listedUser) =>
    listedUser.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="users-page"><div className="loading-spinner"></div></div>;

  return (
    <div className="users-page">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar Viajantes..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      <div className="users-grid">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((listedUser) => (
            <div key={listedUser.id} className="user-card">
              <Link to={`/profile/${listedUser.username}`}>
                <img
                  src={listedUser.profilePicture || defaultAvatar}
                  alt={`${listedUser.username}'s avatar`}
                  className="user-avatar"
                />
              </Link>
              <div className="user-info">
                <Link to={`/profile/${listedUser.username}`}>
                  <h3>
                    {listedUser.username}
                    {user && following.includes(listedUser.username) && (
                      <span className="following-text">
                        <FaCheck className="following-icon" /> A seguir
                      </span>
                    )}
                  </h3>
                </Link>
                <p><strong>{listedUser.travelCount}</strong> Viagens</p>
              </div>
              {user && listedUser.username !== user.username && (
                <div className="user-actions">
                  {following.includes(listedUser.username) ? (
                    <button
                      className="unfollow-button"
                      onClick={() => handleUnfollow(listedUser.username)}
                    >
                      Não seguir
                    </button>
                  ) : pendingRequests.includes(listedUser.username) ? (
                    <button
                      className="pending-button"
                      onClick={() => handleCancelRequest(listedUser.username)}
                    >
                      Pendente
                    </button>
                  ) : (
                    <button
                      className="follow-button"
                      onClick={() => handleFollow(listedUser)}
                    >
                      {listedUser.privacy === 'public' ? 'Seguir' : 'Pedir para seguir'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="no-users">Nenhum usuário encontrado.</p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()}>
            <h2>Sucesso!</h2>
            <p>Pedido enviado com sucesso. <br />Aguarde até que o Viajante aceite o seu pedido!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;