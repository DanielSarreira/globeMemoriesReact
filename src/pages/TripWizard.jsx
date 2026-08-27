/* eslint-disable */
// =============================================================================
//   TripWizard — Premium multi-step creation flow (full-screen page)
//   5 steps: Essentials → Destinos → Datas & Custos → Experiência → Review
//   Mobile-first, single column on phones.
//   Every field on submit goes through the existing Spring Boot endpoints.
// =============================================================================

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, Compass, MapPin, Calendar, Image as ImageIcon,
  Save, Bookmark, Sparkles, X, Plus, Globe, Wallet, Users, Sun, Heart, Trash2,
  BedDouble, UtensilsCrossed, Bus, Star, Camera, Languages, Shield, Lock, Eye,
  AlertTriangle, Lightbulb, FileText, ListChecks, PartyPopper, Plane, Mountain,
  Home as HomeIcon, Tag, CalendarRange, Clock, Navigation, ChevronDown, Smile, Loader2, Edit3,
  Plane as PlaneIcon, Wallet as WalletIcon, Euro,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { request, uploadFile, toFullMediaUrl } from '../axios_helper';
import { useToast } from '../components/ui';
import { Drawer, ProgressRing, Segmented, Accordion } from '../components/ui';
import SearchableDropdown from '../components/ui/SearchableDropdown';
import { dispatchTripsChanged } from '../utils/userDisplay';
import { translateCountry, translateCity, translatePlace } from '../utils/localization';
import '../styles/pages/trip-wizard.css';

// Round 61 — Parse a photo caption into its body and (optional)
// association. Mirrors the helper in TravelDetails.jsx so the
// wizard can re-hydrate the per-photo association on edit-load
// (the source of truth is the caption — the `photoAssociations`
// state array is just a UX shortcut for the dropdown).
const WIZARD_ASSOC_RE = /^\s*\[(Alojamento|Alimenta\u00e7\u00e3o|Transporte|Ponto de Interesse)\s*:\s*([^\]]+)\]\s*(.*)$/s;
function parsePhotoCaption(raw) {
  if (!raw) return { text: '', association: null };
  const m = String(raw).match(WIZARD_ASSOC_RE);
  if (!m) return { text: String(raw), association: null };
  return { association: { type: m[1], name: m[2].trim() }, text: (m[3] || '').trim() };
}

// Map a "Tipo" label from the caption regex to the wizard's
// `associationOptions[].type` key.
const ASSOC_LABEL_TO_TYPE = {
  Alojamento: 'accommodation',
  Alimentação: 'food',
  Transporte: 'transport',
  'Ponto de Interesse': 'refpoint',
};
const ASSOC_TYPE_TO_LABEL = {
  accommodation: 'Alojamento',
  food: 'Alimentação',
  transport: 'Transporte',
  refpoint: 'Ponto de Interesse',
};

// -----------------------------------------------------------------------------
// Steps definition — 6 steps, narrative order.
//   1. Destinos  — "Para onde foste?" (concrete first, low friction)
//   2. Essencial — capa, nome, descrição, avaliação
//   3. Datas     — quando + custos (breakdown detalhado)
//   4. Experiência — categorias, línguas, sub-editores
//   5. Galeria   — fotografias + caption por foto (NOVO Round 43, era
//                  sub-tab da Experiência, agora é step próprio)
//   6. Rever     — pré-visualização + privacidade
// -----------------------------------------------------------------------------
const STEPS = [
  { id: 'where',      icon: MapPin,     color: '#FF9900' }, // 1
  { id: 'essentials', icon: FileText,   color: '#007BFF' }, // 2
  { id: 'when',       icon: Calendar,   color: '#FF9900' }, // 3
  { id: 'experience', icon: Sparkles,   color: '#16a34a' }, // 4
  { id: 'gallery',    icon: Camera,     color: '#7c3aed' }, // 5 (NOVO)
  { id: 'review',     icon: PartyPopper,color: '#16a34a' }, // 6
];

