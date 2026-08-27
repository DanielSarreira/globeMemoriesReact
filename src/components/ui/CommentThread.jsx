// src/components/ui/CommentThread.jsx
// Round 85 — file rewritten from scratch in clean UTF-8.
//
// Previous version had triple-encoded mojibake ("comentário" rendered as
// "comentÃƒÆ’Ã‚Â¡rio", "há 18h" as "hÃƒÆ’Ã‚Â¡ 18h") caused by an older Python
// edit that read the file as latin-1, mutated, then re-wrote — three times.
// The page still rendered, but every accented character in the JSX strings
// came out as a tofu square.
//
// Round 85 keeps the v18 behaviour (avatar + name buttons in CommentRow
// trigger `onUserClick` for navigation to /profile/<username>) and writes
// every string literal in proper UTF-8.
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import Avatar from './Avatar';
import './CommentThread.css';

/* ──────────── Helpers (exported for callers) ──────────── */

// Take a tree (comment.replies, comment.replies.replies, …) and
// return a flat list of comments ordered parent-first. Each comment
// gets a `__depth` so the row can indent replies.
export function flattenCommentTree(comments = []) {
  const flat = [];
  const walk = (list, depth = 0) => {
    if (!Array.isArray(list)) return;
    for (const c of list) {
      flat.push({ ...c, __depth: depth });
      if (Array.isArray(c.replies) && c.replies.length > 0) {
        walk(c.replies, depth + 1);
      }
    }
  };
  walk(comments);
  return flat;
}

// "há 18h" / "há 5 min" / "há 3d" formatter (PT-PT, lowercase). Used as
// a compact relative timestamp next to the absolute one.
function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diff < 60) return `há ${diff}s`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `há ${day}d`;
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

// "07/08/2026 18:42" absolute timestamp. Hover the relative label to
// see this. Stable across timezones because we read the ISO string as-is.
function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ──────────── Comment row (one level only) ──────────── */

