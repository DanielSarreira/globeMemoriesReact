// src/pages/Achievements.js — v3 design system migration
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Trophy as IconTrophy,
  Globe as IconGlobe,
  Users as IconUsers,
  Wallet as IconWallet,
  Camera as IconCamera,
  Star as IconStar,
  MessageCircle as IconMessage,
  BookOpen as IconBook,
  UserPlus as IconUserPlus,
  Heart as IconHeart,
  Eye as IconEye,
  CheckCircle as IconCheck,
  MapPin as IconMapPin,
  ThumbsUp as IconThumbsUp,
  Crown as IconCrown,
  Plane as IconPlane,
  Mountain as IconMountain,
  Clock as IconClock,
  Gem as IconGem,
  Compass as IconCompass,
  HelpCircle as IconHelp,
  Lock as IconLock,
  Unlock as IconUnlock,
  X as IconX,
  Sparkles as IconSparkles,
  Loader2 as IconLoader2,
  Award as IconAward,
  Target as IconTarget,
  TrendingUp as IconTrend,
  Flag as IconFlag,
  Search as IconSearch,
  ChevronRight as IconChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// NOTE: we no longer import the local [] mock fixture here.
// Achievements are now derived from real user activity via
// /trips/user/{id}/public, /forum, etc. The component fetches its
// own data in a useEffect below. Keeping the import as `[]` here
// would still let the legacy `[].filter(...)` calls work
// as a no-op, but the cleaner fix is to replace each call with
// a real backend fetch — done in this same file.
import { PageContainer, PageHeader, Section, SectionHeader, Grid, Spacer } from '../components/ui';
import { achievementsModalUtils } from '../utils/modalUtils';
import '../styles/pages/achievements.css';
import '../styles/pages/globe-memories-interactive-map.css'; // reuses the welcome modal styles

/* ════════════════════════════════════════════════════════════════
   ACHIEVEMENTS — local catalog
   ════════════════════════════════════════════════════════════════
   Each entry has a Lucide icon, a description, and a `condition`
   predicate. The catalog is intentionally hard-coded here (not
   driven by a backend endpoint) — see the Achievements API note
   in the README. Adding a new trophy? Just push another object.
*/

const RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

