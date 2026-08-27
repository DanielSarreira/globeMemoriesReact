import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Check, Flag, Ban, Clock, UserPlus, Plus,
  Star, MoreHorizontal, X as IconX, Image as ImageIcon,
  MessageCircle, Heart, Wallet, MapPinned, Calendar, Compass, Lock,
  TrendingUp, Globe2, Clock3, Bookmark, Edit3, Trash2, Globe, Users, EyeOff, UserMinus,
  Settings, LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { request, toFullMediaUrl, getUserAvatar, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { useToast, Avatar, ReportSheet, FollowButton } from '../components/ui';
import ProgressiveImg from '../components/ui/ProgressiveImg';
import { getDisplayName } from '../utils/userDisplay';
import './user-profile.css';

/* ── Helpers (preserved from the original) ────────────────── */
function mapTripSummaryToUiTrip(trip, ownerUsername, apiCategories) {
  // City resolution: o backend (TripDto.toDto) já popula
  // `trip.cityName` com a primeira cidade da viagem e `trip.country`
  // com o país correspondente. Antes este mapper só olhava para
  // `trip.accommodations[0]?.city` (texto livre, podia vir vazio
  // ou com o nome do país) — agora seguimos a fonte de verdade
  // que é o `TripCity` resolvido pelo backend.
  const country = (trip.country || '').trim();
  // Tomamos o `cityName` do backend, mas rejeitamos se for igual
  // ao país (defesa em profundidade: o backend já não devolve
  // isso, mas se uma rota flat devolver, evitamos contar "Portugal"
  // como cidade).
  const cityName = (() => {
    const raw = (trip.cityName || '').toString().trim();
    if (!raw) return '';
    if (country && raw.toLowerCase() === country.toLowerCase()) return '';
    return raw;
  })();
  const days = (typeof trip.tripDurationDays === 'number' && trip.tripDurationDays > 0)
    ? trip.tripDurationDays
    : (trip.startDate && trip.endDate
      ? Math.max(1, Math.ceil(Math.abs(new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)) + 1)
      : 0);
  return {
    id: trip.id,
    name: trip.title || 'Viagem',
    description: trip.tripDescription || trip.tripSummary || '',
    startDate: trip.startDate,
    endDate: trip.endDate,
    country: trip.country || '',
    city: cityName,
    // Round 71 — Multi-destination support on the profile card.
    // The `/trips/my-trips` and `/trips/user/{id}/public` endpoints
    // return the full `citiesDetail` list (one TripCityDto per stop,
    // in display order) so we can list every city visited instead
    // of only the first one. We keep the simple `city`/`country`
    // pair for the single-destination render and the fallback path.
    cities: Array.isArray(trip.citiesDetail)
      ? trip.citiesDetail.map((c) => c.cityName).filter(Boolean)
      : (cityName ? [cityName] : []),
    user: ownerUsername,
    category: (trip.categories || []).map((id) => {
      const c = (apiCategories || []).find((x) => x.id === id);
      return c ? c.name : null;
    }).filter(Boolean),
    days,
    price: trip.cost?.total ?? trip.totalPrice ?? trip.totalCost ?? 0,
    stars: Math.round(trip.tripRating ?? trip.rating ?? 0),
    rating: trip.tripRating ?? trip.rating ?? 0,
    likes: 0,
    comments: [],
    highlightImage: (Array.isArray(trip.photos) && trip.photos[0])
      ? toFullMediaUrl(trip.photos[0])
      : null,
    isHidden: Boolean(trip.isHidden),
    // Trip privacy level as returned by the backend:
    //   "PUBLIC"      — visible to everyone
    //   "FOLLOWERS"   — only the owner's followers
    //   "PRIVATE"     — only the owner
    // We render a small badge on the profile card so people can see
    // who the trip is meant for.
    privacy: (trip.tripPrivacy || 'PUBLIC').toUpperCase(),
  };
}

function mapReportReasonToApiReason(reasons) {
  if (reasons.harassment || reasons.abusive) return 'HARASSMENT';
  if (reasons.inappropriate) return 'INAPPROPRIATE_CONTENT';
  if (reasons.spam) return 'SPAM';
  if (reasons.identity || reasons.falseInfo) return 'FAKE_PROFILE';
  return 'OTHER';
}

function getApiErrorMessage(error, fallback = 'Ocorreu um erro inesperado.') {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;
  if (message) return message;
  if (status === 400) return 'Pedido inválido. Verifique os dados e tente novamente.';
  if (status === 401) return 'Sessão expirada ou inválida. Faça login novamente.';
  if (status === 404) return 'Utilizador não encontrado.';
  return fallback;
}

function formatLocationText(city, country) {
  const safeCity = (city || '').trim();
  const safeCountry = (country || '').trim();
  if (!safeCity) return safeCountry;
  if (!safeCountry) return safeCity;
  if (safeCity.toLowerCase().includes(safeCountry.toLowerCase())) return safeCity;
  return `${safeCity}, ${safeCountry}`;
}

/* Formata o preço total no padrão "80€" / "1.2k€" sem casas
   decimais quando é um valor redondo. Aceita number ou string
   numérica. Se o valor for inválido ou zero devolve "" para
   o consumidor decidir se quer mostrar a pill. */
function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  // Sem casas decimais para inteiros; uma casa para frações
  const hasFraction = Math.round(n * 10) % 10 !== 0;
  const formatter = new Intl.NumberFormat('pt-PT', {
    maximumFractionDigits: hasFraction ? 1 : 0,
    minimumFractionDigits: 0,
  });
  return `${formatter.format(n)}€`;
}

/* ── Tabs (premium) ─────────────────────────────────────── */
// Top-level tabs. Saved trips used to be a third top-level tab
// that jumped to a dedicated /saved-trips page; now they live as
// an in-profile sub-tab under "Viagens" (only for the profile
// owner), so the user never has to leave their own profile to
// browse the private collection.
const PROFILE_TABS = [
  { id: 'trips', label: 'Viagens', icon: Compass },
  { id: 'stats', label: 'Estatísticas', icon: TrendingUp },
];