function CommentRow({
  comment,
  onLike,
  onDelete,
  onUserClick,
  currentUserId,
}) {
  const isOwner = currentUserId != null
    && comment.userId != null
    && Number(currentUserId) === Number(comment.userId);

  // isLiked comes from the backend (comment.currentUserLiked) — we don't
  // need a local setLikedComments; here we just read it off the comment.
  const isLiked = Boolean(comment.currentUserLiked);

  // The avatar + name are clickable buttons (not <a> tags) so screen
  // readers announce them as actions and we don't get the default <a>
  // underline. `onUserClick` is wired by the Q&A page to navigate to
  // /profile/<username>. We only enable the buttons when both the handler
  // AND a username/userId are present — never the case for the placeholder
  // "Comentário do sistema" row that some legacy data may carry.
  const userClickable = Boolean(onUserClick && (comment.username || comment.userId));
  const authorLabel = comment.user || comment.username || 'Utilizador';
  const profileLabel = userClickable
    ? `Ver perfil de ${authorLabel}`
    : authorLabel;

  return (
    <motion.div
      className="gm-ct__row"
      style={{ marginLeft: Math.min(comment.__depth || 0, 2) * 24 }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        className={`gm-ct__avatar ${userClickable ? 'gm-ct__avatar--clickable' : ''}`}
        onClick={() => userClickable && onUserClick(comment)}
        disabled={!userClickable}
        aria-label={profileLabel}
      >
        <Avatar
          src={comment.userProfilePicture || comment.userPhoto || null}
          name={authorLabel}
          // Round 85 — `size` only accepts the named sizes ('xs' | 'sm' |
          // 'md' | 'lg' | 'xl' | '2xl'). The previous `size={36}` (numeric)
          // silently fell back to the default 'md' (40px), which overflowed
          // the surrounding 36px button. 'sm' = 32px, padded by the
          // button to 36px.
          size="sm"
        />
      </button>

      <div className="gm-ct__body">
        <div className="gm-ct__head">
          {userClickable ? (
            <button
              type="button"
              className="gm-ct__name gm-ct__name--clickable"
              onClick={() => onUserClick(comment)}
            >
              {authorLabel}
            </button>
          ) : (
            <span className="gm-ct__name">{authorLabel}</span>
          )}
          <span className="gm-ct__time" title={formatDateTime(comment.createdAt)}>
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        <p className="gm-ct__text">{comment.text || comment.content}</p>

        <div className="gm-ct__actions">
          <button
            type="button"
            className={`gm-ct__action ${isLiked ? 'gm-ct__action--liked' : ''}`}
            onClick={() => onLike?.(comment)}
            aria-label={isLiked ? 'Remover gosto' : 'Gostar'}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2} />
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </button>

          {isOwner && (
            <button
              type="button"
              className="gm-ct__action gm-ct__action--danger"
              onClick={() => onDelete?.(comment)}
              aria-label="Eliminar comentário"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────── Public component ──────────── */

const CommentThread = ({
  // List of comments already flattened (use `flattenCommentTree` if you have
  // a tree from the backend).
  comments = [],
  totalCount = 0,
  isOpen = true,
  onToggle,
  composer, // { author: { name, src? }, onSubmit: async (text) => … }
  // Per-comment actions
  onLike, // (comment) => …
  onDelete, // (comment) => …
  // Round 83 — (comment) => navigate to the author's profile. The Q&A page
  // wires this to /profile/<username>. We pass it down to every CommentRow
  // so the avatar and the name become buttons that fire the navigation.
  onUserClick,
  currentUserId,
  showCount = true,
  emptyText = 'Ainda sem comentários. Sê o primeiro a comentar!',
  loading = false,
}) => {
  // Replies have been disabled by request — no reply editor state. The
  // list is still flat so we render each comment as a peer.

  // Stable order: oldest first by createdAt (fallback to original index).
  const ordered = useMemo(() => {
    return [...comments].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
  }, [comments]);

  return (
    <div className="gm-ct">
      {showCount && (
        <button
          type="button"
          className="gm-ct__head-toggle"
          onClick={() => onToggle?.()}
        >
          <span>
            {isOpen ? 'Esconder' : 'Ver'} {totalCount}{' '}
            {totalCount === 1 ? 'comentário' : 'comentários'}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="comments-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="gm-ct__body-wrap"
          >
            {/* List (FLAT — all comments rendered the same way, with depth-based indent) */}
            {loading ? (
              <div className="gm-ct__loading">A carregar comentários…</div>
            ) : ordered.length === 0 ? (
              <div className="gm-ct__empty">{emptyText}</div>
            ) : (
              <div className="gm-ct__list">
                {ordered.map((c) => (
                  <CommentRow
                    key={c.id ?? `${c.userId}-${c.createdAt}`}
                    comment={c}
                    onLike={onLike}
                    onDelete={onDelete}
                    onUserClick={onUserClick}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}

            {/* Reply composer removed — the user asked for "no replies" on the
               comment system. The list shows flat comments with the deepest
               ones indented via __depth. The backend still returns the tree
               (comment.replies) so callers can rebuild it if we ever want it back. */}

            {composer && (
              <div className="gm-ct__composer">
                <Avatar
                  src={composer.author?.src || null}
                  name={composer.author?.name || 'Você'}
                  // Round 85 — same fix as the row avatar: use the named
                  // 'sm' (32px) instead of the numeric 32 (which silently
                  // defaulted to 'md' = 40px and overflowed the
                  // composer row).
                  size="sm"
                />
                <form
                  className="gm-ct__composer-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = (composer.value || '').trim();
                    if (!v || composer.disabled) return;
                    composer.onSubmit?.(v);
                  }}
                >
                  <input
                    type="text"
                    className="gm-ct__composer-input"
                    placeholder={composer.placeholder || 'Escreva um comentário…'}
                    value={composer.value || ''}
                    onChange={(e) => composer.onChange?.(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const v = (composer.value || '').trim();
                        if (v && !composer.disabled) composer.onSubmit?.(v);
                      }
                    }}
                    disabled={composer.disabled}
                  />
                  <button
                    type="submit"
                    className="gm-ct__composer-submit"
                    disabled={!composer.value?.trim() || composer.disabled}
                    aria-label="Publicar comentário"
                  >
                    <Send size={16} strokeWidth={2.2} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

CommentThread.propTypes = {
  comments: PropTypes.array,
  totalCount: PropTypes.number,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  composer: PropTypes.shape({
    author: PropTypes.shape({ name: PropTypes.string, src: PropTypes.string }),
    onSubmit: PropTypes.func,
    onChange: PropTypes.func,
    value: PropTypes.string,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
  }),
  onLike: PropTypes.func,
  onDelete: PropTypes.func,
  // Round 83 — wire from the Q&A page to navigate to the author's profile.
  onUserClick: PropTypes.func,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showCount: PropTypes.bool,
  emptyText: PropTypes.string,
  loading: PropTypes.bool,
};

export default CommentThread;
