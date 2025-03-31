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
} from 'react-icons/fa';
import '../styles/styles.css';

// Dados mockados para visualizações e likes dados pelo usuário (simulando o backend)
const mockUserActions = {
  AnaSilva: {
    viewedTravels: ['3', '3', '3', '3', '3'], // Visualizou a viagem de ID '3' 5 vezes (para "Explorador Curioso")
    likedTravels: ['3'], // Deu like na viagem de ID '3' (para "Primeiro Like")
  },
  TiagoMiranda: {
    viewedTravels: ['1'], // Visualizou apenas 1 viagem
    likedTravels: [], // Não deu like em nenhuma viagem
  },
};

const achievements = [
  // Conquistas Existentes
  {
    id: 'explorer-1',
    name: 'Explorador Iniciante',
    description: 'Compartilhe sua primeira viagem',
    icon: <FaTrophy />,
    condition: (travelsCount) => travelsCount >= 1,
  },
  {
    id: 'globe-trotter',
    name: 'Globe Trotter',
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
    name: 'Viajante Econômico',
    description: 'Gastar menos de €500 em uma viagem',
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
    description: 'Escrever uma descrição com mais de 100 palavras em uma viagem',
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
    description: 'Receber 5 estrelas em uma viagem publicada',
    icon: <FaStar />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.stars === 5);
    },
  },
  {
    id: 'social-explorer',
    name: 'Explorador Social',
    description: 'Comentar em 3 viagens de outros usuários',
    icon: <FaComment />,
    condition: (userComments) => userComments.length >= 3,
  },

  // Novas Conquistas Fáceis
  {
    id: 'first-like',
    name: 'Primeiro Like',
    description: 'Dê like em uma viagem de outro usuário',
    icon: <FaHeart />,
    condition: (likedTravels) => likedTravels.length >= 1,
  },
  {
    id: 'curious-explorer',
    name: 'Explorador Curioso',
    description: 'Visualize 5 viagens de outros usuários',
    icon: <FaEye />,
    condition: (viewedTravels) => viewedTravels.length >= 5,
  },
  {
    id: 'organized-traveler',
    name: 'Viajante Organizado',
    description: 'Publique uma viagem com todas as informações preenchidas',
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
    description: 'Siga 1 pessoa',
    icon: <FaUserFriends />,
    condition: (followingCount) => followingCount >= 1,
  },

  // Novas Conquistas Difíceis
  {
    id: 'travel-master',
    name: 'Mestre das Viagens',
    description: 'Publique 20 viagens',
    icon: <FaMapMarkedAlt />,
    condition: (travelsCount) => travelsCount >= 20,
  },
  {
    id: 'globe-master',
    name: 'Globe Master',
    description: 'Visite 10 países diferentes',
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
    description: 'Receba 50 likes no total em suas viagens',
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
    description: 'Comente em 10 viagens de outros usuários',
    icon: <FaComment />,
    condition: (userComments) => userComments.length >= 10,
  },
  {
    id: 'legendary-traveler',
    name: 'Viajante Lendário',
    description: 'Tenha uma viagem com 5 estrelas e pelo menos 20 likes',
    icon: <FaCrown />,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.stars === 5 && travel.likes >= 20);
    },
  },
];

const Achievements = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="achievements-page">
        <h2>Conquistas</h2>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="achievements-page">
        <h2>Conquistas</h2>
        <p>Faça login para ver suas conquistas!</p>
      </div>
    );
  }

  // Calcular as viagens do usuário com base em TravelsData
  const userTravels = TravelsData.filter((travel) => travel.user === user.username);
  const travelsCount = userTravels.length;

  // Número de pessoas que o usuário segue e seguidores
  const followingCount = user.followingCount || 0;
  const followersCount = user.followersCount || 0;

  // Usuários que o usuário segue (para a conquista "Amigo Global")
  const followingUsers = user.followingUsers || [];

  // Comentários do usuário em viagens de outros usuários
  const userComments = TravelsData.filter((travel) => travel.user !== user.username)
    .flatMap((travel) => travel.comments || [])
    .filter((comment) => comment.user === user.username);

  // Ações do usuário (visualizações e likes)
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
      achievement.id === 'organized-traveler'
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

  return (
    <div className="achievements-page">
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
        <p>Você ainda não desbloqueou nenhuma conquista. Continue explorando!</p>
      )}

      {/* Conquistas Bloqueadas */}
      {lockedAchievements.length > 0 && (
        <div className="achievements-section">
          <h3>Conquistas Bloqueadas ({lockedAchievements.length}/{achievements.length})</h3>
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