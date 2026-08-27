import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Heart, MessageCircle, Share2, MoreHorizontal, Flag, Star, MapPin, Bookmark,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import TextExpandable from './TextExpandable';
import MediaCarousel from './MediaCarousel';
import CommentThread, { flattenCommentTree } from './CommentThread';
import { getDisplayName } from '../../utils/userDisplay';
import './post.css';

const DOUBLE_TAP_DELAY = 280;

function formatDateRange(start, end) {
  if (!start) return '';
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  try {
    if (end && end !== start) {
      return `${new Date(start).toLocaleDateString('pt-PT', opts)} – ${new Date(end).toLocaleDateString('pt-PT', opts)}`;
    }
    return new Date(start).toLocaleDateString('pt-PT', opts);
  } catch {
    return '';
  }
}

const Post = ({
  travel,
  isLiked,
  isSaved,
  showAllComments,
  likedComments,
  comments = [],
  currentUserId,
  user, // { id, name, profilePhoto, profilePicture }
  onLike,
  onShare,
  onLoadComments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onOpenComments,
  onReport,
  onPhotoClick,
  onToggleSave,
}) => {
  const navigate = useNavigate();
  const [burst, setBurst] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(!!isSaved);
  const [composerValue, setComposerValue] = useState('');

  useEffect(() => { setSaved(!!isSaved); }, [isSaved]);
  const lastTap = useRef(0);
  const tapTimer = useRef(null);
  const menuRef = useRef(null);

  const handleOpen = (e) => {
    if (e.target.closest('button, a, textarea, [role="button"]')) return;
    navigate(`/travel/${travel.id}`);
  };

  const handleDoubleTap = useCallback((e) => {
    if (e.target.closest('button, a, textarea, [role="button"]')) return;
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      e.stopPropagation();
      if (!isLiked) onLike?.(travel.id, e);
      setBurst(true);
      setTimeout(() => setBurst(false), 900);
      if (tapTimer.current) clearTimeout(tapTimer.current);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
  }, [isLiked, onLike, travel.id]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [menuOpen]);

  const likes = travel.likes || 0;
  const totalComments = travel.totalCommentsCount ?? comments.length ?? 0;
  // `author` is the display name (First Last) used in the avatar
  // and visible label. `authorUsername` is the raw @username used
  // for the /profile link so a profile rename doesn't break it.
  const author = travel.user || 'Viajante';
  const authorUsername = travel.userUsername || travel.user || '';
  // Hide the "save" affordance for the user's own posts — saving
  // a trip of yours doesn't make sense and was previously visible.
  const isOwnPost = currentUserId != null && travel.userId != null
    && String(currentUserId) === String(travel.userId);
  const title = travel.name || '';
  const summary = travel.description || '';
  // V16 — Multi-destination rendering. For single-destination trips
  // the result is the familiar "Cidade, País" string. For multi-
  // destination, we render the full route in a compact form:
  //   1 dest   → "Lisboa, Portugal"
  //   2 dests  → "Lisboa, Portugal · Porto"
  //   3+ dests → "Lisboa, Portugal + 2" (full list in a tooltip)
  //   multi-country → flag emoji per country: "Lisboa 🇵🇹 + Paris 🇫🇷"
  // The `cities` and `countries` arrays come from the new V16 fields
  // on the feed DTO; we fall back to the legacy `city`/`country`
  // strings for trips that pre-date V16.
  const cities = Array.isArray(travel.cities) && travel.cities.length
    ? travel.cities
    : (travel.city ? [travel.city] : []);
  const countries = Array.isArray(travel.countries) && travel.countries.length
    ? travel.countries
    : (travel.country ? [travel.country] : []);
  const isMultiCountry = countries.length > 1;
  const FLAGS = { 'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Brazil': '🇧🇷', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪', 'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'China': '🇨🇳', 'Mexico': '🇲🇽' };
  const buildLocation = () => {
    if (cities.length === 0) return '';
    const first = cities[0];
    const firstCountry = countries[0] || '';
    const head = isMultiCountry
      ? `${first}${FLAGS[firstCountry] ? ' ' + FLAGS[firstCountry] : ''}`
      : (firstCountry ? `${first}, ${firstCountry}` : first);
    if (cities.length === 1) return head;
    if (cities.length === 2) {
      return isMultiCountry
        ? `${head} + ${cities[1]}${FLAGS[countries[1] || ''] ? ' ' + FLAGS[countries[1]] : ''}`
        : `${head} · ${cities[1]}`;
    }
    // 3+ → head + (N-1) com tooltip a listar tudo
    return `${head} + ${cities.length - 1}`;
  };
  const location = buildLocation();
  const locationTooltip = cities.length > 2
    ? `Roteiro: ${cities.join(' → ')}`
    : (isMultiCountry ? `Roteiro: ${cities.map((c, i) => `${c}${FLAGS[countries[i] || ''] ? ' ' + FLAGS[countries[i]] : ''}`).join(' → ')}` : '');
  const dateRange = formatDateRange(travel.startDate, travel.endDate);
  const price = travel.price;
  const stars = travel.stars;
  // Show every category the trip has — they come as a flat array of
  // names from the backend (one per category row in the join table).
  const categories = Array.isArray(travel.category)
    ? travel.category.filter(Boolean)
    : (travel.category ? [travel.category] : []);

  // Build media list (photos first, then videos).
  const media = [];
  if (travel.highlightImage) media.push({ src: travel.highlightImage, type: 'photo' });
  if (Array.isArray(travel.images_generalInformation)) {
    travel.images_generalInformation.forEach((s) => s && media.push({ src: s, type: 'photo' }));
  }
  if (Array.isArray(travel.images_foodRecommendations)) {
    travel.images_foodRecommendations.forEach((s) => s && media.push({ src: s, type: 'photo' }));
  }
  if (Array.isArray(travel.images_transportMethods)) {
    travel.images_transportMethods.forEach((s) => s && media.push({ src: s, type: 'photo' }));
  }
  if (Array.isArray(travel.images_accommodations)) {
    travel.images_accommodations.forEach((s) => s && media.push({ src: s, type: 'photo' }));
  }
  if (Array.isArray(travel.images_referencePoints)) {
    travel.images_referencePoints.forEach((s) => s && media.push({ src: s, type: 'photo' }));
  }
  if (Array.isArray(travel.travelVideos)) {
    travel.travelVideos.forEach((s) => s && media.push({ src: s, type: 'video' }));
  }
  const seen = new Set();
  const mediaUnique = media.filter((m) => {
    if (!m.src || seen.has(m.src)) return false;
    seen.add(m.src);
    return true;
  });

  // Flatten the comment tree once for the global thread component.
  const flatComments = useMemo(() => {
    const flattened = flattenCommentTree(comments);
    // Sync the liked state from the `likedComments` array into the
    // comment objects so the heart icon renders filled.
    if (Array.isArray(likedComments) && likedComments.length) {
      const likedSet = new Set(likedComments);
      return flattened.map((c) => ({
        ...c,
        currentUserLiked: likedSet.has(c.id) || likedSet.has(`${travel.id}-${c.id}`) || c.currentUserLiked,
      }));
    }
    return flattened;
  }, [comments, likedComments, travel.id]);

  const handleComposerSubmit = useCallback((text) => {
    if (!text?.trim()) return;
    onAddComment?.(travel.id, [], text);
    setComposerValue('');
  }, [onAddComment, travel.id]);

  const handleCommentLike = useCallback((comment) => {
    if (!comment) return;
    onLikeComment?.(travel.id, comment.id, []);
  }, [onLikeComment, travel.id]);

  const handleCommentDelete = useCallback((comment) => {
    if (!comment) return;
    onDeleteComment?.(travel.id, comment.id);
  }, [onDeleteComment, travel.id]);

  return (
    <motion.article
      className="gm-post"
      aria-label={`Publicação de ${author}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleOpen}
    >
      {/* ── Header: avatar + author + location + date + more ── */}
      <header className="gm-post__header">
        <button
          type="button"
          className="gm-post__avatar-btn"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/profile/${authorUsername}`); }}
          aria-label={`Ver perfil de ${author}`}
        >
          <Avatar src={travel.userProfilePicture} name={author} size="md" />
        </button>
        <div className="gm-post__author">
          <button
            type="button"
            className="gm-post__author-name"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/profile/${authorUsername}`); }}
            aria-label={`Ver perfil de ${author}`}
          >
            {author}
          </button>
          {(location || dateRange) && (
            <span className="gm-post__author-meta">
              {location && (
                <span className="gm-post__author-meta-row" title={locationTooltip || undefined}>
                  <MapPin size={11} strokeWidth={2} className="gm-post__author-pin" />
                  {location}
                </span>
              )}
              {dateRange && (
                <span className="gm-post__author-meta-row gm-post__author-meta-row--muted">
                  {dateRange}
                </span>
              )}
            </span>
          )}
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="gm-post__more"
            aria-label="Mais opções"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((o) => !o); }}
          >
            <MoreHorizontal size={20} strokeWidth={1.75} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="gm-post__menu"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Round 58 — Denunciar a própria publicação não faz
                    sentido. O menu agora mostra o item apenas para
                    posts de outros utilizadores, alinhando com a
                    regra que já existia no TravelDetails. */}
                {!isOwnPost && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onReport?.(travel); }}
                  >
                    <Flag size={14} strokeWidth={1.75} />
                    Denunciar publicação
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Title (optional) ─────────────────────────────── */}
      {title && <h2 className="gm-post__title">{title}</h2>}

      {/* ── Media carousel (huge photo, 3:4) ─────────────── */}
      {mediaUnique.length > 0 && (
        <div className="gm-post__media" onClick={handleDoubleTap}>
          <div className="gm-post__media-frame">
            <MediaCarousel
              media={mediaUnique}
              onPhotoClick={(src) => onPhotoClick?.(mediaUnique, mediaUnique.findIndex((m) => m.src === src))}
            />
            {/* Meta overlay (categories + stars + price) */}
            {(categories.length > 0 || (price && Number(price) > 0) || stars > 0 || travel.isMultiDest || Number(travel.citiesCount) === 1) && (
              <div className="gm-post__media-meta">
                {(categories.length > 0 || travel.isMultiDest || Number(travel.citiesCount) === 1) && (
                  <div className="gm-post__media-categories">
                    {categories.map((cat) => (
                      <span key={cat} className="gm-post__media-pill">{cat}</span>
                    ))}
                    {/* Round 49 — feed parity with /travels: "Multidestino"
                        (blue) when the trip has more than one city, or
                        "Destino Único" (slate) when it has exactly one.
                        Mirrors Travels.js pill naming. */}
                    {travel.isMultiDest ? (
                      <span
                        className="gm-post__media-pill gm-post__media-pill--multi"
                        title="Viagem com vários destinos"
                      >
                        <MapPin size={11} strokeWidth={2.2} /> Multidestino
                      </span>
                    ) : (Number(travel.citiesCount) === 1 && (
                      <span
                        className="gm-post__media-pill gm-post__media-pill--single"
                        title="Viagem com um único destino"
                      >
                        <MapPin size={11} strokeWidth={2.2} /> Destino Único
                      </span>
                    ))}
                  </div>
                )}
                {(stars > 0 || (price && Number(price) > 0)) && (
                  <div className="gm-post__media-meta-side">
                    {stars > 0 && (
                      <span className="gm-post__media-pill gm-post__media-pill--stars">
                        <Star size={11} strokeWidth={0} fill="currentColor" />
                        {Number(stars).toFixed(1)}
                      </span>
                    )}
                    {price && Number(price) > 0 && (
                      <span className="gm-post__media-pill gm-post__media-pill--price">€ {price}</span>
                    )}
                  </div>
                )}
              </div>
            )}
            <AnimatePresence>
              {burst && (
                <div className="gm-post__heart-burst" aria-hidden="true">
                  <Heart size={120} strokeWidth={0} fill="currentColor" />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Mobile-only category strip: under the photo instead of overlaid.
          Hides on desktop where the overlay is shown. Static, clean
          wrap so it matches the rest of the design system. The
          Multidestino / Destino Único pill rides along even when
          there are no categories. */}
      {(categories.length > 0 || travel.isMultiDest || Number(travel.citiesCount) === 1) && (
        <div className="gm-post__categories-mobile" aria-label="Categorias e tipo de destino">
          {categories.map((cat) => (
            <span key={cat} className="gm-post__media-pill">{cat}</span>
          ))}
          {travel.isMultiDest ? (
            <span
              className="gm-post__media-pill gm-post__media-pill--multi"
              title="Viagem com vários destinos"
            >
              <MapPin size={11} strokeWidth={2.2} /> Multidestino
            </span>
          ) : (Number(travel.citiesCount) === 1 && (
            <span
              className="gm-post__media-pill gm-post__media-pill--single"
              title="Viagem com um único destino"
            >
              <MapPin size={11} strokeWidth={2.2} /> Destino Único
            </span>
          ))}
        </div>
      )}

      {/* ── Caption (description) — click opens travel ── */}
      {summary && (
        <div
          className="gm-post__caption gm-post__caption--clickable"
          onClick={(e) => { e.stopPropagation(); navigate(`/travel/${travel.id}`); }}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/travel/${travel.id}`); } }}
        >
          <TextExpandable text={summary} clamp={6} />
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────── */}
      <div className="gm-post__actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`gm-post__action ${isLiked ? 'gm-post__action--liked' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLike?.(travel.id, e); }}
          aria-label={isLiked ? 'Remover gosto' : 'Dar gosto'}
          aria-pressed={isLiked}
        >
          <Heart
            size={20}
            strokeWidth={1.75}
            fill={isLiked ? 'currentColor' : 'none'}
          />
          {likes > 0 && <span className="gm-post__action-count">{likes}</span>}
        </button>
        <button
          type="button"
          className={`gm-post__action ${showAllComments ? 'gm-post__action--active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenComments?.(travel); }}
          aria-label={showAllComments ? 'Esconder comentários' : 'Ver comentários'}
          aria-pressed={showAllComments}
        >
          <MessageCircle size={20} strokeWidth={1.75} />
          {totalComments > 0 && <span className="gm-post__action-count">{totalComments}</span>}
        </button>
        <button
          type="button"
          className="gm-post__action"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare?.(travel.id, e); }}
          aria-label="Partilhar"
        >
          <Share2 size={20} strokeWidth={1.75} />
        </button>
        <div className="gm-post__action-spacer" />
        {!isOwnPost && (
          <button
            type="button"
            className={`gm-post__action ${saved ? 'gm-post__action--saved' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const next = !saved;
              setSaved(next);
              onToggleSave?.(travel.id, next);
            }}
            aria-label={saved ? 'Remover dos guardados' : 'Guardar'}
            aria-pressed={saved}
          >
            <Bookmark size={20} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* ── Comments (global thread) ─────────────────────── */}
      <div onClick={(e) => e.stopPropagation()}>
        <CommentThread
          isOpen={!!showAllComments}
          onToggle={() => onOpenComments?.(travel)}
          comments={flatComments}
          currentUserId={currentUserId}
          onLike={handleCommentLike}
          onDelete={handleCommentDelete}
          composer={{
            author: {
              name: getDisplayName(user, 'Você'),
              src: user?.profilePhoto || user?.profilePicture,
            },
            value: composerValue,
            onChange: setComposerValue,
            onSubmit: handleComposerSubmit,
            placeholder: 'Escreva um comentário...',
          }}
          loading={false}
        />
      </div>
    </motion.article>
  );
};

Post.propTypes = {
  travel: PropTypes.object.isRequired,
  isLiked: PropTypes.bool,
  isSaved: PropTypes.bool,
  showAllComments: PropTypes.bool,
  likedComments: PropTypes.array,
  comments: PropTypes.array,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  user: PropTypes.object,
  onLike: PropTypes.func,
  onShare: PropTypes.func,
  onLoadComments: PropTypes.func,
  onAddComment: PropTypes.func,
  onLikeComment: PropTypes.func,
  onDeleteComment: PropTypes.func,
  onOpenComments: PropTypes.func,
  onReport: PropTypes.func,
  onPhotoClick: PropTypes.func,
  onToggleSave: PropTypes.func,
};

export default Post;
