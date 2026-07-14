import {
  TRIP_LIMITS,
  FILE_LIMITS,
  TRIP_FORM_SECTIONS,
  validateText,
  validateInt,
  validateDate,
  validateFile,
  validateTripForm,
  groupErrorsBySection,
  countErrorsBySection,
  normaliseDateString,
  normalizeTripForm,
  getFieldError,
  formatBytes,
} from './tripValidation';

describe('tripValidation', () => {
  describe('TRIP_LIMITS', () => {
    test('mirrors backend ItineraryDayTopic.name bump (55 → 200)', () => {
      // The user's "Volta de Bicicleta..." activity was 57 chars and the
      // old @Size(max=55) was the source of the 409 conflict we hit.
      expect(TRIP_LIMITS.itineraryActivityName).toBe(200);
    });

    test('mirrors backend RecommendedFood.description bump (255 → 2000)', () => {
      expect(TRIP_LIMITS.foodDescription).toBe(2000);
    });

    test('mirrors backend Accommodation.description bump (250 → 2000)', () => {
      expect(TRIP_LIMITS.accommodationDescription).toBe(2000);
    });

    test('mirrors backend ReferencePoint city bump (55 → 100)', () => {
      expect(TRIP_LIMITS.referencePointCity).toBe(100);
    });

    test('keeps Accommodation.name at 55 (entity default)', () => {
      expect(TRIP_LIMITS.accommodationName).toBe(55);
    });
  });

  describe('FILE_LIMITS', () => {
    test('image max size is 5 MB', () => {
      expect(FILE_LIMITS.maxImageSizeBytes).toBe(5 * 1024 * 1024);
    });

    test('video max size is 100 MB', () => {
      expect(FILE_LIMITS.maxVideoSizeBytes).toBe(100 * 1024 * 1024);
    });

    test('image extensions match LocalFileStorageService whitelist', () => {
      expect(FILE_LIMITS.imageExtensions).toEqual(['jpg', 'jpeg', 'png', 'gif', 'webp']);
    });

    test('video extensions match LocalFileStorageService whitelist', () => {
      expect(FILE_LIMITS.videoExtensions).toEqual(['mp4', 'webm', 'mov', 'avi', 'mkv']);
    });

    test('per-entity photo caps match application.yml', () => {
      expect(FILE_LIMITS.maxPhotosPerTrip).toBe(20);
      expect(FILE_LIMITS.maxVideosPerTrip).toBe(3);
      expect(FILE_LIMITS.maxPhotosPerAccommodation).toBe(5);
      expect(FILE_LIMITS.maxPhotosPerReferencePoint).toBe(5);
      expect(FILE_LIMITS.maxPhotosPerFood).toBe(1);
    });
  });

  describe('formatBytes', () => {
    test.each([
      [0, '0 B'],
      [500, '500 B'],
      [1024, '1.0 KB'],
      [1536, '1.5 KB'],
      [5 * 1024 * 1024, '5.0 MB'],
      [100 * 1024 * 1024, '100.0 MB'],
    ])('formats %i → %s', (bytes, expected) => {
      expect(formatBytes(bytes)).toBe(expected);
    });
  });

  describe('validateText', () => {
    test('required + empty → error', () => {
      expect(validateText('', { label: 'Nome', required: true })).toMatch(/obrigat/);
      expect(validateText('   ', { label: 'Nome', required: true })).toMatch(/obrigat/);
    });

    test('required + non-empty → ok', () => {
      expect(validateText('Lisboa', { label: 'Nome', required: true })).toBeNull();
    });

    test('over max → error with both limits in the message', () => {
      const v = 'x'.repeat(56);
      const err = validateText(v, { label: 'Nome', max: 55 });
      expect(err).toMatch(/\b55\b/);
      expect(err).toMatch(/\b56\b/);
    });

    test('null + not required → ok', () => {
      expect(validateText(null, { label: 'Nome' })).toBeNull();
      expect(validateText(undefined, { label: 'Nome' })).toBeNull();
    });

    test('numeric value (e.g. itinerary day stored as number) passes required check', () => {
      // The MyTravels form stores itinerary.day as a number (parseInt).
      // isNonEmpty must accept that, otherwise the day would be flagged
      // as "not defined" even when the user did define it. This is the
      // regression test for the bug the user reported.
      expect(validateText(1, { label: 'Dia', required: true })).toBeNull();
      expect(validateText(11, { label: 'Dia', required: true })).toBeNull();
      expect(validateText(0, { label: 'Dia', required: true })).toMatch(/obrigat/);
    });
  });

  describe('validateInt', () => {
    test('valid integer within range', () => {
      expect(validateInt('5', { label: 'Preço' })).toBeNull();
    });

    test('negative rejected when min=0', () => {
      expect(validateInt('-1', { label: 'Preço', min: 0 })).toMatch(/>= 0/);
    });

    test('non-integer rejected', () => {
      expect(validateInt('1.5', { label: 'Preço' })).toMatch(/inteiro/);
    });

    test('empty + not required → ok', () => {
      expect(validateInt('', { label: 'Preço' })).toBeNull();
    });

    test('empty + required → error', () => {
      expect(validateInt('', { label: 'Preço', required: true })).toMatch(/obrigat/);
    });
  });

  describe('validateDate', () => {
    test('valid YYYY-MM-DD', () => {
      expect(validateDate('2026-06-09', { label: 'Início', required: true })).toBeNull();
    });

    test('invalid format → error', () => {
      expect(validateDate('09/06/2026', { label: 'Início' })).toMatch(/AAAA-MM-DD/);
    });

    test('invalid date (Feb 30)', () => {
      expect(validateDate('2026-02-30', { label: 'Início' })).toBeDefined();
    });

    test('min boundary check', () => {
      expect(validateDate('2026-01-01', { label: 'X', min: '2026-02-01' })).toMatch(/>=/);
    });
  });

  describe('validateFile', () => {
    const makeFile = (name, size) => {
      // jsdom doesn't compute file.size for plain File from constructor, so
      // we patch the descriptor.
      const f = new File(['x'], name, { type: 'image/jpeg' });
      Object.defineProperty(f, 'size', { value: size });
      return f;
    };

    test('valid jpg under 5MB → ok', () => {
      expect(validateFile(makeFile('cover.jpg', 1024 * 1024), 'image')).toBeNull();
    });

    test('image over 5MB → error', () => {
      const err = validateFile(makeFile('big.jpg', 6 * 1024 * 1024), 'image');
      expect(err).toMatch(/grande/);
    });

    test('unsupported image extension', () => {
      const err = validateFile(makeFile('photo.bmp', 1000), 'image');
      expect(err).toMatch(/n.o suportado/);
    });

    test('valid mp4 under 100MB → ok', () => {
      expect(validateFile(makeFile('trip.mp4', 50 * 1024 * 1024), 'video')).toBeNull();
    });

    test('video over 100MB → error', () => {
      const err = validateFile(makeFile('huge.mp4', 150 * 1024 * 1024), 'video');
      expect(err).toMatch(/grande/);
    });
  });

  describe('validateTripForm (the one that actually saves a roundtrip)', () => {
    const baseForm = () => ({
      title: 'Viagem Picos da Europa',
      tripSummary: 'Sumário',
      tripDescription: 'Descrição',
      startDate: '2026-06-09',
      endDate: '2026-06-14',
      weather: 'Bom',
      stars: 5,
      country: 'Spain',
      city: 'Llanes',
      category: ['Aventura'],
      languages: ['Português'],
      priceDetails: { hotel: '100', flight: '0', food: '50', transport: '20', extras: '0' },
      accommodations: [],
      pointsOfInterest: [],
      foodRecommendations: [],
      negativePoints: [],
      itinerary: [],
    });

    test('valid minimal form → valid', () => {
      const r = validateTripForm(baseForm(), {});
      expect(r.valid).toBe(true);
      expect(r.errors).toEqual([]);
    });

    test('missing required title → invalid with section + field', () => {
      const f = baseForm();
      f.title = '';
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      const e = r.errors.find((x) => x.field === 'title');
      expect(e).toBeDefined();
      expect(e.section).toBe('general');
      expect(e.message).toMatch(/obrigat/);
    });

    test('endDate before startDate → invalid', () => {
      const f = baseForm();
      f.endDate = '2026-06-01';
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.field === 'endDate' && /anterior/.test(e.message))).toBe(true);
    });

    test('rating = 0 → invalid (required > 0)', () => {
      const f = baseForm();
      f.stars = 0;
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.field === 'stars')).toBe(true);
    });

    test('over-long activity name → invalid with section=itinerary + itemIndex', () => {
      // 57 chars was the exact length of "Volta de Bicicleta ate à costa
      // e conhecer varias estradas" that triggered the 409 in the user's
      // original E2E test.
      const f = baseForm();
      f.itinerary = [{ day: 'Day 1', activities: ['x'.repeat(201)] }];
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      const e = r.errors.find((x) => x.section === 'itinerary' && x.itemIndex === 0);
      expect(e).toBeDefined();
      expect(e.field).toBe('activities[0]');
      expect(e.message).toMatch(/\b200\b/);
    });

    test('itinerary day stored as NUMBER (the real form) passes required check', () => {
      // The MyTravels form stores itinerary.day as a number — it does
      // `day: dayToAdd` where dayToAdd = parseInt(input). The validation
      // used to be string-only and reported a phantom "day is required"
      // error. This regression test guards against that.
      const f = baseForm();
      f.itinerary = [{ day: 1, activities: ['Atividade válida'] }];
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(true);
      expect(r.errors).toEqual([]);
    });

    test('itinerary day missing (undefined) still flagged', () => {
      const f = baseForm();
      f.itinerary = [{ activities: ['Atividade válida'] }]; // no `day` key at all
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      expect(r.errors.find((e) => e.section === 'itinerary' && e.field === 'day')).toBeDefined();
    });

    test('over-long accommodation description → invalid with section=accommodations', () => {
      const f = baseForm();
      f.accommodations = [{
        name: 'Casas de Nieda', city: 'Llanes', description: 'x'.repeat(2001), price: '30', nights: '2',
      }];
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      const e = r.errors.find((x) => x.section === 'accommodations' && x.itemIndex === 0 && x.field === 'description');
      expect(e).toBeDefined();
      expect(e.message).toMatch(/\b2000\b/);
    });

    test('over-long food name → invalid with section=foods', () => {
      const f = baseForm();
      f.foodRecommendations = [{ name: 'x'.repeat(201), description: 'd', city: 'Llanes' }];
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      const e = r.errors.find((x) => x.section === 'foods' && x.field === 'name');
      expect(e).toBeDefined();
      expect(e.message).toMatch(/\b200\b/);
    });

    test('over-long reference point name → invalid with section=referencePoints', () => {
      const f = baseForm();
      f.pointsOfInterest = [{ name: 'x'.repeat(201), description: 'd', city: 'Llanes' }];
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      const e = r.errors.find((x) => x.section === 'referencePoints' && x.field === 'name');
      expect(e).toBeDefined();
      expect(e.message).toMatch(/\b200\b/);
    });

    test('total photos over 20 → invalid with section=media', () => {
      const f = baseForm();
      // 21 photos across accommodations
      const many = Array.from({ length: 21 }, (_, i) => new File(['x'], `p${i}.jpg`, { type: 'image/jpeg' }));
      const r = validateTripForm(f, { accommodationPhotos: [many] });
      expect(r.valid).toBe(false);
      const e = r.errors.find((x) => x.section === 'media' && x.field === 'photos');
      expect(e).toBeDefined();
      expect(e.message).toMatch(/\b20\b/);
    });

    test('per-accommodation cap of 5', () => {
      const f = baseForm();
      f.accommodations = [{ name: 'X', city: 'L', description: 'd', price: '1', nights: '1' }];
      const tooMany = Array.from({ length: 6 }, (_, i) => new File(['x'], `p${i}.jpg`, { type: 'image/jpeg' }));
      const r = validateTripForm(f, { accommodationPhotos: [tooMany] });
      expect(r.valid).toBe(false);
      const e = r.errors.find((x) => x.section === 'media' && x.itemIndex === 0);
      expect(e).toBeDefined();
      expect(e.message).toMatch(/m.ximo de 5 por estadia/);
    });

    test('total videos over 3 → invalid', () => {
      const f = baseForm();
      const vids = Array.from({ length: 4 }, (_, i) => new File(['x'], `v${i}.mp4`, { type: 'video/mp4' }));
      const r = validateTripForm(f, { videos: vids });
      expect(r.valid).toBe(false);
      const e = r.errors.find((x) => x.field === 'videos');
      expect(e).toBeDefined();
      expect(e.message).toMatch(/\b3\b/);
    });

    test('too many categories not an error (no limit) — only require ≥ 1', () => {
      const f = baseForm();
      f.category = [];
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.field === 'category')).toBe(true);
    });
  });

  describe('TRIP_FORM_SECTIONS', () => {
    test('exposes every section with a tab key', () => {
      for (const k of Object.keys(TRIP_FORM_SECTIONS)) {
        const s = TRIP_FORM_SECTIONS[k];
        expect(s.tab).toBeDefined();
        expect(s.label).toBeDefined();
        expect(s.icon).toBeDefined();
      }
    });
  });

  describe('normaliseDateString', () => {
    test('passes through ISO strings unchanged', () => {
      expect(normaliseDateString('2026-06-09')).toBe('2026-06-09');
    });
    test('converts DD/MM/YYYY to ISO', () => {
      expect(normaliseDateString('04/06/2026')).toBe('2026-06-04');
      expect(normaliseDateString('9/6/2026')).toBe('2026-06-09');
    });
    test('accepts DD-MM-YYYY and DD.MM.YYYY separators', () => {
      expect(normaliseDateString('04-06-2026')).toBe('2026-06-04');
      expect(normaliseDateString('04.06.2026')).toBe('2026-06-04');
    });
    test('returns null for empty or unparseable input', () => {
      expect(normaliseDateString('')).toBeNull();
      expect(normaliseDateString(null)).toBeNull();
      expect(normaliseDateString('not a date')).toBeNull();
    });
  });

  describe('normalizeTripForm (THE bug fix)', () => {
    test('maps frontend field names to backend DTO names', () => {
      const frontend = {
        name: 'TESTE NOVO',
        description: 'curta',
        longDescription: 'longa',
        climate: 'Bom',
        stars: 5,
        priceDetails: { hotel: '100', flight: '50', food: '20', transport: '30', extras: '10' },
        startDate: '2026-06-09',
        endDate: '2026-06-14',
      };
      const normalised = normalizeTripForm(frontend);
      expect(normalised.title).toBe('TESTE NOVO');
      expect(normalised.tripSummary).toBe('curta');
      expect(normalised.tripDescription).toBe('longa');
      expect(normalised.weather).toBe('Bom');
      expect(normalised.stars).toBe(5);
      // cost sub-totals: hotel→hotel, accommodation, flight dropped
      expect(normalised.priceDetails.hotel).toBe('100');
      expect(normalised.priceDetails.food).toBe('20');
      expect(normalised.priceDetails.transport).toBe('30');
      expect(normalised.priceDetails.extras).toBe('10');
    });

    test('normalises EU-format dates to ISO', () => {
      const frontend = { startDate: '04/06/2026', endDate: '09/06/2026' };
      const normalised = normalizeTripForm(frontend);
      expect(normalised.startDate).toBe('2026-06-04');
      expect(normalised.endDate).toBe('2026-06-09');
    });

    test('preserves normalised fields when they already exist', () => {
      const frontend = { title: 'X', tripSummary: 'Y' };
      const normalised = normalizeTripForm(frontend);
      expect(normalised.title).toBe('X');
      expect(normalised.tripSummary).toBe('Y');
    });
  });

  describe('getFieldError', () => {
    const sampleErrors = [
      { section: 'general', field: 'title', message: 'Title is required' },
      { section: 'accommodations', field: 'name', itemIndex: 0, message: 'Name is required' },
      { section: 'accommodations', field: 'description', itemIndex: 0, message: 'Too long' },
      { section: 'itinerary', field: 'activities[0]', itemIndex: 0, message: 'Activity too long' },
    ];

    test('finds a top-level field by section + field', () => {
      expect(getFieldError(sampleErrors, { section: 'general', field: 'title' })?.message)
        .toBe('Title is required');
    });

    test('finds an item-level field by section + field + itemIndex', () => {
      expect(getFieldError(sampleErrors, { section: 'accommodations', field: 'name', itemIndex: 0 })?.message)
        .toBe('Name is required');
    });

    test('distinguishes between items in the same section', () => {
      const errors = [
        ...sampleErrors,
        { section: 'accommodations', field: 'name', itemIndex: 1, message: 'Different name' },
      ];
      const r = getFieldError(errors, { section: 'accommodations', field: 'name', itemIndex: 1 });
      expect(r?.message).toBe('Different name');
    });

    test('returns null when no match', () => {
      expect(getFieldError(sampleErrors, { section: 'media', field: 'coverPhoto' })).toBeNull();
    });
  });

  describe('validateTripForm with frontend-style field names (regression)', () => {
    // The user's actual form uses `name`, `description`, `longDescription`,
    // `climate` — not `title`, `tripSummary`, … . Make sure
    // normalizeTripForm bridges them so errors fire on the right
    // fields.
    const frontendForm = () => ({
      name: 'TESTE NOVO',
      description: 'Viagem ao Geres',
      longDescription: 'Viagem ao geres, conhecer tudo o que deu pra conhecer',
      climate: 'Clima bom',
      stars: 5,
      startDate: '2026-06-04',
      endDate: '2026-06-09',
      country: 'Portugal',
      city: 'Braga',
      category: ['Aventura'],
      languages: ['PT'],
      priceDetails: { hotel: '', flight: '', food: '', transport: '', extras: '' },
      accommodations: [],
      pointsOfInterest: [],
      foodRecommendations: [],
      negativePoints: [],
      itinerary: [],
    });

    test('fully-filled frontend form → no errors (the user\'s case)', () => {
      const r = validateTripForm(frontendForm(), {});
      expect(r.valid).toBe(true);
      expect(r.errors).toEqual([]);
    });

    test('empty title (name) → flagged', () => {
      const f = frontendForm();
      f.name = '';
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      expect(r.errors.find((e) => e.field === 'title')).toBeDefined();
    });

    test('empty short description → flagged', () => {
      const f = frontendForm();
      f.description = '';
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(false);
      expect(r.errors.find((e) => e.field === 'tripSummary')).toBeDefined();
    });

    test('EU-format dates accepted', () => {
      const f = frontendForm();
      f.startDate = '04/06/2026';
      f.endDate = '09/06/2026';
      const r = validateTripForm(f, {});
      expect(r.valid).toBe(true);
    });
  });

  describe('groupErrorsBySection', () => {
    test('groups by section and preserves insertion order', () => {
      const errs = [
        { section: 'itinerary', sectionLabel: 'Itinerário', sectionIcon: '🗓️', message: 'a' },
        { section: 'general', sectionLabel: 'Geral', sectionIcon: '📋', message: 'b' },
        { section: 'itinerary', sectionLabel: 'Itinerário', sectionIcon: '🗓️', message: 'c' },
      ];
      const grouped = groupErrorsBySection(errs);
      expect(grouped).toHaveLength(2);
      // 'general' comes first in our order
      expect(grouped[0].section).toBe('general');
      expect(grouped[0].errors).toHaveLength(1);
      // 'itinerary' second, with both errors
      expect(grouped[1].section).toBe('itinerary');
      expect(grouped[1].errors).toHaveLength(2);
    });

    test('attaches a tab key to each group for "Jump to" links', () => {
      const errs = [
        { section: 'accommodations', sectionLabel: 'Estadias', sectionIcon: '🏠', message: 'x' },
      ];
      const [g] = groupErrorsBySection(errs);
      expect(g.tab).toBe('accommodation');
    });
  });

  describe('countErrorsBySection', () => {
    test('returns a count per section, omitting empty ones', () => {
      const errs = [
        { section: 'general' },
        { section: 'itinerary' },
        { section: 'itinerary' },
        { section: 'itinerary' },
      ];
      expect(countErrorsBySection(errs)).toEqual({ general: 1, itinerary: 3 });
    });

    test('returns empty object for no errors', () => {
      expect(countErrorsBySection([])).toEqual({});
    });
  });
});
