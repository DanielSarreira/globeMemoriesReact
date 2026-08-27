import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import api from '../axios_helper';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  MapPin,
  Calendar,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  X as IconX,
  ChevronRight,
  Compass,
  Sparkles,
  TrendingUp,
  BarChart3,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Plane,
  Trash2,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  Filler,
} from 'chart.js';

import { useWeather } from '../context/WeatherContext';
import WeatherAnimation from '../components/WeatherAnimation';
import {
  PageContainer,
  PageHeader,
  Section,
  SectionHeader,
  Grid,
  Stack,
  Row,
  Spacer,
  useToast,
  IconButton,
  Sheet,
} from '../components/ui';
import '../styles/pages/weather.css';
import '../styles/pages/weather-animations.css';

// Registrar componentes do Chart.js (incluindo Filler para áreas suaves)
ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, Filler);

// ════════════════════════════════════════════════════════════════════════════
// Mapeamento: weather icon name (string preservada no cache) → ícone lucide
// Mantém compatibilidade com o componente WeatherAnimation que ainda usa os
// nomes WiDaySunny etc. como chave, mas a UI estática usa lucide.
// ════════════════════════════════════════════════════════════════════════════
/* Round 81 — the WiDayCloudy family now maps to Lucide's
   `CloudSun` (a sun disc partly hidden behind a cloud) so a
   "partly cloudy" forecast card shows the IPMA / AccuWeather
   "sun-behind-cloud" glyph instead of a plain grey cloud.
   This is the single biggest visual fix for the "everything
   looks overcast" complaint: when Open-Meteo returns code 2
   (partly cloudy) or when `refineIcon` nudges a code 3 to
   partly cloudy, the user now sees a sun + cloud, not a
   flat cloud. */
const LUCIDE_ICON_MAP = {
  WiDaySunny: Sun,
  WiNightClear: Sun,
  WiNightCloudy: Cloud,
  WiCloudy: Cloud,
  WiFog: Cloud,
  WiRain: CloudRain,
  WiSnow: CloudSnow,
  WiThunderstorm: CloudRain,
  WiDayCloudy: CloudSun,
  WiWindy: Wind,
  WiDayRain: CloudRain,
  WiNightRain: CloudRain,
  WiDayHail: CloudSnow,
};

/**
 * ICON_NAME_MAP — maps the WMO weather code returned by
 * Open-Meteo to a (description, WiFamily icon name) tuple.
 *
 * The WiFamily name is a string that the rest of the UI then
 * resolves through LUCIDE_ICON_MAP to a Lucide component (the
 * icons are visually rendered in the hero / forecast cards /
 * hourly cards).
 *
 * Round 81 — this map used to be incomplete: the Open-Meteo
 * spec defines 27 distinct codes (0, 1, 2, 3, 45, 48, 51, 53,
 * 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82,
 * 85, 86, 95, 96, 99) and we were only covering 21. Codes 56,
 * 57 (light/freezing drizzle), 66/67 (light/heavy freezing
 * rain), 77 (snow grains) and 85/86 (light/heavy snow showers)
 * fell through to the `|| { ..., icon: 'WiCloudy' }` default,
 * which made a clear / partly-cloudy day look overcast. Now
 * every code has an explicit mapping.
 *
 * The icon labels also try to be a bit more precise:
 *  - 1 ("Poucas nuvens") is now `WiDaySunny` (a single sun
 *    disc) since the cloud cover is < 25% — exactly the
 *    look the IPMA / AccuWeather use.
 *  - 2 ("Nuvens dispersas / parcialmente nublado") is
 *    `WiDayCloudy`, which we now map to Lucide's `CloudSun`
 *    (sun behind a cloud) instead of plain `Cloud`. This
 *    matches the IPMA cards and avoids the "everything is
 *    overcast" look the user reported.
 *  - 3 ("Nublado") stays as `WiCloudy` (solid cloud).
 */
const ICON_NAME_MAP = {
  0:  { description: 'Céu limpo',                  icon: 'WiDaySunny' },
  1:  { description: 'Poucas nuvens',              icon: 'WiDaySunny' },
  2:  { description: 'Parcialmente nublado',       icon: 'WiDayCloudy' },
  3:  { description: 'Nublado',                    icon: 'WiCloudy' },
  45: { description: 'Nevoeiro',                   icon: 'WiFog' },
  48: { description: 'Nevoeiro com geada',         icon: 'WiFog' },
  51: { description: 'Chuva fraca',                icon: 'WiDayRain' },
  53: { description: 'Chuva moderada',             icon: 'WiRain' },
  55: { description: 'Chuva forte',                icon: 'WiRain' },
  56: { description: 'Chuva congelada fraca',      icon: 'WiDayRain' },
  57: { description: 'Chuva congelada moderada',   icon: 'WiRain' },
  61: { description: 'Chuva fraca',                icon: 'WiDayRain' },
  63: { description: 'Chuva moderada',             icon: 'WiRain' },
  65: { description: 'Chuva forte',                icon: 'WiRain' },
  66: { description: 'Chuva congelada fraca',      icon: 'WiDayRain' },
  67: { description: 'Chuva congelada forte',      icon: 'WiRain' },
  71: { description: 'Neve fraca',                 icon: 'WiSnow' },
  73: { description: 'Neve moderada',              icon: 'WiSnow' },
  75: { description: 'Neve forte',                 icon: 'WiSnow' },
  77: { description: 'Grãos de neve',              icon: 'WiSnow' },
  80: { description: 'Aguaceiros fracos',          icon: 'WiDayRain' },
  81: { description: 'Aguaceiros moderados',       icon: 'WiRain' },
  82: { description: 'Aguaceiros fortes',          icon: 'WiRain' },
  85: { description: 'Aguaceiros de neve fracos',  icon: 'WiSnow' },
  86: { description: 'Aguaceiros de neve fortes',  icon: 'WiSnow' },
  95: { description: 'Trovoada leve',              icon: 'WiThunderstorm' },
  96: { description: 'Trovoada com granizo',       icon: 'WiDayHail' },
  99: { description: 'Trovoada intensa',           icon: 'WiThunderstorm' },
  15: { description: 'Ventoso',                    icon: 'WiWindy' },
};

/**
 * Round 81 — `refineIcon` adjusts the raw Open-Meteo mapping
 * based on the actual precipitation probability for the same
 * hour/day. Open-Meteo sometimes reports code 3 ("Nublado")
 * with a 5% precipitation chance — the cloud cover is over
 * 80% but no rain is forecast. Conversely, code 80 ("Aguaceiros
 * fracos") with a 10% probability is really a partly-cloudy
 * day with a passing shower risk. We nudge the icon family
 * to better match the actual weather experience:
 *
 *  - precip < 20% and the code is "cloudy" → WiDayCloudy
 *    (partly cloudy) so the icon shows a sun peeking out
 *  - precip >= 70% → escalate to WiRain (umbrella)
 *  - precip < 10% and temp >= 18°C and code is anything
 *    cloud-related → WiDaySunny (clear), matching the
 *    IPMA "Sol" look on warm dry days
 *
 * Returns the original `info` if no refinement is justified.
 */
const refineIcon = (info, code, precipProbability, tempC) => {
  if (!info) return info;
  // 95% of the time the raw mapping is correct — only nudge
  // when we have a strong signal either way.
  if (typeof precipProbability !== 'number') return info;
  if (precipProbability < 10 && tempC >= 18) {
    if ([2, 3].includes(code) || info.icon === 'WiCloudy' || info.icon === 'WiDayCloudy') {
      return { description: 'Céu limpo', icon: 'WiDaySunny' };
    }
  }
  if (precipProbability < 20 && code === 3) {
    return { description: 'Parcialmente nublado', icon: 'WiDayCloudy' };
  }
  if (precipProbability >= 70 && info.icon !== 'WiRain' && info.icon !== 'WiThunderstorm') {
    return { description: 'Chuva provável', icon: 'WiRain' };
  }
  return info;
};

