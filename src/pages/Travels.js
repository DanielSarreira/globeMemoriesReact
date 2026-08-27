import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Star, Flag, MoreHorizontal, X as IconX, Bookmark,
  Calendar, ArrowUpDown, ChevronDown, SlidersHorizontal, Tag,
  Wallet, Users as UsersIcon, Compass as CompassIcon, Globe2,
  Ban, MoreVertical, Eye, Lock,
} from 'lucide-react';
import { request, toFullMediaUrl } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { useToast, Avatar, ReportSheet, FollowButton, ProgressiveImg } from '../components/ui';
import { convertEmojiCode } from '../utils/emojiCode';
import { getDisplayName } from '../utils/userDisplay';
import { translateCountry, translateCity, translatePlace } from '../utils/localization';
import useProfileUpdates from '../hooks/useProfileUpdates';
import '../styles/pages/travels.css';

const TRAVELS_PER_PAGE = 20;

/* ── Fallback categories (used when /categories endpoint is down) ── */
const FALLBACK_CATEGORIES = [
  { name: 'Natureza', icon: '🌿', id: 1 },
  { name: 'Praia', icon: '🏖️', id: 2 },
  { name: 'Aventura', icon: '🧗', id: 3 },
  { name: 'Cultural', icon: '🏛️', id: 4 },
  { name: 'Histórico', icon: '🏰', id: 5 },
  { name: 'Cidade', icon: '🌆', id: 6 },
  { name: 'Gastronomia', icon: '🍴', id: 7 },
  { name: 'Cruzeiros', icon: '🚢', id: 8 },
  { name: 'Campismo', icon: '⛺', id: 9 },
  { name: 'Montanha', icon: '🏔️', id: 10 },
];

const MONTHS = [
  { value: '', label: 'Qualquer mês' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recente' },
  { value: 'oldest', label: 'Mais antigo' },
  { value: 'price-asc', label: 'Preço (crescente)' },
  { value: 'price-desc', label: 'Preço (decrescente)' },
  { value: 'rating', label: 'Avaliação (maior)' },
  { value: 'duration-desc', label: 'Duração (mais longo)' },
  { value: 'duration-asc', label: 'Duração (mais curto)' },
];

const RATING_OPTIONS = [
  { value: 1, label: '1+ ⭐' },
  { value: 2, label: '2+ ⭐' },
  { value: 3, label: '3+ ⭐' },
  { value: 4, label: '4+ ⭐' },
  { value: 5, label: '5 ⭐' },
];

const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /[<>]/g,
];

function sanitizeSearchInput(input) {
  if (!input) return '';
  let s = String(input);
  for (const p of DANGEROUS_PATTERNS) s = s.replace(p, '');
  return s;
}

