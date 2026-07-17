import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 
import { request, setAuthHeader, uploadFile, toFullMediaUrl } from '../axios_helper';
import { useTripDraft } from '../hooks/useTripDraft';
import {
  validateTripForm,
  countErrorsBySection,
  getFieldError,
  normaliseDateString,
  TRIP_FORM_SECTIONS,
} from '../utils/tripValidation';
import TripErrorsModal from '../components/TripErrorsModal';
import FieldError from '../components/FieldError';
import SectionErrorPanel from '../components/SectionErrorPanel';
import { emojiMap } from '../utils/emojiCode';
import Toast from '../components/Toast';
import "../styles/components/modal.css";
import "../styles/pages/future-travels.css";
import "../styles/pages/future-travels-modal.css";
import "../styles/pages/my-travels.css";
import "../styles/pages/my-travels-modal.css";
import "../styles/pages/register-travel.css"; // For SearchableDropdown styling

// Custom Searchable Dropdown with improved UX (matching register design)
const SearchableDropdown = ({ options, value, onChange, placeholder, disabled, labelKey = 'label', valueKey = 'value', error }) => {
  const [search, setSearch] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = React.useRef(null);

  const filteredOptions = options.filter(opt =>
    opt[labelKey].toLowerCase().includes(search.toLowerCase())
  );

  // Robust label resolution: try the exact match first, then a
  // case-insensitive trim match. If nothing matches, fall back to the
  // raw `value` so the user can still see what's been selected (this
  // matters for legacy data where the option list might not include
  // the previously-picked value, e.g. a country that was renamed
  // or a city that was removed from the catalog).
  const selectedLabel = (() => {
    if (!value) return '';
    const norm = (s) => (s || '').toString().trim().toLowerCase();
    const direct = options.find((opt) => opt[valueKey] === value);
    if (direct) return direct[labelKey];
    const fuzzy = options.find((opt) => norm(opt[valueKey]) === norm(value));
    if (fuzzy) return fuzzy[labelKey];
    return value; // raw fallback so the input isn't empty
  })();

  const handleSelect = (val) => {
    onChange(val);
    setShowOptions(false);
    setSearch('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e) => {
    // Handle backspace to clear selection
    if (e.key === 'Backspace' && value && !search) {
      e.preventDefault();
      onChange(null);
      setSearch('');
      setShowOptions(true);
      return;
    }

    if (!showOptions && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setShowOptions(true);
      return;
    }
    if (showOptions) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0) handleSelect(filteredOptions[focusedIndex][valueKey]);
          break;
        case 'Escape':
          e.preventDefault();
          setShowOptions(false);
          setFocusedIndex(-1);
          break;
        default:
          break;
      }
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={dropdownRef}
      className={`searchable-dropdown-container${disabled ? ' disabled' : ''} ${error ? ' has-error' : ''} ${showOptions ? ' open' : ''}`}
      style={{ position: 'relative', width: '100%' }}
    >
      <div className="dropdown-input-wrapper">
        <input
          type="text"
          value={selectedLabel || search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => !disabled && setShowOptions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="dropdown-input"
          autoComplete="off"
          spellCheck="false"
          role="combobox"
          aria-expanded={showOptions}
          aria-haspopup="listbox"
        />
        <div className="dropdown-arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 8 10 12 14 8"></polyline>
          </svg>
        </div>
      </div>

      {showOptions && filteredOptions.length > 0 && (
        <ul className="dropdown-options-list" role="listbox">
          {filteredOptions.map((opt, idx) => (
            <li
              key={opt[valueKey]}
              onMouseDown={() => handleSelect(opt[valueKey])}
              onMouseEnter={() => setFocusedIndex(idx)}
              className={`dropdown-option ${focusedIndex === idx ? 'focused' : ''} ${value === opt[valueKey] ? 'selected' : ''}`}
              role="option"
              aria-selected={value === opt[valueKey]}
            >
              {opt[labelKey]}
            </li>
          ))}
        </ul>
      )}

      {showOptions && filteredOptions.length === 0 && (
        <div className="dropdown-no-results">
          Nenhum resultado encontrado
        </div>
      )}
    </div>
  );
};

// ...existing code...

// Componente de avaliação por estrelas
const StarRating = ({ rating, onRatingChange, maxStars = 5 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (starValue) => {
    onRatingChange(starValue);
  };

  const handleMouseEnter = (starValue) => {
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      margin: '10px 0',
      width: '100%',
      flexWrap: 'wrap'
    }}>
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || rating);
        return (
          <FaStar
            key={index}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            style={{
              cursor: 'pointer',
              fontSize: '32px',
              color: isFilled ? '#ffc107' : '#ddd',
              marginRight: '5px',
              transition: 'all 0.2s ease',
              filter: isFilled ? 'drop-shadow(0 2px 4px rgba(255, 193, 7, 0.5))' : 'none'
            }}
          />
        );
      })}
    </div>
  );
};

// Converts a backend /trips/my-trips list entry (TripDto) into the shape
// expected by the display cards on this page. Mirrors the logic of
// `mapTripSummaryToUiTrip` in UserProfile.js so the two pages render
// the same data for the same trip.
//
// TripDto carries:
//   - id, userId
//   - title, tripSummary, tripDescription, weather
//   - startDate, endDate, tripDurationDays, bookingDate
//   - tripRating, country
//   - cost.total (the price — see backend CostDto)
//   - cities (List<Long>), categories (List<Long>),
//     languagesSpoken (List<Long>), tripPrivacy
//   - accommodations, recommendedFoods, referencePoints,
//     tripTransports, negativePoints
//   - photos, videos
const normalizeBackendTrip = (trip, apiCategories = []) => {
  // City names are NOT stored in TripDto (only IDs). Fall back to the
  // first accommodation's city (a name string) when available.
  const cityName =
    (Array.isArray(trip.accommodations) && trip.accommodations[0]?.city) || '';

  // Prefer the backend's `tripDurationDays` (handles same-day trips
  // and timezone quirks) and fall back to calendar math for legacy
  // rows.
  const startDate = trip.startDate;
  const endDate = trip.endDate;
  const days =
    typeof trip.tripDurationDays === 'number' && trip.tripDurationDays > 0
      ? trip.tripDurationDays
      : startDate && endDate
      ? Math.max(
          1,
          Math.ceil(
            Math.abs(new Date(endDate) - new Date(startDate)) /
              (1000 * 60 * 60 * 24)
          ) + 1,
        )
      : 0;

  return {
    id: trip.id,
    name: trip.title || 'Sem título',
    description: trip.tripDescription || trip.tripSummary || '',
    startDate,
    endDate,
    country: trip.country || '',
    city: cityName,
    countryName: trip.country || '',
    days,
    tripDurationDays: days,
    // TripDto keeps the price at `cost.total` (a nested object).
    price: trip.cost?.total ?? trip.totalPrice ?? trip.totalCost ?? 0,
    cost: { total: trip.cost?.total ?? 0 },
    stars: Math.round(trip.tripRating ?? trip.rating ?? 0),
    tripRating: trip.tripRating ?? trip.rating ?? 0,
    // TripDto only stores category IDs — resolve to names using the
    // cached categories list (populated on mount).
    category: (trip.categories || [])
      .map((id) => {
        const c = apiCategories.find((x) => x.id === id);
        return c ? c.name : null;
      })
      .filter(Boolean),
    // First photo URL — resolved through toFullMediaUrl so the
    // browser can fetch the actual file (relative → full URL).
    highlightImage:
      Array.isArray(trip.photos) && trip.photos[0]
        ? toFullMediaUrl(trip.photos[0])
        : 'https://via.placeholder.com/300',
    isHidden: Boolean(trip.isHidden),
    privacy: (trip.tripPrivacy || 'public').toLowerCase(),
    totalLikes: trip.totalLikes ?? 0,
    totalComments: 0, // TripDto doesn't carry a comment count today
    // Fields needed elsewhere on this page — keep the same shape the
    // rest of the component expects.
    status: 'published',
    travelType: { main: 'single', isGroup: false },
    groupData: null,
    multiDestinations: null,
    accommodations: [],
    foodRecommendations: [],
    transportMethods: [],
    pointsOfInterest: [],
    negativePoints: [],
    travelVideos: Array.isArray(trip.videos) ? trip.videos : [],
    images_generalInformation: Array.isArray(trip.photos) ? trip.photos : [],
  };
};

// ── Hook: per-field error lookup ──────────────────────────────
// The validateTripForm result is a flat array of errors with metadata.
// Each form field needs to ask "am I bad?" — this hook gives back a
// pair of (a) an errorsForSection(s) selector and (b) a lookup for a
// specific (section, field, itemIndex) triple so we can render
// inline error messages next to inputs.
//
// (useFormErrors was moved inside MyTravels as a useMemo so it can
// see the live state — the implementation is right above the JSX
// return.)

// ── Tab button with optional error badge ──────────────────────
// A tiny pure component for the trip-planner tabs. When `errorCount`
// is > 0 it shows a red badge with the count and adds `aria-invalid`
// so screen readers announce the section as problematic. Used by the
// error modal flow so the user can see at-a-glance which sections
// need attention.
const TabButtonWithBadge = ({ tab, label, active, onClick, errorCount }) => (
  <button
    type="button"
    onClick={() => onClick(tab)}
    className={`tab-button ${active ? 'active' : ''} ${errorCount > 0 ? 'has-error' : ''}`}
    aria-invalid={errorCount > 0 || undefined}
      title={errorCount > 0 ? `${errorCount} ${errorCount > 1 ? 'campos em falta' : 'campo em falta'} nesta secção` : undefined}
  >
    <span>{label}</span>
    {errorCount > 0 && (
      <span
        className="tab-error-badge"
        aria-label={`${errorCount} erros`}
        data-testid={`tab-error-badge-${tab}`}
      >
        {errorCount > 99 ? '99+' : errorCount}
      </span>
    )}
  </button>
);