const STORAGE_KEYS = {
  WEATHER_HISTORY: 'weatherSearchHistory',
  FUTURE_TRAVELS: 'futureTravels',
  WEATHER_CACHE: 'weatherCache',
};

const MAX_HISTORY_ITEMS = 5;
const MAX_CACHE_ITEMS = 10;
const MAX_CACHE_AGE = 3600 * 1000; // 1 hora

// ── Helpers ──────────────────────────────────────────────────────────────
const normalizeCityName = (city) => {
  if (!city || typeof city !== 'string') return '';
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toLowerCase();
};

const isValidCoordinate = (lat, lon) =>
  typeof lat === 'number' &&
  typeof lon === 'number' &&
  lat >= -90 && lat <= 90 &&
  lon >= -180 && lon <= 180;

const getWeatherDescription = (code) =>
  ICON_NAME_MAP[code] || { description: 'Desconhecido', icon: 'WiCloudy' };

const getSeason = (month, isNorthernHemisphere) => {
  if (isNorthernHemisphere) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }
  if (month >= 3 && month <= 5) return 'autumn';
  if (month >= 6 && month <= 8) return 'winter';
  if (month >= 9 && month <= 11) return 'spring';
  return 'summer';
};

const estimateClimate = (cityName, lat, month) => {
  const isNorthernHemisphere = lat >= 0;
  const season = getSeason(month, isNorthernHemisphere);

  const climateData = {
    summer: { maxTemp: 28.5, minTemp: 20.0, precipitation: 10, condition: 'Sol', icon: 'WiDaySunny', windSpeed: 15 },
    autumn: { maxTemp: 22.0, minTemp: 14.0, precipitation: 80, condition: 'Chuva', icon: 'WiRain', windSpeed: 20 },
    winter: { maxTemp: 15.5, minTemp: 8.0, precipitation: 100, condition: 'Nublado', icon: 'WiCloudy', windSpeed: 25 },
    spring: { maxTemp: 22.0, minTemp: 14.0, precipitation: 30, condition: 'Maioritariamente soalheiro', icon: 'WiDaySunny', windSpeed: 15 },
  };

  const seasonData = climateData[season];
  return {
    city: cityName,
    ...seasonData,
    humidity: 70,
    apparentTemp: (seasonData.maxTemp + seasonData.minTemp) / 2,
  };
};

// ── localStorage helpers ─────────────────────────────────────────────────
const saveToLocalStorage = (key, data) => {
  try {
    if (key === STORAGE_KEYS.WEATHER_HISTORY) {
      const limitedData = data.slice(-MAX_HISTORY_ITEMS);
      localStorage.setItem(key, JSON.stringify(limitedData));
    } else if (key === STORAGE_KEYS.WEATHER_CACHE) {
      const now = Date.now();
      const cacheData = Object.entries(data).reduce((acc, [cacheKey, cacheValue]) => {
        if (now - cacheValue.timestamp < MAX_CACHE_AGE) acc[cacheKey] = cacheValue;
        return acc;
      }, {});

      const limitedCache = Object.entries(cacheData)
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(0, MAX_CACHE_ITEMS)
        .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});

      localStorage.setItem(key, JSON.stringify(limitedCache));
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Erro ao salvar no localStorage (${key}):`, error);
  }
};

const getFromLocalStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Erro ao ler do localStorage (${key}):`, error);
    return defaultValue;
  }
};

// ════════════════════════════════════════════════════════════════════════════
// Sub-componentes visuais (small, focused, styled via weather.css v3)
// ════════════════════════════════════════════════════════════════════════════

/** Skeleton genérico com shimmer */
const Skeleton = ({ width = '100%', height = 16, radius = 8, className = '' }) => (
  <span
    className={`gm-skel ${className}`}
    style={{ width, height, borderRadius: radius }}
    aria-hidden="true"
  />
);

/** Card de estatística com label + valor + ícone */
const StatCard = ({ icon: Icon, label, value, unit, accent = 'brand' }) => (
  <div className={`gm-stat-card gm-stat-card--${accent}`}>
    <span className="gm-stat-card__icon" aria-hidden="true">
      <Icon size={18} strokeWidth={1.75} />
    </span>
    <span className="gm-stat-card__label">{label}</span>
    <span className="gm-stat-card__value">
      {value}
      {unit && <span className="gm-stat-card__unit">{unit}</span>}
    </span>
  </div>
);

/** Card de dia da previsão (scroll horizontal mobile, grid desktop) */
const ForecastDayCard = ({ day, isSelected, onClick, convertTemp }) => {
  const IconComp = LUCIDE_ICON_MAP[day.iconName] || Cloud;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`gm-forecast-card${isSelected ? ' gm-forecast-card--active' : ''}`}
      aria-label={`${day.date}, máxima ${convertTemp(day.maxTemp)} graus, mínima ${convertTemp(day.minTemp)} graus`}
      aria-pressed={isSelected}
    >
      <span className="gm-forecast-card__day">{day.date}</span>
      <span className="gm-forecast-card__icon" aria-hidden="true">
        <IconComp size={28} strokeWidth={1.6} />
      </span>
      <span className="gm-forecast-card__temps">
        <span className="gm-forecast-card__max">{convertTemp(day.maxTemp)}°</span>
        <span className="gm-forecast-card__min">{convertTemp(day.minTemp)}°</span>
      </span>
      <span className="gm-forecast-card__rain" aria-label={`${day.precipitation}% de probabilidade de chuva`}>
        <Droplets size={12} strokeWidth={2} />
        {day.precipitation}%
      </span>
    </button>
  );
};

/** Linha do histórico de cidades */
const HistoryItem = ({ item, onClick }) => {
  const dateStr = useMemo(() => {
    if (!item.timestamp) return '';
    const d = new Date(item.timestamp);
    return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  }, [item.timestamp]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="gm-history-item"
      aria-label={`Pesquisar novamente ${item.city}`}
    >
      <span className="gm-history-item__icon" aria-hidden="true">
        <MapPin size={16} strokeWidth={1.75} />
      </span>
      <span className="gm-history-item__body">
        <span className="gm-history-item__city">{item.city}</span>
        <span className="gm-history-item__meta">
          {item.admin1 ? `${item.admin1} · ` : ''}
          {dateStr || 'Recente'}
        </span>
      </span>
      <ChevronRight size={16} strokeWidth={1.75} className="gm-history-item__chevron" />
    </button>
  );
};

/** Estado vazio (sem cidade selecionada) */
const EmptyState = () => (
  <div className="gm-empty">
    <div className="gm-empty__icon" aria-hidden="true">
      <Compass size={40} strokeWidth={1.5} />
    </div>
    <h3 className="gm-empty__title">Pesquise uma cidade para começar</h3>
    <p className="gm-empty__text">
      Condições atuais, previsões para 15 dias, mapas climáticos e sugestões
      de viagem para qualquer destino do mundo.
    </p>
  </div>
);

/** Estado de erro */
const ErrorState = ({ onRetry }) => (
  <div className="gm-error">
    <div className="gm-error__icon" aria-hidden="true">
      <AlertCircle size={36} strokeWidth={1.6} />
    </div>
    <h3 className="gm-error__title">Não foi possível carregar a meteorologia</h3>
    <p className="gm-error__text">
      Verifique a sua ligação à internet ou tente uma cidade diferente.
    </p>
    <button type="button" className="gm-btn gm-btn--primary" onClick={onRetry}>
      <RefreshCw size={16} strokeWidth={2} />
      Tentar novamente
    </button>
  </div>
);