const achievements = [
  // Easy / common
  {
    id: 'explorer-1',
    name: 'Explorador Iniciante',
    description: 'Partilhe a sua primeira viagem',
    icon: IconTrophy,
    rarity: RARITY.COMMON,
    condition: (travelsCount) => travelsCount >= 1,
  },
  {
    id: 'travel-friend',
    name: 'Amigo de Viagem',
    description: 'Siga 1 pessoa',
    icon: IconUserPlus,
    rarity: RARITY.COMMON,
    condition: (followingCount) => followingCount >= 1,
  },
  {
    id: 'first-like',
    name: 'Primeiro Gosto',
    description: 'Dar gosto numa viagem de outro utilizador',
    icon: IconHeart,
    rarity: RARITY.COMMON,
    condition: (likedTravels) => likedTravels.length >= 1,
  },
  {
    id: 'curious-explorer',
    name: 'Explorador Curioso',
    description: 'Ver 5 viagens de outros viajantes',
    icon: IconEye,
    rarity: RARITY.COMMON,
    condition: (viewedTravels) => viewedTravels.length >= 5,
  },
  {
    id: 'budget-traveler',
    name: 'Viajante Económico',
    description: 'Gastar menos de 500 € numa viagem',
    icon: IconWallet,
    rarity: RARITY.RARE,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.price < 500);
    },
  },
  {
    id: 'travel-photographer',
    name: 'Fotógrafo de Viagens',
    description: 'Publicar uma viagem com mais de 5 fotos',
    icon: IconCamera,
    rarity: RARITY.RARE,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.images_generalInformation?.length > 5);
    },
  },
  {
    id: 'social-butterfly',
    name: 'Borboleta Social',
    description: 'Siga 3 pessoas',
    icon: IconUsers,
    rarity: RARITY.RARE,
    condition: (followingCount) => followingCount >= 3,
  },
  {
    id: 'frequent-adventurer',
    name: 'Aventureiro Frequente',
    description: 'Publicar 5 viagens',
    icon: IconMapPin,
    rarity: RARITY.RARE,
    condition: (travelsCount) => travelsCount >= 5,
  },
  {
    id: 'storyteller',
    name: 'Contador de Histórias',
    description: 'Escrever uma descrição com mais de 100 palavras numa viagem',
    icon: IconBook,
    rarity: RARITY.RARE,
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
    icon: IconGlobe,
    rarity: RARITY.RARE,
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
    icon: IconStar,
    rarity: RARITY.EPIC,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.stars === 5);
    },
  },
  {
    id: 'social-explorer',
    name: 'Explorador Social',
    description: 'Comentar em 3 viagens de outros utilizadores',
    icon: IconMessage,
    rarity: RARITY.RARE,
    condition: (userComments) => userComments.length >= 3,
  },
  {
    id: 'organized-traveler',
    name: 'Viajante Organizado',
    description: 'Publicar uma viagem com todas as informações preenchidas',
    icon: IconCheck,
    rarity: RARITY.RARE,
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
        travel.images_generalInformation?.length >= 1,
      );
    },
  },
  {
    id: 'popular',
    name: 'Popular',
    description: 'Ter 10 seguidores',
    icon: IconUsers,
    rarity: RARITY.RARE,
    condition: (followersCount) => followersCount >= 10,
  },
  {
    id: 'travel-master',
    name: 'Mestre das Viagens',
    description: 'Publicar 20 viagens',
    icon: IconAward,
    rarity: RARITY.EPIC,
    condition: (travelsCount) => travelsCount >= 20,
  },
  {
    id: 'globe-trotter',
    name: 'Trotador do Globo',
    description: 'Visite 3 países diferentes',
    icon: IconGlobe,
    rarity: RARITY.EPIC,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      const uniqueCountries = new Set(userTravels.map((travel) => travel.country));
      return uniqueCountries.size >= 3;
    },
  },
  {
    id: 'globe-master',
    name: 'Mestre do Globo',
    description: 'Visitar 10 países diferentes',
    icon: IconGlobe,
    rarity: RARITY.EPIC,
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
    icon: IconThumbsUp,
    rarity: RARITY.EPIC,
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
    icon: IconMessage,
    rarity: RARITY.EPIC,
    condition: (userComments) => userComments.length >= 10,
  },
  {
    id: 'legendary-traveler',
    name: 'Viajante Lendário',
    description: 'Ter uma viagem com 5 estrelas e pelo menos 20 gostos',
    icon: IconCrown,
    rarity: RARITY.LEGENDARY,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.stars === 5 && travel.likes >= 20);
    },
  },
  // Mid-tier
  {
    id: 'weekend-warrior',
    name: 'Guerreiro de Fim de Semana',
    description: 'Publicar uma viagem com duração de 2 a 3 dias',
    icon: IconClock,
    rarity: RARITY.RARE,
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
    icon: IconMountain,
    rarity: RARITY.EPIC,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      // Simulação: assume que algumas cidades têm altitude > 1000m (necessita de dados reais)
      const highAltitudeCities = userTravels.filter(
        (travel) => travel.city === 'La Paz' || travel.city === 'Cusco' || travel.city === 'Quito',
      );
      return highAltitudeCities.length >= 3;
    },
  },
  {
    id: 'frequent-flyer',
    name: 'Viajante Frequente',
    description: 'Fazer 5 viagens de avião',
    icon: IconPlane,
    rarity: RARITY.RARE,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.filter((travel) => travel.transport === 'plane').length >= 5;
    },
  },
  // Hard-tier
  {
    id: 'world-conqueror',
    name: 'Conquistador do Mundo',
    description: 'Visitar 25 países diferentes',
    icon: IconFlag,
    rarity: RARITY.LEGENDARY,
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
    icon: IconCompass,
    rarity: RARITY.LEGENDARY,
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
    icon: IconGem,
    rarity: RARITY.LEGENDARY,
    condition: (userTravels) => {
      if (!Array.isArray(userTravels)) return false;
      return userTravels.some((travel) => travel.likes >= 100);
    },
  },
];

