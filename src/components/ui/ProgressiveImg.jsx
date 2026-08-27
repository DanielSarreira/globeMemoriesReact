import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toFullMediaUrl } from '../../utils/mediaUrl';
import './ProgressiveImg.css';

/**
 * ProgressiveImg — image with a placeholder gradient/shimmer that
 * shows BEFORE the bytes arrive, and a smooth fade-in once the
 * image is loaded.
 *
 * Why this matters: the browser paints <img> with no background
 * colour while downloading. On a 4G connection that gives
 * 200-800ms of a black box per image.
 *
 * The placeholder is a subtle diagonal gradient (no hard black)
 * and the image fades in over 240ms once `onLoad` fires. The
 * browser HTTP cache + Nginx `expires 30d` mean the second visit
 * skips the download entirely.
 *
 * Round 92 (perf) — REMOVED THUMBNAILS.
 *
 * The previous design (Round 77–91) used a 320w thumb as initial
 * src with a srcset upgrading to 640/1024/original. The user
 * reported that photos looked visibly pixelated even on a high-DPR
 * display because:
 *   1. The thumb was generated at quality 0.80 (smaller bytes but
 *      visible compression artefacts).
 *   2. The browser was picking the smallest srcset entry (320w)
 *      and scaling it up to the rendered size (e.g. 480px),
 *      causing the visible blur.
 *
 * New design: the backend optimises every upload to a single
 * high-quality JPEG (max 2560px, quality 0.90). The frontend
 * loads that single file directly. CSS handles the responsive
 * sizing, and a single 400-900 KB download is fast enough on any
 * connection. No more thumb-vs-original decision tree, no more
 * 404-then-retry chains, no more visible compression artefacts.
 */
const ProgressiveImg = ({
  src,
  alt = '',
  eager = false,
  onClick,
  className = '',
  imgClassName = 'gm-progimg__img',
  // Kept for API compatibility but ignored — we don't use srcset
  // in Round 92.
  sizes,
  skipSrcSet = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef(null);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => {
    setErrored(true);
    setLoaded(true);
  }, []);

  // If the image is already cached by the browser, `complete` is
  // true on mount and `onLoad` may never fire. Detect that and
  // set loaded=true synchronously so we don't flash the
  // placeholder.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  if (errored) {
    return (
      <div className={`gm-progimg gm-progimg--error ${className}`} onClick={onClick}>
        <div className="gm-progimg__error-mark" aria-hidden="true">!</div>
      </div>
    );
  }

  return (
    <div className={`gm-progimg ${loaded ? 'is-loaded' : ''} ${className}`} onClick={onClick}>
      <img
        ref={imgRef}
        className={imgClassName}
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        draggable={false}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default ProgressiveImg;
