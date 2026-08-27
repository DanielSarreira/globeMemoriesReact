import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import './Lightbox.css';

/**
 * Lightbox — full-screen premium media viewer.
 *
 * - Photo & video support
 * - Swipe / arrow navigation between media items
 * - Keyboard: ArrowLeft, ArrowRight, Esc
 * - Custom video controls: play/pause, mute, scrubber
 * - Smooth slide transition
 * - Thumbnail strip
 */
const Lightbox = ({ open, media = [], startIndex = 0, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const startX = useRef(0);
  const swiping = useRef(false);
  const trackRef = useRef(null);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % Math.max(media.length, 1));
      if (e.key === 'ArrowLeft')  setIndex((i) => (i - 1 + Math.max(media.length, 1)) % Math.max(media.length, 1));
      if (e.key === ' ' && media[index]?.type === 'video') {
        e.preventDefault();
        togglePlay();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, media.length, index]);

  // Pause video when navigating away.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      if (playing) videoRef.current.play().catch(() => {});
    }
    setProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      const next = !p;
      if (videoRef.current) {
        if (next) videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
      }
      return next;
    });
  }, []);

  const onPointerDown = (e) => {
    const point = e.touches ? e.touches[0] : e;
    startX.current = point.clientX;
    swiping.current = true;
  };
  const onPointerUp = (e) => {
    if (!swiping.current) return;
    swiping.current = false;
    const point = e.changedTouches ? e.changedTouches[0] : e;
    const dx = point.clientX - startX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) setIndex((i) => (i + 1) % Math.max(media.length, 1));
      else setIndex((i) => (i - 1 + Math.max(media.length, 1)) % Math.max(media.length, 1));
    }
  };

  if (typeof document === 'undefined') return null;
  if (!open) return null;

  const current = media[index] || null;
  const total = media.length;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="gm-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Visualizador de media"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div className="gm-lightbox__topbar">
          <div className="gm-lightbox__counter">
            {total > 1 ? `${index + 1} / ${total}` : ''}
          </div>
          <button
            type="button"
            className="gm-lightbox__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              className="gm-lightbox__nav gm-lightbox__nav--prev"
              onClick={() => setIndex((i) => (i - 1 + total) % total)}
              aria-label="Anterior"
            >
              <ChevronLeft size={24} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="gm-lightbox__nav gm-lightbox__nav--next"
              onClick={() => setIndex((i) => (i + 1) % total)}
              aria-label="Seguinte"
            >
              <ChevronRight size={24} strokeWidth={1.75} />
            </button>
          </>
        )}

        <div
          className="gm-lightbox__viewport"
          onTouchStart={onPointerDown}
          onTouchEnd={onPointerUp}
          onMouseDown={onPointerDown}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
        >
          <div
            ref={trackRef}
            className="gm-lightbox__track"
            style={{ transform: `translate3d(${-index * 100}%, 0, 0)` }}
          >
            {media.map((m, i) => (
              <div className="gm-lightbox__slide" key={`${i}-${m.src}`}>
                {m.type === 'video' ? (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <video
                      ref={i === index ? videoRef : undefined}
                      className="gm-lightbox__media"
                      src={m.src}
                      autoPlay={i === index && playing}
                      loop
                      muted={muted}
                      playsInline
                      controls={false}
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      onTimeUpdate={(e) => {
                        if (i === index) {
                          const d = e.currentTarget.duration || 0;
                          setProgress(d ? e.currentTarget.currentTime / d : 0);
                        }
                      }}
                    />
                    {i === index && !playing && (
                      <div className="gm-lightbox__video-controls">
                        <button
                          type="button"
                          className="gm-lightbox__video-play"
                          onClick={togglePlay}
                          aria-label="Reproduzir"
                        >
                          <Play size={36} strokeWidth={1.5} fill="currentColor" />
                        </button>
                      </div>
                    )}
                    {i === index && (
                      <div className="gm-lightbox__video-bar">
                        <div
                          className="gm-lightbox__video-bar-fill"
                          style={{ transform: `scaleX(${progress})` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    className="gm-lightbox__media"
                    src={m.src}
                    alt=""
                    draggable={false}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {(current?.caption || current?.text || current?.title) && (
          <div className="gm-lightbox__caption">
            {current.caption || current.text || current.title}
          </div>
        )}

        {current?.type === 'video' && (
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Activar som' : 'Silenciar'}
            style={{
              position: 'absolute', bottom: 76, left: '50%', transform: 'translateX(-50%)',
              zIndex: 6,
              appearance: 'none', border: 0,
              background: 'rgba(255, 255, 255, 0.10)',
              WebkitBackdropFilter: 'blur(16px)',
              backdropFilter: 'blur(16px)',
              width: 40, height: 40, borderRadius: '9999px',
              color: '#FFFFFF', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {muted ? <VolumeX size={18} strokeWidth={1.75} /> : <Volume2 size={18} strokeWidth={1.75} />}
          </button>
        )}

        {total > 1 && (
          <div className="gm-lightbox__thumbs" role="tablist" aria-label="Miniaturas">
            {media.map((m, i) => (
              <button
                key={i}
                type="button"
                className={`gm-lightbox__thumb ${i === index ? 'gm-lightbox__thumb--active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Ir para ${i + 1}`}
                aria-selected={i === index}
                role="tab"
              >
                <img src={m.src} alt="" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

Lightbox.propTypes = {
  open: PropTypes.bool,
  media: PropTypes.array,
  startIndex: PropTypes.number,
  onClose: PropTypes.func,
};

export default Lightbox;