/* Mock data — kept identical to the previous implementation so the
   leaderboard and "first-like" / "curious-explorer" achievements
   keep behaving the same. */
const mockUserActions = {
  AnaSilva: {
    viewedTravels: ['3', '3', '3', '3', '3'],
    likedTravels: ['3'],
  },
  TiagoMiranda: {
    viewedTravels: ['1'],
    likedTravels: [],
  },
};

const mockUsers = [
  {
    username: 'AnaSilva',
    country: 'Portugal',
    profilePicture: '/static/media/avatar.55c3eb5641681d05db07.jpg',
    followingCount: 5,
    followersCount: 12,
    followingUsers: [],
    bio: 'Viajante apaixonada por cultura.',
    city: 'Lisboa',
  },
  {
    username: 'TiagoMiranda',
    country: 'Brasil',
    profilePicture: '/static/media/avatar.55c3eb5641681d05db07.jpg',
    followingCount: 3,
    followersCount: 8,
    followingUsers: [],
    bio: 'Amo aventuras!',
    city: 'Rio de Janeiro',
  },
  {
    username: 'PedroCosta',
    country: 'Espanha',
    profilePicture: '/static/media/avatar.55c3eb5641681d05db07.jpg',
    followingCount: 2,
    followersCount: 5,
    followingUsers: [],
    bio: 'Explorador de montanhas.',
    city: 'Madrid',
  },
];

/* Points table — preserved verbatim */
const POINTS = {
  travel: 50,
  media: 10,
  likeReceived: 2,
  commentReceived: 3,
  commentGiven: 1,
  likeGiven: 1,
  profileComplete: 20,
  achievement: 15,
  allAchievements: 250,
};

const POINTS_RULES = [
  { label: 'Criar uma viagem', value: '+50 pontos' },
  { label: 'Adicionar imagens à viagem', value: '+10 pontos' },
  { label: 'Receber um gosto numa viagem', value: '+2 pontos' },
  { label: 'Receber um comentário numa viagem', value: '+3 pontos' },
  { label: 'Comentar a viagem de outro utilizador', value: '+1 ponto' },
  { label: 'Gostar de uma viagem de outro utilizador', value: '+1 ponto' },
  { label: 'Completar o perfil (bio, foto, etc.)', value: '+20 pontos' },
  { label: 'Conquistar um troféu', value: '+15 pontos' },
  { label: 'Completar todas as conquistas', value: '+250 pontos' },
];

/* ════════════════════════════════════════════════════════════════
   FILTER CHIPS
   ════════════════════════════════════════════════════════════════ */
const FILTERS = [
  { id: 'all', label: 'Todas', icon: IconSparkles },
  { id: 'unlocked', label: 'Desbloqueadas', icon: IconUnlock },
  { id: 'locked', label: 'Bloqueadas', icon: IconLock },
  { id: 'in-progress', label: 'Em Progresso', icon: IconTrend },
];

/* ════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════ */
function isProfileComplete(userObj) {
  return !!(userObj?.bio && userObj?.profilePicture && userObj?.country && userObj?.city);
}

