/**
 * Single source of truth for trip-form validation rules.
 *
 * Every limit here MUST match the corresponding constraint in the Spring
 * backend (see `src/main/java/.../entites/trip/*.java` for entity @Size
 * and the `app.media.*` and `app.file-storage.*` config in
 * `application.yml`).
 *
 * If the backend limit ever changes, update this file in the same commit
 * so frontend and backend stay in lockstep.
 *
 * Why: we hit a 409 conflict on the user's "Volta de Bicicleta..." activity
 * (57 chars vs. a 55-char @Size constraint) and a 400 with the same root
 * cause for the long accommodation description. Mirroring the rules in the
 * form lets us show a clear error *before* the user clicks "Publicar" and
 * saves a round-trip — and keeps the form populated if the publish fails.
 */

// ──────────────────────────────────────────────────────────────────────
// 1. Text-length limits (mirror entity @Size + @Column length)
// ──────────────────────────────────────────────────────────────────────
export const TRIP_LIMITS = {
  // Top-level trip fields
  title: 200,
  tripSummary: 500,
  tripDescription: 5000,
  weather: 100,

  // Itinerary
  itineraryDay: 55, // e.g. "Day 1" — short label only
  itineraryActivityName: 200, // bumped from 55 (real activities are long)
  itineraryActivityDescription: 2000, // bumped from 255

  // Reference points
  referencePointName: 200,
  referencePointDescription: 2000, // was text-before, now explicit limit
  referencePointCity: 100, // bumped from 55 ("San Cristóbal de La Laguna")

  // Recommended foods
  foodName: 200,
  foodDescription: 2000, // bumped from 255
  foodCity: 100, // bumped from 55

  // Accommodations
  accommodationName: 55, // short hotel name
  accommodationCity: 100, // bumped from 55
  accommodationDescription: 2000, // bumped from 250
  accommodationPrice: 1_000_000, // sanity cap; backend accepts any int
  accommodationNights: 365, // sanity cap; backend accepts any int

  // Negative points (no @Size in entity, but we cap to keep UI sane)
  negativePointName: 200,
  negativePointDescription: 2000,

  // Transports
  transportDescription: 1000,
  transportCost: 1_000_000,
};

// ──────────────────────────────────────────────────────────────────────
// 2. File limits (mirror application.yml `app.media.*` / `app.file-storage.*`)
// ──────────────────────────────────────────────────────────────────────
export const FILE_LIMITS = {
  // app.file-storage.max-file-size
  maxImageSizeBytes: 5 * 1024 * 1024, // 5 MB
  // spring.servlet.multipart.max-file-size (we use the same cap for videos)
  maxVideoSizeBytes: 100 * 1024 * 1024, // 100 MB

  // app.media.*
  maxPhotosPerTrip: 20,
  maxVideosPerTrip: 3,
  maxPhotosPerAccommodation: 5,
  maxPhotosPerReferencePoint: 5,
  // Backend enforces "max 1 photo per food" by failing on the second upload.
  maxPhotosPerFood: 1,

  // app.file-storage.allowed-extensions
  imageExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  // matches LocalFileStorageService.isValidVideoMimeType
  videoExtensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
};

// ──────────────────────────────────────────────────────────────────────
// 3. Small helpers
// ──────────────────────────────────────────────────────────────────────

/** Returns true when the input is a non-empty value.
 *  Accepts strings ("hello") AND numbers (1, 2, …) so that fields
 *  whose values are stored as numbers in React state (e.g. itinerary
 *  day parsed by parseInt) still pass the required check.
 *  Returns false for: null, undefined, '', '   ', NaN, Infinity,
 *  and 0 (since 0 is rarely a meaningful "set" value — parseInt("")
 *  returns NaN, not 0, so users will never legitimately set 0). */
const isNonEmpty = (v) => {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v) && v !== 0;
  return false;
};

/** Length in JS characters (not bytes). Matches Hibernate @Size semantics. */
const charLen = (v) => (typeof v === 'string' ? v.length : 0);

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return '?';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileExt = (name) => {
  if (!name || typeof name !== 'string') return '';
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.substring(i + 1).toLowerCase() : '';
};

