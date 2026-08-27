import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../axios_helper';
import useSwipeGesture from '../hooks/useSwipeGesture';
import {
  Star, Heart, MessageCircle, Send, Flag,
  Trash2, MapPin, Calendar, Bookmark, Share2,
  ArrowLeft, Loader2, AlertCircle, RefreshCw, Compass,
  Sparkles, Globe, X as IconX, Camera,
  ChevronDown, BedDouble, UtensilsCrossed, Bus,
} from 'lucide-react';
import {
  Avatar, PageContainer, Section, SectionHeader,
  MediaCarousel, Lightbox, Sheet, ReportSheet,
  useToast, TextExpandable, CommentThread, flattenCommentTree,
} from './ui';
import { COMMENT_LIMITS, validateComment } from '../config/commentConfig';
import { request, toFullMediaUrl } from '../axios_helper';
import { getDisplayName } from '../utils/userDisplay';
import useProfileUpdates from '../hooks/useProfileUpdates';
import '../styles/components/TravelDetailsModern.css';

// Round 50 — Parse a photo caption into its free-text body and
// (optional) association pill. The wizard encodes associations as
// `[Tipo: Nome]` tags at the start of the caption; this helper
// pulls them out and returns a clean object so the gallery can
// render them as a chip above the caption body. Example:
//   "[Alojamento: Hotel Paris] vista do quarto"
//   → { association: { type: 'Alojamento', name: 'Hotel Paris' },
//        text: 'vista do quarto' }
const PHOTO_ASSOC_RE = /^\s*\[(Alojamento|Alimenta\u00e7\u00e3o|Transporte|Ponto de Interesse)\s*:\s*([^\]]+)\]\s*(.*)$/s;
function parsePhotoCaption(raw) {
  if (!raw) return { text: '', association: null };
  const m = String(raw).match(PHOTO_ASSOC_RE);
  if (!m) return { text: String(raw), association: null };
  return { association: { type: m[1], name: m[2].trim() }, text: (m[3] || '').trim() };
}

// V15 — Render a numeric cost as `<value><symbol>`, with the symbol
// resolved from the trip's currency code. Falls back to "€" so legacy
// trips (or admin-only responses that bypass the wizard) never render
// as `100undefined` on the wire. The mapping is intentionally small —
// the wizard only exposes 4 currencies today; new codes fall through
// to their ISO 4217 symbol.
const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  BRL: 'R$',
  JPY: '¥',
  CNY: '¥',
  CHF: 'CHF ',
  AUD: 'A$',
  CAD: 'C$',
  MXN: 'MX$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
};
function formatPrice(value, currency) {
  const n = Number(value) || 0;
  const code = (currency || 'EUR').toUpperCase();
  const sym = CURRENCY_SYMBOLS[code] || (code + ' ');
  // Use a thin space before the symbol for ISO codes that don't have
  // their own prefix symbol; for symbol-prefixed currencies ($, €,
  // £, ¥, R$, A$, C$, MX$) the symbol already sits before the number.
  if (sym.endsWith(' ')) return `${sym}${n}`;
  return `${sym}${n}`;
}

/* ── Sanitize (XSS) ─────────────────────────────────────── */
const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<style[^>]*>.*?<\/style>/gi,
];
const sanitizeContent = (s = '') => {
  let out = String(s);
  for (const p of DANGEROUS_PATTERNS) out = out.replace(p, '');
  return out;
};

/* ── Category emoji map (backend uses :name: format) ───── */
const CATEGORY_EMOJI = {
  ':city_dusk:': '🌆', ':herb:': '🌿', ':classical_building:': '🏛️',
  ':beach_with_umbrella:': '🏖️', ':mountain:': '⛰️', ':fork_and_knife:': '🍽️',
  ':airplane:': '✈️', ':tent:': '⛺', ':national_park:': '🏞️', ':ski:': '⛷️',
  ':shopping_bags:': '🛍️', ':performing_arts:': '🎭', ':camera:': '📷', ':bicyclist:': '🚴',
};
const mapCatIcon = (icon) => {
  if (!icon) return '📌';
  if (CATEGORY_EMOJI[icon]) return CATEGORY_EMOJI[icon];
  // If the backend already sent a real emoji (non-`:name:`), keep it.
  if (!icon.startsWith(':')) return icon;
  return '📌';
};

/* ── Date range helper (travel header) ───────────────────── */
function formatDateRange(start, end) {
  if (!start) return '';
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  try {
    if (end && end !== start) {
      return `${new Date(start).toLocaleDateString('pt-PT', opts)} – ${new Date(end).toLocaleDateString('pt-PT', opts)}`;
    }
    return new Date(start).toLocaleDateString('pt-PT', opts);
  } catch { return ''; }
}