const MyTravels = () => {
  const [travels, setTravels] = useState([]);
  const [filterType, setFilterType] = useState('all'); // Novo estado para filtro
  const [showDrafts, setShowDrafts] = useState(true); // Mostrar rascunhos por padrão
  const [newTravel, setNewTravel] = useState({
    name: '',
    user: 'Tiago',
    category: [],
    country: '',
    city: '',
    price: '',
    days: '',
    transport: '',
    startDate: '',
    endDate: '',
    BookingTripPaymentDate: '',
    highlightImage: '',
    travelVideos: [], // Array para múltiplos vídeos
    views: 0,
    priceDetails: { hotel: '', flight: '', food: '', extras: '' },
    images: [],
    images_generalInformation: [],
    description: '',
    longDescription: '',
    activities: [],
    accommodations: [
      {
        name: '',
        type: '',
        description: '',
        rating: 0,
        nights: '',
        checkInDate: '',
        checkOutDate: '',
        regime: '',
        images: []
      }
    ],
    foodRecommendations: [],
    images_foodRecommendations: [],
    climate: '',
    pointsOfInterest: [],
    images_referencePoints: [],
    safety: { tips: [], vaccinations: [] },
    itinerary: [],
    localTransport: [],
    language: '',
    languages: [], // Array para suportar múltiplas línguas
    reviews: [],
    negativePoints: [],
    privacy: 'public',
    travelType: 'single',
    isSpecial: false,
    status: 'draft' // 'draft' ou 'published'
  });
  const { user } = useAuth(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);
  const [isTravelTypeModalOpen, setIsTravelTypeModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generalInfo');
  const [isEditing, setIsEditing] = useState(false);
  const [editTravelId, setEditTravelId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videosPreviews, setVideosPreviews] = useState([]); // Array de previews dos vídeos
  const [videosInfo, setVideosInfo] = useState([]); // Array de informações dos vídeos
  const [generalInfoImagePreviews, setGeneralInfoImagePreviews] = useState([]);
  const [transportImagePreviews, setTransportImagePreviews] = useState([]);
  const [editingFoodIndex, setEditingFoodIndex] = useState(null);
  // Per-item photos: at most 1 photo per food recommendation.
  // `photoFile` holds the raw File object (so we can upload it after the
  // trip is created). `photoPreview` is a blob URL for instant UI feedback.
  const [newFoodRecommendation, setNewFoodRecommendation] = useState({
    name: '',
    description: '',
    photoFile: null,
    photoPreview: null,
  });
  const [editingPointIndex, setEditingPointIndex] = useState(null);
  // Per-item photos for reference points: multiple allowed (per the user's
  // request, photos are owned by each point, not a global pool).
  const [newPointOfInterest, setNewPointOfInterest] = useState({
    name: '',
    description: '',
    type: '',
    link: '',
    photoFiles: [],
    photoPreviews: [],
  });
  const [editingNegativeIndex, setEditingNegativeIndex] = useState(null);
  const [newNegativePoint, setNewNegativePoint] = useState({ name: '', description: '' });
  const [editingItineraryDay, setEditingItineraryDay] = useState(null);
  const [newItineraryDay, setNewItineraryDay] = useState({ day: '', activities: [''] });
  const [itineraryError, setItineraryError] = useState('');

  // ── Form errors modal ────────────────────────────────────────
  // Holds the structured errors from the most recent validation run
  // (pre-flight client-side OR the last backend error response). The
  // errors per section are also surfaced as red badges on the tab
  // buttons (see `errorCountsBySection`).
  const [formErrors, setFormErrors] = useState([]);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  // Live error count, recomputed when the form changes so badges
  // disappear as the user fixes issues without submitting.
  const [errorCountsBySection, setErrorCountsBySection] = useState({});
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  // ── Live error list (used for inline field errors) ───────────
  // Computed from the same validateTripForm call that powers the
  // badges, but kept as a derived value via useMemo so it never lags
  // behind. The `getFieldError(...)` helper is used inside each
  // field's render to decide whether to wrap itself in <FieldError>.
  const formMedia = useMemo(() => ({
    coverPhoto: newTravel.highlightImage instanceof File ? newTravel.highlightImage : null,
    generalPhotos: (newTravel.images_generalInformation || []).filter((f) => f instanceof File),
    videos: (newTravel.travelVideos || []).filter((f) => f instanceof File),
    accommodationPhotos: (newTravel.accommodations || []).map((a) => a.images || []),
    referencePointPhotos: (newTravel.pointsOfInterest || []).map((p) => p.photoFiles || []),
    foodPhotos: (newTravel.foodRecommendations || []).map((f) => f.photoFile).filter(Boolean),
  }), [
    newTravel.highlightImage, newTravel.images_generalInformation, newTravel.travelVideos,
    newTravel.accommodations, newTravel.pointsOfInterest, newTravel.foodRecommendations,
  ]);
  const liveErrors = useMemo(() => validateTripForm(newTravel, formMedia).errors, [
    newTravel, formMedia,
  ]);
  // Look up an error for a (section, field, [itemIndex]) triple.
  // Use this inside each field's render: const err = fieldError('general', 'title').
  const fieldError = (section, field, itemIndex = null) =>
    getFieldError(liveErrors, { section, field, itemIndex });
  // Convenience: errors for a whole section, used by the per-section
  // error panel at the top of each tab.
  const errorsForSection = (section) =>
    liveErrors.filter((e) => e.section === section);
  
  // ===== TRANSPORT MANAGEMENT STATE =====
  const [editingTransportIndex, setEditingTransportIndex] = useState(null);
  const [newTransport, setNewTransport] = useState({ name: '', description: '', cost: '' });
  const [isTransportFormOpen, setIsTransportFormOpen] = useState(false);
  
  // ===== ACCOMMODATION CITY/COUNTRY DROPDOWNS =====
  const [accommodationCountryCityOptions, setAccommodationCountryCityOptions] = useState({});
  const [loadingAccommodationCities, setLoadingAccommodationCities] = useState({});
  
  // Novos estados para tipos de viagem
  const [selectedTravelType, setSelectedTravelType] = useState({ main: '', isGroup: false }); // main: 'single' | 'multi'
  const [groupMembers, setGroupMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [multiDestinations, setMultiDestinations] = useState([]); // {id,country,city}
  const [newDestination, setNewDestination] = useState({ country: '', city: '' });
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState(0);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [saveAction, setSaveAction] = useState(null); // 'draft' ou 'publish'

  // ── Trip draft autosave (only for NEW trips, not edits) ──────
  // We snapshot `newTravel` to localStorage on a 1.5s debounce.
  // `hasSavedDraft` is exposed to the header so we can show a "Rascunho
  // recuperado" toast when the user re-opens the form.
  const draft = useTripDraft(newTravel, isEditing ? null : user?.id, {
    enabled: !isEditing, // only autosave when creating, not when editing
  });
  const { hasSavedDraft, lastSavedAt, loadDraft, clearDraft } = draft;
  // Estados para armazenar dados por destino
  const [accommodationsByDestination, setAccommodationsByDestination] = useState({});
  const [pointsOfInterestByDestination, setPointsOfInterestByDestination] = useState({});
  
  // Async country/city dropdown state
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Async country/city dropdown state for multi-destination
  const [multiCountryOptions, setMultiCountryOptions] = useState([]);
  const [multiCityOptions, setMultiCityOptions] = useState([]);
  const [loadingMultiCountries, setLoadingMultiCountries] = useState(false);
  const [loadingMultiCities, setLoadingMultiCities] = useState(false);

  // ===== API Data States (Categories, Languages, Accommodations, Transports) =====
  const [apiCategories, setApiCategories] = useState([]);
  const [apiLanguages, setApiLanguages] = useState([]);
  const [apiAccommodationTypes, setApiAccommodationTypes] = useState([]);
  const [apiAccommodationBoards, setApiAccommodationBoards] = useState([]);
  const [apiTransports, setApiTransports] = useState([]);
  
  // Loading states for API data
  const [loadingApiData, setLoadingApiData] = useState({
    categories: false,
    languages: false,
    accommodationTypes: false,
    accommodationBoards: false,
    transports: false
  });
  
  // City cache for performance: Map "Country:City" to cityId
  const [cityIdCache, setCityIdCache] = useState({});
  
  // Trip submission state for UX
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);
  const [cityLookupInProgress, setCityLookupInProgress] = useState({});
  
  // ===== USER TRIPS STATE (Loaded from /trips/my-trips) =====
  const [userTrips, setUserTrips] = useState([]);
  const [loadingUserTrips, setLoadingUserTrips] = useState(false);
  const [selectedTripForEdit, setSelectedTripForEdit] = useState(null);

  // Fetch countries on mount (axios_helper best practice)
  // ── Live error count for the tab badges ───────────────────────
  // We don't re-run the full validation on every keystroke (that would
  // flash errors as the user types), but we do recompute section-level
  // counts so the badges shrink/grow as the user fixes issues. The
  // modal is only shown on submit, but the badges give continuous
  // feedback.
  useEffect(() => {
    // Skip when the modal is closed AND the counts are already empty —
    // we don't need to recompute on every state change otherwise.
    const formMedia = {
      coverPhoto: newTravel.highlightImage instanceof File ? newTravel.highlightImage : null,
      generalPhotos: (newTravel.images_generalInformation || []).filter((f) => f instanceof File),
      videos: (newTravel.travelVideos || []).filter((f) => f instanceof File),
      accommodationPhotos: (newTravel.accommodations || []).map((a) => a.images || []),
      referencePointPhotos: (newTravel.pointsOfInterest || []).map((p) => p.photoFiles || []),
      foodPhotos: (newTravel.foodRecommendations || []).map((f) => f.photoFile).filter(Boolean),
    };
    const result = validateTripForm(newTravel, formMedia);
    setErrorCountsBySection(countErrorsBySection(result.errors));
    // We never auto-open the modal here; the user only sees it when
    // they click "Publicar". This keeps the form from feeling naggy.
  }, [
    newTravel.title, newTravel.tripSummary, newTravel.tripDescription,
    newTravel.startDate, newTravel.endDate, newTravel.weather, newTravel.stars,
    newTravel.country, newTravel.city, newTravel.category, newTravel.languages,
    newTravel.priceDetails, newTravel.accommodations, newTravel.pointsOfInterest,
    newTravel.foodRecommendations, newTravel.negativePoints, newTravel.itinerary,
    newTravel.highlightImage, newTravel.images_generalInformation, newTravel.travelVideos,
  ]);

  useEffect(() => {
    let isMounted = true;
    setLoadingCountries(true);
    request('GET', '/cities/countries')
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          setCountryOptions(res.data.map(c => ({ label: c, value: c })));
          setMultiCountryOptions(res.data.map(c => ({ label: c, value: c })));
        }
      })
      .catch(() => {
        if (isMounted) {
          setCountryOptions([]);
          setMultiCountryOptions([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingCountries(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Fetch cities when single destination country changes (axios_helper best practice)
  useEffect(() => {
    let isMounted = true;
    if (!newTravel.country) {
      setCityOptions([]);
      return;
    }
    setLoadingCities(true);
    request('GET', `/cities/by-country?countryName=${encodeURIComponent(newTravel.country)}`)
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          setCityOptions(res.data.map(city => ({ label: city.cityName, value: city.cityName })));
        }
      })
      .catch(() => {
        if (isMounted) setCityOptions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCities(false);
      });
    return () => { isMounted = false; };
  }, [newTravel.country]);

  // Fetch cities when multi-destination country changes (axios_helper best practice)
  useEffect(() => {
    let isMounted = true;
    if (!newDestination.country) {
      setMultiCityOptions([]);
      return;
    }
    setLoadingMultiCities(true);
    request('GET', `/cities/by-country?countryName=${encodeURIComponent(newDestination.country)}`)
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          setMultiCityOptions(res.data.map(city => ({ label: city.cityName, value: city.cityName })));
        }
      })
      .catch(() => {
        if (isMounted) setMultiCityOptions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingMultiCities(false);
      });
    return () => { isMounted = false; };
  }, [newDestination.country]);

  // ===== ACCOMMODATION CITY LOADER (for accommodation country selection) =====
  const loadAccommodationCities = (accommodationIndex, countryName) => {
    if (!countryName) return;
    
    let isMounted = true;
    setLoadingAccommodationCities(prev => ({ ...prev, [accommodationIndex]: true }));
    
    request('GET', `/cities/by-country?countryName=${encodeURIComponent(countryName)}`)
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          const cities = res.data.map(c => ({ label: c.cityName, value: c.cityName }));
          setAccommodationCountryCityOptions(prev => ({
            ...prev,
            [accommodationIndex]: cities
          }));
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccommodationCountryCityOptions(prev => ({
            ...prev,
            [accommodationIndex]: []
          }));
        }
      })
      .finally(() => {
        if (isMounted) setLoadingAccommodationCities(prev => ({ ...prev, [accommodationIndex]: false }));
      });
    
    return () => { isMounted = false; };
  };

  // ===== EMOJI CODE TO EMOJI CONVERTER =====
  const convertEmojiCode = (emojiCode) => {
    if (!emojiCode) return '📍';
    return emojiMap[emojiCode.toLowerCase()] || emojiCode || '📍';
  };

  // ===== GET CATEGORY ICON FROM API DATA =====
  const getCategoryIcon = (categoryName) => {
    const category = apiCategories.find(cat => cat.name === categoryName);
    if (category && category.icon) {
      return convertEmojiCode(category.icon);
    }
    // If no icon from API, return empty string (no hardcoded fallback)
    return '';
  };

  // ===== GET LANGUAGE CODE BY NAME =====
  const getLanguageCode = (languageName) => {
    const lang = apiLanguages.find(l => l.name === languageName);
    return lang ? `(${lang.code})` : '';
  };

  // ===== SECURITY: INPUT SANITIZATION =====
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  // ===== DATA TRANSFORMATION: GET CITY ID BY COUNTRY+CITY NAME =====
  const getCityIdByCountryAndCity = async (countryName, cityName) => {
    const cacheKey = `${countryName}:${cityName}`;
    
    // Check cache first (PERFORMANCE)
    if (cityIdCache[cacheKey]) {
      return cityIdCache[cacheKey];
    }
    
    // Check if lookup is in progress (prevent duplicate requests)
    if (cityLookupInProgress[cacheKey]) {
      return null;
    }
    
    setCityLookupInProgress(prev => ({ ...prev, [cacheKey]: true }));
    
    try {
      // Fetch cities for this country to find the city ID
      const response = await request('GET', `/cities/by-country?countryName=${encodeURIComponent(countryName)}`);
      
      if (Array.isArray(response.data)) {
        const foundCity = response.data.find(c => 
          c.cityName?.toLowerCase() === cityName?.toLowerCase()
        );
        
        if (foundCity) {
          const cityId = foundCity.id || foundCity.cityId;
          // Cache the result
          setCityIdCache(prev => ({ ...prev, [cacheKey]: cityId }));
          return cityId;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to resolve city ID for ${countryName}/${cityName}:`, error.message);
    } finally {
      setCityLookupInProgress(prev => ({ ...prev, [cacheKey]: false }));
    }
    
    return null;
  };

  // ===== DATA TRANSFORMATION: CONVERT BACKEND TRIP TO FRONTEND FORM STATE =====
  const transformBackendTripToFrontend = (backendTrip) => {
    if (!backendTrip) return null;
    // Get category names from IDs (using apiCategories mapping)
    const categoryNames = (backendTrip.categories || [])
      .map(categoryId => {
        const cat = apiCategories.find(c => c.id === categoryId);
        return cat?.name;
      })
      .filter(name => name !== undefined);
    
    // Get language names from IDs (using apiLanguages mapping)
    const languageNames = (backendTrip.languagesSpoken || [])
      .map(langId => {
        const lang = apiLanguages.find(l => l.id === langId);
        return lang?.name;
      })
      .filter(name => name !== undefined);
    
    // Transform itinerary days (flatten topics to activities)
    const itinerary = (backendTrip.tripItinerary?.itineraryDays || [])
      .map(day => ({
        day: day.day || '',
        activities: (day.topics || [])
          .map(topic => topic.description || topic.name || '')
          .filter(act => act.trim())
      }));
    
    // Transform accommodations (add missing fields if needed)
    const accommodations = (backendTrip.accommodations || [])
      .map(acc => ({
        name: acc.name || '',
        type: acc.accommodationTypeName || '',
        country: '', // Not provided by backend, will be fetched from city
        city: acc.city || '',
        description: acc.description || '',
        rating: acc.rating || 0,
        nights: acc.nrNights || 0,
        price: acc.price || '',
        checkInDate: acc.checkIn || backendTrip.startDate || '',
        checkOutDate: acc.checkOut || backendTrip.endDate || '',
        bookingDate: acc.bookingDate || '',
        regime: acc.accommodationBoardName || '',
        images: []
      }));
    
    // Transform transports
    const localTransport = (backendTrip.tripTransports || [])
      .map(transport => ({
        id: transport.id || Date.now(),
        name: transport.name || '',
        description: transport.description || '',
        cost: transport.cost || 0
      }));
    
    // Transform food recommendations
    const foodRecommendations = (backendTrip.recommendedFoods || [])
      .map(food => ({
        name: food.name || '',
        description: food.description || ''
      }));
    
    // Transform points of interest
    const pointsOfInterest = (backendTrip.referencePoints || [])
      .map(point => ({
        name: point.name || '',
        description: point.description || '',
        type: '',
        link: (point.photos && point.photos[0]) || ''
      }));
    
    // Transform negative points
    const negativePoints = (backendTrip.negativePoints || [])
      .map(point => ({
        name: point.name || '',
        description: point.description || ''
      }));
    
    // Get first city name (from cities array - backend only stores IDs)
    // We'll set a placeholder, as backend doesn't return city names
    const mainCity = backendTrip.accommodations?.[0]?.city || 'Unknown';

    // Parse dates
    const startDate = backendTrip.startDate || '';
    const endDate = backendTrip.endDate || '';

    // Parse cost breakdown if available
    const priceDetails = backendTrip.cost || {
      accommodation: 0,
      food: 0,
      transport: 0,
      extra: 0
    };

    return {
      name: backendTrip.title || '',
      user: 'Tiago',
      category: categoryNames,
      // Country is now denormalised on the backend (resolved from
      // the first trip city at read time). Falls back to '' for
      // legacy trips that pre-date the field.
      country: backendTrip.country || '',
      city: mainCity,
      price: (backendTrip.cost?.total || 0).toString(),
      days: backendTrip.tripDurationDays || 0,
      transport: '',
      startDate: startDate,
      endDate: endDate,
      BookingTripPaymentDate: backendTrip.bookingDate || startDate || '',
      highlightImage: '',
      travelVideos: [],
      views: 0,
      priceDetails: {
        hotel: (priceDetails.accommodation || 0).toString(),
        flight: (priceDetails.transport || 0).toString(),
        food: (priceDetails.food || 0).toString(),
        extras: (priceDetails.extra || 0).toString()
      },
      images: [],
      images_generalInformation: [],
      description: backendTrip.tripSummary || '',
      longDescription: backendTrip.tripDescription || '',
      // Trip rating (1-5 stars). The StarRating component reads
      // `newTravel.stars` and converts to int via parseInt, so we
      // store the value as a string to stay consistent with the
      // rest of the form state.
      stars: backendTrip.tripRating != null ? String(backendTrip.tripRating) : '0',
      activities: [],
      accommodations: accommodations.length > 0 ? accommodations : [
        {
          name: '',
          type: '',
          country: '',
          city: '',
          description: '',
          rating: 0,
          nights: '',
          price: '',
          checkInDate: '',
          checkOutDate: '',
          bookingDate: '',
          regime: '',
          images: []
        }
      ],
      foodRecommendations: foodRecommendations,
      images_foodRecommendations: [],
      climate: backendTrip.weather || '',
      pointsOfInterest: pointsOfInterest,
      images_referencePoints: [],
      safety: { tips: [], vaccinations: [] },
      itinerary: itinerary,
      localTransport: localTransport,
      language: '',
      languages: languageNames,
      reviews: [],
      negativePoints: negativePoints,
      privacy: (backendTrip.tripPrivacy || 'PUBLIC').toLowerCase() === 'public' ? 'public' : 'private',
      travelType: 'single',
      isSpecial: false,
      status: 'published'
    };
  };

  // ===== DATA TRANSFORMATION: CONVERT FRONTEND TO BACKEND FORMAT =====
  const transformTravelToBackendFormat = async () => {
    // ===== ENHANCED VALIDATION FOR REQUIRED FIELDS =====
    const name = (newTravel.name || '').trim();
    const country = (newTravel.country || '').trim();
    const city = (newTravel.city || '').trim();
    const startDate = (newTravel.startDate || '').trim();
    const endDate = (newTravel.endDate || '').trim();
    const description = (newTravel.description || '').trim();
    const longDescription = (newTravel.longDescription || '').trim();
    
    // Check all required fields with clear error messages
    if (!name) {
      setToast({ message: '❌ Nome da viagem é obrigatório!', type: 'error', show: true });
      return null;
    }
    
    if (!country) {
      setToast({ message: '❌ País é obrigatório!', type: 'error', show: true });
      return null;
    }
    
    if (!city) {
      setToast({ message: '❌ Cidade é obrigatória!', type: 'error', show: true });
      return null;
    }
    
    if (!startDate) {
      setToast({ message: '❌ Data de início é obrigatória!', type: 'error', show: true });
      return null;
    }
    
    if (!endDate) {
      setToast({ message: '❌ Data de fim é obrigatória!', type: 'error', show: true });
      return null;
    }
    
    if (!description) {
      setToast({ message: '❌ Descrição curta é obrigatória!', type: 'error', show: true });
      return null;
    }
    
    if (!longDescription) {
      setToast({ message: '❌ Descrição longa é obrigatória!', type: 'error', show: true });
      return null;
    }
    
    if (!newTravel.stars || newTravel.stars === 0 || newTravel.stars === '0') {
      setToast({ message: '❌ Avaliação da viagem é obrigatória!', type: 'error', show: true });
      return null;
    }

    // Resolve city ID
    const cityId = await getCityIdByCountryAndCity(country, city);
    if (!cityId) {
      setToast({ message: `❌ Não foi possível encontrar a cidade: ${city}`, type: 'error', show: true });
      return null;
    }

    // Build the backend request body
    const backendTripData = {
      userId: user?.id || 1,
      cities: [cityId],
      title: sanitizeInput(name),
      tripSummary: sanitizeInput(description),
      tripDescription: sanitizeInput(longDescription),
      startDate: startDate,
      endDate: endDate,
      bookingDate: (newTravel.BookingTripPaymentDate || startDate),
      weather: sanitizeInput(newTravel.climate),
      tripRating: parseInt(newTravel.stars) || 0,
      tripPrivacy: (newTravel.privacy || 'public').toUpperCase(),
      allowComments: true,
      isHidden: false,
      
      // Calculate trip duration in days (REQUIRED by backend)
      tripDurationDays: Math.ceil(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1
      ),
      
      // Cost breakdown
      cost: {
        total: Math.max(0, parseFloat(newTravel.price) || 0),
        accommodation: Math.max(0, parseFloat(newTravel.priceDetails?.hotel) || 0),
        food: Math.max(0, parseFloat(newTravel.priceDetails?.food) || 0),
        transport: Math.max(0, parseFloat(newTravel.priceDetails?.transport) || 0),
        extra: Math.max(0, parseFloat(newTravel.priceDetails?.extras) || 0),
      },
      
      // Categories (get IDs from API data)
      categories: newTravel.category
        .map(catName => {
          const cat = apiCategories.find(c => c.name === catName);
          return cat?.id;
        })
        .filter(id => id !== undefined && id !== null),
      
      // Languages (get IDs from API data)
      languagesSpoken: (newTravel.languages || [])
        .map(langName => {
          const lang = apiLanguages.find(l => l.name === langName);
          return lang?.id;
        })
        .filter(id => id !== undefined && id !== null),
      
      // Itinerary - transform to backend format
      tripItinerary: {
        itineraryDays: (newTravel.itinerary || []).map(day => ({
          day: sanitizeInput(day.day) || `Day ${day.day}`,
          topics: (day.activities || [])
            .filter(act => act.trim())
            .map((activity, idx) => ({
              name: sanitizeInput(activity.split('\n')[0]) || `Activity ${idx + 1}`,
              description: sanitizeInput(activity)
            }))
        }))
      },
      
      // Reference Points (photos are per-point, not global — per user spec)
      referencePoints: (newTravel.pointsOfInterest || [])
        .filter(point => point.name?.trim())
        .map(point => ({
          name: sanitizeInput(point.name),
          description: sanitizeInput(point.description || point.type),
          city: city,
          // Backend will accept empty list — we upload the actual files in a
          // post-create step (see uploadTripMedia).
          photos: []
        })),

      // Accommodations — each accommodation carries its own photos.
      // (Was previously only sent by name; now we include `photos` so the
      // accommodation sub-entity has the per-accommodation gallery.
      // Files are uploaded post-create; this DTO just keeps the shape
      // consistent with the backend.)
      accommodations: (newTravel.accommodations || [])
        .filter(acc => acc.name?.trim())
        .map(acc => {
          const accType = apiAccommodationTypes.find(at => at.type === acc.type);
          const accBoard = apiAccommodationBoards.find(ab => ab.board === acc.regime);

          return {
            name: sanitizeInput(acc.name),
            accommodationTypeId: accType?.id || 1,
            accommodationTypeName: acc.type,
            accommodationBoardId: accBoard?.id || 1,
            accommodationBoardName: acc.regime,
            city: acc.city || city,
            price: Math.max(0, parseFloat(acc.price || 0)),
            nrNights: Math.max(0, parseInt(acc.nights || 0)),
            checkIn: acc.checkInDate || startDate,
            checkOut: acc.checkOutDate || endDate,
            bookingDate: (acc.bookingDate || newTravel.BookingTripPaymentDate || startDate),
            description: sanitizeInput(acc.description),
            rating: Math.max(0, Math.min(5, parseInt(acc.rating || 0))),
            photos: []
          };
        }),
      
      // Transports
      tripTransports: (newTravel.localTransport || [])
        .filter(transport => transport && transport.name && typeof transport === 'object')
        .map(transport => {
          const transportData = apiTransports.find(t => t.name === transport.name);
          return {
            transportId: transportData?.id || 1,
            name: sanitizeInput(transport.name),
            description: sanitizeInput(transport.description || transport.name),
            cost: Math.max(0, parseFloat(transport.cost || 0)),
            photos: []
          };
        }),
      
      // Recommended Foods (one photo per food, per user spec).
      recommendedFoods: (newTravel.foodRecommendations || [])
        .filter(food => food.name?.trim())
        .map(food => ({
          name: sanitizeInput(food.name),
          description: sanitizeInput(food.description),
          city: city,
          photos: []
        })),
      
      // Negative Points
      negativePoints: (newTravel.negativePoints || [])
        .filter(point => point.name?.trim())
        .map(point => ({
          name: sanitizeInput(point.name),
          description: sanitizeInput(point.description)
        }))
    };
    
    return backendTripData;
  };

  // ===== FETCH CATEGORIES WITH CACHE =====
  useEffect(() => {
    let isMounted = true;
    setLoadingApiData(prev => ({ ...prev, categories: true }));
    
    // Try to use cached data first
    const cachedCategories = localStorage.getItem('api_categories');
    if (cachedCategories) {
      try {
        const parsed = JSON.parse(cachedCategories);
        if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
          setApiCategories(parsed);
          setLoadingApiData(prev => ({ ...prev, categories: false }));
          return;
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse cached categories');
      }
    }

    // If no cache, fetch from API
    request('GET', '/categories')
      .then(res => {
        console.log('✅ Categories fetched from API:', res.data);
        if (isMounted && Array.isArray(res.data)) {
          const data = res.data.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon
          }));
          setApiCategories(data);
          // Save to localStorage
          localStorage.setItem('api_categories', JSON.stringify(data));
        }
      })
      .catch(err => {
        console.warn('⚠️ Failed to fetch categories:', err.message);
        if (isMounted) {
          // Try to use stale cache on error
          const staleCached = localStorage.getItem('api_categories');
          if (staleCached) {
            try {
              setApiCategories(JSON.parse(staleCached));
            } catch (e) {
              setApiCategories([]);
            }
          } else {
            setApiCategories([]);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingApiData(prev => ({ ...prev, categories: false }));
      });
    return () => { isMounted = false; };
  }, []);

  // ===== FETCH LANGUAGES WITH CACHE =====
  useEffect(() => {
    let isMounted = true;
    setLoadingApiData(prev => ({ ...prev, languages: true }));
    
    // Try to use cached data first
    const cachedLanguages = localStorage.getItem('api_languages');
    if (cachedLanguages) {
      try {
        const parsed = JSON.parse(cachedLanguages);
        if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
          setApiLanguages(parsed);
          setLoadingApiData(prev => ({ ...prev, languages: false }));
          return;
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse cached languages');
      }
    }

    // If no cache, fetch from API
    request('GET', '/languages-spoken')
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          const data = res.data.map(lang => ({
            id: lang.id,
            name: lang.name,
            code: lang.code
          }));
          setApiLanguages(data);
          // Save to localStorage
          localStorage.setItem('api_languages', JSON.stringify(data));
        }
      })
      .catch(err => {
        console.warn('⚠️ Failed to fetch languages:', err.message);
        if (isMounted) {
          // Try to use stale cache on error
          const staleCached = localStorage.getItem('api_languages');
          if (staleCached) {
            try {
              setApiLanguages(JSON.parse(staleCached));
            } catch (e) {
              setApiLanguages([]);
            }
          } else {
            setApiLanguages([]);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingApiData(prev => ({ ...prev, languages: false }));
      });
    return () => { isMounted = false; };
  }, []);

  // ===== FETCH ACCOMMODATION TYPES WITH CACHE =====
  useEffect(() => {
    let isMounted = true;
    setLoadingApiData(prev => ({ ...prev, accommodationTypes: true }));
    
    // Try to use cached data first
    const cachedAccTypes = localStorage.getItem('api_accommodation_types');
    if (cachedAccTypes) {
      try {
        const parsed = JSON.parse(cachedAccTypes);
        if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
          setApiAccommodationTypes(parsed);
          setLoadingApiData(prev => ({ ...prev, accommodationTypes: false }));
          return;
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse cached accommodation types');
      }
    }

    // If no cache, fetch from API
    request('GET', '/accommodation-types')
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          const data = res.data.map(acc => ({
            id: acc.id,
            type: acc.type
          }));
          setApiAccommodationTypes(data);
          // Save to localStorage
          localStorage.setItem('api_accommodation_types', JSON.stringify(data));
        }
      })
      .catch(err => {
        console.warn('⚠️ Failed to fetch accommodation types:', err.message);
        if (isMounted) {
          // Try to use stale cache on error
          const staleCached = localStorage.getItem('api_accommodation_types');
          if (staleCached) {
            try {
              setApiAccommodationTypes(JSON.parse(staleCached));
            } catch (e) {
              setApiAccommodationTypes([]);
            }
          } else {
            setApiAccommodationTypes([]);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingApiData(prev => ({ ...prev, accommodationTypes: false }));
      });
    return () => { isMounted = false; };
  }, []);

  // ===== FETCH ACCOMMODATION BOARDS (REGIMES) WITH CACHE =====
  useEffect(() => {
    let isMounted = true;
    setLoadingApiData(prev => ({ ...prev, accommodationBoards: true }));
    
    // Try to use cached data first
    const cachedBoards = localStorage.getItem('api_accommodation_boards');
    if (cachedBoards) {
      try {
        const parsed = JSON.parse(cachedBoards);
        if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
          setApiAccommodationBoards(parsed);
          setLoadingApiData(prev => ({ ...prev, accommodationBoards: false }));
          return;
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse cached accommodation boards');
      }
    }

    // If no cache, fetch from API
    request('GET', '/accommodation-boards')
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          const data = res.data.map(board => ({
            id: board.id,
            board: board.board
          }));
          setApiAccommodationBoards(data);
          // Save to localStorage
          localStorage.setItem('api_accommodation_boards', JSON.stringify(data));
        }
      })
      .catch(err => {
        console.warn('⚠️ Failed to fetch accommodation boards:', err.message);
        if (isMounted) {
          // Try to use stale cache on error
          const staleCached = localStorage.getItem('api_accommodation_boards');
          if (staleCached) {
            try {
              setApiAccommodationBoards(JSON.parse(staleCached));
            } catch (e) {
              setApiAccommodationBoards([]);
            }
          } else {
            setApiAccommodationBoards([]);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingApiData(prev => ({ ...prev, accommodationBoards: false }));
      });
    return () => { isMounted = false; };
  }, []);

  // ===== FETCH TRANSPORTS WITH CACHE =====
  useEffect(() => {
    let isMounted = true;
    setLoadingApiData(prev => ({ ...prev, transports: true }));
    
    // Try to use cached data first
    const cachedTransports = localStorage.getItem('api_transports');
    if (cachedTransports) {
      try {
        const parsed = JSON.parse(cachedTransports);
        if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
          setApiTransports(parsed);
          setLoadingApiData(prev => ({ ...prev, transports: false }));
          return;
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse cached transports');
      }
    }

    // If no cache, fetch from API
    request('GET', '/transports')
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          const data = res.data.map(transport => ({
            id: transport.id,
            name: transport.name
          }));
          setApiTransports(data);
          // Save to localStorage
          localStorage.setItem('api_transports', JSON.stringify(data));
        }
      })
      .catch(err => {
        console.warn('⚠️ Failed to fetch transports:', err.message);
        if (isMounted) {
          // Try to use stale cache on error
          const staleCached = localStorage.getItem('api_transports');
          if (staleCached) {
            try {
              setApiTransports(JSON.parse(staleCached));
            } catch (e) {
              setApiTransports([]);
            }
          } else {
            setApiTransports([]);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingApiData(prev => ({ ...prev, transports: false }));
      });
    return () => { isMounted = false; };
  }, []);

  // Extract language names from API data (array of strings, not objects)
  const languages = apiLanguages.map(lang => lang.name || lang);

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  const location = useLocation();

  // Toast functions
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 2600);
  };

  const closeToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  // Transport options (API data only)
  const transportOptions = apiTransports.map(t => t.name);

  // Função para formatar tamanho de arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para formatar duração de vídeo
  const formatVideoDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Função para calcular totais dos vídeos
  const calculateVideoTotals = (videos, videosInfoArray) => {
    let totalSize = 0;
    let totalDuration = 0;
    
    videos.forEach((video, index) => {
      if (video instanceof File) {
        totalSize += video.size;
      }
      if (videosInfoArray[index] && videosInfoArray[index].durationSeconds) {
        totalDuration += videosInfoArray[index].durationSeconds;
      }
    });

    return {
      totalSize,
      totalDuration,
      formattedSize: formatFileSize(totalSize),
      formattedDuration: formatVideoDuration(totalDuration)
    };
  };

  // Categories with icons (API data only)
  const categories = apiCategories.map(cat => cat.name);

  // Fetch user trips from backend on mount
  // Note: trip-creation DRAFTS are now handled by `useTripDraft`
  // (autosaved to localStorage under `gm_trip_draft_{userId}`), so we
  // no longer need to merge a local "user-travels" list with status
  // = 'draft' entries. The cached list here is just the backend-
  // published trips for snappy UX.
  useEffect(() => {
    let isMounted = true;
    setLoadingUserTrips(true);

    // Show cached data immediately (stale-while-revalidate) for snappy UX
    const cachedUserTrips = localStorage.getItem("user-trips-backend");
    if (cachedUserTrips) {
      try {
        const parsed = JSON.parse(cachedUserTrips);
        if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
          setUserTrips(parsed);
          setTravels(parsed.map((t) => normalizeBackendTrip(t, apiCategories)));
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse cached user trips');
      }
    }

    // Always fetch fresh data from API
    request("GET", "/trips/my-trips")
      .then((response) => {
        if (isMounted && response.data?.content) {
          // Extract content array from paginated response
          const trips = response.data.content;
          setUserTrips(trips);
          setTravels(trips.map((t) => normalizeBackendTrip(t, apiCategories)));
          // Cache the trips
          localStorage.setItem("user-trips-backend", JSON.stringify(trips));
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching user trips:", error.message);
        if (isMounted) {
          // Try to use stale cache on error
          const staleCached = localStorage.getItem("user-trips-backend");
          if (staleCached) {
            try {
              setUserTrips(JSON.parse(staleCached));
            } catch (e) {
              setUserTrips([]);
            }
          } else {
            setUserTrips([]);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoadingUserTrips(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Abrir modal automaticamente ao redirecionar com estado
  useEffect(() => {
    if (location.state?.openModal) {
      setIsTravelTypeModalOpen(true);
      // Limpar o state para evitar reabertura ao voltar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  // Reset quando muda o destino selecionado em viagens multidestino
  useEffect(() => {
    if (selectedTravelType.main === 'multi' && selectedDestinationIndex !== "" && selectedDestinationIndex !== undefined) {
      // Limpar estados de edição quando muda destino
      setEditingPointIndex(null);
      setNewPointOfInterest({ name: '', description: '', type: '', link: '', photoFiles: [], photoPreviews: [] });
      // (Removed: global reference-point image previews — per-item
       // previews live inside each ref-point card.)
      // (Removed: global accommodation image previews — per-item
       // previews live inside each accommodation card.)
    }
  }, [selectedDestinationIndex, selectedTravelType.main]);

  // Controlar a abertura do header em mobile quando o modal abre
  useEffect(() => {
    const handleResize = () => {
      if (isModalOpen && window.innerWidth <= 768) {
        // Em mobile, o header começa FECHADO - viajante deve clicar no toggle
        setIsHeaderOpen(false);
      } else if (isModalOpen && window.innerWidth > 768) {
        setIsHeaderOpen(true); // Em desktop, header sempre aberto
      } else if (!isModalOpen) {
        setIsHeaderOpen(false);
      }
    };

    // Verificar quando o modal abre
    handleResize();
    
    // Adicionar listener para resize
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isModalOpen]);

  // Função para validar campos obrigatórios
  const validateForm = () => {
    // ========== ORDEM CORRETA DE VALIDAÇÕES (CONFORME SOLICITADO) ==========
    // 1. Nome da Viagem
    // 2. País
    // 3. Cidade
    // 4. Datas (início e fim)
    // 5. Avaliação geral
    // 6. Categorias
    // 7. Idiomas
    // 8. Descrição Curta
    // 9. Descrição Longa
    // 10. Imagem de Destaque
    // 11. Resto (opcionais)

    // ====== 1. VALIDAÇÃO NOME DA VIAGEM (OBRIGATÓRIO) ======
    if (!newTravel.name.trim()) {
      setToast({ message: '❌ O nome da viagem é obrigatório (*)!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.name.length < 3) {
      setToast({ message: '❌ O nome da viagem deve ter pelo menos 3 caracteres!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.name.length > 100) {
      setToast({ message: '❌ O nome da viagem não pode ter mais de 100 caracteres! (Atual: ' + newTravel.name.length + '/100)', type: 'error', show: true });
      return false;
    }
    
    // Validação contra caracteres perigosos no nome
    if (/<script|javascript:|onload=|onerror=/i.test(newTravel.name)) {
      setToast({ message: '❌ O nome contém caracteres não permitidos!', type: 'error', show: true });
      return false;
    }

    // ====== 2. VALIDAÇÃO PAÍS (OBRIGATÓRIO) ======
    if (selectedTravelType.main === 'multi') {
      if (multiDestinations.length === 0) {
        setToast({ message: '❌ Adicione pelo menos um destino (*)!', type: 'error', show: true });
        return false;
      }
    } else {
      if (!newTravel.country) {
        setToast({ message: '❌ Selecione um país (*)!', type: 'error', show: true });
        return false;
      }

      // ====== 3. VALIDAÇÃO CIDADE (OBRIGATÓRIO) ======
      if (!newTravel.city.trim()) {
        setToast({ message: '❌ A cidade é obrigatória (*)!', type: 'error', show: true });
        return false;
      }
      if (newTravel.city.length < 2) {
        setToast({ message: '❌ O nome da cidade deve ter pelo menos 2 caracteres!', type: 'error', show: true });
        return false;
      }
    }

    // ====== 4. VALIDAÇÃO DATAS (OBRIGATÓRIO) ======
    if (!newTravel.startDate || !newTravel.endDate) {
      setToast({ message: '❌ As datas de início e fim são obrigatórias (*)!', type: 'error', show: true });
      return false;
    }
    
    const startDate = new Date(newTravel.startDate);
    const endDate = new Date(newTravel.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate > today) {
      setToast({ message: '❌ A data de início não pode ser no futuro!', type: 'error', show: true });
      return false;
    }
    
    if (endDate > today) {
      setToast({ message: '❌ A data de fim não pode ser no futuro!', type: 'error', show: true });
      return false;
    }
    
    if (startDate > endDate) {
      setToast({ message: '❌ A data de início não pode ser posterior à data de fim!', type: 'error', show: true });
      return false;
    }
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      setToast({ message: '❌ A duração da viagem não pode exceder 365 dias!', type: 'error', show: true });
      return false;
    }
    
    if (startDate.getTime() === endDate.getTime()) {
      setToast({ message: '⚠️ Aviso: A viagem tem apenas 1 dia. Confirme se está correto!', type: 'warning', show: true });
    }

    // ====== 5. VALIDAÇÃO AVALIAÇÃO GERAL (OBRIGATÓRIO) ======
    if (!newTravel.stars || newTravel.stars === 0 || newTravel.stars === '0') {
      setToast({ message: '❌ A avaliação geral da viagem é obrigatória (*)!', type: 'error', show: true });
      return false;
    }

    // ====== 6. VALIDAÇÃO CATEGORIAS (OBRIGATÓRIO) ======
    if (!newTravel.category || newTravel.category.length === 0) {
      setToast({ message: '❌ Selecione pelo menos uma categoria (*)!', type: 'error', show: true });
      return false;
    }

    // ====== 7. VALIDAÇÃO IDIOMAS (OBRIGATÓRIO) ======
    if (!newTravel.languages || newTravel.languages.length === 0) {
      setToast({ message: '❌ Selecione pelo menos uma língua utilizada (*)!', type: 'error', show: true });
      return false;
    }

    // ====== 8. VALIDAÇÃO DESCRIÇÃO CURTA (OBRIGATÓRIO) ======
    if (!newTravel.description || !newTravel.description.trim()) {
      setToast({ message: '❌ A descrição curta é obrigatória (*)!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.description.length < 10) {
      setToast({ message: '❌ A descrição curta deve ter pelo menos 10 caracteres!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.description.length > 350) {
      setToast({ message: '❌ A descrição curta não pode ter mais de 350 caracteres! (Atual: ' + newTravel.description.length + '/350)', type: 'error', show: true });
      return false;
    }

    // ====== 9. VALIDAÇÃO DESCRIÇÃO LONGA (OBRIGATÓRIO) ======
    if (!newTravel.longDescription || !newTravel.longDescription.trim()) {
      setToast({ message: '❌ A descrição longa é obrigatória (*)!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.longDescription.length < 20) {
      setToast({ message: '❌ A descrição longa deve ter pelo menos 20 caracteres!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.longDescription.length > 6000) {
      setToast({ message: '❌ A descrição longa não pode ter mais de 6000 caracteres! (Atual: ' + newTravel.longDescription.length + '/6000)', type: 'error', show: true });
      return false;
    }
    
    if (/<script|javascript:|onload=|onerror=/i.test(newTravel.description || '') || 
        /<script|javascript:|onload=|onerror=/i.test(newTravel.longDescription || '')) {
      setToast({ message: '❌ A descrição contém caracteres não permitidos!', type: 'error', show: true });
      return false;
    }

    // ====== 10. VALIDAÇÃO IMAGEM DE DESTAQUE (OBRIGATÓRIO) ======
    if (!newTravel.highlightImage) {
      setToast({ message: '❌ A imagem de destaque é obrigatória (*)!', type: 'error', show: true });
      return false;
    }

    // ====== 11. VALIDAÇÕES OPCIONAIS (Temperatura, Preços, etc) ======
    
    if (newTravel.climate && newTravel.climate.length > 350) {
      setToast({ message: '❌ A descrição da temperatura não pode ter mais de 350 caracteres! (Atual: ' + newTravel.climate.length + '/350)', type: 'error', show: true });
      return false;
    }
    
    const priceDetails = newTravel.priceDetails;
    const priceFields = ['hotel', 'flight', 'food', 'extras'];
    
    for (let field of priceFields) {
      if (priceDetails[field]) {
        const price = parseFloat(priceDetails[field]);
        if (isNaN(price) || price < 0) {
          setToast({ message: '❌ O preço de ' + field + ' deve ser um número positivo!', type: 'error', show: true });
          return false;
        }
        if (price > 999999.99) {
          setToast({ message: '❌ O preço de ' + field + ' é muito elevado (máximo: 999999.99€)!', type: 'error', show: true });
          return false;
        }
      }
    }

    // ====== VALIDAÇÕES DE ACOMODAÇÕES ======
    if (selectedTravelType.main === 'single') {
      const accommodations = newTravel.accommodations || [];
      for (let i = 0; i < accommodations.length; i++) {
        const acc = accommodations[i];
        
        if (acc.name && acc.name.length > 150) {
          setToast({ message: '❌ Nome da acomodação #' + (i+1) + ' não pode ter mais de 150 caracteres! (Atual: ' + acc.name.length + '/150)', type: 'error', show: true });
          return false;
        }
        
        if (acc.description && acc.description.length > 500) {
          setToast({ message: '❌ Descrição da acomodação #' + (i+1) + ' não pode ter mais de 500 caracteres! (Atual: ' + acc.description.length + '/500)', type: 'error', show: true });
          return false;
        }
        
        if (acc.checkInDate && acc.checkOutDate) {
          const checkIn = new Date(acc.checkInDate);
          const checkOut = new Date(acc.checkOutDate);
          
          if (checkIn > checkOut) {
            setToast({ message: '❌ Data de check-in não pode ser posterior a check-out na acomodação #' + (i+1) + '!', type: 'error', show: true });
            return false;
          }
        }
        
        if (acc.nights) {
          const nights = parseInt(acc.nights);
          if (isNaN(nights) || nights < 0 || nights > 365) {
            setToast({ message: '❌ Número de noites da acomodação #' + (i+1) + ' deve estar entre 0 e 365!', type: 'error', show: true });
            return false;
          }
        }
        
        if (acc.rating) {
          const rating = parseInt(acc.rating);
          if (isNaN(rating) || rating < 0 || rating > 5) {
            setToast({ message: '❌ Rating da acomodação #' + (i+1) + ' deve estar entre 0 e 5!', type: 'error', show: true });
            return false;
          }
        }
      }
    }

    // ====== VALIDAÇÕES DE ALIMENTAÇÃO ======
    const foodRecs = newTravel.foodRecommendations || [];
    for (let i = 0; i < foodRecs.length; i++) {
      const food = foodRecs[i];
      
      if (food.name && food.name.length > 150) {
        setToast({ message: '❌ Nome do prato #' + (i+1) + ' não pode ter mais de 150 caracteres! (Atual: ' + food.name.length + '/150)', type: 'error', show: true });
        return false;
      }
      
      if (food.description && food.description.length > 500) {
        setToast({ message: '❌ Descrição do prato #' + (i+1) + ' não pode ter mais de 500 caracteres! (Atual: ' + food.description.length + '/500)', type: 'error', show: true });
        return false;
      }
    }

    // ====== VALIDAÇÕES DE TRANSPORTES ======
    const transports = newTravel.localTransport || [];
    if (transports.length === 0) {
      setToast({ message: '⚠️ Aviso: Nenhum transporte local foi adicionado. Considere adicionar informações sobre os transportes utilizados.', type: 'warning', show: true });
    }

    // ====== VALIDAÇÕES DE PONTOS DE REFERÊNCIA ======
    const points = newTravel.pointsOfInterest || [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      if (point.name && point.name.length > 150) {
        setToast({ message: '❌ Nome do ponto de referência #' + (i+1) + ' não pode ter mais de 150 caracteres! (Atual: ' + point.name.length + '/150)', type: 'error', show: true });
        return false;
      }
      
      if (point.description && point.description.length > 1000) {
        setToast({ message: '❌ Descrição do ponto de referência #' + (i+1) + ' não pode ter mais de 1000 caracteres! (Atual: ' + point.description.length + '/1000)', type: 'error', show: true });
        return false;
      }
      
      if (point.type && point.type.length > 100) {
        setToast({ message: '❌ Tipo do ponto de referência #' + (i+1) + ' não pode ter mais de 100 caracteres! (Atual: ' + point.type.length + '/100)', type: 'error', show: true });
        return false;
      }
    }

    // ====== VALIDAÇÕES DE ITINERÁRIO ======
    const itinerary = newTravel.itinerary || [];
    for (let i = 0; i < itinerary.length; i++) {
      const item = itinerary[i];
      
      if (item.day && item.day.length > 100) {
        setToast({ message: '❌ Título do dia #' + (i+1) + ' não pode ter mais de 100 caracteres! (Atual: ' + item.day.length + '/100)', type: 'error', show: true });
        return false;
      }
      
      if (item.activities && Array.isArray(item.activities)) {
        const combinedActivities = item.activities.join('\n');
        if (combinedActivities.length > 1500) {
          setToast({ message: '❌ O itinerário do dia #' + (i+1) + ' não pode ter mais de 1500 caracteres no total! (Atual: ' + combinedActivities.length + '/1500)', type: 'error', show: true });
          return false;
        }
      }
    }

    // ====== VALIDAÇÕES DE PONTOS NEGATIVOS ======
    const negativePoints = newTravel.negativePoints || [];
    if (Array.isArray(negativePoints)) {
      for (let i = 0; i < negativePoints.length; i++) {
        const point = negativePoints[i];
        
        if (point.name && point.name.length > 150) {
          setToast({ message: '❌ Nome do ponto negativo #' + (i+1) + ' não pode ter mais de 150 caracteres! (Atual: ' + point.name.length + '/150)', type: 'error', show: true });
          return false;
        }
        
        if (point.description && point.description.length > 500) {
          setToast({ message: '❌ Descrição do ponto negativo #' + (i+1) + ' não pode ter mais de 500 caracteres! (Atual: ' + point.description.length + '/500)', type: 'error', show: true });
          return false;
        }
      }
    }
    
    return true;
  };

  // Função para validar apenas campos essenciais para rascunho
  const validateFormForDraft = () => {
    // Para rascunho, apenas o nome é obrigatório
    if (!newTravel.name.trim()) {
      setToast({ message: '❌ O nome da viagem é obrigatório para guardar como rascunho (*)!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.name.length < 3) {
      setToast({ message: '❌ O nome da viagem deve ter pelo menos 3 caracteres!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.name.length > 100) {
      setToast({ message: '❌ O nome da viagem não pode ter mais de 100 caracteres! (Atual: ' + newTravel.name.length + '/100)', type: 'error', show: true });
      return false;
    }

    return true;
  };

  // Funções de manipulação de estado
  const calculateTotalPrice = () => {
    const hotel = parseFloat(newTravel.priceDetails.hotel) || 0;
    const food = parseFloat(newTravel.priceDetails.food) || 0;
    const transport = parseFloat(newTravel.priceDetails.transport) || 0;
    const extras = parseFloat(newTravel.priceDetails.extras) || 0;
    return hotel + food + transport + extras;
  };

  const addAccommodation = () => {
    // Validação para viagens de destino único
    if (selectedTravelType.main === 'single') {
      if (!newTravel.country || !newTravel.city) {
        setToast({ 
          message: 'Por favor, selecione primeiro o país e a cidade na aba "Informações Gerais"!', 
          type: 'error', 
          show: true 
        });
        return;
      }
      
      // Para destino único, adicionar diretamente ao newTravel
      setNewTravel(prev => ({
        ...prev,
        accommodations: [
          ...prev.accommodations,
          {
            name: '',
            type: '',
            country: '',
            city: '',
            description: '',
            rating: 0,
            nights: '',
            price: '',
            checkInDate: '',
            checkOutDate: '',
            bookingDate: '',
            regime: '',
            images: []
          }
        ]
      }));
    }
    
    // Validação para viagens multidestino
    if (selectedTravelType.main === 'multi') {
      if (multiDestinations.length === 0) {
        setToast({ 
          message: 'Por favor, adicione pelo menos um destino (país e cidade) na aba "Informações Gerais"!', 
          type: 'error', 
          show: true 
        });
        return;
      }
      if (selectedDestinationIndex === "" || selectedDestinationIndex === undefined) {
        setToast({ 
          message: 'Por favor, selecione um destino válido para adicionar a estadia!', 
          type: 'error', 
          show: true 
        });
        return;
      }

      // Para multidestino, trabalhar com o estado específico do destino
      const destinationKey = getCurrentDestinationKey();
      if (destinationKey) {
        const currentAccommodations = accommodationsByDestination[destinationKey] || [
          {
            name: '',
            type: '',
            country: '',
            city: '',
            description: '',
            rating: 0,
            nights: '',
            price: '',
            checkInDate: '',
            checkOutDate: '',
            bookingDate: '',
            regime: '',
            images: []
          }
        ];
        
        setAccommodationsByDestination(prev => ({
          ...prev,
          [destinationKey]: [
            ...currentAccommodations,
            {
              name: '',
              type: '',
              country: '',
              city: '',
              description: '',
              rating: 0,
              nights: '',
              price: '',
              checkInDate: '',
              checkOutDate: '',
              bookingDate: '',
              regime: '',
              images: []
            }
          ]
        }));
      }
    }
  };

  const removeAccommodation = (index) => {
    if (selectedTravelType.main === 'single') {
      setNewTravel(prev => ({
        ...prev,
        accommodations: prev.accommodations.filter((_, i) => i !== index)
      }));
    } else if (selectedTravelType.main === 'multi') {
      const destinationKey = getCurrentDestinationKey();
      if (destinationKey) {
        const currentAccommodations = accommodationsByDestination[destinationKey] || [];
        setAccommodationsByDestination(prev => ({
          ...prev,
          [destinationKey]: currentAccommodations.filter((_, i) => i !== index)
        }));
      }
    }
  };

  // ===== TRANSPORT MANAGEMENT FUNCTIONS =====
  const addTransport = () => {
    if (!newTransport.name.trim()) {
      setToast({ message: '❌ Nome do transporte é obrigatório!', type: 'error', show: true });
      return;
    }
    
    setNewTravel(prev => ({
      ...prev,
      localTransport: [
        ...prev.localTransport,
        {
          id: Date.now(),
          name: newTransport.name.trim(),
          description: newTransport.description.trim(),
          cost: parseFloat(newTransport.cost) || 0
        }
      ]
    }));
    
    setNewTransport({ name: '', description: '', cost: '' });
    setIsTransportFormOpen(false);
    setToast({ message: '✅ Transporte adicionado com sucesso!', type: 'success', show: true });
  };

  const updateTransport = (index) => {
    if (!newTransport.name.trim()) {
      setToast({ message: '❌ Nome do transporte é obrigatório!', type: 'error', show: true });
      return;
    }
    
    setNewTravel(prev => {
      const updatedTransports = [...prev.localTransport];
      updatedTransports[index] = {
        ...updatedTransports[index],
        name: newTransport.name.trim(),
        description: newTransport.description.trim(),
        cost: parseFloat(newTransport.cost) || 0
      };
      return { ...prev, localTransport: updatedTransports };
    });
    
    setNewTransport({ name: '', description: '', cost: '' });
    setEditingTransportIndex(null);
    setIsTransportFormOpen(false);
    setToast({ message: '✅ Transporte atualizado com sucesso!', type: 'success', show: true });
  };

  const deleteTransport = (index) => {
    setNewTravel(prev => ({
      ...prev,
      localTransport: prev.localTransport.filter((_, i) => i !== index)
    }));
    setEditingTransportIndex(null);
    setNewTransport({ name: '', description: '', cost: '' });
    setIsTransportFormOpen(false);
    setToast({ message: '✅ Transporte removido com sucesso!', type: 'success', show: true });
  };

  const editTransport = (index) => {
    const transport = newTravel.localTransport[index];
    setNewTransport({
      name: transport.name,
      description: transport.description,
      cost: transport.cost.toString()
    });
    setEditingTransportIndex(index);
    setIsTransportFormOpen(true);
  };

  const cancelEditTransport = () => {
    setNewTransport({ name: '', description: '', cost: '' });
    setEditingTransportIndex(null);
    setIsTransportFormOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      if (name === 'category') {
        setNewTravel((prevState) => {
          let updatedCategories = [...prevState.category];
          if (checked) {
            updatedCategories.push(value);
          } else {
            updatedCategories = updatedCategories.filter((category) => category !== value);
          }
          return { ...prevState, category: updatedCategories };
        });
      } else if (name === 'languages') {
        setNewTravel((prevState) => {
          let updatedLanguages = [...(prevState.languages || [])];
          if (checked) {
            updatedLanguages.push(value);
          } else {
            updatedLanguages = updatedLanguages.filter((language) => language !== value);
          }
          return { ...prevState, languages: updatedLanguages };
        });
      } else if (name === 'localTransport') {
        setNewTravel((prevState) => {
          let updatedTransport = [...prevState.localTransport];
          if (checked) {
            updatedTransport.push(value);
          } else {
            updatedTransport = updatedTransport.filter((transport) => transport !== value);
          }
          return { ...prevState, localTransport: updatedTransport };
        });
      }
    } else if (type === 'file') {
      if (name === 'highlightImage') {
        const file = files[0];
        if (file) {
          setNewTravel((prevState) => ({
            ...prevState,
            highlightImage: file,
          }));
          setImagePreview(URL.createObjectURL(file));
        } else {
          setNewTravel((prevState) => ({
            ...prevState,
            highlightImage: '',
          }));
          setImagePreview(null);
        }
      } else if (name === 'travelVideos') {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const maxTotalSize = 100 * 1024 * 1024; // 100MB
        const maxTotalDuration = 180; // 3 minutos em segundos

        // Calcular tamanho total dos vídeos existentes
        const currentTotals = calculateVideoTotals(newTravel.travelVideos, videosInfo);
        
        // Calcular tamanho total dos novos arquivos
        let newFilesSize = 0;
        files.forEach(file => {
          newFilesSize += file.size;
        });

        // Verificar se o tamanho total excede o limite
        if (currentTotals.totalSize + newFilesSize > maxTotalSize) {
          const remainingSize = formatFileSize(maxTotalSize - currentTotals.totalSize);
          setToast({ 
            message: `O tamanho total dos vídeos não pode exceder 100MB. Espaço restante: ${remainingSize}. Por favor, selecione arquivos menores.`, 
            type: 'error', 
            show: true 
          });
          // Limpar o input
          e.target.value = '';
          return;
        }

        // Processar cada arquivo para validar duração
        let processedCount = 0;
        const newVideos = [...newTravel.travelVideos];
        const newPreviews = [...videosPreviews];
        const newInfos = [...videosInfo];

        files.forEach((file, fileIndex) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          
          video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            
            // Calcular duração total incluindo este vídeo
            const currentDuration = currentTotals.totalDuration;
            let newVideosDuration = 0;
            for (let i = 0; i < fileIndex; i++) {
              const prevVideoInfo = newInfos.find((info, idx) => idx === newVideos.length + i);
              if (prevVideoInfo) newVideosDuration += prevVideoInfo.durationSeconds || 0;
            }
            
            const totalDurationWithNew = currentDuration + newVideosDuration + video.duration;
            
            if (totalDurationWithNew > maxTotalDuration) {
              const remainingTime = formatVideoDuration(maxTotalDuration - currentDuration - newVideosDuration);
              setToast({ 
                message: `A duração total dos vídeos não pode exceder 3 minutos. Tempo restante: ${remainingTime}. Por favor, selecione vídeos mais curtos.`, 
                type: 'error', 
                show: true 
              });
              processedCount++;
              // Limpar o input se todos os arquivos foram processados
              if (processedCount === files.length) {
                e.target.value = '';
              }
              return;
            }

            // Adicionar o vídeo se passou nas validações
            newVideos.push(file);
            newPreviews.push(URL.createObjectURL(file));
            newInfos.push({
              name: file.name,
              size: formatFileSize(file.size),
              duration: formatVideoDuration(video.duration),
              durationSeconds: video.duration,
              sizeBytes: file.size
            });

            processedCount++;
            
            // Se todos os arquivos foram processados, atualizar o estado
            if (processedCount === files.length) {
              setNewTravel((prevState) => ({
                ...prevState,
                travelVideos: newVideos,
              }));
              setVideosPreviews(newPreviews);
              setVideosInfo(newInfos);
              
              // Limpar o input para permitir selecionar os mesmos arquivos novamente
              e.target.value = '';
            }
          };

          video.onerror = function() {
            processedCount++;
            setToast({ 
              message: `Erro ao carregar o vídeo "${file.name}". Verifique se o formato é válido.`, 
              type: 'error', 
              show: true 
            });
            
            // Limpar o input se todos os arquivos foram processados
            if (processedCount === files.length) {
              e.target.value = '';
            }
          };

          video.src = URL.createObjectURL(file);
        });
      } else if (name === 'images_generalInformation') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setGeneralInfoImagePreviews((prev) => [...prev, ...previews]);
      } else if (name === 'images_localTransport') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setTransportImagePreviews((prev) => [...prev, ...previews]);
      }
    } else if (name.startsWith('accommodations')) {
      const parts = name.split('.');
      const indexStr = parts[0].replace('accommodations', '');
      const field = parts[1];
      const index = parseInt(indexStr, 10);
      
      if (selectedTravelType.main === 'single') {
        setNewTravel((prevState) => {
          const updatedAccommodations = [...prevState.accommodations];
          if (!updatedAccommodations[index]) {
            updatedAccommodations[index] = {
              name: '',
              type: '',
              description: '',
              rating: 0,
              nights: '',
              checkInDate: '',
              checkOutDate: '',
              regime: '',
              images: []
            };
          }
          updatedAccommodations[index] = {
            ...updatedAccommodations[index],
            [field]: value
          };
          return { ...prevState, accommodations: updatedAccommodations };
        });
      } else if (selectedTravelType.main === 'multi') {
        const destinationKey = getCurrentDestinationKey();
        if (destinationKey) {
          const currentAccommodations = accommodationsByDestination[destinationKey] || [
            {
              name: '',
              type: '',
              description: '',
              rating: 0,
              nights: '',
              checkInDate: '',
              checkOutDate: '',
              regime: '',
              images: []
            }
          ];
          
          const updatedAccommodations = [...currentAccommodations];
          if (!updatedAccommodations[index]) {
            updatedAccommodations[index] = {
              name: '',
              type: '',
              description: '',
              rating: 0,
              nights: '',
              checkInDate: '',
              checkOutDate: '',
              regime: '',
              images: []
            };
          }
          updatedAccommodations[index] = {
            ...updatedAccommodations[index],
            [field]: value
          };
          
          setAccommodationsByDestination(prev => ({
            ...prev,
            [destinationKey]: updatedAccommodations
          }));
        }
      }
    } else if (name.includes('priceDetails.')) {
      const field = name.split('.')[1];
      setNewTravel((prevState) => {
        const updatedPriceDetails = { ...prevState.priceDetails, [field]: value };
        const hotel = parseFloat(updatedPriceDetails.hotel) || 0;
        const food = parseFloat(updatedPriceDetails.food) || 0;
        const transport = parseFloat(updatedPriceDetails.transport) || 0;
        const extras = parseFloat(updatedPriceDetails.extras) || 0;
        const totalPrice = hotel + food + transport + extras;
        
        return {
          ...prevState,
          priceDetails: updatedPriceDetails,
          price: totalPrice.toString()
        };
      });
    } else {
      // Para destino único, verificar se está mudando país ou cidade
      if (selectedTravelType.main === 'single') {
        handleCountryCityReset(name, value);
      }
      
      setNewTravel((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleFoodChange = (e) => {
    const { name, value } = e.target;
    setNewFoodRecommendation((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEditFoodRecommendation = (e) => {
    e.stopPropagation();
    if (!newFoodRecommendation.name.trim()) {
      setToast({ message: 'O nome da recomendação alimentar é obrigatório!', type: 'error', show: true });
      return;
    }
    setNewTravel((prev) => {
      const updatedRecommendations = [...prev.foodRecommendations];
      const payload = {
        name: newFoodRecommendation.name,
        description: newFoodRecommendation.description,
        // Single photo per food recommendation (per the user's spec).
        // We keep the raw File for the post-create upload step.
        photoFile: newFoodRecommendation.photoFile || null,
      };
      if (editingFoodIndex !== null) {
        updatedRecommendations[editingFoodIndex] = payload;
      } else {
        updatedRecommendations.push(payload);
      }
      return { ...prev, foodRecommendations: updatedRecommendations };
    });
    setNewFoodRecommendation({ name: '', description: '', photoFile: null, photoPreview: null });
    setEditingFoodIndex(null);
    setToast({ message: 'Recomendação alimentar adicionada/editada com sucesso!', type: 'success', show: true });
  };

  const handleDeleteFoodRecommendation = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => {
      const updatedRecommendations = prev.foodRecommendations.filter((_, i) => i !== index);
      return { ...prev, foodRecommendations: updatedRecommendations };
    });
    setEditingFoodIndex(null);
    setNewFoodRecommendation({ name: '', description: '', photoFile: null, photoPreview: null });
    showToast('Recomendação alimentar removida com sucesso!', 'success');
    setToast({ message: 'Recomendação alimentar removida com sucesso!', type: 'success', show: true });
  };

  const handleEditFoodRecommendation = (e, index) => {
    e.stopPropagation();
    const recommendation = newTravel.foodRecommendations[index];
    if (recommendation) {
      // When editing, the photo is already a backend URL (after a previous
      // save) — there's no File to re-upload. We expose the URL as the
      // preview so the user still sees the existing image.
      setNewFoodRecommendation({
        name: recommendation.name || '',
        description: recommendation.description || '',
        photoFile: null,
        photoPreview: recommendation.photoUrl || null,
      });
      setEditingFoodIndex(index);
    }
  };

  const handleCancelEditFood = (e) => {
    e.stopPropagation();
    setNewFoodRecommendation({ name: '', description: '', photoFile: null, photoPreview: null });
    setEditingFoodIndex(null);
  };

  const handlePointChange = (e) => {
    const { name, value } = e.target;
    setNewPointOfInterest((prev) => ({ ...prev, [name]: value }));
  };

  const handleNegativeChange = (e) => {
    const { name, value } = e.target;
    setNewNegativePoint((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEditNegativePoint = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newNegativePoint.name.trim()) return;

    if (editingNegativeIndex !== null) {
      setNewTravel((prev) => {
        const updatedNegativePoints = [...prev.negativePoints];
        updatedNegativePoints[editingNegativeIndex] = { ...newNegativePoint };
        return { ...prev, negativePoints: updatedNegativePoints };
      });
      setEditingNegativeIndex(null);
    } else {
      setNewTravel((prev) => ({
        ...prev,
        negativePoints: [...prev.negativePoints, { ...newNegativePoint }]
      }));
    }

    setNewNegativePoint({ name: '', description: '' });
  };

  const handleEditNegativePoint = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    const pointToEdit = newTravel.negativePoints[index];
    setNewNegativePoint({ ...pointToEdit });
    setEditingNegativeIndex(index);
  };

  const handleDeleteNegativePoint = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    setNewTravel((prev) => ({
      ...prev,
      negativePoints: prev.negativePoints.filter((_, i) => i !== index)
    }));
    showToast('Ponto negativo removido com sucesso!', 'success');
  };

  const handleCancelEditNegative = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setNewNegativePoint({ name: '', description: '' });
    setEditingNegativeIndex(null);
  };

  const handleAddOrEditPointOfInterest = (e) => {
    e.stopPropagation();
    if (!newPointOfInterest.name.trim()) {
      setToast({ message: 'O nome do ponto de referência é obrigatório!', type: 'error', show: true });
      return;
    }

    // Validação para viagens de destino único
    if (selectedTravelType.main === 'single') {
      if (!newTravel.country || !newTravel.city) {
        setToast({ 
          message: 'Por favor, selecione primeiro o país e a cidade na aba "Informações Gerais"!', 
          type: 'error', 
          show: true 
        });
        return;
      }
      
      // Para destino único, trabalhar diretamente com newTravel
      setNewTravel((prev) => {
        const updatedPoints = [...prev.pointsOfInterest];
        // Per-point photos (per user spec: photos belong to each reference
        // point, not to a global pool). Raw File objects are kept for the
        // post-create upload step.
        const payload = {
          name: newPointOfInterest.name,
          description: newPointOfInterest.description || '',
          type: newPointOfInterest.type,
          link: newPointOfInterest.link,
          photoFiles: newPointOfInterest.photoFiles || [],
        };
        if (editingPointIndex !== null) {
          updatedPoints[editingPointIndex] = payload;
        } else {
          updatedPoints.push(payload);
        }
        return { ...prev, pointsOfInterest: updatedPoints };
      });
    }
    
    // Validação para viagens multidestino
    if (selectedTravelType.main === 'multi') {
      if (multiDestinations.length === 0) {
        setToast({ 
          message: 'Por favor, adicione pelo menos um destino (país e cidade) na aba "Informações Gerais"!', 
          type: 'error', 
          show: true 
        });
        return;
      }
      if (selectedDestinationIndex === "" || selectedDestinationIndex === undefined) {
        setToast({ 
          message: 'Por favor, selecione um destino válido para adicionar o ponto de referência!', 
          type: 'error', 
          show: true 
        });
        return;
      }

      // Para multidestino, trabalhar com o estado específico do destino
      const destinationKey = getCurrentDestinationKey();
      if (destinationKey) {
        const currentPoints = pointsOfInterestByDestination[destinationKey] || [];
        const updatedPoints = [...currentPoints];
        
        if (editingPointIndex !== null) {
          updatedPoints[editingPointIndex] = {
            name: newPointOfInterest.name,
            description: newPointOfInterest.description || '',
            type: newPointOfInterest.type,
            link: newPointOfInterest.link,
            photoFiles: newPointOfInterest.photoFiles || [],
          };
        } else {
          updatedPoints.push({
            name: newPointOfInterest.name,
            description: newPointOfInterest.description || '',
            type: newPointOfInterest.type,
            link: newPointOfInterest.link,
            photoFiles: newPointOfInterest.photoFiles || [],
          });
        }

        setPointsOfInterestByDestination(prev => ({
          ...prev,
          [destinationKey]: updatedPoints
        }));
      }
    }

    setNewPointOfInterest({ name: '', description: '', type: '', link: '', photoFiles: [], photoPreviews: [] });
    setEditingPointIndex(null);
    setToast({ message: 'Ponto de referência adicionado/editado com sucesso!', type: 'success', show: true });
  };

  const handleDeletePointOfInterest = (e, index) => {
    e.stopPropagation();
    
    if (selectedTravelType.main === 'single') {
      setNewTravel((prev) => {
        const updatedPoints = prev.pointsOfInterest.filter((_, i) => i !== index);
        return { ...prev, pointsOfInterest: updatedPoints };
      });
    } else if (selectedTravelType.main === 'multi') {
      const destinationKey = getCurrentDestinationKey();
      if (destinationKey) {
        const currentPoints = pointsOfInterestByDestination[destinationKey] || [];
        setPointsOfInterestByDestination(prev => ({
          ...prev,
          [destinationKey]: currentPoints.filter((_, i) => i !== index)
        }));
      }
    }
    
    setEditingPointIndex(null);
    setNewPointOfInterest({ name: '', description: '', type: '', link: '', photoFiles: [], photoPreviews: [] });
    setToast({ message: 'Ponto de referência removido com sucesso!', type: 'success', show: true });
  };

  const handleEditPointOfInterest = (e, index) => {
    e.stopPropagation();
    
    let point;
    if (selectedTravelType.main === 'single') {
      point = newTravel.pointsOfInterest[index];
    } else if (selectedTravelType.main === 'multi') {
      const destinationKey = getCurrentDestinationKey();
      const currentPoints = pointsOfInterestByDestination[destinationKey] || [];
      point = currentPoints[index];
    }
    
    if (point) {
      // On edit: photos are already backend URLs (no File to re-upload).
      // We still expose them as previews so the user sees what's saved.
      setNewPointOfInterest({
        name: point.name || '',
        description: point.description || '',
        type: point.type || '',
        link: point.link || '',
        photoFiles: [],
        photoPreviews: Array.isArray(point.photoUrls) ? point.photoUrls : [],
      });
      setEditingPointIndex(index);
    }
  };

  const handleCancelEditPoint = (e) => {
    e.stopPropagation();
    setNewPointOfInterest({ name: '', description: '', type: '', link: '', photoFiles: [], photoPreviews: [] });
    setEditingPointIndex(null);
  };

  const calculateTripDays = () => {
    if (!newTravel.startDate || !newTravel.endDate) return 0;
    const start = new Date(newTravel.startDate);
    const end = new Date(newTravel.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleItineraryChange = (e, index) => {
    const { name, value } = e.target;
    if (name === 'day') {
      setNewItineraryDay((prev) => ({ ...prev, day: value }));
      setItineraryError('');
    } else if (name.startsWith('activity')) {
      const activityIndex = parseInt(name.split('-')[1], 10);
      const updatedActivities = [...newItineraryDay.activities];
      updatedActivities[activityIndex] = value;
      setNewItineraryDay((prev) => ({ ...prev, activities: updatedActivities }));
    }
  };

  const handleAddActivityField = (e) => {
    e.stopPropagation();
    setNewItineraryDay((prev) => ({
      ...prev,
      activities: [...prev.activities, '']
    }));
  };

  const handleRemoveActivityField = (e, index) => {
    e.stopPropagation();
    setNewItineraryDay((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const handleAddOrEditItineraryDay = (e) => {
    e.stopPropagation();
    const totalDays = calculateTripDays();
    const dayToAdd = parseInt(newItineraryDay.day, 10);

    if (isNaN(dayToAdd) || dayToAdd < 1 || dayToAdd > totalDays) {
      setItineraryError(`Por favor, insira um dia entre 1 e ${totalDays}.`);
      return;
    }

    const dayExists = newTravel.itinerary.some(
      (item) => item.day === dayToAdd && editingItineraryDay === null
    );
    if (dayExists) {
      setItineraryError(
        'Este dia já foi adicionado ao itinerário. Edite o dia existente ou escolha outro número.'
      );
      return;
    }

    setNewTravel((prev) => {
      const updatedItinerary = [...prev.itinerary];
      const filteredActivities = newItineraryDay.activities.filter(
        (act) => act.trim() !== ''
      );
      if (editingItineraryDay !== null) {
        updatedItinerary[editingItineraryDay] = {
          day: dayToAdd,
          activities: filteredActivities
        };
      } else {
        updatedItinerary.push({
          day: dayToAdd,
          activities: filteredActivities
        });
      }
      return { ...prev, itinerary: updatedItinerary.sort((a, b) => a.day - b.day) };
    });
    setNewItineraryDay({ day: '', activities: [''] });
    setEditingItineraryDay(null);
    setItineraryError('');
    setToast({ message: 'Dia do itinerário adicionado/editado com sucesso!', type: 'success', show: true });
  };

  const handleEditItineraryDay = (e, index) => {
    e.stopPropagation();
    const day = newTravel.itinerary[index];
    setNewItineraryDay({
      day: day.day.toString(),
      activities: day.activities.length > 0 ? [...day.activities] : ['']
    });
    setEditingItineraryDay(index);
    setItineraryError('');
  };

  const handleDeleteItineraryDay = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index)
    }));
    setEditingItineraryDay(null);
    setNewItineraryDay({ day: '', activities: [''] });
    showToast('Dia do itinerário removido com sucesso!', 'success');
    setItineraryError('');
    setToast({ message: 'Dia do itinerário removido com sucesso!', type: 'success', show: true });
  };

  const handleCancelEditItinerary = (e) => {
    e.stopPropagation();
    setNewItineraryDay({ day: '', activities: [''] });
    setEditingItineraryDay(null);
    setItineraryError('');
  };

  const handleEdit = (id) => {
    const travelToEdit = travels.find((travel) => travel.id === id);
    if (!travelToEdit) {
      setToast({ message: `Viagem com ID ${id} não encontrada!`, type: 'error', show: true });
      return;
    }

    setNewTravel({
      ...travelToEdit,
      highlightImage: travelToEdit.highlightImage || '',
      travelVideos: travelToEdit.travelVideos || [], // Incluir o array de vídeos
      category: travelToEdit.category || [],
      priceDetails: travelToEdit.priceDetails || { hotel: '', flight: '', food: '', extras: '' },
      accommodations: Array.isArray(travelToEdit.accommodations) && travelToEdit.accommodations.length > 0
        ? travelToEdit.accommodations.map(acc => ({
            ...acc,
            images: acc.images || [],
            country: acc.country || '',
            city: acc.city || '',
            price: acc.price || '',
            nights: acc.nights || '',
            checkInDate: acc.checkInDate || '',
            checkOutDate: acc.checkOutDate || '',
            bookingDate: acc.bookingDate || ''
          }))
        : [
            {
              name: '',
              type: '',
              country: '',
              city: '',
              description: '',
              rating: '',
              nights: '',
              price: '',
              checkInDate: '',
              checkOutDate: '',
              bookingDate: '',
              regime: '',
              images: []
            }
          ],
      foodRecommendations: Array.isArray(travelToEdit.foodRecommendations)
        ? travelToEdit.foodRecommendations.map(food => ({
            name: food.name || '',
            description: food.description || ''
          }))
        : [],
      images_foodRecommendations: travelToEdit.images_foodRecommendations || [],
      pointsOfInterest: Array.isArray(travelToEdit.pointsOfInterest)
        ? travelToEdit.pointsOfInterest.map(point => ({
            name: point.name || '',
            type: point.type || '',
            link: point.link || ''
          }))
        : [],
      images_referencePoints: travelToEdit.images_referencePoints || [],
      itinerary: Array.isArray(travelToEdit.itinerary) ? travelToEdit.itinerary : [],
      localTransport: Array.isArray(travelToEdit.localTransport) ? travelToEdit.localTransport : [],
      privacy: travelToEdit.privacy || 'public'
    });

    setEditTravelId(id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveTab('generalInfo');
    
    // Restaurar tipo de viagem (single ou multi)
    if (travelToEdit.travelType) {
      setSelectedTravelType(travelToEdit.travelType);
    } else {
      // Fallback: detectar pelo numero de destinos
      setSelectedTravelType({ 
        main: 'single',  // Default para compatibilidade com viagens antigas
        isGroup: false 
      });
    }
    
    // Restaurar dados de multidestino se aplicável
    if (travelToEdit.travelType?.main === 'multi' && travelToEdit.multiDestinations) {
      setMultiDestinations(travelToEdit.multiDestinations);
      setSelectedDestinationIndex(0);
      
      // Restaurar dados por destino se existirem
      if (travelToEdit.accommodationsByDestination) {
        setAccommodationsByDestination(travelToEdit.accommodationsByDestination);
      }
      if (travelToEdit.pointsOfInterestByDestination) {
        setPointsOfInterestByDestination(travelToEdit.pointsOfInterestByDestination);
      }
    }
    
    // Restaurar membros do grupo se aplicável
    if (travelToEdit.groupData?.members) {
      setGroupMembers(travelToEdit.groupData.members);
    }
    
    setNewFoodRecommendation({ name: '', description: '', photoFile: null, photoPreview: null });
    setEditingFoodIndex(null);
    setNewPointOfInterest({ name: '', description: '', type: '', link: '', photoFiles: [], photoPreviews: [] });
    setEditingPointIndex(null);
    setNewItineraryDay({ day: '', activities: [''] });
    setEditingItineraryDay(null);
    setItineraryError('');

    // Corrigir a pré-visualização da imagem de destaque
    if (travelToEdit.highlightImage) {
      if (travelToEdit.highlightImage instanceof File) {
        setImagePreview(URL.createObjectURL(travelToEdit.highlightImage));
      } else if (typeof travelToEdit.highlightImage === 'string') {
        setImagePreview(travelToEdit.highlightImage);
      } else {
        setImagePreview(null);
      }
    } else {
      setImagePreview(null);
    }

    // Corrigir a pré-visualização dos vídeos
    if (travelToEdit.travelVideos && Array.isArray(travelToEdit.travelVideos)) {
      const previews = [];
      const infos = [];
      
      travelToEdit.travelVideos.forEach((video, index) => {
        if (video instanceof File) {
          previews.push(URL.createObjectURL(video));
        } else if (typeof video === 'string') {
          previews.push(video);
        }
        // Para vídeos existentes, não temos informações detalhadas, então adicionamos informações básicas
        infos.push({
          name: `video-${index + 1}`,
          size: 'Carregado',
          duration: '--:--',
          durationSeconds: 0,
          sizeBytes: 0
        });
      });
      
      setVideosPreviews(previews);
      setVideosInfo(infos);
    } else {
      setVideosPreviews([]);
      setVideosInfo([]);
    }

    if (travelToEdit.images_generalInformation && Array.isArray(travelToEdit.images_generalInformation)) {
      const previews = travelToEdit.images_generalInformation.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setGeneralInfoImagePreviews(previews);
    } else {
      setGeneralInfoImagePreviews([]);
    }

    if (travelToEdit.accommodations && Array.isArray(travelToEdit.accommodations)) {
      // (Removed: global accommodation image previews — per-item
       // previews live inside each accommodation card.)
    } else {
      // (Removed: global accommodation image previews — per-item
       // previews live inside each accommodation card.)
    }

    if (travelToEdit.images_foodRecommendations && Array.isArray(travelToEdit.images_foodRecommendations)) {
      // (Removed: global food image previews — per-item previews
      // live on each recommendation card.)
    } else {
      // (Removed: global food image previews — per-item previews
      // live on each recommendation card.)
    }

    if (travelToEdit.images_localTransport && Array.isArray(travelToEdit.images_localTransport)) {
      const previews = travelToEdit.images_localTransport.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setTransportImagePreviews(previews);
    } else {
      setTransportImagePreviews([]);
    }

    if (travelToEdit.images_referencePoints && Array.isArray(travelToEdit.images_referencePoints)) {
      // (Removed: global reference-point image previews — per-item
       // previews live on each ref-point card.)
    } else {
      // (Removed: global reference-point image previews — per-item
       // previews live on each ref-point card.)
    }
  };

  // ===== LOAD BACKEND TRIP INTO FORM FOR EDITING =====
  const handleLoadBackendTrip = async (backendTripId) => {
    try {
      // Fetch fresh data from the backend (single round-trip). This
      // is more reliable than the local `userTrips` state which can
      // be stale if the user edited a trip on another device.
      const res = await request('GET', `/trips/${backendTripId}/edit-details`);
      const trip = res.data || res;
      if (!trip || !trip.id) {
        setToast({ message: '❌ Viagem não encontrada!', type: 'error', show: true });
        return;
      }

      // Transform backend trip data to frontend form state
      const frontendTrip = transformBackendTripToFrontend(trip);
      if (!frontendTrip) {
        setToast({ message: '❌ Erro ao carregar dados da viagem!', type: 'error', show: true });
        return;
      }

      // Load trip data into form
      setNewTravel(frontendTrip);
      setSelectedTripForEdit(backendTripId);
      setEditTravelId(backendTripId);
      setIsEditing(true);
      setIsModalOpen(true);
      setActiveTab('generalInfo');
      setSelectedTravelType({ main: 'single', isGroup: false });

      // Reset editing states
      setNewFoodRecommendation({ name: '', description: '', photoFile: null, photoPreview: null });
      setEditingFoodIndex(null);
      setNewPointOfInterest({ name: '', description: '', type: '', link: '', photoFiles: [], photoPreviews: [] });
      setEditingPointIndex(null);
      setNewItineraryDay({ day: '', activities: [''] });
      setEditingItineraryDay(null);
      setItineraryError('');
      setImagePreview(null);
      setVideosPreviews([]);
      setVideosInfo([]);

      setToast({ message: '✅ Viagem carregada para edição!', type: 'success', show: true });
    } catch (error) {
      console.error('❌ Error loading backend trip:', error);
      setToast({ message: '❌ Erro ao carregar viagem!', type: 'error', show: true });
    }
  };

  // ===== DELETE BACKEND TRIP =====
  const handleDeleteBackendTrip = async (backendTripId) => {
    const confirmed = window.confirm('Tem certeza que deseja eliminar esta viagem? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      setLoadingUserTrips(true);
      
      // Delete trip from backend
      await request('DELETE', `/trips/${backendTripId}`);
      
      // Remove from local state
      const updatedUserTrips = userTrips.filter(t => (t.tripId || t.id) !== backendTripId);
      setUserTrips(updatedUserTrips);
      setTravels(prev => prev.filter(t => t.id !== backendTripId));
      
      // Refresh cache
      localStorage.setItem("user-trips-backend", JSON.stringify(updatedUserTrips));
      
      // Reset form if we were editing this trip
      if (selectedTripForEdit === backendTripId) {
        resetForm();
        setIsModalOpen(false);
      }
      
      setToast({ message: '✅ Viagem eliminada com sucesso!', type: 'success', show: true });
    } catch (error) {
      console.error('❌ Error deleting trip:', error);
      setToast({ message: `❌ Erro ao eliminar viagem: ${error.message}`, type: 'error', show: true });
    } finally {
      setLoadingUserTrips(false);
    }
  };

  // ===== REFRESH USER TRIPS FROM BACKEND =====
  const refreshUserTrips = async () => {
    try {
      setLoadingUserTrips(true);
      const response = await request('GET', '/trips/my-trips');
      
      if (response.data?.content) {
        const trips = response.data.content;
        setUserTrips(trips);
        // Local drafts are now handled by `useTripDraft` (autosaved to
        // localStorage). The user-trip list comes purely from the
        // backend paginated endpoint.
        setTravels(trips.map((t) => normalizeBackendTrip(t, apiCategories)));
        localStorage.setItem("user-trips-backend", JSON.stringify(trips));
      }
    } catch (error) {
      console.error('❌ Error refreshing trips:', error);
      setToast({ message: `❌ Erro ao atualizar viagens: ${error.message}`, type: 'error', show: true });
    } finally {
      setLoadingUserTrips(false);
    }
  };

  const handleDelete = (id) => {
    setTravels(travels.filter((travel) => travel.id !== id));
    setToast({ message: 'Viagem eliminada com sucesso!', type: 'success', show: true });
  };

  // Função para publicar um rascunho (permite converter draft para published)
  const publishDraft = (id) => {
    const draftTravel = travels.find(t => t.id === id);
    if (!draftTravel || draftTravel.status !== 'draft') {
      setToast({ message: '❌ Rascunho não encontrado!', type: 'error', show: true });
      return;
    }

    // Atualizar status para published
    setTravels(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'published' } : t
    ));
    setToast({ message: '✅ Rascunho publicado com sucesso!', type: 'success', show: true });
  };

  // ===== UPLOAD TRIP MEDIA AFTER CREATION =====
  // Called after POST /trips returns the created trip with sub-entity IDs.
  // Uploads all File objects selected in the form to their respective media endpoints.
  // Non-fatal: individual upload failures are logged but do not block the flow.
  const uploadTripMedia = async (tripId, createdTripData) => {
    const uploadErrors = [];

    const uploadSingle = async (url, file) => {
      if (!(file instanceof File)) return;
      try {
        await uploadFile(url, file);
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Erro desconhecido';
        uploadErrors.push(msg);
      }
    };

    // 1. Highlight image → uploaded first so it becomes the trip's cover photo
    if (newTravel.highlightImage instanceof File) {
      await uploadSingle(`/trips/${tripId}/media/photos`, newTravel.highlightImage);
    }

    // 2. General trip photos
    for (const file of (newTravel.images_generalInformation || [])) {
      await uploadSingle(`/trips/${tripId}/media/photos`, file);
    }

    // 3. Trip videos
    for (const file of (newTravel.travelVideos || [])) {
      await uploadSingle(`/trips/${tripId}/media/videos`, file);
    }

    // 4. Accommodation photos — matched by position to sub-entities returned in POST response
    const createdAccommodations = createdTripData?.accommodations || [];
    for (let i = 0; i < createdAccommodations.length; i++) {
      const accId = createdAccommodations[i]?.id;
      const accImages = newTravel.accommodations?.[i]?.images || [];
      if (accId) {
        for (const file of accImages) {
          await uploadSingle(`/trips/${tripId}/media/accommodations/${accId}/photos`, file);
        }
      }
    }

    // 5. Food photos — at most 1 per food, owned by the food itself
    //    (per the user's spec; replaces the previous global pool).
    const createdFoods = createdTripData?.recommendedFoods || [];
    for (let i = 0; i < createdFoods.length; i++) {
      const foodId = createdFoods[i]?.id;
      const photoFile = newTravel.foodRecommendations?.[i]?.photoFile;
      if (foodId && photoFile instanceof File) {
        await uploadSingle(`/trips/${tripId}/media/foods/${foodId}/photo`, photoFile);
      }
    }

    // 6. Reference point photos — multiple per point, owned by the point
    //    itself (per the user's spec; replaces the previous global pool).
    const createdRefPoints = createdTripData?.referencePoints || [];
    for (let i = 0; i < createdRefPoints.length; i++) {
      const refId = createdRefPoints[i]?.id;
      const photos = newTravel.pointsOfInterest?.[i]?.photoFiles || [];
      if (refId) {
        for (const file of photos) {
          if (file instanceof File) {
            await uploadSingle(`/trips/${tripId}/media/reference-points/${refId}/photos`, file);
          }
        }
      }
    }

    if (uploadErrors.length > 0) {
      const summary = uploadErrors.length === 1
        ? `⚠️ Falha ao carregar 1 ficheiro: ${uploadErrors[0]}`
        : `⚠️ ${uploadErrors.length} ficheiros não foram carregados: ${uploadErrors[0]}${uploadErrors.length > 1 ? ' (e outros)' : ''}`;
      setToast({ message: summary, type: 'error', show: true });
    }
  };

  const handleAddTravel = async () => {
    // Se a ação for guardar como rascunho
    if (saveAction === 'draft') {
      if (!validateFormForDraft()) {
        setSaveAction(null);
        return;
      }

      // Guardar como rascunho (sem validação completa)
      const draftTravel = {
        ...newTravel,
        status: 'draft',
        id: isEditing ? editTravelId : Date.now(),
        travelType: selectedTravelType,
        multiDestinations: selectedTravelType.main === 'multi' ? multiDestinations : null,
        groupData: selectedTravelType.isGroup ? { members: groupMembers, admin: user.firstName } : null
      };

      if (isEditing) {
        const updatedTravels = travels.map(t => t.id === editTravelId ? draftTravel : t);
        setTravels(updatedTravels);
        localStorage.setItem("user-travels", JSON.stringify(updatedTravels));
        showToast('✏️ Rascunho atualizado com sucesso!', 'success');
      } else {
        const updatedTravels = [...travels, draftTravel];
        setTravels(updatedTravels);
        localStorage.setItem("user-travels", JSON.stringify(updatedTravels));
        showToast('📝 Viagem guardada como rascunho! Pode continuar a editar depois.', 'success');
      }
      setSaveAction(null);
      // Draft save is a "checkpoint" the user explicitly requested, so
      // wiping the form is the expected behaviour.
      resetForm();
      return;
    }

    // Validação completa para viagens publicadas
    if (!validateForm()) {
      setSaveAction(null);
      return;
    }

    // Se multidestino: por enquanto apenas armazenar localmente; backend será integrado depois
    if (selectedTravelType.main === 'multi') {
      const multiTravel = {
        ...newTravel,
        status: 'published',
        id: isEditing ? editTravelId : Date.now(),
        travelType: selectedTravelType,
        multiDestinations: multiDestinations,
        groupData: selectedTravelType.isGroup ? { members: groupMembers, admin: user.firstName } : null
      };
      if (isEditing) {
        const updatedTravels = travels.map(t => t.id === editTravelId ? multiTravel : t);
        setTravels(updatedTravels);
        localStorage.setItem("user-travels", JSON.stringify(updatedTravels));
        showToast('✅ Viagem multidestino editada com sucesso!', 'success');
      } else {
        const updatedTravels = [...travels, multiTravel];
        setTravels(updatedTravels);
        localStorage.setItem("user-travels", JSON.stringify(updatedTravels));
        showToast('✅ Viagem multidestino adicionada com sucesso!', 'success');
      }
      setSaveAction(null);
      resetForm();
      return;
    }

    // ===== SINGLE DESTINATION: SUBMIT TO BACKEND =====
    // ── PRE-FLIGHT VALIDATION (mirrors backend constraints) ──────
    // We re-run the size/type/required checks here so we don't ping the
    // backend for a payload we already know is bad — and so the user
    // gets the same kind of message whether they trip the frontend OR
    // the backend validation. `validateForm()` above only checks the
    // user-facing required fields; this catches the rest.
    const formMedia = {
      coverPhoto: newTravel.highlightImage instanceof File ? newTravel.highlightImage : null,
      generalPhotos: (newTravel.images_generalInformation || []).filter((f) => f instanceof File),
      videos: (newTravel.travelVideos || []).filter((f) => f instanceof File),
      accommodationPhotos: (newTravel.accommodations || []).map((a) => a.images || []),
      referencePointPhotos: (newTravel.pointsOfInterest || []).map((p) => p.photoFiles || []),
      foodPhotos: (newTravel.foodRecommendations || []).map((f) => f.photoFile).filter(Boolean),
    };
    const preflight = validateTripForm(newTravel, formMedia);
    if (!preflight.valid) {
      // All errors in one modal — no more "first 3 + counter". The user
      // can see every problem, jump to the right tab, and fix them all
      // in one pass before resubmitting.
      setFormErrors(preflight.errors);
      setErrorCountsBySection(countErrorsBySection(preflight.errors));
      setShowErrorsModal(true);
      console.warn('[tripValidation] form rejected:', preflight.errors);
      setSaveAction(null);
      // DO NOT reset — the user needs their data to fix the issue.
      return;
    }

    // Validation passed → clear any stale error UI before the POST.
    setFormErrors([]);
    setErrorCountsBySection({});
    setShowErrorsModal(false);

    setIsSubmittingTrip(true);

    try {
      // Transform frontend data to backend format (includes validation & sanitization)
      const backendTripData = await transformTravelToBackendFormat();

      if (!backendTripData) {
        setIsSubmittingTrip(false);
        return;
      }

      // Call backend API to create/update trip
      if (isEditing) {
        // UPDATE: If editing, include the trip ID
        backendTripData.tripId = editTravelId;
        await request('PUT', `/trips/${editTravelId}`, backendTripData);
        showToast('✅ Viagem atualizada com sucesso no backend!', 'success');
      } else {
        // CREATE: New trip
        const response = await request('POST', '/trips', backendTripData);

        // Upload media files (photos, videos) after the trip is created.
        // The response contains sub-entity IDs needed for per-entity uploads.
        if (response?.data?.id) {
          await uploadTripMedia(response.data.id, response.data);
        }

        showToast('✅ Viagem publicada com sucesso!', 'success');

        // Refresh the backend trips list so the new trip appears immediately
        await refreshUserTrips();
        // Clear the autosaved draft so the next "create new" starts
        // fresh. Without this, the form would rehydrate the just-
        // published trip on the next visit.
        clearDraft();
      }

      setSaveAction(null);
      // Success — only now do we wipe the form.
      resetForm();

    } catch (error) {
      console.error('❌ Erro ao publicar viagem:', error);

      // ── PRESERVE FORM ON ERROR ──────────────────────────────────
      // The user filled in 15+ fields, picked 6 sub-entities, and
      // uploaded photos. Losing that to a transient 5xx / 429 / network
      // hiccup is awful UX. We keep the form populated so they can
      // fix the issue (e.g. lower a rating, shorten a text) and retry.

      // We still save a local "draft_sync_pending" copy so the user has
      // a backup in localStorage, but we DO NOT call resetForm() — the
      // form is the source of truth until publish succeeds.
      const localTravel = {
        ...newTravel,
        status: 'draft_sync_pending',
        id: isEditing ? editTravelId : Date.now(),
        travelType: selectedTravelType,
        multiDestinations: null,
        groupData: selectedTravelType.isGroup ? { members: groupMembers, admin: user.firstName } : null,
        syncError: error?.response?.data?.message || error.message || 'Erro desconhecido',
      };

      if (isEditing) {
        const updatedTravels = travels.map(t => t.id === editTravelId ? localTravel : t);
        setTravels(updatedTravels);
        localStorage.setItem("user-travels", JSON.stringify(updatedTravels));
      } else {
        const updatedTravels = [...travels, localTravel];
        setTravels(updatedTravels);
        localStorage.setItem("user-travels", JSON.stringify(updatedTravels));
      }

      // Backend may have its own per-field validation. If the error
      // response carries a single `message`, we treat it as a top-level
      // error and surface it in the same modal so the user can still
      // see all the client-side errors alongside it.
      const backendMsg = error?.response?.data?.message;
      if (backendMsg && !preflight.valid) {
        // preflight already showed the modal; just add the backend msg
        // to the existing list.
        setFormErrors((prev) => [
          { section: 'general', sectionLabel: 'Informações Gerais', sectionIcon: '📋', itemIndex: null, itemLabel: null, field: 'backend', message: `Backend: ${backendMsg}` },
          ...prev,
        ]);
      } else if (backendMsg) {
        setFormErrors([{
          section: 'general', sectionLabel: 'Informações Gerais', sectionIcon: '📋',
          itemIndex: null, itemLabel: null, field: 'backend', message: backendMsg,
        }]);
        setErrorCountsBySection({ general: 1 });
        setShowErrorsModal(true);
      } else {
        // No specific message from the backend — keep the form populated
        // and show a brief toast so the user knows something failed but
        // doesn't lose what they typed.
        showToast('⚠️ Falha ao sincronizar com backend. Os seus dados foram mantidos no formulário — pode corrigir e tentar novamente.', 'error');
      }

      setSaveAction(null);
      // ← resetForm() REMOVED — see comment above.
    } finally {
      setIsSubmittingTrip(false);
    }
  };

  // Nova função para adicionar ou editar apenas os pontos negativos
  const handleAddOrEditNegativePoints = (e) => {
    e.stopPropagation();
    setToast({ message: 'Pontos negativos atualizados com sucesso!', type: 'success', show: true });
  };

  const resetForm = () => {
    setNewTravel({
      name: '',
      user: 'Tiago',
      category: [],
      country: '',
      city: '',
      price: '',
      days: '',
      transport: '',
      startDate: '',
      endDate: '',
      BookingTripPaymentDate: '',
      highlightImage: '',
      travelVideos: [], // Reset do array de vídeos
      views: 0,
      priceDetails: { hotel: '', flight: '', food: '', extras: '' },
      images: [],
      images_generalInformation: [],
      description: '',
      longDescription: '',
      activities: [],
      accommodations: [
        {
          name: '',
          type: '',
          country: '',
          city: '',
          description: '',
          rating: '',
          nights: '',
          price: '',
          checkInDate: '',
          checkOutDate: '',
          bookingDate: '',
          regime: '',
          images: []
        }
      ],
      foodRecommendations: [],
      images_foodRecommendations: [],
      climate: '',
      pointsOfInterest: [],
      images_referencePoints: [],
      safety: { tips: [], vaccinations: [] },
      itinerary: [],
      localTransport: [],
      language: '',
      reviews: [],
      negativePoints: '',
      privacy: 'public',
      status: 'draft'
    });
    setIsModalOpen(false);
    setIsTravelTypeModalOpen(false);
    setIsEditing(false);
    setEditTravelId(null);
    setIsCategoryModalOpen(false);
    setIsTransportModalOpen(false);
    setImagePreview(null);
    setVideosPreviews([]); // Reset dos previews dos vídeos
    setVideosInfo([]); // Reset das informações dos vídeos
    setGeneralInfoImagePreviews([]);
    // (Removed: global accommodation image previews — per-item
     // previews live inside each accommodation card.)
    // (Removed: global food image previews — per-item previews live
     // on each recommendation card.)
    setTransportImagePreviews([]);
    // (Removed: global reference-point image previews — per-item
     // previews live on each ref-point card.)
    setEditingFoodIndex(null);
    setNewFoodRecommendation({ name: '', description: '', photoFile: null, photoPreview: null });
    setEditingPointIndex(null);
    setNewPointOfInterest({ name: '', description: '', type: '', link: '', photoFiles: [], photoPreviews: [] });
    setEditingItineraryDay(null);
    setNewItineraryDay({ day: '', activities: [''] });
    setItineraryError('');
    setSelectedTravelType({ main: '', isGroup: false });
    setGroupMembers([]);
    setNewMemberEmail('');
    setAvailableUsers([]);
    setMultiDestinations([]);
    setNewDestination({ country: '', city: '' });
    setSelectedDestinationIndex(0);
    setAccommodationsByDestination({});
    setPointsOfInterestByDestination({});
  };

  const openModal = () => {
    // abrir primeiro modal de tipo de viagem
    setSelectedTravelType({ main: '', isGroup: false });
    setIsTravelTypeModalOpen(true);
  };

  const handleTravelTypeSelection = (type) => {
    setSelectedTravelType(prev => ({ 
      ...prev, 
      main: type 
    }));
  };

  const confirmTravelType = () => {
    if (!selectedTravelType.main) {
      setToast({ message: 'Selecione Destino Único ou Multidestino.', type: 'error', show: true });
      return;
    }

    // Draft recovery — if the user has a saved draft for this
    // account AND the draft's travel type matches the type they
    // just selected, restore it. Otherwise start fresh.
    const saved = loadDraft();
    if (saved && saved.travelType && saved.travelType.main === selectedTravelType.main) {
      setNewTravel({ ...saved, travelType: selectedTravelType });
      showToast('📝 Rascunho recuperado. Continue de onde parou.', 'success');
    } else {
      setNewTravel(prev => ({
        ...prev,
        startDate: '',
        endDate: '',
        travelType: selectedTravelType,
      }));
    }

    setIsTravelTypeModalOpen(false);
    setIsModalOpen(true);
    setActiveTab('generalInfo');
  };

  // ------ Funções Grupo (simples) ------
  const addGroupMemberByEmail = (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    if (groupMembers.some(m => m.email === newMemberEmail.trim())) {
      setToast({ message: 'Membro já adicionado.', type: 'error', show: true });
      return;
    }
    const member = { id: Date.now(), email: newMemberEmail.trim(), status: 'added' };
    setGroupMembers(prev => [...prev, member]);
    setNewMemberEmail('');
  };
  const removeGroupMember = (id) => {
    setGroupMembers(prev => prev.filter(m => m.id !== id));
  };

  // ------ Funções Multidestino (básico) ------
  const addDestination = (e) => {
    e.preventDefault();
    if (!newDestination.country || !newDestination.city.trim()) {
      setToast({ message: 'Informe país e cidade.', type: 'error', show: true });
      return;
    }
    if (multiDestinations.some(d => d.country === newDestination.country && d.city.toLowerCase() === newDestination.city.toLowerCase())) {
      setToast({ message: 'Destino já existente.', type: 'error', show: true });
      return;
    }
    setMultiDestinations(prev => [...prev, { id: Date.now(), ...newDestination }]);
    setNewDestination({ country: '', city: '' });
  };
  const removeDestination = (id) => {
    setMultiDestinations(prev => prev.filter(d => d.id !== id));
    // Remover dados associados a este destino
    const destinationKey = `${multiDestinations.find(d => d.id === id)?.country}_${multiDestinations.find(d => d.id === id)?.city}`;
    setAccommodationsByDestination(prev => {
      const updated = { ...prev };
      delete updated[destinationKey];
      return updated;
    });
    setPointsOfInterestByDestination(prev => {
      const updated = { ...prev };
      delete updated[destinationKey];
      return updated;
    });
  };

  // Função para obter a chave do destino atual
  const getCurrentDestinationKey = () => {
    if (selectedTravelType.main === 'single') {
      return `${newTravel.country}_${newTravel.city}`;
    } else if (selectedTravelType.main === 'multi' && selectedDestinationIndex !== "" && multiDestinations[selectedDestinationIndex]) {
      const dest = multiDestinations[selectedDestinationIndex];
      return `${dest.country}_${dest.city}`;
    }
    return null;
  };

  // Função para resetar dados quando muda país/cidade para destino único
  const handleCountryCityReset = (name, value) => {
    if (name === 'country' || name === 'city') {
      // Reset dos pontos de referência e acomodações quando muda país/cidade
      setNewTravel(prev => ({
        ...prev,
        pointsOfInterest: [],
        accommodations: [
          {
            name: '',
            type: '',
            description: '',
            rating: 0,
            nights: '',
            checkInDate: '',
            checkOutDate: '',
            regime: '',
            images: []
          }
        ]
      }));
      
      // Limpar previews de imagens
      // (Removed: global reference-point image previews — per-item
       // previews live inside each ref-point card.)
      // (Removed: global accommodation image previews — per-item
       // previews live inside each accommodation card.)
      
      // Reset dos estados de edição
      setEditingPointIndex(null);
      setNewPointOfInterest({ name: '', description: '', type: '', link: '', photoFiles: [], photoPreviews: [] });
      
      setToast({ 
        message: 'Dados de pontos de referência e estadia foram limpos devido à mudança de localização!', 
        type: 'info', 
        show: true 
      });
    }
  };

  // Handler for single-travel country change via SearchableDropdown
  const handleCountryChange = (value) => {
    setNewTravel(prev => ({
      ...prev,
      country: value,
      city: '' // Clear city when country changes
    }));
    // Reset data for new location
    handleCountryCityReset('country', value);
  };

  // Handler for single-travel city change via SearchableDropdown
  const handleCityChange = (value) => {
    setNewTravel(prev => ({
      ...prev,
      city: value
    }));
  };

  // Handler for multi-destination country change via SearchableDropdown
  const handleMultiCountryChange = (value) => {
    setNewDestination(prev => ({
      ...prev,
      country: value,
      city: '' // Clear city when country changes
    }));
  };

  // Handler for multi-destination city change via SearchableDropdown
  const handleMultiCityChange = (value) => {
    setNewDestination(prev => ({
      ...prev,
      city: value
    }));
  };

  // Função para obter acomodações do destino atual
  const getCurrentAccommodations = () => {
    const destinationKey = getCurrentDestinationKey();
    if (!destinationKey) return newTravel.accommodations || [
      {
        name: '',
        type: '',
        description: '',
        rating: 0,
        nights: '',
        checkInDate: '',
        checkOutDate: '',
        regime: '',
        images: []
      }
    ];
    
    if (selectedTravelType.main === 'multi') {
      return accommodationsByDestination[destinationKey] || [
        {
          name: '',
          type: '',
          description: '',
          rating: 0,
          nights: '',
          checkInDate: '',
          checkOutDate: '',
          regime: '',
          images: []
        }
      ];
    }
    return newTravel.accommodations || [
      {
        name: '',
        type: '',
        description: '',
        rating: 0,
        nights: '',
        checkInDate: '',
        checkOutDate: '',
        regime: '',
        images: []
      }
    ];
  };

  // Função para obter pontos de interesse do destino atual
  const getCurrentPointsOfInterest = () => {
    const destinationKey = getCurrentDestinationKey();
    if (!destinationKey) return newTravel.pointsOfInterest || [];
    
    if (selectedTravelType.main === 'multi') {
      return pointsOfInterestByDestination[destinationKey] || [];
    }
    return newTravel.pointsOfInterest || [];
  };

  // Função para guardar dados do destino actual
  const saveCurrentDestinationData = () => {
    const destinationKey = getCurrentDestinationKey();
    if (!destinationKey || selectedTravelType.main !== 'multi') return;
    
    setAccommodationsByDestination(prev => ({
      ...prev,
      [destinationKey]: getCurrentAccommodations()
    }));
    
    setPointsOfInterestByDestination(prev => ({
      ...prev,
      [destinationKey]: getCurrentPointsOfInterest()
    }));
  };

  // Função para remover vídeo individual
  const removeVideo = (index) => {
    const newVideos = newTravel.travelVideos.filter((_, i) => i !== index);
    const newPreviews = videosPreviews.filter((_, i) => i !== index);
    const newInfos = videosInfo.filter((_, i) => i !== index);

    setNewTravel((prevState) => ({
      ...prevState,
      travelVideos: newVideos,
    }));
    setVideosPreviews(newPreviews);
    setVideosInfo(newInfos);
  };

  const closeModal = () => {
    resetForm();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setItineraryError('');

    // Função auxiliar: rola para o topo do container relevante
    const scrollToTop = () => {
      // Se o modal de planejamento estiver aberto, rolar o conteúdo do modal
      const modalContent = document.querySelector('.travel-planner-content');
      const modalForm = document.querySelector('.modal-form-content');
      if (modalContent) {
        const target = modalForm || modalContent;
        if (target && typeof target.scrollTo === 'function') {
          target.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        if (target) {
          target.scrollTop = 0;
          return;
        }
      }

      // Caso não haja modal, rolar a janela principal
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    };

    // Executar o centramento da nav em mobile e, em seguida, rolar para topo
    setTimeout(() => {
      const tabNav = document.querySelector('.tab-nav');
      const activeButton = document.querySelector(`.tab-nav button.active`);
      if (tabNav && activeButton && window.innerWidth <= 768) {
        const buttonLeft = activeButton.offsetLeft;
        const buttonWidth = activeButton.offsetWidth;
        const navWidth = tabNav.offsetWidth;
        const scrollLeft = buttonLeft - (navWidth / 2) + (buttonWidth / 2);
        tabNav.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }

      // finalmente, rolar para o topo do conteúdo da aba selecionada
      scrollToTop();
    }, 100);
  };

  // Função para filtrar viagens
  const getFilteredTravels = () => {
    let filtered = travels;

    // Filtro de rascunhos
    if (!showDrafts) {
      filtered = filtered.filter(t => t.status !== 'draft');
    }

    if (filterType === 'all') return filtered;
    
    return filtered.filter(travel => {
      switch (filterType) {
        case 'single':
          return !travel.travelType?.main || travel.travelType?.main === 'single';
        case 'multi':
          return travel.travelType?.main === 'multi' || travel.multiDestinations;
        case 'group':
          return travel.travelType?.isGroup || travel.groupData;
        case 'public':
          return !travel.privacy || travel.privacy === 'public';
        case 'private':
          return travel.privacy === 'private';
        case 'followers':
          return travel.privacy === 'followers';
        case 'draft':
          return travel.status === 'draft';
        default:
          return true;
      }
    });
  };

  // Funções de navegação entre tabs
  const tabs = [
    'generalInfo', 'prices', 'accommodation', 'food', 
    'transport', 'pointsOfInterest', 'itinerary', 'negativePoints', 'group'
  ];

  const handlePrevTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      const newTab = tabs[currentIndex - 1];
      setActiveTab(newTab);
      handleTabChange(newTab);
    }
  };

  const handleNextTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      const newTab = tabs[currentIndex + 1];
      setActiveTab(newTab);
      handleTabChange(newTab);
    }
  };

  return (
    <div className="my-travels-container">
      {/* Exibir Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
<br></br>
      {isTravelTypeModalOpen && (
        <div className="travel-planner-modal travel-type-modal">
          <div className="travel-planner-content" onClick={(e) => e.stopPropagation()}>
            <div 
              className="modal-header-actions"
              style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px',
                padding: '20px 25px'
              }}
            >
              <h1 style={{ margin: '0', fontSize: '1.5em', fontWeight: '700' }}>
                Que tipo de viagem realizou?
              </h1>
              
              <div 
                className="modal-header-buttons"
                style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'center',
                  margin: '0',
                  justifyContent: 'flex-end'
                }}
              >
                
                <button 
                  type="button" 
                  className="button-danger" 
                  onClick={resetForm}
                  style={{
                    background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                    color: 'white',
                    border: 'none',
                    padding: window.innerWidth <= 768 ? '12px 20px' : '15px 25px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 12px rgba(244, 67, 54, 0.4)',
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Fechar
                </button>

<button 
                  type="button" 
                  className="button-success" 
                  onClick={confirmTravelType}
                  style={{
                    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                    color: 'white',
                    border: 'none',
                    padding: window.innerWidth <= 768 ? '12px 20px' : '15px 25px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 12px rgba(76, 175, 80, 0.4)',
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Continuar
                </button>

              </div>
            </div>
            <div className="modal-form-content">
              <h3 style={{ textAlign: 'center', marginBottom: '30px', color: '#2c3e50' }}>Tipo de Destino:</h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px', 
                marginBottom: '30px' 
              }}>
                {/* Card Destino Único */}
                <div 
                  className={`destination-type-card ${selectedTravelType.main === 'single' ? 'selected' : ''}`}
                  onClick={() => handleTravelTypeSelection('single')}
                  style={{
                    border: `3px solid ${selectedTravelType.main === 'single' ? '#007bff' : '#e9ecef'}`,
                    borderRadius: '15px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: selectedTravelType.main === 'single' ? '#f0f8ff' : 'white',
                    boxShadow: selectedTravelType.main === 'single' ? '0 8px 25px rgba(0, 123, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: selectedTravelType.main === 'single' ? '#007bff' : '#2c3e50'
                  }}>
                    Viagem a Destino Único {selectedTravelType.main === 'single' && <span style={{ color: '#007bff' }}>✓</span>}
                  </h4>
                  <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px', lineHeight: '1.4' }}>
                    Uma viagem focada num único país e uma única cidade.
                  </p>
                  <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    Exemplo: Portugal - Lisboa
                  </small>
                </div>

                {/* Card Multidestino */}
                <div 
                  className={`destination-type-card ${selectedTravelType.main === 'multi' ? 'selected' : ''}`}
                  onClick={() => handleTravelTypeSelection('multi')}
                  style={{
                    border: `3px solid ${selectedTravelType.main === 'multi' ? '#007bff' : '#e9ecef'}`,
                    borderRadius: '15px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: selectedTravelType.main === 'multi' ? '#f0f8ff' : 'white',
                    boxShadow: selectedTravelType.main === 'multi' ? '0 8px 25px rgba(0, 123, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🗺️</div>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: selectedTravelType.main === 'multi' ? '#007bff' : '#2c3e50'
                  }}>
                    Viagem Multidestino {selectedTravelType.main === 'multi' && <span style={{ color: '#007bff' }}>✓</span>}
                  </h4>
                  <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px', lineHeight: '1.4' }}>
                    Uma viagem que inclui vários países e/ou várias cidades.
                  </p>
                  <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    Exemplo: Portugal - Lisboa, Coimbra / Espanha - Madrid
                  </small>
                </div>
              </div>

              {/* Checkbox Viagem em Grupo - REMOVIDO */}
              {/* 
              <div 
                className={`destination-type-card ${selectedTravelType.isGroup ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTravelType(prev => ({
                    ...prev,
                    isGroup: !prev.isGroup
                  }));
                }}
                style={{
                  border: `3px solid ${selectedTravelType.isGroup ? '#007bff' : '#e9ecef'}`,
                  borderRadius: '15px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: selectedTravelType.isGroup ? '#f0f8ff' : 'white',
                  boxShadow: selectedTravelType.isGroup ? '0 8px 25px rgba(0, 123, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  marginTop: '20px'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: selectedTravelType.isGroup ? '#007bff' : '#2c3e50'
                }}>
                  Viagem em Grupo {selectedTravelType.isGroup && <span style={{ color: '#007bff' }}>✓</span>}
                </h4>
                <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px', lineHeight: '1.4' }}>
                  Marque esta opção se a viagem foi realizada em grupo para adicionar informações dos membros.
                </p>
                <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                  Poderá adicionar e gerir membros do grupo na aba dedicada
                </small>
              </div>
              */}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="travel-planner-modal">
          <div className="travel-planner-content" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Header: Toggle Button + Action Buttons - Only visible on tablet/mobile */}
            {window.innerWidth <= 768 && (
              <div 
                style={{
                  position: 'fixed',
                  top: '15px',
                  left: '15px',
                  right: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  zIndex: 1002,
                  justifyContent: 'space-between',
                  background: 'none',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '8px',
                }}
              >
                {/* Toggle Button - Esquerda */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsHeaderOpen(!isHeaderOpen)}
                    className={`modal-header-toggle-button ${isHeaderOpen ? 'open' : ''}`}
                    style={{
                      background: isHeaderOpen 
                        ? 'linear-gradient(135deg, #dc3545, #bb2d3b)' 
                        : 'linear-gradient(135deg, #007bff, #0056b3)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '18px',
                      transition: 'all 0.3s ease',
                      color: 'white',
                      transform: isHeaderOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                    title={isHeaderOpen ? 'Fechar configurações' : 'Abrir configurações'}
                  >
                    {isHeaderOpen ? '✕' : '⚙️'}
                  </button>
                </div>

                {/* Action Buttons - Direita - Ocultos quando toggle aberto */}
                <div 
                  style={{ 
                    display: isHeaderOpen ? 'none' : 'flex', 
                    gap: '8px', 
                    alignItems: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <button 
                    type="button" 
                    onClick={() => {
                      setSaveAction('draft');
                      handleAddTravel();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #ffc107, #ffb300)',
                      color: '#000',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                    }}
                    title="Guardar como rascunho"
                  >
                    📝 Rascunho
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveAction('publish');
                      handleAddTravel();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                    }}
                    title="Publicar viagem"
                  >
                    {isEditing ? "💾 Guardar" : "✅ Adicionar"}
                  </button>
                  <button 
                    type="button" 
                    onClick={closeModal}
                    style={{
                      background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    ✕ Fechar
                  </button>
                </div>
              </div>
            )}
            
            <div 
              className={`modal-header-actions ${isHeaderOpen && window.innerWidth <= 768 ? 'show' : ''}`}
              style={{
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '20px',
                padding: window.innerWidth <= 768 ? '80px 15px 30px 15px' : '20px 25px'
              }}
            >
              {/* Desktop Layout */}
              {window.innerWidth > 768 && (
                <>
                  <span style={{
                    margin: '0',
                    fontSize: '1.6em',
                    fontWeight: '700',
                    color: '#2c3e50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: '1'
                  }}>
                     {isEditing ? '✏️' : ''} {newTravel.name && newTravel.name.trim() ? newTravel.name : (isEditing ? 'Editar Viagem' : 'Adicionar Viagem')}
                   </span>
                   {hasSavedDraft && !isEditing && (
                     <span
                       title="Rascunho guardado automaticamente — feche a página sem perder o que escreveu"
                       style={{
                         display: 'inline-flex',
                         alignItems: 'center',
                         gap: '6px',
                         padding: '4px 10px',
                         borderRadius: '999px',
                         background: 'rgba(43, 182, 163, 0.12)',
                         color: '#1a8b7c',
                         fontSize: '12px',
                         fontWeight: 600,
                       }}
                     >
                       💾 Rascunho guardado
                     </span>
                   )}
           
                  <div 
                    className="modal-header-buttons" 
                    style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center',
                      margin: '0',
                      justifyContent: 'flex-end',
                      flex: '0 0 auto'
                    }}
                  >
                    <button 
                      type="button" 
                      onClick={() => setIsSettingsModalOpen(true)} 
                      className="button-secondary"
                      style={{
                        background: 'linear-gradient(135deg, #6c757d, #5a6268)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 3px 12px rgba(108, 117, 125, 0.3)',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto'
                      }}
                    >
                      ⚙️ Configurações
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setSaveAction('draft');
                        handleAddTravel();
                      }}
                      className="button-draft"
                      style={{
                        background: 'linear-gradient(135deg, #ffc107, #ffb300)',
                        color: '#000',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 3px 12px rgba(255, 193, 7, 0.3)',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto'
                      }}
                      title="Guardar como rascunho para continuar depois"
                    >
                      📝 Rascunho
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSaveAction('publish');
                        handleAddTravel();
                      }}
                      className="button-success"
                      style={{
                        background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 3px 12px rgba(76, 175, 80, 0.3)',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto'
                      }}
                      title="Publicar viagem (requer todos os campos obrigatórios)"
                    >
                      {isEditing ? "💾 Guardar & Publicar" : "✅ Publicar"}
                    </button>
                    <button 
                      type="button" 
                      onClick={closeModal} 
                      className="button-danger"
                      style={{
                        background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 3px 12px rgba(244, 67, 54, 0.3)',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto'
                      }}
                    >
                      ✕ Fechar
                    </button>
                  </div>
                </>
              )}

              {/* Configurações Mobile que aparecem quando o toggle está aberto */}
              {isHeaderOpen && window.innerWidth <= 768 && (
                <div
                  style={{
                    position: 'fixed',
                    height: '346px',
                    top: '70px',
                    left: '15px',
                    right: '15px',
                    bottom: '20px', // Limita a altura para não cortar conteúdo
                    borderRadius: '15px',
                    padding: '20px',
                    zIndex: 1001,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    animation: 'slideDown 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  }}
                >
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    color: '#333', 
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                    borderBottom: '2px solid #f0f0f0',
                    paddingBottom: '10px'
                  }}>
                    ⚙️ Configurações da Viagem
                  </h3>

                  {/* Privacidade da Viagem */}
                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#555', 
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🔒 Privacidade da Viagem
                    </h4>
                    
                    <select
                      name="privacy"
                      value={newTravel.privacy}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        background: 'white',
                        fontSize: '14px',
                        color: '#333',
                        marginLeft: '15px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="public">🌍 Pública (Todos podem ver)</option>
                      <option value="followers">👥 Somente Seguidores</option>
                      <option value="private">🔒 Privada (Só eu)</option>
                    </select>
                  </div>

                  {/* Tipo de Viagem */}
                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#555', 
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🗺️ Tipo de Viagem
                    </h4>
                    
                    <select
                      value={selectedTravelType.main}
                      onChange={(e) => {
                        setSelectedTravelType(prev => ({
                          ...prev,
                          main: e.target.value
                        }));
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        background: 'white',
                        fontSize: '14px',
                        color: '#333',
                        marginLeft: '15px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="single">🎯 Destino Único</option>
                      <option value="multi">🗺️ Multidestino</option>
                    </select>
                  </div>

                  {/* Viagem em Grupo */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#555', 
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      👥 Viagem em Grupo
                    </h4>
                    
                    <div style={{ 
                      marginLeft: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedTravelType.isGroup}
                          onChange={(e) => {
                            setSelectedTravelType(prev => ({
                              ...prev,
                              isGroup: e.target.checked
                            }));
                          }}
                          style={{
                            transform: 'scale(1.3)',
                            accentColor: '#007bff'
                          }}
                        />
                        <span>Ativar viagem em grupo</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal de Configurações */}
            {isSettingsModalOpen && (
              <div className="modal-overlay" onClick={() => setIsSettingsModalOpen(false)}>
                <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header-actions">
                    <h2>⚙️ Configurações da Viagem</h2>
                    <div className="modal-header-buttons">
                      <button 
                        type="button" 
                        onClick={() => setIsSettingsModalOpen(false)} 
                        className="button-danger"
                      >
                        ✕ Fechar
                      </button>
                    </div>
                  </div>
                  
                  <div className="settings-content">
                    {/* Privacidade da Viagem */}
                    <div className="setting-item">
                      <label className="setting-label">
                        🔒 Privacidade da Viagem
                      </label>
                      <select
                        name="privacy"
                        value={newTravel.privacy}
                        onChange={handleChange}
                        className="setting-select"
                      >
                        <option value="public">🌍 Pública (Todos podem ver)</option>
                        <option value="followers">👥 Somente Seguidores</option>
                        <option value="private">🔒 Privada (Só eu)</option>
                      </select>
                    </div>

                    {/* Tipo de Viagem */}
                    <div className="setting-item">
                      <label className="setting-label">
                        🗺️ Tipo de Viagem
                      </label>
                      <select
                        value={selectedTravelType.main}
                        onChange={(e) => {
                          setSelectedTravelType(prev => ({
                            ...prev,
                            main: e.target.value
                          }));
                        }}
                        className="setting-select"
                      >
                        <option value="single">🎯 Destino Único</option>
                        <option value="multi">🗺️ Multidestino</option>
                      </select>
                    </div>

                    {/* Viagem em Grupo */}
                    <div className="setting-item">
                      <label className="setting-label">
                        👥 Viagem em Grupo
                      </label>
                      <div className="setting-toggle">
                        <input
                          type="checkbox"
                          id="groupTravelCheckbox"
                          checked={selectedTravelType.isGroup}
                          onChange={(e) => {
                            setSelectedTravelType(prev => ({
                              ...prev,
                              isGroup: e.target.checked
                            }));
                          }}
                          className="toggle-checkbox"
                        />
                        <label htmlFor="groupTravelCheckbox" className="toggle-label">
                          
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="tab-nav">
              {/*
                The badge shown next to a tab label is driven by
                `errorCountsBySection` (section → count). Tabs without
                a section mapping (prices, transport, group) never show
                a badge. The `tabErrorSection` map below translates the
                tab key into a validation section name.
              */}
              {(() => null)()}
              <TabButtonWithBadge
                tab="generalInfo"
                label="1 - Informações Gerais"
                active={activeTab === 'generalInfo'}
                onClick={handleTabChange}
                errorCount={(errorCountsBySection.general || 0) + (errorCountsBySection.media || 0)}
              />
              <TabButtonWithBadge
                tab="prices"
                label="2 - Preços da Viagem"
                active={activeTab === 'prices'}
                onClick={handleTabChange}
                errorCount={0}
              />
              <TabButtonWithBadge
                tab="accommodation"
                label="3 - Estadia"
                active={activeTab === 'accommodation'}
                onClick={handleTabChange}
                errorCount={errorCountsBySection.accommodations || 0}
              />
              <TabButtonWithBadge
                tab="food"
                label="4 - Alimentação"
                active={activeTab === 'food'}
                onClick={handleTabChange}
                errorCount={errorCountsBySection.foods || 0}
              />
              <TabButtonWithBadge
                tab="transport"
                label="5 - Transportes"
                active={activeTab === 'transport'}
                onClick={handleTabChange}
                errorCount={0}
              />
              <TabButtonWithBadge
                tab="pointsOfInterest"
                label="6 - Pontos de Referência"
                active={activeTab === 'pointsOfInterest'}
                onClick={handleTabChange}
                errorCount={errorCountsBySection.referencePoints || 0}
              />
              <TabButtonWithBadge
                tab="itinerary"
                label="7 - Itinerário da Viagem"
                active={activeTab === 'itinerary'}
                onClick={handleTabChange}
                errorCount={errorCountsBySection.itinerary || 0}
              />
              <TabButtonWithBadge
                tab="negativePoints"
                label="8 - Pontos Negativos"
                active={activeTab === 'negativePoints'}
                onClick={handleTabChange}
                errorCount={errorCountsBySection.negativePoints || 0}
              />
              {selectedTravelType.isGroup && (
                <button onClick={() => handleTabChange('group')} className={activeTab === 'group' ? 'active' : ''}>
                  {selectedTravelType.main === 'multi' ? '9' : '9'} - Viagem em Grupo
                </button>
              )}
            </div>
            <div className="modal-form-content">
            <form onSubmit={(e) => e.preventDefault()}>
              {activeTab === 'generalInfo' && (

                <>
                  {/* Top-of-tab error summary — shows all errors for the
                      current section. Renders nothing when there are
                      none, so it's safe to leave here unconditionally. */}
                  <SectionErrorPanel
                    section="general"
                    errors={errorsForSection('general')}
                  />
<br></br>
<div className="LeftPosition">
                    <label style={{textAlign: 'center', width: '100%'}}>📝 Nome da Viagem: <span style={{color: 'red'}}>*</span></label>
                    <FieldError error={fieldError('general', 'title')}>
                      <input
                        type="text"
                        name="name"
                        value={newTravel.name}
                        onChange={handleChange}
                        required
                        placeholder="Ex.: Viagem à cidade de Coimbra"
                        title="Digite um nome descritivo para a sua viagem"
                      />
                    </FieldError>
                    <div style={{
                      fontSize: '12px',
                      color: newTravel.name.length > 100 ? '#d32f2f' : '#4caf50',
                      marginTop: '5px',
                      fontWeight: 'bold'
                    }}>
                      {newTravel.name.length}/100 caracteres
                    </div>

                    <br /><br />

                    {selectedTravelType.main !== 'multi' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label style={{textAlign: 'center', width: '100%'}}>🌍 País: <span style={{color: 'red'}}>*</span></label>
                          <SearchableDropdown
                            options={countryOptions}
                            value={newTravel.country}
                            onChange={handleCountryChange}
                            placeholder={loadingCountries ? 'Carregando países...' : 'Selecione ou pesquise o país *'}
                            disabled={loadingCountries}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{textAlign: 'center', width: '100%'}}>🏙️ Cidade: <span style={{color: 'red'}}>*</span></label>
                          <SearchableDropdown
                            options={cityOptions}
                            value={newTravel.city}
                            onChange={handleCityChange}
                            placeholder={!newTravel.country ? 'Selecione primeiro um país' : (loadingCities ? 'Carregando cidades...' : 'Selecione ou pesquise a cidade *')}
                            disabled={!newTravel.country || loadingCities}
                          />
                        </div>
                      </div>
                    )}
                    {selectedTravelType.main === 'multi' && (
                      <div className="multi-destination-section">
                        
                        <label style={{textAlign: 'center', width: '100%'}}>🌐 Destinos: <span style={{color: 'red'}}>*</span></label>
                        <div className="destination-controls">
                          <SearchableDropdown
                            options={multiCountryOptions}
                            value={newDestination.country}
                            onChange={handleMultiCountryChange}
                            placeholder={loadingMultiCountries ? 'Carregando países...' : 'Selecione o país'}
                            disabled={loadingMultiCountries}
                          />
                          <SearchableDropdown
                            options={multiCityOptions}
                            value={newDestination.city}
                            onChange={handleMultiCityChange}
                            placeholder={!newDestination.country ? 'Selecione primeiro um país' : (loadingMultiCities ? 'Carregando cidades...' : 'Selecione a cidade')}
                            disabled={!newDestination.country || loadingMultiCities}
                          />
                          <button onClick={addDestination} type="button" className="button-success" title="Adicionar destino à lista">
                            ➕ Adicionar
                          </button>
                        </div>
                        {multiDestinations.length>0 ? (
                          <ul className="destinations-list">
                            {multiDestinations.map(d=> (
                              <li key={d.id} className="destination-item">
                                <span>📍 {d.city}, {d.country}</span>
                                <button 
                                  type="button" 
                                  onClick={()=>removeDestination(d.id)} 
                                  className="remove-button"
                                  title="Remover este destino"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        ): <p className="no-destinations">Nenhum destino adicionado.</p>}
                      </div>
                    )}

                    

                    <div className="form-row">
                      <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%'}}>📅 Data de Início: <span style={{color: 'red'}}>*</span></label>
                        <input
                          type="date"
                          name="startDate"
                          value={newTravel.startDate}
                          onChange={handleChange}
                            required
                            style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%'}}>📅 Data de Fim: <span style={{color: 'red'}}>*</span></label>
                        <input
                          type="date"
                          name="endDate"
                          value={newTravel.endDate}
                          onChange={handleChange}
                            required
                            style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                          title="Selecione a data de fim da viagem"
                        />
                      </div>


                      
                    </div>





                    <div className="form-row">
                      <div className="form-group">
                       
                     <label style={{textAlign: 'center', width: '100%'}}>📅 Pagamento da Viagem:</label>
                        <input
                          type="date"
                          name="BookingTripPaymentDate"
                          value={newTravel.BookingTripPaymentDate}
                          onChange={handleChange}
                          required
                          style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%', display: 'block', marginBottom: '10px'}}>⭐ Avaliação Geral da Viagem (1 a 5): <span style={{color: 'red'}}>*</span></label>
                        <div style={{display: 'flex', justifyContent: 'center'}}>
                          <StarRating
                            rating={parseInt(newTravel.stars) || 0}
                            onRatingChange={(rating) => 
                              setNewTravel(prev => ({ ...prev, stars: rating.toString() }))
                            }
                          />
                        </div>
                      </div>
                    </div>

<br></br>


                     <div className="form-row">
                      <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%'}}>🗂️ Categorias Selecionadas: <span style={{color: 'red'}}>*</span></label>
                     <p>{newTravel.category.length > 0 ? newTravel.category.map(cat => `${getCategoryIcon(cat)} ${cat}`).join(', ') : 'Nenhuma categoria selecionada'}</p> 
                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} title="Abrir seletor de categorias" disabled={loadingApiData.categories}>
                      {loadingApiData.categories ? '⏳ A carregar...' : '📋 Selecionar Categorias'}
                    </button>

                    {isCategoryModalOpen && (
                      <div className="modal-overlay">
                        <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                          <h3>🗂️ Selecionar Categorias</h3>
                          {loadingApiData.categories ? (
                            <p style={{ textAlign: 'center', color: '#666' }}>⏳ A carregar categorias...</p>
                          ) : (
                            <div className="category-list">
                              {categories.map((cat) => (
                                <div 
                                  key={cat} 
                                  className={`category-item ${newTravel.category.includes(cat) ? 'selected' : ''}`}
                                  onClick={() => {
                                    const event = {
                                      target: {
                                        name: 'category',
                                        value: cat,
                                        type: 'checkbox',
                                        checked: !newTravel.category.includes(cat)
                                      }
                                    };
                                    handleChange(event);
                                  }}
                                  style={{
                                    padding: '12px 16px',
                                    border: `2px solid ${newTravel.category.includes(cat) ? '#007bff' : '#e9ecef'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: newTravel.category.includes(cat) ? '#f0f8ff' : 'white',
                                    marginBottom: '8px'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    name="category"
                                    value={cat}
                                    checked={newTravel.category.includes(cat)}
                                    onChange={() => {}} // Controle pelo onClick do div
                                    style={{ marginRight: '8px', pointerEvents: 'none' }}
                                  />
                                  <label style={{ cursor: 'pointer', pointerEvents: 'none' }}>
                                    {getCategoryIcon(cat)} {cat}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="modal-actions">
                            <button type="button-danger" onClick={() => setIsCategoryModalOpen(false)}>
                              Fechar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                     
                      </div>
                      <div className="form-group">
                          <div className="form-group">
                      







                    <label style={{textAlign: 'center', width: '100%'}}>🗣️ Línguas Utilizadas: <span style={{color: 'red'}}>*</span></label>
                        <p>{newTravel.languages && newTravel.languages.length > 0 ? newTravel.languages.map(lang => `${lang} ${getLanguageCode(lang)}`).join(', ') : 'Nenhuma língua selecionada'}</p>
                        <button type="button" onClick={() => setIsLanguageModalOpen(true)} title="Abrir seletor de idiomas" disabled={loadingApiData.languages}>
                          {loadingApiData.languages ? '⏳ A carregar...' : '🗣️ Selecionar Idiomas'}
                        </button>

                        {isLanguageModalOpen && (
                          <div className="modal-overlay">
                            <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                              <h3>🗣️ Selecionar Idiomas</h3>
                              {loadingApiData.languages ? (
                                <p style={{ textAlign: 'center', color: '#666' }}>⏳ A carregar idiomas...</p>
                              ) : (
                                <div className="category-list">
                                  {languages.map((lang) => (
                                    <div 
                                      key={lang} 
                                      className={`category-item ${(newTravel.languages || []).includes(lang) ? 'selected' : ''}`}
                                      onClick={() => {
                                        const event = {
                                          target: {
                                            name: 'languages',
                                            value: lang,
                                            type: 'checkbox',
                                            checked: !(newTravel.languages || []).includes(lang)
                                          }
                                        };
                                        handleChange(event);
                                      }}
                                      style={{
                                        padding: '12px 16px',
                                        border: `2px solid ${(newTravel.languages || []).includes(lang) ? '#007bff' : '#e9ecef'}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: (newTravel.languages || []).includes(lang) ? '#f0f8ff' : 'white',
                                        marginBottom: '8px'
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        name="languages"
                                        value={lang}
                                        checked={(newTravel.languages || []).includes(lang)}
                                        onChange={() => {}} // Controle pelo onClick do div
                                        style={{ marginRight: '8px', pointerEvents: 'none' }}
                                      />
                                      <label style={{ cursor: 'pointer', pointerEvents: 'none' }}>
                                        {lang} {getLanguageCode(lang)}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="modal-actions">
                                <button type="button-danger" onClick={() => setIsLanguageModalOpen(false)}>
                                  Fechar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                      </div>


                      
                    </div>





                   

              

                    {/* Seção de Descrições da Viagem */}
                    <div className="description-section">
                      <h4>Descrições da Viagem</h4>
                      
                      <div className="description-fields">
                        <div className="description-field short">
                          <label style={{textAlign: 'center', width: '100%'}}>
                            📝 Descrição Curta: <span style={{color: 'red'}}>*</span>
                          </label>
                          <FieldError error={fieldError('general', 'tripSummary')}>
                            <input
                              type="text"
                              name="description"
                              value={newTravel.description}
                              onChange={handleChange}
                              placeholder="Ex.: Uma aventura incrível pelas ruas históricas de Lisboa, descobrindo sabores e tradições únicas..."
                              maxLength="350"
                              title="Descrição breve que aparecerá como prévia da viagem (máximo 350 caracteres)"
                            />
                          </FieldError>
                          <div className={`char-counter ${newTravel.description.length > 280 ? 'warning' : ''} ${newTravel.description.length > 330 ? 'danger' : ''}`}>
                            {newTravel.description.length}/350 caracteres
                          </div>
                        </div>

                        <div className="description-field long">
                          <label style={{textAlign: 'center', width: '100%'}}>
                            📖 Descrição Longa: <span style={{color: 'red'}}>*</span>
                          </label>
                          <FieldError error={fieldError('general', 'tripDescription')}>
                            <textarea
                              name="longDescription"
                              value={newTravel.longDescription}
                              onChange={handleChange}
                              placeholder="Conte a história completa da sua viagem! Descreva os lugares que visitou, as experiências que viveu, as pessoas que conheceu, os sabores que experimentou, os momentos mais marcantes... Seja detalhado e inspire outros viajantes com a sua experiência única!"
                              rows="8"
                              maxLength="6000"
                              title="Descrição completa e detalhada da sua experiência de viagem (máximo 6000 caracteres)"
                              style={{ resize: 'vertical', minHeight: '150px', overflow: 'hidden' }}
                            />
                          </FieldError>
                          <div className={`char-counter ${newTravel.longDescription.length > 4500 ? 'warning' : ''} ${newTravel.longDescription.length > 5400 ? 'danger' : ''}`}>
                            {newTravel.longDescription.length}/6000 caracteres
                          </div>
                        </div>
                      </div>

                    
                    </div>

                    <div className="description-section">
                      <label style={{textAlign: 'center', width: '100%'}}>🌡️ Temperatura/Clima:</label>
                      <FieldError error={fieldError('general', 'weather')}>
                        <input
                          type="text"
                          name="climate"
                          value={newTravel.climate}
                          onChange={handleChange}
                          placeholder="Ex.: Média do Clima foi de 30º, apanhamos uma excelente temperatura!"
                          maxLength="350"
                          title="Informações sobre o clima e temperatura durante a viagem (máximo 350 caracteres)"
                          style={{width: '100%'}}
                        />
                      </FieldError>
                      <div className={`char-counter ${newTravel.climate.length > 280 ? 'warning' : ''} ${newTravel.climate.length > 330 ? 'danger' : ''}`}>
                        {newTravel.climate.length}/350 caracteres
                      </div>
                    </div>
                  </div>

                  <div className="RightPosition">
                    <label style={{textAlign: 'center', width: '100%'}}>🖼️ Imagem de Destaque: <span style={{color: 'red'}}>*</span></label>
                    <div className="image-upload-container">
                      <input
                        type="file"
                        name="highlightImage"
                        onChange={handleChange}
                        accept="image/*"
                        id="highlightImageInput"
                        className="image-input"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="highlightImageInput" className="upload-button" style={{textAlign: 'center', width: '100% !important'}}>
                        <span role="img" aria-label="câmera">📸</span> Adicionar Foto Principal
                      </label>
                      {imagePreview ? (
                        <div className="image-preview-container">
                          <img
                            src={imagePreview}
                            alt="Preview da imagem"
                            className="image-preview"
                            onError={() => setImagePreview(null)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setNewTravel((prev) => ({ ...prev, highlightImage: '' }));
                            }}
                            className="remove-preview-button"
                            title="Remover foto principal"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <p className="upload-placeholder">Nenhuma imagem selecionada. Adicione uma foto para destacar a sua viagem!</p>
                      )}
                    </div>

                    <div style={{marginTop: '20px'}}>
                      <label style={{textAlign: 'center', width: '100%'}}>🎥 Vídeos da Viagem:</label>
                       <label htmlFor="travelVideosInput" className="upload-button" title="Selecione vídeos que representem a sua viagem" style={{textAlign: 'center', width: '100% !important'}}>
                          <span role="img" aria-label="video">🎬</span> Adicionar Vídeos
                        </label>
                      <div style={{
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '10px',
                        fontSize: '14px',
                        color: '#495057'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ marginRight: '8px', fontSize: '16px' }}>ℹ️</span>
                          <strong>Requisitos dos Vídeos:</strong>
                        </div>
                        <div style={{ paddingLeft: '24px' }}>
                          <div>• <strong>Duração total máxima:</strong> 3 minutos (soma de todos os vídeos)</div>
                          <div>• <strong>Tamanho total máximo:</strong> 100 MB (soma de todos os vídeos)</div>
                          <div>• <strong>Quantidade:</strong> Ilimitada (respeitando os limites acima)</div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                            Os vídeos serão reproduzidos em sequência no feed!
                          </div>
                        </div>
                        {newTravel.travelVideos.length > 0 && (
                          <div style={{
                            marginTop: '10px',
                            padding: '8px',
                            background: '#e8f5e8',
                            border: '1px solid #d4edda',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#155724'
                          }}>
                            {(() => {
                              const totals = calculateVideoTotals(newTravel.travelVideos, videosInfo);
                              return (
                                <div>
                                  <strong>📊 Totais atuais:</strong>
                                  <div>⏱️ Duração: {totals.formattedDuration} / 3:00</div>
                                  <div>💾 Tamanho: {totals.formattedSize} / 100 MB</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="video-upload-container">
                        <input
                          type="file"
                          name="travelVideos"
                          onChange={handleChange}
                          accept="video/*"
                          multiple
                          id="travelVideosInput"
                          className="video-input"
                          style={{ display: 'none' }}
                        />
                       
                        {videosPreviews.length > 0 ? (
                          <div style={{ marginTop: '15px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                              {videosPreviews.map((preview, index) => (
                                <div key={index} className="video-preview-container" style={{ position: 'relative' }}>
                                  <video
                                    src={preview}
                                    className="video-preview"
                                    controls
                                    style={{
                                      width: '100%',
                                      height: 'auto',
                                      maxHeight: '200px',
                                      borderRadius: '8px'
                                    }}
                                    onError={() => {
                                      console.error(`Erro ao carregar vídeo ${index}`);
                                    }}
                                  />
                                  {videosInfo[index] && (
                                    <div style={{
                                      background: '#e8f5e8',
                                      border: '1px solid #d4edda',
                                      borderRadius: '6px',
                                      padding: '6px 8px',
                                      marginTop: '5px',
                                      fontSize: '12px',
                                      color: '#155724'
                                    }}>
                                      <div style={{ fontWeight: 'bold' }}>📄 {videosInfo[index].name}</div>
                                      <div>⏱️ {videosInfo[index].duration} | 💾 {videosInfo[index].size}</div>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeVideo(index)}
                                    className="remove-preview-button"
                                    title="Remover este vídeo"
                                    style={{
                                      position: 'absolute',
                                      top: '5px',
                                      right: '5px',
                                      background: 'rgba(255, 255, 255, 0.9)',
                                      color: '#e74c3c',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      fontSize: '14px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      zIndex: 10,
                                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhum vídeo selecionado. Adicione vídeos para destacar a sua viagem!</p>
                        )}
                      </div>
                    </div>
<br></br><br></br>
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>📷 Fotografias das Informações Gerais:</label>
                      <div className="general-info-image-upload-container">
                        <input
                          type="file"
                          name="images_generalInformation"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="generalInfoImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="generalInfoImagesInput" className="upload-button" title="Adicione fotos que representem as informações gerais da viagem" style={{textAlign: 'center',}}>
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos das Informações Gerais
                        </label>
                        {generalInfoImagePreviews.length > 0 ? (
                          <div className="general-info-image-previews">
                            {generalInfoImagePreviews.map((preview, index) => (
                              <div key={index} className="general-info-image-preview-container">
                                <img src={preview} alt={`Preview da foto das informações gerais ${index + 1}`} className="general-info-image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = generalInfoImagePreviews.filter((_, i) => i !== index);
                                    setGeneralInfoImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_generalInformation: prev.images_generalInformation.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                  title="Remover esta foto das informações gerais"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar as informações gerais!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  

          
                </>
              )}

              {activeTab === 'prices' && (
                <div className="prices-section">
                  <h3>💰 Preços da Viagem</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🏨 Estadia (€):</label>
                      <input
                        type="number"
                        name="priceDetails.hotel"
                        value={newTravel.priceDetails.hotel}
                        onChange={handleChange}
                        placeholder="Ex.: 150"
                        min="0"
                        step="0.01"
                        max="999999.99"
                        title="Valor gasto em estadia (máximo 999999.99€)"
                      />
                      <small style={{fontSize: '12px', color: '#6c757d'}}>Máximo: 999999.99€</small>
                    </div>
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🍽️ Alimentação (€):</label>
                      <input
                        type="number"
                        name="priceDetails.food"
                        value={newTravel.priceDetails.food}
                        onChange={handleChange}
                        placeholder="Ex.: 80"
                        min="0"
                        step="0.01"
                        max="999999.99"
                        title="Valor gasto em alimentação (máximo 999999.99€)"
                      />
                      <small style={{fontSize: '12px', color: '#6c757d'}}>Máximo: 999999.99€</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🚌 Transportes (€):</label>
                      <input
                        type="number"
                        name="priceDetails.transport"
                        value={newTravel.priceDetails.transport}
                        onChange={handleChange}
                        placeholder="Ex.: 200"
                        min="0"
                        step="0.01"
                        max="999999.99"
                        title="Valor gasto em transportes (máximo 999999.99€)"
                      />
                      <small style={{fontSize: '12px', color: '#6c757d'}}>Máximo: 999999.99€</small>
                    </div>
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🎁 Extras (€):</label>
                      <input
                        type="number"
                        name="priceDetails.extras"
                        value={newTravel.priceDetails.extras}
                        onChange={handleChange}
                        placeholder="Ex.: 50"
                        min="0"
                        step="0.01"
                        max="999999.99"
                        title="Valor gasto em extras (máximo 999999.99€)"
                      />
                      <small style={{fontSize: '12px', color: '#6c757d'}}>Máximo: 999999.99€</small>
                    </div>
                  </div>
                  
                  <div className="price-total-section">
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>💰 Preço Total da Viagem (€):</label>
                      <input
                        type="number"
                        name="price"
                        value={calculateTotalPrice()}
                        readOnly
                        className="calculated-total"
                        style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '18px' }}
                      />
                      <small style={{fontSize: '12px', color: '#6c757d', textAlign: 'center', display: 'block'}}>
                        Calculado automaticamente (€{calculateTotalPrice().toFixed(2)})
                      </small>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    backgroundColor: '#f0f7ff',
                    border: '1px solid #d4e4ff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0056b3'
                  }}>
                    <strong>💡 Dica:</strong> Preencha todos os valores para ter um cálculo automático preciso do total da viagem.
                  </div>
                </div>
              )}

              {activeTab === 'accommodation' && (
                <div className="tab-content">
                  <SectionErrorPanel
                    section="accommodations"
                    errors={errorsForSection('accommodations')}
                  />
                  {/* Seletor de destino para viagens multidestino */}
                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "25px", 
                      padding: "15px", 
                      backgroundColor: "#f8f9fa", 
                      borderRadius: "8px" 
                    }}>
                      <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                        🎯 Selecione o destino para adicionar alojamento:
                      </label>
                      <select
                        value={selectedDestinationIndex}
                        onChange={(e) => setSelectedDestinationIndex(parseInt(e.target.value))}
                        style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
                      >
                        <option value="">Selecione um destino</option>
                        {multiDestinations.map((dest, index) => (
                          <option key={dest.id || index} value={index}>
                            Destino {index + 1}: {dest.city}, {dest.country}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mostrar para qual destino está adicionando */}
                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#e8f4fd", 
                      borderRadius: "5px",
                      textAlign: "center"
                    }}>
                      <strong>📍 A adicionar alojamento para: </strong>
                      {selectedDestinationIndex === "" 
                        ? "Selecione um destino" 
                        : (multiDestinations[selectedDestinationIndex]?.city && multiDestinations[selectedDestinationIndex]?.country
                          ? `${multiDestinations[selectedDestinationIndex].city}, ${multiDestinations[selectedDestinationIndex].country}`
                          : "Destino não definido - Adicione país e cidade primeiro")
                      }
                    </div>
                  )}

                  {/* Avisos informativos */}
                  {selectedTravelType.main === 'single' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#fff3cd", 
                      border: "1px solid #ffeaa7", 
                      borderRadius: "5px", 
                      fontSize: "14px" 
                    }}>
                      ⚠️ <strong>Atenção:</strong> Ao alterar o país ou cidade na aba "Informações Gerais", todos os dados de estadias e pontos de referência serão limpos automaticamente.
                    </div>
                  )}

                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#d1ecf1", 
                      border: "1px solid #bee5eb", 
                      borderRadius: "5px", 
                      fontSize: "14px" 
                    }}>
                      💡 <strong>Informação:</strong> Cada destino tem as suas próprias estadias. Ao mudar de destino, só verá as estadias desse local específico.
                    </div>
                  )}

                  <div className="LeftPosition">
                    <div className="accommodation-header">
                      <h3>Alojamentos da Viagem</h3>
                      <button 
                        type="button" 
                        onClick={addAccommodation}
                        className="button-success"
                      >
                        + Adicionar Estadia
                      </button>
                    </div>
                    
                    {Array.isArray(getCurrentAccommodations()) && getCurrentAccommodations().length > 0 ? (
                      getCurrentAccommodations().map((accommodation, index) => (
                        <div key={index} className="accommodation-section">
                          <div className="accommodation-header-item">
                            <h4>{accommodation.name || `Estadia ${index + 1}`}</h4>
                            {getCurrentAccommodations().length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAccommodation(index)}
                                className="remove-button"
                              >
                                Remover
                              </button>
                            )}
                          </div>

                          {/* Country and City Selection for Accommodation */}
                          <div className="form-row">
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🌍 País da Estadia:</label>
                              <SearchableDropdown
                                options={countryOptions}
                                value={accommodation.country}
                                onChange={(value) => {
                                  if (selectedTravelType.main === 'single') {
                                    setNewTravel(prev => {
                                      const updatedAccommodations = [...prev.accommodations];
                                      updatedAccommodations[index] = {
                                        ...updatedAccommodations[index],
                                        country: value,
                                        city: '' // Reset city when country changes
                                      };
                                      return { ...prev, accommodations: updatedAccommodations };
                                    });
                                    // Load cities for this accommodation
                                    loadAccommodationCities(index, value);
                                  }
                                }}
                                placeholder="Selecione o país"
                                disabled={loadingCountries}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🏙️ Cidade da Estadia:</label>
                              <SearchableDropdown
                                options={accommodationCountryCityOptions[index] || []}
                                value={accommodation.city}
                                onChange={(value) => {
                                  if (selectedTravelType.main === 'single') {
                                    setNewTravel(prev => {
                                      const updatedAccommodations = [...prev.accommodations];
                                      updatedAccommodations[index] = {
                                        ...updatedAccommodations[index],
                                        city: value
                                      };
                                      return { ...prev, accommodations: updatedAccommodations };
                                    });
                                  }
                                }}
                                placeholder={!accommodation.country ? 'Selecione primeiro um país' : (loadingAccommodationCities[index] ? 'A carregar cidades...' : 'Selecione a cidade')}
                                disabled={!accommodation.country || (loadingAccommodationCities[index] || false)}
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🏨 Nome do Alojamento:</label>
                              <input
                                type="text"
                                name={`accommodations${index}.name`}
                                value={accommodation.name}
                                onChange={handleChange}
                                placeholder="Ex.: Hotel Pestana"
                                maxLength="150"
                                title="Nome do alojamento (máximo 150 caracteres)"
                              />
                              <small style={{fontSize: '12px', color: accommodation.name.length > 120 ? '#ff9800' : '#6c757d'}}>
                                {accommodation.name.length}/150 caracteres
                              </small>
                            </div>
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🌙 Número de Noites:</label>
                              <input
                                type="number"
                                name={`accommodations${index}.nights`}
                                value={accommodation.nights}
                                onChange={handleChange}
                                placeholder="Ex.: 3"
                                min="1"
                                max="365"
                                title="Número de noites (máximo 365)"
                              />
                              <small style={{fontSize: '12px', color: '#6c757d'}}>De 1 a 365 noites</small>
                            </div>
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>💰 Preço por Noite (€):</label>
                              <input
                                type="number"
                                name={`accommodations${index}.price`}
                                value={accommodation.price}
                                onChange={handleChange}
                                placeholder="Ex.: 120.50"
                                min="0"
                                step="0.01"
                                title="Preço por noite em euros"
                              />
                              <small style={{fontSize: '12px', color: '#6c757d'}}>Valor em euros</small>
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>📅 Data de Check-in:</label>
                              <input
                                type="date"
                                name={`accommodations${index}.checkInDate`}
                                value={accommodation.checkInDate}
                                onChange={handleChange}
                                title="Data de check-in"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>📅 Data de Check-out:</label>
                              <input
                                type="date"
                                name={`accommodations${index}.checkOutDate`}
                                value={accommodation.checkOutDate}
                                onChange={handleChange}
                                title="Data de check-out"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🎫 Data de Reserva:</label>
                              <input
                                type="date"
                                name={`accommodations${index}.bookingDate`}
                                value={accommodation.bookingDate}
                                onChange={handleChange}
                                title="Data da reserva do alojamento"
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🏠 Tipo de Alojamento:</label>
                              <select
                                name={`accommodations${index}.type`}
                                value={accommodation.type}
                                onChange={handleChange}
                                disabled={loadingApiData.accommodationTypes}
                              >
                                <option value="">
                                  {loadingApiData.accommodationTypes ? 'A carregar...' : 'Selecione o tipo'}
                                </option>
                                {apiAccommodationTypes.length > 0 
                                  ? apiAccommodationTypes.map(accType => (
                                      <option key={accType.id} value={accType.type}>
                                        {accType.type}
                                      </option>
                                    ))
                                  : [
                                      { id: 1, type: 'Hotel' },
                                      { id: 2, type: 'Hostel' },
                                      { id: 3, type: 'Apartamento' },
                                      { id: 4, type: 'Pousada' },
                                      { id: 5, type: 'Casa de Férias' }
                                    ].map(accType => (
                                      <option key={accType.id} value={accType.type}>
                                        {accType.type}
                                      </option>
                                    ))
                                }
                              </select>
                            </div>
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🍽️ Regime:</label>
                              <select
                                name={`accommodations${index}.regime`}
                                value={accommodation.regime}
                                onChange={handleChange}
                                disabled={loadingApiData.accommodationBoards}
                              >
                                <option value="">
                                  {loadingApiData.accommodationBoards ? 'A carregar...' : 'Selecione o regime'}
                                </option>
                                {apiAccommodationBoards.length > 0 
                                  ? apiAccommodationBoards.map(board => (
                                      <option key={board.id} value={board.board}>
                                        {board.board}
                                      </option>
                                    ))
                                  : [
                                      { id: 1, board: 'Tudo Incluído' },
                                      { id: 2, board: 'Meia Pensão' },
                                      { id: 3, board: 'Pensão Completa' },
                                      { id: 4, board: 'Apenas Alojamento' }
                                    ].map(board => (
                                      <option key={board.id} value={board.board}>
                                        {board.board}
                                      </option>
                                    ))
                                }
                              </select>
                            </div>
                          </div>

                          <label style={{textAlign: 'center', width: '100%'}}>📝 A sua opinião da Estadia:</label>
                          <textarea
                            name={`accommodations${index}.description`}
                            value={accommodation.description}
                            onChange={handleChange}
                            rows="4"
                            maxLength="500"
                            placeholder="Ex.: Hotel 5 estrelas com vista para o mar, staff muito simpático, pequeno-almoço excelente..."
                            style={{ resize: 'vertical', minHeight: '100px', overflow: 'hidden' }}
                            title="A sua opinião sobre a estadia (máximo 500 caracteres)"
                          />
                          <small style={{fontSize: '12px', color: accommodation.description && accommodation.description.length > 400 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                            {accommodation.description ? accommodation.description.length : 0}/500 caracteres
                          </small>

                          <label style={{textAlign: 'center', width: '100%', display: 'block', marginBottom: '10px', marginTop: '15px'}}>⭐ Avaliação da Estadia:</label>
                          <div style={{display: 'flex', justifyContent: 'center'}}>
                            <StarRating
                              rating={accommodation.rating || 0}
                              onRatingChange={(rating) => {
                                if (selectedTravelType.main === 'single') {
                                  setNewTravel(prev => {
                                    const updatedAccommodations = [...prev.accommodations];
                                    updatedAccommodations[index] = {
                                      ...updatedAccommodations[index],
                                      rating: rating
                                    };
                                    return { ...prev, accommodations: updatedAccommodations };
                                  });
                                } else if (selectedTravelType.main === 'multi') {
                                  const destinationKey = getCurrentDestinationKey();
                                  if (destinationKey) {
                                    const currentAccommodations = accommodationsByDestination[destinationKey] || [];
                                    const updatedAccommodations = [...currentAccommodations];
                                    updatedAccommodations[index] = {
                                      ...updatedAccommodations[index],
                                      rating: rating
                                    };
                                    setAccommodationsByDestination(prev => ({
                                      ...prev,
                                      [destinationKey]: updatedAccommodations
                                    }));
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>Nenhum alojamento adicionado ainda.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'food' && (
                <div className="tab-content">
                  <SectionErrorPanel
                    section="foods"
                    errors={errorsForSection('foods')}
                  />
                  <div className="RightPosition">
                    <h3>🍽️ Recomendações Alimentares</h3>
                    {Array.isArray(newTravel.foodRecommendations) && newTravel.foodRecommendations.length > 0 ? (
                      <ul className="recommendations-list">
                        {newTravel.foodRecommendations.map((recommendation, index) => (
                          <li key={index} className="recommendation-item">
                            <div className="point-info">
                              <strong>🍽️ {recommendation.name || 'Sem nome'}</strong>
                              <p style={{ margin: '5px 0', color: '#6c757d' }}>
                                📝 {recommendation.description || 'Sem descrição'}
                              </p>
                            </div>
                            <div className="recommendation-actions">
                              <button
                                onClick={(e) => handleEditFoodRecommendation(e, index)}
                                className="edit-button"
                                title="Editar esta recomendação alimentar"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteFoodRecommendation(e, index)}
                                className="delete-button"
                                title="Remover esta recomendação alimentar"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">🍽️</div>
                        <p>Nenhuma recomendação alimentar adicionada ainda</p>
                        <small>Adicione pratos e restaurantes que recomenda a outros viajantes</small>
                      </div>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>🍽️ Nome da nova Recomendação:</label>
                      <input
                        type="text"
                        name="name"
                        value={newFoodRecommendation.name}
                        onChange={handleFoodChange}
                        placeholder="Ex.: Bacalhau à Brás, Restaurante O Fado, Pastéis de Nata..."
                        maxLength="150"
                        key={`name-input-${editingFoodIndex}`}
                        title="Nome da recomendação alimentar (máximo 150 caracteres)"
                      />
                      <small style={{fontSize: '12px', color: newFoodRecommendation.name.length > 120 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newFoodRecommendation.name.length}/150 caracteres
                      </small>
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>📝 Descrição:</label>
                      <textarea
                        name="description"
                        value={newFoodRecommendation.description}
                        onChange={handleFoodChange}
                        rows="4"
                        maxLength="500"
                        placeholder="Ex.: Prato tradicional português com bacalhau desfiado, batatas, ovos e cebola. Encontrado no Restaurante Tradicional, custou cerca de 15€. Sabor autêntico e porção generosa..."
                        key={`desc-input-${editingFoodIndex}`}
                        style={{ resize: 'vertical', minHeight: '100px', overflow: 'hidden' }}
                        title="Descrição da recomendação alimentar (máximo 500 caracteres)"
                      />
                      <small style={{fontSize: '12px', color: newFoodRecommendation.description.length > 400 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newFoodRecommendation.description.length}/500 caracteres
                      </small>

                      <br />
                      <label style={{textAlign: 'center', width: '100%'}}>📷 Foto da Recomendação (opcional, 1 foto):</label>
                      <div className="image-upload-container" style={{ marginTop: '8px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          id="foodRecommendationSinglePhotoInput"
                          className="image-input"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            // Per-item: replace any previous pick (max 1).
                            if (newFoodRecommendation.photoPreview) {
                              URL.revokeObjectURL(newFoodRecommendation.photoPreview);
                            }
                            setNewFoodRecommendation((prev) => ({
                              ...prev,
                              photoFile: file,
                              photoPreview: URL.createObjectURL(file),
                            }));
                            e.target.value = '';
                          }}
                        />
                        <label htmlFor="foodRecommendationSinglePhotoInput" className="upload-button" title="Adicione 1 foto deste prato/restaurante">
                          <span role="img" aria-label="câmera">📸</span> {newFoodRecommendation.photoFile || newFoodRecommendation.photoPreview ? 'Trocar Foto' : 'Adicionar Foto'}
                        </label>
                        {newFoodRecommendation.photoPreview && (
                          <div className="image-previews" style={{ marginTop: '10px' }}>
                            <div className="image-preview-container">
                              <img src={newFoodRecommendation.photoPreview} alt="Preview da foto" className="image-preview" />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newFoodRecommendation.photoPreview) {
                                    URL.revokeObjectURL(newFoodRecommendation.photoPreview);
                                  }
                                  setNewFoodRecommendation((prev) => ({ ...prev, photoFile: null, photoPreview: null }));
                                }}
                                className="remove-preview-button"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="action-buttons">
                        <button
                          onClick={(e) => handleAddOrEditFoodRecommendation(e)}
                          className="button-success"
                          disabled={!newFoodRecommendation.name.trim() || !newFoodRecommendation.description.trim()}
                        >
                          {editingFoodIndex !== null ? '💾 Guardar Alterações' : '➕ Adicionar'}
                        </button>
                        {editingFoodIndex !== null && (
                          <button
                            onClick={(e) => handleCancelEditFood(e)}
                            className="button-secondary"
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transport' && (
                <div className="tab-content">
                  
                  <div className="RightPosition">
                  
 <div className="image-upload-section">
                      <label>📷 Fotografias dos Métodos de Transporte:</label>
                      <div className="general-info-image-upload-container">
                        <input
                          type="file"
                          name="images_localTransport"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="transportImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="transportImagesInput" className="upload-button">
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos dos Métodos de Transporte
                        </label>
                        {transportImagePreviews.length > 0 ? (
                          <div className="general-info-image-previews">
                            {transportImagePreviews.map((preview, index) => (
                              <div key={index} className="general-info-image-preview-container">
                                <img src={preview} alt={`Preview da foto de transporte ${index + 1}`} className="general-info-image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = transportImagePreviews.filter((_, i) => i !== index);
                                    setTransportImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_localTransport: prev.images_localTransport.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar os métodos de transporte!</p>
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="LeftPosition">
                    <div className="accommodation-header">
                      <h3>🚗 Métodos de Transporte</h3>
                      <button 
                        type="button" 
                        onClick={() => {
                          setNewTransport({ name: '', description: '', cost: '' });
                          setEditingTransportIndex(null);
                          setIsTransportFormOpen(true);
                        }}
                        className="button-success"
                        disabled={loadingApiData.transports}
                      >
                        + Adicionar Transporte
                      </button>
                    </div>

                    {/* Transport Form */}
                    {isTransportFormOpen && (
                      <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #007bff' }}>
                        <h4>{editingTransportIndex !== null ? '✏️ Editar Transporte' : '➕ Novo Transporte'}</h4>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label>🚗 Tipo de Transporte:</label>
                            <select
                              value={newTransport.name}
                              onChange={(e) => setNewTransport(prev => ({ ...prev, name: e.target.value }))}
                              style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
                              disabled={loadingApiData.transports}
                            >
                              <option value="">Selecione o transporte</option>
                              {apiTransports.length > 0
                                ? apiTransports.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                  ))
                                : ['Avião', 'Autocarro', 'Comboio', 'Carro', 'Táxi', 'Metro', 'Barco'].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))
                              }
                            </select>
                          </div>
                          <div className="form-group">
                            <label>💰 Custo (€):</label>
                            <input
                              type="number"
                              value={newTransport.cost}
                              onChange={(e) => setNewTransport(prev => ({ ...prev, cost: e.target.value }))}
                              placeholder="Ex.: 45.50"
                              min="0"
                              step="0.01"
                              style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group" style={{ width: '100%' }}>
                            <label>📝 Descrição:</label>
                            <textarea
                              value={newTransport.description}
                              onChange={(e) => setNewTransport(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Ex.: Voo direto de Lisboa para Berlim, duração 2h30m"
                              maxLength="300"
                              rows="3"
                              style={{ width: '100%', padding: '10px', borderRadius: '5px', resize: 'vertical' }}
                            />
                            <small style={{fontSize: '12px', color: newTransport.description.length > 250 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                              {newTransport.description.length}/300 caracteres
                            </small>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={() => editingTransportIndex !== null ? updateTransport(editingTransportIndex) : addTransport()}
                            className="button-success"
                          >
                            {editingTransportIndex !== null ? '💾 Atualizar' : '✅ Adicionar'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditTransport}
                            className="button-danger"
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Transport List */}
                    {Array.isArray(newTravel.localTransport) && newTravel.localTransport.length > 0 ? (
                      <div>
                        {newTravel.localTransport.map((transport, index) => (
                          <div key={transport.id || index} style={{ backgroundColor: '#f0f8ff', padding: '12px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #007bff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1 }}>
                                <h5 style={{ margin: '0 0 5px 0' }}>🚗 {transport.name}</h5>
                                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                  <strong>💰 Custo:</strong> €{parseFloat(transport.cost || 0).toFixed(2)}
                                </p>
                                {transport.description && (
                                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                    <strong>📝 Descrição:</strong> {transport.description}
                                  </p>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                  type="button"
                                  onClick={() => editTransport(index)}
                                  className="edit-button"
                                  title="Editar transporte"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteTransport(index)}
                                  className="delete-button"
                                  title="Remover transporte"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Nenhum transporte adicionado ainda.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'pointsOfInterest' && (
                <div className="tab-content">
                  <SectionErrorPanel
                    section="referencePoints"
                    errors={errorsForSection('referencePoints')}
                  />
                  {/* Seletor de destino para viagens multidestino */}
                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "25px", 
                      padding: "15px", 
                      backgroundColor: "#f8f9fa", 
                      borderRadius: "8px" 
                    }}>
                      <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                        🎯 Selecione o destino para adicionar pontos de referência:
                      </label>
                      <select
                        value={selectedDestinationIndex}
                        onChange={(e) => setSelectedDestinationIndex(parseInt(e.target.value))}
                        style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
                      >
                        <option value="">Selecione um destino</option>
                        {multiDestinations.map((dest, index) => (
                          <option key={dest.id || index} value={index}>
                            Destino {index + 1}: {dest.city}, {dest.country}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mostrar para qual destino está visualizando */}
                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#e8f4fd", 
                      borderRadius: "5px",
                      textAlign: "center"
                    }}>
                      <strong>📍 Pontos de referência para: </strong>
                      {selectedDestinationIndex === "" 
                        ? "Selecione um destino" 
                        : (multiDestinations[selectedDestinationIndex]?.city && multiDestinations[selectedDestinationIndex]?.country
                          ? `${multiDestinations[selectedDestinationIndex].city}, ${multiDestinations[selectedDestinationIndex].country}`
                          : "Destino não definido - Adicione país e cidade primeiro")
                      }
                    </div>
                  )}

                  {/* Avisos informativos para pontos de referência */}
                  {selectedTravelType.main === 'single' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#fff3cd", 
                      border: "1px solid #ffeaa7", 
                      borderRadius: "5px", 
                      fontSize: "14px" 
                    }}>
                      ⚠️ <strong>Atenção:</strong> Ao alterar o país ou cidade na aba "Informações Gerais", todos os pontos de referência serão limpos automaticamente.
                    </div>
                  )}

                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#d1ecf1", 
                      border: "1px solid #bee5eb", 
                      borderRadius: "5px", 
                      fontSize: "14px" 
                    }}>
                      💡 <strong>Informação:</strong> Cada destino tem os seus próprios pontos de referência. Ao mudar de destino, só verá os pontos desse local específico.
                    </div>
                  )}

                  <div className="RightPosition">
                    <h3>📍 Pontos de Referência</h3>
                    {(() => {
                      const currentPoints = getCurrentPointsOfInterest();
                      return Array.isArray(currentPoints) && currentPoints.length > 0 ? (
                        <ul className="points-list">
                          {currentPoints.map((point, index) => (
                            <li key={index} className="point-item">
                              <div className="point-info">
                                <strong>📌 {point.name || 'Sem nome'}</strong>
                                <p style={{ margin: '5px 0', color: '#6c757d' }}>
                                  📝 {point.description || 'Sem descrição'}
                                </p>
                              </div>
                              <div className="point-actions">
                                <button
                                  onClick={(e) => handleEditPointOfInterest(e, index)}
                                  className="edit-button"
                                  title="Editar este ponto de interesse"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={(e) => handleDeletePointOfInterest(e, index)}
                                  className="delete-button"
                                  title="Remover este ponto de interesse"
                                >
                                  🗑️ Remover
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon">📍</div>
                          <p>Nenhum ponto de referência adicionado ainda</p>
                          <small>Adicione locais de interesse que visitou durante a viagem</small>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>📌 Nome do Ponto de Referência:</label>
                      <input
                        type="text"
                        name="name"
                        value={newPointOfInterest.name}
                        onChange={handlePointChange}
                        placeholder="Ex.: Torre de Belém"
                        maxLength="150"
                        key={`name-input-point-${editingPointIndex}`}
                        title="Digite o nome do ponto de interesse (máximo 150 caracteres)"
                      />
                      <small style={{fontSize: '12px', color: newPointOfInterest.name.length > 120 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newPointOfInterest.name.length}/150 caracteres
                      </small>
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>📝 Descrição:</label>
                      <textarea
                        name="description"
                        value={newPointOfInterest.description}
                        onChange={handlePointChange}
                        rows="8"
                        maxLength="1000"
                        placeholder="Ex.: Monumento histórico do século XVI, símbolo de Lisboa. Construído por Manuel I, oferece uma vista fantástica do Tejo. Aberto de segunda a domingo..."
                        title="Descreva o ponto de interesse em detalhe (máximo 1000 caracteres)"
                        key={`desc-input-point-${editingPointIndex}`}
                        style={{ resize: 'vertical', minHeight: '200px', overflow: 'hidden', wordWrap: 'break-word' }}
                      />
                      <small style={{fontSize: '12px', color: newPointOfInterest.description.length > 800 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newPointOfInterest.description.length}/1000 caracteres
                      </small>

                      <br />
                      <label style={{textAlign: 'center', width: '100%'}}>📷 Fotos deste Ponto de Referência (múltiplas, opcionais):</label>
                      <div className="image-upload-container" style={{ marginTop: '8px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          id="referencePointPhotosInput"
                          className="image-input"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            const previews = files.map((f) => URL.createObjectURL(f));
                            setNewPointOfInterest((prev) => ({
                              ...prev,
                              // Per-item: append, do not replace (multiple allowed).
                              photoFiles: [...(prev.photoFiles || []), ...files],
                              photoPreviews: [...(prev.photoPreviews || []), ...previews],
                            }));
                            e.target.value = '';
                          }}
                        />
                        <label htmlFor="referencePointPhotosInput" className="upload-button" title="Adicione fotos deste ponto de interesse">
                          <span role="img" aria-label="câmera">📸</span> {newPointOfInterest.photoFiles?.length || newPointOfInterest.photoPreviews?.length ? 'Adicionar Mais Fotos' : 'Adicionar Fotos'}
                        </label>
                        {(newPointOfInterest.photoPreviews || []).length > 0 && (
                          <div className="image-previews" style={{ marginTop: '10px' }}>
                            {newPointOfInterest.photoPreviews.map((preview, index) => (
                              <div key={index} className="image-preview-container">
                                <img src={preview} alt={`Preview da foto ${index + 1}`} className="image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Revoke only blob URLs (those we created).
                                    if (preview.startsWith('blob:')) {
                                      URL.revokeObjectURL(preview);
                                    }
                                    setNewPointOfInterest((prev) => ({
                                      ...prev,
                                      photoFiles: (prev.photoFiles || []).filter((_, i) => i !== index),
                                      photoPreviews: (prev.photoPreviews || []).filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="action-buttons">
                        <button
                          onClick={(e) => handleAddOrEditPointOfInterest(e)}
                          className="button-success"
                          disabled={!newPointOfInterest.name.trim() || !newPointOfInterest.description.trim()}
                          title={editingPointIndex !== null ? "Guardar as alterações do ponto de interesse" : "Adicionar novo ponto de interesse"}
                        >
                          {editingPointIndex !== null ? '💾 Guardar Alterações' : '➕ Adicionar'}
                        </button>
                        {editingPointIndex !== null && (
                          <button
                            onClick={(e) => handleCancelEditPoint(e)}
                            className="button-secondary"
                            title="Cancelar edição do ponto de interesse"
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'itinerary' && (
                <div className="tab-content">
                  <SectionErrorPanel
                    section="itinerary"
                    errors={errorsForSection('itinerary')}
                  />
                  <div className="RightPosition">
                    <h3>🗓️ Itinerário da Viagem</h3>
                    <p><strong>Duração Total:</strong> {calculateTripDays()} dias</p>
                    {Array.isArray(newTravel.itinerary) && newTravel.itinerary.length > 0 ? (
                      <ul className="itinerary-list">
                        {newTravel.itinerary.map((item, index) => (
                          <li key={index} className="itinerary-item">
                            <div className="itinerary-day">
                              <strong>Dia {item.day}:</strong>
                              <ul className="activities-list">
                                {item.activities.map((activity, actIndex) => (
                                  <li key={actIndex}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="itinerary-actions">
                              <button
                                onClick={(e) => handleEditItineraryDay(e, index)}
                                className="edit-button"
                                title="Editar as atividades deste dia"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteItineraryDay(e, index)}
                                className="delete-button"
                                title="Remover este dia do itinerário"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">🗓️</div>
                        <p>Nenhum dia adicionado ao itinerário ainda</p>
                        <small>Adicione atividades por dia para organizar a sua viagem</small>
                      </div>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>📅 Dia:</label>
                      <input
                        type="number"
                        name="day"
                        value={newItineraryDay.day}
                        onChange={handleItineraryChange}
                        min="1"
                        max={calculateTripDays()}
                        placeholder={`Digite um número entre 1 e ${calculateTripDays()}`}
                        key={`day-input-${editingItineraryDay}`}
                        title="Escolha o dia da viagem para adicionar atividades"
                      />
                      {itineraryError && (
                        <p className="error-message" style={{color: '#d32f2f', fontSize: '12px', marginTop: '5px'}}>{itineraryError}</p>
                      )}
<br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>🎯 Atividades deste dia:</label>
                      <small style={{ display: 'block', textAlign: 'center', color: '#6c757d', marginTop: '4px', marginBottom: '8px' }}>
                        Adicione uma atividade de cada vez. Use a ordem para definir a sequência.
                      </small>

                      {/*
                        Itinerary is now a real list (per user spec) — each
                        activity is its own input with add/remove buttons
                        instead of one giant textarea where the user had to
                        split lines manually. This gives proper validation
                        per activity, drag-to-reorder-ready, and shows the
                        total count at a glance.
                      */}
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {newItineraryDay.activities.map((activity, actIndex) => (
                          <li key={actIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ minWidth: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>
                              {actIndex + 1}
                            </span>
                            <input
                              type="text"
                              value={activity}
                              onChange={(e) => {
                                const next = [...newItineraryDay.activities];
                                next[actIndex] = e.target.value;
                                setNewItineraryDay((prev) => ({ ...prev, activities: next }));
                              }}
                              placeholder={`Atividade ${actIndex + 1} (ex.: Visita ao museu, Almoço no restaurante X, Passeio pela cidade)`}
                              maxLength={200}
                              title={`Atividade ${actIndex + 1} (máximo 200 caracteres)`}
                              style={{ flex: 1, padding: '8px 10px', borderRadius: '5px', border: '1px solid #ced4da' }}
                            />
                            {newItineraryDay.activities.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = newItineraryDay.activities.filter((_, i) => i !== actIndex);
                                  setNewItineraryDay((prev) => ({ ...prev, activities: next }));
                                }}
                                title="Remover esta atividade"
                                style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                              >
                                🗑️
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setNewItineraryDay((prev) => ({ ...prev, activities: [...prev.activities, ''] }))}
                        style={{ marginTop: '4px', padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}
                        title="Adicionar nova atividade a este dia"
                      >
                        ➕ Adicionar Atividade
                      </button>
                      <small style={{ fontSize: '12px', color: (newItineraryDay.activities.join('').length > 1200) ? '#ff9800' : '#6c757d', display: 'block', marginTop: '8px' }}>
                        {newItineraryDay.activities.filter((a) => a.trim()).length} atividade(s) · {newItineraryDay.activities.join('').length} caracteres
                      </small>

                      <div className="action-buttons" style={{marginTop: '15px'}}>
                        <button
                          onClick={(e) => handleAddOrEditItineraryDay(e)}
                          className="button-success"
                          disabled={!newItineraryDay.day || newItineraryDay.activities.every((act) => !act.trim())}
                          title={editingItineraryDay !== null ? "Guardar as alterações do dia" : "Adicionar este dia ao itinerário"}
                        >
                          {editingItineraryDay !== null ? '💾 Guardar Alterações' : '➕ Adicionar Dia'}
                        </button>
                        {editingItineraryDay !== null && (
                          <button
                            onClick={(e) => handleCancelEditItinerary(e)}
                            className="button-secondary"
                            title="Cancelar edição do itinerário"
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'negativePoints' && (
                <div className="tab-content">
                  <SectionErrorPanel
                    section="negativePoints"
                    errors={errorsForSection('negativePoints')}
                  />
                  <div className="RightPosition">
                    <h3>⚠️ Pontos Negativos</h3>
                    {Array.isArray(newTravel.negativePoints) && newTravel.negativePoints.length > 0 ? (
                      <ul className="points-list">
                        {newTravel.negativePoints.map((point, index) => (
                          <li key={index} className="point-item">
                            <div className="point-info">
                              <strong>⚠️ {point.name || 'Sem nome'}</strong>
                              <p style={{ margin: '5px 0', color: '#6c757d' }}>
                                📝 {point.description || 'Sem descrição'}
                              </p>
                            </div>
                            <div className="point-actions">
                              <button
                                onClick={(e) => handleEditNegativePoint(e, index)}
                                className="edit-button"
                                title="Editar este ponto negativo"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteNegativePoint(e, index)}
                                className="delete-button"
                                title="Remover este ponto negativo"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">⚠️</div>
                        <p>Nenhum ponto negativo adicionado ainda</p>
                        <small>Registe aspetos negativos para melhorar viagens futuras</small>
                      </div>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>⚠️ Nome do Ponto Negativo:</label>
                      <input
                        type="text"
                        name="name"
                        value={newNegativePoint.name}
                        onChange={handleNegativeChange}
                        placeholder="Ex.: Trânsito intenso, Preços elevados"
                        maxLength="150"
                        key={`name-input-negative-${editingNegativeIndex}`}
                        title="Digite o aspecto negativo da viagem (máximo 150 caracteres)"
                      />
                      <small style={{fontSize: '12px', color: newNegativePoint.name.length > 120 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newNegativePoint.name.length}/150 caracteres
                      </small>
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>📝 Descrição:</label>
                      <textarea
                        name="description"
                        value={newNegativePoint.description}
                        onChange={handleNegativeChange}
                        rows="5"
                        maxLength="500"
                        placeholder="Ex.: O trânsito da cidade estava muito congestionado durante todo o dia, causando atrasos nos transportes e cansaço dos viajantes..."
                        title="Descreva detalhadamente o aspecto negativo (máximo 500 caracteres)"
                        key={`desc-input-negative-${editingNegativeIndex}`}
                        style={{ resize: 'vertical', minHeight: '150px', overflow: 'hidden' }}
                      />
                      <small style={{fontSize: '12px', color: newNegativePoint.description.length > 400 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newNegativePoint.description.length}/500 caracteres
                      </small>

                      <div className="action-buttons">
                        <button
                          onClick={(e) => handleAddOrEditNegativePoint(e)}
                          className="button-success"
                          disabled={!newNegativePoint.name.trim() || !newNegativePoint.description.trim()}
                          title={editingNegativeIndex !== null ? "Guardar as alterações do ponto negativo" : "Adicionar novo ponto negativo"}
                        >
                          {editingNegativeIndex !== null ? '💾 Guardar Alterações' : '➕ Adicionar'}
                        </button>
                        {editingNegativeIndex !== null && (
                          <button
                            onClick={(e) => handleCancelEditNegative(e)}
                            className="button-secondary"
                            title="Cancelar edição do ponto negativo"
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'group' && selectedTravelType.isGroup && (
                <div className="tab-content">
                  <div className="RightPosition">
                    <h3>👥 Membros do Grupo</h3>
                    {Array.isArray(groupMembers) && groupMembers.length > 0 ? (
                      <ul className="points-list">
                        {groupMembers.map((member, index) => (
                          <li key={member.id} className="point-item">
                            <div className="point-info">
                              <strong>👤 {member.email || 'Sem email'}</strong>
                              <p style={{ margin: '5px 0', color: '#6c757d' }}>
                                🔗 {member.status || 'Pendente'}
                              </p>
                            </div>
                            <div className="point-actions">
                              <button
                                onClick={() => removeGroupMember(member.id)}
                                className="delete-button"
                                title="Remover membro do grupo"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <p>Nenhum membro adicionado ainda</p>
                        <small>Adicione outros viajantes por email para partilharem esta experiência</small>
                      </div>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>✉️ Email do Membro:</label>
                      <input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        maxLength="150"
                        title="Digite o email do membro (máximo 150 caracteres)"
                        style={{
                          padding: '12px 15px',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          fontSize: '14px',
                          width: '100%',
                          boxSizing: 'border-box',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#007bff'}
                        onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                      />
                      <small style={{fontSize: '12px', color: newMemberEmail.length > 120 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newMemberEmail.length}/150 caracteres
                      </small>

                      <div className="action-buttons">
                        <button
                          onClick={addGroupMemberByEmail}
                          className="button-success"
                          disabled={!newMemberEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)}
                          title="Adicionar novo membro ao grupo"
                        >
                          ➕ Adicionar Membro
                        </button>
                      </div>

                      {/* Nota de Integração Futura */}
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid #ffc107',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#856404'
                      }}>
                        � <strong>Integração futura:</strong> Os convites serão enviados por email aos membros adicionados. Eles poderão aceitar ou rejeitar o convite.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Fixed Navigation Buttons */}
            <div className="fixed-nav-buttons">
              <button
                onClick={handlePrevTab}
                disabled={tabs.indexOf(activeTab) === 0}
                className="nav-button prev-button"
                title="Voltar à aba anterior"
              >
                ← Anterior
              </button>
              
              {activeTab === 'group' || activeTab === 'negativePoints' ? (
                <>
                  {/* Botões de Rascunho e Publicar */}
                  <button
                    onClick={() => {
                      setSaveAction('draft');
                      handleAddTravel();
                    }}
                    className="nav-button draft-button"
                    title="Guardar como rascunho para continuar depois"
                    style={{
                      backgroundColor: '#ffc107',
                      color: '#fff',
                      marginRight: '10px'
                    }}
                  >
                    📝 Guardar como Rascunho
                  </button>
                  
                  <button
                    onClick={() => {
                      setSaveAction('publish');
                      handleAddTravel();
                    }}
                    className="nav-button next-button"
                    title="Publicar viagem (requer todos os campos obrigatórios)"
                  >
                    {isEditing ? "💾 Guardar & Publicar" : "✅ Publicar Viagem"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNextTab}
                  disabled={tabs.indexOf(activeTab) === tabs.length - 1 && activeTab !== 'group'}
                  className="nav-button next-button"
                  title="Avançar para próxima aba"
                >
                  Avançar →
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e estatísticas */}
      <div className="travels-header">
        <div className="travels-stats">
          <h2>As minhas viagens ({travels.filter(t => t.status !== 'draft' || showDrafts).length})</h2>
          <br></br>
          <div className="stats-cards">
            <div className="stat-card">
              <span className="stat-number">
                {travels.filter(t => (!t.travelType?.main || t.travelType?.main === 'single') && (t.status !== 'draft' || showDrafts)).length}
              </span>
              <span className="stat-label">🎯 Destino Único</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {travels.filter(t => (t.travelType?.main === 'multi' || t.multiDestinations) && (t.status !== 'draft' || showDrafts)).length}
              </span>
              <span className="stat-label">🗺️ Multidestino</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {travels.filter(t => (t.travelType?.isGroup || t.groupData) && (t.status !== 'draft' || showDrafts)).length}
              </span>
              <span className="stat-label">👥 Em Grupo</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {travels.filter(t => t.status === 'draft').length}
              </span>
              <span className="stat-label">📝 Rascunhos</span>
            </div>
          </div>
        </div>

        <div className="travels-filters">
          <button className='button' onClick={openModal} style={{marginBottom: '10px'}}>Adicionar Viagem</button>

          <label>Filtrar por:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">🌟 Todas as viagens ({travels.filter(t => t.status !== 'draft' || showDrafts).length})</option>
            <option value="single">🎯 Destino Único ({travels.filter(t => (!t.travelType?.main || t.travelType?.main === 'single') && (t.status !== 'draft' || showDrafts)).length})</option>
            <option value="multi">🗺️ Multidestino ({travels.filter(t => (t.travelType?.main === 'multi' || t.multiDestinations) && (t.status !== 'draft' || showDrafts)).length})</option>
            <option value="group">👥 Viagens em Grupo ({travels.filter(t => (t.travelType?.isGroup || t.groupData) && (t.status !== 'draft' || showDrafts)).length})</option>
            <option value="public">🌍 Públicas ({travels.filter(t => (!t.privacy || t.privacy === 'public') && (t.status !== 'draft' || showDrafts)).length})</option>
            <option value="followers">👥 Para Seguidores ({travels.filter(t => t.privacy === 'followers' && (t.status !== 'draft' || showDrafts)).length})</option>
            <option value="private">🔒 Privadas ({travels.filter(t => t.privacy === 'private' && (t.status !== 'draft' || showDrafts)).length})</option>
            <option value="draft">📝 Rascunhos ({travels.filter(t => t.status === 'draft').length})</option>
          </select>

          <label style={{marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
            <input 
              type="checkbox" 
              checked={showDrafts} 
              onChange={(e) => setShowDrafts(e.target.checked)}
              style={{cursor: 'pointer', width: '18px', height: '18px'}}
            />
            <span>Mostrar rascunhos</span>
          </label>
        </div>
      </div>


      <div className="travels-grid">
        {getFilteredTravels().length === 0 ? (
          filterType === 'all' ? (
            <div className="empty-travels-message">
              <div className="empty-icon"></div>
              <h3>Nenhuma viagem adicionada ainda</h3>
              <p>Comece por adicionar uma nova viagem e partilhe as suas experiências!</p>
            </div>
          ) : (
            <div className="empty-travels-message">
              <div className="empty-icon">🔍</div>
              <h3>Nenhuma viagem encontrada</h3>
              <p>Não existem viagens que correspondam ao filtro selecionado.</p>
              <button 
                onClick={() => setFilterType('all')} 
                className="button-success"
                style={{ marginTop: '15px' }}
              >
                Ver todas as viagens
              </button>
            </div>
          )
        ) : (
          getFilteredTravels().map((travel) => (
            <div key={travel.id} className="travel-card">
              <div className="travel-card-header">
                {/* Tags da viagem */}
                <div className="travel-tags">
                  {/* Tag Status - Rascunho */}
                  {travel.status === 'draft' && (
                    <span className="tag tag-draft" style={{backgroundColor: '#ffc107', color: '#000'}}>
                      📝 Rascunho
                    </span>
                  )}

                  {/* Tag Tipo de Viagem */}
                  <span className={`tag tag-destination ${
                    (travel.travelType?.main === 'multi' || travel.multiDestinations) 
                      ? 'multi-destination' 
                      : 'single-destination'
                  }`}>
                    {(travel.travelType?.main === 'multi' || travel.multiDestinations) 
                      ? '🗺️ Multidestino' 
                      : '🎯 Destino Único'}
                  </span>
                  
                  {/* Tag Viagem em Grupo */}
                  {(travel.travelType?.isGroup || travel.groupData) && (
                    <span className="tag tag-group">
                      👥 Viagem em Grupo
                    </span>
                  )}
                  
                  {/* Tag Privacidade */}
                  <span className={`tag tag-privacy privacy-${travel.privacy || 'public'}`}>
                    {travel.privacy === 'private' && '🔒 Privada'}
                    {travel.privacy === 'followers' && '👥 Seguidores'}
                    {(!travel.privacy || travel.privacy === 'public') && '🌍 Pública'}
                  </span>
                </div>
              </div>

              <div className="travel-content">
                <Link to={`/travel/${travel.id}`}>
                  {travel.highlightImage ? (
                    <>
                      <img
                        src={
                          travel.highlightImage instanceof File
                            ? URL.createObjectURL(travel.highlightImage)
                            : travel.highlightImage
                        }
                        alt={travel.name}
                        className="highlight-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = '';
                        }}
                      />
                      <div className="no-image-placeholder" style={{ display: 'none' }}>
                        <div className="no-image-icon">📸</div>
                        <span>Sem imagem</span>
                      </div>
                    </>
                  ) : (
                    <div className="no-image-placeholder">
                      <div className="no-image-icon">📸</div>
                      <span>Sem imagem</span>
                    </div>
                  )}
                  
                  <div className="travel-text">
                    <h3>{travel.name}</h3>
                    
                    <div className="travel-info">
                      <div className="info-item">
                        <span className="info-icon">👤</span>
                        <span>Por {user.firstName}</span>
                      </div>
                      
                      {/* Mostrar destinos - diferente para single vs multi */}
                      {(travel.travelType?.main === 'multi' || travel.multiDestinations) && travel.multiDestinations ? (
                        <div className="info-item">
                          <span className="info-icon">🌍</span>
                          <span>
                            {travel.multiDestinations.slice(0, 2).map(dest => `${dest.city}, ${dest.country}`).join(' • ')}
                            {travel.multiDestinations.length > 2 && ` +${travel.multiDestinations.length - 2} destinos`}
                          </span>
                        </div>
                      ) : (
                        <div className="info-item">
                          <span className="info-icon">🌍</span>
                          <span>{travel.city}, {travel.countryName || travel.country}</span>
                        </div>
                      )}
                      
                      <div className="info-item">
                        <span className="info-icon">📅</span>
                        <span>{travel.tripDurationDays || travel.days} dias</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-icon">💰</span>
                        <span>{travel.cost?.total || travel.price}€</span>
                      </div>
                      
                      <div className="info-item rating">
                        <span className="info-icon">⭐</span>
                        <span className="stars">
                          {renderStars(travel.tripRating || travel.stars)}
                        </span>
                      </div>
                      
                      {/* Categorias */}
                      {travel.category && travel.category.length > 0 && (
                        <div className="info-item categories">
                          <span className="info-icon">🗂️</span>
                          <span>{travel.category.slice(0, 2).join(', ')}{travel.category.length > 2 && '...'}</span>
                        </div>
                      )}

                      {/* Membros do grupo */}
                      {((travel.travelType?.isGroup && travel.groupData?.members) || travel.groupData?.members) && travel.groupData.members.length > 0 && (
                        <div className="info-item group-members">
                          <span className="info-icon">👥</span>
                          <span>{travel.groupData.members.length + 1} membros</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="travel-description">
                      {travel.description && (
                        <p>{travel.description.length > 80 ? `${travel.description.substring(0, 80)}...` : travel.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
                <Link to={`/travel/${travel.id}`} className="view-details-button">Ver mais detalhes →</Link>
              </div>
              
              <div className="travel-actions">
                {travel.status === 'draft' && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleEdit(travel.id);
                      setActiveTab('generalInfo');
                      setIsModalOpen(true);
                    }}
                    className="action-btn publish-btn"
                    title="Continuar a editar e publicar rascunho"
                    style={{backgroundColor: '#28a745', color: '#fff'}}
                  >
                    ✅ Publicar
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); travel.status === 'draft' ? handleEdit(travel.id) : handleLoadBackendTrip(travel.id); }}
                  className="action-btn edit-btn"
                  title="Editar viagem"
                >
                  ✏️ Editar
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); travel.status === 'draft' ? handleDelete(travel.id) : handleDeleteBackendTrip(travel.id); }}
                  className="action-btn delete-btn"
                  title="Eliminar viagem"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Toast Component */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />

      {/* Validation error modal — shows ALL errors grouped by section.
          Triggered by validateTripForm in handleAddTravel (pre-flight
          check) and by backend errors that come back as a top-level
          message. Clicking "Ir para a secção" closes the modal and
          switches to the relevant tab so the user can fix issues in
          place. The form state is preserved across open/close. */}
      <TripErrorsModal
        isOpen={showErrorsModal}
        errors={formErrors}
        onClose={() => setShowErrorsModal(false)}
        onJumpToSection={(tab) => handleTabChange(tab)}
      />
    </div>
  );
};

export default MyTravels;
