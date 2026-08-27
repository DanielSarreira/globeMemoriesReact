import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../axios_helper';
import { useToast, Post, Lightbox, ReportSheet } from '../../components/ui';
import { toFullMediaUrl } from '../../axios_helper';
import { COMMENT_LIMITS, validateComment } from '../../config/commentConfig';
import { getDisplayName } from '../../utils/userDisplay';
import useProfileUpdates from '../../hooks/useProfileUpdates';
// The local TravelsData mock fixture is no longer imported — the
// user wants the feed to render only real trips from the
// backend. If the request fails, the page shows an empty state
// instead of falling back to fake data.
import './home.css';

const TRAVELS_PER_PAGE = 12;

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

function sanitizeContent(s = '') {
  let out = String(s);
  for (const p of DANGEROUS_PATTERNS) out = out.replace(p, '');
  return out;
}

function parseBackendDate(d) {
  if (!d) return null;
  if (Array.isArray(d)) {
    return new Date(d[0], d[1] - 1, d[2], d[3] || 0, d[4] || 0, d[5] || 0).toISOString();
  }
  return d;
}

function mapTripToFeedItem(trip) {
  // The backend now exposes the full ordered photo list as
  // `trip.photos`. The first entry is the highlight / cover photo
  // (mirrors `tripPhoto` for legacy clients). We resolve each
  // path through `toFullMediaUrl` so the browser fetches the file
  // from the backend (port 8080) and not the dev server (port 3000).
  const photoList = Array.isArray(trip.photos) && trip.photos.length
    ? trip.photos.map((p) => toFullMediaUrl(p) || p)
    : (trip.tripPhoto ? [toFullMediaUrl(trip.tripPhoto) || trip.tripPhoto] : []);
  // Round 49 — feed parity with /travels: derive the same
  // `citiesCount` + `isMultiDest` flags so the Post component
  // can render "Multidestino" / "Destino Único" the same way.
  const citiesArr = Array.isArray(trip.citiesVisited) ? trip.citiesVisited : [];
  const citiesCount = citiesArr.length;
  const isMultiDest = citiesCount > 1;

  return {
    id: trip.tripId,
    name: trip.tripTitle || 'Viagem sem título',
    description: trip.tripSummary || '',
    // V16 — multi-destination rendering: pass the full cities/visited
    // lists down so the Post can render "Lisboa · Porto · Paris" or
    // "Lisboa 🇵🇹 + Paris 🇫🇷" instead of just the first city.
    cities: citiesArr,
    countries: Array.isArray(trip.countriesVisited) ? trip.countriesVisited : [],
    city: citiesArr[0] || '',
    country: trip.countriesVisited?.[0] || '',
    citiesCount,
    isMultiDest,
    // `user` is the live display name (First Last). `userUsername`
    // is the raw @username used for /profile links — kept
    // separate so a profile rename doesn't break the URL.
    user: getDisplayName({
      userFirstName: trip.userFirstName,
      userLastName: trip.userLastName,
      username: trip.username,
    }, `Viajante ${trip.userId}`),
    userUsername: trip.username || '',
    userId: trip.userId,
    userProfilePicture: trip.userProfilePhoto || null,
    highlightImage: photoList[0] || null,
    price: trip.totalCosts || 0,
    likes: trip.totalLikes || 0,
    stars: trip.tripRating || 0,
    startDate: trip.startDate,
    endDate: trip.endDate,
    category: (trip.categories || []).map((c) => c.categoryName || c.name || ''),
    totalCommentsCount: trip.totalComments || 0,
    travelVideos: trip.travelVideos || [],
    isSaved: !!trip.isSaved,
    // The MediaCarousel walks the fields below in order. We put the
    // full ordered photo list in `images_generalInformation` so the
    // cover photo + the rest of the gallery both render correctly.
    images_generalInformation: photoList,
    images_foodRecommendations: [],
    images_transportMethods: [],
    images_accommodations: [],
    images_referencePoints: [],
  };
}