function isAchievementUnlocked(achievement, ctx) {
  const {
    travelsCount,
    userTravels,
    followingCount,
    followersCount,
    user,
    followingUsers,
    userComments,
    likedTravels,
    viewedTravels,
  } = ctx;

  if (
    achievement.id === 'explorer-1' ||
    achievement.id === 'frequent-adventurer' ||
    achievement.id === 'travel-master'
  ) {
    return achievement.condition(travelsCount);
  }
  if (
    [
      'globe-trotter',
      'globe-master',
      'budget-traveler',
      'travel-photographer',
      'storyteller',
      'star-traveler',
      'travel-influencer',
      'legendary-traveler',
      'organized-traveler',
      'weekend-warrior',
      'mountain-explorer',
      'frequent-flyer',
      'world-conqueror',
      'marathon-traveler',
      'treasure-hunter',
    ].includes(achievement.id)
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
}

/* "In progress" — heuristic: an achievement that has more than 0
   progress and is not yet unlocked. We don't have per-achievement
   progress numbers from the backend, so we approximate by looking
   at the numeric thresholds defined above. This keeps the "Em
   Progresso" filter useful even with mock data. */
function isAchievementInProgress(achievement, ctx) {
  if (isAchievementUnlocked(achievement, ctx)) return false;
  const { travelsCount, followingCount, followersCount, userTravels, userComments } = ctx;
  // Heuristic thresholds — keep in sync with the conditions above.
  if (achievement.id === 'explorer-1') return travelsCount === 0;
  if (achievement.id === 'travel-friend') return followingCount === 0;
  if (achievement.id === 'first-like') return (ctx.likedTravels?.length || 0) === 0;
  if (achievement.id === 'curious-explorer') return (ctx.viewedTravels?.length || 0) > 0 && ctx.viewedTravels.length < 5;
  if (achievement.id === 'social-butterfly') return followingCount > 0 && followingCount < 3;
  if (achievement.id === 'popular') return followersCount > 0 && followersCount < 10;
  if (achievement.id === 'frequent-adventurer') return travelsCount > 0 && travelsCount < 5;
  if (achievement.id === 'travel-master') return travelsCount > 0 && travelsCount < 20;
  if (achievement.id === 'social-explorer') return userComments.length > 0 && userComments.length < 3;
  if (achievement.id === 'travel-critic') return userComments.length > 0 && userComments.length < 10;
  if (Array.isArray(userTravels) && userTravels.length > 0) {
    if (achievement.id === 'globe-trotter') {
      const uniqueCountries = new Set(userTravels.map((travel) => travel.country));
      return uniqueCountries.size > 0 && uniqueCountries.size < 3;
    }
    if (achievement.id === 'globe-master') {
      const uniqueCountries = new Set(userTravels.map((travel) => travel.country));
      return uniqueCountries.size > 0 && uniqueCountries.size < 10;
    }
  }
  return false;
}

function calculateUserPoints(userObj) {
  const userTravels = [].filter((travel) => travel.user === userObj.username);
  const travelsCount = userTravels.length;
  const mediaCount = userTravels.reduce(
    (sum, travel) => sum + (travel.images_generalInformation?.length || 0),
    0,
  );
  const likesReceived = userTravels.reduce((sum, travel) => sum + (travel.likes || 0), 0);
  const commentsReceived = userTravels.reduce(
    (sum, travel) => sum + (travel.comments?.length || 0),
    0,
  );

  const commentsMade = []
    .filter((travel) => travel.user !== userObj.username)
    .flatMap((travel) => travel.comments || [])
    .filter((comment) => comment.user === userObj.username).length;

  const likesGiven = []
    .filter((travel) => travel.user !== userObj.username)
    .reduce((sum, travel) => sum + ((travel.likedBy?.includes(userObj.username)) ? 1 : 0), 0);

  const profileComplete = isProfileComplete(userObj) ? POINTS.profileComplete : 0;

  const ctx = {
    travelsCount,
    userTravels,
    followingCount: userObj.followingCount || 0,
    followersCount: userObj.followersCount || 0,
    user: userObj,
    followingUsers: userObj.followingUsers || [],
    userComments: []
      .filter((travel) => travel.user !== userObj.username)
      .flatMap((travel) => travel.comments || [])
      .filter((comment) => comment.user === userObj.username),
    likedTravels: mockUserActions[userObj.username]?.likedTravels || ['x'], // first-like assumed
    viewedTravels: mockUserActions[userObj.username]?.viewedTravels || Array(5).fill('x'), // curious assumed
  };

  const userAchievementsCount = achievements.filter((a) => isAchievementUnlocked(a, ctx)).length;

  let points =
    travelsCount * POINTS.travel +
    mediaCount * POINTS.media +
    likesReceived * POINTS.likeReceived +
    commentsReceived * POINTS.commentReceived +
    commentsMade * POINTS.commentGiven +
    likesGiven * POINTS.likeGiven +
    profileComplete +
    userAchievementsCount * POINTS.achievement;

  if (userAchievementsCount === achievements.length) points += POINTS.allAchievements;

  return points;
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════ */

const StatCard = ({ icon: Icon, label, value, tone = 'brand' }) => (
  <div className={`gm-profile__stat-card gm-profile__stat-card--${tone}`}>
    <div className="gm-profile__stat-card-icon">
      <Icon size={18} strokeWidth={1.75} />
    </div>
    <div className="gm-profile__stat-card-body">
      <div className="gm-profile__stat-card-value">{value}</div>
      <div className="gm-profile__stat-card-label">{label}</div>
    </div>
  </div>
);

const FilterChip = ({ filter, active, count, onClick }) => {
  const Icon = filter.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`gm-ach-chip ${active ? 'gm-ach-chip--active' : ''}`}
      aria-pressed={active}
    >
      <Icon size={14} strokeWidth={1.75} />
      <span>{filter.label}</span>
      {typeof count === 'number' && <span className="gm-ach-chip__count">{count}</span>}
    </button>
  );
};