function getSortParameter(sortOption) {
  switch (sortOption) {
    // "Mais recente" = viagens criadas por último (id desc, since id
    // is auto-increment and equivalent to creation order).
    case 'recent': return 'id,desc';
    case 'oldest': return 'id,asc';
    case 'start-desc': return 'startDate,desc';
    case 'start-asc': return 'startDate,asc';
    case 'price-asc': return 'cost.total,asc';
    case 'price-desc': return 'cost.total,desc';
    case 'rating': return 'tripRating,desc';
    case 'duration-desc': return 'tripDurationDays,desc';
    case 'duration-asc': return 'tripDurationDays,asc';
    default: return 'id,desc';
  }
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

const Travels = () => {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [sortOption, setSortOption] = useState('recent');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [minRating, setMinRating] = useState(1);
  // Price range (in euros). The backend takes cents / single-unit
  // — `cost.total` is the actual trip cost, so we send the
  // value as-is (numbers).
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  // Trip duration range (in days). The backend already accepts
  // `minDays` / `maxDays` query parameters on /trips/public-feed,
  // so we just send them through.
  const [minDays, setMinDays] = useState('');
  const [maxDays, setMaxDays] = useState('');
  // Country / city filters. The country list is fetched once on
  // mount; the city list is fetched every time the country changes
  // (and gets cleared if the country is cleared).
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Data
  const [feedTravels, setFeedTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [apiCategories, setApiCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Saved (bookmark) state. Loaded once after the public feed so
  // every card knows whether its trip is already in the user's
  // private "Viagens Guardadas" collection. The TravelCard calls
  // `onToggleSave` which flips the state locally + calls the
  // backend endpoint; we keep the Set in sync for the next render.
  const [savedTripIds, setSavedTripIds] = useState(() => new Set());
  const [saveBusyIds, setSaveBusyIds] = useState(() => new Set());

  // Page mode: 'travels' (default, full feed with filters) or
  // 'travellers' (search the community, reuse the same search box).
  // Replaces the dedicated /users page so everything lives here.
  const [mode, setMode] = useState('travels');
  const [travellers, setTravellers] = useState([]);
  const [loadingTravellers, setLoadingTravellers] = useState(false);
  const [travellersPage, setTravellersPage] = useState(0);
  const [travellersHasMore, setTravellersHasMore] = useState(false);
  const [travellersTotal, setTravellersTotal] = useState(0);
  const [travellerSort, setTravellerSort] = useState('followers'); // 'followers' | 'trips'
  const [travellerNationality, setTravellerNationality] = useState('');

  // Relationship state for the traveller cards. We keep it as
  // Sets so look-ups are O(1) and updates don't require re-fetching
  // the discover endpoint after every follow / unfollow click.
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [travellerActionLoading, setTravellerActionLoading] = useState(false);
  const myUserId = user?.id ? Number(user.id) : null;

  // Mobile filters sheet
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = categoryFilter.length
    + (selectedMonth && selectedMonth !== 'all' ? 1 : 0)
    + (sortOption && sortOption !== 'recent' ? 1 : 0)
    + (minRating && minRating > 1 ? 1 : 0)
    + (minPrice !== '' && minPrice != null ? 1 : 0)
    + (maxPrice !== '' && maxPrice != null ? 1 : 0)
    + (minDays !== '' && minDays != null ? 1 : 0)
    + (maxDays !== '' && maxDays != null ? 1 : 0)
    + (countryFilter ? 1 : 0)
    + (cityFilter ? 1 : 0);

  // Report
  const [reportFor, setReportFor] = useState(null);

  // ── Fetch public feed ─────────────────────────────────
  const fetchPublicFeed = useCallback(async (page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', TRAVELS_PER_PAGE);
      params.append('sort', getSortParameter(sortOption));

      if (categoryFilter.length > 0) {
        const categoryIds = categoryFilter
          .map((catName) => {
            const apiCat = apiCategories.find((c) => c.name === catName);
            return apiCat?.id ?? null;
          })
          .filter((id) => id != null);
        if (categoryIds.length > 0) params.append('categories', categoryIds.join(','));
      }
      if (selectedMonth) params.append('month', parseInt(selectedMonth, 10));
      params.append('minRating', minRating);
      params.append('maxRating', 5);
      if (minPrice !== '' && !Number.isNaN(Number(minPrice))) {
        params.append('minCost', Number(minPrice));
      }
      if (maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
        params.append('maxCost', Number(maxPrice));
      }
      if (minDays !== '' && !Number.isNaN(Number(minDays))) {
        params.append('minDays', Number(minDays));
      }
      if (maxDays !== '' && !Number.isNaN(Number(maxDays))) {
        params.append('maxDays', Number(maxDays));
      }
      if (searchTerm.trim()) params.append('text', searchTerm.trim());
      if (countryFilter) params.append('countries', countryFilter);
      if (cityFilter) params.append('city', cityFilter);

      const response = await request('GET', `/trips/public-feed?${params.toString()}`);
      if (response?.data) {
        const mapped = (response.data.content || []).map((trip) => {
          // Resolve photo URL safely
          const photoPath = trip.tripPhoto || trip.photo || (Array.isArray(trip.photos) && trip.photos[0]) || null;
          const photoUrl = photoPath ? toFullMediaUrl(photoPath) : null;

          // Resolve price from various possible fields
          const price = trip.totalCosts ?? trip.totalCost ?? trip.cost?.total ?? trip.price ?? 0;

          // Resolve rating/stars
          const stars = trip.tripRating ?? trip.rating ?? 0;

          // Resolve categories
          const categories = Array.isArray(trip.categories)
            ? trip.categories.map((c) => c.categoryName || c.name || c || '')
            : [];

          // Resolve city/country
          const city = trip.city ?? trip.citiesVisited?.[0] ?? '';
          const country = trip.country ?? trip.countriesVisited?.[0] ?? '';
          // Multi-destination: count the cities visited. The feed
          // returns `citiesVisited` (array of city names) and
          // `countriesVisited` (array of country names). Anything
          // beyond 1 stop is treated as a multi-destination trip.
          const citiesCount = Array.isArray(trip.citiesVisited)
            ? trip.citiesVisited.length
            : (Array.isArray(trip.countriesVisited) ? trip.countriesVisited.length : 0);
          const isMultiDest = citiesCount > 1;

          return {
            id: trip.tripId ?? trip.id,
            tripId: trip.tripId ?? trip.id,
            name: trip.tripTitle || trip.title || 'Viagem sem título',
            description: trip.tripSummary || trip.summary || '',
            city,
            country,
            // V16 — pass the full multi-destination lists down so
            // the Post can render the full route instead of just
            // the first city.
            cities: Array.isArray(trip.citiesVisited) ? trip.citiesVisited : (city ? [city] : []),
            countries: Array.isArray(trip.countriesVisited) ? trip.countriesVisited : (country ? [country] : []),
            // Round 46+ — Prefer the live "First Last" name from the
            // backend over the username, so a profile rename is
            // visible on the cards right after the user saves.
            // We keep BOTH the display name (for rendering) and the
            // raw @username (for /profile links, follow URLs, etc.)
            // because firstName/lastName can contain spaces and
            // change at any time.
            user: getDisplayName({
              userFirstName: trip.userFirstName,
              userLastName: trip.userLastName,
              username: trip.username || trip.user?.username,
            }, `Viajante ${trip.userId}`),
            userUsername: trip.username || trip.user?.username || '',
            userId: trip.userId ?? trip.user?.id,
            userProfilePicture: trip.userProfilePhoto || trip.user?.profilePhoto || null,
            highlightImage: photoUrl,
            price,
            likes: trip.totalLikes ?? trip.likes ?? 0,
            stars,
            startDate: trip.startDate,
            endDate: trip.endDate,
            category: categories,
            // Round 46+ — privacy is what drives the badge in the
            // card photo overlay. Drafts are gone, so we don't need
            // to keep `isHidden` on the client. We also keep the
            // city count for the multi-destination indicator.
            citiesCount,
            isMultiDest,
            privacy: trip.tripPrivacy || trip.privacy || null,
            // O backend enriquece cada TripFeedDto com `isSaved`
            // (ver SavedTripService#enrichWithSavedInfo). Quando o
            // user não está autenticado, o backend devolve null —
            // tratamos como `false` para não mostrar o bookmark
            // preenchido.
            isSaved: Boolean(trip.isSaved),
          };
        });

        setFeedTravels((prev) => (page === 0 ? mapped : [...prev, ...mapped]));
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
        setError(null);
        // Sincroniza o Set de saved ids com o `isSaved` que o
        // backend devolveu no batch. Mantemos a união (não
        // substituímos) para não perder saves feitos noutras
        // páginas que ainda não temos em feedTravels.
        setSavedTripIds((prev) => {
          const next = new Set(prev);
          for (const t of mapped) {
            if (t.isSaved) next.add(t.tripId);
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Error fetching public feed:', err);
      const msg = err.response?.data?.message || 'Erro ao carregar as viagens. Tente novamente.';
      setError(msg);
      if (page === 0) {
        // No mock fallback — the user explicitly asked for real data
        // only. If the backend is down we just show an empty state.
        setFeedTravels([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } finally {
      setLoading(false);
    }
  }, [sortOption, categoryFilter, selectedMonth, minRating, minPrice, maxPrice, minDays, maxDays, searchTerm, apiCategories, countryFilter, cityFilter]);

  // ── Traveller search (replaces the dedicated /users page) ──
  // Uses the same backend endpoint the Users page used
  // (`/users/discover`) with `username` for the free-text filter.
  // We map the response into a flat traveller shape so the rest of
  // the UI doesn't care which mode is active.
  const fetchTravellers = useCallback(async (page, append = false) => {
    setLoadingTravellers(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', 20);
      params.append('sortBy', travellerSort);
      if (searchTerm.trim()) params.append('username', searchTerm.trim());
      if (travellerNationality) params.append('nationality', travellerNationality);
      const { data } = await request('GET', `/users/discover?${params.toString()}`);
      const content = Array.isArray(data?.content) ? data.content : [];
      setTravellers((prev) => (append ? [...prev, ...content] : content));
      setTravellersTotal(data?.totalElements ?? content.length);
      setTravellersPage(page);
      setTravellersHasMore(!data?.last && content.length > 0);
    } catch (err) {
      toast.danger(err?.response?.data?.message || 'Não foi possível procurar viajantes.');
    } finally {
      setLoadingTravellers(false);
    }
  }, [travellerSort, searchTerm, travellerNationality, toast]);

  useEffect(() => {
    fetchPublicFeed(currentPage);
  }, [currentPage, fetchPublicFeed]);

  // Round 46+ — When a user updates their profile (name / photo),
  // the trip cards on /travels still show the old denormalised
  // author info. We listen for `gm:profile-updated` and refetch
  // the public feed so the new firstName / lastName / photo show
  // up here. Refetching the whole page is fine — the feed endpoint
  // is fast and the user is already idle on the page.
  useProfileUpdates({
    onUpdate: () => fetchPublicFeed(currentPage),
  });

  // Re-fetch travellers whenever the search box, sort or nationality
  // changes (in the 'travellers' mode). Pagination is handled by the
  // "Carregar mais" button.
  useEffect(() => {
    if (mode !== 'travellers') return;
    fetchTravellers(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, travellerSort, searchTerm, travellerNationality]);

  // After every traveller search, batch-load the relationship
  // state for the page (one round trip per page, cached as Sets).
  // We skip this when the user isn't logged in.
  useEffect(() => {
    if (mode !== 'travellers' || !myUserId || travellers.length === 0) return undefined;
    const ids = travellers.map((t) => t.id).filter(Boolean);
    if (ids.length === 0) return undefined;
    const ctrl = new AbortController();
    (async () => {
      try {
        const results = await Promise.all(
          ids.map((id) =>
            request('GET', '/users/is-following', undefined, {
              params: { followerId: myUserId, followedId: id },
              signal: ctrl.signal,
            }).then((r) => Boolean(r?.data)).catch(() => false)
          )
        );
        setFollowingIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id, i) => { if (results[i]) next.add(id); else next.delete(id); });
          return next;
        });
      } catch (_) { /* silent — relationships are non-critical */ }
    })();
    return () => ctrl.abort();
  }, [travellers, mode, myUserId]);

  // Block handler for the traveller cards. Follow / unfollow now
  // live inside the shared `FollowButton` component (see
  // components/ui/FollowButton.jsx + hooks/useFollowRelationship.js)
  // so the wording and behaviour stay coherent across the whole
  // app — "Seguir" for public profiles, "Pedir para seguir" for
  // private ones, then "A seguir" / "Pendente" after.
  //
  // Esta callback é ESTÁVEL em referência (`useCallback` com deps
  // vazias) porque o hook `useFollowRelationship` por baixo do
  // `FollowButton` usa uma ref para a callback mais recente. O pai
  // (Travels) não precisa de re-render quando o estado muda — só
  // os Sets é que mudam. Manter a referência estável evita
  // re-renders desnecessários na lista.
  //
  // O `FollowButton` (via hook) chama o `onChange` com **só** o
  // state string. Como o `TravellerCard` agora passa esta callback
  // diretamente (sem wrapper inline), capturamos o `traveller.id`
  // por closure usando a versão memoizada abaixo.
  const onTravellerRelationshipChange = useCallback(
    (state) => {
      // O TravellerCard passa esta callback diretamente, mas o
      // `traveller.id` precisa de vir do componente-folha. Para
      // manter a callback estável e ainda identificar o viajante,
      // o `TravellerCard` envolve-a com `traveller.id` antes de
      // chegar aqui. Por isso recebemos `(travellerId, state)`.
      // A versão com 1 argumento (state) é usada para o
      // UserProfile — não conflituam.
    },
    []
  );

  // Wrapper final: recebe `(travellerId, state)` do TravellerCard
  // e propaga para os Sets. Memorizado para que cada TravellerCard
  // receba a mesma referência entre renders.
  const handleTravellerChange = useCallback(
    (travellerId, state) => {
      if (!travellerId) return;
      if (state === 'following') {
        setFollowingIds((prev) => new Set([...prev, travellerId]));
        setPendingIds((prev) => {
          const n = new Set(prev);
          n.delete(travellerId);
          return n;
        });
      } else if (state === 'pending') {
        setFollowingIds((prev) => {
          const n = new Set(prev);
          n.delete(travellerId);
          return n;
        });
        setPendingIds((prev) => new Set([...prev, travellerId]));
      } else if (state === 'not_following') {
        setFollowingIds((prev) => {
          const n = new Set(prev);
          n.delete(travellerId);
          return n;
        });
        setPendingIds((prev) => {
          const n = new Set(prev);
          n.delete(travellerId);
          return n;
        });
      }
    },
    []
  );

  const handleBlockTraveller = useCallback(
    async (traveller) => {
      if (!myUserId || !traveller?.id) return;
      if (!window.confirm(`Bloquear @${traveller.username}? Esta ação pode ser revertida mais tarde.`)) return;
      const previous = followingIds;
      // Optimistic: remove the card from the following set.
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(traveller.id);
        return next;
      });
      setTravellerActionLoading(true);
      try {
        await request('POST', `/users-management/${traveller.id}/block`);
        toast.success('Utilizador bloqueado.');
      } catch (err) {
        setFollowingIds(previous);
        const msg = err?.response?.data?.message || 'Não foi possível bloquear este viajante.';
        toast.danger(msg);
      } finally {
        setTravellerActionLoading(false);
      }
    },
    [myUserId, followingIds, toast]
  );

  // Save / unsave a trip from the public feed into the user's
  // private "Viagens Guardadas" collection. Optimistic + rollback.
  // Não funciona para utilizadores anónimos (precisa de auth).
  const handleToggleSave = useCallback(
    async (travel) => {
      const tripId = travel?.tripId ?? travel?.id;
      if (!tripId || !myUserId) return;
      if (saveBusyIds.has(tripId)) return;
      const wasSaved = savedTripIds.has(tripId);
      // Optimistic flip.
      setSavedTripIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(tripId);
        else next.add(tripId);
        return next;
      });
      setSaveBusyIds((prev) => new Set([...prev, tripId]));
      try {
        if (wasSaved) {
          await request('DELETE', `/trips/${tripId}/save`);
        } else {
          await request('POST', `/trips/${tripId}/save`);
        }
      } catch (err) {
        // Revert.
        setSavedTripIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(tripId);
          else next.delete(tripId);
          return next;
        });
        const msg = err?.response?.data?.message || 'Não foi possível atualizar a tua lista de guardados.';
        toast.danger(msg);
      } finally {
        setSaveBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(tripId);
          return next;
        });
      }
    },
    [myUserId, savedTripIds, saveBusyIds, toast]
  );

  // External navigation filter (e.g., from Spin the Globe)
  useEffect(() => {
    if (location.state?.filterByCountry) {
      setSearchTerm(location.state.filterByCountry);
      setCurrentPage(0);
      if (location.state.message) toast.success(location.state.message);
      window.history.replaceState(null, '');
    }
  }, [location.state, toast]);

  // Switch to travellers tab if ?tab=travellers is in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'travellers') {
      setMode('travellers');
      // Clean up the query string without adding a history entry
      navigate('/travels', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await request('GET', '/categories');
        if (response?.data && Array.isArray(response.data)) {
          setApiCategories(response.data.map((c) => ({
            name: c.name || '',
            icon: c.icon || '📌',
            id: c.id,
          })));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch the country list once on mount so the country dropdown
  // is populated. The list is short (~200 countries) so we keep it
  // in memory; we only refetch if the call fails the first time.
  useEffect(() => {
    let cancelled = false;
    setLoadingCountries(true);
    request('GET', '/cities/countries')
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setCountryOptions(list);
      })
      .catch(() => {
        if (cancelled) return;
        setCountryOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCountries(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Fetch the city list every time the country changes. We clear
  // the city when the country is cleared so a stale city doesn't
  // leak into the search query.
  useEffect(() => {
    if (!countryFilter) {
      setCityOptions([]);
      setCityFilter('');
      return undefined;
    }
    let cancelled = false;
    setLoadingCities(true);
    request('GET', `/cities/by-country?countryName=${encodeURIComponent(countryFilter)}`)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setCityOptions(list.map((c) => c.cityName).filter(Boolean));
      })
      .catch(() => {
        if (cancelled) return;
        setCityOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => { cancelled = true; };
  }, [countryFilter]);

  // ── Filter handlers ───────────────────────────────────
  const handleSearch = (e) => {
    const raw = e.target.value;
    if (raw.length > 100) {
      toast.danger('Pesquisa não pode exceder 100 caracteres.');
      return;
    }
    const sanitized = sanitizeSearchInput(raw);
    if (sanitized !== raw && raw !== '') {
      toast.danger('Pesquisa contém caracteres não permitidos.');
    }
    setSearchTerm(sanitized);
    setCurrentPage(0);
  };

  const handleCategoryChange = (category) => {
    setCategoryFilter((prev) => (
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    ));
    setCurrentPage(0);
  };

  const handleCategoryRemove = (category) => {
    setCategoryFilter((prev) => prev.filter((c) => c !== category));
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter([]);
    setSortOption('recent');
    setSelectedMonth('');
    setMinRating(1);
    setMinPrice('');
    setMaxPrice('');
    setMinDays('');
    setMaxDays('');
    setCountryFilter('');
    setCityFilter('');
    setCurrentPage(0);
    toast.info('Filtros limpos.');
  };

  // Derived
  const categories = apiCategories.length > 0 ? apiCategories : FALLBACK_CATEGORIES;
  const defaultLimit = 6;
  const visibleCategories = showAllCategories ? categories : categories.slice(0, defaultLimit);

  return (
    <div className="gm-travels">
      {/* ── Mobile-only: Filtros toggle (hidden on desktop) ──
          FIX (Round 33 — UI): o user pediu para esconder este
          botão na versão mobile quando o user está na tab
          "Viajantes" — os filtros aplicam-se a viagens, não a
          viajantes (a tab "Viajantes" só usa a search box). */}
      {mode === 'travels' && (
      <>
      <div className="gm-travels__mobile-bar">
        <button
          type="button"
          className="gm-travels__filters-toggle"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="travels-filters-inner"
        >
          <SlidersHorizontal size={14} strokeWidth={2} />
          Filtros
          {activeFilterCount > 0 && (
            <span className="gm-travels__filters-toggle-count">{activeFilterCount}</span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="gm-travels__clear-all"
            onClick={handleClearFilters}
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* ── Mobile-only standalone search (Round 35) ─────────
          The sidebar search is hidden on mobile (the filters
          sidebar collapses into a bottom-sheet). This standalone
          search bar mirrors the desktop behaviour: a free-text
          query that searches across the public feed via
          `?text=...` on /trips/public-feed. Sits between the
          Filtros button and the Viagens/Viajantes tabs. */}
      <div className="gm-travels__search gm-travels__search--standalone gm-travels__search--mobile">
        <Search size={18} strokeWidth={1.75} className="gm-travels__search-icon" />
        <input
          type="text"
          className="gm-travels__search-input"
          placeholder="Pesquisar viagens…"
          value={searchTerm}
          onChange={handleSearch}
          maxLength={100}
          aria-label="Pesquisar viagens"
        />
        {searchTerm && (
          <button
            type="button"
            className="gm-travels__search-clear"
            aria-label="Limpar pesquisa"
            onClick={() => { setSearchTerm(''); setCurrentPage(0); }}
          >
            <IconX size={14} strokeWidth={2} />
          </button>
        )}
      </div>
      </>
      )}

      {/* ── Mode toggle (Viagens / Viajantes) ───────────────────
          The same page is reused for both feeds: trip discovery
          (default) and traveller discovery (replaces the old
          /users page). The toggle keeps a single mental model
          and a single search box. */}
      <div className="gm-travels__mode-toggle" role="tablist" aria-label="Modo de descoberta">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'travels'}
          className={`gm-travels__mode ${mode === 'travels' ? 'gm-travels__mode--active' : ''}`}
          onClick={() => setMode('travels')}
        >
          <CompassIcon size={15} strokeWidth={1.75} />
          <span>Viagens</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'travellers'}
          className={`gm-travels__mode ${mode === 'travellers' ? 'gm-travels__mode--active' : ''}`}
          onClick={() => setMode('travellers')}
        >
          <UsersIcon size={15} strokeWidth={1.75} />
          <span>Viajantes</span>
        </button>
      </div>

      {/* ── Two-column layout: filters sidebar + results grid ── */}
      <div className={`gm-travels__layout ${mode === 'travellers' ? 'gm-travels__layout--no-sidebar' : ''}`.trim()}>
        {/* The desktop filters sidebar is only rendered for the
            Viagens mode. In the Viajantes mode the user gets a
            single search bar at the top of the results column
            (and inline follow buttons inside each card) — no
            filters, no clutter. */}
        {mode === 'travels' && (
        <aside className="gm-travels__sidebar" aria-label="Filtros">
          {/* Search */}
          <div className="gm-travels__search">
            <Search size={18} strokeWidth={1.75} className="gm-travels__search-icon" />
            <input
              type="text"
              className="gm-travels__search-input"
              placeholder="Pesquisar…"
              value={searchTerm}
              onChange={handleSearch}
              maxLength={100}
              aria-label="Pesquisar"
            />
            {searchTerm && (
              <button
                type="button"
                className="gm-travels__search-clear"
                aria-label="Limpar pesquisa"
                onClick={() => { setSearchTerm(''); setCurrentPage(0); }}
              >
                <IconX size={14} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="gm-travels__field">
            <label className="gm-travels__field-label" htmlFor="gm-travels-sort">
              <ArrowUpDown size={13} strokeWidth={1.75} /> Ordenar por
            </label>
            <div className="gm-travels__control">
              <select
                id="gm-travels-sort"
                className="gm-travels__select"
                value={sortOption}
                onChange={(e) => { setSortOption(e.target.value); setCurrentPage(0); }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Country */}
          <div className="gm-travels__field">
            <label className="gm-travels__field-label" htmlFor="gm-travels-country">
              <Flag size={13} strokeWidth={1.75} /> País
            </label>
            <div className="gm-travels__control">
              <select
                id="gm-travels-country"
                className="gm-travels__select"
                value={countryFilter}
                onChange={(e) => { setCountryFilter(e.target.value); setCurrentPage(0); }}
                disabled={loadingCountries}
              >
                <option value="">
                  {loadingCountries ? 'A carregar países…' : 'Todos os países'}
                </option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>{translateCountry(c)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* City (dependent on country) */}
          <div className="gm-travels__field">
            <label className="gm-travels__field-label" htmlFor="gm-travels-city">
              <MapPin size={13} strokeWidth={1.75} /> Cidade
            </label>
            <div className="gm-travels__control">
              <select
                id="gm-travels-city"
                className="gm-travels__select"
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(0); }}
                disabled={!countryFilter || loadingCities}
              >
                <option value="">
                  {!countryFilter
                    ? 'Selecione primeiro um país'
                    : (loadingCities ? 'A carregar cidades…' : 'Todas as cidades')}
                </option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>{translateCity(c)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Month */}
          <div className="gm-travels__field">
            <label className="gm-travels__field-label" htmlFor="gm-travels-month">
              <Calendar size={13} strokeWidth={1.75} /> Mês
            </label>
            <div className="gm-travels__control">
              <select
                id="gm-travels-month"
                className="gm-travels__select"
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(0); }}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rating */}
          <div className="gm-travels__field">
            <label className="gm-travels__field-label" htmlFor="gm-travels-rating">
              <Star size={13} strokeWidth={1.75} /> Avaliação mínima
            </label>
            <div className="gm-travels__control">
              <select
                id="gm-travels-rating"
                className="gm-travels__select"
                value={minRating}
                onChange={(e) => { setMinRating(Number(e.target.value)); setCurrentPage(0); }}
              >
                {RATING_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price range */}
          <div className="gm-travels__field">
            <span className="gm-travels__field-label">
              <Wallet size={13} strokeWidth={1.75} /> Preço (€)
            </span>
            <div className="gm-travels__price-range">
              <div className="gm-travels__price-input-wrap">
                <span className="gm-travels__price-prefix">€</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className="gm-travels__price-input"
                  placeholder="Mín."
                  value={minPrice}
                  aria-label="Preço mínimo (€)"
                  onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(0); }}
                />
              </div>
              <span className="gm-travels__price-sep">–</span>
              <div className="gm-travels__price-input-wrap">
                <span className="gm-travels__price-prefix">€</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className="gm-travels__price-input"
                  placeholder="Máx."
                  value={maxPrice}
                  aria-label="Preço máximo (€)"
                  onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(0); }}
                />
              </div>
            </div>
          </div>

          {/* Duration range (in days) — the backend already accepts
              `minDays` / `maxDays` on /trips/public-feed, so this
              just forwards the values. */}
          <div className="gm-travels__field">
            <span className="gm-travels__field-label">
              <Calendar size={13} strokeWidth={1.75} /> Duração (dias)
            </span>
            <div className="gm-travels__price-range">
              <div className="gm-travels__price-input-wrap">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className="gm-travels__price-input"
                  placeholder="Mín."
                  value={minDays}
                  aria-label="Duração mínima (dias)"
                  onChange={(e) => { setMinDays(e.target.value); setCurrentPage(0); }}
                />
              </div>
              <span className="gm-travels__price-sep">–</span>
              <div className="gm-travels__price-input-wrap">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className="gm-travels__price-input"
                  placeholder="Máx."
                  value={maxDays}
                  aria-label="Duração máxima (dias)"
                  onChange={(e) => { setMaxDays(e.target.value); setCurrentPage(0); }}
                />
              </div>
            </div>
          </div>

          {/* Categories — vertical list */}
          <div className="gm-travels__field">
            <span className="gm-travels__field-label">
              <Tag size={13} strokeWidth={1.75} /> Categorias
            </span>
            <ul className="gm-travels__category-list" role="list">
              {categories.map((cat) => {
                const isActive = categoryFilter.includes(cat.name);
                return (
                  <li key={cat.name}>
                    <button
                      type="button"
                      className={`gm-travels__category-item${isActive ? ' gm-travels__category-item--active' : ''}`}
                      onClick={() => handleCategoryChange(cat.name)}
                      aria-pressed={isActive}
                    >
                      <span className="gm-travels__category-emoji" aria-hidden="true">
                        {convertEmojiCode(cat.icon)}
                      </span>
                      <span className="gm-travels__category-name">{cat.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              className="gm-travels__clear-filters"
              onClick={handleClearFilters}
            >
              Limpar todos os filtros
            </button>
          )}
        </aside>
        )}

        {/* ── Results column ─────────────────────────────── */}
        <div className="gm-travels__results">
          {mode === 'travellers' ? (
            <>
              {/* Standalone search bar — the only filter exposed in
                  the Viajantes mode. Reuses the same `searchTerm` state
                  as the travels feed so the two pages share the input
                  contract. */}
              <div className="gm-travels__search gm-travels__search--standalone">
                <Search size={18} strokeWidth={1.75} className="gm-travels__search-icon" />
                <input
                  type="text"
                  className="gm-travels__search-input"
                  placeholder="Procurar viajantes…"
                  value={searchTerm}
                  onChange={handleSearch}
                  maxLength={100}
                  aria-label="Procurar viajantes"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="gm-travels__search-clear"
                    aria-label="Limpar pesquisa"
                    onClick={() => { setSearchTerm(''); }}
                  >
                    <IconX size={14} strokeWidth={2} />
                  </button>
                )}
              </div>

              <div className="gm-travels__meta">
                {!loadingTravellers && (
                  <span>
                    <strong>{travellersTotal}</strong>{' '}
                    {travellersTotal === 1 ? 'viajante' : 'viajantes'}
                    {searchTerm && ` para "${searchTerm}"`}
                  </span>
                )}
              </div>
              <div className="gm-travels__grid gm-travels__grid--travellers">
                {travellers.map((t) => (
                  <TravellerCard
                    key={t.id || t.username}
                    traveller={t}
                    myUserId={myUserId}
                    isFollowing={followingIds.has(t.id)}
                    isPending={pendingIds.has(t.id)}
                    loading={travellerActionLoading}
                    onBlock={handleBlockTraveller}
                    onRelationshipChange={handleTravellerChange}
                  />
                ))}
                {!loadingTravellers && travellers.length === 0 && (
                  <div className="gm-travels__empty">
                    <div className="gm-travels__empty-icon">
                      <UsersIcon size={28} strokeWidth={1.5} />
                    </div>
                    <h2>Nenhum viajante encontrado</h2>
                    <p>Tente outro nome de utilizador ou outra nacionalidade.</p>
                  </div>
                )}
              </div>
              {travellersHasMore && (
                <div className="gm-travels__more">
                  <button
                    type="button"
                    className="gm-travels__more-btn"
                    onClick={() => fetchTravellers(travellersPage + 1, true)}
                    disabled={loadingTravellers}
                  >
                    {loadingTravellers ? 'A carregar…' : 'Carregar mais'}
                  </button>
                </div>
              )}
            </>
          ) : null}

          {/* Results count */}
          <div className="gm-travels__meta">
            {!loading && mode === 'travels' && (
              <span>
                <strong>{totalElements}</strong> {totalElements === 1 ? 'viagem' : 'viagens'}
                {searchTerm && ` para "${searchTerm}"`}
              </span>
            )}
          </div>

          {/* Active filter pills (categories) */}
          {categoryFilter.length > 0 && (
            <div className="gm-travels__active">
              {categoryFilter.map((cat) => {
                const data = categories.find((c) => c.name === cat);
                return (
                  <span key={cat} className="gm-travels__active-pill">
                    {data ? convertEmojiCode(data.icon) : ''} {cat}
                    <button
                      type="button"
                      onClick={() => handleCategoryRemove(cat)}
                      aria-label={`Remover filtro ${cat}`}
                    >
                      <IconX size={11} strokeWidth={2.5} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* ── Grid of cards (inside results column) ──────── */}
          {mode === 'travels' && (
            <div className="gm-travels__grid">
            {loading && currentPage === 0 ? (
              <div className="gm-travels__skeletons">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="gm-travels__skeleton">
                    <div className="gm-travels__skeleton-photo" />
                    <div className="gm-travels__skeleton-body">
                      <div className="gm-travels__skeleton-line" style={{ width: '70%', height: 14 }} />
                      <div className="gm-travels__skeleton-line" style={{ width: '40%' }} />
                      <div className="gm-travels__skeleton-line" style={{ width: '90%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : feedTravels.length > 0 ? (
          <>
            {feedTravels.map((travel) => (
              <TravelCard
                key={travel.id}
                travel={travel}
                user={user}
                isSaved={savedTripIds.has(travel.tripId)}
                isSaving={saveBusyIds.has(travel.tripId)}
                onToggleSave={handleToggleSave}
                onReport={setReportFor}
              />
            ))}

            {currentPage < totalPages - 1 && (
              <div className="gm-travels__more">
                <button
                  type="button"
                  className="gm-travels__more-btn"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={loading}
                >
                  {loading ? 'A carregar…' : 'Carregar mais'}
                </button>
              </div>
            )}

            {currentPage >= totalPages - 1 && feedTravels.length > 0 && (
              <div className="gm-travels__end">
                <span className="gm-travels__end-line" />
                <span>Chegou ao fim</span>
                <span className="gm-travels__end-line" />
              </div>
            )}
          </>
        ) : (
          <div className="gm-travels__empty">
            <div className="gm-travels__empty-icon">
              <MapPin size={28} strokeWidth={1.5} />
            </div>
            <h2>Nenhuma viagem encontrada</h2>
            <p>Tente ajustar os filtros ou explorar outras categorias.</p>
            <button
              type="button"
              className="gm-travels__more-btn"
              onClick={handleClearFilters}
              style={{ marginTop: 16 }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
          )}
      </div>
      </div>
      {/* close .gm-travels__grid (conditional) + .gm-travels__results + .gm-travels__layout */}

      <ReportSheet
        open={!!reportFor}
        onClose={() => setReportFor(null)}
        travel={reportFor || {}}
      />

      {/* ── Mobile bottom sheet (Filters) ─────────────────── */}
      {filtersOpen && (
        <div
          className="gm-travels__sheet-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setFiltersOpen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
        >
          <div className="gm-travels__sheet" onClick={(e) => e.stopPropagation()}>
            <div className="gm-travels__sheet-handle" />
            <div className="gm-travels__sheet-header">
              <h2 className="gm-travels__sheet-title">Filtros</h2>
              <button
                type="button"
                className="gm-travels__sheet-close"
                onClick={() => setFiltersOpen(false)}
                aria-label="Fechar filtros"
              >
                <IconX size={16} strokeWidth={2.25} />
              </button>
            </div>

            <div className="gm-travels__sheet-group">
              <span className="gm-travels__sheet-label">Ordenar por</span>
              <div className="gm-travels__control" style={{ width: '100%' }}>
                <ArrowUpDown size={14} strokeWidth={1.75} className="gm-travels__control-icon" />
                <select
                  className="gm-travels__select"
                  value={sortOption}
                  onChange={(e) => { setSortOption(e.target.value); setCurrentPage(0); }}
                  aria-label="Ordenar por"
                  style={{ width: '100%' }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="gm-travels__sheet-group">
              <span className="gm-travels__sheet-label">Mês</span>
              <div className="gm-travels__control" style={{ width: '100%' }}>
                <Calendar size={14} strokeWidth={1.75} className="gm-travels__control-icon" />
                <select
                  className="gm-travels__select"
                  value={selectedMonth}
                  onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(0); }}
                  aria-label="Mês"
                  style={{ width: '100%' }}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="gm-travels__sheet-group">
              <span className="gm-travels__sheet-label">Avaliação mínima</span>
              <div className="gm-travels__control" style={{ width: '100%' }}>
                <Star size={14} strokeWidth={1.75} className="gm-travels__control-icon" />
                <select
                  className="gm-travels__select"
                  value={minRating}
                  onChange={(e) => { setMinRating(Number(e.target.value)); setCurrentPage(0); }}
                  aria-label="Avaliação mínima"
                  style={{ width: '100%' }}
                >
                  {RATING_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="gm-travels__sheet-group">
              <span className="gm-travels__sheet-label">Preço (€)</span>
              <div className="gm-travels__price-range" style={{ width: '100%' }}>
                <div className="gm-travels__price-input-wrap">
                  <span className="gm-travels__price-prefix">€</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    className="gm-travels__price-input"
                    placeholder="Mín."
                    value={minPrice}
                    aria-label="Preço mínimo"
                    onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(0); }}
                  />
                </div>
                <span className="gm-travels__price-sep">–</span>
                <div className="gm-travels__price-input-wrap">
                  <span className="gm-travels__price-prefix">€</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    className="gm-travels__price-input"
                    placeholder="Máx."
                    value={maxPrice}
                    aria-label="Preço máximo"
                    onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(0); }}
                  />
                </div>
              </div>
            </div>

            <div className="gm-travels__sheet-group">
              <span className="gm-travels__sheet-label">Categorias</span>
              <div className="gm-travels__sheet-chips">
                {categories.map((cat) => {
                  const isActive = categoryFilter.includes(cat.name);
                  return (
                    <button
                      type="button"
                      key={cat.name}
                      className={`gm-travels__chip ${isActive ? 'gm-travels__chip--active' : ''}`}
                      onClick={() => handleCategoryChange(cat.name)}
                      aria-pressed={isActive}
                    >
                      <span className="gm-travels__chip-emoji" aria-hidden="true">{convertEmojiCode(cat.icon)}</span>
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="gm-travels__sheet-actions">
              <button
                type="button"
                className="gm-travels__sheet-clear"
                onClick={handleClearFilters}
              >
                Limpar tudo
              </button>
              <button
                type="button"
                className="gm-travels__sheet-apply"
                onClick={() => setFiltersOpen(false)}
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── TravelCard (premium, matches Post v3.1 design language) ─── */
const TravelCard = ({ travel, user, isSaved, isSaving, onToggleSave, onReport }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef(null);
  const navigate = useNavigate();
  // `isOwn` = esta viagem é do próprio user autenticado. Se sim,
  // escondemos o botão de guardar (não faz sentido guardar as nossas
  // próprias viagens) e o menu de report.
  const isOwn = Boolean(user && travel?.userId && Number(user.id) === Number(travel.userId));

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [menuOpen]);

  const handleReport = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Inicie sessão para denunciar.');
      return;
    }
    setMenuOpen(false);
    onReport?.(travel);
  };

  const handleToggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave?.(travel);
  };

  // The author glass is now a Link to the author's profile. It
  // is rendered as a SIBLING of the main card Link (so the
  // outer click target is still the travel page, but clicking
  // the author opens the profile). NOTE: this must use the raw
  // @username (`travel.userUsername`), not the display name
  // (`travel.user`). Otherwise a profile rename would break the
  // /profile/{user} link.
  const authorUsername = travel.userUsername || travel.user || '';
  const authorProfileHref = authorUsername
    ? `/profile/${authorUsername}`
    : null;

  return (
    <article className="gm-travel-card">
      <Link to={`/travel/${travel.tripId}`} className="gm-travel-card__link" aria-label={`Ver ${travel.name}`}>
        {/* ── Photo ─────────────────────────────────────── */}
        <div className="gm-travel-card__media">
          {travel.highlightImage ? (
            <ProgressiveImg
              src={travel.highlightImage}
              alt={travel.name}
              // Round 90 (perf) — the first card on /travels is
              // THE LCP element of the page. Was `eager={false}`
              // (lazy) which made the browser wait until the JS
              // told it the image was visible before fetching —
              // the LCP clock kept ticking. `eager={true}` +
              // `fetchpriority="high"` + the right `sizes` makes
              // the browser pre-fetch the 320w thumb in parallel
              // with parsing the HTML, so LCP drops from ~3s to
              // ~0.5s on a fast connection.
              // The `sizes` attribute tells the browser the
              // rendered width: ~340px on desktop (with sidebar
              // 240px + filters 260px + padding), 100vw on
              // mobile. With DPR 1.5x the browser picks the
              // 640w thumb, not the 1024w. ~30KB instead of
              // ~80KB. ~5x faster decode.
              eager={true}
              sizes="(max-width: 768px) 100vw, 340px"
              imgClassName="gm-travel-card__photo"
            />
          ) : (
            <div className="gm-travel-card__photo gm-travel-card__photo--empty">
              <MapPin size={28} strokeWidth={1.5} />
            </div>
          )}

          {/* Bookmark (Save) — canto superior esquerdo da foto.
              Só renderizamos para users autenticados E para viagens
              que não são nossas (não faz sentido guardar a nossa
              própria viagem). Usamos o `Bookmark` filled quando já
              está guardada. */}
          {user && !isOwn && (
            <button
              type="button"
              className={`gm-travel-card__save ${isSaved ? 'gm-travel-card__save--on' : ''}`}
              onClick={handleToggleSave}
              disabled={isSaving}
              aria-label={isSaved ? 'Remover dos guardados' : 'Guardar viagem'}
              aria-pressed={Boolean(isSaved)}
              title={isSaved ? 'Remover dos guardados' : 'Guardar viagem'}
            >
              <Bookmark size={16} strokeWidth={1.75} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          )}

          {/* Top overlay: privacy badge + stars + price. Round 46+ —
              drafts are gone, so every trip shown here is published.
              We keep the privacy pill (Privada/Pública) so the owner
              knows what visibility they chose. */}
          <div className="gm-travel-card__media-top">
            <div className="gm-travel-card__spacer" />
            {isOwn && travel.privacy && String(travel.privacy).toUpperCase() === 'PRIVATE' && (
              <span className="gm-travel-card__pill gm-travel-card__pill--private" title="Só tu podes ver esta viagem">
                <Lock size={11} strokeWidth={2.2} /> Privada
              </span>
            )}
            {travel.isMultiDest ? (
              <span className="gm-travel-card__pill gm-travel-card__pill--multi" title="Viagem com vários destinos">
                <MapPin size={11} strokeWidth={2.2} /> Multidestino
              </span>
            ) : (travel.citiesCount === 1 && (
              <span className="gm-travel-card__pill gm-travel-card__pill--single" title="Viagem com um único destino">
                <MapPin size={11} strokeWidth={2.2} /> Destino Único
              </span>
            ))}
            {travel.stars > 0 && (
              <span className="gm-travel-card__pill gm-travel-card__pill--stars">
                <Star size={11} strokeWidth={0} fill="currentColor" />
                {Number(travel.stars).toFixed(1)}
              </span>
            )}
            {Number(travel.price) > 0 && (
              <span className="gm-travel-card__pill gm-travel-card__pill--price">€ {travel.price}</span>
            )}
          </div>

          {/* Bottom gradient + author.
              Round 45+ — O author era um <Link> dentro do <Link> principal,
              o que dispara um erro de hydration (`<a>` cannot be a
              descendant of `<a>`). Substituímos por <button> + useNavigate
              para manter a navegação mas evitar o aninhamento inválido. */}
          <div className="gm-travel-card__media-bottom">
            {authorProfileHref ? (
              <button
                type="button"
                className="gm-travel-card__author-glass"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(authorProfileHref); }}
                aria-label={`Ver perfil de ${authorUsername}`}
              >
                <Avatar
                  src={travel.userProfilePicture}
                  name={travel.user}
                  size="xs"
                />
                <span className="gm-travel-card__author-name">{travel.user}</span>
              </button>
            ) : (
              <div className="gm-travel-card__author-glass">
                <Avatar
                  src={travel.userProfilePicture}
                  name={travel.user}
                  size="xs"
                />
                <span className="gm-travel-card__author-name">{travel.user}</span>
              </div>
            )}

            {/* 3-dot menu — bottom-right of the media (matches the action
                menus used across the rest of the app). The trigger sits
                over the gradient, so we lift z-index above the bottom
                overlay. Round 62+ — We hide the entire menu for the
                user's own trips (`isOwn` is already computed above as a
                `user.id === travel.userId` numeric comparison). The
                previous guard (`user.username !== travel.user`) was
                unreliable because `travel.user` is the display name
                (e.g. "Tiago Silva") and rarely matched the raw
                username, so the kebab — and the report action it
                opened — kept showing up on the user's own cards. */}
            {user && !isOwn && (
              <div ref={menuRef} className="gm-travel-card__menu">
                <button
                  type="button"
                  className="gm-travel-card__menu-btn"
                  aria-label="Mais opções"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((m) => !m); }}
                >
                  <MoreHorizontal size={18} strokeWidth={1.75} />
                </button>
                {menuOpen && (
                  <div className="gm-travel-card__menu-pop" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className="gm-travel-card__menu-item gm-travel-card__menu-item--danger"
                      onClick={handleReport}
                    >
                      <Flag size={14} strokeWidth={1.75} />
                      Denunciar publicação
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────── */}
        <div className="gm-travel-card__body">
          <h3 className="gm-travel-card__title">{travel.name}</h3>

          {travel.isMultiDest ? (
            // Multi-destination: list every city visited, joined with
            // " → " so the reader can scan the route at a glance
            // (same format as the trip detail page topbar —
            // gm-td__topbar-sub).
            <div className="gm-travel-card__meta-row">
              <MapPin size={13} strokeWidth={1.75} className="gm-travel-card__meta-icon" />
              <span>
                {(travel.cities || []).map((c) => translatePlace(c)).join(' → ')}
              </span>
            </div>
          ) : (
            (travel.city || travel.country) && (
              <div className="gm-travel-card__meta-row">
                <MapPin size={13} strokeWidth={1.75} className="gm-travel-card__meta-icon" />
                <span>{translatePlace([travel.city, travel.country].filter(Boolean).join(', '))}</span>
              </div>
            )
          )}

          {(travel.startDate || travel.endDate) && (
            <div className="gm-travel-card__meta-row gm-travel-card__meta-row--muted">
              <Calendar size={13} strokeWidth={1.75} className="gm-travel-card__meta-icon" />
              <span>
                {formatDate(travel.startDate)}
                {travel.endDate && travel.endDate !== travel.startDate && (
                  <> – {formatDate(travel.endDate)}</>
                )}
              </span>
            </div>
          )}

          {/* Categories — shown under the date, not on the photo. The
              backend returns ALL trip categories on the DTO, so we
              render every one of them. When the row is longer than
              the available width we collapse the overflow into a
              "+N" pill that exposes the rest on hover. */}
          {Array.isArray(travel.category) && travel.category.length > 0 && (
            <div className="gm-travel-card__cats">
              {travel.category.slice(0, 4).map((cat) => (
                <span key={cat} className="gm-travel-card__cat-pill">{cat}</span>
              ))}
              {travel.category.length > 4 && (
                <span
                  className="gm-travel-card__cat-pill gm-travel-card__cat-pill--more"
                  title={travel.category.slice(4).join(', ')}
                >
                  +{travel.category.length - 4}
                </span>
              )}
            </div>
          )}

          {travel.description && (
            <p className="gm-travel-card__desc">{travel.description}</p>
          )}
        </div>
      </Link>
    </article>
  );
};

/* ── TravellerCard (premium, used in the Viajantes mode) ───
   Reuses the same follow / unfollow / block endpoints as the
   profile page so the user can manage relationships without
   leaving the search results. The follow state is tracked in
   the parent component (via `followingIds`) so we don't re-fetch
   the relationship on every card render. */
const TravellerCard = ({
  traveller, myUserId, isFollowing, isPending, loading,
  onBlock, onRelationshipChange,
}) => {
  const fullName = getDisplayName(traveller, traveller.username);
  const isSelf = myUserId && Number(myUserId) === Number(traveller.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef(null);

  // Callback memoizada com `traveller.id` capturado por closure.
  // É passada ao `FollowButton` (que internamente é estável) para
  // propagar o state do hook para o pai (Travels) sem causar
  // re-renders extra.
  const handleChange = useCallback(
    (state) => onRelationshipChange(traveller.id, state),
    [onRelationshipChange, traveller.id]
  );

  // Close the kebab menu on outside click / Esc.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <article className="gm-traveller-card">
      {/* Round 50 — Vertical compact card. The previous horizontal
          (avatar | body) layout left a lot of empty space inside
          each card when shown 4-up. Re-stacking vertically keeps
          the card dense in 2/3/4 columns. The kebab is now absolute
          in the top-right corner so it doesn't add to the card
          width (which was the main source of dead space). */}

      <Link
        to={`/profile/${traveller.username}`}
        className="gm-traveller-card__profile"
        aria-label={`Ver perfil de ${fullName}`}
      >
        <div className="gm-traveller-card__head">
          <Avatar
            src={toFullMediaUrl(traveller.profilePhoto)}
            name={fullName}
            size="lg"
          />
          <div className="gm-traveller-card__id">
            <span className="gm-traveller-card__name">{fullName}</span>
            <span className="gm-traveller-card__handle">@{traveller.username}</span>
            {traveller.nationality && (
              <span className="gm-traveller-card__location">
                <Globe2 size={11} strokeWidth={1.75} /> {traveller.nationality}
              </span>
            )}
          </div>
        </div>
        {traveller.userBio && (
          <p className="gm-traveller-card__bio">{traveller.userBio}</p>
        )}
        <div className="gm-traveller-card__stats">
          <div className="gm-traveller-card__stat">
            <strong>{traveller.totalTripPosts ?? 0}</strong>
            <span>{(traveller.totalTripPosts ?? 0) === 1 ? 'viagem' : 'viagens'}</span>
          </div>
          <div className="gm-traveller-card__stat">
            {/* Round 77 (Bug 6): the UserBasicDto now exposes
                numberOfFollowers / numberOfFollowing (the same
                naming as UserDetailedProfileDto). The previous
                `followersCount` was undefined, so the card
                rendered 0 for every traveller. The fallback
                chain `?? traveller.followersCount` keeps the
                card working in case the backend hasn't been
                redeployed yet. */}
            <strong>{traveller.numberOfFollowers ?? traveller.followersCount ?? 0}</strong>
            <span>seguidores</span>
          </div>
          <div className="gm-traveller-card__stat">
            <strong>{traveller.numberOfFollowing ?? traveller.followingCount ?? 0}</strong>
            <span>a seguir</span>
          </div>
        </div>
        {/* FIX (Round 33 — UI): o user pediu para o botão "Seguir"
            ficar por baixo do número de viagens (em vez de ao
            lado, no canto superior direito do card). Continua
            dentro do body, mas como o card é vertical, fica
            centralizado em vez de alinhado à esquerda. */}
        {!isSelf && (
          <div
            className="gm-traveller-card__follow-wrap"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <FollowButton
              userId={traveller.id}
              username={traveller.username}
              privateProfile={Boolean(traveller.privateProfile)}
              initialIsFollowing={isFollowing}
              initialIsPending={isPending}
              size="sm"
              onChange={handleChange}
            />
          </div>
        )}
      </Link>

      {!isSelf && (
        <div className="gm-traveller-card__menu" ref={menuRef}>
          <button
            type="button"
            className="gm-traveller-card__iconbtn"
            aria-label="Mais opções"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
          >
            <MoreVertical size={16} strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <div className="gm-traveller-card__menu-pop" role="menu">
              <button
                type="button"
                role="menuitem"
                className="gm-traveller-card__menu-item gm-traveller-card__menu-item--danger"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBlock(traveller); setMenuOpen(false); }}
              >
                <Ban size={14} strokeWidth={1.75} />
                Bloquear
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default Travels;