const Home = () => {
  const { user: authUser } = useAuth();
  const toast = useToast();

  // Re-read the user record from localStorage on mount + listen
  // for the `gm:profile-updated` event so the composer avatar in
  // every Post always reflects the photo the user has right now.
  const [user, setUserState] = useState(() => {
    if (typeof window === 'undefined') return authUser;
    try {
      const stored = window.localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) { /* no-op */ }
    return authUser;
  });
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
  }, [authUser]);

  // Round 47 — When a user updates their profile, refetch the
  // home feed so the new firstName / lastName shows up on every
  // Post without a hard refresh.
  useProfileUpdates({
    onUpdate: () => fetchFeed(0, true),
  });

  // Feed state
  const [feedTravels, setFeedTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalReached, setTotalReached] = useState(false);
  // 'following' means we are showing posts from people the user
  // follows; 'public' means we fell back to the public feed
  // because the user has no follows (or the following feed was
  // empty for this page). The state mirrors `feedModeRef` so the
  // UI can show a soft banner explaining what's going on.
  const [feedMode, setFeedMode] = useState('following');
  // The number of people the current user is following. Used to
  // decide whether the "you're seeing public posts because you
  // don't follow anyone yet" banner is worth showing.
  const [followingCount, setFollowingCount] = useState(null);

  // Per-post state
  const [likedTravels, setLikedTravels] = useState({});
  const [savedTravels, setSavedTravels] = useState({});
  const [comments, setComments] = useState({});
  const [commentsState, setCommentsState] = useState({});
  const [likedComments, setLikedComments] = useState([]);
  const [expanded, setExpanded] = useState({}); // travelId -> bool

  // Lightbox
  const [lightbox, setLightbox] = useState({ open: false, media: [], index: 0 });
  // Report
  const [reportFor, setReportFor] = useState(null);

  // Infinite scroll
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  // ── Fetch feed ─────────────────────────────────────────
  // The Home feed shows ONLY public trips from users that the
  // logged-in user follows. Private trips are never returned by
  // the backend endpoint (`/trips/following-feed`), so we don't
  // need any client-side filter. The dedicated /travels page
  // is the place for the global public catalog.
  const fetchFeed = useCallback(async (page = 0, replace = true) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      if (replace) setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', TRAVELS_PER_PAGE);
      params.append('sort', 'startDate,desc');

      const response = await request('GET', `/trips/following-feed?${params.toString()}`);
      const data = response?.data;

      if (!data) throw new Error('Empty response');
      setFeedMode('following');

      const mapped = (data.content || []).map(mapTripToFeedItem);
      setFeedTravels((prev) => (replace ? mapped : [...prev, ...mapped]));

      const newHasMore = page + 1 < (data.totalPages || 0);
      setHasMore(newHasMore);
      setTotalReached(!newHasMore && replace);
      setCurrentPage(page);
      setError(null);

      const likedInit = (data.content || []).reduce((acc, t) => {
        acc[t.tripId] = t.isLiked || false;
        return acc;
      }, {});
      setLikedTravels((prev) => ({ ...prev, ...likedInit }));
      const savedInit = (data.content || []).reduce((acc, t) => {
        acc[t.tripId] = t.isSaved || false;
        return acc;
      }, {});
      setSavedTravels((prev) => ({ ...prev, ...savedInit }));
    } catch (err) {
      console.error('Error fetching feed:', err);
      const msg = err.response?.data?.message || 'Erro ao carregar o feed.';
      setError(msg);
      // No mock fallback — the user has explicitly asked that the
      // app only render real trips from the backend. If the feed
      // is empty we show the empty state instead of fake data.
      if (replace) {
        setFeedTravels([]);
        setHasMore(false);
        setTotalReached(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFeed(0, true);
  }, [fetchFeed, user?.id]);

  // Best-effort: how many people the current user follows. We
  // use this to decide whether to show a soft "you don't follow
  // anyone yet" banner above the feed. The request is allowed
  // to fail silently — we just don't show the banner.
  useEffect(() => {
    if (!user?.id) {
      setFollowingCount(0);
      return undefined;
    }
    let cancelled = false;
    // Round 59+ — backend requires `userId` query param. Passing
    // `null` as the body and the options object as the 4th arg so
    // axios encodes the params as `?userId=...` instead of sending
    // them as a request body (which the GET endpoint rejects with
    // 400 Bad Request).
    request('GET', '/users/nr-follows', null, { params: { userId: user.id } })
      .then(({ data }) => {
        if (cancelled) return;
        setFollowingCount(Number(data) || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setFollowingCount(0);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  // External refresh event (preserved)
  useEffect(() => {
    const handler = () => fetchFeed(0, true);
    window.addEventListener('refreshHomeTravels', handler);
    return () => window.removeEventListener('refreshHomeTravels', handler);
  }, [fetchFeed]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loadingRef.current && !error) {
            fetchFeed(currentPage + 1, false);
          }
        });
      },
      { rootMargin: '400px' },
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [fetchFeed, hasMore, currentPage, error]);

  // ── Like (preserved) ──────────────────────────────────
  const handleLike = async (travelId) => {
    if (!user) { toast.danger('Inicie sessão para dar gosto.'); return; }
    const wasLiked = !!likedTravels[travelId];
    setLikedTravels((p) => ({ ...p, [travelId]: !wasLiked }));
    setFeedTravels((p) => p.map((t) => (
      t.id === travelId ? { ...t, likes: (t.likes || 0) + (wasLiked ? -1 : 1) } : t
    )));
    try {
      if (wasLiked) await request('DELETE', `/trips/${travelId}/like`);
      else await request('POST', `/trips/${travelId}/like`);
    } catch {
      setLikedTravels((p) => ({ ...p, [travelId]: wasLiked }));
      setFeedTravels((p) => p.map((t) => (
        t.id === travelId ? { ...t, likes: (t.likes || 0) + (wasLiked ? 1 : -1) } : t
      )));
      toast.danger('Não foi possível atualizar o gosto.');
    }
  };

  const handleShare = (travelId) => {
    const url = `${window.location.origin}/travel/${travelId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => toast.success('Link copiado.'),
        () => toast.info(url),
      );
    } else {
      toast.info(url);
    }
  };

  // ── Save / Unsave trip ─────────────────────────────────
  const handleToggleSave = async (travelId, nextSaved) => {
    if (!user) { toast.danger('Inicie sessão para guardar viagens.'); return; }
    const wasSaved = !!savedTravels[travelId];
    if (nextSaved === wasSaved) return;
    // Optimistic update
    setSavedTravels((p) => ({ ...p, [travelId]: nextSaved }));
    try {
      if (nextSaved) {
        await request('POST', `/trips/${travelId}/save`);
        toast.success('Viagem guardada.');
      } else {
        await request('DELETE', `/trips/${travelId}/save`);
        toast.info('Removida dos guardados.');
      }
    } catch {
      // Rollback
      setSavedTravels((p) => ({ ...p, [travelId]: wasSaved }));
      toast.danger('Não foi possível guardar a viagem.');
    }
  };

  // ── Comments ───────────────────────────────────────────
  // The global CommentThread renders a flat list with `parentId`,
  // so the local state always stores a flat list — we flatten
  // the tree returned by the backend as soon as it lands.
  const fetchTripComments = async (travelId, page = 0, append = false) => {
    setCommentsState((p) => ({ ...p, [travelId]: { ...(p[travelId] || {}), loading: true } }));
    try {
      const resp = await request('GET', `/trips/${travelId}/comments?page=${page}&size=20`);
      const data = resp.data;
      // Flatten the nested reply tree into [{id, parentId?, ...}]
      const flat = [];
      const walk = (list, parentId = null) => {
        (list || []).forEach((dto) => {
          flat.push({
            id: dto.id,
            parentId,
            // The backend nests the author under `user.{id, username,
            // firstName, lastName, profilePhoto}`; we flatten those
            // fields onto the row so the global CommentThread can
            // compute ownership and render the delete button when
            // the row is yours.
            userId: dto.user?.id,
            // Round 87 — keep the raw @username so the global
            // <CommentThread> can navigate to /profile/:username
            // when the user clicks the avatar or the name.
            username: dto.user?.username || null,
            user: getDisplayName({
              firstName: dto.user?.firstName,
              lastName: dto.user?.lastName,
              username: dto.user?.username,
            }, 'Viajante'),
            userProfilePicture: dto.user?.profilePhoto || null,
            text: dto.content,
            createdAt: parseBackendDate(dto.createdAt),
            likes: dto.likeCount || 0,
            currentUserLiked: dto.currentUserLiked || false,
          });
          if (Array.isArray(dto.replies) && dto.replies.length) walk(dto.replies, dto.id);
        });
      };
      walk(data.content || []);

      // Track liked IDs for the per-comment heart.
      const newLiked = flat.filter((c) => c.currentUserLiked).map((c) => c.id);

      setComments((p) => ({ ...p, [travelId]: append ? [...(p[travelId] || []), ...flat] : flat }));
      setLikedComments((p) => [...new Set([...p, ...newLiked])]);
      setCommentsState((p) => ({ ...p, [travelId]: { loading: false, loaded: true, page, totalPages: data.totalPages || 0 } }));
    } catch {
      setCommentsState((p) => ({ ...p, [travelId]: { ...(p[travelId] || {}), loading: false, loaded: true } }));
    }
  };

  const addComment = async (travelId, parentIds, text) => {
    if (!user) { toast.danger('Inicie sessão para comentar.'); return; }
    const validation = validateComment(text);
    if (!validation.valid) { toast.danger(validation.message); return; }
    const sanitized = sanitizeContent(text);
    if (!sanitized) { toast.danger(COMMENT_LIMITS.MESSAGES.INVALID_CONTENT); return; }
    if (sanitized !== text) { toast.danger(COMMENT_LIMITS.MESSAGES.DANGEROUS_CONTENT); return; }
    try {
      const payload = { content: sanitized };
      if (parentIds.length) payload.parentCommentId = parentIds[parentIds.length - 1];
      const resp = await request('POST', `/trips/${travelId}/comments`, payload);
      const dto = resp.data;
      // Flatten the response (it may include nested replies) into a
      // single flat array using the same `parentId` shape. The
      // backend nests the author under `user.{id, username,
      // profilePhoto}`; we flatten those fields onto each row so
      // the global CommentThread can compute ownership and show
      // the delete button on comments that are yours.
      const newFlat = [];
      const walk = (list, parentId = null) => {
        (list || []).forEach((c) => {
          newFlat.push({
            id: c.id,
            parentId,
            userId: c.user?.id,
            user: getDisplayName({
              firstName: c.user?.firstName,
              lastName: c.user?.lastName,
              username: c.user?.username,
            }, getDisplayName(user, 'Você')),
            userProfilePicture: c.user?.profilePhoto || user?.profilePicture || null,
            text: c.content,
            createdAt: parseBackendDate(c.createdAt),
            likes: c.likeCount || 0,
            currentUserLiked: c.currentUserLiked || false,
          });
          if (Array.isArray(c.replies) && c.replies.length) walk(c.replies, c.id);
        });
      };
      // The backend returns the full thread (parent + nested replies).
      // We walk it to extract EVERY new comment so the local state
      // stays consistent.
      walk([dto]);

      setComments((p) => ({ ...p, [travelId]: [...(p[travelId] || []), ...newFlat] }));
      setFeedTravels((p) => p.map((t) => (
        t.id === travelId ? { ...t, totalCommentsCount: (t.totalCommentsCount || 0) + newFlat.length } : t
      )));
      toast.success('Comentário publicado.');
    } catch {
      toast.danger('Não foi possível publicar o comentário.');
    }
  };

  const likeComment = async (travelId, commentId /* parentIds unused */) => {
    if (!user) return;
    const isLiked = likedComments.includes(commentId);

    setLikedComments((p) => (isLiked ? p.filter((id) => id !== commentId) : [...p, commentId]));
    setComments((p) => ({
      ...p,
      [travelId]: (p[travelId] || []).map((c) => (
        c.id === commentId
          ? { ...c, likes: (c.likes || 0) + (isLiked ? -1 : 1), currentUserLiked: !isLiked }
          : c
      )),
    }));
    try {
      if (isLiked) await request('DELETE', `/trips/${travelId}/comments/${commentId}/like`);
      else await request('POST', `/trips/${travelId}/comments/${commentId}/like`);
    } catch {
      setLikedComments((p) => (isLiked ? [...p, commentId] : p.filter((id) => id !== commentId)));
      setComments((p) => ({
        ...p,
        [travelId]: (p[travelId] || []).map((c) => (
          c.id === commentId
            ? { ...c, likes: (c.likes || 0) + (isLiked ? 1 : -1), currentUserLiked: isLiked }
            : c
        )),
      }));
      toast.danger('Não foi possível atualizar o gosto.');
    }
  };

  const deleteComment = async (travelId, commentId) => {
    if (!user) return;
    if (!window.confirm('Eliminar este comentário?')) return;
    try {
      await request('DELETE', `/trips/${travelId}/comments/${commentId}`);
      // Frontend rule: when a parent is deleted, its replies are
      // preserved (they just become top-level). This matches the
      // Facebook/LinkedIn behavior the user asked for.
      setComments((p) => {
        const list = p[travelId] || [];
        const target = list.find((c) => c.id === commentId);
        if (!target) return p;
        // Re-parent the deleted comment's children to the top level.
        const reparented = list
          .filter((c) => c.id !== commentId)
          .map((c) => (c.parentId === commentId ? { ...c, parentId: null } : c));
        // Keep the deleted comment's count slot but bump the count
        // down by 1 (the deleted comment itself).
        return { ...p, [travelId]: reparented };
      });
      setFeedTravels((p) => p.map((t) => (
        t.id === travelId ? { ...t, totalCommentsCount: Math.max(0, (t.totalCommentsCount || 1) - 1) } : t
      )));
      toast.success('Comentário eliminado.');
    } catch (err) {
      toast.danger('Não foi possível eliminar o comentário.');
    }
  };

  const openComments = (travel) => {
    setExpanded((e) => {
      const next = !e[travel.id];
      if (next) {
        const state = commentsState?.[travel.id];
        if (!state?.loaded && !state?.loading) {
          fetchTripComments(travel.id, 0, false);
        }
      }
      return { ...e, [travel.id]: next };
    });
  };

  const onPhotoClick = (media, index) => {
    setLightbox({ open: true, media, index });
  };

  return (
    <div className="gm-home">
      <div className="gm-home__feed">
        {loading ? (
          <div className="gm-home__skeleton-stack">
            {[0, 1].map((i) => (
              <div key={i} className="gm-home__skeleton-post">
                <div className="gm-home__skeleton-head">
                  <div className="gm-home__skeleton-line" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="gm-home__skeleton-line" style={{ width: '40%', marginBottom: 8 }} />
                    <div className="gm-home__skeleton-line" style={{ width: '25%', height: 10 }} />
                  </div>
                </div>
                <div className="gm-home__skeleton-photo" />
                <div className="gm-home__skeleton-line" style={{ width: '90%' }} />
                <div className="gm-home__skeleton-line" style={{ width: '60%' }} />
              </div>
            ))}
          </div>
        ) : feedTravels.length === 0 ? (
          <div className="gm-home__empty">
            <div className="gm-home__empty-icon">
              <Compass size={32} strokeWidth={1.5} />
            </div>
            <h2>Ainda sem viagens por aqui</h2>
            <p>
              {user
                ? 'Segue mais viajantes ou partilha a tua primeira memória para começar.'
                : 'Inicia sessão para ver um feed personalizado com viagens da tua rede.'}
            </p>
          </div>
        ) : (
          <>
            {/*
              Home feed only shows public trips from the people the
              user follows. There is no public-timeline fallback here:
              the dedicated /travels page is the place to discover
              the global catalog.
            */}
            {feedTravels.map((travel) => {
              const isOpen = !!expanded[travel.id];
              return (
                <Post
                  key={travel.id}
                  travel={travel}
                  isLiked={!!likedTravels[travel.id]}
                  isSaved={!!savedTravels[travel.id]}
                  showAllComments={isOpen}
                  likedComments={likedComments}
                  comments={comments[travel.id] || []}
                  user={user}
                  currentUserId={user?.id}
                  onLike={handleLike}
                  onShare={handleShare}
                  onLoadComments={fetchTripComments}
                  onAddComment={addComment}
                  onLikeComment={likeComment}
                  onDeleteComment={deleteComment}
                  onOpenComments={openComments}
                  onReport={setReportFor}
                  onPhotoClick={onPhotoClick}
                  onToggleSave={handleToggleSave}
                />
              );
            })}

            {/* Sentinel for infinite scroll */}
            {hasMore && !error && (
              <div ref={sentinelRef} className="gm-home__sentinel">
                <span className="gm-home__sentinel-dot" />
                A carregar mais memórias…
              </div>
            )}

            {error && !feedTravels.length && (
              <div className="gm-home__sentinel gm-home__sentinel-error">
                <p style={{ margin: 0 }}>{error}</p>
                <button
                  type="button"
                  className="gm-home__sentinel-retry"
                  onClick={() => fetchFeed(0, true)}
                  style={{ marginTop: 12 }}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {totalReached && feedTravels.length > 0 && (
              <div className="gm-home__sentinel gm-home__sentinel--end">
                <span className="gm-home__sentinel-line" />
                <span>Estás em dia.</span>
                <span className="gm-home__sentinel-line" />
              </div>
            )}
          </>
        )}
      </div>

      <Lightbox
        open={lightbox.open}
        media={lightbox.media}
        startIndex={lightbox.index}
        onClose={() => setLightbox({ open: false, media: [], index: 0 })}
      />

      <ReportSheet
        open={!!reportFor}
        onClose={() => setReportFor(null)}
        travel={reportFor || {}}
      />
    </div>
  );
};

export default Home;