/* ── (no mock fallback) ──────────────────────────────── */
// The travel details page no longer falls back to a hardcoded mock
// fixture. The user explicitly asked to remove all mock data across
// the app; if the backend fails we show an empty state with a
// friendly error message instead.

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
const TravelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const toast = useToast();

  // The compose avatar must always reflect the photo the
  // backend has on file. We re-read localStorage on mount and
  // also listen for the `gm:profile-updated` event from
  // EditProfile so a fresh upload is visible here without a
  // hard refresh.
  const [user, setUserState] = useState(() => {
    if (typeof window === 'undefined') return authUser;
    try {
      const stored = window.localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) { /* no-op */ }
    return authUser;
  });

  // The local `user.profilePhoto` may be stale (the user
  // uploaded a new photo on another tab / device). Fetch the
  // current record from the backend on mount so the composer
  // avatar is the actual photo the user has right now. We
  // only update if the backend returns a different path so
  // we don't fight the user-typed `name` field.
  useEffect(() => {
    if (!authUser?.id) return undefined;
    let cancelled = false;
    request('GET', `/users/${authUser.id}/detailed`)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const fresh = data.profilePhoto || data.profilePicture;
        if (fresh && fresh !== user?.profilePhoto) {
          setUserState((prev) => ({ ...(prev || authUser), ...data, profilePhoto: fresh, profilePicture: fresh }));
        }
      })
      .catch(() => { /* best-effort */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  useEffect(() => {
    const refresh = () => {
      try {
        const stored = window.localStorage.getItem('user');
        if (stored) setUserState(JSON.parse(stored));
      } catch (e) { /* no-op */ }
    };
    const onProfileUpdated = (e) => {
      if (!e?.detail?.username || !authUser || e.detail.username === authUser.username) {
        refresh();
      }
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('gm:profile-updated', onProfileUpdated);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('gm:profile-updated', onProfileUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // Round 46+ — When the trip author updates their profile, refetch
  // the trip so the author block shows the new firstName / lastName
  // / profilePhoto without a hard refresh. We skip the refetch when
  // the event is about a different user to avoid wasted network
  // calls.
  useProfileUpdates({
    match: (u) => Boolean(u) && travel?.user?.username === u,
    onUpdate: () => {
      if (loadTripRef.current) loadTripRef.current();
    },
  });

  /* ── Core state ─────────────────────────────────────── */
  const [travel, setTravel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  // V16 — Multi-destination: which accordion is open. Defaults to
  // the first destination (or 'general' for items without a city
  // assignment). The bar at the top of the page sets this state
  // when the user clicks a stop.
  const [activeDest, setActiveDest] = useState(null);
  // V16 — Gallery filter. 'all' (default) or a cityId / cityName.
  // Resets to 'all' whenever the trip id changes.
  const [galleryFilter, setGalleryFilter] = useState('all');

  // Stable ref to the trip loader. The gm:profile-updated listener
  // is registered above (before `loadTrip` is defined) and uses
  // this ref to call back into the loader without hoisting issues.
  const loadTripRef = React.useRef(null);

  /* ── Lightbox ───────────────────────────────────────── */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  /* ── Like ───────────────────────────────────────────── */
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likePending, setLikePending] = useState(false);

  /* ── Saved (private "Viagens Guardadas" collection) ── */
  const [saved, setSaved] = useState(false);
  const [savedPending, setSavedPending] = useState(false);

  /* ── Comments (global CommentThread) ───────────────────── */
  // The thread is rendered by the shared `CommentThread` component
  // for visual consistency with the Home feed and the QandA forum.
  // The local state holds a flat list of comments (parent + replies
  // with `parentId`), produced by `flattenCommentTree`.
  const [showComments, setShowComments] = useState(true);
  // Round 87 — ref to the comments section so the "Comentários" stat-card
  // in the stats row can scroll the user to the comments composer when
  // clicked (the previous version only set showComments=true, which
  // opened the section if it was collapsed but didn't move the viewport).
  const commentsSectionRef = useRef(null);
  const scrollToComments = useCallback(() => {
    setShowComments(true);
    // requestAnimationFrame defers the scroll to the next frame so the
    // section's height is final before we measure it (the section
    // is conditionally rendered — opening it changes the page height).
    requestAnimationFrame(() => {
      commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // After the scroll, focus the composer textarea so the user can
      // start typing immediately. A short delay (60ms) lets the scroll
      // animation begin so the keyboard doesn't pop up over the
      // scrolling content on mobile.
      setTimeout(() => {
        const composer = commentsSectionRef.current?.querySelector('textarea, input');
        if (composer) composer.focus({ preventScroll: true });
      }, 60);
    });
  }, []);
  // Round 87 — clicking the avatar or the name of a comment author
  // navigates to that user's profile. The shared <CommentThread>
  // renders the avatar + name as buttons that call this handler.
  // We prefer the @username (stable) over the numeric userId; if
  // the comment is anonymous / has no username we fall back to the
  // userId (the /profile/:id route is kept for legacy data).
  const handleCommentUserClick = useCallback((c) => {
    const username = c?.username || c?.userUsername;
    if (username) {
      navigate(`/profile/${username}`);
    } else if (c?.userId) {
      navigate(`/profile/${c.userId}`);
    }
  }, [navigate]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(0);
  const [commentsTotalPages, setCommentsTotalPages] = useState(0);
  const [commentsTotalCount, setCommentsTotalCount] = useState(0);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);

  /* ── Sheet: details / report ────────────────────────── */
  const [sheet, setSheet] = useState({ open: false, kind: null, title: '', body: null });
  const [reportOpen, setReportOpen] = useState(false);

  /* ════════════════════════════════════════════════════════════
     DATA TRANSFORM + FETCH
     ════════════════════════════════════════════════════════════ */

  const transformTrip = useCallback((dto) => ({
    id: dto.id,
    userId: dto.userId,
    name: dto.title || 'Viagem sem título',
    // V16 — Multi-destination: keep the full ordered list of cities
    // so the page can render the route bar and group items per city.
    // `dto.cities` from TripCompleteDto is the ordered city list
    // (added in V16). Fallback to the first entry for legacy
    // payloads / single-city views.
    destinations: Array.isArray(dto.cities) ? dto.cities : (Array.isArray(dto.citiesDetail) ? dto.citiesDetail : []),
    city: dto.cities?.[0]?.cityName || dto.citiesDetail?.[0]?.cityName || dto.accommodations?.[0]?.city || '',
    country: dto.cities?.[0]?.countryname || dto.citiesDetail?.[0]?.countryname || '',
    // Round 46+ — Prefer the live "First Last" name (from the
    // backend's latest user record) over the username, so a
    // profile rename propagates to /travel/{id} immediately.
    // `userUsername` is the raw @username (used for /profile
    // links) — kept SEPARATE from `user` (the display name) so
    // that a profile rename doesn't break the link target.
    user: getDisplayName({
      userFirstName: dto.userFirstName,
      userLastName: dto.userLastName,
      username: dto.username,
    }, dto.userId === user?.id
      ? getDisplayName(user, `Utilizador ${dto.userId}`)
      : `Utilizador ${dto.userId}`),
    userUsername: dto.username || '',
    userProfilePicture: dto.userProfilePhoto || null,
    highlightImage: toFullMediaUrl(dto.photos?.[0] || dto.accommodations?.[0]?.photos?.[0]) || null,
    price: (dto.cost?.total ?? 0).toString(),
    // V15 — currency code so the renderer can swap the symbol
    // (€, $, £, R$, ...). Falls back to "EUR" for legacy / admin
    // responses that don't carry the field.
    currency: dto.cost?.currency || 'EUR',
    days: dto.tripDurationDays || 1,
    views: 0,
    likes: dto.totalLikes || 0,
    stars: dto.tripRating || 0,
    transports: (dto.transports || []).filter((t) => t && t.name).map((t) => t.name),
    startDate: dto.startDate, endDate: dto.endDate,
    bookingDate: dto.bookingDate,
    priceDetails: {
      hotel: (dto.cost?.accommodation ?? 0).toString(),
      flight: (dto.cost?.transport ?? 0).toString(),
      food: (dto.cost?.food ?? 0).toString(),
      extras: (dto.cost?.extra ?? 0).toString(),
    },
    description: dto.tripSummary || '',
    longDescription: dto.tripDescription || dto.tripSummary || '',
    climate: dto.weather || '',
    languagesSpoken: dto.languagesSpoken || [],
    languages: (dto.languagesSpoken || []).map((l) => l.name),
    category: (dto.categories || []).map((c) => c.categoryName || c.name || ''),
    categories_full: (dto.categories || []).map((c) => ({
      name: c.categoryName || c.name || '',
      icon: mapCatIcon(c.icon || c.categoryIcon),
    })),
    travelVideos: (dto.videos || []).filter(Boolean).map(toFullMediaUrl),
    images_generalInformation: (dto.photos || []).filter(Boolean).map(toFullMediaUrl),
    accommodations: (dto.accommodations || []).filter((a) => a && a.name).map((a) => {
      // Round 59+ — pull in any gallery photo whose caption carries
      // an "[Alojamento: <name>]" tag matching this accommodation.
      // The wizard stores the association as a caption prefix; we
      // re-hydrate it here so the photos surface in the "Estadia"
      // tab without forcing a schema change.
      //
      // Round 61 — The previous version used `idx + 1` under the
      // (incorrect) assumption that `dto.photos[0]` is always the
      // cover. In reality `dto.photos` and `dto.photoCaptions` are
      // PARALLEL ARRAYS aligned by index — the caption for photo N
      // is at `photoCaptions[N]`, no offset. The cover photo's
      // caption is `null`/empty (the wizard doesn't set one) so
      // `parsePhotoCaption` returns `{ association: null }` and the
      // cover is naturally skipped by the filter below.
      const photosFullUrls = (dto.photos || []).filter(Boolean).map(toFullMediaUrl);
      const linkedGalleryImages = photosFullUrls
        .filter((_, idx) => {
          const cap = (dto.photoCaptions || [])[idx];
          const parsed = parsePhotoCaption(cap);
          return parsed.association && parsed.association.type === 'Alojamento' &&
            parsed.association.name.trim() === String(a.name).trim();
        });
      return {
        name: a.name,
        type: a.accommodationType?.type || a.accommodationTypeName || 'Alojamento',
        description: a.description || '',
        rating: a.rating || 0,
        nights: a.nrNights || 0,
        checkInDate: a.checkIn || '',
        checkOutDate: a.checkOut || '',
        regime: a.accommodationBoard?.board || a.accommodationBoardName || '',
        // V16 — destination city for grouping.
        city: a.city || '',
        cityId: a.cityId || null,
        images: [
          ...(a.photos || []).filter(Boolean).map(toFullMediaUrl),
          ...linkedGalleryImages,
        ],
      };
    }),
    foodRecommendations: (dto.recommendedFoods || []).filter((f) => f && f.name).map((f) => {
      // Round 61 — same pattern as accommodations: pull in any
      // gallery photo whose caption carries an
      // "[Alimentação: <name>]" tag matching this food item.
      const linked = (dto.photos || []).filter(Boolean).map(toFullMediaUrl)
        .filter((_, idx) => {
          const cap = (dto.photoCaptions || [])[idx];
          const parsed = parsePhotoCaption(cap);
          return parsed.association && parsed.association.type === 'Alimentação' &&
            parsed.association.name.trim() === String(f.name).trim();
        });
      return {
        name: f.name, description: f.description || '',
        // V16 — destination city for grouping.
        city: f.city || '',
        cityId: f.cityId || null,
        images: [
          ...(f.photos || []).filter(Boolean).map(toFullMediaUrl),
          ...linked,
        ],
      };
    }),
    images_foodRecommendations: (dto.recommendedFoods || []).flatMap(
      (f) => (f.photos || []).filter(Boolean).map(toFullMediaUrl)
    ),
    transportMethods: (dto.transports || []).filter((t) => t && t.name).map((t) => {
      // Round 61 — same pattern: link gallery photos whose
      // caption carries a "[Transporte: <name>]" tag.
      const linked = (dto.photos || []).filter(Boolean).map(toFullMediaUrl)
        .filter((_, idx) => {
          const cap = (dto.photoCaptions || [])[idx];
          const parsed = parsePhotoCaption(cap);
          return parsed.association && parsed.association.type === 'Transporte' &&
            parsed.association.name.trim() === String(t.name).trim();
        });
      return {
        name: t.name, description: t.description || '', cost: t.cost || 0,
        // V16 — destination city for grouping.
        city: t.city || '',
        cityId: t.cityId || null,
        images: [
          ...(t.photos || []).filter(Boolean).map(toFullMediaUrl),
          ...linked,
        ],
      };
    }),
    images_transportMethods: (dto.transports || []).flatMap(
      (t) => (t.photos || []).filter(Boolean).map(toFullMediaUrl)
    ),
    pointsOfInterest: (dto.referencePoints || []).map((p) => {
      // Round 61 — same pattern: link gallery photos whose
      // caption carries a "[Ponto de Interesse: <name>]" tag.
      const linked = (dto.photos || []).filter(Boolean).map(toFullMediaUrl)
        .filter((_, idx) => {
          const cap = (dto.photoCaptions || [])[idx];
          const parsed = parsePhotoCaption(cap);
          return parsed.association && parsed.association.type === 'Ponto de Interesse' &&
            parsed.association.name.trim() === String(p.name).trim();
        });
      return {
        // Round 59+ — Use the actual `type` from the backend
        // (Monumento, Praia, Museu, etc.) instead of a hard-coded
        // "Ponto de Interesse" string. Falls back to the generic
        // label only when the trip was created before Type was
        // captured.
        name: p.name,
        description: p.description || '',
        type: p.type || 'Ponto de Interesse',
        // V16 — destination city for grouping.
        city: p.city || '',
        cityId: p.cityId || null,
        images: [
          ...(p.photos || []).filter(Boolean).map(toFullMediaUrl),
          ...linked,
        ],
      };
    }),
    images_referencePoints: (dto.referencePoints || []).flatMap(
      (p) => (p.photos || []).filter(Boolean).map(toFullMediaUrl)
    ),
    itinerary: (dto.tripItinerary?.itineraryDays || []).map((d) => ({
      day: d.day,
      // V16 — destination city for grouping.
      city: d.cityName || d.city || '',
      cityId: d.cityId || null,
      activities: (d.topics || []).map((t) => t.description || t.name),
    })),
    negativePoints: (dto.negativePoints || []).map((p) => ({
      name: p.name, description: p.description,
      // V16 — destination city for grouping.
      city: p.cityName || p.city || '',
      cityId: p.cityId || null,
    })),
    // Round 50 — Positive points (new in V12, see V12 migration).
    // Same shape as negative points, but rendered in a separate
    // section with a green accent.
    positivePoints: (dto.positivePoints || []).map((p) => ({
      name: p.name, description: p.description,
      // V16 — destination city for grouping.
      city: p.cityName || p.city || '',
      cityId: p.cityId || null,
    })),
    // Round 50 — Photo captions + associations. The backend stores
    // captions as a parallel list to `photos`. We expose them as
    // an array of `{ text, association }` so the gallery can
    // render the association pill (parsed from the `[Tipo: Nome]`
    // convention the wizard writes) below each photo.
    photoCaptions: (dto.photoCaptions || []).map(parsePhotoCaption),
    coordinates: dto.coordinates || dto.locationCoordinates || null,
  }), [user]);

  /* ── Comment transform (flat list with parentId) ───── */
  // The backend returns each top-level comment with its replies
  // nested under `.replies`. We flatten that tree once into a
  // single array so the global `CommentThread` can render every
  // comment in a single flat list (FB / LinkedIn style).
  const transformComment = useCallback((dto) => ({
    id: dto.id,
    userId: dto.user?.id,
    user: dto.user?.username || [dto.user?.firstName, dto.user?.lastName].filter(Boolean).join(' ') || 'Utilizador',
    // Round 87 — propagate the @username so the CommentThread can
    // navigate to /profile/:username when the user clicks the avatar
    // or the name. Before this, the comment had no `username` field
    // and clicking the author was a no-op.
    username: dto.user?.username || null,
    userProfilePicture: dto.user?.profilePhoto || null,
    text: dto.content,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt || null,
    likes: dto.likeCount || 0,
    currentUserLiked: dto.currentUserLiked || false,
  }), []);

  const fetchComments = useCallback(async (page = 0, append = false) => {
    if (append) setLoadingMoreComments(true);
    try {
      const { data } = await request('GET', `/trips/${id}/comments?page=${page}&size=20`);
      const top = (data.content || []).map(transformComment);
      // Flatten the nested replies from the backend.
      const flat = [];
      const walk = (list, parentId = null) => {
        list.forEach((parent) => {
          flat.push({ ...parent, parentId });
          if (Array.isArray(parent.replies) && parent.replies.length) {
            walk(parent.replies, parent.id);
          }
        });
      };
      walk(top);

      // The `commentsTotalCount` counts parents + ALL nested replies
      // (FB/LinkedIn style). `data.totalElements` is top-level only,
      // so we walk the tree to get the real number.
      const countDeep = (list) => list.reduce(
        (acc, c) => acc + 1 + countDeep(c.replies || []),
        0,
      );

      if (append) {
        setComments((prev) => {
          const merged = [...prev, ...flat];
          setCommentsTotalCount(countDeep(top) + (append ? 0 : 0));
          // Recompute from the merged top-level pages we have locally.
          // We keep the max of the server's totalElements and the
          // local count so the number never decreases.
          setCommentsTotalCount((c) => Math.max(c, merged.length));
          return merged;
        });
      } else {
        setComments(flat);
        setCommentsTotalCount(Math.max(data.totalElements || 0, countDeep(top)));
      }
      // Track liked IDs (flat) so the heart icon works.
      const likedIds = flat.filter((c) => c.currentUserLiked).map((c) => c.id);
      setLikedComments((prev) => Array.from(new Set([...prev, ...likedIds])));

      setCommentsTotalPages(data.totalPages || 0);
      setCommentsPage(page);
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
    } finally {
      if (append) setLoadingMoreComments(false);
    }
  }, [id, transformComment]);

  /* ── Fetch trip ─────────────────────────────────────── */
  const loadTrip = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await request('GET', `/trips/${id}`);
      const t = transformTrip(data);
      setTravel(t);
      // Round 67 — Multi-destination trips land on "Sobre" so the
      // user sees the trip overview first, then clicks on the city
      // tabs to drill into each destination. (The previous version
      // jumped directly to a "Roteiro" tab that was removed in
      // Round 67 in favour of per-city tabs.)
      if (Array.isArray(t?.destinations) && t.destinations.length > 1) {
        setActiveTab('overview');
      }
      setIsLiked(data.isLiked || false);
      setLikeCount(data.totalLikes || 0);
      setSaved(!!data.isSaved);
      setLoading(false);
      // Comments in background
      fetchComments(0, false).catch(() => setComments([]));
    } catch (err) {
      console.error('Erro ao carregar viagem:', err);
      // Round 53 — Distinguish 404 (truly missing / hidden) from
      // 403 (private trip / private profile owner — requester has
      // no permission) from generic network errors. The user should
      // see the right reason: "Viagem não encontrada" only when the
      // backend says so. 403 gets a clearer "Esta viagem é privada"
      // message so the user understands it's a privacy block, not a
      // broken link.
      const status = err?.response?.status;
      if (status === 404) {
        setError('Viagem não encontrada');
      } else if (status === 403) {
        setError('Esta viagem é privada ou o perfil do autor é privado. Não tens permissão para a ver.');
      } else {
        setError('Não foi possível carregar os dados desta viagem. Tente novamente mais tarde.');
      }
      setTravel(null);
      setLikeCount(0);
      setLoading(false);
    }
  }, [id, transformTrip, fetchComments]);

  // Keep a stable ref to `loadTrip` so the gm:profile-updated
  // listener (declared above, before `loadTrip` exists) can
  // trigger a refetch without breaking the rules of hooks.
  loadTripRef.current = loadTrip;

  useEffect(() => {
    let mounted = true;
    if (mounted) loadTrip();
    return () => { mounted = false; };
  }, [loadTrip]);

  /* ── Swipe entre viagens (mobile) ─────────────────────────
     FIX (Round 33 — mobile UX): o user pediu swipe horizontal
     no /travel/:id para navegar para a viagem anterior /
     seguinte, à semelhança de apps nativos (Instagram, TikTok).
     Carregamos uma lista leve de IDs do public-feed
     (público e não-hidden) e usamos o índice actual para
     calcular prev/next. Se o swipe cair fora da lista
     (sem prev/next), o gesto é silenciosamente ignorado.

     A lista é carregada uma vez (não refetch em cada swipe) e
     guardada em ref para sobreviver a re-renders. Quando o
     user navega para outra viagem via swipe, a `id` muda
     (via useParams) e o `loadTrip` re-fetch os detalhes, mas
     a lista de IDs mantém-se em cache.

     Só activado no mobile. */
  const siblingIdsRef = React.useRef([]);
  const [siblingsReady, setSiblingsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pedimos uma página grande (50) para ter um
        // neighbourhood razoável. Para viagens com mais de
        // 50 entradas, o swipe fica limitado a esse
        // neighbourhood — acceptable trade-off para evitar
        // carregar a lista completa do backend só para swipe.
        const { data } = await api.get('/trips/public-feed', {
          params: { page: 0, size: 50 },
        });
        if (cancelled) return;
        const ids = Array.isArray(data?.content)
          ? data.content.map((t) => t.id).filter(Boolean)
          : [];
        siblingIdsRef.current = ids;
        setSiblingsReady(true);
      } catch (_) {
        if (!cancelled) setSiblingsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const swipeToSibling = useCallback(
    (direction) => {
      const ids = siblingIdsRef.current;
      if (!ids.length) return;
      const currentId = Number(id);
      const idx = ids.findIndex((x) => Number(x) === currentId);
      if (idx < 0) return;
      const nextIdx = direction === 'left' ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= ids.length) return;
      navigate(`/travel/${ids[nextIdx]}`);
    },
    [id, navigate]
  );

  useSwipeGesture({
    onSwipeLeft: () => swipeToSibling('left'),
    onSwipeRight: () => swipeToSibling('right'),
    // O swipe entre viagens só está activo quando a página
    // está em estado idle (sem loading, sem lightbox aberto).
    // Quando o lightbox está aberto, o user pode swipe entre
    // fotos dentro do lightbox (esse é o gesto natural) e
    // não deve disparar mudança de viagem. O `ignoreSelector`
    // no hook (default: '.leaflet-container, .gm-lightbox,
    // .gm-td__lightbox, [data-swipe-ignore="true"]') já filtra
    // o lightbox, mas verificamos também `lightboxOpen` aqui
    // como segunda camada de defesa.
    enabled:
      isMobile &&
      siblingsReady &&
      !loading &&
      Boolean(travel) &&
      !lightboxOpen,
  });

  /* ════════════════════════════════════════════════════════════
     HANDLERS
     ════════════════════════════════════════════════════════════ */

  const handleLike = useCallback(async () => {
    if (!user) { toast.danger('Inicie sessão para gostar.'); return; }
    if (likePending) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    setLikePending(true);
    try {
      if (wasLiked) await request('DELETE', `/trips/${id}/like`);
      else await request('POST', `/trips/${id}/like`);
    } catch (err) {
      setIsLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      toast.danger('Não foi possível processar o gosto.');
    } finally {
      setLikePending(false);
    }
  }, [user, id, isLiked, likePending, toast]);

  const handleToggleSave = useCallback(async () => {
    if (!user) { toast.danger('Inicie sessão para guardar viagens.'); return; }
    if (savedPending) return;
    const wasSaved = saved;
    const next = !wasSaved;
    setSaved(next);
    setSavedPending(true);
    try {
      if (next) {
        await request('POST', `/trips/${id}/save`);
        toast.success('Viagem guardada.');
      } else {
        await request('DELETE', `/trips/${id}/save`);
        toast.info('Removida dos guardados.');
      }
    } catch (err) {
      // Rollback on failure (e.g. trying to save your own trip).
      setSaved(wasSaved);
      const msg = err?.response?.data?.message || 'Não foi possível guardar a viagem.';
      toast.danger(msg);
    } finally {
      setSavedPending(false);
    }
  }, [user, id, saved, savedPending, toast]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: travel?.name, url }); }
      catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência.');
      } catch {
        toast.info(url);
      }
    }
  }, [travel, toast]);

  const handleReport = useCallback(() => {
    if (!user) { toast.danger('Inicie sessão para denunciar.'); return; }
    if (user?.id === travel?.userId) {
      toast.danger('Não pode denunciar as suas próprias viagens.');
      return;
    }
    setReportOpen(true);
  }, [user, travel, toast]);

  const handleAddComment = useCallback(async (parentIds = [], text) => {
    if (!user) { toast.danger('Inicie sessão para comentar.'); return; }
    const value = text ?? newComment;
    const validation = validateComment(value);
    if (!validation.valid) { toast.danger(validation.message); return; }
    const clean = sanitizeContent(value);
    if (!clean) { toast.danger(COMMENT_LIMITS.MESSAGES.INVALID_CONTENT); return; }
    if (clean !== value) { toast.danger(COMMENT_LIMITS.MESSAGES.DANGEROUS_CONTENT); return; }

    setCommentLoading(true);
    try {
      const payload = { content: clean };
      if (parentIds.length) payload.parentCommentId = parentIds[parentIds.length - 1];
      const { data } = await request('POST', `/trips/${id}/comments`, payload);
      // The backend returns the full parent + nested replies. Flatten
      // them so the local state stays a flat list (matches the
      // global CommentThread data shape).
      const added = [];
      const walk = (list, parentId = null) => {
        list.forEach((c) => {
          const flat = transformComment(c);
          added.push({ ...flat, parentId });
          if (Array.isArray(c.replies) && c.replies.length) walk(c.replies, c.id);
        });
      };
      walk([data]);

      setComments((prev) => [...prev, ...added]);
      setCommentsTotalCount((c) => c + added.length);
      setNewComment('');
      toast.success(COMMENT_LIMITS.MESSAGES.SUCCESS);
    } catch (err) {
      toast.danger(err.response?.data?.message || 'Erro ao adicionar comentário.');
    } finally {
      setCommentLoading(false);
    }
  }, [user, newComment, id, transformComment, toast]);

  const handleCommentLike = useCallback(async (commentId /* no parentIds — flat list */) => {
    if (!user) { toast.danger('Inicie sessão para gostar.'); return; }
    const isAlready = likedComments.includes(commentId);
    const delta = isAlready ? -1 : 1;
    setLikedComments((p) => (isAlready ? p.filter((id) => id !== commentId) : [...p, commentId]));
    setComments((p) => p.map((c) => (
      c.id === commentId
        ? { ...c, likes: c.likes + delta, currentUserLiked: !isAlready }
        : c
    )));
    try {
      if (isAlready) await request('DELETE', `/trips/${id}/comments/${commentId}/like`);
      else await request('POST', `/trips/${id}/comments/${commentId}/like`);
    } catch (err) {
      setLikedComments((p) => (isAlready ? [...p, commentId] : p.filter((id) => id !== commentId)));
      setComments((p) => p.map((c) => (
        c.id === commentId
          ? { ...c, likes: c.likes - delta, currentUserLiked: isAlready }
          : c
      )));
    }
  }, [user, id, likedComments]);

  const handleDeleteComment = useCallback(async (commentId /* flat list — no parentIds */) => {
    if (!window.confirm('Tem a certeza que quer eliminar este comentário?')) return;
    try {
      await request('DELETE', `/trips/${id}/comments/${commentId}`);
      // Global rule: deleting a parent does NOT delete its replies.
      // The replies are re-parented to the top level so the
      // conversation stays coherent. The deleted parent itself is
      // removed; the count drops by exactly 1.
      setComments((prev) => prev
        .filter((c) => c.id !== commentId)
        .map((c) => (c.parentId === commentId ? { ...c, parentId: null } : c))
      );
      setCommentsTotalCount((c) => Math.max(0, c - 1));
      toast.success('Comentário eliminado.');
    } catch (err) {
      toast.danger('Não foi possível eliminar o comentário.');
    }
  }, [id, toast]);

  /* ════════════════════════════════════════════════════════════
     DERIVED DATA
     ════════════════════════════════════════════════════════════ */

  const allMedia = useMemo(() => {
    if (!travel) return [];
    const out = [];
    const photos = travel.images_generalInformation || [];
    if (travel.highlightImage) {
      out.push({ src: travel.highlightImage, type: 'photo', caption: 'Destaque' });
    }
    photos.forEach((src, i) => {
      if (src && src !== travel.highlightImage) {
        const cap = (travel.photoCaptions || [])[i];
        let capText = '';
        if (cap) {
          if (cap.association) {
            capText = `[${cap.association.type}: ${cap.association.name}] ${cap.text || ''}`.trim();
          } else if (cap.text) {
            capText = cap.text;
          }
        }
        out.push({ src, type: 'photo', caption: capText || `Foto ${i + 1}` });
      }
    });
    (travel.travelVideos || []).forEach((src, i) => {
      out.push({ src, type: 'video', caption: `Vídeo ${i + 1}` });
    });
    return out;
  }, [travel]);

  const heroMedia = useMemo(() => {
    if (!travel) return [];
    return allMedia;
  }, [allMedia, travel]);

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <PageContainer size="full" className="gm-td">
        <div className="gm-td__skeleton">
          <div className="gm-td__skel-hero" />
          <div className="gm-td__skel-row">
            <div className="gm-td__skel-line gm-td__skel-line--lg" />
            <div className="gm-td__skel-line gm-td__skel-line--md" />
          </div>
          <div className="gm-td__skel-stats">
            {[0, 1, 2, 3].map((i) => <div key={i} className="gm-td__skel-stat" />)}
          </div>
          <div className="gm-td__skel-line gm-td__skel-line--xl" />
          <div className="gm-td__skel-line gm-td__skel-line--xl" />
        </div>
      </PageContainer>
    );
  }

  if (!travel) {
    return (
      <PageContainer size="md" className="gm-td">
        <div className="gm-td__error">
          <div className="gm-td__error-icon"><AlertCircle size={32} strokeWidth={1.5} /></div>
          <h2>Viagem não encontrada</h2>
          <p>Não foi possível carregar esta viagem. Tente novamente.</p>
          <button type="button" className="gm-td__btn gm-td__btn--primary" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} strokeWidth={1.75} /> Voltar
          </button>
        </div>
      </PageContainer>
    );
  }

  const isOwn = user?.id === travel.userId;
  const dateRange = formatDateRange(travel.startDate, travel.endDate);

  return (
    <div className="gm-td">
      {/* ═══ Sticky top bar ═══ */}
      <header className="gm-td__topbar">
        <div className="gm-td__topbar-inner">
          <button
            type="button"
            className="gm-td__iconbtn"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            title="Voltar"
          >
            <ArrowLeft size={18} strokeWidth={1.75} />
          </button>
          <div className="gm-td__topbar-title">
            <h1 className="gm-td__topbar-h1">{travel.name}</h1>
            {/* V16 — Multi-destination topbar subtitle. Renders
                "Lisboa, Portugal" for single trips and the full
                route for multi ("Lisboa → Porto → Paris"). The
                arrow icon gives a quick visual hint of the order
                without taking up extra space. */}
            {Array.isArray(travel.destinations) && travel.destinations.length > 1 ? (
              <span
                className="gm-td__topbar-sub"
                title={travel.destinations.map((d) => d.cityName || d.city).join(' → ')}
              >
                <MapPin size={11} strokeWidth={1.75} />
                {travel.destinations
                  .map((d) => d.cityName || d.city || '?')
                  .join(' → ')}
              </span>
            ) : travel.city ? (
              <span className="gm-td__topbar-sub">
                <MapPin size={11} strokeWidth={1.75} />
                {travel.city}{travel.country ? `, ${travel.country}` : ''}
              </span>
            ) : null}
          </div>
          {/* FIX (Round 33 — mobile UX): contador discreto "X de Y"
              visível apenas no mobile, ao lado do título, para
              o user saber quantas viagens há no feed e que pode
              swipe para a próxima. Em desktop este contador
              fica escondido (CSS) — o user usa os botões de
              navegação tradicionais. */}
          {isMobile && siblingsReady && siblingIdsRef.current.length > 1 && (
            <span className="gm-td__topbar-counter" aria-hidden="true">
              {(() => {
                const ids = siblingIdsRef.current;
                const idx = ids.findIndex((x) => Number(x) === Number(id));
                return idx >= 0 ? `${idx + 1} de ${ids.length}` : '';
              })()}
            </span>
          )}
          <div className="gm-td__topbar-actions">
            {!isOwn && (
              <button
                type="button"
                className={`gm-td__iconbtn ${saved ? 'gm-td__iconbtn--active' : ''}`}
                onClick={handleToggleSave}
                aria-label={saved ? 'Remover dos guardados' : 'Guardar'}
                title={saved ? 'Remover dos guardados' : 'Guardar'}
                aria-pressed={saved}
              >
                <Bookmark
                  size={18}
                  strokeWidth={1.75}
                  fill={saved ? 'currentColor' : 'none'}
                  color={saved ? 'var(--gm-accent)' : 'currentColor'}
                />
              </button>
            )}
            <button
              type="button"
              className="gm-td__iconbtn"
              onClick={handleShare}
              aria-label="Partilhar"
              title="Partilhar"
            >
              <Share2 size={18} strokeWidth={1.75} />
            </button>
            {!isOwn && user && (
              <button
                type="button"
                className="gm-td__iconbtn"
                onClick={handleReport}
                aria-label="Denunciar"
                title="Denunciar"
              >
                <Flag size={18} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      </header>

      <PageContainer size="full" className="gm-td__container">
        {/* ═══ Hero — cover carousel OR gradient fallback ═══
            Round 66 — when the trip has no media, render a clean
            gradient with the trip name and city instead of a
            broken Globe Memories logo (the old fallback). */}
        {heroMedia.length > 0 ? (
          <div className="gm-td__hero">
            <MediaCarousel
              media={heroMedia}
              aspectRatio="16 / 9"
              onPhotoClick={(src, idx) => { setLightboxIndex(idx); setLightboxOpen(true); }}
            />
            <div className="gm-td__hero-pills">
              {Array.isArray(travel.destinations) && travel.destinations.length > 1 ? (
                <span
                  className="gm-td__pill"
                  title={travel.destinations.map((d) => d.cityName || d.city).join(' → ')}
                >
                  <MapPin size={11} strokeWidth={1.75} />
                  {travel.destinations.length} paragens · {travel.destinations[0]?.cityName || travel.destinations[0]?.city}
                  {travel.destinations.length > 1 ? '…' : ''}
                </span>
              ) : travel.city ? (
                <span className="gm-td__pill">
                  <MapPin size={11} strokeWidth={1.75} />
                  {travel.city}
                </span>
              ) : null}
              {dateRange && (
                <span className="gm-td__pill">
                  <Calendar size={11} strokeWidth={1.75} />
                  {dateRange}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="gm-td__hero">
            <div className="gm-td__hero-fallback">
              <MapPin size={28} strokeWidth={1.6} style={{ opacity: 0.9 }} />
              <div className="gm-td__hero-fallback-title">{travel.name || 'Viagem'}</div>
              <div className="gm-td__hero-fallback-sub">
                {Array.isArray(travel.destinations) && travel.destinations.length > 1
                  ? travel.destinations.map((d) => d.cityName || d.city).join(' · ')
                  : (travel.city || 'Adiciona uma foto de capa para ver aqui')}
              </div>
            </div>
          </div>
        )}

        {/* ═══ V16 — Multi-destination route bar ═══ */}
        {/* Renders ONLY when the trip has > 1 destination. Each
            stop is a button that scrolls to the destination's
            accordion below. Single-destination trips get the
            legacy flat layout (no bar). */}
        {Array.isArray(travel.destinations) && travel.destinations.length > 1 && (
          <Section className="gm-td__route-section" aria-label="Roteiro da viagem">
            <div className="gm-td__route" role="tablist">
              {travel.destinations.map((d, i) => {
                const cityName = d.cityName || d.city || `Destino ${i + 1}`;
                const countryName = d.countryname || d.country || '';
                const isActive = activeDest === (d.cityId || `idx-${i}`);
                return (
                  <button
                    key={d.cityId || i}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`gm-td__route-stop ${isActive ? 'gm-td__route-stop--active' : ''}`}
                    onClick={() => setActiveDest(d.cityId || `idx-${i}`)}
                    title={`${cityName}${countryName ? ', ' + countryName : ''}`}
                  >
                    <span className="gm-td__route-stop-index">{i + 1}</span>
                    <span className="gm-td__route-stop-city">{cityName}</span>
                    {countryName && <span className="gm-td__route-stop-country">{countryName}</span>}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* ═══ Trip header ═══ */}
        <Section className="gm-td__header">
          <h2 className="gm-td__title">{travel.name}</h2>

          <button
            type="button"
            className="gm-td__author"
            onClick={() => navigate(`/profile/${travel.userUsername || travel.user}`)}
          >
            <Avatar src={travel.userProfilePicture} name={travel.user} size="md" />
            <div className="gm-td__author-meta">
              <span className="gm-td__author-name">{travel.user}</span>
              <span className="gm-td__author-label">Ver perfil</span>
            </div>
          </button>

          {travel.categories_full?.length > 0 && (
            <div className="gm-td__chips">
              {travel.categories_full.map((c, i) => (
                <span key={i} className="gm-td__chip">
                  <span aria-hidden="true">{c.icon}</span>
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* ═══ Stats row ═══ */}
        <Section className="gm-td__stats">
          <div className="gm-td__stat-card">
            <div className="gm-td__stat-icon gm-td__stat-icon--rating">
              <Star size={18} strokeWidth={1.75} fill="currentColor" />
            </div>
            <div className="gm-td__stat-meta">
              <span className="gm-td__stat-value">{Number(travel.stars || 0).toFixed(1)}</span>
              <span className="gm-td__stat-label">Avaliação</span>
            </div>
          </div>
          <button
            type="button"
            className={`gm-td__stat-card ${isLiked ? 'gm-td__stat-card--active' : ''}`}
            onClick={handleLike}
            disabled={!user}
          >
            <div className={`gm-td__stat-icon ${isLiked ? 'gm-td__stat-icon--liked' : ''}`}>
              <Heart size={18} strokeWidth={1.75} fill={isLiked ? 'currentColor' : 'none'} />
            </div>
            <div className="gm-td__stat-meta">
              <span className="gm-td__stat-value">{likeCount}</span>
              <span className="gm-td__stat-label">Gostos</span>
            </div>
          </button>
          <button
            type="button"
            className="gm-td__stat-card"
            onClick={scrollToComments}
            aria-label="Ir para os comentários"
          >
            <div className="gm-td__stat-icon">
              <MessageCircle size={18} strokeWidth={1.75} />
            </div>
            <div className="gm-td__stat-meta">
              <span className="gm-td__stat-value">{commentsTotalCount || comments.length}</span>
              <span className="gm-td__stat-label">Comentários</span>
            </div>
          </button>
          {travel.days > 0 && (
            <div className="gm-td__stat-card">
              <div className="gm-td__stat-icon">
                <Calendar size={18} strokeWidth={1.75} />
              </div>
              <div className="gm-td__stat-meta">
                <span className="gm-td__stat-value">{travel.days}</span>
                <span className="gm-td__stat-label">{travel.days === 1 ? 'dia' : 'dias'}</span>
              </div>
            </div>
          )}
        </Section>

        {error && (
          <div className="gm-td__banner">
            <AlertCircle size={14} strokeWidth={1.75} />
            <span>{error}</span>
            <button type="button" onClick={loadTrip} className="gm-td__banner-btn">
              <RefreshCw size={12} strokeWidth={1.75} /> Tentar novamente
            </button>
          </div>
        )}

        {/* ═══ Tabs (sections) ═══
            V16 — In a multi-destination trip, the flat-tab layout
            scrambles items (a card from Porto sits next to a card
            from Paris with no clue which is which). We swap the
            section tabs for a single "Roteiro" tab that renders the
            MultiDestAccordion. Single-destination keeps the tabs
            for backward compatibility. */}
        {Array.isArray(travel.destinations) && travel.destinations.length > 1 ? (
          <Section className="gm-td__tabs">
            <div className="gm-td__tabs-bar" role="tablist">
              {/* Round 67 — Multi-destination tab structure: "Sobre" + one
                  tab per city (in the order the user added them). The
                  user wanted the cities to appear AFTER "Sobre", as
                  their own tabs (not bundled in a single "Roteiro"
                  tab). Each city tab opens a dense layout with the
                  items belonging to that destination. */}
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'overview'}
                className={`gm-td__tab ${activeTab === 'overview' ? 'gm-td__tab--active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Sparkles size={13} strokeWidth={1.75} />
                <span>Sobre</span>
              </button>
              {travel.destinations.map((d, i) => {
                const k = `dest-${i}`;
                const cityName = d.cityName || d.city || `Destino ${i + 1}`;
                const countryName = d.countryname || d.country || '';
                const label = countryName ? `${cityName} · ${countryName}` : cityName;
                return (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === k}
                    className={`gm-td__tab ${activeTab === k ? 'gm-td__tab--active' : ''}`}
                    onClick={() => setActiveTab(k)}
                    title={label}
                  >
                    <MapPin size={13} strokeWidth={1.75} />
                    <span>{label}</span>
                  </button>
                );
              })}
              {/* Round 69 — Removed the "Galeria" tab for multi-dest.
                  The user said it's redundant: every city tab already
                  shows a city-scoped gallery at the bottom, so a
                  catch-all tab is just noise. */}
            </div>
          </Section>
        ) : (
          <Section className="gm-td__tabs">
            <div className="gm-td__tabs-bar" role="tablist">
              {[
                { k: 'overview', label: 'Sobre', icon: Sparkles },
                { k: 'stays', label: 'Alojamento', icon: Compass, show: travel.accommodations?.length > 0 },
                { k: 'food', label: 'Alimentação', icon: Compass, show: travel.foodRecommendations?.length > 0 },
                { k: 'transport', label: 'Transportes', icon: Compass, show: travel.transportMethods?.length > 0 || travel.transports?.length > 0 },
                { k: 'points', label: 'Pontos de Referência', icon: MapPin, show: travel.pointsOfInterest?.length > 0 },
                { k: 'itinerary', label: 'Itinerário', icon: Calendar, show: travel.itinerary?.length > 0 },
                { k: 'positive', label: 'Pontos positivos', icon: Sparkles, show: travel.positivePoints?.length > 0 },
                { k: 'negative', label: 'Pontos negativos', icon: AlertCircle, show: travel.negativePoints?.length > 0 },
              ].filter((t) => t.show !== false).map(({ k, label, icon: Icon }) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === k}
                  className={`gm-td__tab ${activeTab === k ? 'gm-td__tab--active' : ''}`}
                  onClick={() => setActiveTab(k)}
                >
                  <Icon size={13} strokeWidth={1.75} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* ═══ Tab: per-city (Round 67) ═══
            Each destination has its own tab. The body is a dense
            dashboard with: city hero (gradient + flag + name),
            city fact strip, then one block per category with the
            items belonging to that destination, and a final gallery
            of the photos associated with the city (filtered by the
            wizard's [Tipo: Nome] caption tags). */}
        {Array.isArray(travel.destinations) && travel.destinations.length > 1 && travel.destinations.map((d, i) => {
          const k = `dest-${i}`;
          if (activeTab !== k) return null;
          return (
            <CityTabBody
              key={k}
              destination={d}
              index={i}
              travel={travel}
              onPhotoClick={(src, idx) => { setLightboxIndex(idx); setLightboxOpen(true); }}
            />
          );
        })}

        {/* ═══ Tab: gallery (Round 67) ═══
            All-photos gallery for the multi-destination trip. The
            user can scroll the full set without losing the city
            context (the per-city tabs already filter by destination
            when this view is open).
            Round 69 — removed for multi-dest. Each city tab now
            shows a city-scoped gallery at the bottom; the catch-all
            tab was redundant noise. */}

        {/* ═══ Tab: overview ═══ */}
        {activeTab === 'overview' && (
          <Section className="gm-td__section">
            {travel.longDescription && (
              <div className="gm-td__block">
                <SectionHeader
                  icon={FileTextIcon}
                  title="Sobre esta viagem"
                />
                <TextExpandable text={travel.longDescription} clamp={5} />
              </div>
            )}

            {travel.description && travel.description !== travel.longDescription && (
              <div className="gm-td__block">
                <SectionHeader title="Resumo" />
                <p className="gm-td__prose">{travel.description}</p>
              </div>
            )}

            {(travel.climate || travel.languages?.length > 0) && (
              <div className="gm-td__block">
                <SectionHeader title="Informações práticas" />
                <div className="gm-td__pills">
                  {travel.climate && (
                    <span className="gm-td__pill gm-td__pill--lg">
                      <Sparkles size={12} strokeWidth={1.75} /> {travel.climate}
                    </span>
                  )}
                  {travel.languages?.map((l) => (
                    <span key={l} className="gm-td__pill gm-td__pill--lg">
                      <Globe size={12} strokeWidth={1.75} /> {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            {travel.price && (
              <div className="gm-td__block">
                <SectionHeader title="Custos" action={
                  <button
                    type="button"
                    className="gm-td__link"
                    onClick={() => setSheet({
                      open: true, kind: 'price', title: 'Detalhes do preço',
                      body: <PriceSheet travel={travel} />,
                    })}
                  >
                    Ver detalhes
                  </button>
                } />
                <div className="gm-td__price">
                  <span className="gm-td__price-value">{formatPrice(travel.price, travel.currency)}</span>
                  <span className="gm-td__price-label">custo total</span>
                </div>
              </div>
            )}

            {/* Gallery */}
            {travel.images_generalInformation?.length > 0 && (
              <div className="gm-td__block">
                <SectionHeader icon={Camera} title="Galeria" />
                {/* V16 — Gallery filter. When the trip has multiple
                    destinations, surface a row of pill filters so
                    the user can scope the gallery to a specific
                    city. The cover photo is always visible. The
                    "all" option is the default. The filter matches
                    the photo's caption association against the
                    destination (by name) since the wizard stores
                    the association as a `[Tipo: Nome]` tag. */}
                {Array.isArray(travel.destinations) && travel.destinations.length > 1 && (
                  <div className="gm-td__gallery-filter" role="tablist" aria-label="Filtrar fotos por destino">
                    <button
                      type="button"
                      className={`gm-td__gallery-filter-btn ${galleryFilter === 'all' ? 'gm-td__gallery-filter-btn--active' : ''}`}
                      onClick={() => setGalleryFilter('all')}
                    >
                      Todas ({travel.images_generalInformation.length})
                    </button>
                    {travel.destinations.map((d) => {
                      const cityKey = (d.cityName || d.city || '').trim().toLowerCase();
                      const count = travel.images_generalInformation.filter((_, i) => {
                        const cap = (travel.photoCaptions || [])[i];
                        if (!cap) return false;
                        const capLower = String(cap).toLowerCase();
                        return capLower.includes(cityKey);
                      }).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={d.cityId || d.cityName}
                          type="button"
                          className={`gm-td__gallery-filter-btn ${galleryFilter === (d.cityId || d.cityName) ? 'gm-td__gallery-filter-btn--active' : ''}`}
                          onClick={() => setGalleryFilter(d.cityId || d.cityName)}
                        >
                          {d.cityName || d.city} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="gm-td__gallery">
                  {travel.images_generalInformation
                    .map((src, i) => ({ src, i, cap: (travel.photoCaptions || [])[i] }))
                    .filter(({ cap, i }) => {
                      if (galleryFilter === 'all') return true;
                      if (i === 0) return true; // cover always visible
                      const cityKey = (() => {
                        if (typeof galleryFilter === 'string') {
                          // Try to match by cityId first, then by cityName.
                          const d = travel.destinations.find((x) => x.cityId === galleryFilter || x.cityName === galleryFilter || x.city === galleryFilter);
                          if (d) return (d.cityName || d.city || '').trim().toLowerCase();
                        }
                        return '';
                      })();
                      if (!cityKey) return true;
                      if (!cap) return false;
                      return String(cap).toLowerCase().includes(cityKey);
                    })
                    .slice(0, 8)
                    .map(({ src, i, cap }) => (
                      <figure
                        key={i}
                        className="gm-td__gallery-figure"
                      >
                        <button
                          type="button"
                          className="gm-td__gallery-item"
                          onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                          aria-label={`Abrir foto ${i + 1}`}
                        >
                          <img src={src} alt="" loading="lazy" />
                        </button>
                        {cap && (cap.association || cap.text) && (
                          <figcaption className="gm-td__gallery-caption">
                            {cap.association && (
                              <span className="gm-td__gallery-assoc">
                                <MapPin size={11} strokeWidth={2} />
                                <strong>{cap.association.type}:</strong> {cap.association.name}
                              </span>
                            )}
                            {cap.text && <span className="gm-td__gallery-text">{cap.text}</span>}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ═══ Tab: stays (Alojamento) ═══ */}
        {activeTab === 'stays' && travel.accommodations?.length > 0 && (
          <Section className="gm-td__section">
            {travel.accommodations.map((acc, i) => (
              <article key={i} className="gm-td__card">
                <header className="gm-td__card-head">
                  <h3 className="gm-td__card-title">{acc.name}</h3>
                  <span className="gm-td__card-tag">{acc.type}</span>
                </header>
                {acc.description && <p className="gm-td__prose">{acc.description}</p>}
                <div className="gm-td__pills">
                  {acc.regime && <span className="gm-td__pill">🍽️ {acc.regime}</span>}
                  {acc.nights > 0 && <span className="gm-td__pill">🌙 {acc.nights} noites</span>}
                  {acc.checkInDate && (
                    <span className="gm-td__pill">
                      📅 Check-in: {new Date(acc.checkInDate).toLocaleDateString('pt-PT')}
                    </span>
                  )}
                  {acc.checkOutDate && (
                    <span className="gm-td__pill">
                      🏁 Check-out: {new Date(acc.checkOutDate).toLocaleDateString('pt-PT')}
                    </span>
                  )}
                </div>
                {acc.rating > 0 && (
                  <div className="gm-td__rating">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        size={13}
                        strokeWidth={1.75}
                        fill={j < Math.floor(acc.rating) ? 'currentColor' : 'none'}
                        color={j < Math.floor(acc.rating) ? '#FFB400' : 'var(--gm-text-4)'}
                      />
                    ))}
                  </div>
                )}
                {acc.images?.length > 0 && (
                  <div className="gm-td__gallery">
                    {acc.images.map((src, j) => (
                      <button
                        type="button"
                        key={j}
                        className="gm-td__gallery-item"
                        onClick={() => { setLightboxIndex(j); setLightboxOpen(true); }}
                        aria-label="Abrir foto"
                      >
                        <img src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </Section>
        )}

        {/* ═══ Tab: food (Alimentação) ═══ */}
        {activeTab === 'food' && travel.foodRecommendations?.length > 0 && (
          <Section className="gm-td__section">
            {travel.foodRecommendations.map((f, i) => (
              <article key={i} className="gm-td__card">
                <header className="gm-td__card-head">
                  <h3 className="gm-td__card-title">🍽️ {f.name}</h3>
                </header>
                {f.description && <p className="gm-td__prose">{f.description}</p>}
                {f.images?.length > 0 && (
                  <div className="gm-td__gallery">
                    {f.images.map((src, j) => (
                      <button
                        type="button"
                        key={j}
                        className="gm-td__gallery-item"
                        onClick={() => { setLightboxIndex(j); setLightboxOpen(true); }}
                        aria-label="Abrir foto"
                      >
                        <img src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {travel.images_foodRecommendations?.length > 0 && (
              <div className="gm-td__gallery">
                {travel.images_foodRecommendations.map((src, i) => (
                  <button
                    type="button"
                    key={i}
                    className="gm-td__gallery-item"
                    onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                    aria-label="Abrir foto"
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ═══ Tab: transport (Transportes) ═══ */}
        {activeTab === 'transport' && (
          <Section className="gm-td__section">
            {travel.transportMethods?.length > 0 ? (
              travel.transportMethods.map((t, i) => (
                <article key={i} className="gm-td__card">
                  <header className="gm-td__card-head">
                    <h3 className="gm-td__card-title">🚗 {t.name}</h3>
                    {t.cost > 0 && <span className="gm-td__card-tag">{formatPrice(t.cost, travel.currency)}</span>}
                  </header>
                  {t.description && <p className="gm-td__prose">{t.description}</p>}
                  {t.images?.length > 0 && (
                    <div className="gm-td__gallery">
                      {t.images.map((src, j) => (
                        <button
                          type="button"
                          key={j}
                          className="gm-td__gallery-item"
                          onClick={() => { setLightboxIndex(j); setLightboxOpen(true); }}
                          aria-label="Abrir foto"
                        >
                          <img src={src} alt="" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))
            ) : travel.transports?.length > 0 ? (
              <div className="gm-td__chips">
                {travel.transports.map((t) => (
                  <span key={t} className="gm-td__chip">{t}</span>
                ))}
              </div>
            ) : null}
          </Section>
        )}

        {/* ═══ Tab: points (Pontos de Referência) ═══ */}
        {activeTab === 'points' && travel.pointsOfInterest?.length > 0 && (
          <Section className="gm-td__section">
            {travel.pointsOfInterest.map((p, i) => (
              <article key={i} className="gm-td__card">
                <header className="gm-td__card-head">
                  <h3 className="gm-td__card-title">
                    <span className="gm-td__card-title-icon" aria-hidden="true">📍</span>{' '}
                    {p.name}
                    {p.type && (
                      <span className="gm-td__chip gm-td__chip--refpoint">{p.type}</span>
                    )}
                  </h3>
                </header>
                {p.description && <p className="gm-td__prose">{p.description}</p>}
                {p.images?.length > 0 && (
                  <div className="gm-td__gallery">
                    {p.images.map((src, j) => (
                      <button
                        type="button"
                        key={j}
                        className="gm-td__gallery-item"
                        onClick={() => { setLightboxIndex(j); setLightboxOpen(true); }}
                        aria-label="Abrir foto"
                      >
                        <img src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {travel.images_referencePoints?.length > 0 && (
              <div className="gm-td__gallery">
                {travel.images_referencePoints.map((src, i) => (
                  <button
                    type="button"
                    key={i}
                    className="gm-td__gallery-item"
                    onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                    aria-label="Abrir foto"
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ═══ Tab: itinerary ═══ */}
        {activeTab === 'itinerary' && travel.itinerary?.length > 0 && (
          <Section className="gm-td__section">
            <ol className="gm-td__timeline">
              {travel.itinerary.map((day) => (
                <li key={day.day} className="gm-td__timeline-day">
                  <div className="gm-td__timeline-marker">
                    <span className="gm-td__timeline-num">{day.day}</span>
                    <span className="gm-td__timeline-line" />
                  </div>
                  <div className="gm-td__timeline-content">
                    <h4 className="gm-td__timeline-title">Dia {day.day}</h4>
                    {day.activities?.length > 0 ? (
                      <ul className="gm-td__timeline-list">
                        {day.activities.map((a, j) => (
                          <li key={j}>{a}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="gm-td__prose gm-td__prose--muted">Sem atividades registadas.</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* ═══ Tab: negative ═══ */}
        {activeTab === 'negative' && travel.negativePoints?.length > 0 && (
          <Section className="gm-td__section">
            {travel.negativePoints.map((p, i) => (
              <article key={i} className="gm-td__card gm-td__card--warning">
                <header className="gm-td__card-head">
                  <h3 className="gm-td__card-title">⚠️ {p.name}</h3>
                </header>
                {p.description && <p className="gm-td__prose">{p.description}</p>}
              </article>
            ))}
          </Section>
        )}

        {/* ═══ Tab: positive (Round 50) ═══ */}
        {activeTab === 'positive' && travel.positivePoints?.length > 0 && (
          <Section className="gm-td__section">
            {travel.positivePoints.map((p, i) => (
              <article key={i} className="gm-td__card gm-td__card--positive">
                <header className="gm-td__card-head">
                  <h3 className="gm-td__card-title">✨ {p.name}</h3>
                </header>
                {p.description && <p className="gm-td__prose">{p.description}</p>}
              </article>
            ))}
          </Section>
        )}

        {/* ═══ Comments section ═══ — uses the global CommentThread so
            the same UI runs in the Home feed, the QandA forum and here. */}
        <Section ref={commentsSectionRef} className="gm-td__comments">
          <header className="gm-td__comments-head">
            <h3>
              <MessageCircle size={16} strokeWidth={1.75} />
              Comentários
              <span className="gm-td__comments-count">{commentsTotalCount || comments.length}</span>
            </h3>
            <button
              type="button"
              className="gm-td__iconbtn"
              onClick={() => setShowComments((s) => !s)}
              aria-label={showComments ? 'Ocultar comentários' : 'Mostrar comentários'}
            >
              {showComments ? <IconX size={16} strokeWidth={1.75} /> : <MessageCircle size={16} strokeWidth={1.75} />}
            </button>
          </header>

          <CommentThread
            isOpen={showComments}
            onToggle={() => setShowComments((s) => !s)}
            comments={comments}
            currentUserId={user?.id}
            onLike={(c) => handleCommentLike(c.id)}
            onDelete={(c) => handleDeleteComment(c.id)}
            // Round 87 — clicking the comment author (avatar or
            // name) navigates to that user's profile. Without
            // this the avatar/name are clickable buttons but go
            // nowhere (the global <CommentThread> only wires the
            // navigation when the consumer passes a handler).
            onUserClick={handleCommentUserClick}
            composer={{
              author: {
                name: user?.name || user?.username || 'Você',
                src: user?.profilePhoto || user?.profilePicture,
              },
              value: newComment,
              onChange: setNewComment,
              onSubmit: (text) => handleAddComment([], text),
              placeholder: 'Escreva um comentário...',
              disabled: commentLoading,
            }}
          />

          {showComments && commentsPage + 1 < commentsTotalPages && (
            <div className="gm-td__loadmore">
              <button
                type="button"
                className="gm-qa__load-more"
                onClick={() => fetchComments(commentsPage + 1, true)}
                disabled={loadingMoreComments}
              >
                {loadingMoreComments ? (
                  <><Loader2 size={13} className="gm-td__spin" /> A carregar…</>
                ) : 'Carregar mais comentários'}
              </button>
            </div>
          )}
        </Section>
      </PageContainer>

      {/* ═══ Lightbox ═══ */}
      <Lightbox
        open={lightboxOpen}
        media={allMedia}
        startIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      {/* ═══ Generic detail sheet (price etc) ═══ */}
      <Sheet
        open={sheet.open}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        title={sheet.title}
      >
        {sheet.body}
      </Sheet>

      {/* ═══ Report sheet (DS3) ═══ */}
      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        travel={travel}
      />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   INLINE HELPERS
   ════════════════════════════════════════════════════════════ */

function FileTextIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function PriceSheet({ travel }) {
  const items = [
    { icon: '🏨', label: 'Alojamento', value: travel.priceDetails?.hotel },
    { icon: '✈️', label: 'Transporte', value: travel.priceDetails?.flight },
    { icon: '🍽️', label: 'Comida', value: travel.priceDetails?.food },
    { icon: '🎁', label: 'Extras', value: travel.priceDetails?.extras },
  ];
  // V15 — use the trip's actual currency (e.g. BRL) instead of the
  // legacy "€" hardcoded fallback. The helper is defined at the
  // top of the file alongside the other price utilities.
  const cur = travel.currency || 'EUR';
  return (
    <div className="gm-td__sheet-list">
      {items.map((it) => (
        <div key={it.label} className="gm-td__sheet-row">
          <span className="gm-td__sheet-row-icon">{it.icon}</span>
          <span className="gm-td__sheet-row-label">{it.label}</span>
          <span className="gm-td__sheet-row-value">{formatPrice(it.value, cur)}</span>
        </div>
      ))}
      <div className="gm-td__sheet-row gm-td__sheet-row--total">
        <span className="gm-td__sheet-row-icon">💰</span>
        <span className="gm-td__sheet-row-label">Total</span>
        <span className="gm-td__sheet-row-value">{formatPrice(travel.price, cur)}</span>
      </div>
    </div>
  );
}

// =============================================================================
// Round 67 — City tab body.
//
// One tab per city, in the order the user added the destination.
// Renders a dense dashboard: city hero (gradient + flag + name +
// country + a small "stop N of M" counter), a city fact strip
// (items count, days if itinerary has any, languages etc), and
// then one block per category (accommodation, food, transport,
// points, itinerary, positive, negative). Each block has the items
// that match this destination by `cityId` (Round 16) so the user
// sees exactly what happened in that city. A small gallery at the
// end shows the photos whose caption carries the city name (the
// wizard's [Alojamento: Hotel X] / [Alimentação: Sopa Y] / [Ponto:
// Torre Z] tags all surface here, plus the free-text captions that
// mention the city by name).
// =============================================================================
const FLAGS_67 = {
  'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Brazil': '🇧🇷',
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪', 'Netherlands': '🇳🇱',
  'Japan': '🇯🇵', 'China': '🇨🇳', 'Mexico': '🇲🇽', 'Barbados': '🇧🇧', 'Jamaica': '🇯🇲',
  'Argentina': '🇦🇷', 'Morocco': '🇲🇦', 'Turkey': '🇹🇷', 'Greece': '🇬🇷', 'Croatia': '🇭🇷',
  'Indonesia': '🇮🇩', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'India': '🇮🇳', 'Japan': '🇯🇵',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Czech Republic': '🇨🇿',
};

function CityTabBody({ destination, index, travel, onPhotoClick }) {
  const cityId = destination.cityId;
  const cityName = destination.cityName || destination.city || 'Destino';
  const countryName = destination.countryname || destination.country || '';
  const flag = FLAGS_67[countryName] || '';
  const allDestinations = Array.isArray(travel?.destinations) ? travel.destinations : [];
  const stopNumber = index + 1;
  const totalStops = allDestinations.length;

  // Filter helper — items that belong to this destination by
  // cityId. Items without a cityId are excluded (they go to the
  // "Geral" bucket, which we don't render per-city to keep the
  // layout clean).
  const filterByCity = (list) => Array.isArray(list) ? list.filter((it) => it?.cityId === cityId) : [];

  const accommodations = filterByCity(travel?.accommodations);
  const foods = filterByCity(travel?.foodRecommendations);
  const transports = filterByCity(travel?.transportMethods);
  const points = filterByCity(travel?.pointsOfInterest);
  const itinerary = filterByCity(travel?.itinerary);
  const positive = filterByCity(travel?.positivePoints);
  const negative = filterByCity(travel?.negativePoints);

  const totalItems = accommodations.length + foods.length + transports.length
    + points.length + itinerary.length + positive.length + negative.length;

  // Gallery filter — Round 68. Three sources, deduped:
  //   1. Photos attached to items that belong to this city
  //      (acc.images, f.images, t.images, p.images). This is the
  //      PRIMARY source — every photo the user explicitly associated
  //      with an item via the wizard ends up here.
  //   2. Photos from the general gallery whose caption mentions the
  //      city name or country (the wizard's free-text captions).
  //   3. Photos from the general gallery whose caption carries a
  //      [Tipo: Nome] tag matching one of this city's items.
  //   (The cover photo at index 0 is always excluded.)
  const photosAll = Array.isArray(travel?.images_generalInformation) ? travel.images_generalInformation : [];
  const captionsAll = Array.isArray(travel?.photoCaptions) ? travel.photoCaptions : [];

  // (1) Item-attached photos: collect from this city's items, dedupe.
  const itemNamesSet = new Set(
    [
      ...accommodations.map((a) => String(a.name || '').trim()),
      ...foods.map((f) => String(f.name || '').trim()),
      ...transports.map((t) => String(t.name || '').trim()),
      ...points.map((p) => String(p.name || '').trim()),
    ].filter(Boolean),
  );
  const itemPhotos = [];
  const seenItemPhotoSrc = new Set();
  const collectItemImages = (item) => {
    if (!Array.isArray(item?.images)) return;
    for (const src of item.images) {
      if (!src || seenItemPhotoSrc.has(src)) continue;
      seenItemPhotoSrc.add(src);
      itemPhotos.push(src);
    }
  };
  accommodations.forEach(collectItemImages);
  foods.forEach(collectItemImages);
  transports.forEach(collectItemImages);
  points.forEach(collectItemImages);

  // (2 + 3) Gallery photos whose caption matches this city or one
  // of its items. Skips the cover.
  const galleryPhotos = photosAll
    .map((src, i) => ({ src, i, cap: captionsAll[i] }))
    .filter(({ src, i, cap }) => {
      if (i === 0) return false; // skip cover
      if (!src || seenItemPhotoSrc.has(src)) return false; // dedupe
      if (!cap) return false;
      const capLower = String(cap).toLowerCase();
      // Free-text caption mentions the city/country
      if (capLower.includes(String(cityName).toLowerCase())) return true;
      if (countryName && capLower.includes(String(countryName).toLowerCase())) return true;
      // [Tipo: Nome] tag matches an item belonging to this city
      for (const name of itemNamesSet) {
        if (name && capLower.includes(name.toLowerCase())) return true;
      }
      return false;
    })
    .map(({ src }) => src);

  const photosForCity = [...itemPhotos, ...galleryPhotos];

  // Round 70 — Card-style render. Each item is now a full
  // `gm-td__card` (same as the single-destination view) with a
  // header (title + type tag), prose, fact pills, rating, and a
  // 2/3/4-col gallery. This matches the single-destination layout
  // the user showed as the reference, so the multi-destination
  // tabs no longer look like a different app.
  const renderAccommodationCard = (acc) => (
    <article key={acc.id || acc.name} className="gm-td__card">
      <header className="gm-td__card-head">
        <h3 className="gm-td__card-title">{acc.name}</h3>
        {acc.type && <span className="gm-td__card-tag">{acc.type}</span>}
      </header>
      {acc.description && <p className="gm-td__prose">{acc.description}</p>}
      <div className="gm-td__pills">
        {acc.regime && <span className="gm-td__pill">🍽️ {acc.regime}</span>}
        {acc.nights > 0 && <span className="gm-td__pill">🌙 {acc.nights} {acc.nights === 1 ? 'noite' : 'noites'}</span>}
        {acc.checkInDate && (
          <span className="gm-td__pill">📅 Check-in: {new Date(acc.checkInDate).toLocaleDateString('pt-PT')}</span>
        )}
        {acc.checkOutDate && (
          <span className="gm-td__pill">🏁 Check-out: {new Date(acc.checkOutDate).toLocaleDateString('pt-PT')}</span>
        )}
      </div>
      {acc.rating > 0 && (
        <div className="gm-td__rating">
          {[...Array(5)].map((_, j) => (
            <Star
              key={j}
              size={13}
              strokeWidth={1.75}
              fill={j < Math.floor(acc.rating) ? 'currentColor' : 'none'}
              color={j < Math.floor(acc.rating) ? '#FFB400' : 'var(--gm-text-4)'}
            />
          ))}
        </div>
      )}
      {acc.images?.length > 0 && (
        <div className="gm-td__gallery">
          {acc.images.map((src, j) => (
            <button
              key={j}
              type="button"
              className="gm-td__gallery-item"
              onClick={() => onPhotoClick?.(src, j)}
              aria-label="Abrir foto"
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </article>
  );

  const renderFoodCard = (f) => (
    <article key={f.id || f.name} className="gm-td__card">
      <header className="gm-td__card-head">
        <h3 className="gm-td__card-title">🍽️ {f.name}</h3>
      </header>
      {f.description && <p className="gm-td__prose">{f.description}</p>}
      {f.images?.length > 0 && (
        <div className="gm-td__gallery">
          {f.images.map((src, j) => (
            <button
              key={j}
              type="button"
              className="gm-td__gallery-item"
              onClick={() => onPhotoClick?.(src, j)}
              aria-label="Abrir foto"
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </article>
  );

  const renderTransportCard = (t) => (
    <article key={t.id || t.name} className="gm-td__card">
      <header className="gm-td__card-head">
        <h3 className="gm-td__card-title">🚌 {t.name}</h3>
      </header>
      {t.description && <p className="gm-td__prose">{t.description}</p>}
      {t.cost > 0 && (
        <div className="gm-td__pills">
          <span className="gm-td__pill">💰 {formatPrice(t.cost, travel?.currency)}</span>
        </div>
      )}
    </article>
  );

  const renderPointCard = (p) => (
    <article key={p.id || p.name} className="gm-td__card">
      <header className="gm-td__card-head">
        <h3 className="gm-td__card-title">{p.name}</h3>
        {p.type && p.type !== 'Ponto de Interesse' && (
          <span className="gm-td__card-tag">{p.type}</span>
        )}
      </header>
      {p.description && <p className="gm-td__prose">{p.description}</p>}
      {p.images?.length > 0 && (
        <div className="gm-td__gallery">
          {p.images.map((src, j) => (
            <button
              key={j}
              type="button"
              className="gm-td__gallery-item"
              onClick={() => onPhotoClick?.(src, j)}
              aria-label="Abrir foto"
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </article>
  );

  const renderPositiveCard = (p) => (
    <article key={p.id || p.name} className="gm-td__card gm-td__card--positive">
      <header className="gm-td__card-head">
        <h3 className="gm-td__card-title">✨ {p.name}</h3>
      </header>
      {p.description && <p className="gm-td__prose">{p.description}</p>}
    </article>
  );

  const renderNegativeCard = (p) => (
    <article key={p.id || p.name} className="gm-td__card gm-td__card--warning">
      <header className="gm-td__card-head">
        <h3 className="gm-td__card-title">⚠️ {p.name}</h3>
      </header>
      {p.description && <p className="gm-td__prose">{p.description}</p>}
    </article>
  );

  return (
    <Section className="gm-td__city-tab">
      {/* City hero — gradient + flag + name + country + stop counter */}
      <div className="gm-td__city-hero">
        <div className="gm-td__city-hero-overlay">
          <div className="gm-td__city-hero-stop">
            Paragem {stopNumber} de {totalStops}
          </div>
          <div className="gm-td__city-hero-name">
            {flag && <span className="gm-td__city-hero-flag">{flag}</span>}
            {cityName}
          </div>
          {countryName && <div className="gm-td__city-hero-country">{countryName}</div>}
          {totalItems > 0 && (
            <div className="gm-td__city-hero-stat">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'} · {itinerary.length} {itinerary.length === 1 ? 'dia' : 'dias'}
            </div>
          )}
        </div>
      </div>

      {/* Items by category — same `gm-td__card` style as the
          single-destination view (Round 70). One block per
          category, one card per item, photos in a 2/3/4-col
          gallery inside each card. */}
      {accommodations.length > 0 && (
        <div className="gm-td__block">
          <SectionHeader title={`🏨 Alojamento · ${accommodations.length}`} />
          {accommodations.map(renderAccommodationCard)}
        </div>
      )}

      {foods.length > 0 && (
        <div className="gm-td__block">
          <SectionHeader title={`🍽️ Alimentação · ${foods.length}`} />
          {foods.map(renderFoodCard)}
        </div>
      )}

      {transports.length > 0 && (
        <div className="gm-td__block">
          <SectionHeader title={`🚌 Transportes · ${transports.length}`} />
          {transports.map(renderTransportCard)}
        </div>
      )}

      {points.length > 0 && (
        <div className="gm-td__block">
          <SectionHeader title={`📍 Pontos de Referência · ${points.length}`} />
          {points.map(renderPointCard)}
        </div>
      )}

      {itinerary.length > 0 && (
        <div className="gm-td__block">
          <SectionHeader title={`📅 Itinerário · ${itinerary.length} ${itinerary.length === 1 ? 'dia' : 'dias'}`} />
          {itinerary.map((d, i) => (
            <article key={i} className="gm-td__card">
              <header className="gm-td__card-head">
                <h3 className="gm-td__card-title">Dia {d.day}</h3>
              </header>
              {d.activities?.length > 0 ? (
                <ul className="gm-td__city-itinerary">
                  {d.activities.map((a, j) => <li key={j}>{a}</li>)}
                </ul>
              ) : (
                <p className="gm-td__prose" style={{ fontStyle: 'italic' }}>
                  Sem atividades registadas.
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {positive.length > 0 && (
        <div className="gm-td__block">
          <SectionHeader title={`✨ Positivo · ${positive.length}`} />
          {positive.map(renderPositiveCard)}
        </div>
      )}

      {negative.length > 0 && (
        <div className="gm-td__block">
          <SectionHeader title={`⚠️ Negativo · ${negative.length}`} />
          {negative.map(renderNegativeCard)}
        </div>
      )}

      {/* City gallery — Round 70. Full grid of the photos
          associated with this destination (item images + matching
          gallery captions). Renders inside a `gm-td__card` to keep
          the visual rhythm consistent with the per-item cards
          above. */}
      {photosForCity.length > 0 && (
        <div className="gm-td__block">
          <SectionHeader title={`📷 Galeria de ${cityName} · ${photosForCity.length}`} />
          <div className="gm-td__gallery">
            {photosForCity.map((src, j) => (
              <button
                key={j}
                type="button"
                className="gm-td__gallery-item"
                onClick={() => onPhotoClick?.(src, j)}
                aria-label="Abrir foto"
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {totalItems === 0 && photosForCity.length === 0 && (
        <div className="gm-td__dest-empty">
          Sem items associados a esta paragem.
        </div>
      )}
    </Section>
  );
}

// =============================================================================
// V16 — Multi-destination accordion (legacy — kept for the "Geral" bucket
// and as a fallback, but the per-city tabs are the primary view now).
// =============================================================================
// transports, reference points, itinerary days, positive / negative
// points) under the destination they belong to. Each destination is
// a collapsible section with a clear header (city + country + a small
// marker with the stop number). Items without a destination are
// rolled into a "Geral" section at the bottom.
//
// The grouping uses the `cityId` FK added in V16 on each entity
// (Accommodation.cityId, RecommendedFood.cityId, etc.). Items with
// no cityId fall into the "Geral" bucket — this keeps the page
// readable even when the user didn't tag everything.
//
// Open state: only one accordion is open at a time. Clicking the
// header toggles. Initial state: first destination open.
// =============================================================================
function MultiDestAccordion({ travel }) {
  const destinations = Array.isArray(travel?.destinations) ? travel.destinations : [];
  const [openId, setOpenId] = useState(destinations[0]?.cityId || 'idx-0');

  // Group helper. Returns items that match the given cityId
  // (or are unassigned when bucketKey is 'general').
  const filterByCity = (list, cityId, allowNull) => {
    if (!Array.isArray(list)) return [];
    return list.filter((it) => {
      if (it?.cityId == null) return allowNull;
      return it.cityId === cityId;
    });
  };
  const itemsByDest = (cityId) => ({
    accommodations: filterByCity(travel?.accommodations, cityId, false),
    foods: filterByCity(travel?.foodRecommendations, cityId, false),
    transports: filterByCity(travel?.transportMethods || travel?.transports, cityId, false),
    points: filterByCity(travel?.pointsOfInterest, cityId, false),
    itinerary: filterByCity(travel?.itinerary, cityId, false),
    positive: filterByCity(travel?.positivePoints, cityId, false),
    negative: filterByCity(travel?.negativePoints, cityId, false),
  });
  // "Geral" bucket: items with no cityId. Tries to keep things that
  // were explicitly created without a destination (legacy rows that
  // pre-date V16 also fall here since their cityId is null).
  const generalItems = (() => {
    const collect = (list) => Array.isArray(list) ? list.filter((it) => it?.cityId == null) : [];
    return {
      accommodations: collect(travel?.accommodations),
      foods: collect(travel?.foodRecommendations),
      transports: collect(travel?.transportMethods || travel?.transports),
      points: collect(travel?.pointsOfInterest),
      itinerary: collect(travel?.itinerary),
      positive: collect(travel?.positivePoints),
      negative: collect(travel?.negativePoints),
    };
  })();
  const generalCount = Object.values(generalItems).reduce((s, l) => s + l.length, 0);

  // Round 66 — Slim row layout for the multi-destination accordion.
  // We render each item as a horizontal row: small label column on
  // the left (type icon + small tag), rich body column on the right
  // (name, description, fact chips). This is much denser than the
  // per-tab card layout and reads as a coherent story.
  const renderRow = (key, label, typeTag, name, desc, facts, extra) => (
    <div key={key} className="gm-td__dest-row">
      <div className="gm-td__dest-row-label">
        {label}
        {typeTag && <span className="gm-td__dest-row-type">{typeTag}</span>}
      </div>
      <div className="gm-td__dest-row-body">
        {name && <p className="gm-td__dest-row-name">{name}</p>}
        {desc && <p className="gm-td__dest-row-desc">{desc}</p>}
        {facts && facts.length > 0 && (
          <div className="gm-td__dest-row-facts">{facts}</div>
        )}
        {extra}
      </div>
    </div>
  );
  const renderBlock = (title, list, renderItem) => {
    if (!list || list.length === 0) return null;
    return (
      <div className="gm-td__dest-block">
        <h4 className="gm-td__dest-block-title">{title} · {list.length}</h4>
        <div className="gm-td__dest-list">
          {list.map((it, i) => renderItem(it, i))}
        </div>
      </div>
    );
  };
  const renderAccommodation = (acc, i) => renderRow(
    `acc-${i}`,
    'Alojamento',
    acc.type,
    `🏨 ${acc.name}`,
    acc.description,
    [
      acc.regime && <span key="r" className="gm-td__dest-row-fact">🍽️ {acc.regime}</span>,
      acc.nights > 0 && <span key="n" className="gm-td__dest-row-fact">🌙 {acc.nights} {acc.nights === 1 ? 'noite' : 'noites'}</span>,
      acc.checkInDate && <span key="i" className="gm-td__dest-row-fact">📅 {new Date(acc.checkInDate).toLocaleDateString('pt-PT')}</span>,
      acc.checkOutDate && <span key="o" className="gm-td__dest-row-fact">🏁 {new Date(acc.checkOutDate).toLocaleDateString('pt-PT')}</span>,
    ].filter(Boolean),
  );
  const renderFood = (f, i) => renderRow(
    `food-${i}`,
    'Alimentação',
    null,
    `🍽️ ${f.name}`,
    f.description,
    null,
  );
  const renderTransport = (t, i) => renderRow(
    `trans-${i}`,
    'Transporte',
    null,
    `🚌 ${t.name}`,
    t.description,
    t.cost > 0 ? [
      <span key="c" className="gm-td__dest-row-fact">💰 {formatPrice(t.cost, travel?.currency)}</span>
    ] : null,
  );
  const renderPoint = (p, i) => renderRow(
    `p-${i}`,
    'Ponto',
    p.type && p.type !== 'Ponto de Interesse' ? p.type : null,
    p.name,
    p.description,
    null,
  );
  const renderItinerary = (d, i) => renderRow(
    `it-${i}`,
    'Itinerário',
    null,
    `Dia ${d.day}`,
    d.activities?.length > 0 ? d.activities.join(' · ') : null,
    null,
  );
  const renderPointSimple = (p, i) => renderRow(
    `simple-${i}`,
    p.kind === 'pos' ? 'Positivo' : 'Negativo',
    null,
    p.name,
    p.description,
    null,
  );

  const stopIndex = (cityId) => {
    if (!destinations.length) return 1;
    const i = destinations.findIndex((d) => (d.cityId || `idx-${destinations.indexOf(d)}`) === cityId);
    return i >= 0 ? i + 1 : 1;
  };
  const destLabel = (d) => {
    const cn = d.countryname || d.country || '';
    const city = d.cityName || d.city || '';
    return cn ? `${city}, ${cn}` : city;
  };
  const destSub = (d, items) => {
    const count = items.accommodations.length + items.foods.length + items.transports.length
      + items.points.length + items.itinerary.length + items.positive.length + items.negative.length;
    return count > 0 ? `${count} ${count === 1 ? 'item' : 'itens'}` : 'Sem items';
  };

  return (
    <div className="gm-td__dest-accordion">
      {destinations.map((d, idx) => {
        const id = d.cityId || `idx-${idx}`;
        const items = itemsByDest(d.cityId);
        const totalCount = items.accommodations.length + items.foods.length + items.transports.length
          + items.points.length + items.itinerary.length + items.positive.length + items.negative.length;
        if (totalCount === 0) return null;
        const isOpen = openId === id;
        return (
          <div key={id} className="gm-td__dest">
            <button
              type="button"
              className="gm-td__dest-head"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : id)}
            >
              <span className="gm-td__dest-head-marker">{stopIndex(id)}</span>
              <div className="gm-td__dest-head-text">
                <div className="gm-td__dest-head-city">{destLabel(d)}</div>
                <div className="gm-td__dest-head-sub">{destSub(d, items)}</div>
              </div>
              <ChevronDown size={18} className="gm-td__dest-head-chev" />
            </button>
            {isOpen && (
              <div className="gm-td__dest-body">
                {renderBlock('🏨 Alojamento', items.accommodations, renderAccommodation)}
                {renderBlock('🍽️ Alimentação', items.foods, renderFood)}
                {renderBlock('🚌 Transportes', items.transports, renderTransport)}
                {renderBlock('📍 Pontos de Referência', items.points, renderPoint)}
                {renderBlock('📅 Itinerário', items.itinerary, renderItinerary)}
                {renderBlock('✨ Positivo', items.positive.map((p) => ({ ...p, kind: 'pos' })), renderPointSimple)}
                {renderBlock('⚠️ Negativo', items.negative.map((p) => ({ ...p, kind: 'neg' })), renderPointSimple)}
              </div>
            )}
          </div>
        );
      })}
      {/* "Geral" bucket for items without a destination. */}
      {generalCount > 0 && (
        <div className="gm-td__dest">
          <button
            type="button"
            className="gm-td__dest-head"
            aria-expanded={openId === 'general'}
            onClick={() => setOpenId(openId === 'general' ? null : 'general')}
          >
            <span className="gm-td__dest-head-marker">★</span>
            <div className="gm-td__dest-head-text">
              <div className="gm-td__dest-head-city">Geral</div>
              <div className="gm-td__dest-head-sub">{generalCount} {generalCount === 1 ? 'item sem destino' : 'itens sem destino'}</div>
            </div>
            <ChevronDown size={18} className="gm-td__dest-head-chev" />
          </button>
          {openId === 'general' && (
            <div className="gm-td__dest-body">
              {renderBlock('🏨 Alojamento', generalItems.accommodations, renderAccommodation)}
              {renderBlock('🍽️ Alimentação', generalItems.foods, renderFood)}
              {renderBlock('🚌 Transportes', generalItems.transports, renderTransport)}
              {renderBlock('📍 Pontos de Referência', generalItems.points, renderPoint)}
              {renderBlock('✨ Positivo', generalItems.positive.map((p) => ({ ...p, kind: 'pos' })), renderPointSimple)}
              {renderBlock('⚠️ Negativo', generalItems.negative.map((p) => ({ ...p, kind: 'neg' })), renderPointSimple)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TravelDetails;
