// src/components/Achievements.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import TravelsData from '../data/travelsData';
import {
  FaTrophy,
  FaGlobe,
  FaUsers,
  FaMoneyBillWave,
  FaCamera,
  FaStar,
  FaComment,
  FaBook,
  FaUserFriends,
  FaHeart,
  FaEye,
  FaCheckCircle,
  FaMapMarkedAlt,
  FaThumbsUp,
  FaCrown,
  FaPlane,
  FaMountain,
  FaClock,
  FaGem,
  FaCompass,
  FaQuestionCircle
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../styles/pages/achievements.css';
// ...existing code...

// Dados simulados para visualizações e gostos dados pelo utilizador (simulando o backend)
const mockUserActions = {
  AnaSilva: {
    viewedTravels: ['3', '3', '3', '3', '3'], // Visualizou a viagem de ID '3' 5 vezes (para "Explorador Curioso")
    likedTravels: ['3'], // Deu gosto na viagem de ID '3' (para "Primeiro Gosto")
  },
  TiagoMiranda: {
    viewedTravels: ['1'], // Visualizou apenas 1 viagem
    likedTravels: [], // Não deu gosto em nenhuma viagem
  },
};

const achievements = [
  // Conquistas Existentes
  {
    id: 'explorer-1',
    name: 'Explorador Iniciante',
    description: 'Partilhe a sua primeira viagem',
    icon: <FaTrophy />,
    condition: (travelsCount) => travelsCount >= 1,
  },
  {
    id: 'globe-trotter',
    name: 'Trotador do Globo',
    description: 'Visite 3 países diferentes',
    icon: <FaGlobe />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      const uniqueCountries = new Set(userTravels.map((travel) => travel.country));
      return uniqueCountries.size >= 3;
    },
  },
  {
    id: 'social-butterfly',
    name: 'Borboleta Social',
    description: 'Siga 3 pessoas',
    icon: <FaUsers />,
    condition: (followingCount) => followingCount >= 3,
  },
  {
    id: 'budget-traveler',
    name: 'Viajante Económico',
    description: 'Gastar menos de 500 € numa viagem',
    icon: <FaMoneyBillWave />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.price < 500);
    },
  },
  {
    id: 'travel-photographer',
    name: 'Fotógrafo de Viagens',
    description: 'Publicar uma viagem com mais de 5 fotos',
    icon: <FaCamera />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.images_generalInformation?.length > 5);
    },
  },
  {
    id: 'popular',
    name: 'Popular',
    description: 'Ter 10 seguidores',
    icon: <FaUsers />,
    condition: (followersCount) => followersCount >= 10,
  },
  {
    id: 'frequent-adventurer',
    name: 'Aventureiro Frequente',
    description: 'Publicar 5 viagens',
    icon: <FaTrophy />,
    condition: (travelsCount) => travelsCount >= 5,
  },
  {
    id: 'storyteller',
    name: 'Contador de Histórias',
    description: 'Escrever uma descrição com mais de 100 palavras numa viagem',
    icon: <FaBook />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => {
        const words = travel.description?.split(/\s+/).filter(Boolean).length || 0;
        return words > 100;
      });
    },
  },
  {
    id: 'global-friend',
    name: 'Amigo Global',
    description: 'Seguir alguém de um país diferente do seu',
    icon: <FaUserFriends />,
    condition: (user, followingUsers) => {
      if (!user || !Array.isArray(followingUsers)) return false;
      const userCountry = user.country || 'Portugal';
      return followingUsers.some((followedUser) => followedUser.country && followedUser.country !== userCountry);
    },
  },
  {
    id: 'star-traveler',
    name: 'Viajante Estelar',
    description: 'Receber 5 estrelas numa viagem publicada',
    icon: <FaStar />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.stars === 5);
    },
  },
  {
    id: 'social-explorer',
    name: 'Explorador Social',
    description: 'Comentar em 3 viagens de outros utilizadores',
    icon: <FaComment />,
    condition: (userComments) => userComments.length >= 3,
  },
  {
    id: 'first-like',
    name: 'Primeiro Gosto',
    description: 'Dar gosto numa viagem de outro utilizador',
    icon: <FaHeart />,
    condition: (likedTravels) => likedTravels.length >= 1,
  },
  {
    id: 'curious-explorer',
    name: 'Explorador Curioso',
    description: 'Visualizar 5 viagens de outros utilizadores',
    icon: <FaEye />,
    condition: (viewedTravels) => viewedTravels.length >= 5,
  },
  {
    id: 'organized-traveler',
    name: 'Viajante Organizado',
    description: 'Publicar uma viagem com todas as informações preenchidas',
    icon: <FaCheckCircle />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) =>
        travel.name &&
        travel.description &&
        travel.country &&
        travel.city &&
        travel.startDate &&
        travel.endDate &&
        travel.price !== undefined &&
        travel.images_generalInformation?.length >= 1
      );
    },
  },
  {
    id: 'travel-friend',
    name: 'Amigo de Viagem',
    description: 'Seguir 1 pessoa',
    icon: <FaUserFriends />,
    condition: (followingCount) => followingCount >= 1,
  },
  {
    id: 'travel-master',
    name: 'Mestre das Viagens',
    description: 'Publicar 20 viagens',
    icon: <FaMapMarkedAlt />,
    condition: (travelsCount) => travelsCount >= 20,
  },
  {
    id: 'globe-master',
    name: 'Mestre do Globo',
    description: 'Visitar 10 países diferentes',
    icon: <FaGlobe />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      const uniqueCountries = new Set(userTravels.map((travel) => travel.country));
      return uniqueCountries.size >= 10;
    },
  },
  {
    id: 'travel-influencer',
    name: 'Influenciador de Viagens',
    description: 'Receber 50 gostos no total nas suas viagens',
    icon: <FaThumbsUp />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      const totalLikes = userTravels.reduce((sum, travel) => sum + (travel.likes || 0), 0);
      return totalLikes >= 50;
    },
  },
  {
    id: 'travel-critic',
    name: 'Crítico de Viagens',
    description: 'Comentar em 10 viagens de outros utilizadores',
    icon: <FaComment />,
    condition: (userComments) => userComments.length >= 10,
  },
  {
    id: 'legendary-traveler',
    name: 'Viajante Lendário',
    description: 'Ter uma viagem com 5 estrelas e pelo menos 20 gostos',
    icon: <FaCrown />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.stars === 5 && travel.likes >= 20);
    },
  },

  // Novas Conquistas Médias
  {
    id: 'weekend-warrior',
    name: 'Guerreiro de Fim de Semana',
    description: 'Publicar uma viagem com duração de 2 a 3 dias',
    icon: <FaClock />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => {
        const start = new Date(travel.startDate);
        const end = new Date(travel.endDate);
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);
        return diffDays >= 2 && diffDays <= 3;
      });
    },
  },
  {
    id: 'mountain-explorer',
    name: 'Explorador de Montanhas',
    description: 'Visitar 3 cidades com altitude superior a 1000 metros',
    icon: <FaMountain />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      // Simulação: assume que algumas cidades têm altitude > 1000m (necessita de dados reais)
      const highAltitudeCities = userTravels.filter((travel) => travel.city === 'La Paz' || travel.city === 'Cusco' || travel.city === 'Quito');
      return highAltitudeCities.length >= 3;
    },
  },
  {
    id: 'frequent-flyer',
    name: 'Viajante Frequente',
    description: 'Fazer 5 viagens de avião',
    icon: <FaPlane />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.filter((travel) => travel.transport === 'plane').length >= 5;
    },
  },

  // Novas Conquistas Difíceis
  {
    id: 'world-conqueror',
    name: 'Conquistador do Mundo',
    description: 'Visitar 25 países diferentes',
    icon: <FaGlobe />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      const uniqueCountries = new Set(userTravels.map((travel) => travel.country));
      return uniqueCountries.size >= 25;
    },
  },
  {
    id: 'marathon-traveler',
    name: 'Viajante Maratonista',
    description: 'Fazer uma viagem com mais de 30 dias de duração',
    icon: <FaCompass />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => {
        const start = new Date(travel.startDate);
        const end = new Date(travel.endDate);
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);
        return diffDays > 30;
      });
    },
  },
  {
    id: 'treasure-hunter',
    name: 'Caçador de Tesouros',
    description: 'Receber 100 gostos numa única viagem',
    icon: <FaGem />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.likes >= 100);
    },
  },
];