// ──────────────────────────────────────────────────────────────────────
// 4. Single-field validators
//    Each returns null if valid, or a human-readable error string.
// ──────────────────────────────────────────────────────────────────────

export const validateText = (value, { label, max, required = false } = {}) => {
  const len = charLen(value);
  if (required && !isNonEmpty(value)) {
    return `${label} é obrigatório.`;
  }
  if (max && len > max) {
    return `${label} excede o máximo de ${max} caracteres (atualmente ${len}).`;
  }
  return null;
};

/**
 * Validate a single File (image or video) against the trip's storage rules.
 * Mirrors the LocalFileStorageService.validateImage / validateVideo.
 */
export const validateFile = (file, kind = 'image') => {
  if (!(file instanceof File) && !(file instanceof Blob)) {
    return `${kind === 'video' ? 'Vídeo' : 'Imagem'} inválido.`;
  }
  const ext = fileExt(file.name);
  if (kind === 'image') {
    if (!FILE_LIMITS.imageExtensions.includes(ext)) {
      return `Formato de imagem não suportado (${ext || 'sem extensão'}). Use: ${FILE_LIMITS.imageExtensions.join(', ')}.`;
    }
    if (file.size > FILE_LIMITS.maxImageSizeBytes) {
      return `Imagem demasiado grande (${formatBytes(file.size)}). Máximo: ${formatBytes(FILE_LIMITS.maxImageSizeBytes)}.`;
    }
  } else {
    if (!FILE_LIMITS.videoExtensions.includes(ext)) {
      return `Formato de vídeo não suportado (${ext || 'sem extensão'}). Use: ${FILE_LIMITS.videoExtensions.join(', ')}.`;
    }
    if (file.size > FILE_LIMITS.maxVideoSizeBytes) {
      return `Vídeo demasiado grande (${formatBytes(file.size)}). Máximo: ${formatBytes(FILE_LIMITS.maxVideoSizeBytes)}.`;
    }
  }
  return null;
};

/**
 * Validate a numeric input that maps to a backend `int` field.
 * Returns null if valid, otherwise an error string.
 */
export const validateInt = (value, { label, min = 0, max, required = false } = {}) => {
  const raw = value === '' || value == null ? '' : String(value);
  if (raw === '') {
    return required ? `${label} é obrigatório.` : null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return `${label} tem de ser um número inteiro.`;
  }
  if (n < min) {
    return `${label} tem de ser >= ${min}.`;
  }
  if (max != null && n > max) {
    return `${label} tem de ser <= ${max}.`;
  }
  return null;
};

/**
 * Validate a date in `YYYY-MM-DD` format. Returns null if valid.
 * `compareTo` (optional) is { min, max } against today or another date string.
 */
