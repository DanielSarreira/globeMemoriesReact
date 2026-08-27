// src/pages/Landing.js
//
// Round 59 — Public landing page shown to anonymous visitors (and
// signed-in users too, on `/`).
//
// Layout top-to-bottom:
//   1. Floating minimal header (LandingHeader) — replaces the
//      sidebar that was here before. Carries brand + Login/Register
//      CTAs only.
//   2. Hero with ImageTrail (interactive background of rotating
//      travel thumbnails that follow the cursor).
//   3. 15 random public trips feed.
//   4. Conversion gate.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request, toFullMediaUrl } from '../axios_helper';
import { getDisplayName } from '../utils/userDisplay';
import {
  Compass, MapPin, Sparkles, ArrowRight, Lock, Mountain,
} from 'lucide-react';
import ImageTrail from '../components/landing/ImageTrail';
import LandingHeader from '../components/landing/LandingHeader';
import '../styles/components/image-trail.css';
import '../styles/components/landing-header.css';
import '../styles/pages/landing.css';

const LANDING_TRIP_COUNT = 15;
const FEED_PAGE_SIZE = 50; // pull a wider page so we can shuffle a real random sample

// Travel-themed Unsplash images for the hero ImageTrail.
const HERO_TRAIL_IMAGES = [
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=300&q=80',
];

function shuffle(array) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function formatDateRange(start, end) {
  if (!start || !end) return '';
  try {
    const s = new Date(start);
    const e = new Date(end);
    const sm = s.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
    const em = e.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
    return sm === em ? sm : `${sm} – ${em}`;
  } catch {
    return '';
  }
}

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const heroRef = useRef(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await request('GET', '/trips/public-feed', {
        params: { page: 0, size: FEED_PAGE_SIZE, sort: 'startDate,desc' },
      });
      const raw = r?.data?.content || [];
      // Round 77 — backend (TripFeedSpecification.searchPublicTrips)
      // already filters on:
      //   * tripPrivacy = public (or null/empty)
      //   * user.isBanned = false
      //   * user.privateProfile = false  ← this is the new filter that
      //     was previously missing
      // So no client-side filtering is required anymore. The comment
      // that used to live here ("we additionally drop trips whose
      // author has a private profile") was a no-op because TripDto
      // doesn't expose `privateProfile`.
      const picked = shuffle(raw).slice(0, LANDING_TRIP_COUNT);
      setTrips(picked);
    } catch (e) {
      setError(e?.response?.data?.message || 'Não foi possível carregar as viagens.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  // Country / city totals — counts every distinct country/city across
  // the loaded trips (not just the first one). Used in the hero stats.
  return (
    <div className="gm-landing">
      {/* ── Floating header (replaces the sidebar) ──────── */}
      <LandingHeader />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="gm-landing__hero" ref={heroRef}>
        <div className="gm-landing__hero-trail">
          <ImageTrail containerRef={heroRef} interval={90} rotationRange={20}>
            {HERO_TRAIL_IMAGES.map((url, idx) => (
              <div key={idx} className="gm-trail__frame">
                <img src={url} alt="" loading="lazy" />
              </div>
            ))}
          </ImageTrail>
        </div>
        <div className="gm-landing__hero-inner">
          <h1 className="gm-landing__title">
            <span className="gm-landing__title-globe">Globe</span>{' '}
            <span className="gm-landing__title-accent">Memories</span>
          </h1>
          <p className="gm-landing__subtitle">
            Onde as viagens ganham vida — descobre, guarda e partilha.
          </p>

          {!user && (
            <div className="gm-landing__cta">
              <Link to="/register" className="gm-landing__btn gm-landing__btn--primary">
                Criar conta <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
              <Link to="/login" className="gm-landing__btn gm-landing__btn--ghost">
                Iniciar sessão
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── FEED ───────────────────────────────────────────── */}
      <section className="gm-landing__feed">
        <div className="gm-landing__feed-head">
          <h2>
            <Compass size={20} strokeWidth={2} />
            15 viagens aleatórias de perfis públicos
          </h2>
          <button
            type="button"
            className="gm-landing__refresh"
            onClick={loadFeed}
            aria-label="Recarregar feed"
          >
            <Sparkles size={14} strokeWidth={2.2} /> Ver outras
          </button>
        </div>

        {loading ? (
          <div className="gm-landing__skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="gm-landing__skeleton-card" />
            ))}
          </div>
        ) : error ? (
          <p className="gm-landing__error">{error}</p>
        ) : trips.length === 0 ? (
          <p className="gm-landing__empty">
            Ainda não há viagens públicas para mostrar. Volta em breve!
          </p>
        ) : (
          <div className="gm-landing__grid">
            {trips.map((t) => {
              const photo = Array.isArray(t.photos) && t.photos.length
                ? toFullMediaUrl(t.photos[0])
                : (t.tripPhoto ? toFullMediaUrl(t.tripPhoto) : null);
              const cities = Array.isArray(t.citiesVisited) ? t.citiesVisited : [];
              const country = t.countriesVisited?.[0] || '';
              const location = cities.length
                ? (cities.length === 1 ? cities[0] : `${cities[0]} +${cities.length - 1}`)
                : country;
              const author = getDisplayName({
                userFirstName: t.userFirstName,
                userLastName: t.userLastName,
                username: t.username,
              }, 'Viajante');
              return (
                <article
                  key={t.tripId}
                  className="gm-landing__card"
                  onClick={() => navigate(`/travel/${t.tripId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/travel/${t.tripId}`);
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <div className="gm-landing__card-media">
                    {photo ? (
                      <img src={photo} alt={t.tripTitle || 'Viagem'} loading="lazy" />
                    ) : (
                      <div className="gm-landing__card-media-fallback">
                        <Mountain size={28} strokeWidth={1.5} />
                      </div>
                    )}
                    {t.tripRating ? (
                      <span className="gm-landing__card-rating">★ {t.tripRating}</span>
                    ) : null}
                  </div>
                  <div className="gm-landing__card-body">
                    <h3 className="gm-landing__card-title">{t.tripTitle || 'Viagem'}</h3>
                    {location && (
                      <p className="gm-landing__card-location">
                        <MapPin size={12} strokeWidth={2} /> {location}{country && location !== country ? `, ${country}` : ''}
                      </p>
                    )}
                    {t.tripSummary && (
                      <p className="gm-landing__card-summary">{t.tripSummary}</p>
                    )}
                    <p className="gm-landing__card-meta">
                      <span>por <strong>{author}</strong></span>
                      {t.startDate && (
                        <span className="gm-landing__card-date">
                          {formatDateRange(t.startDate, t.endDate)}
                        </span>
                      )}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ── GATE ─────────────────────────────────────────── */}
        <div className="gm-landing__gate">
          <div className="gm-landing__gate-inner">
            <Lock size={22} strokeWidth={2} />
            <h3>Queres ver mais?</h3>
            <p>
              Estas 15 são apenas uma amostra. Cria uma conta gratuita para
              explorar o feed completo, guardar viagens, seguir viajantes e
              partilhar as tuas memórias.
            </p>
            {!user && (
              <div className="gm-landing__gate-cta">
                <Link to="/register" className="gm-landing__btn gm-landing__btn--primary">
                  Criar conta <ArrowRight size={16} strokeWidth={2.4} />
                </Link>
                <Link to="/login" className="gm-landing__btn gm-landing__btn--ghost">
                  Já tenho conta
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
