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
} from 'react-icons/fa';
import '../styles/styles.css';

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
  const progressPercentage = (userAchievements.length / achievements.length) * 100;

  return (
    <div className="achievements-page">
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <h2>Conquistas</h2>

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