export const validateDate = (value, { label, required = false, min, max } = {}) => {
  if (!value) {
    return required ? `${label} é obrigatória.` : null;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${label} tem de estar no formato AAAA-MM-DD.`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return `${label} é uma data inválida.`;
  }
  if (min && value < min) return `${label} tem de ser >= ${min}.`;
  if (max && value > max) return `${label} tem de ser <= ${max}.`;
  return null;
};

// ──────────────────────────────────────────────────────────────────────
// 5. Whole-form validator
//    Runs the cheap, client-side checks so we don't ping the backend
//    for a payload we already know is bad.
// ──────────────────────────────────────────────────────────────────────

/**
 * The shape of a single error from `validateTripForm`:
 *
 *   {
 *     section: 'general' | 'accommodations' | 'referencePoints' |
 *              'foods' | 'negativePoints' | 'itinerary' | 'media',
 *     sectionLabel: 'Informações Gerais',            // user-friendly
 *     itemIndex: 2,                                  // 0-based index of
 *                                                    // the offending item
 *                                                    // (e.g. accom #3);
 *                                                    // null for top-level
 *     itemLabel: 'Estadia #3',                       // display name
 *     field: 'description',                           // which sub-field
 *                                                    // is bad (null for
 *                                                    // item-level)
 *     message: 'excede o máximo de 2000 caracteres...', // human msg
 *   }
 *
 * Sections map 1:1 to the React form tabs so the error modal can
 * render a "Jump to" button per group and we can drive tab badges.
 */
export const TRIP_FORM_SECTIONS = {
  general: { tab: 'generalInfo', label: 'Informações Gerais', icon: '📋' },
  accommodations: { tab: 'accommodation', label: 'Estadias', icon: '🏠' },
  referencePoints: { tab: 'referencePoints', label: 'Pontos de Referência', icon: '📍' },
  foods: { tab: 'food', label: 'Alimentação', icon: '🍽️' },
  negativePoints: { tab: 'negativePoints', label: 'Pontos Negativos', icon: '⚠️' },
  itinerary: { tab: 'itinerary', label: 'Itinerário', icon: '🗓️' },
  media: { tab: 'generalInfo', label: 'Fotos & Vídeos', icon: '📷' },
};

/**
 * Validate the full trip form. Returns:
 *   { valid: true,  errors: [] }
 *   { valid: false, errors: TripFormError[] }
 *
 * `form` shape (the relevant subset of the React form state):
 *   { title, tripSummary, tripDescription, startDate, endDate,
 *     bookingDate, weather, tripRating, city, country,
 *     categories, languagesSpoken, cost, accommodations, ... }
 *
 * `media` is a sibling object holding raw File arrays:
 *   { coverPhoto, generalPhotos, videos, // trip-level
 *     accommodationPhotos: [[file, file], ...],
 *     referencePointPhotos: [[file, file], ...],
 *     foodPhotos: [file, file, ...] }
 */
export const validateTripForm = (form, media = {}) => {
  // Project the form into the field names the validation rules
  // expect (see normalizeTripForm for the full mapping). After this
  // point, all field checks below operate on backend-shaped keys
  // (`title`, `tripSummary`, …).
  form = normalizeTripForm(form);

  const errors = [];

  const add = (section, itemIndex, itemLabel, field, message) => {
    const sectionMeta = TRIP_FORM_SECTIONS[section] || TRIP_FORM_SECTIONS.general;
    errors.push({
      section,
      sectionLabel: sectionMeta.label,
      sectionIcon: sectionMeta.icon,
      itemIndex,
      itemLabel,
      field,
      message,
    });
  };

  // ── General / top-level fields ────────────────────────────────
  if (!isNonEmpty(form.title)) {
    add('general', null, null, 'title', 'Nome da Viagem é obrigatório.');
  } else if (form.title.length > TRIP_LIMITS.title) {
    add('general', null, null, 'title', `Nome da Viagem excede o máximo de ${TRIP_LIMITS.title} caracteres (atual ${form.title.length}).`);
  }
  if (!isNonEmpty(form.tripSummary)) {
    add('general', null, null, 'tripSummary', 'Descrição Curta é obrigatória.');
  } else if (form.tripSummary.length > TRIP_LIMITS.tripSummary) {
    add('general', null, null, 'tripSummary', `Descrição Curta excede o máximo de ${TRIP_LIMITS.tripSummary} caracteres (atual ${form.tripSummary.length}).`);
  }
  if (!isNonEmpty(form.tripDescription)) {
    add('general', null, null, 'tripDescription', 'Descrição Longa é obrigatória.');
  } else if (form.tripDescription.length > TRIP_LIMITS.tripDescription) {
    add('general', null, null, 'tripDescription', `Descrição Longa excede o máximo de ${TRIP_LIMITS.tripDescription} caracteres (atual ${form.tripDescription.length}).`);
  }
  if (isNonEmpty(form.weather) && form.weather.length > TRIP_LIMITS.weather) {
    add('general', null, null, 'weather', `Clima excede o máximo de ${TRIP_LIMITS.weather} caracteres (atual ${form.weather.length}).`);
  }
  const rating = Number(form.stars ?? form.tripRating);
  if (rating === 0 || rating == null || Number.isNaN(rating)) {
    add('general', null, null, 'stars', 'Avaliação da viagem é obrigatória (escolha 1-5 estrelas).');
  } else if (rating < 0 || rating > 5) {
    add('general', null, null, 'stars', 'Avaliação tem de estar entre 0 e 5.');
  }

  // Dates
  if (!form.startDate) {
    add('general', null, null, 'startDate', 'Data de Início é obrigatória.');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate) || Number.isNaN(new Date(form.startDate).getTime())) {
    add('general', null, null, 'startDate', 'Data de Início tem de estar no formato AAAA-MM-DD.');
  }
  if (!form.endDate) {
    add('general', null, null, 'endDate', 'Data de Fim é obrigatória.');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.endDate) || Number.isNaN(new Date(form.endDate).getTime())) {
    add('general', null, null, 'endDate', 'Data de Fim tem de estar no formato AAAA-MM-DD.');
  }
  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    add('general', null, null, 'endDate', 'Data de início tem de ser anterior à data de fim.');
  }

  if (!isNonEmpty(form.country)) add('general', null, null, 'country', 'País é obrigatório.');
  if (!isNonEmpty(form.city)) add('general', null, null, 'city', 'Cidade é obrigatória.');

  if (!Array.isArray(form.category) || form.category.length === 0) {
    add('general', null, null, 'category', 'Selecione pelo menos uma categoria.');
  }
  if (!Array.isArray(form.languages) || form.languages.length === 0) {
    add('general', null, null, 'languages', 'Selecione pelo menos uma língua.');
  }

  // Cost sub-totals
  const pd = form.priceDetails || {};
  ['hotel', 'flight', 'food', 'transport', 'extras'].forEach((k) => {
    const v = pd[k];
    if (v !== '' && v != null) {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) {
        add('general', null, null, `priceDetails.${k}`, `Custo "${k}" tem de ser um número >= 0.`);
      }
    }
  });

  // ── Accommodations ─────────────────────────────────────────────
  if (Array.isArray(form.accommodations)) {
    form.accommodations.forEach((acc, i) => {
      const itemLabel = `Estadia #${i + 1}`;
      if (!isNonEmpty(acc.name)) {
        add('accommodations', i, itemLabel, 'name', 'Nome da estadia é obrigatório.');
      } else if (acc.name.length > TRIP_LIMITS.accommodationName) {
        add('accommodations', i, itemLabel, 'name', `Nome excede o máximo de ${TRIP_LIMITS.accommodationName} caracteres (atual ${acc.name.length}).`);
      }
      if (!isNonEmpty(acc.city)) {
        add('accommodations', i, itemLabel, 'city', 'Cidade é obrigatória.');
      } else if (acc.city.length > TRIP_LIMITS.accommodationCity) {
        add('accommodations', i, itemLabel, 'city', `Cidade excede o máximo de ${TRIP_LIMITS.accommodationCity} caracteres (atual ${acc.city.length}).`);
      }
      if (!isNonEmpty(acc.description)) {
        add('accommodations', i, itemLabel, 'description', 'Descrição é obrigatória.');
      } else if (acc.description.length > TRIP_LIMITS.accommodationDescription) {
        add('accommodations', i, itemLabel, 'description', `Descrição excede o máximo de ${TRIP_LIMITS.accommodationDescription} caracteres (atual ${acc.description.length}).`);
      }
      const price = Number(acc.price);
      if (acc.price == null || acc.price === '' || Number.isNaN(price) || price < 0) {
        add('accommodations', i, itemLabel, 'price', 'Preço tem de ser um número >= 0.');
      } else if (price > TRIP_LIMITS.accommodationPrice) {
        add('accommodations', i, itemLabel, 'price', `Preço excede o máximo razoável de ${TRIP_LIMITS.accommodationPrice}.`);
      }
      const nights = Number(acc.nights);
      if (acc.nights == null || acc.nights === '' || Number.isNaN(nights) || nights < 0) {
        add('accommodations', i, itemLabel, 'nights', 'Número de noites tem de ser >= 0.');
      } else if (nights > TRIP_LIMITS.accommodationNights) {
        add('accommodations', i, itemLabel, 'nights', `Número de noites excede o máximo razoável de ${TRIP_LIMITS.accommodationNights}.`);
      }
    });
  }

  // ── Reference points ──────────────────────────────────────────
  if (Array.isArray(form.pointsOfInterest)) {
    form.pointsOfInterest.forEach((p, i) => {
      const itemLabel = `Ponto #${i + 1}`;
      if (!isNonEmpty(p.name)) {
        add('referencePoints', i, itemLabel, 'name', 'Nome do ponto de referência é obrigatório.');
      } else if (p.name.length > TRIP_LIMITS.referencePointName) {
        add('referencePoints', i, itemLabel, 'name', `Nome excede o máximo de ${TRIP_LIMITS.referencePointName} caracteres (atual ${p.name.length}).`);
      }
      if (isNonEmpty(p.description) && p.description.length > TRIP_LIMITS.referencePointDescription) {
        add('referencePoints', i, itemLabel, 'description', `Descrição excede o máximo de ${TRIP_LIMITS.referencePointDescription} caracteres (atual ${p.description.length}).`);
      }
      if (isNonEmpty(p.city) && p.city.length > TRIP_LIMITS.referencePointCity) {
        add('referencePoints', i, itemLabel, 'city', `Cidade excede o máximo de ${TRIP_LIMITS.referencePointCity} caracteres (atual ${p.city.length}).`);
      }
    });
  }

  // ── Foods ──────────────────────────────────────────────────────
  if (Array.isArray(form.foodRecommendations)) {
    form.foodRecommendations.forEach((f, i) => {
      const itemLabel = `Recomendação #${i + 1}`;
      if (!isNonEmpty(f.name)) {
        add('foods', i, itemLabel, 'name', 'Nome da recomendação é obrigatório.');
      } else if (f.name.length > TRIP_LIMITS.foodName) {
        add('foods', i, itemLabel, 'name', `Nome excede o máximo de ${TRIP_LIMITS.foodName} caracteres (atual ${f.name.length}).`);
      }
      if (isNonEmpty(f.description) && f.description.length > TRIP_LIMITS.foodDescription) {
        add('foods', i, itemLabel, 'description', `Descrição excede o máximo de ${TRIP_LIMITS.foodDescription} caracteres (atual ${f.description.length}).`);
      }
      if (isNonEmpty(f.city) && f.city.length > TRIP_LIMITS.foodCity) {
        add('foods', i, itemLabel, 'city', `Cidade excede o máximo de ${TRIP_LIMITS.foodCity} caracteres (atual ${f.city.length}).`);
      }
    });
  }

  // ── Negative points ───────────────────────────────────────────
  if (Array.isArray(form.negativePoints)) {
    form.negativePoints.forEach((p, i) => {
      const itemLabel = `Ponto Negativo #${i + 1}`;
      if (!isNonEmpty(p.name)) {
        add('negativePoints', i, itemLabel, 'name', 'Nome é obrigatório.');
      } else if (p.name.length > TRIP_LIMITS.negativePointName) {
        add('negativePoints', i, itemLabel, 'name', `Nome excede o máximo de ${TRIP_LIMITS.negativePointName} caracteres (atual ${p.name.length}).`);
      }
      if (isNonEmpty(p.description) && p.description.length > TRIP_LIMITS.negativePointDescription) {
        add('negativePoints', i, itemLabel, 'description', `Descrição excede o máximo de ${TRIP_LIMITS.negativePointDescription} caracteres (atual ${p.description.length}).`);
      }
    });
  }

  // ── Itinerary ─────────────────────────────────────────────────
  if (Array.isArray(form.itinerary)) {
    form.itinerary.forEach((day, di) => {
      const dayLabel = `Dia ${day.day || di + 1}`;
      if (!isNonEmpty(day.day)) {
        add('itinerary', di, dayLabel, 'day', 'Número do dia é obrigatório.');
      } else if (String(day.day).length > TRIP_LIMITS.itineraryDay) {
        add('itinerary', di, dayLabel, 'day', `Nome do dia excede o máximo de ${TRIP_LIMITS.itineraryDay} caracteres.`);
      }
      if (Array.isArray(day.activities)) {
        day.activities.forEach((a, ai) => {
          if (!isNonEmpty(a)) return;
          if (a.length > TRIP_LIMITS.itineraryActivityName) {
            add('itinerary', di, dayLabel, `activities[${ai}]`, `Atividade #${ai + 1} excede ${TRIP_LIMITS.itineraryActivityName} caracteres (atual ${a.length}).`);
          }
        });
      }
    });
  }

  // ── Media files ───────────────────────────────────────────────
  const totalTripPhotos =
    (media.coverPhoto ? 1 : 0) +
    (Array.isArray(media.generalPhotos) ? media.generalPhotos.length : 0) +
    (Array.isArray(media.accommodationPhotos) ? media.accommodationPhotos.flat().length : 0) +
    (Array.isArray(media.referencePointPhotos) ? media.referencePointPhotos.flat().length : 0) +
    (Array.isArray(media.foodPhotos) ? media.foodPhotos.length : 0);
  if (totalTripPhotos > FILE_LIMITS.maxPhotosPerTrip) {
    add('media', null, null, 'photos', `Total de fotos (${totalTripPhotos}) excede o máximo de ${FILE_LIMITS.maxPhotosPerTrip} por viagem.`);
  }
  const totalTripVideos = Array.isArray(media.videos) ? media.videos.length : 0;
  if (totalTripVideos > FILE_LIMITS.maxVideosPerTrip) {
    add('media', null, null, 'videos', `Total de vídeos (${totalTripVideos}) excede o máximo de ${FILE_LIMITS.maxVideosPerTrip} por viagem.`);
  }

  if (Array.isArray(media.accommodationPhotos)) {
    media.accommodationPhotos.forEach((arr, i) => {
      const n = Array.isArray(arr) ? arr.length : 0;
      if (n > FILE_LIMITS.maxPhotosPerAccommodation) {
        add('media', i, `Estadia #${i + 1}`, 'photos', `${n} fotos excedem o máximo de ${FILE_LIMITS.maxPhotosPerAccommodation} por estadia.`);
      }
      if (Array.isArray(arr)) {
        arr.forEach((f, fi) => {
          const err = validateFile(f, 'image');
          if (err) add('media', i, `Estadia #${i + 1}`, `photo[${fi}]`, err);
        });
      }
    });
  }
  if (Array.isArray(media.referencePointPhotos)) {
    media.referencePointPhotos.forEach((arr, i) => {
      const n = Array.isArray(arr) ? arr.length : 0;
      if (n > FILE_LIMITS.maxPhotosPerReferencePoint) {
        add('media', i, `Ponto #${i + 1}`, 'photos', `${n} fotos excedem o máximo de ${FILE_LIMITS.maxPhotosPerReferencePoint} por ponto.`);
      }
      if (Array.isArray(arr)) {
        arr.forEach((f, fi) => {
          const err = validateFile(f, 'image');
          if (err) add('media', i, `Ponto #${i + 1}`, `photo[${fi}]`, err);
        });
      }
    });
  }
  if (Array.isArray(media.foodPhotos)) {
    media.foodPhotos.forEach((f, i) => {
      if (!f) return;
      const err = validateFile(f, 'image');
      if (err) add('media', i, `Recomendação #${i + 1}`, 'photo', err);
    });
  }
  if (media.coverPhoto) {
    const err = validateFile(media.coverPhoto, 'image');
    if (err) add('media', null, null, 'coverPhoto', err);
  }
  if (Array.isArray(media.generalPhotos)) {
    media.generalPhotos.forEach((f, i) => {
      const err = validateFile(f, 'image');
      if (err) add('media', null, null, `generalPhoto[${i}]`, err);
    });
  }
  if (Array.isArray(media.videos)) {
    media.videos.forEach((f, i) => {
      const err = validateFile(f, 'video');
      if (err) add('media', null, null, `video[${i}]`, err);
    });
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Group structured errors by `section` for rendering. Returns:
 *   [
 *     { section, sectionLabel, sectionIcon, errors: [...] },
 *     ...
 *   ]
 * Sections are ordered the same way they appear in the form, so the
 * modal reads top-to-bottom like the page.
 */
export const groupErrorsBySection = (errors) => {
  const order = ['general', 'accommodations', 'referencePoints', 'foods', 'negativePoints', 'itinerary', 'media'];
  const buckets = new Map();
  for (const e of errors) {
    if (!buckets.has(e.section)) buckets.set(e.section, []);
    buckets.get(e.section).push(e);
  }
  return order
    .filter((k) => buckets.has(k))
    .map((k) => ({
      section: k,
      sectionLabel: TRIP_FORM_SECTIONS[k].label,
      sectionIcon: TRIP_FORM_SECTIONS[k].icon,
      tab: TRIP_FORM_SECTIONS[k].tab,
      errors: buckets.get(k),
    }));
};

/**
 * Count errors per section. Used to drive the red badges on the tab
 * buttons. Returns { general: 0, accommodations: 2, ... }.
 */
export const countErrorsBySection = (errors) => {
  const counts = {};
  for (const e of errors) {
    counts[e.section] = (counts[e.section] || 0) + 1;
  }
  return counts;
};

/**
 * Look up the error (if any) for a specific (section, field, itemIndex)
 * triple. Used by the inline-error UI so each field can ask "am I in
 * trouble?" and render its own red border + message.
 *
 * Returns the first matching error object, or null.
 *
 *   getFieldError(errors, { section: 'general', field: 'title' })
 *   getFieldError(errors, { section: 'accommodations', field: 'name', itemIndex: 0 })
 *   getFieldError(errors, { section: 'itinerary', field: 'activities[0]', itemIndex: 0 })
 */
export const getFieldError = (errors, { section, field, itemIndex = null }) => {
  return errors.find((e) =>
    e.section === section
    && e.field === field
    && (itemIndex == null || e.itemIndex === itemIndex)
  ) || null;
};

/**
 * Map frontend form values into a backend-friendly date string.
 * The HTML `<input type="date">` already returns "YYYY-MM-DD" but if
 * anyone hands us a "DD/MM/YYYY" string we normalise it. Returns
 * `null` for unparseable values.
 */
export const normaliseDateString = (raw) => {
  if (raw == null || raw === '') return null;
  if (typeof raw !== 'string') return null;
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // DD/MM/YYYY (or DD-MM-YYYY)
  const m = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
};

/**
 * The MyTravels.js form state uses its own field names (e.g. `name`,
 * `description`, `longDescription`, `climate`) that don't match the
 * backend DTO field names (`title`, `tripSummary`, `tripDescription`,
 * `weather`). Before validating, we project the form into a
 * validation-friendly shape so the same code path works for both
 * backend and frontend.
 *
 * Without this normalisation, errors fire for fields that the user
 * has actually filled (e.g. `form.title` is undefined when the
 * frontend stores it as `form.name`), and the user sees phantom
 * errors in the tab badges.
 *
 * Returns a NEW object — the original is left untouched so React's
 * state semantics are preserved.
 */
export const normalizeTripForm = (form) => {
  if (!form || typeof form !== 'object') return {};
  const pd = form.priceDetails || {};
  // The itinerary has the form shape [{ day, activities: [] }, …]
  // which already matches the backend structure. Same for the
  // accommodations / pointsOfInterest / foodRecommendations lists.
  return {
    ...form,
    // Map top-level fields to their DTO names.
    title: form.title ?? form.name ?? '',
    tripSummary: form.tripSummary ?? form.description ?? '',
    tripDescription: form.tripDescription ?? form.longDescription ?? '',
    weather: form.weather ?? form.climate ?? '',
    stars: form.stars ?? form.tripRating ?? 0,
    // Cost sub-totals (the form uses hotel/flight/food/transport/extras,
    // the cost DTO uses accommodation/food/transport/extra — there is
    // no flight in the cost, so we just skip the flight key).
    priceDetails: {
      hotel: pd.accommodation ?? pd.hotel ?? '',
      food: pd.food ?? '',
      transport: pd.transport ?? '',
      extras: pd.extra ?? pd.extras ?? '',
    },
    // Normalise dates so the regex check accepts both ISO and EU
    // display formats.
    startDate: normaliseDateString(form.startDate) || form.startDate || '',
    endDate: normaliseDateString(form.endDate) || form.endDate || '',
  };
};

