import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
// ...existing code...
import { FaCheck, FaStar, FaFlag, FaBan, FaEllipsisV, FaEdit, FaUserMinus, FaClock, FaUserPlus, FaChartBar, FaMapMarkerAlt } from 'react-icons/fa';
import api, { toFullMediaUrl, getUserAvatar } from '../axios_helper';

const UserProfile = () => {
  const { user } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', list: [], type: '' });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [showTravelDropdown, setShowTravelDropdown] = useState(null);
  const [showReportTravelModal, setShowReportTravelModal] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [reportedTravels, setReportedTravels] = useState([]);
  const [reportTravelReasons, setReportTravelReasons] = useState({
    inappropriate: false,
    falseInfo: false,
    abusive: false,
    spam: false,
    violation: false,
    plagiarism: false,
    other: false,
  });
  const [otherTravelReason, setOtherTravelReason] = useState('');

  // Cached categories from the backend. Loaded once on mount so we
  // can resolve the category IDs in TripDto (returned by both
  // `/trips/my-trips` and `/trips/user/{id}/public`) to their
  // human-readable names in the trip cards.
  const [apiCategories, setApiCategories] = useState([]);
  
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
  const [userStats, setUserStats] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Resolve a TripDto payload from the paginated endpoints
  // (`/trips/my-trips` and `/trips/user/{id}/public`) into the UI
  // shape the trip cards expect.
  const mapTripSummaryToUiTrip = (trip, ownerUsername, apiCategories) => {
    // City names are NOT stored in TripDto (only IDs). We pull the
    // name from the first accommodation's `city` field as a
    // convenient fallback. For trips without accommodations the city
    // stays '' (the user can re-pick it on the edit form).
    const cityName = (Array.isArray(trip.accommodations) && trip.accommodations[0]?.city)
      || '';

    // Prefer the backend's `tripDurationDays` (it handles same-day
    // trips and timezone quirks) and fall back to the calendar math
    // for older rows that don't carry it.
    const days = (typeof trip.tripDurationDays === 'number' && trip.tripDurationDays > 0)
      ? trip.tripDurationDays
      : (trip.startDate && trip.endDate
          ? Math.max(
              1,
              Math.ceil(
                Math.abs(new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)
              ) + 1
            )
          : 0);

    return {
      id: trip.id,
      name: trip.title || 'Viagem',
      description: trip.tripDescription || trip.tripSummary || '',
      startDate: trip.startDate,
      endDate: trip.endDate,
      country: trip.country || '',
      city: cityName,
      user: ownerUsername,
      // TripDto only stores category IDs; resolve to names using the
      // apiCategories cache.
      category: (trip.categories || []).map((id) => {
        const c = (apiCategories || []).find((x) => x.id === id);
        return c ? c.name : null;
      }).filter(Boolean),
      days,
      // TripDto keeps the price at `cost.total` (a nested object).
      // The flat `totalPrice` / `totalCost` keys are legacy fallbacks.
      price: trip.cost?.total ?? trip.totalPrice ?? trip.totalCost ?? 0,
      stars: Math.round(trip.tripRating ?? trip.rating ?? 0),
      rating: trip.tripRating ?? trip.rating ?? 0,
      likes: 0,
      comments: [],
      // First photo URL — resolved through toFullMediaUrl so the
      // browser can fetch the actual file (relative path → full URL).
      highlightImage: (Array.isArray(trip.photos) && trip.photos[0])
        ? toFullMediaUrl(trip.photos[0])
        : 'https://via.placeholder.com/300',
      isHidden: Boolean(trip.isHidden),
    };
  };

  const mapReportReasonToApiReason = (reasons) => {
    if (reasons.harassment || reasons.abusive) return 'HARASSMENT';
    if (reasons.inappropriate) return 'INAPPROPRIATE_CONTENT';
    if (reasons.spam) return 'SPAM';
    if (reasons.identity || reasons.falseInfo) return 'FAKE_PROFILE';
    return 'OTHER';
  };

  const getApiErrorMessage = (error, fallback = 'Ocorreu um erro inesperado.') => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    if (message) return message;
    if (status === 400) return 'Pedido inválido. Verifique os dados e tente novamente.';
    if (status === 401) return 'Sessão expirada ou inválida. Faça login novamente.';
    if (status === 404) return 'Utilizador não encontrado.';

    return fallback;
  };

  // Single effect: fetch profile + relationship status in one pass
  // Uses user?.id (not the whole user object) to avoid re-running on reference changes
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        setLoading(true);

        // Step 1: Resolve user ID (discover only called when needed)
        let resolvedUserId;
        if (user && user.username === username && user.id) {
          resolvedUserId = Number(user.id);
        } else {
          const discoverResponse = await api.get('/users/discover', {
            params: { username, page: 0, size: 20, sortBy: 'followers' },
          });
          const matches = discoverResponse.data?.content || [];
          const exactUser = matches.find((u) => u.username === username);
          resolvedUserId = exactUser?.id || null;
        }

        if (!resolvedUserId) throw new Error('Não foi possível resolver o utilizador pelo username.');
        if (cancelled) return;

        // Step 2: Fetch profile + relationship in parallel (single round-trip)
        const isOtherUser = user && user.username !== username;
        const profileFetch = api.get(`/users/${resolvedUserId}/detailed`);
        const relationshipFetch = isOtherUser
          ? Promise.allSettled([
              api.get('/users/is-following', { params: { followerId: Number(user.id), followedId: resolvedUserId } }),
              api.get('/users/follow-request-status', { params: { requesterId: Number(user.id), targetId: resolvedUserId } }),
              api.get(`/users-management/${resolvedUserId}/is-blocked`),
            ])
          : Promise.resolve(null);

        const [detailedResponse, relationshipResults] = await Promise.all([profileFetch, relationshipFetch]);
        if (cancelled) return;

        const detailed = detailedResponse.data || {};
        const profileUsername = detailed.username || username;

        const coverPhoto = localStorage.getItem(`${username}_coverPhoto`) || '';
        const coverPhotoScale = parseFloat(localStorage.getItem(`${username}_coverPhotoScale`)) || 1;
        const coverPhotoPosition = JSON.parse(localStorage.getItem(`${username}_coverPhotoPosition`) || '{"x":0,"y":0}');

        const detailedProfile = {
          id: detailed.id || resolvedUserId,
          username: profileUsername,
          name: [detailed.firstName, detailed.lastName].filter(Boolean).join(' ') || profileUsername,
          profilePicture: detailed.profilePhoto || defaultAvatar,
          bio: detailed.userBio || 'Viajante apaixonado',
          country: detailed.nationality || '',
          city: detailed.city || '',
          travelCount: detailed.totalTrips || 0,
          followersCount: detailed.numberOfFollowers || 0,
          followingCount: detailed.numberOfFollowing || 0,
          privacy: detailed.privacy || 'public',
          followers: [],
          following: [],
          coverPhoto,
          coverPhotoScale,
          coverPhotoPosition,
        };

        const tripPosts = detailed.tripPosts || [];
        const mappedTrips = tripPosts.map((trip) => mapTripSummaryToUiTrip(trip, profileUsername, apiCategories));

        setProfileUserId(resolvedUserId);
        setProfile(detailedProfile);
        setUserStats({
          totalTrips: detailed.totalTrips || 0,
          totalVisitedCountries: detailed.totalVisitedCountries || 0,
          totalVisitedCities: detailed.totalVisitedCities || 0,
          totalMoneySpent: detailed.totalMoneySpent || 0,
          averageMoneyPerTrip: detailed.averageMoneyPerTrip || 0,
          averageDaysPerTrip: detailed.averageDaysPerTrip || 0,
          numberOfFollowers: detailed.numberOfFollowers || 0,
          numberOfFollowing: detailed.numberOfFollowing || 0,
        });
        setTravels(mappedTrips.filter((trip) => !trip.isHidden));

        // Step 3: Apply relationship results
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
      } catch (error) {
        if (cancelled) return;
        console.error('Erro ao buscar perfil:', error);
        setActionError(getApiErrorMessage(error, 'Não foi possível carregar o perfil.'));
        setProfile(null);
        setUserStats(null);
        setProfileUserId(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRelationshipLoading(false);
        }
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, user?.id]);

  // ── Categories cache (loaded once on mount) ───────────────────
  // We need the category names to render trip cards — TripDto only
  // carries category IDs. Cheap, one-shot fetch.
  useEffect(() => {
    let cancelled = false;
    api.get('/categories')
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) {
          setApiCategories(res.data);
        }
      })
      .catch(() => { /* best-effort — cards just show IDs */ });
    return () => { cancelled = true; };
  }, []);

  // ── Paginated trips loader ───────────────────────────────────
  // The profile endpoint no longer returns the trip list (we keep the
  // payload small for fast profile renders). Trips are fetched
  // lazily + paginated from the dedicated endpoints:
  //   - Own profile  : GET /trips/my-trips?page=N&size=6
  //   - Other profile: GET /trips/user/{id}/public?page=N&size=6
  // The first page is loaded as soon as `profileUserId` is known;
  // subsequent pages are loaded by the "Carregar mais" button.
  const TRIPS_PAGE_SIZE = 6;
  const [tripsPage, setTripsPage] = useState(0);
  const [tripsHasMore, setTripsHasMore] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);

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
    } catch (err) {
      console.warn('Failed to load trips page', page, err);
      setTripsHasMore(false);
    } finally {
      setLoadingTrips(false);
    }
  }, [profileUserId, username, user, apiCategories, loadingTrips]);

  // Reset & load first page whenever the profile changes.
  useEffect(() => {
    if (!profileUserId) return;
    setTravels([]);
    setTripsPage(-1); // -1 = "not loaded yet"
    setTripsHasMore(true);
    fetchTripsPage(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  useEffect(() => {
    const handleClickOutsideTravel = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowTravelDropdown(null);
      }
    };
    if (showTravelDropdown) {
      document.addEventListener('click', handleClickOutsideTravel);
      return () => document.removeEventListener('click', handleClickOutsideTravel);
    }
  }, [showTravelDropdown]);

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  const handleFollow = async () => {
    if (!user) {
      return;
    }

    if (!profileUserId || relationshipLoading) {
      return;
    }

    try {
      setActionError('');
      setRelationshipLoading(true);
      await api.post(`/users/${profileUserId}/follow`);

      const [followingResponse, pendingResponse] = await Promise.all([
        api.get('/users/is-following', {
          params: {
            followerId: Number(user.id),
            followedId: profileUserId,
          },
        }),
        api.get('/users/follow-request-status', {
          params: {
            requesterId: Number(user.id),
            targetId: profileUserId,
          },
        }),
      ]);

      const isFollowingBackend = Boolean(followingResponse.data);
      const isPendingBackend = Boolean(pendingResponse.data);

      setFollowing(isFollowingBackend ? [profile.username] : []);
      setPendingRequests(isPendingBackend ? [profile.username] : []);

      if (isPendingBackend) {
        setShowRequestModal(true);
        setTimeout(() => {
          setShowRequestModal(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao seguir utilizador:', error);
      setActionError(getApiErrorMessage(error, 'Não foi possível seguir este utilizador.'));
    } finally {
      setRelationshipLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profileUserId || !user || relationshipLoading) {
      return;
    }

    try {
      setActionError('');
      setRelationshipLoading(true);
      await api.post(`/users/${profileUserId}/unfollow`);
      setFollowing([]);
      setPendingRequests([]);
    } catch (error) {
      console.error('Erro ao deixar de seguir utilizador:', error);
      setActionError(getApiErrorMessage(error, 'Não foi possível deixar de seguir este utilizador.'));
    } finally {
      setRelationshipLoading(false);
    }
  };

  const handleCancelRequest = () => {
    // Ainda não há endpoint de cancelamento de pedido pendente disponível.
    setActionError('Ainda não existe endpoint para cancelar pedidos pendentes.');
    setPendingRequests(pendingRequests.filter((u) => u !== profile.username));
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const toggleTravelDropdown = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTravelDropdown(showTravelDropdown === travelId ? null : travelId);
  };

  const handleReportUser = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      return;
    }
    if (reportedUsers.includes(profile?.username)) {
      setActionError('Já denunciou este utilizador.');
      setShowDropdown(false);
      return;
    }
    setActionError('');
    setShowReportModal(true);
    setShowDropdown(false);
  };

  const handleBlockUser = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      return;
    }
    setActionError('');
    setShowBlockModal(true);
    setShowDropdown(false);
  };

  const handleReasonChange = (reason) => {
    setReportReasons(prev => ({
      ...prev,
      [reason]: !prev[reason]
    }));
  };

  const handleTravelReasonChange = (reason) => {
    setReportTravelReasons(prev => ({
      ...prev,
      [reason]: !prev[reason]
    }));
  };

  const confirmReportUser = async () => {
    if (profile && profileUserId) {
      // Check if at least one reason is selected
      const hasSelectedReason = Object.values(reportReasons).some(value => value) || 
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
      } catch (error) {
        console.error('Erro ao denunciar utilizador:', error);
        setActionError(getApiErrorMessage(error, 'Não foi possível denunciar este utilizador.'));
        return;
      }
      
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

  const confirmBlockUser = async () => {
    if (profile && profileUserId) {
      try {
        setActionError('');
        await api.post(`/users-management/${profileUserId}/block`);
        setBlockedUsers((prev) => (prev.includes(profile.username) ? prev : [...prev, profile.username]));
        setFollowing([]);
        setPendingRequests([]);
        setShowBlockModal(false);
      } catch (error) {
        console.error('Erro ao bloquear utilizador:', error);
        setActionError(getApiErrorMessage(error, 'Não foi possível bloquear este utilizador.'));
      }
    }
  };

  const handleReportTravel = (travel, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      return;
    }
    setSelectedTravel(travel);
    setShowReportTravelModal(true);
    setShowTravelDropdown(null);
  };

  const confirmReportTravel = () => {
    if (selectedTravel) {
      const hasSelectedReason = Object.values(reportTravelReasons).some(v => v) ||
        (reportTravelReasons.other && otherTravelReason.trim());
      if (!hasSelectedReason) {
        return;
      }
      setReportedTravels([...reportedTravels, selectedTravel.id]);
      setShowReportTravelModal(false);
      setSelectedTravel(null);
      setReportTravelReasons({
        inappropriate: false,
        falseInfo: false,
        abusive: false,
        spam: false,
        violation: false,
        plagiarism: false,
        other: false,
      });
      setOtherTravelReason('');
    }
  };

  const handleUnblockUser = async () => {
    if (profile && profileUserId) {
      try {
        setActionError('');
        await api.delete(`/users-management/${profileUserId}/unblock`);
        setBlockedUsers(blockedUsers.filter(username => username !== profile.username));
      } catch (error) {
        console.error('Erro ao desbloquear utilizador:', error);
        setActionError(getApiErrorMessage(error, 'Não foi possível desbloquear este utilizador.'));
      }
    }
  };

  const loadFollowList = async (type) => {
    if (!profileUserId) {
      return;
    }

    try {
      const endpoint = type === 'followers' ? '/users/followers' : '/users/follows';
      const title = type === 'followers' ? 'Seguidores' : 'A Seguir';
      const response = await api.get(endpoint, {
        params: {
          userId: profileUserId,
          page: 0,
          size: 20,
        },
      });

      const list = Array.isArray(response.data)
        ? response.data
        : (response.data?.content || []);

      setModalContent({ title, list, type: 'follow' });
      setShowFollowModal(true);
    } catch (error) {
      console.error('Erro ao buscar lista de seguidores/a seguir:', error);
      setModalContent({ title: type === 'followers' ? 'Seguidores' : 'A Seguir', list: [], type: 'follow' });
      setShowFollowModal(true);
    }
  };

  const closeFollowModal = () => {
    setShowFollowModal(false);
    setModalContent({ title: '', list: [], type: '' });
  };

  const openStatsModal = (title, list, type = '') => {
    setModalContent({ title, list, type });
    setShowStatsModal(true);
  };

  const closeStatsModal = () => {
    setShowStatsModal(false);
    setModalContent({ title: '', list: [], type: '' });
  };

  if (loading) return <div className="user-profile-page"><div className="loading-spinner"></div></div>;
  if (!profile) return <div className="user-profile-page"><p>Viajante não encontrado.</p></div>;

  const isOwnProfile = user && user.username === profile.username;
  const isFollowing = user && following.includes(profile.username);
  const isPending = user && pendingRequests.includes(profile.username);
  const isBlocked = user && blockedUsers.includes(profile.username);
  const canViewDetails = isOwnProfile || (profile.privacy === 'public') || isFollowing;
  const canViewFollowStats = isOwnProfile || (profile.privacy === 'public') || isFollowing;
  const visibleTravels = travels;

  const formatLocationText = (city, country) => {
    const safeCity = (city || '').trim();
    const safeCountry = (country || '').trim();

    if (!safeCity) return safeCountry;
    if (!safeCountry) return safeCity;

    if (safeCity.toLowerCase().includes(safeCountry.toLowerCase())) {
      return safeCity;
    }

    return `${safeCity}, ${safeCountry}`;
  };

  // Use backend statistics for logged-in user's own profile
  const totalTravels = isOwnProfile && userStats 
    ? userStats.totalTrips 
    : canViewDetails ? visibleTravels.length : 0;
  
  const uniqueCountries = isOwnProfile && userStats 
    ? Array(userStats.totalVisitedCountries).fill(null) 
    : canViewDetails ? [...new Set(visibleTravels.map((travel) => travel.country))] : [];
  
  const uniqueCities = isOwnProfile && userStats 
    ? Array(userStats.totalVisitedCities).fill(null) 
    : canViewDetails ? [...new Set(visibleTravels.map((travel) => travel.city || travel.country))] : [];
  
  const totalSpent = isOwnProfile && userStats 
    ? userStats.totalMoneySpent 
    : canViewDetails ? visibleTravels.reduce((sum, travel) => sum + (travel.price || 0), 0) : 0;
  
  const averageSpent = isOwnProfile && userStats 
    ? userStats.averageMoneyPerTrip.toFixed(2) 
    : canViewDetails && totalTravels > 0 ? (totalSpent / totalTravels).toFixed(2) : 0;

  const averageDays = isOwnProfile && userStats 
    ? userStats.averageDaysPerTrip.toFixed(1) 
    : (() => {
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
      return canViewDetails && totalTravels > 0 ? (totalDays / totalTravels).toFixed(1) : 0;
    })();

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

  // If user is blocked, show blocked interface
  if (isBlocked && !isOwnProfile) {
    return (
      <div className="user-profile-page">
        <div className="blocked-user-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <div className="blocked-user-avatar" style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '3px solid #ddd'
          }}>
            <FaBan size={60} color="#999" />
          </div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>{profile.username}</h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px' }}>
            Bloqueou este viajante.
          </p>
          {actionError && (
            <p style={{ color: '#c62828', marginBottom: '20px', fontWeight: 600 }}>{actionError}</p>
          )}
          <div style={{ display: 'flex', gap: '15px', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={handleUnblockUser}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Desbloquear
            </button>
            <Link
              to="/blocked-users"
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
            >
              VER TODOS OS VIAJANTES BLOQUEADOS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Lógica para coverPhoto e transformações
  const coverPhoto = profile?.coverPhoto;
  const coverPhotoScale = profile?.coverPhotoScale || 1;
  const coverPhotoPosition = profile?.coverPhotoPosition || { x: 0, y: 0 };

  return (
    <div className="user-profile-page">
      <header
        className="profile-header"
        style={coverPhoto ? {
          backgroundImage: `url(${coverPhoto})`,
          backgroundSize: `cover`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden',
          position: 'relative',
        } : {}}
      >
        {/* Overlay para escurecer a imagem e garantir legibilidade */}
        {coverPhoto && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 0,
          }} />
        )}
        <div className="profile-header-main" style={coverPhoto ? {
          position: 'relative',
          zIndex: 1,
        } : {}}>
          <div className="profile-avatar-section">
            <div className="profile-picture-container">
              <img
                src={getUserAvatar(profile) || defaultAvatar}
                alt={`${profile.username}'s avatar`}
                className="profile-picture"
                onError={(e) => { e.currentTarget.src = defaultAvatar; }}
              />
              <div className="profile-picture-overlay">
                <div className="profile-status-indicator">
                  <div className="status-dot"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-info-section">
            <div className="profile-header-top">
              <div className="profile-name-container">
                <div className="profile-name-info">
                  <h1 className="profile-name">
                    {profile.name}
                    {/* Following badge para desktop */}
                    {user && following.includes(profile.username) && (
                      <span className="following-badge desktop-following-badge">
                        <FaCheck className="following-icon" />
                        A Seguir
                      </span>
                    )}
                  </h1>
                  <p className="profile-username">@{profile.username}</p>
                </div>
                
                {/* Botões de ação dentro do profile-name-container */}
                <div className="profile-action-buttons">
                  {isOwnProfile && (
                    <Link to={`/profile/edit/${profile.username}`} className="button edit-profile-btn">
                      <FaEdit />
                      <span>Editar</span>
                    </Link>
                  )}
                  {!isOwnProfile && user && (
                    <div className="social-actions">
                      {isFollowing ? (
                        <button className="unfollow-button" onClick={handleUnfollow} disabled={relationshipLoading}>
                          <FaUserMinus />
                          <span>{relationshipLoading ? 'A processar...' : 'Não seguir'}</span>
                        </button>
                      ) : isPending ? (
                        <button className="pending-button" onClick={handleCancelRequest} disabled={relationshipLoading}>
                          <FaClock />
                          <span>Pendente</span>
                        </button>
                      ) : (
                        <button className="follow-button" onClick={handleFollow} disabled={relationshipLoading}>
                          <FaUserPlus />
                          <span>{relationshipLoading ? 'A processar...' : 'Seguir'}</span>
                        </button>
                      )}
                    </div>
                  )}
                  
                </div>
              </div>

              <div className="profile-actions-section">
                {/* Botões para desktop/tablet - ao lado dos 3 pontos */}
                {isOwnProfile && (
                  <Link to={`/profile/edit/${profile.username}`} className="button edit-profile-btn">
                    <FaEdit />
                    <span>Editar</span>
                  </Link>
                )}
                {!isOwnProfile && user && (
                  <div className="social-actions">
                    {isFollowing ? (
                      <button className="unfollow-button" onClick={handleUnfollow} disabled={relationshipLoading}>
                        <FaUserMinus />
                        <span>{relationshipLoading ? 'A processar...' : 'Não seguir'}</span>
                      </button>
                    ) : isPending ? (
                      <button className="pending-button" onClick={handleCancelRequest} disabled={relationshipLoading}>
                        <FaClock />
                        <span>Pendente</span>
                      </button>
                    ) : (
                      <button className="follow-button" onClick={handleFollow} disabled={relationshipLoading}>
                        <FaUserPlus />
                        <span>{relationshipLoading ? 'A processar...' : 'Seguir'}</span>
                      </button>
                    )}
                  </div>
                )}
          
                {!isOwnProfile && user && (
                  <div className="dropdown-container">
                    <button
                      className="action-button menu-btn"
                      onClick={toggleDropdown}
                    >
                      <FaEllipsisV />
                    </button>
                    {showDropdown && (
                      <div className="dropdown-menu">
                        <button
                          className="dropdown-item"
                          onClick={handleReportUser}
                        >
                          <FaFlag /> Denunciar
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={handleBlockUser}
                        >
                          <FaBan /> Bloquear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile details section separada */}
        <div className="profile-details-section">
          {(profile.city || profile.country) && (
            <div className="location-container">
              {/* Menu 3 pontos para mobile - alinhado à esquerda */}
              {!isOwnProfile && user && (
                <div className="mobile-menu-inline">
                  <button
                    className="action-button menu-btn mobile-menu-btn-inline"
                    onClick={toggleDropdown}
                  >
                    <FaEllipsisV />
                  </button>
                  {showDropdown && (
                    <div className="dropdown-menu mobile-dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={handleReportUser}
                      >
                        <FaFlag /> Denunciar
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={handleBlockUser}
                      >
                        <FaBan /> Bloquear
                      </button>
                    </div>
                  )}
                </div>
              )}
              <FaMapMarkerAlt className="location-icon" />
              <span className="location-text">
                {formatLocationText(profile.city, profile.country)}
              </span>
            </div>
          )}
          {profile.bio && (
            <div className="bio-container">
              <p className="bio">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Stats section separada */}
        <div className="profile-stats-section">
          <div className="stats-grid">
            <div
              className={`stat-card ${canViewFollowStats ? 'clickable' : 'non-clickable'}`}
              onClick={() => canViewFollowStats && loadFollowList('followers')}
            >
              <div className="stat-number">
                {userStats ? userStats.numberOfFollowers : (profile?.followersCount || 0)}
              </div>
              <div className="stat-label">Seguidores</div>
            </div>
            <div
              className={`stat-card ${canViewFollowStats ? 'clickable' : 'non-clickable'}`}
              onClick={() => canViewFollowStats && loadFollowList('follows')}
            >
              <div className="stat-number">
                {userStats ? userStats.numberOfFollowing : (profile?.followingCount || profile.following.length)}
              </div>
              <div className="stat-label">A seguir</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{totalTravels}</div>
              <div className="stat-label">Viagens</div>
            </div>
          </div>
        </div>
      </header>

      <section className="profile-content">
        {canViewDetails ? (
          <>
            <div className="travels-section">
              
                {isOwnProfile && user && (
                  <Link to="/my-travels" className="button">
                    Gerir as minhas Viagens
                  </Link>
                  
                )}
           
             
              {visibleTravels.length > 0 ? (
                <div className="travels-grid">
                  {visibleTravels.map((travel) => (
                    <div key={travel.id} className="travel-card">
                      <Link to={`/travel/${travel.id}`}>
                        <div className="travel-content">
                          {!isOwnProfile && user && (
                            <div className="dropdown-container" style={{ position: 'relative' }}>
                              <button
                                className="dropdown-toggle"
                                onClick={(e) => toggleTravelDropdown(travel.id, e)}
                                style={{
                                  position: 'absolute',
                                  top: '10px',
                                  right: '10px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '8px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#666',
                                  transition: 'background-color 0.2s',
                                  zIndex: 2,
                                }}
                                onMouseEnter={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
                                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                              >
                                <FaEllipsisV />
                              </button>
                              {showTravelDropdown === travel.id && (
                                <div
                                  className="dropdown-menu"
                                  style={{
                                    position: 'absolute',
                                    top: '40px',
                                    right: '10px',
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    zIndex: 5000,
                                    minWidth: '180px',
                                  }}
                                >
                                  <button
                                    className="dropdown-item"
                                    onClick={(e) => handleReportTravel(travel, e)}
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
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                  >
                                    <FaFlag /> Denunciar Viagem
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          <img src={travel.highlightImage} alt={travel.name} className="highlight-image" />
                          <div className="travel-text">
                            <h2>{travel.name}</h2>
                            <p><b>👤 Viajante:</b> {travel.user}</p>
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
<br></br><br></br>
            <div className="traveler-stats-section" id="traveler-stats">
              
              <h2>Estatísticas do Viajante</h2>
              <div className="stats-grid">
                <div className="stat-item-box">
                  <h3>Total de Viagens</h3>
                  <p><strong>{totalTravels}</strong></p>
                </div>
                <div className="stat-item-box">
                  <h3 onClick={() => canViewDetails && openStatsModal('Países Visitados', uniqueCountries)}>
                    Países Visitados
                    <p><span className="stat-clickable"><strong>{isOwnProfile && userStats ? userStats.totalVisitedCountries : uniqueCountries.length}</strong></span></p>
                  </h3>
                </div>
                <div className="stat-item-box">
                  <h3 onClick={() => canViewDetails && openStatsModal('Cidades Visitadas', uniqueCities)}>
                    Cidades Visitadas
                    <p><span className="stat-clickable"><strong>{isOwnProfile && userStats ? userStats.totalVisitedCities : uniqueCities.length}</strong></span></p>
                  </h3>
                </div>
                <div className="stat-item-box">
                  <h3 onClick={() => canViewDetails && openStatsModal('Gastos por Viagem', [...topExpensive, ...topCheap], 'expense')}>
                    Total Gasto (€)
                    <p><span className="stat-clickable"><strong>{isOwnProfile && userStats ? userStats.totalMoneySpent.toLocaleString() : totalSpent.toLocaleString()}</strong></span></p>
                  </h3>
                </div>
                <div className="stat-item-box">
                  <h3>Média por Viagem (€)</h3>
                  <p><strong>{isOwnProfile && userStats ? userStats.averageMoneyPerTrip.toFixed(2) : averageSpent}</strong></p>
                </div>
                <div className="stat-item-box">
                  <h3>Média Viagens (dias)</h3>
                  <p><strong>{isOwnProfile && userStats ? userStats.averageDaysPerTrip.toFixed(1) : averageDays}</strong></p>
                </div>
              </div>
<br></br><br></br>
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

      {showFollowModal && (
        <div className="follow-modal-overlay" onClick={closeFollowModal}>
          <div className="follow-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalContent.title}</h2>
            {modalContent.list.length > 0 ? (
              <ul className="follow-user-list">
                {modalContent.list.map((followUser, index) => {
                  const resolvedUsername = followUser?.username || '';
                  const resolvedName = [followUser?.firstName, followUser?.lastName].filter(Boolean).join(' ') || resolvedUsername;
                  return (
                    <li key={index} className="follow-user-list-item">
                      <Link to={`/profile/${resolvedUsername}`} className="follow-user-link">
                        <img
                          src={followUser?.profilePhoto || defaultAvatar}
                          alt={`${resolvedUsername}'s avatar`}
                          className="follow-user-avatar"
                        />
                        <span>{resolvedName}</span>
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

      {showReportTravelModal && (
        <div className="modal-overlay" onClick={() => setShowReportTravelModal(false)}>
          <div
            className="modal-content-users"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', overflowY: 'auto' }}
          >
            <h2>Denunciar Viagem</h2>
            <p>
              Por que deseja denunciar a viagem <strong>{selectedTravel?.name}</strong>?
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Esta ação irá reportar a viagem aos administradores.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportTravelReasons.inappropriate}
                    onChange={() => handleTravelReasonChange('inappropriate')}
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
                    checked={reportTravelReasons.falseInfo}
                    onChange={() => handleTravelReasonChange('falseInfo')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Informação falsa ou enganosa</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: locais inexistentes, preços manipulados, etc.)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportTravelReasons.abusive}
                    onChange={() => handleTravelReasonChange('abusive')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Assédio/Abuso nos conteúdos</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: linguagem agressiva ou ofensiva)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportTravelReasons.spam}
                    onChange={() => handleTravelReasonChange('spam')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Spam ou autopromoção</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: publicidade abusiva, links externos)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportTravelReasons.plagiarism}
                    onChange={() => handleTravelReasonChange('plagiarism')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Plágio de conteúdo</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: fotos/textos copiados sem créditos)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportTravelReasons.violation}
                    onChange={() => handleTravelReasonChange('violation')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Violação das regras da plataforma</strong>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportTravelReasons.other}
                    onChange={() => handleTravelReasonChange('other')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Outro (especificar)</strong>
                  </div>
                </label>
                {reportTravelReasons.other && (
                  <textarea
                    value={otherTravelReason}
                    onChange={(e) => setOtherTravelReason(e.target.value)}
                    placeholder="Descreva o motivo da denúncia..."
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                      resize: 'vertical',
                      minHeight: '80px',
                    }}
                  />
                )}
              </div>
            </div>

            <div className="modal-buttons">
              <button
                className="button-danger"
                onClick={() => {
                  setShowReportTravelModal(false);
                  setReportTravelReasons({
                    inappropriate: false,
                    falseInfo: false,
                    abusive: false,
                    spam: false,
                    violation: false,
                    plagiarism: false,
                    other: false,
                  });
                  setOtherTravelReason('');
                }}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#6c757d',
                  color: 'white',
                }}
              >
                Cancelar
              </button>
              <button
                className="button-orange"
                onClick={confirmReportTravel}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                }}
              >
                Denunciar
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="stats-modal-overlay" onClick={closeStatsModal}>
          <div className="stats-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalContent.title}</h2>
            {modalContent.type === 'expense' ? (
              <>
                <h3>Top 3 - Viagens Mais Caras</h3>
                <ul>
                  {modalContent.list.slice(0, 3).map((travel) => (
                    <Link to={`/travel/${travel.id}`} key={travel.id}>
                      <li>
                        {travel.name} - {travel.price ? `${travel.price.toLocaleString()} €` : 'Preço não disponível'}
                      </li>
                    </Link>
                  ))}
                </ul>
                <h3>Top 3 - Viagens Mais Baratas</h3>
                <ul>
                  {modalContent.list.slice(-3).map((travel) => (
                    <Link to={`/travel/${travel.id}`} key={travel.id}>
                      <li>
                        {travel.name} - {travel.price ? `${travel.price.toLocaleString()} €` : 'Preço não disponível'}
                      </li>
                    </Link>
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

      {showRequestModal && (
        <div className="request-modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="request-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Sucesso!</h2>
            <p>Pedido enviado com sucesso.<br />Aguarde até que o Viajante aceite o seu pedido!</p>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => {
          setShowReportModal(false);
          setActionError('');
        }}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', overflowY: 'auto' }}>
            <br></br><br></br>
            <h2>Denunciar Viajante</h2>
            <p>Porque deseja denunciar o viajante <strong>"{profile?.username}"</strong>?</p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Esta ação irá reportar o viajante aos administradores.</p>
            {actionError && (
              <p style={{ fontSize: '14px', color: '#c62828', marginBottom: '12px', fontWeight: 600 }}>
                {actionError}
              </p>
            )}
            
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '15px' }}>Motivo da denúncia:</p>
            
            
            
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
                  setActionError('');
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
        <div className="modal-overlay" onClick={() => {
          setShowBlockModal(false);
          setActionError('');
        }}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()}>
            <h2>Bloquear Viajante</h2>
            <p>Tem certeza de que deseja bloquear <strong>{profile?.username}</strong>?</p>
            <p>Não verá mais este viajante na lista e ele não poderá interagir consigo.</p>
            {actionError && (
              <p style={{ fontSize: '14px', color: '#c62828', marginBottom: '12px', fontWeight: 600 }}>
                {actionError}
              </p>
            )}
            <div className="modal-buttons">
              <button 
                className="button-danger" 
                onClick={() => {
                  setShowBlockModal(false);
                  setActionError('');
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

export default UserProfile;