const Achievements = () => {
  const { user, loading } = useAuth();
  const [showPointsModal, setShowPointsModal] = React.useState(false);

  if (loading) {
    return (
      <div className="achievements-page">
        <h2>Conquistas</h2>
        <p>A carregar...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="achievements-page">
        <h2>Conquistas</h2>
        <p>Inicie sessão para ver as suas conquistas!</p>
      </div>
    );
  }

  // Calcular as viagens do utilizador com base em TravelsData
  const userTravels = TravelsData.filter((travel) => travel.user === user.username);
  const travelsCount = userTravels.length;

  // Número de pessoas que o utilizador segue e seguidores
  const followingCount = user.followingCount || 0;
  const followersCount = user.followersCount || 0;

  // Utilizadores que o utilizador segue (para a conquista "Amigo Global")
  const followingUsers = user.followingUsers || [];

  // Comentários do utilizador em viagens de outros utilizadores
  const userComments = TravelsData.filter((travel) => travel.user !== user.username)
    .flatMap((travel) => travel.comments || [])
    .filter((comment) => comment.user === user.username);

  // Ações do utilizador (visualizações e gostos)
  const userActions = mockUserActions[user.username] || { viewedTravels: [], likedTravels: [] };
  const viewedTravels = userActions.viewedTravels || [];
  const likedTravels = userActions.likedTravels || [];

  // Pontuação por interação (nova tabela de pontos)
  const POINTS = {
    travel: 50,           // Criar uma viagem
    media: 10,            // Adicionar imagens/vídeos à viagem
    likeReceived: 2,      // Receber um gosto numa viagem
    commentReceived: 3,   // Receber um comentário numa viagem
    commentGiven: 1,      // Comentar a viagem de outro utilizador
    likeGiven: 1,         // Gostar de uma viagem de outro utilizador
    profileComplete: 20,  // Completar o perfil
    achievement: 15,      // Conquistar um troféu
    allAchievements: 250  // Completar todas as conquistas
  };

  // Função para verificar se o perfil está completo
  function isProfileComplete(userObj) {
    return !!(userObj?.bio && userObj?.profilePicture && userObj?.country && userObj?.city);
  }

  // Função para calcular pontos de um utilizador
  function calculateUserPoints(userObj) {
    const userTravels = TravelsData.filter((travel) => travel.user === userObj.username);
    const travelsCount = userTravels.length;
    const mediaCount = userTravels.reduce((sum, travel) => sum + (travel.images_generalInformation?.length || 0), 0);
    const likesReceived = userTravels.reduce((sum, travel) => sum + (travel.likes || 0), 0);
    const commentsReceived = userTravels.reduce((sum, travel) => sum + (travel.comments?.length || 0), 0);

    // Comentários feitos pelo utilizador em viagens de outros
    const commentsMade = TravelsData
      .filter((travel) => travel.user !== userObj.username)
      .flatMap((travel) => travel.comments || [])
      .filter((comment) => comment.user === userObj.username).length;

    // Gostos dados pelo utilizador em viagens de outros
    // Simulação: considera que cada viagem tem um array likedBy
    const likesGiven = TravelsData
      .filter((travel) => travel.user !== userObj.username)
      .reduce((sum, travel) => sum + ((travel.likedBy?.includes(userObj.username)) ? 1 : 0), 0);

    // Perfil completo
    const profileComplete = isProfileComplete(userObj) ? POINTS.profileComplete : 0;

    // Conquistas desbloqueadas
    const userAchievementsCount = achievements.filter((achievement) => {
      if (
        achievement.id === 'explorer-1' ||
        achievement.id === 'frequent-adventurer' ||
        achievement.id === 'travel-master'
      ) {
        return achievement.condition(travelsCount);
      }
      if (
        achievement.id === 'globe-trotter' ||
        achievement.id === 'globe-master' ||
        achievement.id === 'budget-traveler' ||
        achievement.id === 'travel-photographer' ||
        achievement.id === 'storyteller' ||
        achievement.id === 'star-traveler' ||
        achievement.id === 'travel-influencer' ||
        achievement.id === 'legendary-traveler' ||
        achievement.id === 'organized-traveler' ||
        achievement.id === 'weekend-warrior' ||
        achievement.id === 'mountain-explorer' ||
        achievement.id === 'frequent-flyer' ||
        achievement.id === 'world-conqueror' ||
        achievement.id === 'marathon-traveler' ||
        achievement.id === 'treasure-hunter'
      ) {
        return achievement.condition(userTravels);
      }
      if (achievement.id === 'social-butterfly' || achievement.id === 'travel-friend') {
        return achievement.condition(userObj.followingCount || 0);
      }
      if (achievement.id === 'popular') {
        return achievement.condition(userObj.followersCount || 0);
      }
      if (achievement.id === 'global-friend') {
        return achievement.condition(userObj, userObj.followingUsers || []);
      }
      if (achievement.id === 'social-explorer' || achievement.id === 'travel-critic') {
        const userComments = TravelsData.filter((travel) => travel.user !== userObj.username)
          .flatMap((travel) => travel.comments || [])
          .filter((comment) => comment.user === userObj.username);
        return achievement.condition(userComments);
      }
      if (achievement.id === 'first-like') {
        // Simulação: considera que todos deram pelo menos um gosto
        return true;
      }
      if (achievement.id === 'curious-explorer') {
        // Simulação: considera que todos visualizaram pelo menos 5 viagens
        return true;
      }
      return false;
    }).length;

    let points =
      travelsCount * POINTS.travel +
      mediaCount * POINTS.media +
      likesReceived * POINTS.likeReceived +
      commentsReceived * POINTS.commentReceived +
      commentsMade * POINTS.commentGiven +
      likesGiven * POINTS.likeGiven +
      profileComplete +
      userAchievementsCount * POINTS.achievement;

    // Bónus por todas as conquistas desbloqueadas
    if (userAchievementsCount === achievements.length) {
      points += POINTS.allAchievements;
    }

    return points;
  }

  // Leaderboard (mock + user autenticado)
  const allUsers = [
    ...mockUsers,
    user && !mockUsers.some(u => u.username === user.username)
      ? { ...user }
      : null
  ].filter(Boolean);

  const leaderboard = allUsers.map(u => ({
    username: u.username,
    country: u.country,
    profilePicture: u.profilePicture || '/static/media/avatar.55c3eb5641681d05db07.jpg',
    points: calculateUserPoints(u),
  })).sort((a, b) => b.points - a.points);

  const userLeaderboardIndex = leaderboard.findIndex(u => u.username === user.username) + 1;
  const userPoints = leaderboard.find(u => u.username === user.username)?.points || 0;

  // Calcular conquistas desbloqueadas
  const userAchievements = achievements.filter((achievement) => {
    if (
      achievement.id === 'explorer-1' ||
      achievement.id === 'frequent-adventurer' ||
      achievement.id === 'travel-master'
    ) {
      return achievement.condition(travelsCount);
    }
    if (
      achievement.id === 'globe-trotter' ||
      achievement.id === 'globe-master' ||
      achievement.id === 'budget-traveler' ||
      achievement.id === 'travel-photographer' ||
      achievement.id === 'storyteller' ||
      achievement.id === 'star-traveler' ||
      achievement.id === 'travel-influencer' ||
      achievement.id === 'legendary-traveler' ||
      achievement.id === 'organized-traveler' ||
      achievement.id === 'weekend-warrior' ||
      achievement.id === 'mountain-explorer' ||
      achievement.id === 'frequent-flyer' ||
      achievement.id === 'world-conqueror' ||
      achievement.id === 'marathon-traveler' ||
      achievement.id === 'treasure-hunter'
    ) {
      return achievement.condition(userTravels);
    }
    if (achievement.id === 'social-butterfly' || achievement.id === 'travel-friend') {
      return achievement.condition(followingCount);
    }
    if (achievement.id === 'popular') {
      return achievement.condition(followersCount);
    }
    if (achievement.id === 'global-friend') {
      return achievement.condition(user, followingUsers);
    }
    if (achievement.id === 'social-explorer' || achievement.id === 'travel-critic') {
      return achievement.condition(userComments);
    }
    if (achievement.id === 'first-like') {
      return achievement.condition(likedTravels);
    }
    if (achievement.id === 'curious-explorer') {
      return achievement.condition(viewedTravels);
    }
    return false;
  });

  // Calcular conquistas não desbloqueadas
  const lockedAchievements = achievements.filter(
    (achievement) => !userAchievements.includes(achievement)
  );

  // Calcular progresso (percentagem de conquistas desbloqueadas)
  const progressPercentage = achievements.length > 0
    ? Math.min(100, Math.max(0, Math.round((userAchievements.length / achievements.length) * 100)))
    : 0;

  return (
    <div className="achievements-page">
      <div 
        className="progress-bar-A-container" 
        aria-hidden={false} 
        aria-label={`Progresso de conquistas: ${progressPercentage}%`}
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin="0"
        aria-valuemax="100"
      > 
        <div
          className="progress-bar-A"
          style={{ 
            width: `${progressPercentage}%`,
            opacity: progressPercentage > 0 ? 1 : 0
          }}
        />
        <span className="progress-text">
          {progressPercentage}% Completo
        </span>
      </div>
      <h2>
        Conquistas
        <span
          style={{ marginLeft: 10, cursor: 'pointer', verticalAlign: 'middle' }}
          title="Como ganhar pontos?"
          onClick={() => setShowPointsModal(true)}
        >
          <FaQuestionCircle color="#1976d2" size={22} />
        </span>
      </h2>

      {/* Modal de regras de pontos */}
      {showPointsModal && (
        <div
          className="points-modal-overlay"
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.35)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setShowPointsModal(false)}
        >
          <div
            className="points-modal-content"
            style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #fff 100%)',
              borderRadius: 18,
              maxWidth: 720,
              width: '90vw',
              padding: '36px 28px 28px 28px',
              boxShadow: '0 8px 32px rgba(25, 118, 210, 0.18)',
              position: 'relative',
              textAlign: 'center',
              border: '1px solid #1976d2'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{
              marginBottom: 18,
              color: '#1976d2',
              fontWeight: 700,
              fontSize: '1.35em',
              letterSpacing: '0.5px'
            }}>
              Como ganhar pontos?
            </h2>
            <div style={{
              marginBottom: 18,
              fontSize: '1.08em',
              color: '#333',
              textAlign: 'left',
              background: '#f5faff',
              borderRadius: 10,
              padding: '18px 16px',
              boxShadow: '0 2px 8px rgba(25,118,210,0.07)'
            }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>Criar uma viagem</span>
                  <span style={{ float: 'right', color: '#388e3c', fontWeight: 600 }}>+50 pontos</span>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>Adicionar imagens à viagem</span>
                  <span style={{ float: 'right', color: '#388e3c', fontWeight: 600 }}>+10 pontos</span>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>Receber um gosto numa viagem</span>
                  <span style={{ float: 'right', color: '#388e3c', fontWeight: 600 }}>+2 pontos</span>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>Receber um comentário numa viagem</span>
                  <span style={{ float: 'right', color: '#388e3c', fontWeight: 600 }}>+3 pontos</span>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>Comentar a viagem de outro utilizador</span>
                  <span style={{ float: 'right', color: '#388e3c', fontWeight: 600 }}>+1 ponto</span>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>Gostar de uma viagem de outro utilizador</span>
                  <span style={{ float: 'right', color: '#388e3c', fontWeight: 600 }}>+1 ponto</span>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>Completar o perfil (bio, foto, etc.)</span>
                  <span style={{ float: 'right', color: '#388e3c', fontWeight: 600 }}>+20 pontos</span>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>Conquistar um troféu</span>
                  <span style={{ float: 'right', color: '#388e3c', fontWeight: 600 }}>+15 pontos</span>
                </li>
                <li>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>Completar todas as conquistas</span>
                  <span style={{ float: 'right', color: '#388e3c', fontWeight: 600 }}>+250 pontos</span>
                </li>
              </ul>
              <div style={{ clear: 'both' }}></div>
            </div>
            <button
              style={{
                marginTop: 8,
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 32px',
                fontWeight: 'bold',
                fontSize: '1.08em',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(25,118,210,0.09)'
              }}
              onClick={() => setShowPointsModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Pontos do utilizador */}
      <div style={{ margin: '18px 0', fontWeight: 'bold', fontSize: '1.15em' }}>
        Pontos: <span style={{ color: '#1976d2' }}>{userPoints}</span>
        {userLeaderboardIndex > 0 && (
          <span style={{ marginLeft: 18 }}>
            | Posição no Leaderboard: <span style={{ color: '#28a745' }}>{userLeaderboardIndex}º</span>
          </span>
        )}
      </div>

      {/* Leaderboard */}
      <div className="leaderboard-section" style={{ marginBottom: 32 }}>
        <h3>🏆 Leaderboard de Pontos</h3>
        <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Posição</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Foto de Perfil</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nome do Utilizador</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((u, idx) => (
              <tr key={u.username} style={u.username === user.username ? { background: '#e3fcec', fontWeight: 'bold' } : {}}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{idx + 1}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <img src={u.profilePicture} alt={u.username} style={{ width: 38, height: 38, borderRadius: '50%' }} />
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <Link
                    to={`/profile/${u.username}`}
                    style={{
                      color: '#1976d2',
                      textDecoration: 'underline',
                      fontWeight: 600,
                      fontSize: '1em'
                    }}
                  >
                    {u.username}
                  </Link>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Conquistas Desbloqueadas */}
      {userAchievements.length > 0 ? (
        <div className="achievements-section">
          <h3>Conquistas Desbloqueadas ({userAchievements.length}/{achievements.length})</h3>
          <div className="achievements-list">
            {userAchievements.map((achievement) => (
              <div key={achievement.id} className="achievement-item unlocked">
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-details">
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>Ainda não desbloqueou nenhuma conquista. Continue a explorar!</p>
      )}

      {/* Conquistas Bloqueadas */}
      {lockedAchievements.length > 0 && (
        <div className="achievements-section">
          <h3>Conquistas Bloqueadas</h3>
          <div className="achievements-list">
            {lockedAchievements.map((achievement) => (
              <div key={achievement.id} className="achievement-item locked">
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-details">
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Achievements;

// Mock de utilizadores para leaderboard (simulação)
const mockUsers = [
  {
    username: 'AnaSilva',
    country: 'Portugal',
    profilePicture: '/static/media/avatar.55c3eb5641681d05db07.jpg',
    followingCount: 5,
    followersCount: 12,
    followingUsers: [],
    bio: 'Viajante apaixonada por cultura.',
    city: 'Lisboa'
  },
  {
    username: 'TiagoMiranda',
    country: 'Brasil',
    profilePicture: '/static/media/avatar.55c3eb5641681d05db07.jpg',
    followingCount: 3,
    followersCount: 8,
    followingUsers: [],
    bio: 'Amo aventuras!',
    city: 'Rio de Janeiro'
  },
  {
    username: 'PedroCosta',
    country: 'Espanha',
    profilePicture: '/static/media/avatar.55c3eb5641681d05db07.jpg',
    followingCount: 2,
    followersCount: 5,
    followingUsers: [],
    bio: 'Explorador de montanhas.',
    city: 'Madrid'
  },
  // ...adicione mais utilizadores se quiser...
];