const CATEGORY_ICONS = {
  1: Mountain, 2: Plane, 3: Heart, 4: PartyPopper, 5: Sun, 6: Camera,
  7: UtensilsCrossed, 8: Sparkles, 9: HomeIcon, 10: Compass, 11: Star, 12: Globe,
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Round 50 — Shared auto-persist hook for the wizard editors. When
// the form is open AND the local state has the minimum content
// (e.g. a name), we keep a `__draft: true` clone of it at the end
// of the list. This way:
//   • The user can navigate between sub-tabs (or click "Continuar")
//     without losing what they were typing.
//   • Pressing "Adicionar" promotes the draft to a real entry.
//   • The list-item render filters drafts out, so the user never
//     sees a "phantom" item in the saved list.
// We isolate the logic here so all 6 editors (Accommodations /
// Foods / Transports / ReferencePoints / Itinerary / Pos+Neg Points)
// share the exact same behaviour.
//
// Round 60 — When `editIdx` is set (the user is editing an existing
// item), we skip the autosave so the form edits the in-place row
// instead of cloning the entry as a phantom draft at the end of the
// list. The previous version created a draft on every keystroke
// while editing, which is what caused the "duplica em vez de
// editar" bug that the user reported: clicking "Adicionar" with an
// existing item being edited was leaving a stray draft row behind
// in some cases, and the visible duplication came from the autosave
// racing the form's own state.
function useEditorDraftAutosave({ list, setField, field, local, open, hasContent, editing, editIdx }) {
  useEffect(() => {
    if (!open) return;
    const arr = Array.isArray(list) ? list : [];
    if (editing && editIdx !== null && editIdx >= 0 && editIdx < arr.length) {
      const currentItem = arr[editIdx];
      const updated = { ...currentItem, ...local };
      delete updated.__draft;
      if (JSON.stringify(currentItem) !== JSON.stringify(updated)) {
        const next = arr.map((item, i) => (i === editIdx ? updated : item));
        setField(field, next);
      }
      return;
    }
    const last = arr[arr.length - 1];
    const isDraft = last && last.__draft;
    if (hasContent(local)) {
      const draft = { ...local, __draft: true };
      const next = isDraft ? [...arr.slice(0, -1), draft] : [...arr, draft];
      setField(field, next);
    } else if (isDraft) {
      setField(field, arr.slice(0, -1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, open, editing, editIdx]);
}

// -----------------------------------------------------------------------------
// TripWizard
// -----------------------------------------------------------------------------
const TripWizard = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { user: authUser } = useAuth();
  const toast = useToast();
  const isEditing = Boolean(editId);

  const user = useMemo(() => {
    if (authUser) return authUser;
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, [authUser]);

  // Round 63+ — Guard the ORIGINAL photo list the moment the trip
  // loads for editing (before the user can remove any). The submit
  // handler uses this to DELETE the removed files from the backend.
  const photosBeforeEditRef = useRef([]);

  // ── Profile privacy (for default trip-privacy pre-fill) ───────────────
  // The trip-creation form must default to PUBLIC when the user has
  // a public profile, and to PRIVATE when their profile is private
  // — so the trip's visibility matches the profile's. We fetch the
  // detailed profile on mount, but only for new trips: when editing
  // an existing trip we keep whatever privacy the trip already has.
  const [profilePrivacy, setProfilePrivacy] = useState(null);
  useEffect(() => {
    if (editId) return; // editing: keep the trip's existing privacy
    if (!user?.id) return;
    let cancelled = false;
    request('GET', `/users/${user.id}/detailed`)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setProfilePrivacy(Boolean(data.privateProfile));
        // The user can still flip it on the Review step before
        // publishing, but pre-filling it makes the recommended
        // default match their profile setting.
        setTrip((prev) => {
          if (prev.privacy && prev.privacy !== 'public') return prev;
          return {
            ...prev,
            privacy: data.privateProfile ? 'private' : 'public',
          };
        });
      })
      .catch(() => { /* silent — fall back to PUBLIC default */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, user?.id]);

  // ── Trip state ──────────────────────────────────────────────────────
  const [trip, setTrip] = useState(() => ({
    type: 'single', isGroup: false,
    title: '', tripSummary: '', tripDescription: '', tripRating: 0,
    destinations: [{ country: '', city: '' }], cities: [],
    // Round 50 — Datas vazias por defeito. O user é que escolhe.
    // O nosso modelo é "viagens que JÁ aconteceram" (para inspirar
    // novos viajantes), por isso tanto o início como o fim têm de
    // ser <= HOJE. A validação enforce isto em validateStep(2).
    startDate: '', endDate: '', bookingDate: '',
    cost: { total: '', currency: 'EUR', notes: '' },
    privacy: 'public',
    // Cost breakdown (frontend-only for UX, merged into cost.total on submit)
    costBreakdown: { flight: '', accommodation: '', food: '', extras: '' },
    categories: [], languagesSpoken: [],
    accommodations: [], recommendedFoods: [], tripTransports: [],
    referencePoints: [], tripItinerary: { days: [] },
    positivePoints: [], negativePoints: [],
    photos: [], videos: [], photoCaptions: [],
    // Round 50 — Client-only: which gallery photo is associated
    // with which Accommodation / Food / Transport / Reference Point.
    // The association is encoded in the photo caption so it round-
    // trips through `photoCaptions[]` without schema changes.
    photoAssociations: [],
  }));

  // ── UI state ────────────────────────────────────────────────────────
  // Declared EARLY (before the edit-load useEffect) so the effect's
  // setters are in scope at hook-call time. The TDZ on `coverPhoto`
  // we hit in the previous round was caused by the state being
  // declared AFTER the effect that references its setter.
  const [countries, setCountries] = useState([]);
  const [citiesByCountry, setCitiesByCountry] = useState({});
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [coverPhoto, setCoverPhoto] = useState(null); // for the cover image in essentials
  // Round 49 — Gallery photo associations.
  // Each gallery photo can be associated with an entity the user
  // created in the wizard (Alojamento, Alimentação, Transporte,
  // Ponto de Referência). The index is aligned with `photoPreviews`
  // (NOT the gallery view that prepends the cover).
  //
  // We don't persist this to the backend directly — the schema is
  // locked. Instead, picking an association auto-fills the photo's
  // `caption` with the entity name, and the caption is the field
  // that already round-trips to the backend. On reload, the user
  // re-picks the association if they want to change it; the caption
  // remains as the source of truth.
  const [photoAssociations, setPhotoAssociations] = useState([]);

  // ── Auto-save to localStorage (Q1: BOTH strategy) ──────────────────
  // Round 40+ — the wizard persists the in-progress form to
  // localStorage on every change. This way a page refresh / browser
  // crash / accidental tab close does not lose the user's work.
  // When the user clicks "Guardar Rascunho" we ALSO hit the backend
  // (PUT /trips/{id}/draft). The local copy is keyed by userId so
  // multiple accounts on the same browser don't collide.
  //
  // NOTE: the auto-save useEffect lives HERE on purpose, BEFORE
  // the coverPhoto state declaration. The cover photo is a UI
  // preview only (it's uploaded after the trip is saved) so the
  // serialised form only needs the underlying `trip.photos[]`
  // array — `coverPhoto` itself is recomputed on load from
  // `trip.photos[0]`. This is why the save payload below does NOT
  // reference `coverPhoto` (TDZ fix).
  const DRAFT_KEY = `gm-trip-wizard-draft-${user?.id || 'anon'}`;
  useEffect(() => {
    if (editId) return; // editing an existing trip — no need to mirror to LS
    if (typeof window === 'undefined') return undefined;
    try {
      // Trip is a plain JSON-serialisable object — File objects are
      // not stored on it (the photos field only contains path
      // strings once the user has submitted the trip at least once).
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(trip));
    } catch (_) { /* quota / private mode — ignore */ }
    return undefined;
  }, [trip, editId, DRAFT_KEY]);

  // Round 46+ — Drafts + autosave are gone. The localStorage write
  // above is kept as a tab-crash-recovery hint only; we no longer
  // POST/PUT to the backend in the background. The user must click
  // "Publicar Viagem" / "Atualizar Viagem" to commit changes.

  // Round 46+ — Drafts are gone, so we no longer re-hydrate a
  // half-finished trip from localStorage on /trip/new. The local
  // write above stays as a tab-crash safety net but is cleared on
  // the next successful publish.

  // Load existing trip when editing
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await request('GET', `/trips/${editId}/edit-details`);
        const data = res.data || res;
        if (cancelled || !data) return;
        // Build the destination list from the denormalised country +
        // cityName fields (added in 2026-07 round 13). The raw
        // `cities` array on the edit-details DTO is just a list of
        // IDs (`List<Long>`), so we can't read names from it — we
        // rely on `country` and `cityName` which the mapper fills
        // from the first trip city at read time.
        const firstCountry = data.country || '';
        const firstCity = data.cityName || '';
        // Round 65 — O backend agora devolve `citiesDetail[]` com TODAS
        // as cidades (cityId, cityName, countryname). Usamos esta lista
        // para reconstruir TODOS os destinos de uma viagem multi-destino
        // — antes, os destinos extra perdiam-se porque o DTO só expunha
        // country/cityName do primeiro (sem ordem garantida num HashSet).
        // Fallback para o par country/cityName quando a lista não existe.
        const citiesDetail = Array.isArray(data.citiesDetail)
          ? data.citiesDetail
          : (Array.isArray(data.cities) && data.cities.length > 0
              ? (firstCountry || firstCity ? [{ cityId: Number(data.cities[0]) || null, cityName: firstCity, countryname: firstCountry }] : [])
              : []);
        const allDests = citiesDetail.length > 0
          ? citiesDetail
              .filter((c) => c && (c.cityName || c.countryname))
              .map((c) => ({ country: c.countryname || '', city: c.cityName || '' }))
          : (firstCountry || firstCity
              ? [{ country: firstCountry, city: firstCity }]
              : [{ country: '', city: '' }]);
        if (allDests.length === 0) allDests.push({ country: '', city: '' });
        const isMultiDest = allDests.length > 1;
        const existingPhotos = Array.isArray(data.photos) ? data.photos.filter(Boolean) : [];
        // V11 — captions come back from the backend as a parallel
        // list of strings (same length as `data.photos`). The first
        // caption belongs to the cover, the rest to the gallery
        // previews (which the wizard loads into `photoPreviews`).
        const existingCaptions = Array.isArray(data.photoCaptions) ? data.photoCaptions : [];
        photosBeforeEditRef.current = (existingPhotos || []).slice();
        // Round 46+ — cover caption field was removed. The first
        // caption in the backend (for the cover) is dropped; only
        // the gallery captions are kept.
        const previewCaptions = existingPhotos.length > 0 ? existingCaptions.slice(1) : existingCaptions.slice();
        setTrip({
          // Round 64/65 — O backend não tem campo `travelType`. O tipo
          // é inferido pelo número de destinos reconstruídos.
          type: isMultiDest ? 'multi' : 'single',
          isGroup: data.isGroup || false,
          travelType: data.travelType || { main: isMultiDest ? 'multi' : 'single', isGroup: false },
          title: data.title || '', tripSummary: data.tripSummary || '', tripDescription: data.tripDescription || '', tripRating: data.tripRating || 0,
          destinations: allDests,
          cities: Array.isArray(data.cities) ? data.cities : [],
          startDate: data.startDate ? data.startDate.slice(0, 10) : '', endDate: data.endDate ? data.endDate.slice(0, 10) : '', bookingDate: data.bookingDate ? data.bookingDate.slice(0, 10) : '',
          cost: { total: data.cost?.total?.toString() || '', currency: data.cost?.currency || 'EUR' },
          // Round 54 — O backend tem campos nativos `accommodation`,
          // `food`, `transport`, `extra` no `CostDto` (e na tabela
          // `cost`). Lemos directamente desses campos em vez de
          // tentar parsear um JSON em `notes` (que nem existe no
          // DTO). O `flight` do wizard mapeia para `transport` no
          // backend (semanticamente é o mesmo: transporte inclui voo).
          costBreakdown: (() => {
            // Prefer the native fields if the backend exposes them
            // (newer trips saved since Round 54).
            const hasNative = data.cost && (
              Number(data.cost.accommodation) > 0 ||
              Number(data.cost.food) > 0 ||
              Number(data.cost.transport) > 0 ||
              Number(data.cost.extra) > 0
            );
            if (hasNative) {
              return {
                flight: Number(data.cost.transport) > 0 ? String(data.cost.transport) : '',
                accommodation: Number(data.cost.accommodation) > 0 ? String(data.cost.accommodation) : '',
                food: Number(data.cost.food) > 0 ? String(data.cost.food) : '',
                extras: Number(data.cost.extra) > 0 ? String(data.cost.extra) : '',
              };
            }
            // Legacy fallback: derive from items + cost.total
            const flightAuto = (Array.isArray(data.tripTransports) ? data.tripTransports : [])
              .reduce((s, t) => s + (Number(t.cost) || 0), 0);
            const accommodationAuto = (Array.isArray(data.accommodations) ? data.accommodations : [])
              .reduce((s, a) => s + (Number(a.price) || 0) * (Number(a.nrNights) || 0), 0);
            const storedTotal = Number(data.cost?.total) || 0;
            const flightVal = flightAuto > 0 ? flightAuto : 0;
            const accommodationVal = accommodationAuto > 0 ? accommodationAuto : 0;
            const extrasVal = Math.max(0, storedTotal - flightVal - accommodationVal);
            return {
              flight: flightVal > 0 ? String(flightVal) : '',
              accommodation: accommodationVal > 0 ? String(accommodationVal) : '',
              food: '',
              extras: extrasVal > 0 ? String(extrasVal) : '',
            };
          })(),
          privacy: (data.tripPrivacy || 'public').toLowerCase(),
          categories: Array.isArray(data.categories) ? data.categories.map((c) => c.id || c) : [],
          languagesSpoken: Array.isArray(data.languagesSpoken) ? data.languagesSpoken.map((l) => l.id || l) : [],
          // Round 52 — Preserva o `city` do backend no entry para
          // que o buildPayload (que o injeta a partir do destino)
          // saiba qual era. Mantemos o input visual sem campo
          // "Cidade" — o user nunca o vê, mas o payload nunca envia
          // null. O `destinationIndex` é inicializado a 0 (será
          // recalculado se houver múltiplos destinos).
          accommodations: Array.isArray(data.accommodations) ? data.accommodations.map((a) => ({ name: a.name || '', type: a.accommodationTypeId || '', regime: a.accommodationBoardId || '', description: a.description || '', rating: a.rating || 0, nights: a.nrNights?.toString() || '', price: a.price?.toString() || '', checkInDate: a.checkIn ? a.checkIn.slice(0, 10) : '', checkOutDate: a.checkOut ? a.checkOut.slice(0, 10) : '', destinationIndex: 0, city: a.city || '' })) : [],
          // Round 50 — Preserve the backend's `city` so the buildPayload
          // resolver (which derives city from destinationIndex) can keep
          // the same value when the user doesn't change destinations.
          recommendedFoods: Array.isArray(data.recommendedFoods) ? data.recommendedFoods.map((f) => ({ name: f.name || '', description: f.description || '', city: f.city || '', destinationIndex: 0, photoUrl: Array.isArray(f.photos) && f.photos[0] ? f.photos[0] : '' })) : [],
          tripTransports: Array.isArray(data.tripTransports) ? data.tripTransports.map((t) => ({ transportId: t.transportId || t.id || '', name: t.name || '', description: t.description || '', cost: t.cost?.toString() || '', destinationIndex: 0, cityId: t.cityId || null })) : [],
          referencePoints: Array.isArray(data.referencePoints) ? data.referencePoints.map((r) => ({ name: r.name || '', description: r.description || '', type: r.type || '', link: r.link || '', city: r.city || '', photoUrls: Array.isArray(r.photos) ? r.photos : [], photos: Array.isArray(r.photos) ? r.photos : [] })) : [],
          tripItinerary: data.tripItinerary || { days: [] },
          positivePoints: Array.isArray(data.positivePoints) ? data.positivePoints.map((p) => ({ name: p.name || '', description: p.description || '', destinationIndex: 0, cityId: p.cityId || null })) : [],
          negativePoints: Array.isArray(data.negativePoints) ? data.negativePoints.map((n) => ({ name: n.name || '', description: n.description || '', destinationIndex: 0, cityId: n.cityId || null })) : [],
          photos: existingPhotos, videos: Array.isArray(data.videos) ? data.videos : [],
          photoCaptions: previewCaptions,
        });

        // Round 61 — Re-hydrate the per-photo association state
        // from the caption tags. The wizard stores the association
        // as a `[Tipo: Nome]` tag at the start of each caption
        // (see `updateAssociation` below). On edit-load we parse
        // each caption back into a structured entity so the
        // dropdowns in Step 5 show the right selected option
        // instead of "Nenhuma (livre)" for every photo.
        //
        // We only match against entities the wizard actually
        // loaded into `trip.accommodations` / `recommendedFoods` /
        // `tripTransports` / `referencePoints` — a stale tag that
        // points to a removed entity is ignored (the user can
        // re-pick if they want).
        const buildEntityIndex = (list, type, idPrefix) => {
          const idx = new Map();
          (list || []).forEach((e, i) => {
            if (e && e.name) idx.set(`${idPrefix}-${i}`, e);
            // Also index by lowercased name so the caption match
            // (which only has the name) can find the entity without
            // depending on the i index.
            idx.set(`name::${type}::${String(e.name).trim().toLowerCase()}`, e);
          });
          return idx;
        };
        const accIdx = buildEntityIndex(data.accommodations, 'accommodation', 'acc');
        const foodIdx = buildEntityIndex(data.recommendedFoods, 'food', 'food');
        const transIdx = buildEntityIndex(data.tripTransports, 'transport', 'tr');
        const refIdx = buildEntityIndex(data.referencePoints, 'refpoint', 'ref');
        const findByTypeAndName = (type, name) => {
          const k = `name::${type}::${String(name).trim().toLowerCase()}`;
          if (type === 'accommodation' && accIdx.has(k)) return accIdx.get(k);
          if (type === 'food' && foodIdx.has(k)) return foodIdx.get(k);
          if (type === 'transport' && transIdx.has(k)) return transIdx.get(k);
          if (type === 'refpoint' && refIdx.has(k)) return refIdx.get(k);
          return null;
        };
        const rehydratedAssociations = (previewCaptions || []).map((cap) => {
          const parsed = parsePhotoCaption(cap);
          if (!parsed.association) return null;
          const wizardType = ASSOC_LABEL_TO_TYPE[parsed.association.type];
          if (!wizardType) return null;
          const entity = findByTypeAndName(wizardType, parsed.association.name);
          if (!entity) return null;
          // We need a stable id that matches what `associationOptions`
          // generates. Re-derive from the entity's index in its
          // source list — `acc-0`, `food-1`, etc.
          let idPrefix;
          if (wizardType === 'accommodation') idPrefix = 'acc';
          else if (wizardType === 'food') idPrefix = 'food';
          else if (wizardType === 'transport') idPrefix = 'tr';
          else idPrefix = 'ref';
          const list = wizardType === 'accommodation' ? data.accommodations
            : wizardType === 'food' ? data.recommendedFoods
            : wizardType === 'transport' ? data.tripTransports
            : data.referencePoints;
          const i = (list || []).findIndex(
            (e) => e && e.name && String(e.name).trim() === parsed.association.name.trim()
          );
          if (i < 0) return null;
          // The `type` here is the wizard's internal type
          // (accommodation / food / transport / refpoint), which is
          // what `updateAssociation` uses to set `next[originalIdx] = entity`.
          return { id: `${idPrefix}-${i}`, type: wizardType, name: parsed.association.name };
        });
        setPhotoAssociations(rehydratedAssociations);

        // Seed the photo preview slots from the already-uploaded
        // photos so the user can SEE them in the form (and remove
        // them if they want). The first photo becomes the cover;
        // the rest go into the gallery. Each preview uses the
        // resolved media URL so the browser can actually load the
        // image, and is flagged with `existing: true` + the raw
        // path so submit knows to keep it.
        if (existingPhotos.length > 0) {
          const [coverPath, ...restPaths] = existingPhotos;
          if (coverPath) {
            setCoverPhoto({ url: toFullMediaUrl(coverPath), path: coverPath, existing: true });
          }
          if (restPaths.length > 0) {
            setPhotoPreviews(
              restPaths.map((p) => ({
                name: p.split('/').pop() || 'foto',
                url: toFullMediaUrl(p),
                path: p,
                existing: true,
              })),
            );
          }
        }

        // Seed the country + city dropdowns for the first destination
        // so the <select>s can show the saved country and city as
        // the selected option even before the catalog useEffect
        // finishes loading. We fetch from /cities/by-country for
        // the city list and merge the country into `countries`
        // (so the <select> for País has the matching <option>).
        if (firstCountry) {
          setCountries((prev) => prev.includes(firstCountry) ? prev : [...prev, firstCountry]);
        }
        if (firstCountry && firstCity) {
          try {
            const r = await request('GET', `/cities/by-country?countryName=${encodeURIComponent(firstCountry)}`);
            if (!cancelled) {
              const list = Array.isArray(r.data) ? r.data : [];
              setCitiesByCountry((m) => ({ ...m, [firstCountry]: list }));
            }
          } catch (e) { /* silent — fallback to empty list */ }
        }
      } catch (e) { toast.danger('Não foi possível carregar a viagem para edição.'); }
    })();
    return () => { cancelled = true; };
  }, [editId]);

  // ── UI state ────────────────────────────────────────────────────────
  const [stepIndex, setStepIndex] = useState(0);
  // Round 47+ — Dentro da tab 4 (Experiência), o botão "Continuar"
  // percorre as 5 sub-tabs (info → accommodations → foods →
  // transports → locais → extras) em vez de saltar direto para o Step 5.
  const STEP4_SUBTABS = ['info', 'accommodations', 'foods', 'transports', 'locais', 'extras'];
  const [subStepIndex, setSubStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isExperienceStep = step?.id === 'experience';
  const isLastSubTab = subStepIndex >= STEP4_SUBTABS.length - 1;
  const isLast = stepIndex === STEPS.length - 1;

  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [accommodationTypes, setAccommodationTypes] = useState([]);
  const [accommodationBoards, setAccommodationBoards] = useState([]);
  const [transports, setTransports] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Load catalog data ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [co, ct, la, at, ab, tr] = await Promise.all([
          request('GET', '/cities/countries'), request('GET', '/categories'),
          request('GET', '/languages-spoken'), request('GET', '/accommodation-types'),
          request('GET', '/accommodation-boards'), request('GET', '/transports'),
        ]);
        if (cancelled) return;
        // Round 54 — países ordenados alfabeticamente em PT-PT para
        // o dropdown ficar previsível (independentemente da ordem do
        // backend). Usamos `localeCompare` com `'pt'` para respeitar
        // a collation portuguesa (á, é, í, ó, ú, ã, õ, ç).
        const countriesRaw = Array.isArray(co.data) ? co.data : [];
        const countriesSorted = [...countriesRaw].sort((a, b) =>
          String(translateCountry(a) || a).localeCompare(String(translateCountry(b) || b), 'pt')
        );
        setCountries(countriesSorted);
        setCategories(ct.data || []);
        setLanguages(la.data || []); setAccommodationTypes(at.data || []);
        setAccommodationBoards(ab.data || []); setTransports(tr.data || []);
      } catch (e) { if (!cancelled) toast.danger('Não foi possível carregar o catálogo.'); }
      finally { if (!cancelled) setLoadingCatalog(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load cities when country changes
  useEffect(() => {
    let cancelled = false;
    const load = async (country) => {
      if (!country || citiesByCountry[country]) return;
      try {
        const r = await request('GET', `/cities/by-country?countryName=${encodeURIComponent(country)}`);
        if (!cancelled) setCitiesByCountry((m) => ({ ...m, [country]: r.data || [] }));
      } catch (e) { /* silent */ }
    };
    if (Array.isArray(trip.destinations)) trip.destinations.forEach((d) => d.country && load(d.country));
    return () => { cancelled = true; };
  }, [trip.destinations]);

  // ── Helpers ─────────────────────────────────────────────────────────
  // Deep-set a value in trip state by dot-separated path.
  // Correctly handles array indices (destinations.0.country).
  const setField = (path, value) => {
    setTrip((t) => {
      const next = { ...t };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const parent = cur[key];
        if (Array.isArray(parent)) {
          // Clone the array to avoid mutating original
          cur[key] = [...parent];
          cur = cur[key];
        } else if (parent && typeof parent === 'object') {
          cur[key] = { ...parent };
          cur = cur[key];
        } else {
          cur[key] = {};
          cur = cur[key];
        }
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const getDests = () => (Array.isArray(trip.destinations) ? trip.destinations : []);
  const addDestination = () => setTrip((t) => ({ ...t, type: 'multi', destinations: [...getDests(), { country: '', city: '' }] }));
  const removeDestination = (i) => {
    const updated = getDests().filter((_, idx) => idx !== i);
    setTrip((t) => ({ ...t, type: updated.length <= 1 ? 'single' : 'multi', destinations: updated }));
  };

  const toggleInList = (key, id) => setTrip((t) => {
    const list = t[key] || [];
    return { ...t, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
  });

  // ── Validation ──────────────────────────────────────────────────────
  // New step order: 0=where, 1=essentials, 2=when, 3=experience,
  // 4=gallery, 5=review. No validation on gallery or review.
  //
  // Round 46+ — Validações são agora mostradas como gm-toast em vez
  // de inline. A função devolve um array de mensagens e o caller
  // (goNext / handleSubmit) mostra cada uma via `toast.danger`.
  // Continuamos a popular `errors` para highlighting dos campos
  // com `has-error` (util para o utilizador saber onde actuar).
  // Round 60 — `tripOverride` lets `goNext` pass the synchronously
  // promoted trip so the validation sees the items the user just
  // typed (not the stale draft state from the closure).
  //
  // The actual `trip` read happens in `validateStepInner` so we
  // don't have to shadow the outer `trip` const (which would
  // throw a TDZ ReferenceError the first time the function ran).
  // The outer `validateStep` is a thin shim that picks the right
  // snapshot and forwards to the inner function.
  const validateStepInner = (idx, subIdx, trip) => {
    const e = {};
    const messages = [];
    if (idx === 0) {
      // Step 1 — Destinos
      const dests = Array.isArray(trip.destinations) ? trip.destinations : [];
      dests.forEach((d, i) => {
        if (!d.country) {
          e[`destinations.${i}.country`] = 'País obrigatório.';
          messages.push(`Destino ${i + 1}: País é obrigatório.`);
        }
        if (!d.city) {
          e[`destinations.${i}.city`] = 'Cidade obrigatória.';
          messages.push(`Destino ${i + 1}: Cidade é obrigatória.`);
        }
      });
    }
    if (idx === 1) {
      // Step 2 — Essencial (cover photo now required)
      const hasCover = Boolean(coverPhoto?.file || coverPhoto?.existingUrl)
        || (Array.isArray(trip.photos) && trip.photos.length > 0);
      if (!hasCover) {
        e.coverPhoto = 'Adiciona uma foto de capa.';
        messages.push('Adiciona uma foto de capa.');
      }
      if (!trip.title || trip.title.trim().length < 3) {
        e.title = 'Mín. 3 caracteres.';
        messages.push('O nome da viagem é obrigatório (mín. 3 caracteres).');
      }
      if (!trip.tripSummary || trip.tripSummary.trim().length < 10) {
        e.tripSummary = 'Mín. 10 caracteres.';
        messages.push('A descrição curta é obrigatória (mín. 10 caracteres).');
      }
      if (!trip.tripDescription || trip.tripDescription.trim().length < 20) {
        e.tripDescription = 'Mín. 20 caracteres.';
        messages.push('A descrição completa é obrigatória (mín. 20 caracteres).');
      }
      if (!trip.tripRating || trip.tripRating < 1) {
        e.tripRating = 'Escolha entre 1 e 5.';
        messages.push('Escolhe uma avaliação entre 1 e 5 estrelas.');
      }
    }
    if (idx === 2) {
      // Step 3 — Datas e Custos
      // Round 50 — Datas devem ser passadas (início e fim <= hoje),
      // porque o modelo é "viagens que já aconteceram". O user
      // começa com datas vazias e é ele que escolhe.
      if (!trip.startDate) {
        e.startDate = 'Data de início obrigatória.';
        messages.push('Data de início é obrigatória.');
      }
      if (!trip.endDate) {
        e.endDate = 'Data de fim obrigatória.';
        messages.push('Data de fim é obrigatória.');
      }
      if (trip.startDate && trip.endDate && new Date(trip.endDate) < new Date(trip.startDate)) {
        e.endDate = 'Fim não pode ser anterior ao início.';
        messages.push('A data de fim não pode ser anterior à data de início.');
      }
      // As datas têm de ser <= HOJE (o user regista viagens passadas).
      // Comparamos por string YYYY-MM-DD para evitar timezones.
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (trip.startDate && trip.startDate > todayStr) {
        e.startDate = 'Início não pode ser no futuro.';
        messages.push('A data de início não pode ser no futuro (viagens que já aconteceram).');
      }
      if (trip.endDate && trip.endDate > todayStr) {
        e.endDate = 'Fim não pode ser no futuro.';
        messages.push('A data de fim não pode ser no futuro (viagens que já aconteceram).');
      }
      // Round 47+ — O custo total é a SOMA dos 4 items detalhados
      // (Voo + Alojamento + Alimentação + Extras). Aceitamos que
      // o user preencha apenas os items OU o `cost.total`
      // manualmente — desde que pelo menos um dos dois seja > 0.
      const bd = trip.costBreakdown || {};
      const flightV = Number(bd.flight) || 0;
      const accommodationV = Number(bd.accommodation) || 0;
      const foodV = Number(bd.food) || 0;
      const extrasV = Number(bd.extras) || 0;
      const totalFromItems = flightV + accommodationV + foodV + extrasV;
      const totalNum = totalFromItems > 0 ? totalFromItems : (Number(trip.cost?.total) || 0);
      if (totalNum <= 0) {
        e.cost = 'Custo total obrigatório.';
        messages.push('O custo total é obrigatório (mín. 1€) — preenche pelo menos um dos 4 blocos (Voo, Alojamento, Alimentação, Extras).');
      }
      // Multi-destino: o user tem de garantir que o custo por
      // destino faz sentido. Avisamos se o total for 0 mesmo
      // com items detalhados.
      const isMulti = Array.isArray(trip.destinations) && trip.destinations.length > 1;
      if (isMulti && totalNum <= 0) {
        messages.push('Viagem multidestino: confirma o custo total — distribui os custos pelos destinos nas tabs Alojamento / Transportes / Comida.');
      }
    }
    if (idx === 3) {
      // Round 47+ — Step 4 (Experiência) tem 6 sub-tabs. O `subIdx`
      // indica qual estamos a validar. Quando o user clica
      // "Continuar" numa sub-tab intermédia (info, accommodations,
      // foods, transports) só validamos ESSA sub-tab — caso
      // contrário seria impossível avançar para a próxima sem
      // ter tudo preenchido desde a primeira. O `subIdx === 5`
      // (extras) é a última; quando o Continuar é clicado aqui,
      // o `goNext` salta para o Step 5 (Galeria) e a validação
      // completa é feita nesse momento. Aceitamos subIdx
      // indefinido (caso o chamador não passe) como "validar
      // tudo" para retro-compatibilidade.
      const subTabs = ['info', 'accommodations', 'foods', 'transports', 'locais', 'extras'];
      const activeSub = subIdx == null ? null : subTabs[subIdx];
      const isFullCheck = subIdx == null;

      const checkInfo = isFullCheck || activeSub === 'info';
      // Round 51 — accommodations/foods/transports/locais/extras
      // são todos opcionais. Apenas `info` (categorias + línguas)
      // continua obrigatório.

      // Categorias + Línguas (obrigatórias, sub-tab "info")
      if (checkInfo) {
        if (!trip.categories.length) {
          e.categories = 'Selecione pelo menos uma.';
          messages.push('Seleciona pelo menos uma categoria.');
        }
        if (!trip.languagesSpoken.length) {
          e.languagesSpoken = 'Selecione pelo menos uma.';
          messages.push('Seleciona pelo menos uma língua falada.');
        }
      }

      // Round 53 — Alojamento, Alimentação e Transportes são
      // OBRIGATÓRIOS (pelo menos 1 item cada). O user reportou que
      // conseguia criar uma viagem sem preencher a tab Experiência.
      // Locais (pontos de referência) e Extras continuam opcionais.
      const checkAccommodations = isFullCheck || activeSub === 'accommodations';
      const checkFoods = isFullCheck || activeSub === 'foods';
      const checkTransports = isFullCheck || activeSub === 'transports';

      if (checkAccommodations && (!Array.isArray(trip.accommodations) || trip.accommodations.filter((a) => !a.__draft).length === 0)) {
        e.accommodations = 'Adicione pelo menos um alojamento.';
        messages.push('Adiciona pelo menos um alojamento na tab Alojamento.');
      }
      if (checkFoods && (!Array.isArray(trip.recommendedFoods) || trip.recommendedFoods.filter((f) => !f.__draft).length === 0)) {
        e.recommendedFoods = 'Adicione pelo menos uma recomendação de comida.';
        messages.push('Adiciona pelo menos uma recomendação de comida na tab Alimentação.');
      }
      if (checkTransports && (!Array.isArray(trip.tripTransports) || trip.tripTransports.filter((t) => !t.__draft).length === 0)) {
        e.tripTransports = 'Adicione pelo menos um transporte.';
        messages.push('Adiciona pelo menos um transporte na tab Transportes.');
      }

      // V16 — In a multi-destination trip every per-item entry must
      // be tied to a destination so the detail page can group items
      // per city. Single-destination trips are exempt (everything
      // goes to destinationIndex=0 implicitly). We also surface a
      // soft warning for positive/negative points — they default to
      // "general" and that's fine, but the user can pick a city.
      const isMulti = Array.isArray(trip.destinations) && trip.destinations.length > 1;
      if (isMulti) {
        const checkDestOf = (list) => Array.isArray(list) && list.some((it) => !it.__draft
          && (it.destinationIndex == null || it.destinationIndex < 0 || it.destinationIndex >= trip.destinations.length));
        if (checkAccommodations && checkDestOf(trip.accommodations)) {
          messages.push('Viagem multidestino: cada alojamento tem de ter um destino atribuído (tab Alojamento).');
        }
        if (checkFoods && checkDestOf(trip.recommendedFoods)) {
          messages.push('Viagem multidestino: cada comida tem de ter um destino atribuído (tab Alimentação).');
        }
        if (checkTransports && checkDestOf(trip.tripTransports)) {
          messages.push('Viagem multidestino: cada transporte tem de ter um destino atribuído (tab Transportes).');
        }
        if (isFullCheck && checkDestOf(trip.referencePoints)) {
          messages.push('Viagem multidestino: cada ponto de referência tem de ter um destino atribuído (tab Locais).');
        }
        if (isFullCheck && Array.isArray(trip.tripItinerary?.days) && trip.tripItinerary.days.some((d) => !d.__draft
          && (d.destinationIndex == null || d.destinationIndex < 0 || d.destinationIndex >= trip.destinations.length))) {
          messages.push('Viagem multidestino: cada dia do itinerário tem de ter um destino atribuído (tab Locais).');
        }
      }

      // Locais e Extras também são opcionais — sem validação.
    }
    setErrors(e);
    return { valid: Object.keys(e).length === 0, messages };
  };
  // Round 60 — Outer shim. Resolves the trip snapshot once and
  // forwards to the inner validator so we don't shadow the outer
  // `trip` const (which throws a TDZ ReferenceError on the very
  // first call). The override path is for `goNext` to pass the
  // synchronously-promoted trip so the validation sees the items
  // the user just typed. `handleSubmit` doesn't pass anything and
  // gets the closure-captured state as before.
  const validateStep = (idx, subIdx = 0, tripOverride) => {
    const tripForValidation = tripOverride != null ? tripOverride : trip;
    return validateStepInner(idx, subIdx, tripForValidation);
  };

  // Round 53 — Auto-save: promove os drafts (__draft) a itens reais
  // em todas as listas. Assim, quando o user escreve um alojamento/
  // comida/transporte e clica "Continuar" (sem carregar em
  // "Adicionar"), a informação fica guardada.
  //
  // Round 60 — Returns the PROMOTED trip synchronously instead of
  // relying on a `setTrip` updater. The previous version was async
  // (React 18 batches state updates), so `validateStep` (called
  // right after) still saw the drafts and complained that the
  // user hadn't added any items — making the "Continuar" button
  // effectively useless on the experience tabs.
  const promoteDrafts = () => {
    const strip = (list) => (Array.isArray(list) ? list.map((item) => {
      if (item && typeof item === 'object' && item.__draft) {
        const { __draft, ...rest } = item;
        return rest;
      }
      return item;
    }) : list);
    const it = trip.tripItinerary || { days: [] };
    const promoted = {
      ...trip,
      accommodations: strip(trip.accommodations),
      recommendedFoods: strip(trip.recommendedFoods),
      tripTransports: strip(trip.tripTransports),
      referencePoints: strip(trip.referencePoints),
      positivePoints: strip(trip.positivePoints),
      negativePoints: strip(trip.negativePoints),
      tripItinerary: { ...it, days: strip(it.days) },
    };
    setTrip(promoted);
    return promoted;
  };

  const goNext = () => {
    // Round 53/60 — Auto-save: promove os drafts antes de navegar.
    // Round 60 — Use the synchronously-promoted trip so the
    // validation that runs right below sees the items the user
    // just typed (not the stale draft flag).
    const tripForValidation = isExperienceStep ? promoteDrafts() : trip;
    // Step 4 (Experiência) tem 6 sub-tabs. Quando estamos dentro
    // do step 4, só validamos a SUB-TAB ATUAL — o user pode
    // preencher progressivamente (Info → Alojamento →
    // Alimentação → ... → Extras → Step 5).
    //
    // Quando estamos na ÚLTIMA sub-tab (Extras) e o user clica
    // Continuar, validamos a tab 4 INTEIRA (subIdx=null) antes
    // de saltar para o Step 5.
    let valid;
    let messages = [];
    if (isExperienceStep) {
      if (isLastSubTab) {
        // Última sub-tab — valida a tab 4 completa antes de avançar.
        const r = validateStep(stepIndex, null, tripForValidation);
        valid = r.valid; messages = r.messages;
      } else {
        // Sub-tab intermédia — valida só esta sub-tab.
        const r = validateStep(stepIndex, subStepIndex, tripForValidation);
        valid = r.valid; messages = r.messages;
      }
    } else {
      const r = validateStep(stepIndex, null, tripForValidation);
      valid = r.valid; messages = r.messages;
    }
    if (!valid) {
      // Round 46+ — Mostrar cada erro como gm-toast (em vez de
      // uma única mensagem genérica "Campos por preencher").
      messages.forEach((m) => toast.danger(m));
      return;
    }
    // Dentro da tab 4 (Experiência), "Continuar" percorre as
    // 6 sub-tabs. Só salta para o Step 5 quando chegar à última.
    if (isExperienceStep && !isLastSubTab) {
      setSubStepIndex((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    // Reset sub-tab when leaving step 4
    setSubStepIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goBack = () => {
    if (isExperienceStep && subStepIndex > 0) {
      setSubStepIndex((s) => Math.max(s - 1, 0));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
    setSubStepIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goToStep = (i) => {
    if (i <= stepIndex) { setStepIndex(i); setSubStepIndex(0); return; }
    const { valid, messages } = validateStep(stepIndex);
    if (valid) { setStepIndex(i); setSubStepIndex(0); }
    else messages.forEach((m) => toast.danger(m));
  };

  // ── Build payload ───────────────────────────────────────────────────
  const buildCityIds = useCallback(() => {
    const ids = [];
    (Array.isArray(trip.destinations) ? trip.destinations : []).forEach((d) => {
      const list = citiesByCountry[d.country] || [];
      const match = list.find((c) => c.name === d.city || c.cityName === d.city);
      if (match && (match.id || match.cityId)) ids.push(match.id || match.cityId);
      else if (typeof d.city === 'number') ids.push(d.city);
    });
    return ids;
  }, [trip.destinations, citiesByCountry]);

  // Round 46+ — Drafts are gone, so buildPayload no longer takes
  // an `asDraft` flag and the resulting payload always has
  // `isHidden=false`. We keep the function signature compatible
  // with the submit handler by accepting the flag but ignoring it.
  const buildPayload = () => {
    const cityIds = buildCityIds();
    const startDate = trip.startDate; const endDate = trip.endDate;
    let days = null;
    if (startDate && endDate) days = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
    // Calculate total from breakdown. Round 45+ — Voo e Alojamento são
    // AUTO-SOMADOS dos items individuais (tripTransports e accommodations)
    // quando o user NÃO fez override manual. Override fica persistido
    // em costBreakdown._override.{flight,accommodation}.
    //
    // Round 51 — Quando se edita uma viagem, o backend só guarda o
    // `cost.total` (soma). O `costBreakdown` é um input client-side
    // que o user distribui pelos 4 blocos. Se o user editou a viagem
    // mas NÃO tocou nos 4 inputs (costBreakdown ainda vazio), o
    // breakdownTotal é 0 e cairíamos no fallback `trip.cost.total`
    // — mas se o user TIVER tocado num input e o total for > 0
    // devemos respeitar o breakdown. Para evitar perder o total
    // antigo durante a edição, calculamos:
    //   • se breakdownTotal > 0: usar breakdown (user tocou).
    //   • se breakdownTotal === 0 E trip.cost.total > 0: usar o
    //     cost.total guardado (estado original do edit, não foi
    //     tocado). O backend não tem como desdobrar o total nos 4
    //     blocos, por isso preservamos o valor como "extras" no
    //     payload (é o catch-all).
    // Round 52 — Custos são 4 inputs MANUAIS (Voo / Alojamento /
    // Alimentação / Extras). O total é a soma direta dos 4. Não há
    // auto-soma a partir de transports/accommodations (removido na
    // Round 47 porque confundia o user). O backend recebe os 4
    // valores como `transport`, `accommodation`, `food`, `extra`
    // (campos nativos do CostDto) e o `total` como soma.
    //
    // O fix crítico: o `buildPayload` antigo usava `flightAuto =
    // sum(tripTransports[].cost)` como fallback quando o user não
    // tocava no input de Voo — mas o user pode perfeitamente
    // preencher o input de Voo diretamente (que é o design atual)
    // sem ter items em Transportes. Resultado: UI mostrava 4 EUR
    // (1+1+1+1) mas o payload enviava 3 (0+1+1+1) porque
    // `flightAuto` era 0 e o input do user era ignorado.
    const bd = trip.costBreakdown || {};
    const flightEff = Number(bd.flight) || 0;
    const accommodationEff = Number(bd.accommodation) || 0;
    const foodEff = Number(bd.food) || 0;
    const extrasEff = Number(bd.extras) || 0;
    const breakdownTotal = flightEff + accommodationEff + foodEff + extrasEff;
    const storedTotal = Number(trip.cost?.total) || 0;
    const finalTotal = breakdownTotal > 0 ? breakdownTotal : storedTotal;

    // V11 — per-photo captions aligned with the final photos order.
    // The order on the backend after submit is:
    //   [existing photos in trip.photos, new cover (if any), new previews]
    // so the captions array has to be built in that exact order:
    //   • existing photos: cover (i=0) → null (no cover caption field in
    //     the wizard since Round 46+); the rest align with
    //     captions[0..n-2] (the cover takes 0 slots, gallery takes 1..n-1).
    //   • new cover: null.
    //   • new previews: captions[N + i] where N is the number of gallery
    //     photos already saved and i is the index in the new previews.
    const captions = Array.isArray(trip.photoCaptions) ? trip.photoCaptions : [];
    const finalCaptions = [];
    const existingPhotos = Array.isArray(trip.photos) ? trip.photos : [];
    existingPhotos.forEach((_, i) => {
      if (i === 0) finalCaptions.push(null);
      else finalCaptions.push(captions[i - 1] || null);
    });
    if (coverPhoto?.file) {
      finalCaptions.push(null);
    }
    // Index offset for new previews: every existing gallery photo
    // consumes 1 slot in `captions` (the cover caption is null and
    // sits OUTSIDE `captions`, hence existingGalleryCount).
    //
    // Round 63+ — FIX: `nextCaptionIdx` previously added
    // `newCoverCount`, which offset the gallery captions by 1 on a
    // brand-new trip (when a cover file is present): preview[0]
    // picked up `captions[1]` instead of `captions[0]`, so the
    // first gallery photo's association (`[Alojamento: ...]` tag)
    // was silently dropped / attached to the wrong slot.
    // The cover's `null` caption is already in `finalCaptions`
    // via the `if (coverPhoto?.file)` push above — it does NOT
    // consume a slot from `captions`, because `captions` is
    // aligned with the gallery `photoPreviews` only (cover excluded).
    const existingGalleryCount = Math.max(0, existingPhotos.length - 1);
    let nextCaptionIdx = existingGalleryCount;
    if (Array.isArray(photoPreviews)) {
      photoPreviews.forEach((p) => {
        if (p?.file) finalCaptions.push(captions[nextCaptionIdx++] || null);
      });
    }

    // Round 49 — Cover photo bootstrap for NEW trips.
    // The cover photo is a File object (not yet uploaded), so for a
    // brand-new trip `trip.photos` is empty. The backend's createTrip
    // validation requires `photos.length >= 1`, so we inject a
    // placeholder path. The submit handler removes this placeholder
    // right after the real cover (and any gallery photos) are
    // uploaded, so the final photos[] is [cover, gallery1, gallery2, ...]
    // (placeholder at index 0 gets deleted and everything shifts left).
    // The placeholder doesn't have to exist on disk — the backend's
    // safeDeleteFile() catches the IOException silently.
    let photos = Array.isArray(trip.photos) ? trip.photos.slice() : [];
    if (!isEditing && photos.length === 0) {
      photos = ['trip-photos/placeholder.jpg'];
    }

    // Round 50 — The `recommended_food` table has a NOT NULL `city`
    // column, but the wizard's FoodsEditor only tracks `name` +
    // `description` + `destinationIndex` — the city is implicit (the
    // destination the food is bound to). Resolve `city` from the
    // destinationIndex on each food, falling back to the first
    // destination's city, then to the country, and finally to '-'
    // so the INSERT never violates the NOT NULL constraint. This
    // mirrors the wizard's "Comida da viagem" intent (a food is a
    // food of the whole trip, the destinationIndex is just for
    // organisation in the multi-destination editor).
    const dests = Array.isArray(trip.destinations) ? trip.destinations : [];
    const firstDestCity = dests.find((d) => d?.city)?.city || '';
    const firstDestCountry = dests.find((d) => d?.country)?.country || '';
    const fallbackCity = firstDestCity || firstDestCountry || '-';
    // V16 — Resolve the cityId (FK) for each destination index. The
    // wizard stores `citiesByCountry[country] = [{ id, name, ... }]`
    // so we can map a destination's (country, city) pair to its DB
    // id without an extra round-trip. Returns null when not found —
    // the backend falls back to the string `city` field.
    const destCityId = (di) => {
      if (!Array.isArray(dests) || dests.length === 0) return null;
      const dest = dests[Math.min(Math.max(0, Number(di) || 0), dests.length - 1)];
      if (!dest) return null;
      const list = citiesByCountry[dest.country] || [];
      const match = list.find((c) => (c.name || c.cityName) === dest.city);
      return match ? (match.id || match.cityId) : null;
    };
    const recommendedFoods = (Array.isArray(trip.recommendedFoods) ? trip.recommendedFoods : []).map((f) => {
      const dest = dests[Math.min(Math.max(0, Number(f?.destinationIndex) || 0), Math.max(0, dests.length - 1))];
      const city = [dest?.city, dest?.country].filter(Boolean).join(', ') || fallbackCity;
      // V16 — pass cityId when resolvable; the service uses it to set
      // the cityEntity FK on the saved row.
      return { ...f, city, cityId: destCityId(f?.destinationIndex) };
    });

    return {
      userId: user?.id, cities: cityIds, title: trip.title?.trim(), startDate, endDate,
      bookingDate: trip.bookingDate || null, tripDurationDays: days,
      tripSummary: trip.tripSummary?.trim(), tripDescription: trip.tripDescription?.trim(),
      weather: trip.weather || null, tripRating: trip.tripRating || 0,
      // Round 53 — Persiste o breakdown dos 4 custos como JSON no
      // `cost.notes` para que a edição recupere os valores exatos.
      // O schema do backend só tem `notes` como string livre, então
      // usamos um objeto JSON com chave `__gmCostBreakdown`.
      // Round 54 — O backend tem campos nativos `accommodation`,
      // `food`, `transport`, `extra` no `CostDto`. Enviamos cada
      // bloco separadamente (em vez de stringify JSON em `notes`).
      // O `flight` do wizard mapeia para `transport` no backend.
      cost: {
        total: finalTotal,
        currency: trip.cost?.currency || 'EUR',
        transport: Number(bd.flight) || 0,
        accommodation: Number(bd.accommodation) || 0,
        food: Number(bd.food) || 0,
        extra: Number(bd.extras) || 0,
      },
      categories: trip.categories, languagesSpoken: trip.languagesSpoken,
      tripPrivacy: trip.privacy?.toUpperCase() || 'PUBLIC', isHidden: false,
      // Round 50 — Filter `__draft: true` items out of every list
      // before sending to the backend. Drafts are an autosaver UX
      // trick (the user types → draft persists → "Continuar" /
      // "Adicionar" promotes it) but the API contract expects real
      // entries only. Negatives/Pospoints/Itinerary follow the same
      // pattern (filter on the way out).
      // Round 52 — O schema `accommodation.city` é NOT NULL no
      // backend. O user removeu o campo visual "Cidade" do form na
      // Round 51 (a cidade agora vem dos Destinos via
      // `destinationIndex`), mas o AccommodationDto continua a
      // esperar `city` no payload. Injetamos o `city` a partir do
      // destino (com fallback para a primeira cidade, depois
      // country, e finalmente '-' para nunca enviar null). Se o
      // entry já traz um `city` (preservado do edit-load), usamos
      // esse — é a fonte mais fiel ao que estava gravado.
      // O input visual continua sem campo "Cidade" — a injeção
      // acontece só no momento do submit, invisível para o user.
      // Round 59+ — Treat `a.city === null` as missing, otherwise
      // `String(null).trim()` returns "null" (truthy) and we'd send
      // the literal string "null" to the backend. Same fix for the
      // referencePoints map below.
      accommodations: (Array.isArray(trip.accommodations) ? trip.accommodations : []).filter((a) => !a.__draft).map((a) => {
        const di = Math.min(Math.max(0, Number(a?.destinationIndex) || 0), Math.max(0, dests.length - 1));
        const dest = dests[di];
        const cityFromDest = [dest?.city, dest?.country].filter(Boolean).join(', ') || fallbackCity;
        const city = (a?.city != null && String(a.city).trim()) || cityFromDest;
        // Round 64 — O backend usa os campos CANÓNICOS do
        // AccommodationDto: accommodationTypeId, accommodationBoardId,
        // nrNights, checkIn, checkOut. O wizard usa nomes "curtos"
        // (type, regime, nights, checkInDate, checkOutDate). Sem este
        // mapeamento o Jackson ignora os campos como unknown (com
        // FAIL_ON_UNKNOWN_PROPERTIES desativado) e o backend grava
        // defaults — tipo errado, 0 noites, datas nulas.
        return {
          ...a,
          city,
          // V16 — pass the cityId FK so the backend can group this
          // accommodation under its destination in the detail page.
          cityId: a.cityId ?? destCityId(a?.destinationIndex) ?? null,
          accommodationTypeId: a.accommodationTypeId || a.type || null,
          accommodationBoardId: a.accommodationBoardId || a.regime || null,
          nrNights: Number(a.nrNights ?? a.nights ?? 0) || 0,
          checkIn: a.checkIn || a.checkInDate || null,
          checkOut: a.checkOut || a.checkOutDate || null,
          price: Number(a.price) || 0,
        };
      }),
      recommendedFoods: (Array.isArray(recommendedFoods) ? recommendedFoods : []).filter((f) => !f.__draft),
      // V16 — attach the cityId FK to each transport so the backend
      // can group it under its destination. Same destCityId helper
      // used by accommodation/food/refpoint above.
      tripTransports: (Array.isArray(trip.tripTransports) ? trip.tripTransports : []).filter((t) => !t.__draft).map((t) => ({
        ...t,
        cityId: t.cityId ?? destCityId(t?.destinationIndex) ?? null,
      })),
      // Round 59+ — `trip_reference_point.city` is NOT NULL on the
      // backend. The wizard's reference point form has no city
      // field (the user enters name/description/type/link), so we
      // inject the city from the destination the point is bound to,
      // falling back to the trip's first destination / country, then
      // '-' so the INSERT never violates the constraint. Same
      // pattern as the accommodations map above.
      referencePoints: (Array.isArray(trip.referencePoints) ? trip.referencePoints : []).filter((r) => !r.__draft).map((r) => {
        const di = Math.min(Math.max(0, Number(r?.destinationIndex) || 0), Math.max(0, dests.length - 1));
        const dest = dests[di];
        const cityFromDest = [dest?.city, dest?.country].filter(Boolean).join(', ') || fallbackCity;
        const city = (r?.city != null && String(r.city).trim()) || cityFromDest;
        // Round 64 — O TripReferencePointDto do backend espera `photos`
        // (não `photoUrls`). O edit-load pré-enche `photoUrls` para o
        // wizard, mas o payload tem de enviar o campo canónico `photos`
        // para que as fotos dos pontos de referência não se percam.
        return { ...r, city, cityId: r.cityId ?? destCityId(r?.destinationIndex) ?? null, photos: Array.isArray(r.photos) && r.photos.length ? r.photos : (Array.isArray(r.photoUrls) ? r.photoUrls : []) };
      }),
      tripItinerary: (() => {
        const it = trip.tripItinerary || { days: [] };
        // Round 59+ — strip wizard-only flags (`__draft`,
        // `__autoGenerated`) before sending to the backend so the
        // DTO doesn't carry internal client state. Also deduplicate
        // by day number so the backend never receives the same day
        // twice (defence in depth in case the user manages to push
        // a duplicate through the UI).
        // V16 — propagate the per-day `cityId` so the backend can
        // group days under their destination on the detail page.
        const seen = new Set();
        const days = (Array.isArray(it.days) ? it.days : [])
          .filter((d) => !d.__draft)
          .map((d) => {
            const { __draft, __autoGenerated, ...rest } = d;
            return {
              ...rest,
              cityId: rest.cityId ?? destCityId(rest?.destinationIndex) ?? null,
            };
          })
          .filter((d) => {
            const k = String(d.day);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        return { ...it, days };
      })(),
      positivePoints: (Array.isArray(trip.positivePoints) ? trip.positivePoints : []).filter((p) => !p.__draft).map((p) => ({
        ...p,
        cityId: p.cityId ?? destCityId(p?.destinationIndex) ?? null,
      })),
      negativePoints: (Array.isArray(trip.negativePoints) ? trip.negativePoints : []).filter((p) => !p.__draft).map((p) => ({
        ...p,
        cityId: p.cityId ?? destCityId(p?.destinationIndex) ?? null,
      })),
      photos, videos: trip.videos,
      photoCaptions: finalCaptions,
    };
  };

  // ── Cover photo upload ────────────────────────────────────────────────
  const coverInputRef = useRef(null);
  const handleCoverPhoto = (files) => {
    if (!files || !files.length) return;
    const f = files[0];
    setCoverPhoto((prev) => ({
      file: f,
      url: URL.createObjectURL(f),
      // Round 64 — Preserva a referência à capa anterior (se era um
      // ficheiro já enviado) para que o submit consiga remover o
      // path antigo do backend ao substituir a capa na edição.
      // Sem esta referência, trocar a capa num edit deixava a capa
      // antiga como destaque (a nova era adicionada ao fim da lista).
      previousPath: prev && prev.existing ? prev.path : null,
    }));
  };
  // Remove the cover photo. If it was an existing (already-uploaded)
  // photo, we also drop it from `trip.photos` so the backend doesn't
  // keep the dangling path on save.
  // Round 50 — Same fix as removePhoto: setTrip outside the
  // setCoverPhoto updater to avoid the React 18 batched-state bug.
  const removeCoverPhoto = () => {
    const c = coverPhoto;
    setCoverPhoto(null);
    if (c?.existing && c?.path) {
      setTrip((t) => ({ ...t, photos: (t.photos || []).filter((p) => p !== c.path) }));
    }
  };

  // ── Photo upload (general) ──────────────────────────────────────────
  const photoInputRef = useRef(null);
  const handlePhotos = (files) => {
    if (!files || !files.length) return;
    setPhotoPreviews((p) => [...p, ...Array.from(files).map((f) => ({ name: f.name, url: URL.createObjectURL(f), file: f }))]);
  };
  // Remove a photo from the gallery. Existing photos are also
  // dropped from `trip.photos` so the backend stops tracking them.
  // Round 50 — The setTrip call is now OUTSIDE the setPhotoPreviews
  // updater (React 18 may batch them and we can't rely on a
  // side-effect inside another updater to read the latest state).
  const removePhoto = (idx) => {
    // Read the latest preview list from the ref to find the
    // target. We avoid stale state by closing over the current
    // value rather than the React snapshot.
    const target = photoPreviews[idx];
    setPhotoPreviews((p) => p.filter((_, i) => i !== idx));
    if (target?.existing && target?.path) {
      setTrip((t) => ({ ...t, photos: (t.photos || []).filter((path) => path !== target.path) }));
    }
  };

  const uploadSingleFile = async (tripId, file, caption) => {
    if (!file || !tripId) return null;
    try {
      // Trip-photo uploads go through the per-trip media endpoint,
      // which lives at POST /trips/{id}/media/photos. The response
      // shape is { fileUrl, publicUrl, ... } (see TripMediaController).
      //
      // Round 62 — Pass the per-photo `caption` so the backend can
      // persist it in the same transaction as the file. For the
      // cover, the caption is always null (the wizard never has a
      // cover-caption field). For gallery photos, the caption is
      // the entry in `trip.photoCaptions` aligned with the photo's
      // index in the gallery (the cover takes index 0 in the
      // gallery view, so the cover file has no caption slot; the
      // first gallery photo lives at originalIdx 0, which maps to
      // `photoCaptions[0]`).
      const extra = caption != null && String(caption).trim()
        ? { caption: String(caption) }
        : null;
      const r = await uploadFile(`/trips/${tripId}/media/photos`, file, undefined, extra);
      return r?.data?.fileUrl || r?.data?.path || r?.data || null;
    } catch { return null; }
  };

  // ── Submit ───────────────────────────────────────────────────────────
  // Round 46+ — Drafts + autosave are gone. Every submit is either a
  // brand-new trip (POST /trips) or an edit (PUT /trips/{id}). Required
  // fields are validated up-front; on success we navigate to the
  // public trip page.
  const handleSubmit = async ({ silent = false } = {}) => {
    // Round 50 — Validation is now step-by-step, not all-up-front.
    // We start at the current step and walk forward through STEPS
    // (except the review step) until we find a valid one or hit
    // the end. The first invalid step becomes the active step
    // and only ITS error messages are shown — so the user isn't
    // overwhelmed by every missing field across all tabs at once.
    const publishableIdx = STEPS.length - 1; // last step is the review, never validated
    for (let i = 0; i < publishableIdx; i++) {
      // Round 63+ — FIX: `validateStep(i)` defaults subIdx to 0
      // (sub-tab "info"), so Alojamento / Alimentação / Transportes
      // were NEVER validated when publishing. The user could create
      // a trip without filling any of them. We now pass `null` for
      // the experience step (index 3) so the FULL step is validated
      // (isFullCheck=true) — making accommodations, foods and
      // transports required. The `goNext` path already does this
      // when leaving the last sub-tab, but the topbar/global
      // "Publicar Viagem" button skipped it.
      const { valid, messages } = validateStep(i, i === 3 ? null : 0);
      if (!valid) {
        setStepIndex(i);
        if (i === 3) setSubStepIndex(0); // start at the first sub-tab of Experiência
        // Show at most 4 messages to avoid toast-spam; the rest are
        // summarised in one final line.
        const head = messages.slice(0, 4);
        head.forEach((m) => toast.danger(m));
        if (messages.length > 4) {
          toast.danger(`+${messages.length - 4} outros campos por preencher neste passo.`);
        }
        return;
      }
    }
    setSubmitting(true);
    try {
      // Round 50 — In edit mode, capture the photos that were
      // already on the trip BEFORE the user removed any. After
      // the PUT we compare against the final list and DELETE
      // every path that's no longer present, so the disk
      // actually mirrors the new photos list. (Without this the
      // "remove photo" button on edit just hid the thumbnail but
      // left the file on disk forever.)
      // Round 63+ — FIX: use the photo list captured during edit-load
      // (`photosBeforeEditRef`), NOT `trip.photos` at submit time.
      // The user may have already removed photos from the UI, so
      // `trip.photos` no longer contains the removed paths and the
      // DELETE cleanup below would never find them.
      const photosBeforeEdit = isEditing
        ? (photosBeforeEditRef.current || []).slice()
        : [];
      // Round 64 — Guarda o path da nova capa pré-carregada no EDIT.
      // O upload da capa nova acontece ANTES do PUT (ver abaixo) para
      // que o path fique na posição 0 do payload.photos — o backend
      // usa o primeiro path como capa. Esta flag evita que o mesmo
      // ficheiro seja enviado uma segunda vez no loop de uploads.
      let coverUploaded = null;

      // Strip File objects out of the payload before sending it to
      // the JSON endpoint. Files need to be uploaded separately,
      // AFTER the trip is created/updated, via the per-trip media
      // endpoint (POST /trips/{id}/media/photos) — the trip payload
      // itself only carries string paths.
      const payload = buildPayload();
      payload.photos = Array.isArray(payload.photos) ? payload.photos.filter((p) => typeof p === 'string') : [];
      payload.videos = Array.isArray(payload.videos) ? payload.videos.filter((v) => typeof v === 'string') : [];

      let r;
      // Round 89 — CRITICAL FIX: o trip POST/PUT foi removido por
      // engano em alguma refactor recente. O `r` ficava `undefined`,
      // o `tripId` resolvia para `editId` (que para viagens novas é
      // null), toda a lógica de upload de fotos + cleanup saltava, e
      // o navigate ia para `/travel/null`. Mas o toast.success
      // "Viagem publicada!" aparecia na mesma porque está depois do
      // navigate. Resultado: o user via "Viagem publicada!" mas
      // a viagem não existia em lado nenhum — nem no admin, nem no
      // perfil, nem na BD.
      //
      // Re-introduzimos o round-trip com o backend:
      //   - POST /trips (viagem nova) → devolve { id, ...trip }
      //   - PUT  /trips/{editId} (edição) → devolve { id, ...trip }
      //
      // O `r.data` é usado em baixo para extrair o `tripId` real
      // (e propagar via `dispatchTripsChanged`).
      if (isEditing) {
        r = await request('PUT', `/trips/${editId}`, payload);
      } else {
        r = await request('POST', '/trips', payload);
      }
      // Round 64 — Edit: quando o user escolhe uma NOVA capa, fazemos
      // upload dela ANTES do PUT para que o path fique na posição 0 do
      // payload.photos. Sem isto, a nova capa era enviada pelo POST
      // /media/photos (depois do PUT) e adicionada ao FIM da lista,
      // mantendo a capa antiga como destaque. O path antigo é retirado
      // do payload, pelo que o cleanup de fotos removidas (photosBeforeEdit)
      // executa o DELETE do ficheiro antigo no backend.
      if (isEditing && coverPhoto?.file) {
        const oldCoverPath = coverPhoto?.previousPath || (coverPhoto?.existing ? coverPhoto.path : null);
        const preCover = await uploadSingleFile(editId, coverPhoto.file, null);
        if (preCover) {
          coverUploaded = preCover;
          payload.photos = (payload.photos || []).filter((p) => p !== oldCoverPath);
          payload.photos.unshift(preCover);
          // Re-sincroniza `photoCaptions` com a nova ordem de
          // `payload.photos` (capa nova na posição 0 sem caption).
          // Sem isto, um EDIT que troca a capa teria uma entrada
          // extra em `photoCaptions` a mais do que `photos`, e o
          // backend (que faz zip por índice) poderia associar a
          // caption errada à foto errada quando há fotos novas.
          const oldCaptions = Array.isArray(payload.photoCaptions) ? payload.photoCaptions : [];
          payload.photoCaptions = Array.from({ length: payload.photos.length }, (_, i) => {
            if (i === 0) return null; // nova capa
            return oldCaptions[i] || null;
          });
        }
      }
      // Round 85 — Show a "A publicar…" toast BEFORE the POST that
      // stays up while the trip record is being saved AND the photos
      // are being uploaded. We then close it inside the `finally`
      // below (success → toast.success with the new trip's link,
      // error → toast.danger which already exists). The previous
      // version fired `toast.success('Viagem publicada!')` the instant
      // the trip POST returned, but the wizard was still uploading
      // photos + deleting the placeholder + cleaning removed photos.
      // The user thought the trip was live (it was, but with the
      // placeholder cover) and then saw weird intermediate states.
      const publishToast = silent ? null : toast.loading(
        isEditing ? 'A atualizar viagem…' : 'A publicar viagem…'
      );
      // Round 49 — Sinaliza a todos os componentes abertos (ex:
      // /profile/:username na outra aba) que a contagem de viagens
      // mudou. Sem este evento, mudar a privacidade de uma viagem
      // não atualizava o contador "Viagens" do perfil sem reload.
      // O `reason` ajuda debugging e o `ownerUsername` permite
      // filtros selectivos nos listeners.
      dispatchTripsChanged({
        reason: isEditing ? 'updated' : 'created',
        ownerUsername: user?.username,
        tripId: Number(r?.data?.id || editId) || null,
      });
      // Clear the localStorage draft now that the backend owns the
      // canonical state. We only clear for new trips — when editing
      // the local draft is irrelevant because the LS key is keyed by
      // user, not by tripId, and re-using it would clobber a fresh
      // draft the user might be writing right now.
      if (!isEditing) {
        try { window.localStorage.removeItem(DRAFT_KEY); } catch (_) { /* ignore */ }
      }
      const tripId = r?.data?.id || editId;

      // Upload photos AFTER the trip exists. We send the cover
      // photo first so it becomes the primary photo (first entry
      // in trip.photos), then the rest in their original order.
      // Round 62 — We pass each photo's caption (cover = null;
      // gallery[i] = `photoCaptions[i]`) so the backend persists the
      // caption in the same transaction as the upload. Without this,
      // a brand-new trip would lose every caption because the POST
      // /trips only carries the placeholder photo path while the
      // real files are uploaded afterwards (and the backend's
      // `uploadTripPhoto` started each new photo with a null
      // caption). For the EDIT flow, the captions also travel with
      // the file so any newly-added photo (the wizard's "Adicionar
      // fotos" button) keeps its caption even though the edit
      // itself does the clear() + addAll on the photo collection.
      if (tripId) {
        const newPhotoPaths = [];
        // Live read of the captions so we get the latest user input
        // (the closure-captured `trip.photoCaptions` can be stale by
        // the time the uploads fire if the user typed in the
        // gallery inputs in the meantime).
        const liveCaptions = Array.isArray(trip.photoCaptions) ? trip.photoCaptions : [];
        if (coverPhoto?.file && !coverUploaded) {
          // Cover photo never carries a caption in the wizard —
          // the cover description was removed in Round 46. Round 64 —
          // se a capa já foi pré-carregada no EDIT (antes do PUT),
          // não voltamos a enviá-la aqui.
          const path = await uploadSingleFile(tripId, coverPhoto.file, null);
          if (path) newPhotoPaths.push(path);
        }
        for (let i = 0; i < (Array.isArray(photoPreviews) ? photoPreviews.length : 0); i++) {
          const p = photoPreviews[i];
          if (p?.file) {
            // `photoPreviews[i]` corresponds to `photoCaptions[i]`
            // (the gallery view does NOT prepend the cover here —
            // `coverPhoto` is the cover, `photoPreviews` only holds
            // the gallery items in display order). The
            // `parsePhotoCaption` helper re-hydrates the dropdown
            // from this same slot on edit-load.
            const caption = liveCaptions[i] || '';
            const path = await uploadSingleFile(tripId, p.file, caption);
            if (path) newPhotoPaths.push(path);
          }
        }
        if (newPhotoPaths.length && !silent) {
          toast.success(`${newPhotoPaths.length} foto(s) carregada(s).`);
        }

        // Round 49 — Remove the bootstrap placeholder we injected for
        // NEW trips (see buildPayload). The real cover and gallery
        // photos have been uploaded by now, so the trip.photos list
        // looks like [placeholder, cover, gallery1, gallery2, ...].
        // Deleting the placeholder shifts everything left, leaving
        // [cover, gallery1, gallery2, ...] — cover at index 0.
        // We only do this when we actually uploaded at least one new
        // photo (the cover file), so a metadata-only publish doesn't
        // accidentally wipe the placeholder without replacing it.
        if (!isEditing && coverPhoto?.file) {
          try {
            await request('DELETE', `/trips/${tripId}/media/photos?path=trip-photos/placeholder.jpg`);
          } catch (_) {
            // safeDeleteFile() on the backend already swallows the
            // "file not on disk" error; we just defensive-catch the
            // HTTP path in case the placeholder path is missing in
            // photos[] for any reason (shouldn't happen, but be safe).
          }
        }

        // Round 50 — Edit mode photo cleanup. If the user removed
        // any photos in this edit, the final payload.photos no
        // longer contains them, so we DELETE each one from the
        // backend. This keeps the on-disk file count in sync with
        // the trip.photos list.
        if (isEditing && photosBeforeEdit.length) {
          const finalPhotos = Array.isArray(payload.photos) ? payload.photos : [];
          const removed = photosBeforeEdit.filter((p) => !finalPhotos.includes(p));
          for (const path of removed) {
            try {
              await request('DELETE', `/trips/${tripId}/media/photos?path=${encodeURIComponent(path)}`);
            } catch (_) { /* safeDeleteFile swallows IO; ignore */ }
          }
        }
      }

      // Round 46+ — Navigation: explicit publish always goes to the
      // public trip page so the user sees what they just published.
      // The `silent` flag is kept for any future internal callers
      // (e.g. step-navigation during edit) but the wizard itself
      // never passes it.
      if (silent) {
        // No-op: keep the user in the wizard.
      } else {
        if (tripId) navigate(`/travel/${tripId}`); else navigate('/my-travels');
      }

      // Round 85 — Close the loading toast and show the success
      // message ONLY now, after every photo upload, placeholder
      // cleanup, and removed-photo DELETE has finished. The user
      // now sees "Viagem publicada!" right when the trip is
      // actually live in all its glory.
      if (publishToast) {
        toast.dismiss(publishToast);
        toast.success(isEditing ? 'Viagem atualizada!' : 'Viagem publicada!');
      }
    } catch (e) {
      if (publishToast) toast.dismiss(publishToast);
      toast.danger(e?.response?.data?.message || e?.message || 'Erro ao publicar.');
    } finally { setSubmitting(false); }
  };

  // ── STEP TITLES ──────────────────────────────────────────────────────
  // Order matches STEPS: where → essentials → when → experience →
  //   gallery → review (Round 43 — Galeria promoted to its own step)
  const STEP_TITLES = ['Destinos', 'O essencial', 'Datas e custos', 'A experiência', 'Galeria', 'Rever e publicar'];
  const STEP_SUBS = [
    'Para onde foste? Adiciona um ou mais países e cidades.',
    'Dá identidade à viagem: capa, nome, descrição e avaliação.',
    'Quando aconteceu e quanto gastaste. Detalha voo, alojamento, comida e extras.',
    'Categorias, línguas, alojamento, alimentação, transporte, itinerário, extras.',
    'Adiciona as tuas fotografias e descreve cada uma com uma legenda.',
    'Tudo pronto? Revê a pré-visualização e publica.',
  ];

  return (
    <div className="gm-wiz">
      {/* ── Top bar ────────────────────────────────────── */}
      <header className="gm-wiz__topbar">
        <button type="button" className="gm-wiz__topbar-back" onClick={() => navigate('/my-travels')} aria-label="Voltar">
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
        <div className="gm-wiz__topbar-info">
          <div className="gm-wiz__topbar-eyebrow">
            {isEditing ? 'A editar viagem' : `Passo ${stepIndex + 1} de ${STEPS.length}`}
          </div>
          <h1 className="gm-wiz__topbar-title">{STEP_TITLES[stepIndex]}</h1>
        </div>
        {/* Round 46+ — Só existe UM botão de submit: "Publicar Viagem"
            (em modo de criação) ou "Atualizar Viagem" (em modo de
            edição). O rascunho foi removido. O label muda com base
            em `isEditing`. O footbar fica SÓ com Anterior/Continuar. */}
        <div className="gm-wiz__topbar-actions">
          <button
            type="button"
            className="gm-wiz__topbar-publish"
            onClick={() => handleSubmit()}
            disabled={submitting || uploading}
            aria-label={isEditing ? 'Atualizar viagem' : 'Publicar viagem'}
            title={isEditing ? 'Atualizar viagem' : 'Publicar viagem'}
          >
            {submitting || uploading
              ? <Loader2 size={15} className="gm-wiz__topbar-publish-spin" />
              : <Check size={15} strokeWidth={2.4} />}
            <span>{isEditing ? 'Atualizar Viagem' : 'Publicar Viagem'}</span>
          </button>
        </div>
      </header>

      {/* ── Progress bar ───────────────────────────────── */}
      <div className="gm-wiz__progress" role="tablist" aria-label="Progresso">
        {STEPS.map((s, i) => {
          const isDone = i < stepIndex;
          const isActive = i === stepIndex;
          return (
            <button key={s.id} type="button" role="tab" aria-selected={isActive}
              className={`gm-wiz__progress-step ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
              onClick={() => goToStep(i)} title={STEP_TITLES[i]}>
              <span className="gm-wiz__progress-dot" style={{ background: isActive || isDone ? s.color : undefined, borderColor: isActive || isDone ? s.color : undefined }}>
                {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <span className="gm-wiz__progress-label">{STEP_TITLES[i]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Step content ───────────────────────────────── */}
      <main className="gm-wiz__main">
        <div className="gm-wiz__container">
          <AnimatePresence mode="wait">
            <motion.section key={step.id} className="gm-wiz__card"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <header className="gm-wiz__card-head">
                <span className="gm-wiz__card-icon" style={{ background: `${step.color}15`, color: step.color }}>
                  <step.icon size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="gm-wiz__card-title">{STEP_TITLES[stepIndex]}</h2>
                  <p className="gm-wiz__card-sub">{STEP_SUBS[stepIndex]}</p>
                </div>
              </header>
              <div className="gm-wiz__card-body">
                {step.id === 'essentials' && <StepEssentials trip={trip} setField={setField} errors={errors} coverPhoto={coverPhoto} coverInputRef={coverInputRef} handleCoverPhoto={handleCoverPhoto} removeCoverPhoto={removeCoverPhoto} />}
                {step.id === 'where' && <StepWhere trip={trip} setField={setField} addDestination={addDestination} removeDestination={removeDestination} countries={countries} citiesByCountry={citiesByCountry} errors={errors} />}
                {step.id === 'when' && <StepWhen trip={trip} setField={setField} errors={errors} />}
                {step.id === 'experience' && (
                  <StepExperience trip={trip} setField={setField} toggleInList={toggleInList}
                    categories={categories} languages={languages}
                    accommodationTypes={accommodationTypes} accommodationBoards={accommodationBoards}
                    transports={transports}
                    subStepIndex={subStepIndex} setSubStepIndex={setSubStepIndex}
                    errors={errors} loading={loadingCatalog} />
                )}
                {step.id === 'gallery' && (
                  <StepGallery trip={trip} setField={setField}
                    photoPreviews={photoPreviews}
                    coverPhoto={coverPhoto}
                    photoInputRef={photoInputRef} handlePhotos={handlePhotos} removePhoto={removePhoto}
                    photoAssociations={photoAssociations} setPhotoAssociations={setPhotoAssociations} />
                )}
                {step.id === 'review' && (
                  <StepReview trip={trip} categories={categories} languages={languages}
                    photoPreviews={photoPreviews} coverPhoto={coverPhoto}
                    accommodationTypes={accommodationTypes} accommodationBoards={accommodationBoards}
                    setField={setField} errors={errors}
                    onEditStep={(i) => setStepIndex(i)} />
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Bottom action bar ─────────────────────────── */}
      {/* Round 45+ — Footbar com 2 modos:
            • Steps intermédios: Anterior / Continuar (navegação).
            • Último step (Rever e publicar): Anterior + Publicar Viagem /
              Atualizar Viagem (submete). Os botões do topbar continuam
              sempre disponíveis em qualquer step. */}
      <footer className="gm-wiz__footbar">
        <div className="gm-wiz__footbar-inner">
          <button type="button" className="gm-wiz__btn gm-wiz__btn--ghost" onClick={goBack} disabled={isFirst}>
            <ChevronLeft size={16} strokeWidth={2.2} /><span>Anterior</span>
          </button>
          <div className="gm-wiz__footbar-progress" aria-hidden="true">
            <div className="gm-wiz__footbar-progress-fill" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
          </div>
          {isLast ? (
            <button
              type="button"
              className="gm-wiz__btn gm-wiz__btn--primary gm-wiz__footbar-publish"
              onClick={() => handleSubmit()}
              disabled={submitting || uploading}
            >
              {submitting || uploading
                ? <Loader2 size={16} className="gm-wiz__topbar-publish-spin" />
                : <Check size={16} strokeWidth={2.4} />}
              <span>{isEditing ? 'Atualizar Viagem' : 'Publicar Viagem'}</span>
            </button>
          ) : (
            <button type="button" className="gm-wiz__btn gm-wiz__btn--primary" onClick={goNext}>
              <span>Continuar</span><ArrowRight size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

// =============================================================================
// Sheet — bottom sheet on mobile, side drawer on desktop.
// Used by all sub-editors in the Experience step.
// =============================================================================
function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="gm-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="gm-sheet__backdrop" onClick={onClose} />
      <div className="gm-sheet__panel">
        <header className="gm-sheet__head">
          <h3 className="gm-sheet__title">{title}</h3>
          <button type="button" className="gm-sheet__close" onClick={onClose} aria-label="Fechar">
            <X size={18} strokeWidth={2.2} />
          </button>
        </header>
        <div className="gm-sheet__body">{children}</div>
      </div>
    </div>
  );
}

// =============================================================================
// useMediaQuery — small helper for responsive Sheet/Drawer switching.
// Returns true when the viewport is at or below the breakpoint (mobile).
// We SSR-safely default to `true` (mobile-first) so the first paint
// matches the mobile layout on server-render or before hydration.
// =============================================================================
function useMediaQuery(query) {
  const [matches, setMatches] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    // Safari < 14 fallback
    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, [query]);
  return matches;
}

// =============================================================================
// InlineEditor — the wizard's editing pattern.
//   • Mobile  → renders as the existing bottom `Sheet`.
//   • Desktop → renders as the new right-side `Drawer`.
// Picking between the two keeps the wizard's "never leave the flow"
// promise while giving the user a comfortable editing surface on each
// device. Accepts the same `open` / `onClose` / `title` / `children`
// contract as the original Sheet so call sites are drop-in.
// =============================================================================
function InlineEditor({ open, onClose, title, subtitle, children }) {
  const isMobile = useMediaQuery('(max-width: 720px)');
  if (isMobile) {
    return <Sheet open={open} onClose={onClose} title={title}>{children}</Sheet>;
  }
  return <Drawer open={open} onClose={onClose} title={title} subtitle={subtitle}>{children}</Drawer>;
}

// =============================================================================
// ExperienceCard — visual card representing a section. Shows the current state
// (count, summary line) and an "Editar" button that opens the Sheet.
// Used by the Experience step to keep each section compact.
// =============================================================================
function ExperienceCard({ icon: Icon, title, summary, count, onEdit, accent = '#007BFF' }) {
  return (
    <div className="gm-expcard">
      <span className="gm-expcard__icon" style={{ background: `${accent}15`, color: accent }}>
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <div className="gm-expcard__body">
        <div className="gm-expcard__head">
          <h4 className="gm-expcard__title">{title}</h4>
          {typeof count === 'number' && count > 0 && (
            <span className="gm-expcard__badge">{count}</span>
          )}
        </div>
        {summary && <p className="gm-expcard__summary">{summary}</p>}
      </div>
      <button type="button" className="gm-expcard__edit" onClick={onEdit}>
        <FileText size={14} strokeWidth={1.8} /><span>{count > 0 ? 'Editar' : 'Adicionar'}</span>
      </button>
    </div>
  );
}

// =============================================================================
// STEP 2 — Essentials (capa grande, drag&drop, campos bem espaçados)
// =============================================================================
function StepEssentials({ trip, setField, errors, coverPhoto, coverInputRef, handleCoverPhoto, removeCoverPhoto }) {
  const [dragOver, setDragOver] = useState(false);
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer?.files?.length) handleCoverPhoto(e.dataTransfer.files);
  };
  return (
    <div className="gm-wiz__essentials">
      {/* Cover photo — drag&drop grande, ocupa o ecrã inteiro no mobile */}
      <div
        className={`gm-wiz__cover ${dragOver ? 'is-dragover' : ''} ${errors.coverPhoto ? 'has-error' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {coverPhoto?.url ? (
          <div className="gm-wiz__cover-preview">
            <img src={coverPhoto.url} alt="Capa" />
            <button type="button" className="gm-wiz__cover-remove" onClick={removeCoverPhoto} aria-label="Remover foto de capa">
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>
        ) : (
          <button type="button" className="gm-wiz__cover-placeholder" onClick={() => coverInputRef.current?.click()}>
            <Camera size={32} strokeWidth={1.6} />
            <strong>Foto de capa</strong>
            <span className="gm-wiz__cover-hint">Arrasta uma imagem ou clica para escolher</span>
          </button>
        )}
        <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(e) => handleCoverPhoto(e.target.files)} />
      </div>
      {errors.coverPhoto && <div className="gm-wiz__hint--error" style={{ marginTop: 8 }}>{errors.coverPhoto}</div>}

      <div className="gm-wiz__field">
        <label className="gm-wiz__label" htmlFor="wiz-title">Nome da viagem <span className="gm-wiz__required">*</span></label>
        <input id="wiz-title" type="text" className={`gm-wiz__input ${errors.title ? 'has-error' : ''}`}
          value={trip.title} onChange={(e) => setField('title', e.target.value)} maxLength={200}
          placeholder="Ex.: Lisboa ao Porto em 6 dias" />
        <div className="gm-wiz__hint"><span>{errors.title || 'Um título curto e memorável.'}</span><span className="gm-wiz__counter">{trip.title.length}/200</span></div>
      </div>
      <div className="gm-wiz__field">
        <label className="gm-wiz__label" htmlFor="wiz-summary">Descrição curta <span className="gm-wiz__required">*</span></label>
        <input id="wiz-summary" type="text" className={`gm-wiz__input ${errors.tripSummary ? 'has-error' : ''}`}
          value={trip.tripSummary} onChange={(e) => setField('tripSummary', e.target.value)} maxLength={500}
          placeholder="Ex.: Uma roadtrip costeira com paragens em Sintra, Ericeira e Peniche." />
        <div className="gm-wiz__hint"><span>{errors.tripSummary || 'Aparece nos cards do feed.'}</span><span className="gm-wiz__counter">{trip.tripSummary.length}/500</span></div>
      </div>
      <div className="gm-wiz__field">
        <label className="gm-wiz__label" htmlFor="wiz-description">Descrição completa <span className="gm-wiz__required">*</span></label>
        <textarea id="wiz-description" rows={8} className={`gm-wiz__textarea ${errors.tripDescription ? 'has-error' : ''}`}
          value={trip.tripDescription} onChange={(e) => setField('tripDescription', e.target.value)} maxLength={5000}
          placeholder="Conte a história da viagem. Quanto mais detalhe, mais útil para a comunidade." />
        <div className="gm-wiz__hint"><span>{errors.tripDescription || 'Mín. 20 caracteres.'}</span><span className="gm-wiz__counter">{trip.tripDescription.length}/5000</span></div>
      </div>
      <div className="gm-wiz__field">
        <label className="gm-wiz__label">Avaliação <span className="gm-wiz__required">*</span></label>
        <div className="gm-wiz__stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className="gm-wiz__star" onClick={() => setField('tripRating', n)} aria-label={`${n} estrelas`}>
              <Star size={32} strokeWidth={1.5} fill={(trip.tripRating || 0) >= n ? 'currentColor' : 'none'} />
            </button>
          ))}
          <span className="gm-wiz__stars-label">{trip.tripRating ? `${trip.tripRating}/5` : 'Toca para avaliar'}</span>
        </div>
        {errors.tripRating && <div className="gm-wiz__hint--error" style={{ marginTop: 8 }}>{errors.tripRating}</div>}
      </div>
    </div>
  );
}

// =============================================================================
// STEP 2 — Destinos
//
// Round 45+ — Adicionado Segmented "Um destino" / "Vários destinos"
// no topo. Antes só se chegava ao modo multi via catch-22 (o botão
// "Adicionar destino" só aparecia se já estivesses em multi).
// =============================================================================
function StepWhere({ trip, setField, addDestination, removeDestination, countries, citiesByCountry, errors }) {
  const dests = Array.isArray(trip.destinations) ? trip.destinations : [];
  // Helper: update dest at index using setTrip directly for reliability
  const updateDest = (idx, key, value) => {
    setField(`destinations.${idx}.${key}`, value);
  };
  // Alternar entre single/multi. Quando muda para 'single' trunca
  // para 1 destino. Quando muda para 'multi' garante pelo menos 1.
  const setType = (next) => {
    if (next === 'single') {
      setField('type', 'single');
      setField('destinations', dests.length > 0 ? [dests[0]] : [{ country: '', city: '' }]);
    } else {
      setField('type', 'multi');
      if (dests.length < 1) {
        setField('destinations', [{ country: '', city: '' }]);
      }
    }
  };
  return (
    <div className="gm-wiz__where">
      {/* ── Single / Multi toggle ── */}
      <div className="gm-wiz__where-type">
        <Segmented
          value={trip.type === 'multi' ? 'multi' : 'single'}
          onChange={setType}
          tone="brand"
          options={[
            { value: 'single', label: '📍 Um destino' },
            { value: 'multi',  label: '🗺️ Vários destinos' },
          ]}
        />
      </div>

      <p className="gm-wiz__where-intro">
        {trip.type === 'multi' ? `Adicionaste ${dests.length} ${dests.length === 1 ? 'destino' : 'destinos'}. Cada alojamento, transporte, comida, etc. pode ser associado a um destino específico.` : 'Onde foi esta viagem?'}
      </p>
      {trip.type === 'single' ? (
        <div className="gm-wiz__where-single">
          <DestinationRow index={0} dest={dests[0] || { country: '', city: '' }}
            countries={countries} citiesByCountry={citiesByCountry}
            onCountry={(v) => updateDest(0, 'country', v)}
            onCity={(v) => updateDest(0, 'city', v)}
            error={errors['destinations.0.country'] || errors['destinations.0.city']} />
        </div>
      ) : (
        <div className="gm-wiz__where-multi">
          {dests.map((d, i) => (
            <div key={i} className="gm-wiz__where-multi-row">
              <div className="gm-wiz__where-multi-num">{i + 1}</div>
              <div className="gm-wiz__where-multi-fields">
                <DestinationRow index={i} dest={d} countries={countries} citiesByCountry={citiesByCountry}
                  onCountry={(v) => updateDest(i, 'country', v)}
                  onCity={(v) => updateDest(i, 'city', v)}
                  error={errors[`destinations.${i}.country`] || errors[`destinations.${i}.city`]} />
              </div>
              {dests.length > 1 && (
                <button type="button" className="gm-wiz__iconbtn gm-wiz__iconbtn--danger" onClick={() => removeDestination(i)} aria-label="Remover">
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="gm-wiz__add-btn" onClick={addDestination}>
            <Plus size={16} strokeWidth={2.4} /> Adicionar destino
          </button>
        </div>
      )}
    </div>
  );
}

function DestinationRow({ dest, countries, citiesByCountry, onCountry, onCity, error }) {
  // Round 53 — Cidades ordenadas alfabeticamente (independentemente
  // da ordem vinda do backend).
  const cities = dest.country
    ? [...(citiesByCountry[dest.country] || [])].sort((a, b) =>
        String(translateCity(a.name || a.cityName || '')).localeCompare(
          String(translateCity(b.name || b.cityName || '')), 'pt'
        )
      )
    : [];
  // Round 83 — trocar o <select> nativo pelo SearchableDropdown partilhado.
  // Com 200+ países e milhares de cidades, o <select> nativo do browser é
  // inutilizável no telemóvel; o dropdown com pesquisa (já usado nos filtros
  // de Q&A) é a solução canónica. Mantemos o `value` como o nome canónico
  // (igual ao <option value={c}> anterior) para que o resto do wizard
  // (payload, validação, backend) continue a funcionar sem mudanças.
  const countryOptions = countries.map((c) => ({ label: translateCountry(c), value: c }));
  const cityOptions = cities.map((c) => {
    const name = c.name || c.cityName;
    return { label: translateCity(name), value: name };
  });
  return (
    <div className="gm-wiz__dest">
      <div className="gm-wiz__field">
        <label className="gm-wiz__label">País</label>
        <SearchableDropdown
          options={countryOptions}
          value={dest.country || null}
          onChange={(v) => onCountry(v || '')}
          placeholder="Pesquisar país…"
          emptyMessage="Nenhum país encontrado"
          className={error && !dest.country ? 'has-error' : ''}
        />
      </div>
      <div className="gm-wiz__field">
        <label className="gm-wiz__label">Cidade</label>
        <SearchableDropdown
          options={cityOptions}
          value={dest.city || null}
          onChange={(v) => onCity(v || '')}
          placeholder={dest.country ? 'Pesquisar cidade…' : 'Seleciona primeiro o país'}
          disabled={!dest.country}
          emptyMessage="Nenhuma cidade encontrada"
          className={error && !dest.city ? 'has-error' : ''}
        />
      </div>
    </div>
  );
}

// =============================================================================
// STEP 3 — Datas e Custos
//
// Round 47+ — Custos são 4 inputs manuais normais (Voo / Alojamento /
// Alimentação / Extras). O total é simplesmente a soma dos 4.
// Removido o mecanismo de auto-soma / override (fundo amarelo) que
// confundia o user — agora todos os blocos têm o mesmo visual.
// =============================================================================
function StepWhen({ trip, setField, errors }) {
  const bd = trip.costBreakdown || {};

  // Total = soma dos 4 inputs manuais.
  const flightEff = Number(bd.flight) || 0;
  const accommodationEff = Number(bd.accommodation) || 0;
  const foodEff = Number(bd.food) || 0;
  const extrasEff = Number(bd.extras) || 0;
  const totalCalc = flightEff + accommodationEff + foodEff + extrasEff;

  // Round 47+ — Mantemos `trip.cost.total` em sincronia com a soma
  // dos 4 inputs. Sem isto, `validateStep` (que olha para
  // `trip.cost.total` E para a soma) pode bloquear o "Continuar"
  // se o user tiver items preenchidos mas `cost.total` ainda for
  // string vazia do estado inicial.
  React.useEffect(() => {
    const current = Number(trip.cost?.total) || 0;
    if (totalCalc > 0 && current !== totalCalc) {
      setField('cost.total', totalCalc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCalc]);

  const dayCount = (trip.startDate && trip.endDate) ? Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1) : 0;

  return (
    <div className="gm-wiz__when">
      <div className="gm-wiz__row">
        <div className="gm-wiz__field">
          <label className="gm-wiz__label" htmlFor="wiz-start">Data de início <span className="gm-wiz__required">*</span></label>
          <input id="wiz-start" type="date" className={`gm-wiz__input ${errors.startDate ? 'has-error' : ''}`}
            value={trip.startDate} onChange={(e) => setField('startDate', e.target.value)} max={todayISO()} />
        </div>
        <div className="gm-wiz__field">
          <label className="gm-wiz__label" htmlFor="wiz-end">Data de fim <span className="gm-wiz__required">*</span></label>
          <input id="wiz-end" type="date" className={`gm-wiz__input ${errors.endDate ? 'has-error' : ''}`}
            value={trip.endDate} onChange={(e) => setField('endDate', e.target.value)} min={trip.startDate || ''} max={todayISO()} />
        </div>
      </div>
      {dayCount > 0 && <p className="gm-wiz__when-days">📍 {dayCount} {dayCount === 1 ? 'dia' : 'dias'} de viagem</p>}

      <div className="gm-wiz__field">
        <label className="gm-wiz__label" htmlFor="wiz-booking">Data da reserva (opcional)</label>
        <input id="wiz-booking" type="date" className="gm-wiz__input" value={trip.bookingDate} onChange={(e) => setField('bookingDate', e.target.value)} max={todayISO()} />
      </div>

      <h3 className="gm-wiz__field-title" style={{ marginTop: 18, marginBottom: 6 }}>Quanto gastaste na viagem?</h3>

      <div className="gm-wiz__cost-block">
        <div className="gm-wiz__cost-grid">
          <div className="gm-wiz__cost-item">
            <span className="gm-wiz__cost-icon"><PlaneIcon size={16} strokeWidth={1.8} /></span>
            <div className="gm-wiz__field" style={{ margin: 0 }}>
              <label className="gm-wiz__label">
                Voo / Transporte <span className="gm-wiz__required">*</span>
              </label>
              <input type="number" min="0" step="0.1" className="gm-wiz__input" value={bd.flight}
                onChange={(e) => setField('costBreakdown.flight', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="gm-wiz__cost-item">
            <span className="gm-wiz__cost-icon"><BedDouble size={16} strokeWidth={1.8} /></span>
            <div className="gm-wiz__field" style={{ margin: 0 }}>
              <label className="gm-wiz__label">
                Alojamento <span className="gm-wiz__required">*</span>
              </label>
              <input type="number" min="0" step="0.1" className="gm-wiz__input" value={bd.accommodation}
                onChange={(e) => setField('costBreakdown.accommodation', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="gm-wiz__cost-item">
            <span className="gm-wiz__cost-icon"><UtensilsCrossed size={16} strokeWidth={1.8} /></span>
            <div className="gm-wiz__field" style={{ margin: 0 }}>
              <label className="gm-wiz__label">Alimentação <span className="gm-wiz__required">*</span></label>
              <input type="number" min="0" step="0.1" className="gm-wiz__input" value={bd.food}
                onChange={(e) => setField('costBreakdown.food', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="gm-wiz__cost-item">
            <span className="gm-wiz__cost-icon"><WalletIcon size={16} strokeWidth={1.8} /></span>
            <div className="gm-wiz__field" style={{ margin: 0 }}>
              <label className="gm-wiz__label">Extras <span className="gm-wiz__required">*</span></label>
              <input type="number" min="0" step="0.1" className="gm-wiz__input" value={bd.extras}
                onChange={(e) => setField('costBreakdown.extras', e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>
        <div className="gm-wiz__field" style={{ marginTop: 12, maxWidth: 220 }}>
          <label className="gm-wiz__label" htmlFor="wiz-currency-d">Moeda</label>
          <select id="wiz-currency-d" className="gm-wiz__select" value={trip.cost?.currency || 'EUR'} onChange={(e) => setField('cost.currency', e.target.value)}>
            <option value="EUR">EUR €</option><option value="USD">USD $</option><option value="GBP">GBP £</option><option value="BRL">BRL R$</option>
          </select>
        </div>
      </div>

      {/* ── Resumo automático sempre visível ── */}
      <div className="gm-wiz__cost-summary">
        <span className="gm-wiz__cost-total-label">Total</span>
        <span className="gm-wiz__cost-total-value">{totalCalc.toFixed(0)} {trip.cost?.currency || 'EUR'}</span>
        {totalCalc > 0 && dayCount > 0 && <span className="gm-wiz__cost-per-day">· {(totalCalc / dayCount).toFixed(0)}/dia</span>}
      </div>
    </div>
  );
}

// =============================================================================
// STEP 4 — Experiência (6 sub-tabs: Informações / Alojamento /
// Alimentação / Transportes / Locais / Extras)
//
// Round 44 — restructured per user feedback:
//   • 4.1 Informações: categorias (chips) + línguas (chips) +
//     ProgressRing. Padding top extra em "Línguas Faladas" para
//     respirar entre Categorias e Línguas.
//   • 4.2 Alojamento: editor INLINE (sem Drawer).
//   • 4.3 Alimentação: editor INLINE (sem Drawer).
//   • 4.4 Transportes: editor INLINE (sem Drawer).
//   • 4.5 Locais: Pontos de referência + Itinerário — INLINE
//     (ambos os editores na mesma página).
//   • 4.6 Extras: Pontos Positivos + Pontos Negativos — INLINE.
//
// Round 44 — Inlining TUDO resolve o bug onde o botão "Adicionar"
// não funcionava quando o editor estava dentro do Drawer/Sheet.
// Sem Drawer, sem useEffect de auto-save a re-renderizar o form,
// sem event blocking. O `defaultExpanded=true` faz com que o form
// esteja sempre visível na tab.
// =============================================================================
function StepExperience({ trip, setField, toggleInList, categories, languages, accommodationTypes, accommodationBoards, transports, errors, loading, subStepIndex, setSubStepIndex }) {
  // Round 47+ — `subStepIndex` é agora controlado pelo parent para
  // que o botão "Continuar" do footbar possa avançar a sub-tab
  // em vez de saltar direto para o Step 5.
  const STEP4_SUBTABS = ['info', 'accommodations', 'foods', 'transports', 'locais', 'extras'];
  const activeSubTab = STEP4_SUBTABS[subStepIndex] || 'info';
  const setActiveSubTab = (id) => {
    const i = STEP4_SUBTABS.indexOf(id);
    if (i >= 0) setSubStepIndex(i);
  };

  // ── ProgressRing counters (8 main sections) ──
  const sectionsCompleted = [
    trip.categories.length > 0,                         // 1. Categorias
    trip.languagesSpoken.length > 0,                    // 2. Línguas
    trip.accommodations.length > 0,                     // 3. Alojamento
    trip.recommendedFoods.length > 0,                   // 4. Alimentação
    trip.tripTransports.length > 0,                     // 5. Transportes
    trip.referencePoints.length > 0,                    // 6. Locais (Pontos de referência)
    (trip.tripItinerary?.days?.length || 0) > 0,        // 7. Itinerário
    trip.positivePoints.length > 0,                     // 8. Pontos Positivos
  ].filter(Boolean).length;
  const TOTAL_SECTIONS = 8;

  return (
    <div className="gm-wiz__exp">
      {/* ── ProgressRing + sub-tab bar ── */}
      <div className="gm-wiz__exp-progress">
        <ProgressRing
          value={sectionsCompleted}
          total={TOTAL_SECTIONS}
          size={56}
          stroke={6}
          label={`${sectionsCompleted}/${TOTAL_SECTIONS}`}
          caption="concluídas"
        />
        <div className="gm-wiz__exp-progress-text">
          <h3 className="gm-wiz__exp-progress-title">A experiência</h3>
          <p className="gm-wiz__exp-progress-sub">Tudo o que ajuda outros viajantes. Categorias, Línguas, Alojamento, Alimentação e Transportes são obrigatórios; o resto é opcional.</p>
        </div>
      </div>

      <div className="gm-wiz__subtabs" role="tablist" aria-label="Secções da experiência">
        {[
          { id: 'info',            label: 'Informações', icon: <Tag size={14} strokeWidth={2} /> },
          { id: 'accommodations',  label: 'Alojamento',   icon: <BedDouble size={14} strokeWidth={2} /> },
          { id: 'foods',            label: 'Alimentação',  icon: <UtensilsCrossed size={14} strokeWidth={2} /> },
          { id: 'transports',       label: 'Transportes',  icon: <Bus size={14} strokeWidth={2} /> },
          { id: 'locais',           label: 'Locais',       icon: <MapPin size={14} strokeWidth={2} /> },
          { id: 'extras',           label: 'Extras',       icon: <FileText size={14} strokeWidth={2} /> },
        ].map((t) => (
          <button
            key={t.id} type="button" role="tab"
            aria-selected={activeSubTab === t.id}
            className={`gm-wiz__subtab ${activeSubTab === t.id ? 'is-on' : ''}`}
            onClick={() => setActiveSubTab(t.id)}
          >
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── SUB-TAB 4.1 — Informações (Categorias + Línguas) ── */}
      {activeSubTab === 'info' && (
        <div className="gm-wiz__subtab-panel">
          <section className="gm-wiz__section">
            <header className="gm-wiz__section-head">
              <span className="gm-wiz__section-icon"><Tag size={16} strokeWidth={2} /></span>
              <div><h3 className="gm-wiz__field-title">Categorias <span className="gm-wiz__required">*</span></h3><p className="gm-wiz__field-sub">Escolhe o que descreve melhor a viagem.</p></div>
            </header>
            {errors.categories && <div className="gm-wiz__hint--error">{errors.categories}</div>}
            <div className="gm-wiz__chipcloud">
              {loading ? <div className="gm-wiz__skeleton-row" /> : null}
              {categories.map((c) => {
                const Ico = CATEGORY_ICONS[c.id] || Tag;
                const active = trip.categories.includes(c.id);
                return (
                  <button key={c.id} type="button" className={`gm-wiz__chip ${active ? 'is-on' : ''}`} onClick={() => toggleInList('categories', c.id)} aria-pressed={active}>
                    <Ico size={14} strokeWidth={2} /><span>{c.name}</span>{active && <Check size={12} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Round 44 — extra padding-top na secção de Línguas
              para criar respiração entre Categorias e Línguas. */}
          <section className="gm-wiz__section gm-wiz__section--langs" style={{ marginTop: 24 }}>
            <header className="gm-wiz__section-head">
              <span className="gm-wiz__section-icon"><Languages size={16} strokeWidth={2} /></span>
              <div><h3 className="gm-wiz__field-title">Línguas faladas <span className="gm-wiz__required">*</span></h3><p className="gm-wiz__field-sub">Ajuda outros viajantes.</p></div>
            </header>
            {errors.languagesSpoken && <div className="gm-wiz__hint--error">{errors.languagesSpoken}</div>}
            <div className="gm-wiz__chipcloud">
              {languages.map((l) => {
                const active = trip.languagesSpoken.includes(l.id);
                return (
                  <button key={l.id} type="button" className={`gm-wiz__chip ${active ? 'is-on' : ''}`} onClick={() => toggleInList('languagesSpoken', l.id)} aria-pressed={active}>
                    <span>{l.name}</span>{active && <Check size={12} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ── SUB-TAB 4.2 — Alojamento (editor INLINE) ── */}
      {activeSubTab === 'accommodations' && (
        <div className="gm-wiz__subtab-panel">
          <h3 className="gm-wiz__field-title">Alojamento</h3>
          <p className="gm-wiz__field-sub" style={{ marginBottom: 12 }}>
            Onde ficaste hospedado <span className="gm-wiz__required">*</span> (obrigatório). As noites são calculadas a partir do check-in / check-out.
          </p>
          <AccommodationsEditor
            accommodations={trip.accommodations}
            setField={setField}
            accommodationTypes={accommodationTypes}
            accommodationBoards={accommodationBoards}
            loading={loading}
            destinations={trip.destinations}
          />
        </div>
      )}

      {/* ── SUB-TAB 4.3 — Alimentação (editor INLINE) ── */}
      {activeSubTab === 'foods' && (
        <div className="gm-wiz__subtab-panel">
          <h3 className="gm-wiz__field-title">Alimentação</h3>
          <p className="gm-wiz__field-sub" style={{ marginBottom: 12 }}>
            Pratos que provaste e recomendas <span className="gm-wiz__required">*</span> (obrigatório). Adiciona cada um com nome e descrição.
          </p>
          <FoodsEditor
            foods={trip.recommendedFoods}
            setField={setField}
            destinations={trip.destinations}
          />
        </div>
      )}

      {/* ── SUB-TAB 4.4 — Transportes (editor INLINE) ── */}
      {activeSubTab === 'transports' && (
        <div className="gm-wiz__subtab-panel">
          <h3 className="gm-wiz__field-title">Transportes</h3>
          <p className="gm-wiz__field-sub" style={{ marginBottom: 12 }}>
            Meios de transporte que usaste <span className="gm-wiz__required">*</span> (obrigatório). Os custos são preenchidos no bloco "Quanto gastaste?" no passo 3.
          </p>
          <TransportsEditor
            transports={trip.tripTransports}
            setField={setField}
            transportCatalog={transports}
            loading={loading}
            destinations={trip.destinations}
          />
        </div>
      )}

      {/* ── SUB-TAB 4.5 — Locais (Pontos de referência + Itinerário) ── */}
      {activeSubTab === 'locais' && (
        <div className="gm-wiz__subtab-panel">
          <p className="gm-wiz__field-sub" style={{ marginBottom: 12 }}>
            Locais que visitaste e o que fizeste em cada dia. Os dois editores ficam aqui na mesma página.
          </p>
          <ReferencePointsEditor
            points={trip.referencePoints}
            setField={setField}
            destinations={trip.destinations}
          />
          <div style={{ height: 18 }} />
          <ItineraryEditor
            itinerary={trip.tripItinerary}
            setField={setField}
            startDate={trip.startDate}
            endDate={trip.endDate}
            destinations={trip.destinations}
          />
        </div>
      )}

      {/* ── SUB-TAB 4.6 — Extras (Pontos Positivos + Pontos Negativos) ── */}
      {activeSubTab === 'extras' && (
        <div className="gm-wiz__subtab-panel">
          <p className="gm-wiz__field-sub" style={{ marginBottom: 12 }}>
            O que correu bem e o que correu mal. Tudo opcional.
          </p>
          <PositivePointsEditor
            points={trip.positivePoints}
            setField={setField}
            destinations={trip.destinations}
          />
          <div style={{ height: 18 }} />
          <NegativePointsEditor
            points={trip.negativePoints}
            setField={setField}
            destinations={trip.destinations}
          />
          <p className="gm-wiz__cost-sub" style={{ marginTop: 16, textAlign: 'center' }}>
            Dicas, recomendações e "o que faria diferente" — em breve.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Sub-editores (AccommodationsEditor, FoodsEditor, TransportsEditor, ReferencePointsEditor, ItineraryEditor, NegativePointsEditor) — mantidos iguais abaixo ──
// (Placeholder — manter o código original dessas funções)

// =============================================================================
// AccommodationsEditor — Round 45 enhancements:
//   • `nights` agora é AUTO-CALCULADO a partir de checkIn/checkOut
//     (diferença em dias), mas o user pode ainda fazer override
//     manual apagando e reescrevendo (se a estadia for parcial ou
//     se as datas da viagem ainda não estiverem definidas).
//   • Multi-destino: dropdown `Destino` aparece quando há mais
//     que um destino (trip.destinations.length > 1). Para single-
//     destino, escondemos o campo e assumimos destinationIndex=0.
//   • O custo do item vem do bloco "Custos" (Voo / Alojamento /
//     Alimentação / Extras) — não há campo de preço no item.
// =============================================================================
function AccommodationsEditor({ accommodations = [], setField, accommodationTypes, accommodationBoards, loading, defaultExpanded = false, destinations = [] }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const emptyLocal = { name: '', type: '', regime: '', description: '', rating: 0, nights: '', checkInDate: '', checkOutDate: '', destinationIndex: 0 };
  const [local, setLocal] = useState(emptyLocal);
  const [nightsOverridden, setNightsOverridden] = useState(false);
  const [editIdx, setEditIdx] = useState(null);

  useEditorDraftAutosave({
    list: accommodations, setField, field: 'accommodations',
    local, open: expanded, hasContent: (l) => Boolean((l?.name || '').trim()),
    editing: editIdx !== null, editIdx,
  });
  const isMulti = destinations.length > 1;

  const computeNights = (ci, co) => {
    if (!ci || !co) return '';
    const a = new Date(ci); const b = new Date(co);
    if (isNaN(a) || isNaN(b) || b <= a) return '';
    return Math.round((b - a) / 86400000).toString();
  };

  const addOrEdit = () => {
    if (!local.name.trim()) return;
    const list = [...accommodations];
    const entry = { ...local, destinationIndex: Math.min(Math.max(0, Number(local.destinationIndex) || 0), Math.max(0, destinations.length - 1)) };
    delete entry.__draft;
    if (editIdx !== null) {
      list[editIdx] = entry;
    } else if (list.length > 0 && list[list.length - 1].__draft) {
      list[list.length - 1] = entry;
    } else {
      list.push(entry);
    }
    setField('accommodations', list);
    setLocal(emptyLocal); setNightsOverridden(false); setEditIdx(null); setExpanded(false);
  };
  const cancelEdit = () => {
    setLocal(emptyLocal); setNightsOverridden(false); setEditIdx(null); setExpanded(false);
  };
  const edit = (idx) => {
    setLocal({ ...emptyLocal, ...accommodations[idx] });
    setNightsOverridden(Boolean(accommodations[idx]?.nights && accommodations[idx]?.checkInDate && accommodations[idx]?.checkOutDate && accommodations[idx].nights !== computeNights(accommodations[idx].checkInDate, accommodations[idx].checkOutDate)));
    setEditIdx(idx); setExpanded(true);
  };
  const remove = (idx) => {
    setField('accommodations', accommodations.filter((_, i) => i !== idx));
    if (editIdx === idx) { setLocal(emptyLocal); setNightsOverridden(false); setEditIdx(null); setExpanded(false); }
  };
  return (
    <section className="gm-wiz__section">
      <header className="gm-wiz__section-head">
        <span className="gm-wiz__section-icon"><BedDouble size={16} strokeWidth={2} /></span>
        <div><h3 className="gm-wiz__field-title">Alojamento</h3><p className="gm-wiz__field-sub">Onde ficaste hospedado.</p></div>
        <button type="button" className="gm-wiz__add-btn gm-wiz__add-btn--sm" onClick={() => { setExpanded(!expanded); if (!expanded) { setEditIdx(null); setLocal(emptyLocal); setNightsOverridden(false); } }}>
          {expanded ? <X size={14} /> : <Plus size={14} />}<span>{expanded ? 'Fechar' : 'Adicionar'}</span>
        </button>
      </header>
      {accommodations.filter((a) => !a.__draft).length > 0 && (
        <div className="gm-wiz__list">{accommodations.filter((a) => !a.__draft).map((a, realIdx) => {
          const i = accommodations.indexOf(a);
          const dest = destinations[a.destinationIndex];
          const destLabel = dest ? translatePlace([dest.city, dest.country].filter(Boolean).join(', ')) : '';
          return (
            <div key={i} className="gm-wiz__list-item">
              <div className="gm-wiz__list-item-info">
                <strong>{a.name}</strong>
                {a.type && <span>{accommodationTypes.find((t) => t.id === a.type)?.type || a.type}</span>}
                {destLabel && <span className="gm-wiz__list-item-dest">📍 {destLabel}</span>}
                {a.nights && <span>{a.nights} {a.nights === '1' ? 'noite' : 'noites'}</span>}
              </div>
              <div className="gm-wiz__list-item-actions"><button type="button" className="gm-wiz__iconbtn" onClick={() => edit(i)}><FileText size={14} /></button><button type="button" className="gm-wiz__iconbtn gm-wiz__iconbtn--danger" onClick={() => remove(i)}><Trash2 size={14} /></button></div>
            </div>
          );
        })}</div>
      )}
      {expanded && (
        <div className="gm-wiz__subform">
          <div className="gm-wiz__row">
            <div className="gm-wiz__field"><label className="gm-wiz__label">Nome *</label><input className="gm-wiz__input" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} placeholder="Ex.: Hotel Paris" /></div>
          </div>
          {isMulti && (
            <div className="gm-wiz__field">
              <label className="gm-wiz__label">Destino</label>
              <select className="gm-wiz__select" value={local.destinationIndex ?? 0} onChange={(e) => setLocal({ ...local, destinationIndex: Number(e.target.value) })}>
                {destinations.map((d, i) => (
                  <option key={i} value={i}>{[d.city, d.country].filter(Boolean).join(', ') || `Destino ${i + 1}`}</option>
                ))}
              </select>
            </div>
          )}
          <div className="gm-wiz__row">
            <div className="gm-wiz__field"><label className="gm-wiz__label">Tipo</label><select className="gm-wiz__select" value={local.type} onChange={(e) => setLocal({ ...local, type: e.target.value })}><option value="">Selecionar…</option>{!loading && accommodationTypes.map((a) => <option key={a.id} value={a.id}>{a.type}</option>)}</select></div>
            <div className="gm-wiz__field"><label className="gm-wiz__label">Regime</label><select className="gm-wiz__select" value={local.regime} onChange={(e) => setLocal({ ...local, regime: e.target.value })}><option value="">Selecionar…</option>{!loading && accommodationBoards.map((b) => <option key={b.id} value={b.id}>{b.board}</option>)}</select></div>
          </div>
          <div className="gm-wiz__row">
            <div className="gm-wiz__field">
              <label className="gm-wiz__label">Check-in</label>
              <input type="date" className="gm-wiz__input" value={local.checkInDate} onChange={(e) => {
                const ci = e.target.value;
                const next = { ...local, checkInDate: ci };
                if (!nightsOverridden) next.nights = computeNights(ci, local.checkOutDate);
                setLocal(next);
              }} />
            </div>
            <div className="gm-wiz__field">
              <label className="gm-wiz__label">Check-out</label>
              <input type="date" className="gm-wiz__input" value={local.checkOutDate} onChange={(e) => {
                const co = e.target.value;
                const next = { ...local, checkOutDate: co };
                if (!nightsOverridden) next.nights = computeNights(local.checkInDate, co);
                setLocal(next);
              }} />
            </div>
          </div>
          <div className="gm-wiz__row">
            <div className="gm-wiz__field">
              <label className="gm-wiz__label">Noites {nightsOverridden ? '(manual)' : '(auto)'}</label>
              <input type="number" min="0" className="gm-wiz__input" value={local.nights} onChange={(e) => { setNightsOverridden(true); setLocal({ ...local, nights: e.target.value }); }} />
              {nightsOverridden && (
                <button type="button" className="gm-wiz__chip-link" onClick={() => { setNightsOverridden(false); setLocal({ ...local, nights: computeNights(local.checkInDate, local.checkOutDate) }); }}>
                  <X size={11} /> Voltar a calcular
                </button>
              )}
            </div>
          </div>
          <div className="gm-wiz__field"><label className="gm-wiz__label">Descrição</label><textarea rows={2} className="gm-wiz__textarea" value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" className="gm-wiz__btn gm-wiz__btn--primary gm-wiz__btn--sm" onClick={addOrEdit}>
              <Check size={14} strokeWidth={2.4} /> {editIdx !== null ? 'Guardar alteração' : '+ Adicionar alojamento'}
            </button>
            <button type="button" className="gm-wiz__btn gm-wiz__btn--secondary gm-wiz__btn--sm" onClick={cancelEdit}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function FoodsEditor({ foods = [], setField, defaultExpanded = false, destinations = [] }) {
  const emptyLocal = { name: '', description: '', photoUrl: '', destinationIndex: 0 };
  const [local, setLocal] = useState(emptyLocal); const [editIdx, setEditIdx] = useState(null); const [showForm, setShowForm] = useState(defaultExpanded);
  const isMulti = destinations.length > 1;

  useEditorDraftAutosave({
    list: foods, setField, field: 'recommendedFoods',
    local, open: showForm, hasContent: (l) => Boolean((l?.name || '').trim()),
    editing: editIdx !== null, editIdx,
  });
  const addOrEdit = () => {
    if (!local.name.trim()) return;
    const entry = { ...local, destinationIndex: Math.min(Math.max(0, Number(local.destinationIndex) || 0), Math.max(0, destinations.length - 1)) };
    delete entry.__draft;
    const list = [...foods];
    if (editIdx !== null) {
      list[editIdx] = entry;
    } else if (list.length > 0 && list[list.length - 1].__draft) {
      list[list.length - 1] = entry;
    } else {
      list.push(entry);
    }
    setField('recommendedFoods', list);
    setLocal(emptyLocal); setEditIdx(null); setShowForm(false);
  };
  const cancelEdit = () => {
    setLocal(emptyLocal); setEditIdx(null); setShowForm(false);
  };
  const edit = (idx) => { setLocal({ ...emptyLocal, ...foods[idx] }); setEditIdx(idx); setShowForm(true); };
  const remove = (idx) => { setField('recommendedFoods', foods.filter((_, i) => i !== idx)); if (editIdx === idx) { setLocal(emptyLocal); setEditIdx(null); setShowForm(false); } };
  return (
    <section className="gm-wiz__section">
      <header className="gm-wiz__section-head">
        <span className="gm-wiz__section-icon"><UtensilsCrossed size={16} strokeWidth={2} /></span>
        <div><h3 className="gm-wiz__field-title">Comida recomendada</h3><p className="gm-wiz__field-sub">Pratos que provaste e recomendas.</p></div>
        <button type="button" className="gm-wiz__add-btn gm-wiz__add-btn--sm" onClick={() => { setShowForm(!showForm); if (!showForm) { setEditIdx(null); setLocal(emptyLocal); } }}>{showForm ? <X size={14} /> : <Plus size={14} />}<span>{showForm ? 'Fechar' : 'Adicionar'}</span></button>
      </header>
      {foods.filter((f) => !f.__draft).length > 0 && (<div className="gm-wiz__list">{foods.filter((f) => !f.__draft).map((f) => {
        const i = foods.indexOf(f);
        const dest = destinations[f.destinationIndex];
        const destLabel = dest ? translatePlace([dest.city, dest.country].filter(Boolean).join(', ')) : '';
        return (
          <div key={i} className="gm-wiz__list-item">
            <div className="gm-wiz__list-item-info">
              <strong>{f.name}</strong>
              {f.description && <span>{f.description}</span>}
              {destLabel && <span className="gm-wiz__list-item-dest">📍 {destLabel}</span>}
            </div>
            <div className="gm-wiz__list-item-actions"><button type="button" className="gm-wiz__iconbtn" onClick={() => edit(i)}><FileText size={14} /></button><button type="button" className="gm-wiz__iconbtn gm-wiz__iconbtn--danger" onClick={() => remove(i)}><Trash2 size={14} /></button></div>
          </div>
        );
      })}</div>)}
      {showForm && (<div className="gm-wiz__subform">
        <div className="gm-wiz__field"><label className="gm-wiz__label">Nome *</label><input className="gm-wiz__input" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} placeholder="Ex.: Bacalhau à Brás" /></div>
        {isMulti && (
          <div className="gm-wiz__field">
            <label className="gm-wiz__label">Destino</label>
            <select className="gm-wiz__select" value={local.destinationIndex ?? 0} onChange={(e) => setLocal({ ...local, destinationIndex: Number(e.target.value) })}>
              {destinations.map((d, i) => (
                <option key={i} value={i}>{[d.city, d.country].filter(Boolean).join(', ') || `Destino ${i + 1}`}</option>
              ))}
            </select>
          </div>
        )}
        <div className="gm-wiz__field"><label className="gm-wiz__label">Descrição</label><textarea rows={2} className="gm-wiz__textarea" value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} /></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--primary gm-wiz__btn--sm" onClick={addOrEdit}>
            <Check size={14} strokeWidth={2.4} /> {editIdx !== null ? 'Guardar alteração' : '+ Adicionar recomendação'}
          </button>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--secondary gm-wiz__btn--sm" onClick={cancelEdit}>
            Cancelar
          </button>
        </div>
      </div>)}
    </section>
  );
}

function TransportsEditor({ transports = [], setField, transportCatalog, loading, defaultExpanded = false, destinations = [] }) {
  const emptyLocal = { transportId: '', name: '', description: '', destinationIndex: 0 };
  const [showForm, setShowForm] = useState(defaultExpanded);
  const [local, setLocal] = useState(emptyLocal);
  const [editIdx, setEditIdx] = useState(null);
  const isMulti = destinations.length > 1;

  useEditorDraftAutosave({
    list: transports, setField, field: 'tripTransports',
    local, open: showForm,
    hasContent: (l) => Boolean((l?.transportId || l?.name || '').toString().trim()),
    editing: editIdx !== null, editIdx,
  });
  const addOrEdit = () => {
    if (!local.transportId) return;
    const entry = {
      transportId: Number(local.transportId),
      name: local.name || transportCatalog.find((t) => t.id === Number(local.transportId))?.name || '',
      description: local.description, cost: 0,
      destinationIndex: Math.min(Math.max(0, Number(local.destinationIndex) || 0), Math.max(0, destinations.length - 1)),
    };
    delete entry.__draft;
    const list = [...transports];
    if (editIdx !== null) list[editIdx] = entry;
    else if (list.length > 0 && list[list.length - 1].__draft) list[list.length - 1] = entry;
    else list.push(entry);
    setField('tripTransports', list); setLocal(emptyLocal); setEditIdx(null); setShowForm(false);
  };
  const cancelEdit = () => { setLocal(emptyLocal); setEditIdx(null); setShowForm(false); };
  const edit = (idx) => { const t = transports[idx]; setLocal({ ...emptyLocal, transportId: t.transportId?.toString() || '', name: t.name || '', description: t.description || '', destinationIndex: t.destinationIndex ?? 0 }); setEditIdx(idx); setShowForm(true); };
  const remove = (idx) => { setField('tripTransports', transports.filter((_, i) => i !== idx)); if (editIdx === idx) { setLocal(emptyLocal); setEditIdx(null); setShowForm(false); } };
  return (
    <section className="gm-wiz__section">
      <header className="gm-wiz__section-head">
        <span className="gm-wiz__section-icon"><Bus size={16} strokeWidth={2} /></span>
        <div><h3 className="gm-wiz__field-title">Transporte</h3><p className="gm-wiz__field-sub">Meios de transporte.</p></div>
        <button type="button" className="gm-wiz__add-btn gm-wiz__add-btn--sm" onClick={() => { setShowForm(!showForm); if (!showForm) { setEditIdx(null); setLocal(emptyLocal); } }}>{showForm ? <X size={14} /> : <Plus size={14} />}<span>{showForm ? 'Fechar' : 'Adicionar'}</span></button>
      </header>
      {transports.filter((t) => !t.__draft).length > 0 && (<div className="gm-wiz__list">{transports.filter((t) => !t.__draft).map((t) => {
        const i = transports.indexOf(t);
        const dest = destinations[t.destinationIndex];
        const destLabel = dest ? translatePlace([dest.city, dest.country].filter(Boolean).join(', ')) : '';
        return (
          <div key={i} className="gm-wiz__list-item">
            <div className="gm-wiz__list-item-info">
              <strong>{t.name}</strong>
              {t.cost > 0 && <span>{t.cost}€</span>}
              {destLabel && <span className="gm-wiz__list-item-dest">📍 {destLabel}</span>}
            </div>
            <div className="gm-wiz__list-item-actions"><button type="button" className="gm-wiz__iconbtn" onClick={() => edit(i)}><FileText size={14} /></button><button type="button" className="gm-wiz__iconbtn gm-wiz__iconbtn--danger" onClick={() => remove(i)}><Trash2 size={14} /></button></div>
          </div>
        );
      })}</div>)}
      {showForm && (<div className="gm-wiz__subform">
        <div className="gm-wiz__field"><label className="gm-wiz__label">Tipo *</label><select className="gm-wiz__select" value={local.transportId} onChange={(e) => setLocal({ ...local, transportId: e.target.value })}><option value="">Selecionar…</option>{!loading && transportCatalog.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        {isMulti && (
          <div className="gm-wiz__field">
            <label className="gm-wiz__label">Destino</label>
            <select className="gm-wiz__select" value={local.destinationIndex ?? 0} onChange={(e) => setLocal({ ...local, destinationIndex: Number(e.target.value) })}>
              {destinations.map((d, i) => (
                <option key={i} value={i}>{[d.city, d.country].filter(Boolean).join(', ') || `Destino ${i + 1}`}</option>
              ))}
            </select>
          </div>
        )}
        <div className="gm-wiz__field"><label className="gm-wiz__label">Descrição</label><input className="gm-wiz__input" value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} placeholder="Ex.: Voo Lisboa-Paris" /></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--primary gm-wiz__btn--sm" onClick={addOrEdit}>
            <Check size={14} strokeWidth={2.4} /> {editIdx !== null ? 'Guardar alteração' : '+ Adicionar transporte'}
          </button>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--secondary gm-wiz__btn--sm" onClick={cancelEdit}>
            Cancelar
          </button>
        </div>
      </div>)}
    </section>
  );
}

function ReferencePointsEditor({ points = [], setField, defaultExpanded = false, destinations = [] }) {
  const emptyLocal = { name: '', description: '', type: '', photoUrls: [], destinationIndex: 0 };
  const [showForm, setShowForm] = useState(defaultExpanded); const [local, setLocal] = useState(emptyLocal); const [editIdx, setEditIdx] = useState(null);
  const isMulti = destinations.length > 1;

  useEditorDraftAutosave({
    list: points, setField, field: 'referencePoints',
    local, open: showForm, hasContent: (l) => Boolean((l?.name || '').trim()),
    editing: editIdx !== null, editIdx,
  });

  const addOrEdit = () => {
    if (!local.name.trim()) return;
    const entry = { ...local, destinationIndex: Math.min(Math.max(0, Number(local.destinationIndex) || 0), Math.max(0, destinations.length - 1)) };
    delete entry.__draft;
    const list = [...points];
    if (editIdx !== null) list[editIdx] = entry;
    else if (list.length > 0 && list[list.length - 1].__draft) list[list.length - 1] = entry;
    else list.push(entry);
    setField('referencePoints', list);
    setLocal(emptyLocal); setEditIdx(null); setShowForm(false);
  };
  const cancelEdit = () => { setLocal(emptyLocal); setEditIdx(null); setShowForm(false); };
  const edit = (idx) => { setLocal({ ...emptyLocal, ...points[idx] }); setEditIdx(idx); setShowForm(true); };
  const remove = (idx) => { setField('referencePoints', points.filter((_, i) => i !== idx)); if (editIdx === idx) { setLocal(emptyLocal); setEditIdx(null); setShowForm(false); } };
  return (
    <section className="gm-wiz__section">
      <header className="gm-wiz__section-head">
        <span className="gm-wiz__section-icon"><Navigation size={16} strokeWidth={2} /></span>
        <div><h3 className="gm-wiz__field-title">Pontos de referência</h3><p className="gm-wiz__field-sub">Locais que visitaste.</p></div>
        <button type="button" className="gm-wiz__add-btn gm-wiz__add-btn--sm" onClick={() => { setShowForm(!showForm); if (!showForm) { setEditIdx(null); setLocal(emptyLocal); } }}>{showForm ? <X size={14} /> : <Plus size={14} />}<span>{showForm ? 'Fechar' : 'Adicionar'}</span></button>
      </header>
      {points.filter((p) => !p.__draft).length > 0 && (<div className="gm-wiz__list">{points.filter((p) => !p.__draft).map((p) => {
        const i = points.indexOf(p);
        const dest = destinations[p.destinationIndex];
        const destLabel = dest ? [dest.city, dest.country].filter(Boolean).join(', ') : '';
        return (
          <div key={i} className="gm-wiz__list-item">
            <div className="gm-wiz__list-item-info">
              <strong>{p.name}</strong>
              {p.type && <span>{p.type}</span>}
              {destLabel && <span className="gm-wiz__list-item-dest">📍 {destLabel}</span>}
            </div>
            <div className="gm-wiz__list-item-actions"><button type="button" className="gm-wiz__iconbtn" onClick={() => edit(i)}><FileText size={14} /></button><button type="button" className="gm-wiz__iconbtn gm-wiz__iconbtn--danger" onClick={() => remove(i)}><Trash2 size={14} /></button></div>
          </div>
        );
      })}</div>)}
      {showForm && (<div className="gm-wiz__subform">
        <div className="gm-wiz__row">
          <div className="gm-wiz__field"><label className="gm-wiz__label">Nome *</label><input className="gm-wiz__input" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} placeholder="Ex.: Torre Eiffel" /></div>
          <div className="gm-wiz__field">
            <label className="gm-wiz__label">Tipo</label>
            <select
              className="gm-wiz__select"
              value={local.type || ''}
              onChange={(e) => setLocal({ ...local, type: e.target.value })}
            >
              <option value="">— Escolher tipo —</option>
              <option value="Monumento">Monumento</option>
              <option value="Praia">Praia</option>
              <option value="Museu">Museu</option>
              <option value="Miradouro">Miradouro</option>
              <option value="Parque">Parque</option>
              <option value="Restaurante">Restaurante</option>
              <option value="Bar">Bar</option>
              <option value="Mercado">Mercado</option>
              <option value="Igreja / Templo">Igreja / Templo</option>
              <option value="Castelo">Castelo</option>
              <option value="Jardim">Jardim</option>
              <option value="Praça">Praça</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>
        {isMulti && (
          <div className="gm-wiz__field">
            <label className="gm-wiz__label">Destino</label>
            <select className="gm-wiz__select" value={local.destinationIndex ?? 0} onChange={(e) => setLocal({ ...local, destinationIndex: Number(e.target.value) })}>
              {destinations.map((d, i) => (
                <option key={i} value={i}>{[d.city, d.country].filter(Boolean).join(', ') || `Destino ${i + 1}`}</option>
              ))}
            </select>
          </div>
        )}
        <div className="gm-wiz__field"><label className="gm-wiz__label">Descrição</label><textarea rows={2} className="gm-wiz__textarea" value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} /></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--primary gm-wiz__btn--sm" onClick={addOrEdit}>
            <Check size={14} strokeWidth={2.4} /> {editIdx !== null ? 'Guardar alteração' : '+ Adicionar ponto'}
          </button>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--secondary gm-wiz__btn--sm" onClick={cancelEdit}>
            Cancelar
          </button>
        </div>
      </div>)}
    </section>
  );
}

function ItineraryEditor({ itinerary = { days: [] }, setField, startDate, endDate, defaultExpanded = false, destinations = [] }) {
  const emptyLocal = { day: '', activities: [''], destinationIndex: 0 };
  const [showForm, setShowForm] = useState(defaultExpanded);
  const [local, setLocal] = useState(emptyLocal);
  const [editIdx, setEditIdx] = useState(null);
  const totalDays = (!startDate || !endDate) ? 0 : Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
  const days = itinerary.days || [];
  const isMulti = destinations.length > 1;

  useEffect(() => {
    if (totalDays <= 0) return;
    const list = [...days];
    for (let i = 1; i <= totalDays; i += 1) {
      const exists = list.some((d) => parseInt(d.day, 10) === i);
      if (!exists) {
        list.push({
          day: String(i),
          topics: [],
          destinationIndex: 0,
          __autoGenerated: true,
        });
      }
    }
    const validDays = list.filter((d) => {
      const num = parseInt(d.day, 10);
      return num >= 1 && num <= totalDays;
    });
    validDays.sort((a, b) => (parseInt(a.day, 10) || 0) - (parseInt(b.day, 10) || 0));
    
    const sameLength = validDays.length === days.length;
    const sameOrder = sameLength && validDays.every((d, i) => String(d.day) === String(days[i]?.day));
    if (!sameOrder) {
      setField('tripItinerary', { ...itinerary, days: validDays });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDays]);

  const saveActivities = () => {
    if (!local.day) return;
    const filteredActivities = local.activities.filter((a) => a.trim());
    const entry = {
      day: local.day,
      topics: filteredActivities.map((a) => ({ name: a, description: '' })),
      destinationIndex: Math.min(Math.max(0, Number(local.destinationIndex) || 0), Math.max(0, destinations.length - 1)),
    };
    delete entry.__draft;
    const list = [...days];
    if (editIdx !== null) {
      list[editIdx] = entry;
    } else {
      const dayNum = parseInt(local.day, 10);
      const existingIdx = list.findIndex((d) => parseInt(d.day, 10) === dayNum);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...entry };
      }
    }
    setField('tripItinerary', { ...itinerary, days: list.sort((a, b) => (parseInt(a.day, 10) || 0) - (parseInt(b.day, 10) || 0)) });
    setLocal(emptyLocal); setEditIdx(null); setShowForm(false);
  };

  const editDay = (idx) => {
    const d = days[idx];
    setLocal({
      day: d.day?.toString() || '',
      activities: (d.topics || []).map((t) => t.name || t).concat(['']).filter((a, i, arr) => a.trim() || i === arr.length - 1),
      destinationIndex: d.destinationIndex ?? 0,
    });
    setEditIdx(idx);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setLocal(emptyLocal); setEditIdx(null); setShowForm(false);
  };

  return (
    <section className="gm-wiz__section">
      <header className="gm-wiz__section-head">
        <span className="gm-wiz__section-icon"><CalendarRange size={16} strokeWidth={2} /></span>
        <div>
          <h3 className="gm-wiz__field-title">Itinerário</h3>
          <p className="gm-wiz__field-sub">
            {totalDays > 0
              ? `Os ${totalDays} ${totalDays === 1 ? 'dia está definido' : 'dias estão definidos'} com base nas datas da viagem. Adiciona as atividades de cada dia.`
              : 'Define a data de início e fim no passo "Datas e custos" para gerar os dias do itinerário.'}
          </p>
        </div>
      </header>
      {days.length > 0 && (
        <div className="gm-wiz__list">
          {days.map((d, i) => {
            const dest = destinations[d.destinationIndex];
            const destLabel = dest ? [dest.city, dest.country].filter(Boolean).join(', ') : '';
            const isEditing = editIdx === i;
            return (
              <div key={i} className={`gm-wiz__list-item ${isEditing ? 'is-editing' : ''}`}>
                <div className="gm-wiz__list-item-info">
                  <strong>Dia {d.day}</strong>
                  <span>
                    {(d.topics || []).length > 0
                      ? `${(d.topics || []).length} ${(d.topics || []).length === 1 ? 'atividade' : 'atividades'}`
                      : 'Nenhuma atividade adicionada'}
                  </span>
                  {destLabel && <span className="gm-wiz__list-item-dest">📍 {destLabel}</span>}
                </div>
                <div className="gm-wiz__list-item-actions">
                  <button type="button" className="gm-wiz__btn gm-wiz__btn--secondary gm-wiz__btn--sm" onClick={() => editDay(i)}>
                    <FileText size={14} /> {(d.topics || []).length > 0 ? 'Editar atividades' : '+ Adicionar atividades'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showForm && editIdx !== null && (
        <div className="gm-wiz__subform" style={{ marginTop: 12 }}>
          <div className="gm-wiz__row" style={{ alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Atividades para o Dia {local.day}</h4>
          </div>
          {isMulti && (
            <div className="gm-wiz__field" style={{ marginBottom: 12 }}>
              <label className="gm-wiz__label">Destino</label>
              <select className="gm-wiz__select" value={local.destinationIndex ?? 0} onChange={(e) => setLocal({ ...local, destinationIndex: Number(e.target.value) })}>
                {destinations.map((d, i) => (
                  <option key={i} value={i}>{[d.city, d.country].filter(Boolean).join(', ') || `Destino ${i + 1}`}</option>
                ))}
              </select>
            </div>
          )}
          <div className="gm-wiz__field">
            <label className="gm-wiz__label">Atividades do dia</label>
            {local.activities.map((act, i) => (
              <div key={i} className="gm-wiz__it-row" style={{ marginBottom: 8 }}>
                <input
                  className="gm-wiz__input"
                  value={act}
                  onChange={(e) => {
                    const next = [...local.activities];
                    next[i] = e.target.value;
                    setLocal({ ...local, activities: next });
                  }}
                  placeholder={`Ex.: Atividade ${i + 1}`}
                />
                {local.activities.length > 1 && (
                  <button type="button" className="gm-wiz__iconbtn gm-wiz__iconbtn--danger" onClick={() => setLocal({ ...local, activities: local.activities.filter((_, idx) => idx !== i) })}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="gm-wiz__add-btn gm-wiz__add-btn--sm" onClick={() => setLocal({ ...local, activities: [...local.activities, ''] })}>
              <Plus size={12} /> Adicionar outra atividade
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" className="gm-wiz__btn gm-wiz__btn--primary gm-wiz__btn--sm" onClick={saveActivities}>
              <Check size={14} strokeWidth={2.4} /> Guardar atividades
            </button>
            <button type="button" className="gm-wiz__btn gm-wiz__btn--secondary gm-wiz__btn--sm" onClick={cancelEdit}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function NegativePointsEditor({ points = [], setField, defaultExpanded = false, destinations = [] }) {
  const emptyLocal = { name: '', description: '', destinationIndex: 0 };
  const [showForm, setShowForm] = useState(defaultExpanded); const [local, setLocal] = useState(emptyLocal); const [editIdx, setEditIdx] = useState(null);
  const isMulti = destinations.length > 1;

  useEditorDraftAutosave({
    list: points, setField, field: 'negativePoints',
    local, open: showForm, hasContent: (l) => Boolean((l?.name || '').trim()),
    editing: editIdx !== null, editIdx,
  });

  const addOrEdit = () => {
    if (!local.name.trim()) return;
    const entry = { ...local, destinationIndex: Math.min(Math.max(0, Number(local.destinationIndex) || 0), Math.max(0, destinations.length - 1)) };
    delete entry.__draft;
    const list = [...points];
    if (editIdx !== null) list[editIdx] = entry;
    else if (list.length > 0 && list[list.length - 1].__draft) list[list.length - 1] = entry;
    else list.push(entry);
    setField('negativePoints', list);
    setLocal(emptyLocal); setEditIdx(null); setShowForm(false);
  };
  const cancelEdit = () => { setLocal(emptyLocal); setEditIdx(null); setShowForm(false); };
  const edit = (idx) => { setLocal({ ...emptyLocal, ...points[idx] }); setEditIdx(idx); setShowForm(true); };
  const remove = (idx) => { setField('negativePoints', points.filter((_, i) => i !== idx)); if (editIdx === idx) { setLocal(emptyLocal); setEditIdx(null); setShowForm(false); } };
  return (
    <section className="gm-wiz__section">
      <header className="gm-wiz__section-head">
        <span className="gm-wiz__section-icon"><AlertTriangle size={16} strokeWidth={2} /></span>
        <div><h3 className="gm-wiz__field-title">Pontos negativos (opcional)</h3><p className="gm-wiz__field-sub">O que correu menos bem.</p></div>
        <button type="button" className="gm-wiz__add-btn gm-wiz__add-btn--sm" onClick={() => { setShowForm(!showForm); if (!showForm) { setEditIdx(null); setLocal(emptyLocal); } }}>{showForm ? <X size={14} /> : <Plus size={14} />}<span>{showForm ? 'Fechar' : 'Adicionar'}</span></button>
      </header>
      {points.filter((p) => !p.__draft).length > 0 && (<div className="gm-wiz__list">{points.filter((p) => !p.__draft).map((p) => {
        const i = points.indexOf(p);
        const dest = destinations[p.destinationIndex];
        const destLabel = dest ? [dest.city, dest.country].filter(Boolean).join(', ') : '';
        return (
          <div key={i} className="gm-wiz__list-item">
            <div className="gm-wiz__list-item-info">
              <strong>{p.name}</strong>
              {p.description && <span>{p.description}</span>}
              {destLabel && <span className="gm-wiz__list-item-dest">📍 {destLabel}</span>}
            </div>
            <div className="gm-wiz__list-item-actions"><button type="button" className="gm-wiz__iconbtn" onClick={() => edit(i)}><FileText size={14} /></button><button type="button" className="gm-wiz__iconbtn gm-wiz__iconbtn--danger" onClick={() => remove(i)}><Trash2 size={14} /></button></div>
          </div>
        );
      })}</div>)}
      {showForm && (<div className="gm-wiz__subform">
        <div className="gm-wiz__field"><label className="gm-wiz__label">Título *</label><input className="gm-wiz__input" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} placeholder="Ex.: Mau tempo" /></div>
        {isMulti && (
          <div className="gm-wiz__field">
            <label className="gm-wiz__label">Destino</label>
            <select className="gm-wiz__select" value={local.destinationIndex ?? 0} onChange={(e) => setLocal({ ...local, destinationIndex: Number(e.target.value) })}>
              {destinations.map((d, i) => (
                <option key={i} value={i}>{[d.city, d.country].filter(Boolean).join(', ') || `Destino ${i + 1}`}</option>
              ))}
            </select>
          </div>
        )}
        <div className="gm-wiz__field"><label className="gm-wiz__label">Descrição</label><textarea rows={2} className="gm-wiz__textarea" value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} /></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--primary gm-wiz__btn--sm" onClick={addOrEdit}>
            <Check size={14} strokeWidth={2.4} /> {editIdx !== null ? 'Guardar alteração' : '+ Adicionar ponto negativo'}
          </button>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--secondary gm-wiz__btn--sm" onClick={cancelEdit}>
            Cancelar
          </button>
        </div>
      </div>)}
    </section>
  );
}

function PositivePointsEditor({ points = [], setField, defaultExpanded = false, destinations = [] }) {
  const emptyLocal = { name: '', description: '', destinationIndex: 0 };
  const [showForm, setShowForm] = useState(defaultExpanded); const [local, setLocal] = useState(emptyLocal); const [editIdx, setEditIdx] = useState(null);
  const isMulti = destinations.length > 1;

  useEditorDraftAutosave({
    list: points, setField, field: 'positivePoints',
    local, open: showForm, hasContent: (l) => Boolean((l?.name || '').trim()),
    editing: editIdx !== null, editIdx,
  });

  const addOrEdit = () => {
    if (!local.name.trim()) return;
    const entry = { ...local, destinationIndex: Math.min(Math.max(0, Number(local.destinationIndex) || 0), Math.max(0, destinations.length - 1)) };
    delete entry.__draft;
    const list = [...points];
    if (editIdx !== null) list[editIdx] = entry;
    else if (list.length > 0 && list[list.length - 1].__draft) list[list.length - 1] = entry;
    else list.push(entry);
    setField('positivePoints', list);
    setLocal(emptyLocal); setEditIdx(null); setShowForm(false);
  };
  const cancelEdit = () => { setLocal(emptyLocal); setEditIdx(null); setShowForm(false); };
  const edit = (idx) => { setLocal({ ...emptyLocal, ...points[idx] }); setEditIdx(idx); setShowForm(true); };
  const remove = (idx) => { setField('positivePoints', points.filter((_, i) => i !== idx)); if (editIdx === idx) { setLocal(emptyLocal); setEditIdx(null); setShowForm(false); } };
  return (
    <section className="gm-wiz__section">
      <header className="gm-wiz__section-head">
        <span className="gm-wiz__section-icon" style={{ color: '#16a34a' }}><Smile size={16} strokeWidth={2} /></span>
        <div><h3 className="gm-wiz__field-title">Pontos positivos (opcional)</h3><p className="gm-wiz__field-sub">O que correu bem na viagem.</p></div>
        <button type="button" className="gm-wiz__add-btn gm-wiz__add-btn--sm" onClick={() => { setShowForm(!showForm); if (!showForm) { setEditIdx(null); setLocal(emptyLocal); } }}>{showForm ? <X size={14} /> : <Plus size={14} />}<span>{showForm ? 'Fechar' : 'Adicionar'}</span></button>
      </header>
      {points.filter((p) => !p.__draft).length > 0 && (<div className="gm-wiz__list">{points.filter((p) => !p.__draft).map((p) => {
        const i = points.indexOf(p);
        const dest = destinations[p.destinationIndex];
        const destLabel = dest ? [dest.city, dest.country].filter(Boolean).join(', ') : '';
        return (
          <div key={i} className="gm-wiz__list-item">
            <div className="gm-wiz__list-item-info">
              <strong>{p.name}</strong>
              {p.description && <span>{p.description}</span>}
              {destLabel && <span className="gm-wiz__list-item-dest">📍 {destLabel}</span>}
            </div>
            <div className="gm-wiz__list-item-actions"><button type="button" className="gm-wiz__iconbtn" onClick={() => edit(i)}><FileText size={14} /></button><button type="button" className="gm-wiz__iconbtn gm-wiz__iconbtn--danger" onClick={() => remove(i)}><Trash2 size={14} /></button></div>
          </div>
        );
      })}</div>)}
      {showForm && (<div className="gm-wiz__subform">
        <div className="gm-wiz__field"><label className="gm-wiz__label">Título *</label><input className="gm-wiz__input" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} placeholder="Ex.: Hospitalidade local" /></div>
        {isMulti && (
          <div className="gm-wiz__field">
            <label className="gm-wiz__label">Destino</label>
            <select className="gm-wiz__select" value={local.destinationIndex ?? 0} onChange={(e) => setLocal({ ...local, destinationIndex: Number(e.target.value) })}>
              {destinations.map((d, i) => (
                <option key={i} value={i}>{[d.city, d.country].filter(Boolean).join(', ') || `Destino ${i + 1}`}</option>
              ))}
            </select>
          </div>
        )}
        <div className="gm-wiz__field"><label className="gm-wiz__label">Descrição</label><textarea rows={2} className="gm-wiz__textarea" value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} /></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--primary gm-wiz__btn--sm" onClick={addOrEdit}>
            <Check size={14} strokeWidth={2.4} /> {editIdx !== null ? 'Guardar alteração' : '+ Adicionar ponto positivo'}
          </button>
          <button type="button" className="gm-wiz__btn gm-wiz__btn--secondary gm-wiz__btn--sm" onClick={cancelEdit}>
            Cancelar
          </button>
        </div>
      </div>)}
    </section>
  );
}

// =============================================================================
// STEP 5 — Galeria (Round 43 — promoted from StepExperience sub-tab to
// its own top-level step). Reuses the same PhotoGalleryEditor that
// used to live inside StepExperience; we just wrap it in a
// standalone step body so the wizard has 6 steps now.
// =============================================================================
function StepGallery({ trip, setField, photoPreviews, coverPhoto, photoInputRef, handlePhotos, removePhoto, photoAssociations, setPhotoAssociations }) {
  // Round 47+ — A foto de capa (definida na tab 2 "O essencial")
  // aparece na Galeria como o PRIMEIRO item, com o badge "Capa".
  // Construímos uma vista derivada: [capa, ...galeria], evitando
  // duplicados (se a capa já estiver nos previews da galeria).
  const galleryWithCover = useMemo(() => {
    if (!coverPhoto) return photoPreviews;
    const coverPath = coverPhoto.path || coverPhoto.url;
    const isDup = photoPreviews.some((p) => (p.path || p.url) === coverPath);
    if (isDup) return photoPreviews;
    return [
      { ...coverPhoto, isCover: true },
      ...photoPreviews,
    ];
  }, [coverPhoto, photoPreviews]);
  // Round 59+ — Count the actual gallery items (cover + previews).
  // The previous version added `trip.photos` separately, which
  // double-counted the existing photos that were also loaded into
  // `photoPreviews` during edit-load. For a fresh trip the user sees
  // N previews + the cover (= N+1); for an edit they see the
  // previews that include the already-uploaded photos, so the count
  // matches what they actually see in the grid.
  const photoCount = galleryWithCover.length;
  return (
    <div className="gm-wiz__gallery">
      <p className="gm-wiz__field-sub" style={{ marginBottom: 12 }}>
        Adiciona as tuas fotografias e descreve cada uma com uma legenda. Podes também associar cada foto a um <strong>Alojamento</strong>, <strong>Alimentação</strong>, <strong>Transporte</strong> ou <strong>Ponto de Referência</strong> da viagem — ao escolher, a legenda é preenchida com o nome (podes editar depois). A foto com o badge <strong>⭐ Capa</strong> é a capa/destaque da viagem.
      </p>
      <PhotoGalleryEditor
        trip={trip}
        setField={setField}
        photoPreviews={galleryWithCover}
        photoInputRef={photoInputRef}
        handlePhotos={handlePhotos}
        removePhoto={removePhoto}
        // Map the gallery index → original index in `photoPreviews`,
        // so `removePhoto` doesn't get confused when the cover is
        // the first item. The cover (index 0) is not removable from
        // the gallery (use the cover picker in tab 2 instead).
        indexOffset={coverPhoto ? 1 : 0}
        // Round 49 — per-photo entity association (accommodation /
        // food / transport / reference point). Aligned with the
        // ORIGINAL photoPreviews[] (not the cover-prepended view).
        photoAssociations={photoAssociations}
        setPhotoAssociations={setPhotoAssociations}
      />
      <div className="gm-wiz__exp-meta">
        <span>Total: <strong>{photoCount}</strong> {photoCount === 1 ? 'foto' : 'fotos'}</span>
      </div>
    </div>
  );
}

// =============================================================================
// PhotoGalleryEditor — Step 4.3 Galeria.
// Instagram-style drag&drop + grid + per-photo caption (NEW in v2).
//
// The caption for each photo is stored in `trip.photoCaptions[i]`, parallel
// to `photoPreviews[i]`. On submit the wizard zips these with the final
// photos list and ships them as `photoCaptions` to the backend (see
// `buildPayload`). The cover photo has no caption in the wizard since
// Round 46+ (the "Descrição da capa" field was removed).
//
// Round 49 — per-photo entity association. Each gallery photo (NOT the
// cover) can be linked to an Accommodation / Food / Transport / Reference
// Point the user has added. The association is client-only — it auto-fills
// the caption with the entity name and stays in the wizard. The caption
// itself is the durable record (it round-trips through photoCaptions).
//
// Renders the photo previews as a responsive grid, with a small text
// field underneath each one for the caption. Removing a photo also
// removes the corresponding caption from the array (so the index never
// drifts out of sync with the preview list).
// =============================================================================
function PhotoGalleryEditor({ trip, setField, photoPreviews, photoInputRef, handlePhotos, removePhoto, indexOffset = 0, photoAssociations = [], setPhotoAssociations = () => {} }) {
  const [dragOver, setDragOver] = useState(false);
  const captions = Array.isArray(trip.photoCaptions) ? trip.photoCaptions : [];

  // Round 49 — Build the dropdown options for the per-photo
  // association. We list every entity the user has added (filtered
  // out empty names so the dropdown isn't full of "(sem nome)"
  // rows). Each entity gets a stable id (type + index) so React
  // doesn't re-render the whole list on every state change.
  const associationOptions = useMemo(() => {
    const accs = (trip.accommodations || [])
      .map((a, i) => ({ id: `acc-${i}`, type: 'accommodation', icon: BedDouble, name: a.name }))
      .filter((e) => e.name && e.name.trim());
    const foods = (trip.recommendedFoods || [])
      .map((f, i) => ({ id: `food-${i}`, type: 'food', icon: UtensilsCrossed, name: f.name }))
      .filter((e) => e.name && e.name.trim());
    const transports = (trip.tripTransports || [])
      .map((t, i) => ({ id: `tr-${i}`, type: 'transport', icon: Bus, name: t.name }))
      .filter((e) => e.name && e.name.trim());
    const refs = (trip.referencePoints || [])
      .map((r, i) => ({ id: `ref-${i}`, type: 'refpoint', icon: MapPin, name: r.name }))
      .filter((e) => e.name && e.name.trim());
    return { accs, foods, transports, refs };
  }, [trip.accommodations, trip.recommendedFoods, trip.tripTransports, trip.referencePoints]);
  const hasAnyAssociationOption =
    associationOptions.accs.length > 0 ||
    associationOptions.foods.length > 0 ||
    associationOptions.transports.length > 0 ||
    associationOptions.refs.length > 0;

  // Helpers that keep `photoCaptions` index-aligned with `photoPreviews`.
  // We patch setField so removing a photo also drops the matching caption
  // slot — otherwise the user could end up with captions attached to the
  // wrong photo after a delete.
  //
  // Round 59+ — Read the current `captions` from `trip.photoCaptions`
  // at write time instead of capturing the render-time `captions`
  // closure. The previous version did `const next = [...captions]`,
  // which is the OLD list from the moment this component rendered.
  // Every keystroke overwrote the previous one and the user could
  // only ever see the last character of their description in the
  // saved value. Same problem for the association helper below.
  const updateCaption = (idx, value) => {
    const current = Array.isArray(trip.photoCaptions) ? trip.photoCaptions : [];
    const next = [...current];
    while (next.length <= idx) next.push('');
    next[idx] = value;
    setField('photoCaptions', next);
  };
  // Round 49 — Association helpers. The `originalIdx` is the index
  // in the underlying `photoPreviews` array (cover excluded) — the
  // same index used by `photoAssociations[]`. We auto-fill the
  // caption with the entity name ONLY when the caption is still
  // empty (so we don't clobber a custom caption the user has
  // already written). Clearing the association leaves the caption
  // intact — they're independent fields.
  const updateAssociation = (originalIdx, entityId) => {
    const all = [
      ...associationOptions.accs,
      ...associationOptions.foods,
      ...associationOptions.transports,
      ...associationOptions.refs,
    ];
    const next = [...(photoAssociations || [])];
    while (next.length <= originalIdx) next.push(null);
    if (!entityId) {
      // Clear the association AND the auto-filled marker in the
      // caption (the user explicitly chose "Nenhuma"). We leave
      // any user-typed suffix intact by stripping the leading
      // [Alojamento: ...] / [Alimentação: ...] etc. tag.
      next[originalIdx] = null;
      // Round 59+ — read the live caption list from `trip` so we
      // strip the correct tag (the render-time `captions` array may
      // be stale by the time the user changes the dropdown).
      const liveCaptions = Array.isArray(trip.photoCaptions) ? trip.photoCaptions : [];
      const cur = liveCaptions[originalIdx] || '';
      const stripped = cur.replace(/^\s*\[[^\]]+\]\s*/, '').trim();
      updateCaption(originalIdx, stripped);
    } else {
      const entity = all.find((e) => e.id === entityId);
      if (entity) {
        next[originalIdx] = entity;
        // Round 50 — Store the association in the caption as a
        // parseable tag `[Tipo: Nome]` so the travel-detail page
        // can render the association pill without needing a
        // new DTO field. The user's own text (if any) follows
        // the tag, e.g. `[Alojamento: Hotel Paris] vista do quarto`.
        const typeLabel = ({ accommodation: 'Alojamento', food: 'Alimentação', transport: 'Transporte', refpoint: 'Ponto de Interesse' })[entity.type] || 'Local';
        const tag = `[${typeLabel}: ${entity.name}]`;
        const liveCaptions = Array.isArray(trip.photoCaptions) ? trip.photoCaptions : [];
        const cur = (liveCaptions[originalIdx] || '').replace(/^\s*\[[^\]]+\]\s*/, '').trim();
        const next2 = cur ? `${tag} ${cur}` : tag;
        updateCaption(originalIdx, next2);
      }
    }
    setPhotoAssociations(next);
  };
  const removePhotoWithCaption = (idx) => {
    removePhoto(idx);
    // Round 59+ — read the live `photoCaptions` from `trip` instead
    // of the render-time `captions` closure, otherwise we could
    // drop the wrong slot when a previous keystroke is still being
    // flushed by React.
    const current = Array.isArray(trip.photoCaptions) ? trip.photoCaptions : [];
    const next = current.filter((_, i) => i !== idx);
    setField('photoCaptions', next);
    const nextAssoc = (photoAssociations || []).filter((_, i) => i !== idx);
    setPhotoAssociations(nextAssoc);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) handlePhotos(e.dataTransfer.files);
  };

  return (
    <div className="gm-wiz__gallery">
      <div
        className={`gm-wiz__gallery-drop ${dragOver ? 'is-dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <button type="button" className="gm-wiz__gallery-drop-btn" onClick={() => photoInputRef.current?.click()}>
          <Camera size={28} strokeWidth={1.6} />
          <strong>Arrasta fotos ou escolhe do dispositivo</strong>
          <span>JPG, PNG, WEBP até 5MB</span>
        </button>
        <input ref={photoInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handlePhotos(e.target.files)} />
      </div>

      {photoPreviews.length > 0 && (
        <div className="gm-wiz__gallery-grid">
          {photoPreviews.map((p, i) => {
            // The cover photo is the first item (offset = 0 in the
            // gallery view). Captions are aligned with the GALLERY
            // index, but `removePhoto` expects the ORIGINAL index in
            // `photoPreviews` (the pre-cover array), so we subtract
            // `indexOffset` when calling it.
            const isCover = (i === 0) && p.isCover;
            const originalIdx = i - indexOffset;
            const assoc = !isCover ? (photoAssociations[originalIdx] || null) : null;
            return (
              <div key={i} className={`gm-wiz__gallery-item ${isCover ? 'is-cover' : ''}`}>
                <div className="gm-wiz__gallery-thumb">
                  <img src={p.url} alt={p.name} />
                  {!isCover && (
                    <button type="button" className="gm-wiz__gallery-remove" onClick={() => removePhotoWithCaption(originalIdx)} aria-label="Remover">
                      <X size={14} strokeWidth={2.4} />
                    </button>
                  )}
                  <span className="gm-wiz__gallery-index">{i + 1}</span>
                  {isCover && (
                    <span className="gm-wiz__gallery-cover-badge" title="Esta é a foto de capa / destaque da viagem">
                      <Star size={11} strokeWidth={2.2} /> Capa
                    </span>
                  )}
                </div>
                {/* Round 49 — per-photo entity association (skipped
                    for the cover photo). Only renders if the user
                    has at least one entity to associate with. */}
                {!isCover && hasAnyAssociationOption && (
                  <>
                    <label className="gm-wiz__gallery-assoc-label" htmlFor={`assoc-${i}`}>
                      <Tag size={12} strokeWidth={2} /> Associar a
                    </label>
                    <select
                      id={`assoc-${i}`}
                      className="gm-wiz__gallery-assoc"
                      value={assoc?.id || ''}
                      onChange={(e) => updateAssociation(originalIdx, e.target.value)}
                    >
                      <option value="">Nenhuma (livre)</option>
                      {associationOptions.accs.length > 0 && (
                        <optgroup label="Alojamento">
                          {associationOptions.accs.map((e) => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {associationOptions.foods.length > 0 && (
                        <optgroup label="Alimentação">
                          {associationOptions.foods.map((e) => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {associationOptions.transports.length > 0 && (
                        <optgroup label="Transportes">
                          {associationOptions.transports.map((e) => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {associationOptions.refs.length > 0 && (
                        <optgroup label="Pontos de Referência">
                          {associationOptions.refs.map((e) => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </>
                )}
                {/* Round 59+ — The cover photo no longer shows a
                    "Descrição" input. The cover is a hero/destaque and
                    its caption is intentionally empty (we removed the
                    cover-caption feature in Round 46). The label +
                    input are now rendered only for non-cover items so
                    the cover card stays clean. */}
                {!isCover && (
                  <>
                    <label className="gm-wiz__gallery-caption-label" htmlFor={`cap-${i}`}>
                      <FileText size={12} strokeWidth={2} /> Descrição
                    </label>
                    <input
                      id={`cap-${i}`}
                      type="text"
                      className="gm-wiz__gallery-caption"
                      placeholder="O que é esta foto? (ex.: Torre de Belém)"
                      // Round 60 — Read the caption from
                      // `photoCaptions[originalIdx]`, NOT
                      // `photoCaptions[i]`. The gallery view
                      // prepends the cover (when there is one), so
                      // the caption array is aligned with the
                      // ORIGINAL `photoPreviews` indices, not the
                      // gallery-rendered ones. The previous version
                      // was off-by-one whenever a cover was present
                      // — every keystroke was saved to the wrong
                      // slot, and the buildPayload that consumes
                      // `photoCaptions[i - 1]` for existing photos
                      // read empty strings. This is the root cause
                      // of the "associação/descrição não grava"
                      // bug the user reported.
                      value={captions[originalIdx] || ''}
                      onChange={(e) => updateCaption(originalIdx, e.target.value)}
                      maxLength={500}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// STEP 5 — Review (pré-visualização REAL — Round 41+)
//
// The Review step no longer shows a stack of "Editar" tiles. It renders
// the trip as it will appear in the feed: hero, stats, mini-map,
// categories, experience cards, photo grid and the privacy Segmented.
// This makes the publish button feel final — the user can SEE what
// they are about to publish before clicking.
// =============================================================================
function StepReview({ trip, categories, languages, photoPreviews, coverPhoto, accommodationTypes, accommodationBoards, setField, errors, onEditStep }) {
  const dayCount = (!trip.startDate || !trip.endDate) ? 0 : Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1);
  const catNames = trip.categories.map((id) => (categories.find((c) => c.id === id) || {}).name).filter(Boolean);
  const langNames = trip.languagesSpoken.map((id) => (languages.find((l) => l.id === id) || {}).name).filter(Boolean);
  const heroPhoto = coverPhoto?.url || photoPreviews[0]?.url || null;
  // Round 47+ — Total = soma direta dos 4 inputs manuais do StepWhen
  // (Voo + Alojamento + Alimentação + Extras). O override foi removido.
  const bd = trip.costBreakdown || {};
  const flightEff = Number(bd.flight) || 0;
  const accommodationEff = Number(bd.accommodation) || 0;
  const foodEff = Number(bd.food) || 0;
  const extrasEff = Number(bd.extras) || 0;
  const totalCalc = flightEff + accommodationEff + foodEff + extrasEff;
  const displayCost = totalCalc > 0 ? totalCalc : (Number(trip.cost?.total) || 0);

  const dests = Array.isArray(trip.destinations) ? trip.destinations : [];
  const primaryCountry = dests[0]?.country || '';
  const primaryCity = dests[0]?.city || '';
  const destLabel = dests.length === 0
    ? '—'
    : dests.length === 1
      ? [primaryCity, primaryCountry].filter(Boolean).join(', ') || '—'
      : `${dests.length} paragens`;

  const photoCount = (photoPreviews?.length || 0) + (coverPhoto ? 1 : 0);
  const visiblePhotos = [coverPhoto, ...(photoPreviews || [])].filter(Boolean).slice(0, 6);
  // Round 46+ — cover has no caption in the wizard. visiblePhotos[0]
  // is the cover (no caption), visiblePhotos[1..] are gallery previews
  // and align with trip.photoCaptions[0..]. We prepend an empty string
  // so the index mapping holds.
  const captions = ['', ...(Array.isArray(trip.photoCaptions) ? trip.photoCaptions : [])];

  return (
    <div className="gm-wiz__review">
      {/* ── HERO ── foto grande + título + destino */}
      <div className="gm-wiz__review-hero">
        {heroPhoto ? (
          <img className="gm-wiz__review-hero-img" src={heroPhoto} alt={trip.title} />
        ) : (
          <div className="gm-wiz__review-hero-empty">
            <ImageIcon size={36} strokeWidth={1.4} />
            <span>Sem foto de capa</span>
          </div>
        )}
        <div className="gm-wiz__review-hero-info">
          <h3 className="gm-wiz__review-hero-title">{trip.title || 'Sem título'}</h3>
          <div className="gm-wiz__review-hero-meta">
            {dests.length <= 1 ? <MapPin size={14} /> : <Globe size={14} />}
            <span>{destLabel}</span>
          </div>
        </div>
      </div>

      {/* ── ESTATÍSTICAS ── rating + dias + custo + fotos */}
      <div className="gm-wiz__review-stats">
        <div className="gm-wiz__review-stat">
          <Star size={16} strokeWidth={1.8} fill="currentColor" />
          <strong>{trip.tripRating || '—'}</strong>
          <span>avaliação</span>
        </div>
        <div className="gm-wiz__review-stat">
          <Calendar size={16} strokeWidth={1.8} />
          <strong>{dayCount || '—'}</strong>
          <span>{dayCount === 1 ? 'dia' : 'dias'}</span>
        </div>
        <div className="gm-wiz__review-stat">
          <Wallet size={16} strokeWidth={1.8} />
          <strong>{displayCost ? Number(displayCost).toFixed(0) : '—'}</strong>
          <span>{trip.cost?.currency || 'EUR'}</span>
        </div>
        <div className="gm-wiz__review-stat">
          <Camera size={16} strokeWidth={1.8} />
          <strong>{photoCount}</strong>
          <span>{photoCount === 1 ? 'foto' : 'fotos'}</span>
        </div>
      </div>

      {/* ── CATEGORIAS ── chips */}
      {catNames.length > 0 && (
        <div className="gm-wiz__review-chips">
          {catNames.map((c, i) => {
            const Ico = CATEGORY_ICONS[trip.categories[i]] || Tag;
            return (
              <span key={c} className="gm-wiz__review-chip">
                <Ico size={12} strokeWidth={2} />{c}
              </span>
            );
          })}
        </div>
      )}

      {/* ── MAPA ── mini Leaflet read-only com a localização */}
      {primaryCountry && (
        <div className="gm-wiz__review-map">
          <PreviewMap country={primaryCountry} city={primaryCity} />
          <span className="gm-wiz__review-map-label">📍 {primaryCity ? `${primaryCity}, ` : ''}{primaryCountry}</span>
        </div>
      )}

      {/* ── EXPERIÊNCIA ── cards resumidos */}
      {(trip.accommodations.length > 0 || trip.recommendedFoods.length > 0 || trip.tripTransports.length > 0 || trip.referencePoints.length > 0) && (
        <div className="gm-wiz__review-experience">
          <h3 className="gm-wiz__field-title">Experiência</h3>
          <div className="gm-wiz__review-exp-grid">
            {trip.accommodations.length > 0 && (
              <div className="gm-wiz__review-exp-card">
                <span className="gm-wiz__review-exp-icon" style={{ background: '#007BFF15', color: '#007BFF' }}><BedDouble size={16} strokeWidth={1.8} /></span>
                <div>
                  <strong>Alojamento</strong>
                  <span>{trip.accommodations.length} {trip.accommodations.length === 1 ? 'alojamento' : 'alojamentos'}</span>
                </div>
              </div>
            )}
            {trip.recommendedFoods.length > 0 && (
              <div className="gm-wiz__review-exp-card">
                <span className="gm-wiz__review-exp-icon" style={{ background: '#FF990015', color: '#FF9900' }}><UtensilsCrossed size={16} strokeWidth={1.8} /></span>
                <div>
                  <strong>Comida</strong>
                  <span>{trip.recommendedFoods.length} {trip.recommendedFoods.length === 1 ? 'recomendação' : 'recomendações'}</span>
                </div>
              </div>
            )}
            {trip.tripTransports.length > 0 && (
              <div className="gm-wiz__review-exp-card">
                <span className="gm-wiz__review-exp-icon" style={{ background: '#16a34a15', color: '#16a34a' }}><Bus size={16} strokeWidth={1.8} /></span>
                <div>
                  <strong>Transporte</strong>
                  <span>{trip.tripTransports.length} {trip.tripTransports.length === 1 ? 'transporte' : 'transportes'}</span>
                </div>
              </div>
            )}
            {trip.referencePoints.length > 0 && (
              <div className="gm-wiz__review-exp-card">
                <span className="gm-wiz__review-exp-icon" style={{ background: '#7c3aed15', color: '#7c3aed' }}><Navigation size={16} strokeWidth={1.8} /></span>
                <div>
                  <strong>Locais</strong>
                  <span>{trip.referencePoints.length} {trip.referencePoints.length === 1 ? 'local' : 'locais'}</span>
                </div>
              </div>
            )}
            {(trip.tripItinerary?.days?.length || 0) > 0 && (
              <div className="gm-wiz__review-exp-card">
                <span className="gm-wiz__review-exp-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><CalendarRange size={16} strokeWidth={1.8} /></span>
                <div>
                  <strong>Itinerário</strong>
                  <span>{trip.tripItinerary.days.length} {trip.tripItinerary.days.length === 1 ? 'dia planeado' : 'dias planeados'}</span>
                </div>
              </div>
            )}
            {langNames.length > 0 && (
              <div className="gm-wiz__review-exp-card">
                <span className="gm-wiz__review-exp-icon" style={{ background: '#06b6d415', color: '#06b6d4' }}><Languages size={16} strokeWidth={1.8} /></span>
                <div>
                  <strong>Línguas</strong>
                  <span>{langNames.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DESCRIÇÃO ── */}
      {(trip.tripSummary || trip.tripDescription) && (
        <div className="gm-wiz__review-text">
          {trip.tripSummary && (
            <p className="gm-wiz__review-summary">{trip.tripSummary}</p>
          )}
          {trip.tripDescription && (
            <p className="gm-wiz__review-description">{trip.tripDescription}</p>
          )}
        </div>
      )}

      {/* ── FOTOGRAFIAS ── primeiras 6 fotos com caption */}
      {visiblePhotos.length > 0 && (
        <div className="gm-wiz__review-photos">
          <h3 className="gm-wiz__field-title">Fotografias ({photoCount})</h3>
          <div className="gm-wiz__review-photos-grid">
            {visiblePhotos.map((p, i) => p && p.url ? (
              <figure key={i} className="gm-wiz__review-photo">
                <img src={p.url} alt={p.name || `Foto ${i + 1}`} />
                {captions[i] && <figcaption>{captions[i]}</figcaption>}
              </figure>
            ) : null)}
          </div>
          {photoCount > 6 && (
            <p className="gm-wiz__review-photos-more">+{photoCount - 6} mais</p>
          )}
        </div>
      )}

      {/* ── PRIVACIDADE ── Segmented control */}
      <div className="gm-wiz__review-privacy">
        <h3 className="gm-wiz__field-title">Privacidade</h3>
        <Segmented
          value={trip.privacy}
          onChange={(v) => setField('privacy', v)}
          options={[
            { value: 'public', label: 'Pública', icon: Eye, hint: 'Todos podem ver' },
            { value: 'private', label: 'Privada', icon: Lock, hint: 'Só tu' },
          ]}
        />
        <p className="gm-wiz__field-sub" style={{ marginTop: 6 }}>
          Predefinição baseada no teu perfil. Podes alterar antes de publicar.
        </p>
      </div>

      {/* ── EDITAR RÁPIDO ── links para voltar a cada step */}
      <div className="gm-wiz__review-quick-edit">
        <button type="button" className="gm-wiz__review-quick-btn" onClick={() => onEditStep && onEditStep(0)}>📍 Destino</button>
        <button type="button" className="gm-wiz__review-quick-btn" onClick={() => onEditStep && onEditStep(1)}>✨ Essencial</button>
        <button type="button" className="gm-wiz__review-quick-btn" onClick={() => onEditStep && onEditStep(2)}>📅 Datas</button>
        <button type="button" className="gm-wiz__review-quick-btn" onClick={() => onEditStep && onEditStep(3)}>🌍 Experiência</button>
        <button type="button" className="gm-wiz__review-quick-btn" onClick={() => onEditStep && onEditStep(4)}>📷 Galeria</button>
      </div>
    </div>
  );
}

// =============================================================================
// PreviewMap — tiny Leaflet map (read-only) shown in Step 5.
//
// Geocodes the destination country/city via the Open-Meteo geocoding
// API (the same source we use on the weather page), drops a single
// marker at the resolved coordinates and zooms in. If the request
// fails or there are no coordinates, we fall back to a centred "world"
// view so the map area still looks intentional instead of empty.
// =============================================================================
function PreviewMap({ country, city }) {
  const [coords, setCoords] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!country) { setFailed(true); return undefined; }
    const q = city ? `${city}, ${country}` : country;
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=pt`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.results) && data.results[0]) {
          setCoords({ lat: data.results[0].latitude, lng: data.results[0].longitude });
        } else {
          setFailed(true);
        }
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [country, city]);
  // Lazy-load react-leaflet so it doesn't bloat the wizard's main bundle.
  // The dynamic import means the map only ships code to the user once
  // they actually reach Step 5.
  const [Leaflet, setLeaflet] = useState(null);
  useEffect(() => {
    let cancelled = false;
    import('react-leaflet').then((mod) => { if (!cancelled) setLeaflet(mod); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  if (failed) {
    return (
      <div className="gm-wiz__review-map-fallback">
        <Globe size={32} strokeWidth={1.4} />
        <span>Mapa interativo disponível após publicar</span>
      </div>
    );
  }
  if (!Leaflet || !coords) {
    return <div className="gm-wiz__review-map-loading" aria-label="A carregar mapa" />;
  }
  const { MapContainer, TileLayer, Marker } = Leaflet;
  return (
    <MapContainer
      center={[coords.lat, coords.lng]}
      zoom={6}
      style={{ height: 180, width: '100%', borderRadius: 12 }}
      scrollWheelZoom={false}
      zoomControl={false}
      dragging={false}
      doubleClickZoom={false}
      attributionControl={false}
    >
      <TileLayer
        // Round 59+ — switched from the dead MapTiler key to the
        // free OpenStreetMap tile server. No API key, no rate-limit
        // for the tiny preview map we use in the review step, and
        // the style matches the rest of the app.
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        noWrap
      />
      <Marker position={[coords.lat, coords.lng]} />
    </MapContainer>
  );
}

function ReviewCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="gm-wiz__review-card">
      <span className="gm-wiz__review-card-icon"><Icon size={18} strokeWidth={1.8} /></span>
      <div><span className="gm-wiz__review-card-label">{label}</span><strong>{value}</strong>{sub && <span className="gm-wiz__review-card-sub">{sub}</span>}</div>
    </div>
  );
}

// ReviewTile — vertical tile with icon, label, value, and Edit button.
// Used in the new Review layout. Each tile links back to its step.
function ReviewTile({ icon: Icon, label, value, sub, onEdit }) {
  return (
    <div className="gm-review-tile">
      <span className="gm-review-tile__icon"><Icon size={16} strokeWidth={1.8} /></span>
      <div className="gm-review-tile__body">
        <div className="gm-review-tile__label">{label}</div>
        <div className="gm-review-tile__value">{value}</div>
        {sub && <div className="gm-review-tile__sub">{sub}</div>}
      </div>
      {onEdit && (
        <button type="button" className="gm-review-tile__edit" onClick={onEdit} aria-label={`Editar ${label}`}>
          <FileText size={12} strokeWidth={2} /><span>Editar</span>
        </button>
      )}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default TripWizard;