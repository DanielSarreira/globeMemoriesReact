import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import ProgressiveImg from './ProgressiveImg';
import './MediaCarousel.css';

/**
 * MediaCarousel — a vertical 3:4 photo / video carousel with:
 *   - swipe gestures (left / right to change slide)
 *   - tap to pause/resume videos
 *   - click photo to open lightbox (via onPhotoClick)
 *   - dot indicators (only when >1 media item)
 *   - counter (only when >1 media item)
 *
 * Videos: only the active one plays. Others are paused.
 */
const MediaCarousel = ({ media = [], onPhotoClick, aspectRatio = '3 / 4' }) => {
  const total = media.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(0);
  const deltaX = useRef(0);
  const swiping = useRef(false);
  const videoRef = useRef(null);
  const viewportRef = useRef(null);

  const goto = useCallback((i) => {
    const next = (i + total) % Math.max(total, 1);
    setIndex(next);
  }, [total]);

  // Pause the video when we navigate away from it.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      if (!paused) {
        videoRef.current.play().catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Round 53 — Autoplay: muda de slide automaticamente de 3 em 3
  // segundos (apenas fotos; interrompe se o user está a interagir
  // ou se está em pausa). O countdown reinicia sempre que o slide
  // muda (via index) para que o timing seja consistente.
  useEffect(() => {
    if (total <= 1 || paused) return undefined;
    const currentItem = media[index];
    if (currentItem?.type === 'video') return undefined;
    const t = setTimeout(() => {
      goto(index + 1);
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, total, media]);

  const onPointerDown = (e) => {
    const point = e.touches ? e.touches[0] : e;
    startX.current = point.clientX;
    deltaX.current = 0;
    swiping.current = true;
  };

  const onPointerMove = (e) => {
    if (!swiping.current) return;
    const point = e.touches ? e.touches[0] : e;
    deltaX.current = point.clientX - startX.current;
  };

  const onPointerUp = (e) => {
    if (!swiping.current) return;
    swiping.current = false;
    const dx = deltaX.current;
    if (Math.abs(dx) > 50 && total > 1) {
      if (dx < 0) goto(index + 1);
      else goto(index - 1);
    }
  };

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const item = media[index];
    if (!item) return;
    if (item.type === 'video') {
      setPaused((p) => {
        const next = !p;
        if (videoRef.current) {
          if (next) videoRef.current.pause();
          else videoRef.current.play().catch(() => {});
        }
        return next;
      });
      return;
    }
    onPhotoClick?.(item.src, index);
  };

  if (total === 0) {
    return (
      <div className="gm-carousel">
        <div className="gm-carousel__viewport" style={{ aspectRatio }}>
          <div className="gm-carousel__placeholder" />
        </div>
      </div>
    );
  }

  const current = media[index];

  return (
    <div
      className={`gm-carousel ${paused ? 'gm-carousel__viewport--paused' : ''}`}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
    >
      <div ref={viewportRef} className="gm-carousel__viewport" style={{ aspectRatio }}>
        <div
          className="gm-carousel__track"
          style={{ transform: `translate3d(${-index * 100}%, 0, 0)` }}
        >
          {media.map((m, i) => (
            <div className="gm-carousel__slide" key={`${i}-${m.src}`} onClick={onClick}>
              {m.type === 'video' ? (
                <video
                  ref={i === index ? videoRef : undefined}
                  className="gm-carousel__video"
                  src={m.src}
                  autoPlay={i === index && !paused}
                  loop
                  muted
                  playsInline
                  preload={i === index ? 'auto' : 'metadata'}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <ProgressiveImg
                  src={m.src}
                  alt=""
                  eager={i === 0}
                  // Round 90 (perf) — the media carousel is THE
                  // LCP element on /home and /travel/{id}. The
                  // default `sizes` is 100vw which makes the
                  // browser ask for the 2048w fallback (the
                  // largest candidate in our srcset). On a phone
                  // with DPR 2.5x the rendered size is ~640px —
                  // we want the browser to ask for the 640w
                  // WebP (~30KB) NOT the 2048w original
                  // (~3MB). Same trick on desktop (1280px
                  // container with 640px image) — DPR 1.5x
                  // means 960px, ask for the 1024w.
                  sizes="(max-width: 768px) 100vw, 640px"
                  onClick={onPhotoClick ? () => onPhotoClick(m.src, i) : undefined}
                />
              )}
            </div>
          ))}
        </div>

        {/* Arrow navigation (desktop) */}
        {total > 1 && (
          <>
            <button
              type="button"
              className="gm-carousel__arrow gm-carousel__arrow--prev"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); goto(index - 1); }}
              aria-label="Foto anterior"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="gm-carousel__arrow gm-carousel__arrow--next"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); goto(index + 1); }}
              aria-label="Próxima foto"
            >
              <ChevronRight size={22} strokeWidth={2.2} />
            </button>
          </>
        )}

        {/* Play/Pause hint overlay (videos) */}
        {current?.type === 'video' && (
          <div className="gm-carousel__play-overlay" aria-hidden="true">
            {paused ? <Play size={36} strokeWidth={1.5} fill="rgba(0,0,0,0.4)" /> : <Pause size={36} strokeWidth={1.5} />}
          </div>
        )}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="gm-carousel__dots" aria-hidden="true">
          {media.map((_, i) => (
            <span
              key={i}
              className={`gm-carousel__dot ${i === index ? 'gm-carousel__dot--active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

MediaCarousel.propTypes = {
  media: PropTypes.arrayOf(PropTypes.shape({
    src: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['photo', 'video']),
  })),
  onPhotoClick: PropTypes.func,
  aspectRatio: PropTypes.string,
};

export default MediaCarousel;