const AchievementCard = ({ achievement, unlocked, index }) => {
  const Icon = achievement.icon;
  return (
    <motion.article
      className={`gm-ach-card ${unlocked ? 'gm-ach-card--unlocked' : 'gm-ach-card--locked'}`}
      data-rarity={achievement.rarity}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.03, 0.4) }}
    >
      <div className="gm-ach-card__icon">
        {unlocked ? <Icon size={22} strokeWidth={1.75} /> : <IconLock size={18} strokeWidth={1.75} />}
      </div>
      <div className="gm-ach-card__body">
        <div className="gm-ach-card__head">
          <h3>{achievement.name}</h3>
          <span className={`gm-ach-card__rarity gm-ach-card__rarity--${achievement.rarity}`}>
            {achievement.rarity}
          </span>
        </div>
        <p>{achievement.description}</p>
      </div>
      <div className="gm-ach-card__foot">
        {unlocked ? (
          <span className="gm-ach-card__status gm-ach-card__status--unlocked">
            <IconCheck size={12} strokeWidth={2.5} /> Desbloqueada
          </span>
        ) : (
          <span className="gm-ach-card__status gm-ach-card__status--locked">
            <IconLock size={12} strokeWidth={2} /> Bloqueada
          </span>
        )}
        <span className="gm-ach-card__reward">+{POINTS.achievement} pts</span>
      </div>
    </motion.article>
  );
};