/** Skeleton de carregamento inicial */
const LoadingSkeleton = () => (
  <div className="gm-weather-skel" aria-busy="true" aria-live="polite">
    <div className="gm-weather-skel__hero">
      <Skeleton width="60%" height={20} />
      <Skeleton width="40%" height={48} radius={12} className="gm-mt-3" />
      <Skeleton width="80%" height={14} className="gm-mt-3" />
      <div className="gm-weather-skel__hero-stats">
        <Skeleton width={80} height={64} radius={14} />
        <Skeleton width={80} height={64} radius={14} />
        <Skeleton width={80} height={64} radius={14} />
      </div>
    </div>
    <div className="gm-weather-skel__row">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Skeleton key={i} width={100} height={120} radius={16} />
      ))}
    </div>
    <div className="gm-weather-skel__grid">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width="100%" height={88} radius={16} />
      ))}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// Página principal
// ════════════════════════════════════════════════════════════════════════════
const WeatherPage = () => {
  const { setWeather, isLoading: ctxLoading, setIsLoading: setCtxLoading } = useWeather();
  const toast = useToast();

  // ── State ──
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  // Real trips fetched from the backend. We do NOT use the
  // local TravelsData mock anymore — the user explicitly
  // requested that the app only show real trips. We pull the
  // user's public trips via /trips/user/{id}/public; if the
  // user is not logged in we fall back to /trips/public-feed
  // (which is permitAll and shows the latest 20 public trips).
  const [pastTrips, setPastTrips] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [futureWeather, setFutureWeather] = useState(null);
  const [userLocation, setUserLocation] = useState({ city: 'Lisboa', lat: 38.7167, lon: -9.1333 });
  const [searchCity, setSearchCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [futureDate, setFutureDate] = useState('');
  const [searchHistory, setSearchHistory] = useState(() => getFromLocalStorage(STORAGE_KEYS.WEATHER_HISTORY));
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [showClimateInfo, setShowClimateInfo] = useState(false);
  const [unit, setUnit] = useState('C');
  const [showAllDays, setShowAllDays] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  // Round 36 — Weather flicker fix:
  // geolocationReady fica a false enquanto o navigator.geolocation está
  // a resolver (típico 200ms-1.5s). Enquanto for false, o useEffect de
  // fetchWeather NÃO corre — assim a meteo de Lisboa (default) nunca
  // pisca antes de a meteo da localização real chegar. Quando a
  // geolocation termina (resolve OU falha), geolocationReady passa a
  // true e o fetchWeather corre uma única vez com a localização final.
  const [geolocationReady, setGeolocationReady] = useState(false);

  const currentWeatherRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // ── Future travels do localStorage ──
  const [futureTravels, setFutureTravels] = useState(() => {
    const travels = getFromLocalStorage(STORAGE_KEYS.FUTURE_TRAVELS);
    saveToLocalStorage(STORAGE_KEYS.FUTURE_TRAVELS, travels);
    return travels;
  });

  // ── Persistência: histórico ──
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.WEATHER_HISTORY, searchHistory);
  }, [searchHistory]);

  // ── Persistência: viagens futuras (sincronização entre tabs) ──
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedTravels = getFromLocalStorage(STORAGE_KEYS.FUTURE_TRAVELS);
      setFutureTravels(updatedTravels);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ── Past trips: pull real trips from the backend ──
  // We do NOT use the local TravelsData mock fixture here — the
  // "viagens passadas" card should reflect the user's actual
  // history. If the user is logged in we hit /trips/user/{id}/public
  // (their public trips); otherwise we fall back to /trips/public-feed
  // (the latest 20 public trips) so the section is never empty
  // when there is any data in the DB. Best-effort: failures just
  // leave the list empty.
  useEffect(() => {
    let cancelled = false;
    const loadPastTrips = async () => {
      try {
        const stored = (() => {
          try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
        })();
        const userId = stored?.id;
        const res = userId
          ? await api.get(`/trips/user/${userId}/public`, { params: { page: 0, size: 20 } })
          : await api.get('/trips/public-feed', { params: { page: 0, size: 20 } });
        if (cancelled) return;
        const list = (res.data && Array.isArray(res.data.content)) ? res.data.content : [];
        setPastTrips(list);
      } catch (err) {
        if (!cancelled) setPastTrips([]);
      }
    };
    loadPastTrips();
    return () => { cancelled = true; };
  }, []);

  // ── Sugestões debounced (250ms) ──
  const fetchCitySuggestions = useCallback(async (query) => {
    if (!query || query.trim() === '' || normalizeCityName(query).length < 2) {
      setCitySuggestions([]);
      return;
    }
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt`;
      const response = await axios.get(url);
      const data = response.data;
      if (data.results) {
        const filtered = data.results
          .filter((r) => isValidCoordinate(r.latitude, r.longitude))
          .map((r) => ({
            name: r.name,
            country: r.country || 'Desconhecido',
            admin1: r.admin1 || 'Região não especificada',
            lat: r.latitude,
            lon: r.longitude,
          }));
        setCitySuggestions(filtered);
      } else {
        setCitySuggestions([]);
      }
    } catch (error) {
      console.error('Erro ao obter sugestões:', error);
      setCitySuggestions([]);
    }
  }, []);

  const handleSearchInput = (raw) => {
    if (raw.length > 50) {
      toast.danger('Nome da cidade não pode exceder 50 caracteres!');
      return;
    }
    const sanitized = raw
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '');

    if (sanitized && !/^[a-zA-ZÀ-ÿ\s,.\-']+$/.test(sanitized)) {
      toast.danger('Nome da cidade contém caracteres não permitidos!');
      return;
    }
    setSearchCity(sanitized);
    setSearchError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCitySuggestions(sanitized), 250);
  };

  // ── Geolocalização (uma vez ao montar) ──
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.info('Geolocalização não suportada pelo navegador.');
      return;
    }
    setIsResolvingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (!isValidCoordinate(latitude, longitude)) {
          setIsResolvingLocation(false);
          setGeolocationReady(true);
          return;
        }
        try {
          // Round 59+ — Open-Meteo doesn't have a reverse-geocoding
          // endpoint, so we use OpenStreetMap's Nominatim instead.
          // Nominatim requires a descriptive User-Agent per its usage
          // policy, otherwise it returns 403 / CORS errors.
          const response = await axios.get(
            'https://nominatim.openstreetmap.org/reverse',
            {
              params: {
                lat: latitude,
                lon: longitude,
                format: 'json',
                'accept-language': 'pt',
                zoom: 10,
              },
              headers: { 'Accept-Language': 'pt' },
            }
          );
          const a = response.data?.address || {};
          const city = a.city || a.town || a.village || a.county || a.municipality || a.state || 'Desconhecida';
          const admin1 = a.state || a.region || '';
          const displayCity = `A Sua Localização${city !== 'Desconhecida' ? ` (${city}${admin1 ? `, ${admin1}` : ''})` : ''}`;
          setUserLocation({ lat: latitude, lon: longitude, city: displayCity, admin1 });
        } catch (error) {
          console.error('Erro ao obter nome da cidade:', error.message);
          setUserLocation({ lat: latitude, lon: longitude, city: 'A Sua Localização' });
        } finally {
          setIsResolvingLocation(false);
          setGeolocationReady(true);
        }
      },
      (error) => {
        console.error('Erro de geolocalização:', error.message);
        setIsResolvingLocation(false);
        setGeolocationReady(true);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Obter coordenadas para uma cidade ──
  const getCoordinates = useCallback(async (city) => {
    if (!city || typeof city !== 'string' || city.trim() === '' || city.includes('A Sua Localização')) return null;
    const normalizedCity = normalizeCityName(city);
    if (!normalizedCity || normalizedCity.length < 2) return null;
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=pt`;
      const response = await axios.get(url);
      if (!response.data.results || response.data.results.length === 0) return null;
      const bestMatch = response.data.results.find((r) => {
        const rn = normalizeCityName(r.name);
        return rn === normalizedCity || rn.includes(normalizedCity);
      }) || response.data.results[0];

      const coords = {
        lat: bestMatch.latitude,
        lon: bestMatch.longitude,
        name: bestMatch.name,
        admin1: bestMatch.admin1 || '',
        country: bestMatch.country || '',
      };
      if (!isValidCoordinate(coords.lat, coords.lon)) return null;
      return coords;
    } catch (error) {
      console.error('Erro ao obter coordenadas:', error);
      toast.danger('Erro ao obter coordenadas da cidade. Tente novamente.');
      return null;
    }
  }, [toast]);

  // ── Retry helper para chamadas instáveis ──
  const fetchWithRetry = useCallback(async (url, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await axios.get(url);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }, []);

  // ── Buscar meteorologia ──
  const fetchWeather = useCallback(async (location, travel = null) => {
    setCtxLoading(true);
    setSearchError(null);
    try {
      let lat;
      let lon;
      let cityName;
      let admin1;
      let isGeolocation = false;

      if (location.lat && location.lon && isValidCoordinate(location.lat, location.lon)) {
        lat = location.lat;
        lon = location.lon;
        cityName = location.city || 'A Sua Localização';
        admin1 = location.admin1 || '';
        isGeolocation = cityName.includes('A Sua Localização');
      } else {
        if (!location.city || location.city.trim() === '') {
          throw new Error('Por favor, insira um nome de cidade válido.');
        }
        const coords = await getCoordinates(location.city);
        if (!coords) {
          throw new Error(`Cidade "${location.city}" não encontrada. Tente um nome diferente ou verifique a ortografia.`);
        }
        lat = coords.lat;
        lon = coords.lon;
        cityName = coords.name;
        admin1 = coords.admin1 || '';
      }

      // Cache
      const cacheKey = `weather_${normalizeCityName(cityName)}_${lat}_${lon}`;
      const cachedData = getFromLocalStorage(STORAGE_KEYS.WEATHER_CACHE, {})[cacheKey];
      const isCacheValid = cachedData?.timestamp && (Date.now() - cachedData.timestamp < MAX_CACHE_AGE);

      if (isCacheValid && !travel && !futureDate) {
        setWeatherData({ ...cachedData.weatherData });
        setWeather({ ...cachedData.weatherData });
        setHourlyData([...cachedData.hourlyData]);
        setForecastData([...cachedData.forecastData]);
        return;
      }

      let isFutureTravelOutOfRange = false;
      let forecast = [];
      let targetMonth = new Date().getMonth() + 1;

      if (travel) {
        const startDate = new Date(travel.startDate);
        if (isNaN(startDate)) throw new Error('Data de viagem inválida.');
        targetMonth = startDate.getMonth() + 1;
        const maxForecastDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        if (startDate > maxForecastDate) isFutureTravelOutOfRange = true;
      } else if (futureDate) {
        const future = new Date(futureDate);
        if (isNaN(future)) throw new Error('Data futura inválida.');
        targetMonth = future.getMonth() + 1;
        const maxForecastDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        if (future > maxForecastDate) isFutureTravelOutOfRange = true;
      }

      const setClimateFallback = (message) => {
        const climate = estimateClimate(cityName, lat, targetMonth);
        const data = {
          city: isGeolocation
            ? cityName
            : (admin1 && admin1.toLowerCase() !== cityName.toLowerCase())
              ? `${cityName}, ${admin1}`
              : cityName,
          temperature: parseFloat(((climate.maxTemp + climate.minTemp) / 2).toFixed(1)),
          maxTemp: climate.maxTemp,
          minTemp: climate.minTemp,
          apparentTemp: parseFloat(climate.apparentTemp.toFixed(1)),
          humidity: climate.humidity,
          windSpeed: climate.windSpeed,
          precipitationProbability: climate.precipitation,
          condition: climate.condition,
          iconName: climate.icon,
        };
        setWeatherData(data);
        setWeather({ ...data });
        if (message) toast.info(message);
      };

      if (!isFutureTravelOutOfRange) {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,precipitation_probability&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,weather_code,precipitation_probability_max,wind_speed_10m_max&forecast_days=16`;
          const response = await fetchWithRetry(url);
          if (!response.data || !response.data.current) {
            throw new Error('Dados meteorológicos inválidos recebidos da API.');
          }

          const current = response.data.current;
          const hourly = response.data.hourly;
          const daily = response.data.daily;
          const currentWeatherCode = current.wind_speed_10m > 30 ? 15 : current.weather_code;
          // Round 81 — pass the actual current temperature
          // and precipitation chance into `refineIcon` so
          // the hero can promote a low-rain, warm hour from
          // "Nublado" to "Céu limpo" (matches what the IPMA
          // card shows for a 26°C day with 0% rain).
          const weatherInfo = refineIcon(
            getWeatherDescription(currentWeatherCode),
            currentWeatherCode,
            current.precipitation_probability,
            current.temperature_2m
          );

          const data = {
            city: isGeolocation
              ? cityName
              : (admin1 && admin1.toLowerCase() !== cityName.toLowerCase())
                ? `${cityName}, ${admin1}`
                : cityName,
            temperature: parseFloat(current.temperature_2m.toFixed(1)),
            maxTemp: daily.temperature_2m_max[0],
            minTemp: daily.temperature_2m_min[0],
            apparentTemp: parseFloat(current.apparent_temperature.toFixed(1)),
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            precipitationProbability: current.precipitation_probability,
            condition: weatherInfo.description,
            iconName: weatherInfo.icon,
          };

          setWeatherData(data);
          setWeather({ ...data });

          const hourlySlice = hourly.time.map((time, index) => {
            const date = new Date(time);
            const hourCode = hourly.wind_speed_10m[index] > 30 ? 15 : hourly.weather_code[index];
            // Round 81 — per-hour refinement: an hour can be
            // "code 3 (nublado) but actually 0% rain and 25°C"
            // and we want a sun + cloud icon, not a flat
            // cloud. The temperature + precip chance are
            // already on the row so refineIcon is cheap.
            const hourInfo = refineIcon(
              getWeatherDescription(hourCode),
              hourCode,
              hourly.precipitation_probability[index],
              hourly.temperature_2m[index]
            );
            return {
              time: date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              date: date.toISOString().split('T')[0],
              temperature: parseFloat(hourly.temperature_2m[index].toFixed(1)),
              apparentTemp: parseFloat(hourly.apparent_temperature[index].toFixed(1)),
              precipitationProbability: hourly.precipitation_probability[index],
              windSpeed: parseFloat(hourly.wind_speed_10m[index].toFixed(1)),
              condition: hourInfo.description,
              iconName: hourInfo.icon,
            };
          });
          setHourlyData(hourlySlice);

          forecast = daily.time.slice(0, 15).map((time, index) => {
            const dayCode = daily.wind_speed_10m_max[index] > 30 ? 15 : daily.weather_code[index];
            // Round 81 — daily refinement using the day's
            // max temperature and the precipitation_max
            // probability. This is what makes the IPMA-style
            // "every day with 0% rain shows the sun" look
            // possible: we override Open-Meteo's pessimistic
            // cloud codes (2/3) with the sun when the actual
            // precip forecast is near zero and the day is
            // warm.
            const forecastInfo = refineIcon(
              getWeatherDescription(dayCode),
              dayCode,
              daily.precipitation_probability_max[index],
              daily.temperature_2m_max[index]
            );
            return {
              date: new Date(time).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' }),
              dateISO: time,
              maxTemp: parseFloat(daily.temperature_2m_max[index].toFixed(1)),
              minTemp: parseFloat(daily.temperature_2m_min[index].toFixed(1)),
              apparentTemp: parseFloat(daily.apparent_temperature_max[index].toFixed(1)),
              precipitation: daily.precipitation_probability_max[index],
              windSpeed: daily.wind_speed_10m_max[index],
              condition: forecastInfo.description,
              iconName: forecastInfo.icon,
              alert: daily.precipitation_probability_max[index] > 80 ? '⚠️ Alta probabilidade de chuva' : null,
            };
          });

          // Guardar em cache (iconName string, sem componente React)
          const cacheData = getFromLocalStorage(STORAGE_KEYS.WEATHER_CACHE, {});
          cacheData[cacheKey] = {
            weatherData: { ...data },
            hourlyData: hourlySlice,
            forecastData: forecast,
            timestamp: Date.now(),
          };
          saveToLocalStorage(STORAGE_KEYS.WEATHER_CACHE, cacheData);
          setForecastData(forecast);
        } catch (error) {
          console.error('Erro ao obter dados meteorológicos:', error);
          setClimateFallback('Usando dados climatológicos estimados devido a erro na API.');
        }
      } else {
        setClimateFallback(`Usando dados climatológicos estimados para ${cityName} (${targetMonth}º mês).`);
      }

      if (travel) {
        const startDate = new Date(travel.startDate).toISOString().split('T')[0];
        const endDate = new Date(travel.endDate).toISOString().split('T')[0];
        forecast = forecast.filter((day) => day.dateISO >= startDate && day.dateISO <= endDate);
        setForecastData(forecast);
      }

      if (futureDate) {
        const selectedDateStr = new Date(futureDate).toISOString().split('T')[0];
        if (isFutureTravelOutOfRange) {
          const climate = estimateClimate(cityName, lat, new Date(futureDate).getMonth() + 1);
          setFutureWeather({
            date: selectedDateStr,
            maxTemp: climate.maxTemp,
            minTemp: climate.minTemp,
            apparentTemp: climate.apparentTemp,
            precipitation: climate.precipitation,
            windSpeed: climate.windSpeed,
            condition: climate.condition,
            iconName: climate.icon,
            alert: climate.precipitation > 80 ? '⚠️ Alta probabilidade de chuva' : null,
          });
        } else {
          const idx = forecast.findIndex((d) => d.dateISO === selectedDateStr);
          if (idx !== -1) setFutureWeather({ ...forecast[idx] });
          else setFutureWeather(null);
        }
      } else {
        setFutureWeather(null);
      }

      const initialDay = travel
        ? new Date(travel.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setSelectedDay(initialDay);

      if (!isGeolocation && !isFutureTravelOutOfRange) {
        const normalizedCity = normalizeCityName(cityName);
        setSearchHistory((prev) => {
          if (prev.some((h) => normalizeCityName(h.city) === normalizedCity)) return prev;
          const stamped = [...prev, { city: cityName, lat, lon, admin1, timestamp: Date.now() }]
            .slice(-MAX_HISTORY_ITEMS);
          return stamped;
        });
      }
    } catch (error) {
      console.error('Erro ao buscar meteorologia:', error.message);
      setSearchError(error.message || 'Erro ao carregar meteorologia.');
      setWeatherData(null);
      setHourlyData([]);
      setForecastData([]);
      setFutureWeather(null);
    } finally {
      setCtxLoading(false);
    }
  }, [futureDate, getCoordinates, fetchWithRetry, setCtxLoading, setWeather, toast]);

  // ── Buscar meteorologia quando localização / viagem mudam ──
  // Round 36 — Weather flicker fix: gatekeeper no geolocationReady.
  // Enquanto a geolocation está a resolver, NÃO carregamos meteo
  // (assim não pisca a meteo de Lisboa antes da meteo da localização
  // real). Quando a geolocation resolve (ou falha), geolocationReady
  // passa a true e este useEffect corre uma única vez com a
  // localização final.
  useEffect(() => {
    if (!geolocationReady) return;
    if (userLocation && userLocation.city) {
      fetchWeather(userLocation, selectedTravel);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, selectedTravel, geolocationReady]);

  // ── Handlers ──
  const handleCitySearch = (e) => {
    e?.preventDefault?.();
    const trimmedCity = searchCity.trim();
    if (trimmedCity && normalizeCityName(trimmedCity).length >= 2) {
      setUserLocation({ city: trimmedCity });
      setSearchCity('');
      setCitySuggestions([]);
      setSelectedTravel(null);
    } else {
      toast.danger('Por favor, insira uma cidade válida (mínimo 2 caracteres).');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (!isValidCoordinate(suggestion.lat, suggestion.lon)) {
      toast.danger('Coordenadas inválidas para a cidade selecionada.');
      return;
    }
    setUserLocation({
      city: suggestion.name,
      lat: suggestion.lat,
      lon: suggestion.lon,
      admin1: suggestion.admin1,
    });
    setSearchCity('');
    setCitySuggestions([]);
    setSelectedTravel(null);
    toast.success(`Localização alterada para ${suggestion.name}`);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.danger('Geolocalização não suportada pelo navegador.');
      return;
    }
    setIsResolvingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (!isValidCoordinate(latitude, longitude)) {
          toast.danger('Coordenadas de geolocalização inválidas.');
          setIsResolvingLocation(false);
          return;
        }
        try {
          // Round 59+ — switched to Nominatim (OpenStreetMap) for
          // reverse geocoding. Same fallback behaviour as the
          // useEffect above — if the lookup fails, we still keep
          // the lat/lon and label it as "A Sua Localização".
          const response = await axios.get(
            'https://nominatim.openstreetmap.org/reverse',
            {
              params: {
                lat: latitude,
                lon: longitude,
                format: 'json',
                'accept-language': 'pt',
                zoom: 10,
              },
              headers: { 'Accept-Language': 'pt' },
            }
          );
          const a = response.data?.address || {};
          const city = a.city || a.town || a.village || a.county || a.municipality || a.state || 'Desconhecida';
          const admin1 = a.state || a.region || '';
          const displayCity = `A Sua Localização${city !== 'Desconhecida' ? ` (${city}${admin1 ? `, ${admin1}` : ''})` : ''}`;
          setUserLocation({ lat: latitude, lon: longitude, city: displayCity, admin1 });
          setSelectedTravel(null);
          toast.success('Localização atual obtida com sucesso!');
        } catch (error) {
          console.error('Erro ao obter nome da cidade:', error.message);
          setUserLocation({ lat: latitude, lon: longitude, city: 'A Sua Localização' });
          setSelectedTravel(null);
        } finally {
          setIsResolvingLocation(false);
        }
      },
      (error) => {
        setIsResolvingLocation(false);
        toast.danger('Não foi possível obter a localização. Tente novamente.');
      }
    );
  };

  const handleHistoryClick = (historyItem) => {
    if (!isValidCoordinate(historyItem.lat, historyItem.lon)) {
      toast.danger('Coordenadas inválidas no histórico.');
      return;
    }
    setUserLocation(historyItem);
    setSelectedTravel(null);
    setTimeout(() => {
      currentWeatherRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleFutureTravelClick = (travel) => {
    setUserLocation({ city: travel.city });
    setSelectedTravel(travel);
    setFutureDate(new Date(travel.startDate));
    setTimeout(() => {
      currentWeatherRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleTravelCityClick = (city) => {
    setUserLocation({ city });
    setSelectedTravel(null);
    setTimeout(() => {
      currentWeatherRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleFutureDateChange = (e) => {
    const date = new Date(e.target.value);
    if (date && !isNaN(date)) {
      setFutureDate(date);
      fetchWeather(userLocation, selectedTravel);
    } else {
      setFutureWeather(null);
      toast.danger('Data futura inválida.');
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day.dateISO);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    saveToLocalStorage(STORAGE_KEYS.WEATHER_HISTORY, []);
    toast.info('Histórico limpo.');
  };

  // ── Conversões / cálculos memoizados ──
  const convertTemperature = useCallback(
    (temp) => (unit === 'F' ? ((temp * 9) / 5 + 32).toFixed(1) : temp.toFixed(1)),
    [unit]
  );

  // ── Dia/noite para a animação do hero ──
  // Round 52 — determina se é dia ou noite para a animação de clima.
  // Usamos a hora local do visitante (06h–19h ≈ dia; resto ≈ noite).
  const isDayTime = useMemo(() => {
    const h = new Date().getHours();
    return h >= 6 && h < 20;
  }, []);

  const travelCities = useMemo(
    () => pastTrips
      .map((t) => t.city || t.cityName)
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i),
    [pastTrips]
  );

  const filteredHourlyData = useMemo(() => {
    const targetDate = selectedDay || new Date().toISOString().split('T')[0];
    return hourlyData.filter((d) => d.date === targetDate).slice(0, 24);
  }, [hourlyData, selectedDay]);

  const currentHourIndex = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDay && selectedDay !== today) return -1;
    const now = new Date();
    const currentTime = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    return filteredHourlyData.findIndex((d) => d.time === currentTime);
  }, [filteredHourlyData, selectedDay]);

  // ── Chart.js data/options (paleta v3) ──
  // Cores lidas em runtime dos tokens para que updates a tokens.css se propaguem.
  const readToken = (name, fallback) => {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  };
  const brandAccent = readToken('--gm-accent', '#FF9900');
  const brandInfo = readToken('--gm-info', '#007BFF');
  const brandSuccess = readToken('--gm-success', '#10A36B');
  const text3 = readToken('--gm-text-3', '#7A8194');

  // Round 80 — Helper to convert a hex colour like "#FF9900" to
  // an rgba() string with a given alpha (0..1). Chart.js v3+
  // does NOT honour the 8-character hex shorthand `#RRGGBBAA`
  // reliably (some renderers treat it as a 6-char solid colour,
  // which is why the previous "fill black" was happening on
  // the temperature chart — `#FF99001F` was being read as a
  // solid orange that overlapped the gray chart background
  // and looked black-ish). Using rgba() removes the ambiguity.
  //
  // Round 82 — extra defensive parsing. In production we hit
  // `rgba(249, 0, NaN, 0.45)` because the colour string was
  // coming through as `#F9` (3-char shorthand) or another
  // malformed value. `parseInt('', 16) === NaN`, which
  // Chart.js's `addColorStop` then refuses with the SyntaxError
  // we saw in the ErrorBoundary. Now we:
  //  - normalise to lowercase + trim
  //  - expand 3-char shorthand to 6-char (`#f9` → `#ff9900`)
  //  - validate all three channels are finite numbers
  //  - return a safe orange fallback if anything is still NaN
  const withAlpha = (hex, alpha) => {
    const fallback = `rgba(255, 153, 0, ${alpha})`;
    if (typeof hex !== 'string' || !hex) return fallback;
    let h = hex.trim().toLowerCase().replace('#', '');
    if (h.length === 3) {
      // Expand shorthand (#f9 → f9f900)
      h = h.split('').map((c) => c + c).join('');
    }
    if (h.length !== 6 || /[^0-9a-f]/.test(h)) return fallback;
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
      return fallback;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Round 80 — Returns a Chart.js `backgroundColor` function
  // that paints a vertical gradient (top = the brand colour
  // at 35% opacity, bottom = fully transparent). The gradient
  // is created in canvas coordinates so it scales correctly
  // when the chart resizes. Applied to the temperature chart
  // (orange) so the fill matches the "wind" style but in the
  // temperature's brand colour, exactly as the user asked.
  const verticalGradient = (color) => (context) => {
    try {
      const chart = context?.chart;
      const chartArea = chart?.chartArea;
      if (!chartArea) return withAlpha(color, 0.35);
      const ctx = chart.ctx;
      if (!ctx) return withAlpha(color, 0.35);
      const gradient = ctx.createLinearGradient(
        0, chartArea.top,
        0, chartArea.bottom
      );
      gradient.addColorStop(0, withAlpha(color, 0.45));
      gradient.addColorStop(1, withAlpha(color, 0.02));
      return gradient;
    } catch (err) {
      // Round 82 — last-resort fallback. If anything in the
      // gradient construction fails (malformed colour, missing
      // chartArea, etc.) we return a flat colour so the chart
      // still renders instead of crashing the page.
      return withAlpha(color, 0.35);
    }
  };

  const buildHourlyDataset = (color, valueKey, useGradient = false) => {
    const datasets = [
      {
        label: ' ',
        data: filteredHourlyData.map((d) => d[valueKey]),
        fill: true,
        borderColor: color,
        backgroundColor: useGradient
          ? verticalGradient(color)
          : withAlpha(color, 0.18),
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2.5,
      },
    ];
    if (currentHourIndex >= 0) {
      datasets.push({
        label: 'Agora',
        data: filteredHourlyData.map((_, idx) => (idx === currentHourIndex ? filteredHourlyData[currentHourIndex][valueKey] : null)),
        borderColor: 'rgba(0,0,0,0)',
        backgroundColor: 'rgba(0,0,0,0)',
        pointRadius: 8,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        showLine: false,
      });
    }
    return datasets;
  };

  const temperatureChartData = useMemo(
    () => ({
      labels: filteredHourlyData.map((d) => d.time),
      // Round 80 — pass `useGradient: true` so the temperature
      // chart gets the same gradient-fill treatment the user
      // asked for (orange, matching the wind style). The
      // previous behaviour rendered a near-opaque dark band
      // because Chart.js didn't honour the `#FF99001F` 8-char
      // hex alpha; the new buildHourlyDataset uses rgba() +
      // canvas gradients and produces a proper fade-to-clear
      // vertical gradient.
      datasets: buildHourlyDataset(brandAccent, 'temperature', true),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredHourlyData, currentHourIndex, brandAccent]
  );

  const precipitationChartData = useMemo(
    () => ({
      labels: filteredHourlyData.map((d) => d.time),
      datasets: buildHourlyDataset(brandInfo, 'precipitationProbability'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredHourlyData, currentHourIndex, brandInfo]
  );

  const windChartData = useMemo(
    () => ({
      labels: filteredHourlyData.map((d) => d.time),
      datasets: buildHourlyDataset(brandSuccess, 'windSpeed'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredHourlyData, currentHourIndex, brandSuccess]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: text3, maxTicksLimit: 12, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(10, 14, 26, 0.06)' },
          ticks: { color: text3, font: { size: 11 } },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10, 14, 26, 0.92)',
          padding: 10,
          cornerRadius: 8,
          titleFont: { size: 12, weight: 600 },
          bodyFont: { size: 12 },
        },
      },
    }),
    [text3]
  );

  // ── Forecast filtrado ──
  const displayedForecastData = useMemo(() => {
    if (selectedTravel) return forecastData;
    return showAllDays ? forecastData : forecastData.slice(0, 10);
  }, [forecastData, selectedTravel, showAllDays]);

  const forecastTitle = useMemo(() => {
    if (selectedTravel) {
      const start = new Date(selectedTravel.startDate).toLocaleDateString('pt-PT');
      const end = new Date(selectedTravel.endDate).toLocaleDateString('pt-PT');
      return `Previsão de ${start} a ${end}`;
    }
    return showAllDays ? 'Previsão para os próximos 15 dias' : 'Previsão para os próximos 10 dias';
  }, [selectedTravel, showAllDays]);

  // ── Sugestão climática dinâmica (resumo premium) ──
  const climateInsight = useMemo(() => {
    if (!weatherData) return '';
    const temp = weatherData.temperature;
    const rain = weatherData.precipitationProbability;
    const wind = weatherData.windSpeed;
    const cond = weatherData.condition?.toLowerCase() || '';
    const lines = [];
    if (temp >= 25) lines.push('☀️ Dia quente — hidrate-se e use protetor solar.');
    else if (temp <= 10) lines.push('🧥 Temperaturas baixas — agasalhe-se bem.');
    else lines.push('🌤️ Temperatura amena — ideal para atividades ao ar livre.');
    if (rain > 70) lines.push('🌧️ Probabilidade elevada de chuva — leve guarda-chuva.');
    else if (rain > 30) lines.push('🌦️ Possibilidade de chuva — convém um agasalho impermeável.');
    if (wind > 30) lines.push('💨 Vento forte — atenção a atividades no exterior.');
    if (cond.includes('trovoada')) lines.push('⛈️ Risco de trovoada — evite zonas expostas.');
    return lines.join(' ');
  }, [weatherData]);

  // ── Render ──
  return (
    <PageContainer size="xl">
      {/* Header removed (Round 33 cleanup). Search bar kept below. */}
      <div className="gm-weather-search-wrap">
        <form className="gm-weather-search" onSubmit={handleCitySearch} role="search">
          <div className="gm-weather-search__field">
            <span className="gm-weather-search__icon" aria-hidden="true">
              <Search size={18} strokeWidth={1.75} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchCity}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Pesquisar cidade (ex.: Torres Vedras)"
              className="gm-weather-search__input"
              maxLength={50}
              aria-label="Pesquisar cidade"
            />
            {searchCity && (
              <button
                type="button"
                onClick={() => { setSearchCity(''); setCitySuggestions([]); }}
                className="gm-weather-search__clear"
                aria-label="Limpar pesquisa"
              >
                <IconX size={14} strokeWidth={2} />
              </button>
            )}
            <button type="submit" className="gm-weather-search__submit" aria-label="Pesquisar">
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="gm-weather-search__geo"
            disabled={isResolvingLocation}
            aria-label="Usar localização atual"
          >
            {isResolvingLocation
              ? <Loader2 size={16} strokeWidth={2} className="gm-spin" />
              : <MapPin size={16} strokeWidth={1.75} />}
            <span>Usar localização atual</span>
          </button>

          {citySuggestions.length > 0 && (
            <ul className="gm-weather-search__suggestions" role="listbox">
              {citySuggestions.map((s, idx) => (
                <li key={`${s.name}-${s.lat}-${idx}`} role="option" aria-selected="false">
                  <button
                    type="button"
                    className="gm-weather-search__suggestion"
                    onClick={() => handleSuggestionClick(s)}
                  >
                    <span className="gm-weather-search__suggestion-icon" aria-hidden="true">
                      <MapPin size={14} strokeWidth={1.75} />
                    </span>
                    <span className="gm-weather-search__suggestion-body">
                      <strong>{s.name}</strong>
                      {s.admin1 && s.admin1.toLowerCase() !== s.name.toLowerCase() && (
                        <span className="gm-weather-search__suggestion-sub"> · {s.admin1}</span>
                      )}
                    </span>
                    <span className="gm-weather-search__suggestion-country">{s.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>

      {/* ══════════ BODY ══════════ */}
      <div className="gm-weather-body">
      {ctxLoading || !geolocationReady ? (
        <LoadingSkeleton />
      ) : searchError && !weatherData ? (
        <ErrorState onRetry={() => fetchWeather(userLocation, selectedTravel)} />
      ) : !weatherData ? (
        <Section>
          <EmptyState />
        </Section>
      ) : (
        <Stack gap="lg">
          {/* ── Hero card ── */}
          <Section tight>
            <div ref={currentWeatherRef} className="gm-weather-hero">
              <div className="gm-weather-hero__bg" aria-hidden="true">
                <WeatherAnimation weatherIconName={weatherData.iconName} isDay={isDayTime} />
              </div>
              <div className="gm-weather-hero__content">
                <div className="gm-weather-hero__top">
                  <div className="gm-weather-hero__location">
                    <span className="gm-weather-hero__location-icon" aria-hidden="true">
                      <MapPin size={14} strokeWidth={1.75} />
                    </span>
                    <span>{weatherData.city}</span>
                  </div>
                  {selectedTravel && (
                    <span className="gm-weather-hero__badge">
                      <Calendar size={12} strokeWidth={2} />
                      {new Date(selectedTravel.startDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>

                <div className="gm-weather-hero__main">
                  <div className="gm-weather-hero__temp">
                    {convertTemperature(weatherData.temperature)}<span className="gm-weather-hero__unit">°{unit}</span>
                  </div>
                  <div className="gm-weather-hero__cond">
                    <span className="gm-weather-hero__cond-icon" aria-hidden="true">
                      {(() => {
                        const IconComp = LUCIDE_ICON_MAP[weatherData.iconName] || Cloud;
                        return <IconComp size={32} strokeWidth={1.5} />;
                      })()}
                    </span>
                    <span>{weatherData.condition}</span>
                  </div>
                  {weatherData.maxTemp && weatherData.minTemp && (
                    <div className="gm-weather-hero__minmax">
                      <span className="gm-weather-hero__max">
                        <Thermometer size={14} strokeWidth={2} />
                        Máx {convertTemperature(weatherData.maxTemp)}°
                      </span>
                      <span className="gm-weather-hero__divider" />
                      <span className="gm-weather-hero__min">
                        <Thermometer size={14} strokeWidth={2} />
                        Mín {convertTemperature(weatherData.minTemp)}°
                      </span>
                    </div>
                  )}
                </div>

                <div className="gm-weather-hero__stats">
                  <div className="gm-weather-hero__stat">
                    <Droplets size={16} strokeWidth={1.75} />
                    <span className="gm-weather-hero__stat-label">Chuva</span>
                    <span className="gm-weather-hero__stat-value">{weatherData.precipitationProbability ?? 0}%</span>
                  </div>
                  <div className="gm-weather-hero__stat">
                    <Wind size={16} strokeWidth={1.75} />
                    <span className="gm-weather-hero__stat-label">Vento</span>
                    <span className="gm-weather-hero__stat-value">{Math.round(weatherData.windSpeed)} km/h</span>
                  </div>
                  <div className="gm-weather-hero__stat">
                    <Thermometer size={16} strokeWidth={1.75} />
                    <span className="gm-weather-hero__stat-label">Sensação</span>
                    <span className="gm-weather-hero__stat-value">{convertTemperature(weatherData.apparentTemp)}°</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Forecast ── */}
          <Section>
            <SectionHeader
              icon={Calendar}
              title={forecastTitle}
              count={displayedForecastData.length}
              action={
                !selectedTravel && forecastData.length > 10 && (
                  <button
                    type="button"
                    className="gm-btn gm-btn--ghost gm-btn--sm"
                    onClick={() => setShowAllDays(!showAllDays)}
                  >
                    {showAllDays ? 'Ver menos' : 'Ver mais 5 dias'}
                  </button>
                )
              }
            />
            <div className="gm-forecast-rail" role="list">
              {displayedForecastData.map((day, index) => (
                <div role="listitem" key={day.dateISO || index} className="gm-forecast-rail__item">
                  <ForecastDayCard
                    day={day}
                    isSelected={selectedDay === day.dateISO}
                    onClick={() => handleDayClick(day)}
                    convertTemp={convertTemperature}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* ── Details grid ── */}
          <Section>
            <SectionHeader icon={BarChart3} title="Detalhes" />
            <Grid min={180} gap="md">
              <StatCard
                icon={Droplets}
                label="Humidade"
                value={`${weatherData.humidity ?? 0}`}
                unit="%"
                accent="brand"
              />
              <StatCard
                icon={Wind}
                label="Vento"
                value={`${Math.round(weatherData.windSpeed)}`}
                unit=" km/h"
                accent="accent"
              />
              <StatCard
                icon={Thermometer}
                label="Sensação térmica"
                value={convertTemperature(weatherData.apparentTemp)}
                unit="°"
                accent="success"
              />
              <StatCard
                icon={Eye}
                label="Precipitação"
                value={`${weatherData.precipitationProbability ?? 0}`}
                unit="%"
                accent="brand"
              />
            </Grid>
          </Section>

          {/* ── Hourly charts ── */}
          {hourlyData.length > 0 && (
            <Section>
              <SectionHeader
                icon={Clock}
                title={selectedDay
                  ? `Previsão horária · ${new Date(selectedDay).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}`
                  : 'Previsão horária · Hoje'}
                action={
                  <div className="gm-chart-legend">
                    <span className="gm-chart-legend__item">
                      <span className="gm-chart-legend__dot" style={{ background: brandAccent }} />
                      Temperatura
                    </span>
                    <span className="gm-chart-legend__item">
                      <span className="gm-chart-legend__dot" style={{ background: brandInfo }} />
                      Chuva
                    </span>
                    <span className="gm-chart-legend__item">
                      <span className="gm-chart-legend__dot" style={{ background: brandSuccess }} />
                      Vento
                    </span>
                  </div>
                }
              />
              <div className="gm-chart-grid">
                <div className="gm-chart-card">
                  <h4 className="gm-chart-card__title">Temperatura</h4>
                  <div className="gm-chart-card__canvas">
                    <Line data={temperatureChartData} options={chartOptions} />
                  </div>
                </div>
                <div className="gm-chart-card">
                  <h4 className="gm-chart-card__title">Probabilidade de chuva</h4>
                  <div className="gm-chart-card__canvas">
                    <Line data={precipitationChartData} options={chartOptions} />
                  </div>
                </div>
                <div className="gm-chart-card">
                  <h4 className="gm-chart-card__title">Velocidade do vento</h4>
                  <div className="gm-chart-card__canvas">
                    <Line data={windChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* ── Climate insight ── */}
          {climateInsight && (
            <Section>
              <button
                type="button"
                className={`gm-climate-info${showClimateInfo ? ' gm-climate-info--open' : ''}`}
                onClick={() => setShowClimateInfo(!showClimateInfo)}
                aria-expanded={showClimateInfo}
                aria-controls="climate-info-body"
              >
                <span className="gm-climate-info__icon" aria-hidden="true">
                  <Sparkles size={20} strokeWidth={1.75} />
                </span>
                <span className="gm-climate-info__body">
                  <span className="gm-climate-info__title">Sugestão de viagem</span>
                  <span className="gm-climate-info__sub">Toque para {showClimateInfo ? 'fechar' : 'ver detalhes'}</span>
                </span>
                <ChevronRight
                  size={18}
                  strokeWidth={1.75}
                  className={`gm-climate-info__chevron${showClimateInfo ? ' gm-climate-info__chevron--open' : ''}`}
                />
              </button>
              {showClimateInfo && (
                <div id="climate-info-body" className="gm-climate-info__panel">
                  <p className="gm-climate-info__text">{climateInsight}</p>
                </div>
              )}
            </Section>
          )}

          {/* ── Future date picker ── */}
          {futureWeather && (
            <Section>
              <SectionHeader icon={Calendar} title="Clima na data selecionada" />
              <div className="gm-future-card">
                <span className="gm-future-card__date">
                  {new Date(futureWeather.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <div className="gm-future-card__row">
                  <span className="gm-future-card__temp">
                    {convertTemperature((futureWeather.maxTemp + futureWeather.minTemp) / 2)}°
                  </span>
                  <span className="gm-future-card__cond">{futureWeather.condition}</span>
                </div>
                {futureWeather.alert && (
                  <span className="gm-future-card__alert">
                    <AlertCircle size={14} strokeWidth={2} /> {futureWeather.alert}
                  </span>
                )}
              </div>
            </Section>
          )}

          {/* ── Date picker input ── */}
          <Section>
            <SectionHeader icon={Calendar} title="Pesquisar data específica" />
            <div className="gm-date-picker">
              <Calendar size={16} strokeWidth={1.75} />
              <input
                type="date"
                value={futureDate ? new Date(futureDate).toISOString().split('T')[0] : ''}
                onChange={handleFutureDateChange}
                className="gm-date-picker__input"
                aria-label="Selecionar data futura"
              />
              {futureDate && (
                <button
                  type="button"
                  className="gm-btn gm-btn--ghost gm-btn--sm"
                  onClick={() => { setFutureDate(''); fetchWeather(userLocation, selectedTravel); }}
                >
                  Limpar
                </button>
              )}
            </div>
          </Section>

          {/* ── History ── */}
          {searchHistory.length > 0 && (
            <Section>
              <SectionHeader
                icon={HistoryIcon}
                title="Histórico recente"
                count={searchHistory.length}
                action={
                  <button
                    type="button"
                    className="gm-btn gm-btn--ghost gm-btn--sm"
                    onClick={handleClearHistory}
                    aria-label="Limpar histórico"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                    Limpar
                  </button>
                }
              />
              <div className="gm-history-list">
                {searchHistory.slice().reverse().map((item, idx) => (
                  <HistoryItem
                    key={`${item.city}-${item.timestamp || idx}`}
                    item={item}
                    onClick={() => handleHistoryClick(item)}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* ── Travels ── */}
          {(travelCities.length > 0 || futureTravels.length > 0) && (
            <Section>
              <SectionHeader icon={Plane} title="Suas viagens" />
              <Grid cols={travelCities.length + futureTravels.length > 1 ? 2 : 1} min={280} gap="md">
                {travelCities.length > 0 && (
                  <div className="gm-travel-card">
                    <header className="gm-travel-card__head">
                      <span className="gm-travel-card__icon" aria-hidden="true">
                        <Plane size={18} strokeWidth={1.75} />
                      </span>
                      <h3 className="gm-travel-card__title">Viagens passadas</h3>
                    </header>
                    <ul className="gm-travel-card__list">
                      {travelCities.map((city, idx) => (
                        <li key={`${city}-${idx}`}>
                          <button
                            type="button"
                            onClick={() => handleTravelCityClick(city)}
                            className="gm-travel-card__item"
                          >
                            <span>{city}</span>
                            <ChevronRight size={14} strokeWidth={1.75} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {futureTravels.length > 0 && (
                  <div className="gm-travel-card">
                    <header className="gm-travel-card__head">
                      <span className="gm-travel-card__icon" aria-hidden="true">
                        <Plane size={18} strokeWidth={1.75} />
                      </span>
                      <h3 className="gm-travel-card__title">Viagens futuras</h3>
                    </header>
                    <ul className="gm-travel-card__list">
                      {futureTravels.map((travel, idx) => (
                        <li key={`${travel.name || 'travel'}-${idx}`}>
                          <button
                            type="button"
                            onClick={() => handleFutureTravelClick(travel)}
                            className="gm-travel-card__item gm-travel-card__item--col"
                          >
                            <span className="gm-travel-card__item-name">{travel.name}</span>
                            <span className="gm-travel-card__item-meta">
                              {new Date(travel.startDate).toLocaleDateString('pt-PT')} — {new Date(travel.endDate).toLocaleDateString('pt-PT')}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Grid>
            </Section>
          )}
        </Stack>
      )}

      <Spacer size="xl" />
      </div>
    </PageContainer>
  );
};

export default WeatherPage;
