import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
import TravelsData from '../data/travelsData';
import '../styles/styles.css';
import { FaCheck } from 'react-icons/fa';
import { FaStar } from 'react-icons/fa';

const UserProfile = () => {
  const { user } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowModal, setShowFollowModal] = useState(false); // Modal para seguidores/seguindo
  const [showStatsModal, setShowStatsModal] = useState(false); // Modal para estatísticas
  const [showRequestModal, setShowRequestModal] = useState(false); // Modal para pedido de seguimento
  const [modalContent, setModalContent] = useState({ title: '', list: [], type: '' });

  const mockProfiles = [
    {
      id: 1,
      username: 'tiago',
      name: 'Tiago',
      profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
      bio: 'Amante de viagens e fotografia!',
      country: 'Portugal',
      city: 'Lisboa',
      travelCount: 8,
      privacy: 'public',
      followers: ['AnaSilva', 'PedroCosta', 'SofiaRamos'],
      following: ['AnaSilva', 'JoaoPereira'],
    },
    {
      id: 2,
      username: 'AnaSilva',
      name: 'Ana',
      profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg',
      bio: 'Exploradora de montanhas.',
      country: 'Brasil',
      city: 'Rio de Janeiro',
      travelCount: 5,
      privacy: 'private',
      followers: ['TiagoMiranda', 'MariaOliveira'],
      following: ['PedroCosta'],
    },
    {
      id: 3,
      username: 'PedroCosta',
      name: 'Pedro',
      profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg',
      bio: 'Apaixonado por culturas.',
      country: 'Espanha',
      city: 'Madrid',
      travelCount: 12,
      privacy: 'public',
      followers: ['TiagoMiranda', 'AnaSilva'],
      following: ['SofiaRamos', 'JoaoPereira'],
    },
    {
      id: 4,
      username: 'SofiaRamos',
      name: 'Sofia',
      profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg',
      bio: 'Viajante urbana e foodie.',
      country: 'Portugal',
      city: 'Porto',
      travelCount: 6,
      privacy: 'private',
      followers: ['TiagoMiranda'],
      following: ['PedroCosta'],
    },
    {
      id: 5,
      username: 'JoaoPereira',
      name: 'João',
      profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg',
      bio: 'Aventura é meu lema!',
      country: 'Brasil',
      city: 'São Paulo',
      travelCount: 9,
      privacy: 'public',
      followers: ['TiagoMiranda', 'PedroCosta'],
      following: ['AnaSilva'],
    },
    {
      id: 6,
      username: 'MariaOliveira',
      name: 'Maria',
      profilePicture: 'https://randomuser.me/api/portraits/women/6.jpg',
      bio: 'História e arte em cada destino.',
      country: 'Itália',
      city: 'Roma',
      travelCount: 4,
      privacy: 'private',
      followers: ['AnaSilva'],
      following: ['TiagoMiranda'],
    },
    {
      id: 7,
      username: 'LucasSantos',
      name: 'Lucas',
      profilePicture: 'https://randomuser.me/api/portraits/men/7.jpg',
      bio: 'Sempre em busca do próximo voo.',
      country: 'EUA',
      city: 'Nova York',
      travelCount: 7,
      privacy: 'public',
      followers: ['SofiaRamos'],
      following: ['JoaoPereira'],
    },
    {
      id: 8,
      username: 'BeatrizLima',
      name: 'Beatriz',
      profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg',
      bio: 'Natureza é meu refúgio.',
      country: 'Canadá',
      city: 'Vancouver',
      travelCount: 3,
      privacy: 'private',
      followers: ['MariaOliveira'],
      following: ['AnaSilva'],
    },
    {
      id: 9,
      username: 'Teste',
      name: 'Teste',
      profilePicture: 'https://randomuser.me/api/portraits/women/8.jpg',
      bio: 'Natureza é meu refúgio.',
      country: 'Canadá',
      city: 'Vancouver',
      travelCount: 3,
      privacy: 'private',
      followers: ['MariaOliveira'],
      following: ['AnaSilva'],
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      const foundProfile = mockProfiles.find((p) => p.username === username);
      if (!foundProfile) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(foundProfile);
      setFollowers(foundProfile.followers || []);
      const userTravels = TravelsData.filter((travel) => travel.user === foundProfile.username);
      setTravels(userTravels);
      if (user) {
        setFollowing(['AnaSilva', 'PedroCosta']);
      }
      setLoading(false);
    }, 1000);
  }, [username, user]);

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  const handleFollow = () => {
    if (!user) {
      alert('Faça login para seguir usuários.');
      return;
    }
    if (profile.privacy === 'public') {
      setFollowing([...following, profile.username]);
      setFollowers([...followers, user.username]);
    } else {
      setPendingRequests([...pendingRequests, profile.username]);
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
  };

  const handleCancelRequest = () => {
    setPendingRequests(pendingRequests.filter((u) => u !== profile.username));
  };

  const openFollowModal = (title, list) => {
    console.log('Abrindo Follow Modal:', title, list); // Debug
    setModalContent({ title, list, type: 'follow' });
    setShowFollowModal(true);
  };

  const closeFollowModal = () => {
    console.log('Fechando Follow Modal'); // Debug
    setShowFollowModal(false);
    setModalContent({ title: '', list: [], type: '' });
  };

  const openStatsModal = (title, list, type = '') => {
    console.log('Abrindo Stats Modal:', title, list, type); // Debug
    setModalContent({ title, list, type });
    setShowStatsModal(true);
  };

  const closeStatsModal = () => {
    console.log('Fechando Stats Modal'); // Debug
    setShowStatsModal(false);
    setModalContent({ title: '', list: [], type: '' });
  };

  if (loading) return <div className="user-profile-page"><div className="loading-spinner"></div></div>;
  if (!profile) return <div className="user-profile-page"><p>Viajante não encontrado.</p></div>;

  const isFollowing = following.includes(profile.username);
  const isPending = pendingRequests.includes(profile.username);
  const isOwnProfile = user && user.username === profile.username;
  const visibleTravels = travels;

  const canViewDetails = isOwnProfile || profile.privacy === 'public' || (profile.privacy === 'private' && isFollowing);

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

  return (
    <div className="user-profile-page">
      <header className="profile-header">
        <div className="profile-picture-container">
          <img
            src={profile.profilePicture || defaultAvatar}
            alt={`${profile.username}'s avatar`}
            className="profile-picture"
          />
        </div>
        <div className="stats">
          <span onClick={() => openFollowModal('Seguidores', followers)} className="stat-item">
            <strong>{followers.length}</strong> Seguidores
          </span>
          <span onClick={() => openFollowModal('A Seguir', profile.following)} className="stat-item">
            <strong>{profile.following.length}</strong> A Seguir
          </span>
          <span className="stat-item">
            <strong>{visibleTravels.length}</strong> Viagens
          </span>
        </div>
        <div className="profile-info">
          {isOwnProfile && (
            <Link to={`/profile/edit/${profile.username}`} className="edit-button">
              Editar Perfil
            </Link>
          )}
          {!isOwnProfile && user && (
            <div className="user-actions">
              {isFollowing ? (
                <button
                  className="unfollow-button"
                  onClick={handleUnfollow}
                >
                  Não seguir
                </button>
              ) : isPending ? (
                <button
                  className="pending-button"
                  onClick={handleCancelRequest}
                >
                  Pendente
                </button>
              ) : (
                <button
                  className="follow-button"
                  onClick={handleFollow}
                >
                  {profile.privacy === 'public' ? 'Seguir' : 'Pedir para seguir'}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="profile-right">
          <h1>
            {profile.name}
            {user && following.includes(profile.username) && (
              <span className="following-text">
                <FaCheck className="following-icon" /> A seguir
              </span>
            )}
          </h1>
          <p className="bio">{profile.bio || 'Sem bio'}</p>
          <p className="location">
            {profile.city && profile.country ? `${profile.city}, ${profile.country}` : 'Localização não especificada'}
          </p>
        </div>
      </header>

      <section className="profile-content">
        {canViewDetails ? (
          <>
            <div className="travels-section">
              <div className="travels-header">
                {isOwnProfile && user && (
                  <Link to="/my-travels" className="manage-travels-button">
                    Gerir as minhas Viagens
                  </Link>
                )}
              </div>
              {visibleTravels.length > 0 ? (
                <div className="travels-grid">
                  {visibleTravels.map((travel) => (
                    <div key={travel.id} className="travel-card">
                      <Link to={`/travel/${travel.id}`}>
                        <div className="travel-content">
                          <img src={travel.highlightImage} alt={travel.name} className="highlight-image" />
                          <div className="travel-text">
                            <h2>{travel.name}</h2>
                            <p><b>👤 Utilizador:</b> {travel.user}</p>
                            <p><b>🌍 País:</b> {travel.country}</p>
                            <p><b>🏙️ Cidade:</b> {travel.city}</p>
                            <p><b>🗂️ Categoria:</b> {travel.category.join(', ')}</p>
                            <p><b>📅 Duração da Viagem:</b> {travel.days} dias</p>
                            <p><b>💰 Preço Total da Viagem:</b> {travel.price}€</p>
                            <p><strong>Avaliação Geral:</strong> {renderStars(travel.stars)}</p>
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

            <div className="traveler-stats-section">
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
            </div>

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

      {/* Modal para Seguidores/Seguindo */}
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

      {/* Modal para Estatísticas */}
      {showStatsModal && (
        <div className="stats-modal-overlay" onClick={closeStatsModal}>
          <div className="stats-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalContent.title}</h2>
            {modalContent.type === 'expense' ? (
              <>
                <h3>Top 3 - Viagens Mais Caras</h3>
                <ul>
                  {modalContent.list.slice(0, 3).map((travel) => (
                    <li key={travel.id}>
                      {travel.name} - {travel.price ? `${travel.price.toLocaleString()} €` : 'Preço não disponível'}
                    </li>
                  ))}
                </ul>
                <h3>Top 3 - Viagens Mais Baratas</h3>
                <ul>
                  {modalContent.list.slice(-3).map((travel) => (
                    <li key={travel.id}>
                      {travel.name} - {travel.price ? `${travel.price.toLocaleString()} €` : 'Preço não disponível'}
                    </li>
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

      {/* Modal de sucesso para pedido de seguimento */}
      {showRequestModal && (
        <div className="request-modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="request-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Sucesso!</h2>
            <p>Pedido enviado com sucesso. <br />Aguarde até que o Viajante aceite o seu pedido!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;