/* ════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════ */
const Achievements = () => {
  const { user, loading } = useAuth();

  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => achievementsModalUtils.shouldShow());
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  /* ── Data computation (memoised) ─────────────────────── */
  // NOTE: useMemo must run before any conditional return to keep
  // the rules-of-hooks satisfied. It returns safe defaults when
  // there is no authenticated user.
  const data = useMemo(() => {
    const EMPTY = {
      userTravels: [],
      travelsCount: 0,
      followingCount: 0,
      followersCount: 0,
      userAchievements: [],
      lockedAchievements: achievements.slice(),
      inProgressAchievements: [],
      progressPercentage: 0,
      leaderboard: [],
      userLeaderboardIndex: 0,
      userPoints: 0,
    };
    if (!user) return EMPTY;

    const userTravels = [].filter((travel) => travel.user === user.username);
    const travelsCount = userTravels.length;
    const followingCount = user.followingCount || 0;
    const followersCount = user.followersCount || 0;
    const followingUsers = user.followingUsers || [];
    const userComments = []
      .filter((travel) => travel.user !== user.username)
      .flatMap((travel) => travel.comments || [])
      .filter((comment) => comment.user === user.username);
    const userActions = mockUserActions[user.username] || { viewedTravels: [], likedTravels: [] };
    const viewedTravels = userActions.viewedTravels || [];
    const likedTravels = userActions.likedTravels || [];

    const ctx = {
      travelsCount,
      userTravels,
      followingCount,
      followersCount,
      user,
      followingUsers,
      userComments,
      likedTravels,
      viewedTravels,
    };

    const userAchievements = achievements.filter((a) => isAchievementUnlocked(a, ctx));
    const lockedAchievements = achievements.filter((a) => !isAchievementUnlocked(a, ctx));
    const inProgressAchievements = lockedAchievements.filter((a) => isAchievementInProgress(a, ctx));
    const progressPercentage = achievements.length > 0
      ? Math.min(100, Math.max(0, Math.round((userAchievements.length / achievements.length) * 100)))
      : 0;

    const allUsers = [
      ...mockUsers,
      !mockUsers.some((u) => u.username === user.username) ? { ...user } : null,
    ].filter(Boolean);
    const leaderboard = allUsers
      .map((u) => ({
        username: u.username,
        country: u.country,
        profilePicture: u.profilePicture || '/static/media/avatar.55c3eb5641681d05db07.jpg',
        points: calculateUserPoints(u),
      }))
      .sort((a, b) => b.points - a.points);
    const userLeaderboardIndex = leaderboard.findIndex((u) => u.username === user.username) + 1;
    const userPoints = leaderboard.find((u) => u.username === user.username)?.points || 0;

    return {
      userTravels,
      travelsCount,
      followingCount,
      followersCount,
      userAchievements,
      lockedAchievements,
      inProgressAchievements,
      progressPercentage,
      leaderboard,
      userLeaderboardIndex,
      userPoints,
    };
  }, [user]);

  /* ── Loading / unauthenticated state ─────────────────── */
  if (loading) {
    return (
      <PageContainer size="xl" className="gm-ach">
        <PageHeader icon={IconTrophy} title="Conquistas" subtitle="A carregar…" />
        <div className="gm-ach__state" role="status" aria-live="polite">
          <IconLoader2 size={28} strokeWidth={1.75} className="gm-ach__spin" />
          <p>A carregar as suas conquistas…</p>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer size="xl" className="gm-ach">
        <PageHeader icon={IconTrophy} title="Conquistas" />
        <div className="gm-ach__state gm-ach__state--empty">
          <div className="gm-ach__state-icon"><IconLock size={28} strokeWidth={1.5} /></div>
          <h2>Inicie sessão para ver as suas conquistas</h2>
          <p>Entre na sua conta para desbloquear troféus, ganhar pontos e subir no ranking global.</p>
        </div>
      </PageContainer>
    );
  }

  const {
    userAchievements,
    lockedAchievements,
    inProgressAchievements,
    progressPercentage,
    leaderboard,
    userLeaderboardIndex,
    userPoints,
  } = data;

  /* ── Filtered list ───────────────────────────────────── */
  const visibleAchievements = (() => {
    let list;
    if (filter === 'unlocked') list = userAchievements;
    else if (filter === 'locked') list = lockedAchievements;
    else if (filter === 'in-progress') list = inProgressAchievements;
    else list = achievements;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
      );
    }
    return list;
  })();

  const filterCounts = {
    all: achievements.length,
    unlocked: userAchievements.length,
    locked: lockedAchievements.length,
    'in-progress': inProgressAchievements.length,
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <PageContainer size="xl" className="gm-ach">
      {/* Welcome modal — preserved from the original implementation */}
      {showWelcomeModal && (
        <div className="gm-map-welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="ach-welcome-title">
          <div className="gm-map-welcome-modal">
            <div className="gm-map-welcome-header">
              <h2 id="ach-welcome-title">Sistema de Conquistas Globe Memories</h2>
              <button className="gm-map-close-btn" onClick={() => setShowWelcomeModal(false)} aria-label="Fechar">×</button>
            </div>
            <div className="gm-map-welcome-content">
              <p>Transforme as suas aventuras em realizações!<br />Desbloqueie conquistas, ganhe pontos e suba no ranking global da comunidade de viajantes Globe Memories.</p>
              <div className="gm-map-features-grid">
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🏆</span>
                  <div>
                    <strong>Conquistas Dinâmicas</strong>
                    <p>Obtenha novas conquistas ao viajar, partilhar fotos, interagir com outros exploradores e completar desafios únicos.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🎯</span>
                  <div>
                    <strong>Pontuação e Ranking Global</strong>
                    <p>Acumule pontos por cada conquista alcançada e veja o seu nome subir na tabela de liderança mundial.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">📊</span>
                  <div>
                    <strong>Progresso Visual Personalizado</strong>
                    <p>Acompanhe o seu desempenho através de gráficos, barras de progresso e estatísticas detalhadas.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">👥</span>
                  <div>
                    <strong>Competição Saudável e Motivadora</strong>
                    <p>Compare as suas conquistas com outros viajantes, desafie amigos e mantenha-se sempre inspirado a explorar mais.</p>
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
                  <span className="checkmark" />
                  <span className="checkbox-text">Não mostrar novamente esta mensagem</span>
                </label>
              </div>
              <button
                className="gm-map-welcome-btn primary"
                onClick={() => {
                  if (dontShowAgain) achievementsModalUtils.dismiss();
                  setShowWelcomeModal(false);
                }}
              >
                Começar a conquistar!
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        icon={IconTrophy}
        title="Conquistas"
        subtitle={`${userAchievements.length} de ${achievements.length} desbloqueadas · ${userPoints} pontos`}
        actions={
          <button
            type="button"
            className="gm-profile__btn gm-profile__btn--ghost"
            onClick={() => setShowPointsModal(true)}
            aria-label="Como ganhar pontos?"
          >
            <IconHelp size={14} strokeWidth={1.75} /> Como ganhar pontos?
          </button>
        }
      />

      {/* Progress card */}
      <Section>
        <div className="gm-ach__progress-card">
          <div className="gm-ach__progress-head">
            <div>
              <h2>Progresso Geral</h2>
              <p>Desbloqueie todos os troféus para ganhar o bónus de <strong>+{POINTS.allAchievements} pontos</strong>.</p>
            </div>
            <div className="gm-ach__progress-count" aria-hidden="true">
              {userAchievements.length}/{achievements.length}
            </div>
          </div>
          <div
            className="gm-ach__progress-track"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Progresso de conquistas: ${progressPercentage}%`}
          >
            <motion.div
              className="gm-ach__progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <span className="gm-ach__progress-text">{progressPercentage}% Completo</span>
          </div>
        </div>
      </Section>

      {/* Stats row */}
      <Section>
        <Grid min={200} gap="md" className="gm-ach__stats">
          <StatCard icon={IconTrophy} label="Total" value={achievements.length} />
          <StatCard icon={IconUnlock} label="Desbloqueadas" value={userAchievements.length} tone="success" />
          <StatCard icon={IconTrend} label="Em Progresso" value={inProgressAchievements.length} tone="accent" />
          <StatCard icon={IconLock} label="Bloqueadas" value={lockedAchievements.length} tone="muted" />
        </Grid>
      </Section>

      {/* Filters + search */}
      <Section>
        <div className="gm-ach__filters">
          <div className="gm-ach__chips" role="tablist" aria-label="Filtro de conquistas">
            {FILTERS.map((f) => (
              <FilterChip
                key={f.id}
                filter={f}
                active={filter === f.id}
                count={filterCounts[f.id]}
                onClick={() => setFilter(f.id)}
              />
            ))}
          </div>
          <div className="gm-ach__search">
            <IconSearch size={14} strokeWidth={1.75} className="gm-ach__search-icon" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar conquista…"
              aria-label="Procurar conquista"
            />
          </div>
        </div>
      </Section>

      {/* Achievements grid */}
      <Section>
        <SectionHeader
          title={
            filter === 'unlocked' ? 'Desbloqueadas'
              : filter === 'locked' ? 'Bloqueadas'
                : filter === 'in-progress' ? 'Em Progresso'
                  : 'Todas as Conquistas'
          }
          count={visibleAchievements.length}
        />

        {visibleAchievements.length === 0 ? (
          <div className="gm-ach__state gm-ach__state--empty">
            <div className="gm-ach__state-icon">
              <IconTarget size={28} strokeWidth={1.5} />
            </div>
            <h2>{search.trim() ? 'Nenhum resultado' : 'Sem conquistas neste filtro'}</h2>
            <p>
              {search.trim()
                ? `Não encontrámos nada para "${search.trim()}".`
                : 'Explore o mundo e partilhe as suas viagens para desbloquear novos troféus.'}
            </p>
          </div>
        ) : (
          <Grid min={280} gap="md" className="gm-ach__grid">
            <AnimatePresence mode="popLayout">
              {visibleAchievements.map((a, i) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  unlocked={userAchievements.includes(a)}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </Grid>
        )}
      </Section>

      {/* Leaderboard */}
      <Section>
        <SectionHeader
          icon={IconCrown}
          title="Leaderboard"
          count={leaderboard.length}
          action={
            <span className="gm-ach__lb-meta">
              <IconTrophy size={12} strokeWidth={1.75} /> Posição #{userLeaderboardIndex || '—'}
            </span>
          }
        />
        <div className="gm-ach__lb">
          {leaderboard.map((u, idx) => (
            <div
              key={u.username}
              className={`gm-ach__lb-row ${u.username === user.username ? 'gm-ach__lb-row--me' : ''}`}
            >
              <div className="gm-ach__lb-rank">#{idx + 1}</div>
              <img
                src={u.profilePicture}
                alt={u.username}
                className="gm-ach__lb-avatar"
              />
              <div className="gm-ach__lb-info">
                <Link
                  to={`/profile/${u.username}`}
                  className="gm-ach__lb-name"
                >
                  {u.username}
                </Link>
                {u.country && <span className="gm-ach__lb-country">{u.country}</span>}
              </div>
              <div className="gm-ach__lb-points">{u.points} pts</div>
              {u.username === user.username && (
                <span className="gm-ach__lb-badge">
                  <IconSparkles size={12} strokeWidth={1.75} /> Você
                </span>
              )}
              <IconChevronRight size={14} strokeWidth={1.75} className="gm-ach__lb-chevron" />
            </div>
          ))}
        </div>
      </Section>

      {/* Spacer + footer */}
      <Spacer size="lg" />
      {/* Points modal (v3 styled) */}
      <AnimatePresence>
        {showPointsModal && (
          <motion.div
            className="gm-ach__modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ach-points-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setShowPointsModal(false)}
          >
            <motion.div
              className="gm-modal__panel gm-ach__points-modal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="gm-modal__close"
                onClick={() => setShowPointsModal(false)}
                aria-label="Fechar"
              >
                <IconX size={16} strokeWidth={1.75} />
              </button>
              <div className="gm-ach__points-head">
                <div className="gm-ach__points-icon">
                  <IconSparkles size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <h2 id="ach-points-title">Como ganhar pontos?</h2>
                  <p>Tabela oficial de pontuação da comunidade Globe Memories.</p>
                </div>
              </div>
              <ul className="gm-ach__points-list">
                {POINTS_RULES.map((rule) => (
                  <li key={rule.label}>
                    <span>{rule.label}</span>
                    <strong>{rule.value}</strong>
                  </li>
                ))}
              </ul>
              <div className="gm-ach__points-foot">
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--primary"
                  onClick={() => setShowPointsModal(false)}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default Achievements;