const UserProfile = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const username = routeUsername || user?.username;

  // Profile data
  const [profile, setProfile] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Relationship
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [reportedTravels, setReportedTravels] = useState([]);
  const [actionError, setActionError] = useState('');

  // Dedup refs: o `FollowButton` chama `onChange` no click
  // (optimistic) e o `useEffect` interno do hook
  // (`useFollowRelationship`) chama-o de novo quando o state
  // reconcilia. Sem deduplicação, o contador +/- 1 no pai
  // dispara duas vezes (uma por cada callback). Guardamos
  // o último state aplicado e ignoramos callbacks
  // duplicados. Reset em:
  //   - `fetchAll` (mudança de username/perfil)
  //   - `loadFollowList` / `closeFollowModal` (reabrir modal)
  const lastAppliedStateRef = useRef(new Map());
  const lastRelationshipStateRef = useRef(null);

  // Trips
  const [travels, setTravels] = useState([]);
  const [tripsPage, setTripsPage] = useState(0);
  const [tripsHasMore, setTripsHasMore] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const TRIPS_PAGE_SIZE = 6;
  // Saved trips count (own profile only — the saved list is private)
  const [savedCount, setSavedCount] = useState(null);

  // ── Saved trips collection (in-profile sub-tab) ─────────────────────
  // Mirrors what used to live on /saved-trips. We fetch lazily
  // when the user first switches to the sub-tab so we don't hit
  // the endpoint on every profile load.
  const [savedTrips, setSavedTrips] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedFetched, setSavedFetched] = useState(false);

  // Pending follow requests received by the profile owner. Only
  // fetched when the user is viewing their own profile (the
  // backend endpoint rejects requests from anyone else). Each
  // entry is `{ id, requester: { id, username, ... } }` from
  // the backend's `FollowRequestUserInfoDto`.
  const [followRequests, setFollowRequests] = useState([]);
  const [followRequestsLoading, setFollowRequestsLoading] = useState(false);

  // Modals
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRequestToast, setShowRequestToast] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportTravelModal, setShowReportTravelModal] = useState(false);
  // `modalContent` é o estado imutável (snapshot) do modal; `liveList`
  // é a sua versão reativa. Quando o user clica "Seguir" / "Deixar
  // de seguir" num item dentro do modal, atualizamos `liveList` em
  // vez de re-fazer fetch — o item sai da lista instantaneamente
  // (no caso do "A seguir" quando faz unfollow) e o botão vira
  // "Seguir" no mesmo frame. Em "Seguidores", a lógica é inversa:
  // a entrada continua visível (foi ele que ganhou o follower) mas
  // o botão vira "A seguir" para o caso do user querer deixar de
  // seguir diretamente do modal.
  const [modalContent, setModalContent] = useState({ title: '', list: [], type: '' });
  const [liveList, setLiveList] = useState([]);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [reportReasons, setReportReasons] = useState({
    inappropriate: false, falseInfo: false, abusive: false, spam: false,
    identity: false, plagiarism: false, harassment: false, violation: false, other: false,
  });
  const [otherReason, setOtherReason] = useState('');
  const [reportTravelReasons, setReportTravelReasons] = useState({
    inappropriate: false, falseInfo: false, abusive: false, spam: false,
    violation: false, plagiarism: false, other: false,
  });
  const [otherTravelReason, setOtherTravelReason] = useState('');

  // Flag para saber se as viagens já foram carregadas (evita
  // mostrar "0 viagens" enquanto o fetch de trips não termina).
  const [travelsLoaded, setTravelsLoaded] = useState(false);

  // UI — the profile defaults to the "Viagens" tab so the user lands
  // on their trips straight away (Estatísticas is still one click
  // away in the tab bar).
  const [activeTab, setActiveTab] = useState('trips');

  // "Viagens Guardadas" used to be a separate page; now it's a
  // sub-tab inside the profile (only for the owner). `tripSubTab`
  // picks between the public-trips list and the private saved
  // collection within the same "Viagens" tab.
  const [tripSubTab, setTripSubTab] = useState('trips');

  // ── Saved-trips callbacks (declared before the early `return`s below
  //     so the order of hooks stays stable across renders). The body
  //     re-checks `isOwnProfile` against the currently-loaded profile,
  //     and is a no-op while the profile is still loading. ──
  const fetchSavedTrips = useCallback(async () => {
    if (!user || !username || user.username !== username) return;
    setSavedLoading(true);
    try {
      const resp = await request('GET', '/trips/saved?page=0&size=50');
      const data = resp?.data || {};
      setSavedTrips(data.content || []);
      setSavedFetched(true);
    } catch (err) {
      const msg = err?.response?.data?.message
        || 'Não foi possível carregar as viagens guardadas.';
      toast.danger(msg);
    } finally {
      setSavedLoading(false);
    }
  }, [user, username, toast]);

  useEffect(() => {
    // Lazy load: only when the user opens the "Viagens Guardadas"
    // sub-tab on their own profile. The same effect resets the
    // sub-tab if the user navigates to someone else's profile.
    const isOwn = user && username && user.username === username;
    if (isOwn && activeTab === 'trips' && tripSubTab === 'saved' && !savedFetched && !savedLoading) {
      fetchSavedTrips();
    }
    if (!isOwn && tripSubTab !== 'trips') {
      setTripSubTab('trips');
    }
  }, [user, username, activeTab, tripSubTab, savedFetched, savedLoading, fetchSavedTrips]);

  const handleUnsaveFromProfile = useCallback(async (tripId) => {
    const previous = savedTrips;
    setSavedTrips((prev) => prev.filter((t) => t.tripId !== tripId));
    setSavedCount((c) => (typeof c === 'number' ? Math.max(0, c - 1) : c));
    try {
      await request('DELETE', `/trips/${tripId}/save`);
      toast.info('Removida dos guardados.');
    } catch (err) {
      // Rollback on failure
      setSavedTrips(previous);
      const msg = err?.response?.data?.message
        || 'Não foi possível remover dos guardados.';
      toast.danger(msg);
    }
  }, [savedTrips, toast]);

  // Bump on profile updates so the fetch effect refires when the
  // user returns from /profile/edit/:username with a new photo.
  // We initialize from localStorage so a fresh mount after a save
  // (the EditProfile page already wrote the new version key) picks
  // up the new value immediately.
  const [profileVersion, setProfileVersion] = useState(() => {
    if (typeof window === 'undefined' || !username) return 0;
    try {
      const v = window.localStorage.getItem(`${username}_profilePhotoVersion`);
      return v ? Number(v) || 0 : 0;
    } catch (e) { return 0; }
  });
  useEffect(() => {
    const bump = () => setProfileVersion((v) => v + 1);
    const onStorage = (e) => {
      if (e.key && e.key.endsWith('_profilePhotoVersion')) bump();
    };
    const onCustom = (e) => {
      if (!e?.detail?.username || e.detail.username === username) bump();
    };
    const onFocus = () => bump();
    // Round 49 — Re-fetch imediato quando uma viagem é criada,
    // editada ou muda de privacidade. Sem isto, mudar a privacidade
    // (pública → privada) só actualizava o contador "Viagens" do
    // perfil depois de F5. Filtramos por `ownerUsername` para
    // reagir só a mudanças que afectam ESTE perfil.
    const onTripsChanged = (e) => {
      const owner = e?.detail?.ownerUsername;
      // Sem owner específico = evento global (ex: limpeza em massa);
      // re-fetch para qualquer perfil que esteja aberto.
      if (!owner || owner === username) bump();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('gm:profile-updated', onCustom);
    window.addEventListener('gm:trips-changed', onTripsChanged);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('gm:profile-updated', onCustom);
      window.removeEventListener('gm:trips-changed', onTripsChanged);
      window.removeEventListener('focus', onFocus);
    };
  }, [username]);

  /* ── Fetch profile + relationship (single pass) ─────────── */
  useEffect(() => {
    let cancelled = false;
    // Reset dos dedup refs ao mudar de username/perfil — evita
    // que o `lastAppliedState`/`lastRelationshipState` de outro
    // perfil "congele" as mudanças de estado deste.
    lastRelationshipStateRef.current = null;
    lastAppliedStateRef.current = new Map();
    const fetchAll = async () => {
      try {
        setLoading(true);
        let resolvedUserId;
        if (user && user.username === username && user.id) {
          resolvedUserId = Number(user.id);
        } else {
          // Resolve username → userId. Try `/users/discover`
          // first (richer profile data), and fall back to
          // `/users/search` which is a plain text search and is
          // more lenient on the backend (smaller response, no
          // filtering by the logged-in user's relationships).
          // This way if `/discover` fails or doesn't return the
          // exact match, we still get a result.
          let exactUser = null;
          try {
            const discoverResponse = await api.get('/users/discover', {
              params: { username, page: 0, size: 20, sortBy: 'followers' },
            });
            const matches = discoverResponse.data?.content || [];
            exactUser = matches.find((u) => u.username === username);
          } catch (_) { /* try search */ }
          if (!exactUser) {
            try {
              const searchResponse = await api.get('/users/search', {
                params: { query: username, page: 0, size: 20 },
              });
              const matches = searchResponse.data?.content || [];
              exactUser = matches.find((u) => u.username === username);
            } catch (_) { /* swallow — handled below */ }
          }
          resolvedUserId = exactUser?.id || null;
        }
        if (!resolvedUserId) {
          throw new Error(`Não foi possível encontrar o viajante "${username}".`);
        }
        if (cancelled) return;

        const isOtherUser = user && user.username !== username;
        const isOwnProfile = user && user.username === username;
        const profileFetch = api.get(`/users/${resolvedUserId}/detailed`);
        // Saved-trips count is private — only fetch for the owner.
        // For other users, the field stays null and the stat is hidden.
        const savedCountFetch = isOwnProfile
          ? api.get('/trips/saved/count').catch(() => ({ data: 0 }))
          : Promise.resolve(null);
        const relationshipFetch = isOtherUser
          ? Promise.allSettled([
              api.get('/users/is-following', { params: { followerId: Number(user.id), followedId: resolvedUserId } }),
              api.get('/users/follow-request-status', { params: { requesterId: Number(user.id), targetId: resolvedUserId } }),
              api.get(`/users-management/${resolvedUserId}/is-blocked`),
            ])
          : Promise.resolve(null);
        // Incoming follow requests — only available on the owner's
        // own profile. The backend caps the requester to themselves
        // (403 otherwise), so we only fire it when `isOwnProfile`.
        const followRequestsFetch = isOwnProfile
          ? api.get(`/users/${resolvedUserId}/follow-requests`).catch(() => ({ data: [] }))
          : Promise.resolve(null);
        const [detailedResponse, relationshipResults, savedCountResponse, followRequestsResponse] =
          await Promise.all([profileFetch, relationshipFetch, savedCountFetch, followRequestsFetch]);
        if (savedCountResponse) {
          setSavedCount(Number(savedCountResponse.data) || 0);
        } else {
          setSavedCount(null);
        }
        if (cancelled) return;

        const detailed = detailedResponse.data || {};
        const profileUsername = detailed.username || username;

        // Cover photo comes from the backend (users.cover_photo).
        // We keep the localStorage fallback for users that uploaded
        // a cover before the backend endpoint existed; once the
        // backend is the source of truth, the user can re-upload
        // to migrate.
        const backendCover = toFullMediaUrl(detailed.coverPhoto);
        const localCover = localStorage.getItem(`${username}_coverPhoto`) || '';
        const coverPhoto = backendCover || localCover;
        const coverPhotoScale = parseFloat(localStorage.getItem(`${username}_coverPhotoScale`)) || 1;
        const coverPhotoPosition = JSON.parse(localStorage.getItem(`${username}_coverPhotoPosition`) || '{"x":0,"y":0}');
        // The backend returns `privateProfile` (boolean) on the
        // detailed user DTO; we surface it as `privacy: 'private' | 'public'`
        // so the rest of the component can keep using string checks
        // and the "Seguir" → "Pendente" optimistic transition works.
        const profilePrivacy = detailed.privateProfile ? 'private' : 'public';

        const detailedProfile = {
          id: detailed.id || resolvedUserId,
          username: profileUsername,
          name: getDisplayName(detailed, profileUsername),
          // Resolve the (possibly relative) photo URL against the
          // backend's /files origin. Without this, the <img src>
          // would be a relative path that the frontend origin
          // (localhost:3000) cannot serve, so the image errors
          // out and Avatar falls back to the initials gradient.
          //
          // We append `?v=${profileVersion}` ONLY when the user has
          // uploaded a new photo (profileVersion > 0). With the Nginx
          // `expires 30d` + `Cache-Control: public, immutable` headers
          // (set in nginx/globememories.conf `location ^~ /files/`),
          // appending `?v=0` for every render would defeat the browser
          // cache and force a re-fetch on every page load.
          //
          // The version counter is bumped by the EditProfile save flow,
          // which writes the new value to localStorage and triggers
          // this fetchAll effect to re-run. When `profileVersion === 0`
          // we just return the stable URL and let the browser cache it.
          // Only set profilePicture when the backend actually
          // returned one. Otherwise we let the Avatar component
          // fall back to the gradient + initials so users with no
          // photo see a consistent identity block across the app
          // (not a generic local placeholder image).
          profilePicture: detailed.profilePhoto
            ? (profileVersion > 0
                ? `${toFullMediaUrl(detailed.profilePhoto)}${toFullMediaUrl(detailed.profilePhoto).includes('?') ? '&' : '?'}v=${profileVersion}`
                : toFullMediaUrl(detailed.profilePhoto))
            : null,
          bio: detailed.userBio || 'Viajante apaixonado',
          country: detailed.nationality || '',
          city: detailed.city || '',
          // Round 83 — the edit-profile form already saves
          // `languagesSpoken` (a comma-separated string) and
          // the backend exposes it on the detailed DTO, but
          // the profile page was never rendering it. Now we
          // surface the languages as a chip row right under
          // the bio so visitors know what languages the user
          // speaks. Empty strings / whitespace are filtered
          // out; we only render the chip row when at least one
          // language is present.
          languagesSpoken: (typeof detailed.languagesSpoken === 'string'
            ? detailed.languagesSpoken
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : []),
          travelCount: detailed.totalTrips ?? 0,
          followersCount: detailed.numberOfFollowers || 0,
          followingCount: detailed.numberOfFollowing || 0,
          // Use the resolved `profilePrivacy` (computed above) so the
          // rest of the component keeps working with the string form
          // `profile.privacy === 'public' | 'private'`.
          privacy: profilePrivacy,
          privateProfile: detailed.privateProfile === true,
          // Sinal do backend sobre se o viewer pode ver viagens/stats.
          // Quando o perfil é privado e o viewer não segue, isto
          // é `false` e o frontend esconde a lista de viagens e os
          // cards de estatísticas, mas mantém o perfil público visível
          // (foto, bio, contadores de followers).
          canViewDetails: detailed.canViewDetails !== false,
          coverPhoto, coverPhotoScale, coverPhotoPosition,
        };
        setProfileUserId(resolvedUserId);
        setProfile(detailedProfile);
        setUserStats({
          // FIX (Round 33 — bug batch 2, item 2): o user pediu
          // para alinhar o número de viagens em todo o lado
          // (perfil do owner, perfil visto por outros, /travels,
          // /discover) — APENAS viagens públicas (tripPrivacy =
          // 'public' AND isHidden = false). Viagens privadas
          // nunca contam para o badge "Total de Viagens", nem
          // para o próprio dono. Antes, o owner via
          // `countByUserId` (= todas, ex: 3 para o oscar) e os
          // outros viam `countPublicVisibleByUserId` (= 2) —
          // havia inconsistência entre o que o owner percebia e
          // o que o resto do mundo via. Agora alinham-se: o
          // badge reflecte sempre o que o resto do mundo vê.
          //
          // FIX (Round 32): quando o user bloqueou stats
          // visibilidade ("Apenas para Mim" em
          // /settings-and-privacy), os valores chegam como `null`.
          // Preservamos `null` para que o `Stat`/`StatCard`
          // renderize "—" em vez de 0.
          totalTrips: detailed.totalTrips ?? null,
          // FIX (Round 30): preservar `null` quando o user
          // bloqueou a visibilidade das stats ("Apenas para Mim"
          // em /settings-and-privacy). O backend devolve `null`
          // para os campos que o viewer não pode ver, e o
          // frontend estava a coalescer tudo para 0 — o que
          // mostrava "0 países" / "0 cidades" no card de stats
          // mesmo quando o user tinha trip counts > 0 mas só
          // escondidos. Mantemos `null` para o JSX poder mostrar
          // "—" em vez de um zero mentiroso.
          totalVisitedCountries: detailed.totalVisitedCountries,
          totalVisitedCities: detailed.totalVisitedCities,
          totalMoneySpent: detailed.totalMoneySpent,
          averageMoneyPerTrip: detailed.averageMoneyPerTrip,
          averageDaysPerTrip: detailed.averageDaysPerTrip,
          numberOfFollowers: detailed.numberOfFollowers || 0,
          numberOfFollowing: detailed.numberOfFollowing || 0,
        });

        if (relationshipResults) {
          const [followingResult, pendingResult, blockedResult] = relationshipResults;
          const isFollowingBackend = followingResult.status === 'fulfilled' ? Boolean(followingResult.value.data) : false;
          const isPendingBackend = pendingResult.status === 'fulfilled' ? Boolean(pendingResult.value.data) : false;
          const isBlockedBackend = blockedResult.status === 'fulfilled' ? Boolean(blockedResult.value.data) : false;
          setFollowing(isFollowingBackend ? [profileUsername] : []);
          setPendingRequests(isPendingBackend ? [profileUsername] : []);
          setBlockedUsers(isBlockedBackend ? [profileUsername] : []);
        } else {
          setFollowing([]);
        }
        if (followRequestsResponse) {
          setFollowRequests(Array.isArray(followRequestsResponse.data) ? followRequestsResponse.data : []);
        } else {
          setFollowRequests([]);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Erro ao buscar perfil:', error);
        // Mostrar a mensagem real do backend (se vier) para o
        // user perceber o que aconteceu. Caso contrário, usamos
        // a mensagem do Error (que pode incluir o username).
        const backendMessage = error?.response?.data?.message;
        const fallback = error?.message || 'Não foi possível carregar o perfil.';
        setActionError(backendMessage || fallback);
        setProfile(null);
        setUserStats(null);
        setProfileUserId(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, user?.id, profileVersion]);

  /* ── Categories cache ──────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    api.get('/categories')
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) setApiCategories(res.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /* ── Paginated trips loader ────────────────────────────── */
  const fetchTripsPage = useCallback(async (page) => {
    if (!profileUserId || loadingTrips) return;
    setLoadingTrips(true);
    try {
      const isOwnProfile = user && user.username === username;
      const url = isOwnProfile
        ? `/trips/my-trips?page=${page}&size=${TRIPS_PAGE_SIZE}`
        : `/trips/user/${profileUserId}/public?page=${page}&size=${TRIPS_PAGE_SIZE}`;
      const res = await api.get(url);
      const pageContent = res.data?.content || [];
      const newTrips = pageContent.map((trip) => mapTripSummaryToUiTrip(trip, username, apiCategories));
      setTravels((prev) => (page === 0 ? newTrips : [...prev, ...newTrips]));
      setTripsPage(page);
      setTripsHasMore(pageContent.length >= TRIPS_PAGE_SIZE);
      if (page === 0) setTravelsLoaded(true);
    } catch (err) {
      console.warn('Failed to load trips page', page, err);
      setTripsHasMore(false);
    } finally {
      setLoadingTrips(false);
    }
  }, [profileUserId, username, user, apiCategories, loadingTrips]);

  useEffect(() => {
    if (!profileUserId) return;
    setTravels([]);
    setTripsPage(-1);
    setTripsHasMore(true);
    setTravelsLoaded(false);
    fetchTripsPage(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId]);

  /* ── Click outside to close dropdowns ──────────────────── */
  useEffect(() => {
    if (!showDropdown) return undefined;
    const onDoc = (e) => {
      if (!e.target.closest('.gm-profile__menu-wrap')) setShowDropdown(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [showDropdown]);

  /* ── Handlers ──────────────────────────────────────────── */
  // O controlo de seguir/deixar de seguir agora vive no
  // componente partilhado `FollowButton` (que usa o hook
  // `useFollowRelationship`). Aqui só mantemos a sincronização
  // do estado de relação para o resto do perfil (badge,
  // contadores, visibilidade do feed privado).

  // Accept an incoming follow request. The endpoint is
  //   POST /users/{id}/follow-requests/{requestId}/accept
  // where `id` is the OWNER'S user id (the same `profileUserId` we
  // already resolved on mount). We optimistically remove the row
  // from `followRequests` and bump the followers count, then
  // rollback on failure.
  const handleAcceptFollowRequest = async (requestId) => {
    if (!profileUserId || followRequestsLoading) return;
    const previous = followRequests;
    const acceptedReq = followRequests.find((r) => r.id === requestId);
    setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (acceptedReq) {
      setUserStats((prev) => (prev ? { ...prev, numberOfFollowers: (prev.numberOfFollowers || 0) + 1 } : prev));
    }
    setFollowRequestsLoading(true);
    try {
      await api.post(`/users/${profileUserId}/follow-requests/${requestId}/accept`);
      toast.success('Pedido aceite.');
    } catch (err) {
      // Rollback
      setFollowRequests(previous);
      if (acceptedReq) {
        setUserStats((prev) => (prev ? { ...prev, numberOfFollowers: Math.max(0, (prev.numberOfFollowers || 1) - 1) } : prev));
      }
      const msg = err?.response?.data?.message || 'Não foi possível aceitar o pedido.';
      toast.danger(msg);
    } finally {
      setFollowRequestsLoading(false);
    }
  };

  // Reject an incoming follow request.
  //   POST /users/{id}/follow-requests/{requestId}/reject
  const handleRejectFollowRequest = async (requestId) => {
    if (!profileUserId || followRequestsLoading) return;
    const previous = followRequests;
    setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
    setFollowRequestsLoading(true);
    try {
      await api.post(`/users/${profileUserId}/follow-requests/${requestId}/reject`);
      toast.info('Pedido rejeitado.');
    } catch (err) {
      setFollowRequests(previous);
      const msg = err?.response?.data?.message || 'Não foi possível rejeitar o pedido.';
      toast.danger(msg);
    } finally {
      setFollowRequestsLoading(false);
    }
  };

  const handleReportUser = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (!profileUserId) {
      // FIX (Round 30): se o profile ainda está a carregar (o
      // `profileUserId` ainda não foi resolvido), o modal
      // abriria mas o confirmar falharia em silêncio. Mostramos
      // um toast em vez disso.
      toast.danger('Aguarde — o perfil ainda está a carregar.');
      setShowDropdown(false);
      return;
    }
    // FIX (Round 32 — bug batch 1, BUG 7): o user pode denunciar
    // múltiplas vezes (motivos diferentes ou incidente novo). O
    // backend não bloqueia e o frontend também não — abrir o modal
    // sem verificação prévia. Se o user já reportou este user,
    // o modal abre na mesma e cada submit cria um novo registo
    // independente no backend.
    setActionError('');
    setShowReportModal(true);
    setShowDropdown(false);
  };

  const handleBlockUser = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (!profileUserId) {
      toast.danger('Aguarde — o perfil ainda está a carregar.');
      setShowDropdown(false);
      return;
    }
    setActionError('');
    setShowBlockModal(true);
    setShowDropdown(false);
  };

  const handleReasonChange = (reason) => {
    setReportReasons((prev) => ({ ...prev, [reason]: !prev[reason] }));
  };

  const handleTravelReasonChange = (reason) => {
    setReportTravelReasons((prev) => ({ ...prev, [reason]: !prev[reason] }));
  };

  const confirmReportUser = async () => {
    if (profile && profileUserId) {
      const hasSelectedReason = Object.values(reportReasons).some((v) => v) ||
        (reportReasons.other && otherReason.trim());
      if (!hasSelectedReason) {
        setActionError('Selecione pelo menos um motivo para denunciar.');
        return;
      }
      const reason = mapReportReasonToApiReason(reportReasons);
      const description = otherReason?.trim() || 'Reportado a partir do perfil do utilizador.';
      try {
        setActionError('');
        await api.post(`/users-management/${profileUserId}/report`, { reason, description });
        setReportedUsers((prev) => (prev.includes(profile.username) ? prev : [...prev, profile.username]));
        setShowReportModal(false);
        toast.success('Utilizador denunciado.');
      } catch (error) {
        console.error('Erro ao denunciar utilizador:', error);
        setActionError(getApiErrorMessage(error, 'Não foi possível denunciar este utilizador.'));
        return;
      }
      setReportReasons({
        inappropriate: false, falseInfo: false, abusive: false, spam: false,
        identity: false, plagiarism: false, harassment: false, violation: false, other: false,
      });
      setOtherReason('');
    }
  };

  const confirmBlockUser = async () => {
    if (profile && profileUserId) {
      try {
        setActionError('');
        // FIX (Bloqueio): unfollow o user antes de bloquear,
        // para que o backend remova a relação bilateral.
        // Se o viewer está a seguir o user, unfollow primeiro.
        if (isFollowing) {
          await api.post(`/users/${profileUserId}/unfollow`).catch(() => {});
        }
        await api.post(`/users-management/${profileUserId}/block`);
        setBlockedUsers((prev) => (prev.includes(profile.username) ? prev : [...prev, profile.username]));
        // FIX (Bloqueio): remover o user bloqueado dos contadores
        // de seguidores/seguidos. O backend já tratou de remover
        // a relação bilateral, mas actualizamos o frontend também.
        setUserStats((prev) => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (isFollowing) {
            updated.numberOfFollowers = Math.max(0, (prev.numberOfFollowers || 0) - 1);
            updated.numberOfFollowing = Math.max(0, (prev.numberOfFollowing || 0) - 1);
          }
          return updated;
        });
        setFollowing([]);
        setPendingRequests([]);
        setShowBlockModal(false);
        toast.success('Utilizador bloqueado.');
        // Re-fetch do perfil para garantir que os contadores
        // ficam consistentes (o backend pode ter ajustado
        // outros valores).
        refetchProfile();
      } catch (error) {
        console.error('Erro ao bloquear utilizador:', error);
        // FIX (Round 32 — bug batch 1): idempotência. Se o
        // backend já tinha o user bloqueado (race entre duas
        // tabs, F5 entre cliques, etc.), devolve 400 com
        // mensagem "User is already blocked". Não é um erro do
        // ponto de vista do user final — o resultado é
        // exactamente o que ele queria. Consideramos no-op
        // silencioso: fecha o modal, mantém `blockedUsers`
        // coerente, e não mostra toast de erro.
        const msg = error?.response?.data?.message || '';
        if (/already blocked/i.test(msg)) {
          setBlockedUsers((prev) => (prev.includes(profile.username) ? prev : [...prev, profile.username]));
          setShowBlockModal(false);
          return;
        }
        setActionError(getApiErrorMessage(error, 'Não foi possível bloquear este utilizador.'));
      }
    }
  };

  const handleReportTravel = (travel) => {
    if (!user) return;
    // O `selectedTravel` é o gatilho do `ReportSheet` que é
    // renderizado quando este state passa a não-nulo (ver
    // JSX mais abaixo: `{selectedTravel && <ReportSheet ... />}`).
    // Esta é a forma partilhada com Home / Travels / etc —
    // não usar `setShowReportTravelModal` aqui, o modal
    // legacy `ReportTravelModal` está deprecated e não é
    // renderizado.
    setSelectedTravel(travel);
  };

  const handleDeleteTrip = useCallback(async (travel) => {
    if (!travel?.id) return;
    const tripId = travel.id;
    // Optimistic: remove the card immediately so the UI is snappy.
    const previous = travels;
    setTravels((prev) => prev.filter((t) => t.id !== tripId));
    try {
      await api.delete(`/trips/${tripId}`);
      toast.success('Viagem eliminada.');
      // If the user is on their own profile, decrement the total
      // counter in the hero stats so the number stays in sync.
      setUserStats((prev) => (
        prev
          ? { ...prev, totalTrips: Math.max(0, (prev.totalTrips || 0) - 1) }
          : prev
      ));
    } catch (err) {
      // Rollback on failure (network error, 403, etc.)
      setTravels(previous);
      const msg = err?.response?.data?.message
        || 'Não foi possível eliminar a viagem.';
      toast.danger(msg);
    }
  }, [travels, toast]);

  const confirmReportTravel = () => {
    if (selectedTravel) {
      const hasSelectedReason = Object.values(reportTravelReasons).some((v) => v) ||
        (reportTravelReasons.other && otherTravelReason.trim());
      if (!hasSelectedReason) return;
      setReportedTravels([...reportedTravels, selectedTravel.id]);
      setShowReportTravelModal(false);
      setSelectedTravel(null);
      setReportTravelReasons({
        inappropriate: false, falseInfo: false, abusive: false, spam: false,
        violation: false, plagiarism: false, other: false,
      });
      setOtherTravelReason('');
      toast.success('Viagem denunciada.');
    }
  };

  const handleUnblockUser = async () => {
    if (profile && profileUserId) {
      try {
        setActionError('');
        await api.delete(`/users-management/${profileUserId}/unblock`);
        setBlockedUsers(blockedUsers.filter((u) => u !== profile.username));
        toast.success('Utilizador desbloqueado.');
        // FIX (Desbloqueio): re-fetch do perfil para revalidar
        // a relação (se o user desbloqueado estava a seguir-nos
        // ou nós a ele, o backend deve restaurar). Isto garante
        // que os contadores e o estado de relação refletem a
        // realidade após o desbloqueio, sem precisar de F5.
        refetchProfile();
      } catch (error) {
        console.error('Erro ao desbloquear utilizador:', error);
        setActionError(getApiErrorMessage(error, 'Não foi possível desbloquear este utilizador.'));
      }
    }
  };

  const loadFollowList = async (type) => {
    if (!profileUserId) return;
    // Reset do dedup map para não carregar dedup entries
    // do modal anterior (caso o user abra "Seguidores" e depois
    // "A seguir" sem fechar).
    lastAppliedStateRef.current = new Map();
    try {
      const endpoint = type === 'followers' ? '/users/followers' : '/users/follows';
      const title = type === 'followers' ? 'Seguidores' : 'A seguir';
      const response = await api.get(endpoint, { params: { userId: profileUserId, page: 0, size: 20 } });
      const list = Array.isArray(response.data) ? response.data : (response.data?.content || []);
      setModalContent({ title, list, type: 'follow', mode: 'users' });
      // `liveList` é a fonte de verdade para o JSX do modal.
      // Mantemos `modalContent.list` para o título e tipo.
      setLiveList(list);
      setShowFollowModal(true);
    } catch (error) {
      console.error('Erro ao buscar lista:', error);
      setModalContent({ title: type === 'followers' ? 'Seguidores' : 'A seguir', list: [], type: 'follow', mode: 'users' });
      setLiveList([]);
      setShowFollowModal(true);
    }
  };

  const closeFollowModal = () => {
    setShowFollowModal(false);
    setModalContent({ title: '', list: [], type: '', mode: 'users' });
    setLiveList([]);
    // Reset do dedup map no fecho do modal.
    lastAppliedStateRef.current = new Map();
  };

  // Quando o user clica "Seguir" / "Deixar de seguir" num item
  // dentro do modal de Seguidores / A seguir, atualizamos:
  //   1. `liveList` — o item pode sair da lista (caso "A seguir"
  //      + unfollow) ou apenas mudar de estado visual.
  //   2. `userStats.numberOfFollowing` / `numberOfFollowers` — o
  //      contador do hero atualiza em tempo real, sem F5.
  //
  // Convenção:
  //   - Modal "A seguir" (title = "A seguir"): quando o user desfaz
  //     follow de alguém, esse alguém sai da lista. numberOfFollowing
  //     decrementa.
  //   - Modal "Seguidores" (title = "Seguidores"): quando o user
  //     decide seguir um follower de volta, **numberOfFollowing**
  //     incrementa (ganhou um novo follow). numberOfFollowers
  //     mantém-se — esse user já seguia, é uma relação inversa.
  // (Dedup via `lastAppliedStateRef` — declarado no topo do
  // componente, ver comentário lá.)
  const handleListItemChange = useCallback(
    (changedId, newState) => {
      if (!changedId) return;
      const idKey = Number(changedId);
      // Deduplicação: o `FollowButton` chama `onChange` no
      // click (optimistic) e o `useEffect` interno do hook
      // chama-o de novo quando o state reconcilia. Sem
      // deduplicação, o contador +/- 1 dispara duas vezes.
      // Guardamos o último state aplicado por id e ignoramos
      // callbacks com o mesmo state. O `loadFollowList` reseta
      // o Map para não acumular referências de modais antigos.
      const lastApplied = lastAppliedStateRef.current.get(idKey);
      if (lastApplied === newState) return;
      lastAppliedStateRef.current.set(idKey, newState);
      // Usamos `useMemo` implícito via `String` para garantir
      // match de tipos (title é sempre string, mas podemos ter
      // trim/lowercase defensivo). O título é normalizado
      // exatamente como guardamos no `loadFollowList`:
      //   - "Seguidores"   → isFollowersList
      //   - "A seguir"     → isFollowsList
      // O `String(...).trim().toLowerCase()` garante que
      // variações tipo "  Seguidores " ou "SEGUIDORES" também
      // entram no caminho certo — antes o regex podia falhar
      // silenciosamente em casos com acentos/espaços invisíveis.
      const titleKey = String(modalContent.title || '').trim().toLowerCase();
      const isFollowsList = modalContent.type === 'follow' && titleKey === 'a seguir';
      const isFollowersList = modalContent.type === 'follow' && titleKey === 'seguidores';
      if (isFollowsList) {
        // Modal "A seguir": se o user deixou de seguir, o item
        // sai; se voltou a seguir, mantém.
        if (newState === 'not_following') {
          setLiveList((prev) => prev.filter((u) => Number(u?.id) !== idKey));
          setUserStats((prev) => (prev ? { ...prev, numberOfFollowing: Math.max(0, (prev.numberOfFollowing || 0) - 1) } : prev));
        } else if (newState === 'following') {
          // Re-seguiu: o número sobe de volta.
          setUserStats((prev) => (prev ? { ...prev, numberOfFollowing: (prev.numberOfFollowing || 0) + 1 } : prev));
        } else if (newState === 'pending') {
          // Perfil privado: o `FollowButton` fez optimistic
          // `following` (++ no contador) mas o backend respondeu
          // que é privado e ficou pendente. Reverter o ++
          // optimista — o user **ainda não está a seguir**, só
          // tem um pedido pendente. Quando o dono aceitar,
          // voltamos a receber `onChange('following')` e o
          // contador sobe de novo. Isto evita o cenário em que
          // o número ficava 2x acima do real (++ optimista +
          // ++ na aceitação).
          setUserStats((prev) => (prev ? { ...prev, numberOfFollowing: Math.max(0, (prev.numberOfFollowing || 0) - 1) } : prev));
        }
      } else if (isFollowersList) {
        // Modal "Seguidores": o user pode decidir seguir este
        // follower de volta. numberOfFollowing sobe (+1). O item
        // continua visível porque essa pessoa **continua a ser
        // nossa follower**; só o botão do item muda (handled by
        // FollowButton internamente).
        if (newState === 'following') {
          setUserStats((prev) => (prev ? { ...prev, numberOfFollowing: (prev.numberOfFollowing || 0) + 1 } : prev));
        } else if (newState === 'not_following') {
          setUserStats((prev) => (prev ? { ...prev, numberOfFollowing: Math.max(0, (prev.numberOfFollowing || 0) - 1) } : prev));
        } else if (newState === 'pending') {
          // Mesma lógica do "A seguir": reverter o ++ optimista
          // quando o target é privado. Sem isto, contaríamos um
          // follow que na verdade ainda está pendente.
          setUserStats((prev) => (prev ? { ...prev, numberOfFollowing: Math.max(0, (prev.numberOfFollowing || 0) - 1) } : prev));
        }
      }
    },
    [modalContent.type, modalContent.title]
  );

  // Remove um follower (Instagram-style "Remover Seguidor").
  // Chamado pelo botão (X) que aparece em cada item do modal
  // "Seguidores" quando o user está no próprio perfil. Optimistic:
  // tira o item da `liveList` imediatamente, decrementa
  // `numberOfFollowers`, e chama o endpoint. Em caso de erro,
  // reverte tudo.
  const handleRemoveFollower = useCallback(
    async (followerId) => {
      if (!profileUserId || !followerId) return;
      const previousList = liveList;
      const previousStats = userStats;
      // Optimistic
      setLiveList((prev) => prev.filter((u) => Number(u?.id) !== Number(followerId)));
      setUserStats((prev) => (prev ? { ...prev, numberOfFollowers: Math.max(0, (prev.numberOfFollowers || 0) - 1) } : prev));
      try {
        await request('POST', `/users/${followerId}/remove-follower`);
        toast.info('Seguidor removido.');
      } catch (err) {
        // Revert
        setLiveList(previousList);
        setUserStats(previousStats);
        const msg = err?.response?.data?.message || 'Não foi possível remover o seguidor.';
        toast.danger(msg);
      }
    },
    [profileUserId, liveList, userStats, toast]
  );

  const openStatsModal = (title, list, type = '') => {
    setModalContent({ title, list, type, mode: 'places' });
    setShowStatsModal(true);
  };

  const closeStatsModal = () => {
    setShowStatsModal(false);
    setModalContent({ title: '', list: [], type: '', mode: 'users' });
  };

  // Recebe mudanças do `FollowButton` (que vive dentro do
  // ProfileHero) e mantém o state de relationship em sincronia
  // com o resto do perfil — badge "A seguir", visibilidade do
  // feed privado, contadores, etc.
  // Tem de ser declarado antes dos early returns para respeitar
  // a regra dos React Hooks (sempre na mesma ordem).
  //
  // IMPORTANTE: este callback também atualiza os contadores de
  // seguidores/seguidos em tempo real. O Instagram faz assim: clicar
  // "Seguir" → o número "Seguidores" sobe imediatamente, sem
  // esperar por F5. Usamos o nome em `profile.username` como chave
  // para detectar a direção da mudança e ajustar +/- 1 nos
  // contadores. Se o user não era seguido e ficou `following`,
  // somamos 1; se era seguido e ficou `not_following`, subtraímos 1.
  // O caso `pending` NÃO altera o número de seguidores (ainda não
  // é seguidor até o pedido ser aceite).
  // (Dedup via `lastRelationshipStateRef` — declarado no topo
  // do componente, ver comentário lá.)
  // Re-fetch do profile detalhado. Usado quando o estado de
  // relationship muda de "following" para "not_following"
  // (unfollow) e o alvo é privado — o `canViewDetails` passa
  // de True para False, e a página tem de re-renderizar para
  // esconder a lista de viagens e mostrar a vista de perfil
  // privado. Sem este re-fetch, o user via as viagens antigas
  // até recarregar com F5.
  const refetchProfile = useCallback(async () => {
    if (!profileUserId) return;
    try {
      const { data: detailed } = await api.get(`/users/${profileUserId}/detailed`);
      if (!detailed) return;
      setProfile((prev) => prev ? {
        ...prev,
        canViewDetails: detailed.canViewDetails !== false,
        // Re-derivar o `privacy` string do boolean do backend
        privacy: detailed.privateProfile ? 'private' : 'public',
        privateProfile: detailed.privateProfile === true,
        numberOfFollowers: detailed.numberOfFollowers,
        numberOfFollowing: detailed.numberOfFollowing,
        followersCount: detailed.numberOfFollowers,
        followingCount: detailed.numberOfFollowing,
      } : prev);
      setUserStats((prev) => prev ? {
        ...prev,
        numberOfFollowers: detailed.numberOfFollowers || 0,
        numberOfFollowing: detailed.numberOfFollowing || 0,
        // stats de privacidade podem ter mudado (não-aplicável aqui,
        // mas defensivo: o backend pode mudar a visibilidade
        // a qualquer momento)
        totalVisitedCountries: detailed.totalVisitedCountries,
        totalVisitedCities: detailed.totalVisitedCities,
        totalMoneySpent: detailed.totalMoneySpent,
      } : prev);
    } catch (err) {
      // Silent — best effort
    }
  }, [profileUserId]);

  const onRelationshipChange = useCallback(
    (state) => {
      if (!profile?.username) return;
      // Deduplicação: ignora callbacks duplicados (click + reconcile).
      if (lastRelationshipStateRef.current === state) return;
      lastRelationshipStateRef.current = state;
      if (state === 'following') {
        setFollowing((prev) => (prev.includes(profile.username) ? prev : [profile.username]));
        setPendingRequests((prev) => prev.filter((u) => u !== profile.username));
        // Subimos `numberOfFollowers` no perfil visitado (a pessoa
        // ganhou um follower — eu). A heurística "subir sempre"
        // funciona porque o hook já confirmou com o backend
        // (`follow()` revalida com `is-following` no fim). Se o
        // user clicar 2x seguidas e a primeira chamada ainda
        // estiver em flight, o `+1` extra é corrigido pelo
        // reconcile final. Sem flag, sem race.
        setUserStats((prev) => (prev ? { ...prev, numberOfFollowers: (prev.numberOfFollowers || 0) + 1 } : prev));
      } else if (state === 'pending') {
        setFollowing((prev) => prev.filter((u) => u !== profile.username));
        setPendingRequests((prev) => (prev.includes(profile.username) ? prev : [profile.username]));
        // FIX (Round 30): o `FollowButton` faz optimistic
        // `notifyOptimistic(FOLLOWING)` no click, o que dispara
        // este callback com `state === 'following'` e incrementa
        // `numberOfFollowers`. Depois o `useEffect` do hook
        // reconcilia para `PENDING` (alvo privado) e chama este
        // callback outra vez. Sem esta reversão, o contador de
        // "Seguidores" ficava inflado (+1) mesmo o user só tendo
        // um pedido pendente — não é follower até o owner
        // aceitar. Anulamos o `+1` optimista aqui. Quando o owner
        // aceitar, voltamos a receber `onChange('following')` e o
        // contador sobe de novo, dessa vez corretamente.
        setUserStats((prev) => (prev ? { ...prev, numberOfFollowers: Math.max(0, (prev.numberOfFollowers || 0) - 1) } : prev));
      } else if (state === 'not_following') {
        setFollowing((prev) => prev.filter((u) => u !== profile.username));
        setPendingRequests((prev) => prev.filter((u) => u !== profile.username));
        // Decrementar seguidores (eu deixei de ser follower dele).
        setUserStats((prev) => (prev ? { ...prev, numberOfFollowers: Math.max(0, (prev.numberOfFollowers || 0) - 1) } : prev));
        // FIX (Round 32 — bug batch 1): quando o user sai de
        // "following" para "not_following" (unfollow) num perfil
        // privado, o `canViewDetails` muda de True para False e
        // a página tem de re-renderizar para esconder as viagens
        // e mostrar a vista privada. Sem este re-fetch, o user
        // via as viagens antigas até F5. Re-fetch IMEDIATO do
        // `/users/{id}/detailed` para obter o novo `canViewDetails`
        // e re-derivar o `privacy`. Fazemos isto em background
        // (best effort) — se falhar, o próximo re-render do
        // componente via `useEffect[username, profileVersion]`
        // recupera. Mas o caminho rápido é este.
        refetchProfile();
      }
    },
    [profile?.username, refetchProfile]
  );

  /* ── Loading / not-found states ────────────────────────── */
  if (loading) {
    return (
      <div className="gm-profile gm-profile--loading">
        <div className="gm-profile__spinner" aria-label="A carregar perfil">
          <div className="gm-profile__spinner-ring" />
        </div>
        <p>A carregar perfil…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="gm-profile gm-profile--empty">
        <Compass size={48} strokeWidth={1.5} />
        <h2>Viajante não encontrado</h2>
        <p>{actionError || 'Não foi possível carregar este perfil.'}</p>
        <Link to="/users" className="gm-profile__btn gm-profile__btn--primary">Explorar viajantes</Link>
      </div>
    );
  }

  /* ── Derived values ────────────────────────────────────── */
  const isOwnProfile = user && user.username === profile.username;
  const isFollowing = user && following.includes(profile.username);
  const isPending = user && pendingRequests.includes(profile.username);
  const isBlocked = user && blockedUsers.includes(profile.username);
  // `canViewDetails` pode vir do backend (quando o user não tem
  // permissão para ver tudo mas pode ver o surface público do
  // perfil) ou ser calculado localmente como fallback se o DTO
  // não trouxer o campo. Mantemos os dois caminhos para robustez.
  const canViewDetails = typeof profile?.canViewDetails === 'boolean'
    ? profile.canViewDetails
    : (isOwnProfile || (profile?.privacy === 'public') || isFollowing);
  const canViewFollowStats = isOwnProfile || (profile.privacy === 'public') || isFollowing;

  // FIX (Round 30): quando o viewer NÃO pode ver os detalhes
  // (perfil privado + não-follower), mostrávamos "0" no card de
  // Viagens. Isso é confuso — "0" sugere que o user não tem
  // viagens, quando na verdade o viewer é que não tem
  // autorização. Mostramos "—" em vez de 0 quando `canViewDetails`
  // é false. Mesmo princípio para `uniqueCountries`/`uniqueCities`
  // já abaixo — quando o viewer não tem permissão, escondemos.
  //
  // FIX (Round 33 — bug batch 2, item 2): o user pediu para
  // alinhar o número de viagens em todo o lado — APENAS
  // viagens públicas, mesmo para o owner. O backend agora
  // devolve `totalTrips` (= `countPublicVisibleByUserId`)
  // para todos os viewers, owner inclusive, por isso o badge
  // é o mesmo para toda a gente: 2 viagens para o oscar (não
  // 3). Antes o owner via `countByUserId` (= 3) e os outros
  // viam 2 — inconsistência.
  //
  // O `userStats.totalTrips` (definido no setUserStats acima)
  // é a fonte de verdade. NÃO usamos `travels.length` como
  // fallback porque o `travels` array (carregado via
  // `/trips/my-trips`) mistura públicas e privadas quando o
  // viewer é o próprio owner — o que voltava a inflacionar o
  // contador (ex: oscar tem 1 pública + 2 privadas, o contador
  // mostrava 3). Mantemos apenas fallback para
  // `profile.travelCount` (já coalescido no fetchAll com
  // `detailed.totalTrips || 0`).
  //
  // O contador de viagens NÃO é considerado informação
  // privada (mesmo perfis privados mostram o total público
  // para qualquer visitante) — coerente com Instagram e com
  // a regra "blocked users desaparecem".
  const totalTravels = (userStats && userStats.totalTrips != null
    ? userStats.totalTrips
    : (profile?.travelCount ?? 0));
  // Stats do owner (privacidade pode esconder):
  //   - `null` ⇒ user bloqueou a visibilidade ("Apenas para Mim"
  //     em /settings-and-privacy), ou o viewer não tem permissão.
  //   - número ⇒ valor real.
  //
  // FIX (Round 32): preservamos `null` em vez de coalescer para
  // 0. Antes, `userStats.totalVisitedCountries` (que pode ser
  // `null` quando o user bloqueou "Apenas para Mim") era
  // convertido em 0 via `|| 0` ou ternário. O `StatCard`
  // renderizava "0 países" — visualmente indistinguível de
  // "realmente zero países". Agora propaga-se o `null` até ao
  // `StatCard`, que já trata `null` → "—". Resultado: o user
  // percebe que a info está escondida por privacidade.
  //
  // FIX (Privacidade): os valores de `totalVisitedCountries`,
  // `totalVisitedCities`, `totalMoneySpent` vêm do backend
  // já filtrados pelas definições de privacidade do utilizador
  // (`showStatistics` e `showMonetaryStatistics`). O backend
  // retorna `null` quando o viewer não tem permissão.
  // Usamos `canViewDetails` em vez de `isOwnProfile` para que
  // visitantes com permissão também possam ver as estatísticas
  // que o owner configurou como públicas (ou para seguidores).
  const totalCountries = canViewDetails && userStats
    ? (userStats.totalVisitedCountries ?? null)
    : null;
  const totalCities = canViewDetails && userStats
    ? (userStats.totalVisitedCities ?? null)
    : null;
  const totalSpent = canViewDetails && userStats
    ? (userStats.totalMoneySpent ?? null)
    : null;
  // Para os valores monetários formatados (com prefixo "€"),
  // mantemos a formatação mas usamos `null` quando escondido.
  const avgSpent = canViewDetails && userStats && userStats.averageMoneyPerTrip != null
    ? userStats.averageMoneyPerTrip.toFixed(0)
    : null;
  const avgDays = canViewDetails && userStats && userStats.averageDaysPerTrip != null
    ? userStats.averageDaysPerTrip.toFixed(1)
    : null;

  const uniqueCountries = canViewDetails ? [...new Set(travels.map((t) => t.country).filter(Boolean))] : [];
  // Cidades: só conta o que tem `t.city` realmente definido. Antes
  // caía em fallback para `t.country` o que fazia "Cidades visitadas"
  // mostrar na verdade a lista de países. Agora a estatística
  // reflete fielmente a contagem de cidades distintas que o user
  // registou nas viagens (e exclui casos onde `city === country`).
  const uniqueCities = canViewDetails
    ? [...new Set(
        travels
          .map((t) => t.city)
          .filter((c) => Boolean(c) && c !== '')
      )].filter((c, i, arr) => arr.indexOf(c) === i)
    : [];

  const countryCounts = canViewDetails ? travels.reduce((acc, t) => {
    if (t.country) acc[t.country] = (acc[t.country] || 0) + 1;
    return acc;
  }, {}) : {};
  const cityCounts = canViewDetails ? travels.reduce((acc, t) => {
    // Só conta entradas com cidade real. Viagens sem cidade
    // atribuída não entram nas "Cidades visitadas" — a categoria
    // geográfica de topo continua a ser o país nesse caso.
    if (t.city && t.city !== t.country) acc[t.city] = (acc[t.city] || 0) + 1;
    return acc;
  }, {}) : {};
  const topCountries = canViewDetails
    ? Object.entries(countryCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([c]) => c)
    : [];
  const topCities = canViewDetails
    ? Object.entries(cityCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([c]) => c)
    : [];
  const totalLikes = canViewDetails ? travels.reduce((sum, t) => sum + (t.likes || 0), 0) : 0;
  const totalComments = canViewDetails ? travels.reduce((sum, t) => sum + (t.comments?.length || 0), 0) : 0;

  /* ── Blocked view ──────────────────────────────────────── */
  if (isBlocked && !isOwnProfile) {
    return (
      <div className="gm-profile gm-profile--blocked">
        <div className="gm-profile__blocked-icon">
          <Ban size={56} strokeWidth={1.5} />
        </div>
        <h2>@{profile.username}</h2>
        <p>Bloqueou este viajante.</p>
        {actionError && <p className="gm-profile__error">{actionError}</p>}
        <button type="button" className="gm-profile__btn gm-profile__btn--primary" onClick={handleUnblockUser}>
          Desbloquear
        </button>
        <Link to="/blocked-users" className="gm-profile__btn gm-profile__btn--ghost">
          Ver viajantes bloqueados
        </Link>
      </div>
    );
  }

  /* ── Private profile ───────────────────────────────────── */
  // FIX (Round 32): incluímos os modais `ReportUserModal` e
  // `BlockModal` também no early-return de `!canViewDetails`.
  // O user pode querer denunciar/bloquear um viajante mesmo
  // quando o perfil é privado (é a única "vista" que ele tem
  // sobre esse user, e a protecção é a mesma — o backend
  // valida que o utilizador-alvo existe e que o requester tem
  // permissões). Sem isto, o botão "Mais opções" do ProfileHero
  // abre o dropdown e o click em "Denunciar"/"Bloquear" não
  // faz nada — o modal nunca aparece porque o early-return
  // termina o render antes do `{showReportModal && ...}`.
  if (!canViewDetails) {
    return (
      <div className="gm-profile">
        <ProfileHero
          profile={profile}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          isPending={isPending}
          isBlocked={isBlocked}
          canViewFollowStats={canViewFollowStats}
          onReport={handleReportUser}
          onBlock={handleBlockUser}
          onLoadFollowers={() => loadFollowList('followers')}
          onLoadFollowing={() => loadFollowList('follows')}
          followersCount={userStats ? userStats.numberOfFollowers : (profile?.followersCount || 0)}
          followingCount={userStats ? userStats.numberOfFollowing : (profile?.followingCount || 0)}
          totalTravels={totalTravels}
          savedCount={savedCount}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          profileVersion={profileVersion}
          profileUserId={profileUserId}
          onRelationshipChange={onRelationshipChange}
        />
        <div className="gm-profile__private">
          <Lock size={40} strokeWidth={1.5} />
          <h2>Este perfil é privado</h2>
          <p>{isPending ? 'Aguarde até que o viajante aceite o seu pedido.' : 'Siga o viajante para ver as viagens e estatísticas.'}</p>
        </div>

        {/* Modais de gestão do viajante — disponíveis mesmo em
            perfis privados para que o user possa reportar/bloquear
            sem ter de pedir follow primeiro. */}
        {showReportModal && (
          <ReportUserModal
            reasons={reportReasons}
            onChange={handleReasonChange}
            otherReason={otherReason}
            setOtherReason={setOtherReason}
            onConfirm={confirmReportUser}
            onClose={() => setShowReportModal(false)}
            actionError={actionError}
          />
        )}
        {showBlockModal && (
          <ConfirmModal
            title="Bloquear utilizador"
            message={`Tem a certeza de que quer bloquear @${profile.username}? Esta ação pode ser revertida mais tarde.`}
            confirmLabel="Bloquear"
            onConfirm={confirmBlockUser}
            onClose={() => setShowBlockModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="gm-profile">
      <ProfileHero
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isPending={isPending}
        isBlocked={isBlocked}
        canViewFollowStats={canViewFollowStats}
        onReport={handleReportUser}
        onBlock={handleBlockUser}
        onLoadFollowers={() => loadFollowList('followers')}
        onLoadFollowing={() => loadFollowList('follows')}
        followersCount={userStats ? userStats.numberOfFollowers : (profile?.followersCount || 0)}
        followingCount={userStats ? userStats.numberOfFollowing : (profile?.followingCount || 0)}
        totalTravels={totalTravels}
        savedCount={savedCount}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        profileUserId={profileUserId}
        onRelationshipChange={onRelationshipChange}
      />

      {/* ── Pending follow requests (own profile only) ─────────
          Renders a compact card directly under the hero so the
          owner can accept/reject without scrolling. The card
          collapses when there are no requests. */}
      {isOwnProfile && followRequests.length > 0 && (
        <section className="gm-profile__follow-requests" aria-label="Pedidos de seguimento pendentes">
          <header className="gm-profile__follow-requests-head">
            <UserPlus size={16} strokeWidth={1.75} />
            <h2>Pedidos de seguimento</h2>
            <span className="gm-profile__follow-requests-count">{followRequests.length}</span>
          </header>
          <ul className="gm-profile__follow-requests-list">
            {followRequests.map((req) => {
              const requester = req.requester || {};
              const username = requester.username || `user-${req.id}`;
              const displayName = getDisplayName(requester, username);
              return (
                <li key={req.id} className="gm-profile__follow-requests-item">
                  <Avatar
                    src={requester.profilePhoto || requester.profilePicture}
                    name={displayName}
                    size="sm"
                  />
                  <div className="gm-profile__follow-requests-info">
                    <span className="gm-profile__follow-requests-name">
                      {displayName}
                    </span>
                    <span className="gm-profile__follow-requests-handle">@{username}</span>
                  </div>
                  <div className="gm-profile__follow-requests-actions">
                    <button
                      type="button"
                      className="gm-profile__btn gm-profile__btn--primary gm-profile__btn--sm"
                      onClick={() => handleAcceptFollowRequest(req.id)}
                      disabled={followRequestsLoading}
                    >
                      <Check size={14} strokeWidth={2} />
                      Aceitar
                    </button>
                    <button
                      type="button"
                      className="gm-profile__btn gm-profile__btn--ghost gm-profile__btn--sm"
                      onClick={() => handleRejectFollowRequest(req.id)}
                      disabled={followRequestsLoading}
                    >
                      <IconX size={14} strokeWidth={2} />
                      Rejeitar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="gm-profile__tabs-wrap">
        <nav className="gm-profile__tabs" role="tablist">
          {PROFILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`gm-profile__tab ${active ? 'gm-profile__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} strokeWidth={1.75} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="gm-profile__content">
        {activeTab === 'trips' && (
          <section className="gm-profile__section">
            {/* Sub-tabs (only for the owner): "As minhas viagens" vs
                "Viagens Guardadas" — both live inside the profile so
                the user never has to leave to browse their private
                collection. Visitors see only the public-trips list. */}
            {isOwnProfile && (
              <nav className="gm-profile__subtabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tripSubTab === 'trips'}
                  className={`gm-profile__subtab ${tripSubTab === 'trips' ? 'is-on' : ''}`}
                  onClick={() => setTripSubTab('trips')}
                >
                  <Compass size={14} strokeWidth={1.75} />
                  <span>As minhas viagens</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tripSubTab === 'saved'}
                  className={`gm-profile__subtab ${tripSubTab === 'saved' ? 'is-on' : ''}`}
                  onClick={() => setTripSubTab('saved')}
                >
                  <Bookmark size={14} strokeWidth={1.75} />
                  <span>Viagens Guardadas{savedCount != null ? ` (${savedCount})` : ''}</span>
                </button>
              </nav>
            )}

            {tripSubTab === 'trips' && (
              <>
                {/* Trips live on the profile now. The "Criar viagem" CTA is
                    shown both as a top-right action (when there are trips
                    to manage) and inside the empty state (so first-time
                    users have an obvious next step). */}
                {isOwnProfile && travels.length > 0 && (
                  <div className="gm-profile__manage-row">
                    <Link to="/trip/new" className="gm-profile__btn gm-profile__btn--primary">
                      <Plus size={15} strokeWidth={1.8} />
                      Criar viagem
                    </Link>
                  </div>
                )}

                {travels.length === 0 && !loadingTrips ? (
                  <div className="gm-profile__section-empty">
                    <div className="gm-profile__section-empty-icon">
                      <Compass size={32} strokeWidth={1.5} />
                    </div>
                    <h2>Ainda sem viagens</h2>
                    <p>{isOwnProfile ? 'Partilha a tua primeira memória para começar.' : 'Este viajante ainda não partilhou viagens.'}</p>
                    {isOwnProfile && (
                      <Link to="/trip/new" className="gm-profile__btn gm-profile__btn--primary" style={{ marginTop: 16 }}>
                        <Plus size={15} strokeWidth={1.8} />
                        Criar viagem
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="gm-profile__grid">
                    {travels.map((travel) => (
                      <UserTravelCard
                        key={travel.id}
                        travel={travel}
                        // FIX (Round 30): o owner NUNCA pode
                        // denunciar a própria viagem. Passamos
                        // `user={null}` quando é o próprio user
                        // para que o `UserTravelCard` saiba que
                        // não há visitor e esconda o menu kebab
                        // por completo (a entrada "Denunciar" só
                        // faria sentido se fosse outro user a ver
                        // — e nesse caso `user` é o visitor e o
                        // `travel.user` é o owner). Os botões
                        // Edit/Apagar vivem no owner-actions slot.
                        user={isOwnProfile ? null : user}
                        isOwnProfile={isOwnProfile}
                        onReport={isOwnProfile ? null : handleReportTravel}
                        onDelete={handleDeleteTrip}
                      />
                    ))}
                  </div>
                )}

                {tripsHasMore && (
                  <div className="gm-profile__more">
                    <button
                      type="button"
                      className="gm-profile__btn gm-profile__btn--primary"
                      onClick={() => fetchTripsPage(tripsPage + 1)}
                      disabled={loadingTrips}
                    >
                      {loadingTrips ? 'A carregar…' : 'Carregar mais'}
                    </button>
                  </div>
                )}
              </>
            )}

            {tripSubTab === 'saved' && isOwnProfile && (
              <SavedTripsPanel
                savedTrips={savedTrips}
                loading={savedLoading}
                onUnsave={handleUnsaveFromProfile}
                currentUser={user}
                onReport={handleReportTravel}
              />
            )}
          </section>
        )}

        {activeTab === 'stats' && (
          <section className="gm-profile__section">
            <h2 className="gm-profile__section-title">
              <TrendingUp size={18} strokeWidth={1.75} />
              Estatísticas do viajante
            </h2>

            {/* FIX (Apenas para Mim): quando não é o owner e as
                estatísticas de países, cidades e gastos são null
                (porque o backend as escondeu devido à privacidade
                "Apenas para Mim"), mostramos um banner informativo
                em vez dos vários cards com "—" sem contexto.
                O total de viagens públicas é SEMPRE visível. */}
            {!isOwnProfile &&
             totalCountries == null &&
             totalCities == null &&
             totalSpent == null ? (
              <div className="gm-profile__private-stats">
                <EyeOff size={32} strokeWidth={1.5} />
                <h3>Estatísticas privadas</h3>
                <p>Este viajante definiu as estatísticas como privadas. Não tens permissão para ver os detalhes.</p>
              </div>
            ) : (
              <>
                <div className="gm-profile__stats-grid">
                  <StatCard icon={Compass} label="Total de viagens" value={totalTravels} />
                  <StatCard
                    icon={Globe2}
                    label="Países visitados"
                    value={totalCountries}
                    onClick={() => openStatsModal('Países visitados', uniqueCountries)}
                  />
                  <StatCard
                    icon={MapPinned}
                    label="Cidades visitadas"
                    value={totalCities}
                    onClick={() => openStatsModal('Cidades visitadas', uniqueCities)}
                  />
                  <StatCard
                    icon={Wallet}
                    label={isOwnProfile ? "Total gasto" : "Total estimado"}
                    value={totalSpent == null ? '—' : `€ ${totalSpent.toLocaleString()}`}
                  />
                  {isOwnProfile && (
                    <>
                      <StatCard
                        icon={Wallet}
                        label="Média por viagem"
                        value={avgSpent == null ? '—' : `€ ${avgSpent}`}
                      />
                      <StatCard
                        icon={Clock3}
                        label="Duração média"
                        value={avgDays == null ? '—' : `${avgDays} dias`}
                      />
                    </>
                  )}
                </div>

                {(topCountries.length > 0 || topCities.length > 0) && (
                  <div className="gm-profile__top-dests">
                    <h3 className="gm-profile__section-subtitle">
                      <MapPin size={16} strokeWidth={1.75} />
                      Melhores destinos
                    </h3>
                    <div className="gm-profile__top-dests-grid">
                      {topCountries.length > 0 && (
                        <div className="gm-profile__top-card">
                          <h4>Top países</h4>
                          <ol>
                            {topCountries.map((c) => (
                              <li key={c}>
                                <span className="gm-profile__top-name">{c}</span>
                                <span className="gm-profile__top-count">{countryCounts[c]} visita{countryCounts[c] > 1 ? 's' : ''}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {topCities.length > 0 && (
                        <div className="gm-profile__top-card">
                          <h4>Top cidades</h4>
                          <ol>
                            {topCities.map((c) => (
                              <li key={c}>
                                <span className="gm-profile__top-name">{c}</span>
                                <span className="gm-profile__top-count">{cityCounts[c]} visita{cityCounts[c] > 1 ? 's' : ''}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <h3 className="gm-profile__section-subtitle">
                  <Heart size={16} strokeWidth={1.75} fill="currentColor" />
                  Engagement
                </h3>
                <div className="gm-profile__stats-grid gm-profile__stats-grid--mini">
                  <StatCard icon={Heart} label="Total de likes" value={totalLikes} />
                  <StatCard icon={MessageCircle} label="Total de comentários" value={totalComments} />
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {/* ── Modais ───────────────────────────────────────── */}
      {showFollowModal && (
        <ListModal
          title={modalContent.title}
          list={liveList}
          onClose={closeFollowModal}
          mode={modalContent.mode}
          onItemChange={handleListItemChange}
          // O botão "Remover" só faz sentido no modal de
          // "Seguidores" E quando estamos a ver o nosso próprio
          // perfil. O `showRemoveFollower` é a guarda do lado
          // do componente, mas o pai também só o passa nestas
          // duas condições combinadas.
          showRemoveFollower={Boolean(isOwnProfile && /^seguidores$/i.test(modalContent.title))}
          onRemoveFollower={handleRemoveFollower}
        />
      )}

      {showStatsModal && (
        <ListModal
          title={modalContent.title}
          list={modalContent.list}
          onClose={closeStatsModal}
          mode={modalContent.mode}
        />
      )}

      {showReportModal && (
        <ReportUserModal
          reasons={reportReasons}
          onChange={handleReasonChange}
          otherReason={otherReason}
          setOtherReason={setOtherReason}
          onConfirm={confirmReportUser}
          onClose={() => setShowReportModal(false)}
          actionError={actionError}
        />
      )}

      {showBlockModal && (
        <ConfirmModal
          title="Bloquear utilizador"
          message={`Tem a certeza de que quer bloquear @${profile.username}? Esta ação pode ser revertida mais tarde.`}
          confirmLabel="Bloquear"
          onConfirm={confirmBlockUser}
          onClose={() => setShowBlockModal(false)}
        />
      )}

      {selectedTravel && (
        <ReportSheet
          open={!!selectedTravel}
          onClose={() => setSelectedTravel(null)}
          travel={selectedTravel}
        />
      )}

      {/* Request sent toast (premium) */}
      <AnimatePresence>
        {showRequestToast && (
          <motion.div
            className="gm-profile__request-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Clock size={16} strokeWidth={2} />
            <span>Pedido enviado. A aguardar aprovação.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   PROFILE HERO (premium)
   ════════════════════════════════════════════════════════════════ */
const ProfileHero = ({
  profile, isOwnProfile, isFollowing, isPending, isBlocked,
  canViewFollowStats, onReport, onBlock,
  onLoadFollowers, onLoadFollowing, followersCount, followingCount, totalTravels,
  savedCount,
  showDropdown, setShowDropdown, profileVersion = 0,
  profileUserId, onRelationshipChange,
}) => {
  const hasCover = Boolean(profile.coverPhoto);
  const location = formatLocationText(profile.city, profile.country);

  // Round 90 (perf) — the profile cover was a `<div>` with
  // `background-image` (the design choice from R57). The problem
  // is that the browser treats a background-image as decoration
  // and offers NO WAY to use srcset, sizes, fetchpriority, or
  // loading hints. So the LCP element is the full-size JPEG
  // (3MB+) and the LCP sits at ~3s even on a fast connection.
  // The fix is to render an actual `<img>` with the same srcset
  // helper used by the rest of the app (ProgressiveImg). The
  // CSS keeps the same visual (object-fit: cover, position
  // center) so the user sees no change.
  let coverSrc = profile.coverPhoto || '';
  if (coverSrc && profileVersion > 0) {
    const sep = coverSrc.includes('?') ? '&' : '?';
    coverSrc = `${coverSrc}${sep}v=${profileVersion}`;
  }
  // Convert the absolute cover URL back to a relative path so
  // ProgressiveImg can build the WebP srcset. Falls back to the
  // original absolute URL if the strip fails.
  const coverRelative = (() => {
    if (!coverSrc) return null;
    if (!coverSrc.startsWith('http')) return coverSrc;
    try {
      const u = new URL(coverSrc);
      const base = new URL('https://globememories.com/files');
      // The cover URL was built by toFullMediaUrl(path) which
      // always uses BASE_FILES_URL. We hard-code the prod base
      // here because ProfileHero doesn't import mediaUrl helpers
      // and the path is guaranteed to be on the same origin.
      if (u.origin === base.origin && u.pathname.startsWith(base.pathname + '/')) {
        let rel = u.pathname.substring(base.pathname.length + 1);
        try { rel = decodeURIComponent(rel); } catch (_) { /* keep as-is */ }
        return rel;
      }
    } catch (_) { /* invalid URL */ }
    return null;
  })();

  return (
    <header className="gm-profile__hero">
      {/* Cover */}
      <div className={`gm-profile__cover ${hasCover ? 'gm-profile__cover--has-image' : ''}`}>
        {hasCover ? (
          coverRelative ? (
            <ProgressiveImg
              src={coverRelative}
              alt=""
              eager={true}
              sizes="(max-width: 768px) 100vw, 1280px"
              className="gm-profile__cover-img"
              imgClassName="gm-profile__cover-img-el"
            />
          ) : (
            <div
              className="gm-profile__cover-img"
              style={{
                backgroundImage: `url(${coverSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )
        ) : (
          <div className="gm-profile__cover-default" aria-hidden="true">
            <div className="gm-profile__cover-gradient" />
          </div>
        )}
        <div className="gm-profile__cover-shade" />
      </div>

      {/* Content (over the cover) */}
      <div className="gm-profile__hero-content">
        <div className="gm-profile__hero-row">
          <button
            type="button"
            className="gm-profile__avatar"
            aria-label={`Avatar de ${profile.name}`}
            onClick={() => { /* future: open avatar lightbox */ }}
          >
            <Avatar
              src={profile.profilePicture}
              name={profile.name}
              size="xl"
            />
          </button>

          <div className="gm-profile__hero-info">
            <div className="gm-profile__hero-name-row">
              <h1 className="gm-profile__name">{profile.name}</h1>
              {isFollowing && (
                <span className="gm-profile__following-badge">
                  <Check size={12} strokeWidth={2.5} />
                  A seguir
                </span>
              )}
              {isOwnProfile && profile.privacy === 'public' && (
                <span className="gm-profile__own-badge">Tu</span>
              )}
            </div>
            <p className="gm-profile__handle">@{profile.username}</p>
            {location && (
              <p className="gm-profile__location">
                <MapPin size={13} strokeWidth={1.75} className="gm-profile__location-icon" />
                {location}
              </p>
            )}
          </div>

          <div className="gm-profile__hero-actions">
            {isOwnProfile ? (
              // FIX (Round 32 — bug batch 1): o user pediu um
              // botão de "Definições" visível no profile do
              // próprio user, em desktop E mobile (no mobile a
              // tab bar inferior não tinha settings nem logout
              // — BUG 10). Agora o owner vê "Editar perfil",
              // "Definições" e "Sair" no canto superior direito
              // do hero, em qualquer viewport. O botão de logout
              // invoca o mesmo handler do sidebar desktop.
              <>
                <Link
                  to="/settings-and-privacy"
                  className="gm-profile__btn gm-profile__btn--ghost"
                >
                  <Settings size={14} strokeWidth={1.75} />
                  Definições
                </Link>
                <Link
                  to={`/profile/edit/${profile.username}`}
                  className="gm-profile__btn gm-profile__btn--primary"
                >
                  Editar perfil
                </Link>
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--danger"
                  onClick={() => {
                    try { setAuthHeader(null); } catch (_) { /* no-op */ }
                    try { localStorage.removeItem('user'); } catch (_) { /* no-op */ }
                    try { localStorage.removeItem('user-travels'); } catch (_) { /* no-op */ }
                    try { window.location.href = '/login'; } catch (_) { /* no-op */ }
                  }}
                >
                  <LogOut size={14} strokeWidth={1.75} />
                  Sair
                </button>
              </>
            ) : (
              <>
                <FollowButton
                  userId={profileUserId}
                  username={profile?.username}
                  privateProfile={profile?.privateProfile === true}
                  initialIsFollowing={isFollowing}
                  initialIsPending={isPending}
                  size="md"
                  onChange={onRelationshipChange}
                />
                {/* Round 58 — the admin account is the platform's
                    superuser. Visitors can't block or report it
                    (the kebab menu is hidden) so it never lands on
                    anyone's blocked list or in the admin reports
                    queue. We detect "admin" by role. */}
                {profile?.role !== 'ADMIN' && (
                  <div className="gm-profile__menu-wrap">
                    <button
                      type="button"
                      className="gm-profile__iconbtn"
                      aria-label="Mais opções"
                      onClick={(e) => { e.stopPropagation(); setShowDropdown((s) => !s); }}
                    >
                      <MoreHorizontal size={18} strokeWidth={1.75} />
                    </button>
                    {showDropdown && (
                      <div className="gm-profile__menu-pop">
                        <button type="button" onClick={onReport}>
                          <Flag size={14} strokeWidth={1.75} /> Denunciar
                        </button>
                        <button type="button" onClick={onBlock}>
                          <Ban size={14} strokeWidth={1.75} /> Bloquear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="gm-profile__bio">{profile.bio}</p>
        )}

        {/* Round 83 — languages spoken. The backend stores a
            comma-separated string on `User.languagesSpoken`;
            we split + trim it into an array in the `profile`
            object and render a chip row right under the bio.
            Each chip is just a small pill with the language
            name; no flag emoji because we don't have a
            language -> flag map and the user types the name
            in Portuguese anyway. */}
        {Array.isArray(profile.languagesSpoken) && profile.languagesSpoken.length > 0 && (
          <div className="gm-profile__languages" aria-label="Línguas faladas">
            <span className="gm-profile__languages-label">Línguas</span>
            <ul className="gm-profile__languages-list">
              {profile.languagesSpoken.map((lang) => (
                <li key={lang} className="gm-profile__lang-pill">{lang}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats row (premium, clickable) */}
        <div className="gm-profile__stats-row">
          <Stat
            value={totalTravels}
            label="Viagens"
            icon={Compass}
          />
          <Stat
            value={followersCount}
            label="Seguidores"
            icon={Users2}
            onClick={canViewFollowStats ? onLoadFollowers : undefined}
            clickable={canViewFollowStats}
          />
          <Stat
            value={followingCount}
            label="A seguir"
            icon={UserPlus}
            onClick={canViewFollowStats ? onLoadFollowing : undefined}
            clickable={canViewFollowStats}
          />
        </div>
      </div>
    </header>
  );
};

/* ── Stat (premium clickable) ─────────────────────────────── */
const Stat = ({ value, label, icon: Icon, onClick, clickable }) => {
  const Wrapper = onClick ? 'button' : 'div';
  // FIX (Round 30): quando o valor é `null` (privacidade esconde
  // a stat, ou o viewer não tem permissão para ver os detalhes),
  // mostramos "—" em vez de 0. "0" sugere "realmente zero" e
  // induz o user em erro. "—" comunica "não disponível" sem
  // revelar a contagem real (que pertence à privacidade do
  // owner).
  const displayValue = (value === null || value === undefined) ? '—' : value;
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`gm-profile__stat ${clickable ? 'gm-profile__stat--clickable' : ''}`}
    >
      <span className="gm-profile__stat-value">{displayValue}</span>
      <span className="gm-profile__stat-label">{label}</span>
    </Wrapper>
  );
};

/* ── StatCard (reusable for stats grid) ──────────────────── */
const StatCard = ({ icon: Icon, label, value, onClick }) => {
  const Wrapper = onClick ? 'button' : 'div';
  // FIX (Round 32): quando o `value` é `null` (privacidade
  // esconde a stat, ou o viewer não tem permissão), mostramos
  // "—" em vez do `null` literal (que aparecia como "null" no
  // ecrã) ou do 0. "—" comunica "não disponível" sem revelar
  // a contagem real (que pertence à privacidade do owner).
  const displayValue = (value === null || value === undefined) ? '—' : value;
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`gm-profile__stat-card ${onClick ? 'gm-profile__stat-card--clickable' : ''}`}
    >
      <div className="gm-profile__stat-card-icon">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="gm-profile__stat-card-body">
        <div className="gm-profile__stat-card-value">{displayValue}</div>
        <div className="gm-profile__stat-card-label">{label}</div>
      </div>
    </Wrapper>
  );
};

/* ════════════════════════════════════════════════════════════════
   USER TRAVEL CARD (compact, profile-grid)
   ════════════════════════════════════════════════════════════════ */
const UserTravelCard = ({ travel, user, onReport, isOwnProfile, onEdit, onDelete, extraMenuAction, hideMenu = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const menuRef = React.useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [menuOpen]);

  // Privacy badge config: which icon + label to show on the photo
  // so viewers know who the trip is meant for at a glance.
  // Round 46+ — Drafts are gone, so the only labels left are
  // Privada / Pública. We also flag multi-destination trips with a
  // small "Multi" pill so users browsing the profile can see at a
  // glance how many stops the trip has.
  const privacy = (travel.privacy || 'PUBLIC').toUpperCase();
  const privacyBadge = privacy === 'PRIVATE'
    ? { icon: Lock,  label: 'Privada', className: 'gm-profile-card__privacy--private' }
    : { icon: Globe, label: 'Pública', className: 'gm-profile-card__privacy--public' };
  // Multi-destination: detected from the `cities` array length on
  // the trip feed DTO (the backend returns the full list).
  const isMultiDest = Array.isArray(travel.cities) && travel.cities.length > 1;

  const PrivacyIcon = privacyBadge.icon;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Eliminar esta viagem? Esta ação não pode ser revertida.')) return;
    try {
      setDeleting(true);
      await onDelete?.(travel);
    } catch (err) {
      toast?.danger?.('Não foi possível eliminar a viagem.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="gm-profile-card">
      <Link to={`/travel/${travel.id}`} className="gm-profile-card__link">
        <div className="gm-profile-card__media">
          {travel.highlightImage ? (
            <ProgressiveImg
              src={travel.highlightImage}
              alt={travel.name}
              // Round 90 (perf) — was a raw <img> with
              // `src={highlightImage}` (the FULL-SIZE original
              // URL via toFullMediaUrl) + `loading="lazy"`. No
              // srcset, no sizes, no fetchpriority. The browser
              // was downloading ~3MB of JPEG per card, even on
              // a 360px phone screen. Now ProgressiveImg builds
              // the WebP srcset and the browser picks the
              // 320w/640w thumb (~30KB) instead. 100x smaller
              // payload.
              // `eager={false}` because the first card is NOT
              // the LCP on the profile page (the cover is) —
              // we want lazy on these so the browser can spend
              // its bandwidth on the cover first.
              eager={false}
              sizes="(max-width: 768px) 50vw, 280px"
              imgClassName="gm-profile-card__photo"
            />
          ) : (
            <div className="gm-profile-card__photo gm-profile-card__photo--empty">
              <ImageIcon size={28} strokeWidth={1.5} />
            </div>
          )}

          {/* Preço total no canto superior esquerdo (em vez das
              pills de categoria/estrela que ocupavam muito espaço
              visual e redundavam com a info do body). Só mostra
              quando há um valor > 0. */}
          {Number(travel.price) > 0 && (
            <div className="gm-profile-card__media-top">
              <span className="gm-profile-card__pill gm-profile-card__pill--price">
                {formatPrice(travel.price)}
              </span>
            </div>
          )}

          {/* Privacy badge — bottom-left of the photo, glassmorphism.
              Multi-destination trips also get a small "Multi" pill so
              the user can see how many stops the trip has at a glance. */}
          <div className="gm-profile-card__media-bottom">
            <div
              className={`gm-profile-card__privacy ${privacyBadge.className}`}
              title={`Visibilidade: ${privacyBadge.label}`}
              aria-label={`Viagem ${privacyBadge.label.toLowerCase()}`}
            >
              <PrivacyIcon size={11} strokeWidth={1.75} />
              <span>{privacyBadge.label}</span>
            </div>
            {/* Round 72 — Removed the "Multidestino" pill. The
                meta-row below already advertises the full route
                (cidades joined with "→") so the pill is redundant
                noise on top of the cover photo. Same for the
                "Destino Único" pill, which the /travels feed kept
                but the user wants gone from the profile too. */}
          </div>
        </div>
        <div className="gm-profile-card__body">
          {/* Owner controls (Edit / Delete) — own-profile only.
              Posicionados no canto superior direito do body para
              ficarem por cima do título, em vez de em cima da foto. */}
          {isOwnProfile && (
            <div className="gm-profile-card__owner-actions">
              <button
                type="button"
                className="gm-profile-card__owner-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/trip/${travel.id}/edit`);
                }}
                aria-label="Editar viagem"
                title="Editar"
              >
                <Edit3 size={12} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className="gm-profile-card__owner-btn gm-profile-card__owner-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Eliminar viagem"
                title="Eliminar"
              >
                <Trash2 size={12} strokeWidth={1.75} />
              </button>
            </div>
          )}
          <h3 className="gm-profile-card__title">{travel.name}</h3>
          {/* Meta: cidade + país. Para viagens multi-destino,
              mostramos TODAS as cidades separadas por " → " (igual
              ao cabeçalho da página de detalhe, gm-td__topbar-sub),
              em vez de apenas a primeira cidade + país. */}
          {isMultiDest ? (
            <p className="gm-profile-card__meta">
              <MapPin size={12} strokeWidth={1.75} />
              {(travel.cities || []).join(' → ')}
            </p>
          ) : (
            (travel.city || travel.country) && (
              <p className="gm-profile-card__meta">
                <MapPin size={12} strokeWidth={1.75} />
                {formatLocationText(travel.city, travel.country)}
              </p>
            )
          )}
          {/* Categorias — sempre visíveis em baixo do país. Se a
              viagem não tiver categorias associadas, esta linha
              simplesmente não renderiza (em vez de mostrar um
              placeholder vazio). */}
          {Array.isArray(travel.category) && travel.category.length > 0 && (
            <div className="gm-profile-card__cats" aria-label="Categorias da viagem">
              {travel.category.map((c, i) => (
                <span key={`${c}-${i}`} className="gm-profile-card__cat-pill">{c}</span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Visitor menu — Denunciar + extraMenuAction (e.g. Remover
          dos guardados quando o card é uma SavedTripCard).
          Regras (Round 30):
          - Owner da viagem: NÃO mostra o kebab. Denunciar a própria
            viagem não faz sentido. Os botões de Edit/Apagar
            vivem no owner-actions slot em cima do título.
            (Excepção: se houver `extraMenuAction` definida, ex:
            "Remover dos guardados" numa SavedTripCard, o kebab
            aparece para o owner.)
          - Visitor (não-owner): kebab aparece sempre, com a
            entrada "Denunciar" se `onReport` foi passada.
          - Sem `user` (visitante anónimo): kebab não aparece.
          - hideMenu (Round 49): o consumidor (ex: SavedTripCard na
            tab "Viagens Guardadas") pode forçar a remoção completa
            do kebab — útil quando o destino do pop-up é incerto e
            queremos mostrar as acções via botões directos no
            owner-actions slot em vez de pop-up. */}
      {(() => {
        if (hideMenu) return null;
        const isOwn = user && travel.user && user.username === travel.user;
        const showMenu = (!isOwn && user) || extraMenuAction;
        if (!showMenu) return null;
        return (
          <div ref={menuRef} className="gm-profile-card__menu">
            <button
              type="button"
              className="gm-profile-card__menu-btn"
              aria-label="Mais opções"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((m) => !m); }}
            >
              <MoreHorizontal size={16} strokeWidth={1.75} />
            </button>
            {menuOpen && (
              <div className="gm-profile-card__menu-pop">
                {extraMenuAction && (
                  <button
                    type="button"
                    className={extraMenuAction.danger ? 'gm-profile-card__menu-item--danger' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      extraMenuAction.onClick?.();
                      setMenuOpen(false);
                    }}
                  >
                    {extraMenuAction.icon && (
                      <extraMenuAction.icon size={13} strokeWidth={1.75} />
                    )}{' '}
                    {extraMenuAction.label}
                  </button>
                )}
                {/* Denunciar — só para visitors (não-owner) com
                    `onReport` passada. Nunca aparece para o owner. */}
                {user && !isOwn && onReport && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onReport?.(travel); setMenuOpen(false); }}
                  >
                    <Flag size={13} strokeWidth={1.75} /> Denunciar
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </article>
  );
};

/* ════════════════════════════════════════════════════════════════
   MODALS (premium, in-line)
   ════════════════════════════════════════════════════════════════ */
const ModalShell = ({ children, onClose, maxWidth = 480 }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="gm-modal" onClick={onClose}>
      <div className="gm-modal__panel" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="gm-modal__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <IconX size={18} strokeWidth={1.75} />
        </button>
        {children}
      </div>
    </div>
  );
};

// Render modes for the list modal:
// - "users"  → each item is a UserBasicDto (followers / following
//              lists). The avatar is clickable, the row has a
//              FollowButton so the user can manage relationships
//              without leaving the modal. Quando o user clica
//              "Seguir" / "Deixar de seguir" dentro do modal,
//              chamamos `onItemChange(itemId, state)` para o pai
//              atualizar a lista localmente — o item removido
//              desaparece sem precisar de re-fetch.
//              Adicionalmente, no modo "Seguidores" (title regex
//              match), cada item tem um botão "Remover" (X) que
//              chama `onRemoveFollower(itemId)` para o owner
//              deixar de ser seguido por esse user (sem afectar
//              a relação inversa `owner → follower`).
// - "places" → each item is a plain string (country / city name).
//              Rendered as a clean list with a MapPin icon, no
//              avatar / follow button.
const ListModal = ({
  title, list, onClose, mode = "users", onItemChange, onRemoveFollower, showRemoveFollower,
}) => (
  <ModalShell onClose={onClose}>
    <div className="gm-modal__header">
      <h2>{title}</h2>
    </div>
    <div className="gm-modal__body">
      {list.length === 0 ? (
        <p className="gm-modal__empty">Nenhum resultado.</p>
      ) : (
        <ul className="gm-modal__list">
          {list.map((item, i) => {
            if (mode === "places") {
              const label = typeof item === "string" ? item : item?.name || "";
              return (
                <li key={`${label}-${i}`} className="gm-modal__list-place">
                  <div className="gm-modal__list-place-icon" aria-hidden="true">
                    <MapPin size={16} strokeWidth={1.75} />
                  </div>
                  <span className="gm-modal__list-place-name">{label}</span>
                </li>
              );
            }
            const userId = item?.id;
            const username = item?.username || '';
            const name = [item?.firstName, item?.lastName].filter(Boolean).join(' ') || username;
            // Hint inicial para o FollowButton: na lista "A seguir"
            // sabemos que o user **já** segue cada item. Na lista
            // "Seguidores" assumimos que o user NÃO os segue de
            // volta (o caso comum); se for diferente, o hook
            // revalida em background via /users/is-following.
            // Isto evita piscar o botão errado no primeiro frame.
            const initialFollowing = title && /^a seguir$/i.test(title);
            return (
              <li key={userId || username || i} className="gm-modal__list-user">
                <Link to={`/profile/${username}`} className="gm-modal__list-item" onClick={onClose}>
                  <Avatar src={item?.profilePhoto} name={name} size="sm" />
                  <div className="gm-modal__list-info">
                    <span className="gm-modal__list-name">{name}</span>
                    <span className="gm-modal__list-handle">@{username}</span>
                  </div>
                </Link>
                <div className="gm-modal__list-actions">
                  {/* Botão "Remover" — visível só no modal "Seguidores"
                      (showRemoveFollower) e só no próprio perfil
                      (passado pelo pai). Remove o follower sem
                      afectar a relação inversa. O pai atualiza
                      a lista + o contador via onRemoveFollower. */}
                  {showRemoveFollower && (
                    <button
                      type="button"
                      className="gm-modal__list-remove"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onRemoveFollower) onRemoveFollower(userId);
                      }}
                      title={`Remover @${username}`}
                      aria-label={`Remover @${username}`}
                    >
                      <UserMinus size={14} strokeWidth={1.75} />
                    </button>
                  )}
                  <div className="gm-modal__list-action" onClick={(e) => e.stopPropagation()}>
                    <FollowButton
                      userId={userId}
                      username={username}
                      privateProfile={Boolean(item?.privateProfile)}
                      initialIsFollowing={Boolean(initialFollowing)}
                      size="sm"
                      onChange={(state) => onItemChange && onItemChange(userId, state)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </ModalShell>
);

const ConfirmModal = ({ title, message, confirmLabel, onConfirm, onClose }) => (
  <ModalShell onClose={onClose}>
    <div className="gm-modal__header">
      <h2>{title}</h2>
    </div>
    <div className="gm-modal__body">
      <p style={{ margin: 0, color: 'var(--gm-text-2)', lineHeight: 1.55 }}>{message}</p>
    </div>
    <div className="gm-modal__footer">
      <button type="button" className="gm-profile__btn gm-profile__btn--ghost" onClick={onClose}>
        Cancelar
      </button>
      <button type="button" className="gm-profile__btn gm-profile__btn--danger" onClick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  </ModalShell>
);

const REPORT_USER_REASONS = [
  { key: 'inappropriate', label: 'Conteúdo inapropriado', desc: 'Imagens, descrições ou linguagem ofensiva.' },
  { key: 'falseInfo', label: 'Informação falsa', desc: 'Perfis, viagens ou locais inventados.' },
  { key: 'abusive', label: 'Assédio ou abuso', desc: 'Comportamento agressivo ou ameaçador.' },
  { key: 'spam', label: 'Spam', desc: 'Publicidade abusiva ou links externos.' },
  { key: 'harassment', label: 'Ameaças', desc: 'Ameaças, doxxing ou intimidação.' },
  { key: 'other', label: 'Outro (especificar)', desc: 'Descreva o motivo abaixo.' },
];

const REPORT_TRAVEL_REASONS = [
  { key: 'inappropriate', label: 'Conteúdo inapropriado', desc: 'Imagens ofensivas, nudez, etc.' },
  { key: 'falseInfo', label: 'Informação falsa', desc: 'Locais inexistentes, preços manipulados.' },
  { key: 'abusive', label: 'Assédio/Abuso', desc: 'Linguagem agressiva ou ofensiva.' },
  { key: 'spam', label: 'Spam', desc: 'Publicidade abusiva ou links externos.' },
  { key: 'plagiarism', label: 'Plágio', desc: 'Fotos ou textos copiados sem créditos.' },
  { key: 'violation', label: 'Violação das regras', desc: 'Quebra dos termos da plataforma.' },
  { key: 'other', label: 'Outro (especificar)', desc: 'Descreva o motivo abaixo.' },
];

const ReportUserModal = ({ reasons, onChange, otherReason, setOtherReason, onConfirm, onClose, actionError }) => (
  <ModalShell onClose={onClose} maxWidth={520}>
    <div className="gm-modal__header">
      <h2>Denunciar utilizador</h2>
      <p className="gm-modal__subtitle">Esta ação reporta o viajante aos administradores.</p>
    </div>
    <div className="gm-modal__body">
      {actionError && <p className="gm-modal__error">{actionError}</p>}
      <div className="gm-modal__reasons">
        {REPORT_USER_REASONS.map((r) => (
          <label key={r.key} className={`gm-modal__reason ${reasons[r.key] ? 'gm-modal__reason--checked' : ''}`}>
            <input
              type="checkbox"
              checked={!!reasons[r.key]}
              onChange={() => onChange(r.key)}
            />
            <div>
              <strong>{r.label}</strong>
              <span>{r.desc}</span>
            </div>
          </label>
        ))}
      </div>
      {reasons.other && (
        <textarea
          className="gm-modal__textarea"
          placeholder="Descreva o motivo da denúncia…"
          value={otherReason}
          onChange={(e) => setOtherReason(e.target.value)}
          rows={3}
        />
      )}
    </div>
    <div className="gm-modal__footer">
      <button type="button" className="gm-profile__btn gm-profile__btn--ghost" onClick={onClose}>
        Cancelar
      </button>
      <button type="button" className="gm-profile__btn gm-profile__btn--danger" onClick={onConfirm}>
        Denunciar
      </button>
    </div>
  </ModalShell>
);

const ReportTravelModal = ({ travel, reasons, onChange, otherReason, setOtherReason, onConfirm, onClose }) => (
  <ModalShell onClose={onClose} maxWidth={520}>
    <div className="gm-modal__header">
      <h2>Denunciar viagem</h2>
      <p className="gm-modal__subtitle"><strong>{travel.name}</strong></p>
    </div>
    <div className="gm-modal__body">
      <div className="gm-modal__reasons">
        {REPORT_TRAVEL_REASONS.map((r) => (
          <label key={r.key} className={`gm-modal__reason ${reasons[r.key] ? 'gm-modal__reason--checked' : ''}`}>
            <input
              type="checkbox"
              checked={!!reasons[r.key]}
              onChange={() => onChange(r.key)}
            />
            <div>
              <strong>{r.label}</strong>
              <span>{r.desc}</span>
            </div>
          </label>
        ))}
      </div>
      {reasons.other && (
        <textarea
          className="gm-modal__textarea"
          placeholder="Descreva o motivo da denúncia…"
          value={otherReason}
          onChange={(e) => setOtherReason(e.target.value)}
          rows={3}
        />
      )}
    </div>
    <div className="gm-modal__footer">
      <button type="button" className="gm-profile__btn gm-profile__btn--ghost" onClick={onClose}>
        Cancelar
      </button>
      <button type="button" className="gm-profile__btn gm-profile__btn--danger" onClick={onConfirm}>
        Denunciar
      </button>
    </div>
  </ModalShell>
);

// We rely on the lucide Users2 icon; if missing, we re-export via fallthrough.
// (In lucide-react v0.4xx, the named export is `Users`.)
function Users2(props) {
  // Tiny inline shim so we don't depend on a specific lucide name.
  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/**
 * SavedTripsPanel — the in-profile "Viagens Guardadas" view.
 * Renders a responsive grid of cards; each card links to the
 * trip's detail page and has an "unsave" button that talks
 * directly to /trips/{id}/save. Kept inline (rather than
 * importing SavedTrips) so the layout lives next to the rest
 * of the profile UI.
 */
function SavedTripsPanel({ savedTrips, loading, onUnsave, currentUser, onReport }) {
  if (loading) {
    return (
      <div className="gm-profile__section-empty">
        <p>A carregar…</p>
      </div>
    );
  }
  if (!savedTrips.length) {
    return (
      <div className="gm-profile__section-empty">
        <div className="gm-profile__section-empty-icon">
          <Bookmark size={32} strokeWidth={1.5} />
        </div>
        <h2>Ainda não guardaste nenhuma viagem</h2>
        <p>Toca no ícone de marcador nas viagens que quiseres guardar para ver aqui.</p>
      </div>
    );
  }
  return (
    <div className="gm-profile__grid">
      {savedTrips.map((trip) => (
        <SavedTripCard
          key={trip.tripId}
          trip={trip}
          onUnsave={onUnsave}
          currentUser={currentUser}
          onReport={onReport}
        />
      ))}
    </div>
  );
}

function SavedTripCard({ trip, onUnsave, currentUser, onReport }) {
  // The `trip` object comes from `/trips/saved` (TripFeedDto shape):
  //   { tripId, tripTitle, tripPhoto, citiesVisited, countriesVisited,
  //     categories, totalCosts, tripRating, username, tripPrivacy, ... }
  // The shared `UserTravelCard` expects the UI shape produced by
  // `mapTripSummaryToUiTrip`:
  //   { id, name, price, category, country, city, highlightImage,
  //     user, privacy, ... }
  // We map on the fly so the saved card looks IDENTICAL to the
  // "As minhas viagens" tab — same photo, same price pill, same
  // categories row, same kebab menu. This was the bug: the old
  // SavedTripCard was a simplified custom component that skipped
  // all that. The user reported the saved cards were missing
  // categories, total price, the 3-dot menu and the cover photo.
  const travel = {
    id: trip.tripId,
    name: trip.tripTitle || 'Viagem',
    price: trip.totalCosts ?? 0,
    category: Array.isArray(trip.categories)
      ? trip.categories.map((c) => c.categoryName).filter(Boolean)
      : [],
    country: (trip.countriesVisited && trip.countriesVisited[0]) || '',
    city: (trip.citiesVisited && trip.citiesVisited[0]) || '',
    user: trip.username || '',
    highlightImage: trip.tripPhoto ? toFullMediaUrl(trip.tripPhoto) : null,
    privacy: (trip.tripPrivacy || 'PUBLIC').toUpperCase(),
  };
  return (
    <UserTravelCard
      travel={travel}
      user={currentUser}
      isOwnProfile={Boolean(currentUser && currentUser.username === travel.user)}
      // Round 49 — Tab "Viagens Guardadas": removemos o kebab menu
      // (3 pontos) porque o pop-up estava a abrir e fechar sem
      // utilidade. O utilizador controla a remoção dos guardados e
      // a denúncia a partir dos botões directos no owner-actions
      // slot (em cima do título do card), sem precisar de pop-up.
      hideMenu
      onEdit={null}
      onDelete={null}
      onReport={onReport}
      // `onUnsave` lives in the kebab pop-up of the card (see
      // below): we extend the kebab with a "Remover dos guardados"
      // entry when this prop is provided.
      extraMenuAction={
        onUnsave
          ? {
              label: 'Remover dos guardados',
              icon: Bookmark,
              onClick: () => onUnsave(travel.id),
              danger: true,
            }
          : null
      }
    />
  );
}

export default UserProfile;
