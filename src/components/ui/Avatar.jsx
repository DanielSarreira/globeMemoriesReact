import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { toFullMediaUrl } from '../../utils/mediaUrl';
import ProgressiveImg from './ProgressiveImg';
import './Avatar.css';



const GRADIENTS = [
  'linear-gradient(135deg, #007BFF 0%, #5BA8FF 100%)',
  'linear-gradient(135deg, #FF9900 0%, #FFB94D 100%)',
  'linear-gradient(135deg, #0A0E1A 0%, #1A2240 100%)',
  'linear-gradient(135deg, #007BFF 0%, #B04BFF 50%, #FF7A8A 100%)',
  'linear-gradient(135deg, #FF9900 0%, #E0384F 100%)',
  'linear-gradient(135deg, #0052B8 0%, #007BFF 100%)',
  'linear-gradient(135deg, #1F6FA5 0%, #5BA8FF 100%)',
  'linear-gradient(135deg, #E68A00 0%, #FF9900 100%)',
];

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initialsOf(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Avatar = ({ src, name = '', size = 'md', ring = false, className = '', alt, ...rest }) => {
  const [errored, setErrored] = useState(false);
  // nonce bumps every time the underlying src string changes. This
  // is the single source of truth for "did the photo URL change?".
  // The browser caches <img> by full URL, so we append the nonce
  // to the query string AND set it as the React key, which forces
  // React to unmount the old <img> and mount a new one — the
  // browser then fetches the latest bytes from the backend.
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    setNonce((n) => n + 1);
  }, [src]);

  const gradient = useMemo(() => GRADIENTS[hash(name) % GRADIENTS.length], [name]);
  const initials = useMemo(() => initialsOf(name), [name]);

  const cachedSrc = useMemo(() => {
    if (!src) return src;
    // Resolve relative backend paths (e.g. "profile-photos/uuid.jpg")
    // against the backend's /files origin. Without this, the browser
    // would try to load the image from the frontend origin
    // (localhost:3000) and silently 404.
    const absolute = toFullMediaUrl(src);
    if (!absolute) return src;
    const sep = absolute.includes('?') ? '&' : '?';
    return `${absolute}${sep}v=${nonce}`;
  }, [src, nonce]);

  const showImg = cachedSrc && !errored;

  const cls = [
    'gm-avatar',
    `gm-avatar--${size}`,
    ring && 'gm-avatar--ring',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={cls}
      style={showImg ? undefined : { background: gradient }}
      {...rest}
    >
      {showImg ? (
        <ProgressiveImg
          // The ProgressiveImg keeps its own <img> element; we add a key
          // so React unmounts/remounts when the cached URL changes (e.g.
          // a fresh upload that bumped the `nonce`).
          key={cachedSrc}
          src={cachedSrc}
          alt={alt || name || 'avatar'}
          eager={size === 'xl' || size === '2xl'} /* big avatars = hero */
          imgClassName="gm-avatar__img"
          onClick={undefined}
          // Round 77 (perf) — avatars are tiny (24-64px CSS) and
          // are repeated on every page (sidebar + every comment
          // + every post). The srcset machinery would over-engineer
          // the case (all thumbs end up the same size on screen),
          // so we skip it. The default ProgressiveImg still gives us
          // the gradient placeholder + fade-in.
          skipSrcSet
          // Approximate the rendered width. Default to 48px (md)
          // because that's the most common size; the browser will
          // still pick the right entry from srcset if the caller
          // opted in. We set sizes for the future when we add
          // srcset to avatars.
          sizes="48px"
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  ring: PropTypes.bool,
  className: PropTypes.string,
  alt: PropTypes.string,
};

export default Avatar;
