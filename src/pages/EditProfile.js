import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User as IconUser,
  Globe as IconGlobe,
  MapPin as IconMapPin,
  Calendar as IconCalendar,
  Save as IconSave,
  X as IconX,
  ArrowLeft as IconArrowLeft,
  AlertCircle as IconAlertCircle,
  Loader2 as IconLoader2,
  Camera as IconCamera,
  Edit3 as IconEdit3,
  Compass as IconCompass,
  Image as IconImage,
  Check as IconCheck,
  ChevronDown as IconChevronDown,
  Search as IconSearch,
} from 'lucide-react';
import { request, uploadFile, toFullMediaUrl } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { translateCountry, translateCity } from '../utils/localization';
import { useToast, PageContainer, PageHeader } from '../components/ui';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import TermsModal from '../components/TermsModal';
import '../styles/pages/edit-profile.css';

/* ============================================================================
 * SearchableDropdown (premium, local copy)
 *
 * Same UX as the one used in the Register page. We keep a local copy
 * here so the edit-profile file is self-contained and the visual style
 * matches the registration flow.
 * ============================================================================ */
function SearchableDropdown({
  id,
  options = [],
  value,
  onChange,
  placeholder,
  disabled,
  labelKey = 'label',
  valueKey = 'value',
}) {
  const [search, setSearch] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const filtered = options.filter((opt) => String(opt[labelKey]).toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = value ? options.find((opt) => opt[valueKey] === value)?.[labelKey] || '' : '';

  const handleSelect = (val) => {
    onChange(val);
    setShowOptions(false);
    setSearch('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && value && !search) {
      e.preventDefault();
      onChange('');
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
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex((p) => (p < filtered.length - 1 ? p + 1 : p)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex((p) => (p > 0 ? p - 1 : -1)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0) handleSelect(filtered[focusedIndex][valueKey]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowOptions(false);
        setFocusedIndex(-1);
      }
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowOptions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`gm-dd ${disabled ? 'gm-dd--disabled' : ''} ${showOptions ? 'gm-dd--open' : ''}`}
    >
      <div className="gm-dd__input-wrap">
        <input
          id={id}
          type="text"
          value={selectedLabel || search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => !disabled && setShowOptions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="gm-dd__input"
          autoComplete="off"
          spellCheck="false"
          role="combobox"
          aria-expanded={showOptions}
          aria-haspopup="listbox"
        />
        <IconChevronDown size={14} className="gm-dd__arrow" />
      </div>
      {showOptions && filtered.length > 0 && (
        <ul className="gm-dd__list" role="listbox">
          {filtered.map((opt, idx) => (
            <li
              key={opt[valueKey]}
              onMouseDown={() => handleSelect(opt[valueKey])}
              onMouseEnter={() => setFocusedIndex(idx)}
              className={`gm-dd__option ${focusedIndex === idx ? 'gm-dd__option--focused' : ''} ${value === opt[valueKey] ? 'gm-dd__option--selected' : ''}`}
              role="option"
              aria-selected={value === opt[valueKey]}
            >
              {opt[labelKey]}
            </li>
          ))}
        </ul>
      )}
      {showOptions && filtered.length === 0 && (
        <div className="gm-dd__empty">Nenhum resultado encontrado</div>
      )}
    </div>
  );
}

/* ============================================================================
 * MultiSelectDropdown (premium)
 *
 * The same SearchableDropdown, but tracks an array of values. The
 * selected values appear as removable chips above the input.
 * ============================================================================ */
function MultiSelectDropdown({
  options = [],
  value = [],
  onChange,
  placeholder,
  disabled,
}) {
  const [search, setSearch] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const filtered = options.filter(
    (opt) => String(opt.label).toLowerCase().includes(search.toLowerCase())
      && !value.includes(opt.value),
  );
  const valueSet = new Set(value);

  const toggle = (val) => {
    if (valueSet.has(val)) onChange(value.filter((v) => v !== val));
    else onChange([...value, val]);
    setSearch('');
  };

  const remove = (val) => onChange(value.filter((v) => v !== val));

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && !search && value.length) {
      e.preventDefault();
      onChange(value.slice(0, -1));
      return;
    }
    if (!showOptions && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setShowOptions(true);
      return;
    }
    if (showOptions) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex((p) => (p < filtered.length - 1 ? p + 1 : p)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex((p) => (p > 0 ? p - 1 : -1)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0) toggle(filtered[focusedIndex].value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowOptions(false);
        setFocusedIndex(-1);
      }
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowOptions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`gm-multi ${disabled ? 'gm-multi--disabled' : ''} ${showOptions ? 'gm-multi--open' : ''}`}
    >
      <div className="gm-multi__control">
        {value.length > 0 && (
          <div className="gm-multi__chips">
            {value.map((v) => (
              <span key={v} className="gm-multi__chip">
                {v}
                <button
                  type="button"
                  className="gm-multi__chip-remove"
                  onClick={() => remove(v)}
                  aria-label={`Remover ${v}`}
                >
                  <IconX size={11} strokeWidth={2.25} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="gm-multi__input-wrap">
          <IconSearch size={14} strokeWidth={1.75} className="gm-multi__input-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => !disabled && setShowOptions(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? (placeholder || 'Selecione…') : ''}
            disabled={disabled}
            className="gm-multi__input"
            autoComplete="off"
            spellCheck="false"
            role="combobox"
            aria-expanded={showOptions}
            aria-haspopup="listbox"
          />
          <IconChevronDown size={14} className="gm-multi__arrow" />
        </div>
      </div>
      {showOptions && filtered.length > 0 && (
        <ul className="gm-multi__list" role="listbox">
          {filtered.map((opt, idx) => (
            <li
              key={opt.value}
              onMouseDown={() => toggle(opt.value)}
              onMouseEnter={() => setFocusedIndex(idx)}
              className={`gm-multi__option ${focusedIndex === idx ? 'gm-multi__option--focused' : ''}`}
              role="option"
              aria-selected={false}
            >
              <span className="gm-multi__option-text">{opt.label}</span>
              <IconCheck size={14} strokeWidth={2} className="gm-multi__option-add" />
            </li>
          ))}
        </ul>
      )}
      {showOptions && filtered.length === 0 && (
        <div className="gm-multi__empty">Nenhum resultado encontrado</div>
      )}
    </div>
  );
}

/* Parse the backend's comma-separated string into a clean array.
   Used by the multi-select language dropdown. */
function parseLanguages(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * /profile/edit/:username — edit the authenticated user's own profile.
 *
 * Mirrors the fields of GET /users/{id}/detailed and PATCH
 * /users/{id}/update-profile. The profile photo lives in a separate
 * endpoint (POST /photos/upload) so we do a 2-step save: profile
 * fields first, then photo (if changed), then refresh.
 *
 * v3 design: PageContainer, PageHeader, premium cards, useToast.
 */
const EditProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    userBio: '',
    nationality: '',
    city: '',
    gender: '',
    birthDate: '',
    languagesSpoken: '',
  });
  // Country / city dropdowns. We keep the underlying `form`
  // values as plain strings (matching the backend) but also
  // track a `country` and `cityId` so the dropdown UI has a
  // proper value to compare against. The dropdown is a copy
  // of the one in the Register page so the country/city UX is
  // identical.
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Languages — stored as a Set of language names in `form.languagesSpoken`
  // is a string for the backend ("Português, Inglês"). The dropdown
  // is multi-select with chips.
  const [languageOptions, setLanguageOptions] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [originalPhoto, setOriginalPhoto] = useState(null);
  // Cover photo (the wide banner on the profile page). The
  // upload + delete flow mirrors the profile photo: a fresh file
  // is sent to POST /photos/cover-upload on save, the
  // explicit "remove" toggle hits DELETE /photos/cover, and
  // `originalCover` is the path returned by GET /users/{id}/detailed
  // at mount time. We keep these in a ref to localStorage so a
  // /profile/{username} refetch after save can pick up the new
  // cover without the user having to hard-refresh.
  const [coverFile, setCoverFile] = useState(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [originalCover, setOriginalCover] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Authorization: only the user themselves can edit their profile.
  useEffect(() => {
    if (!user) {
      // AuthContext hasn't rehydrated yet — wait a tick.
      return;
    }
    if (user.username !== username) {
      toast.danger('Não tem permissão para editar este perfil.');
      navigate(`/profile/${user.username}`);
    }
  }, [user, username, navigate, toast]);

  // Load the existing profile data.
  // Wrapped in useCallback so we can also re-invoke it after a save
  // (so `originalPhoto` and the form pick up the freshly uploaded URL
  // from the backend instead of the stale value captured at mount).
  const loadProfile = useCallback(async () => {
    if (!user || user.username !== username) return;
    setLoading(true);
    try {
      const res = await request('GET', `/users/${user.id}/detailed`);
      setForm({
        firstName: res.data.firstName || '',
        lastName: res.data.lastName || '',
        userBio: res.data.userBio || '',
        nationality: res.data.nationality || '',
        city: res.data.city || '',
        gender: res.data.gender || '',
        birthDate: res.data.birthDate || '',
        languagesSpoken: res.data.languagesSpoken || '',
      });
      const photo = res.data.profilePhoto || null;
      setOriginalPhoto(photo);
      setPhotoRemoved(false);
      const cover = res.data.coverPhoto || null;
      setOriginalCover(cover);
      setCoverRemoved(false);
    } catch (err) {
      toast.danger(err.response?.data?.message || 'Não foi possível carregar o perfil.');
    } finally {
      setLoading(false);
    }
  }, [user, username, toast]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!isMounted) return;
      await loadProfile();
    })();
    return () => { isMounted = false; };
  }, [loadProfile]);

  // ── Countries (dropdown for País) ─────────────────────────
  useEffect(() => {
    let isMounted = true;
    setLoadingCountries(true);
    request('GET', '/cities/countries')
      .then((res) => {
        if (!isMounted) return;
        setCountryOptions((res.data || []).map((c) => ({ label: translateCountry(c), value: c })));
      })
      .catch(() => { if (isMounted) setCountryOptions([]); })
      .finally(() => { if (isMounted) setLoadingCountries(false); });
    return () => { isMounted = false; };
  }, []);

  // ── Cities when País changes ─────────────────────────────
  useEffect(() => {
    if (!form.nationality) {
      setCityOptions([]);
      return undefined;
    }
    let isMounted = true;
    setLoadingCities(true);
    request('GET', `/cities/by-country?countryName=${encodeURIComponent(form.nationality)}`)
      .then((res) => {
        if (!isMounted) return;
        setCityOptions((res.data || []).map((city) => ({
          label: translateCity(city.cityName),
          value: city.cityName,
          id: city.id,
        })));
      })
      .catch(() => { if (isMounted) setCityOptions([]); })
      .finally(() => { if (isMounted) setLoadingCities(false); });
    return () => { isMounted = false; };
  }, [form.nationality]);

  // ── Languages (dropdown for Línguas) ─────────────────────
  // The backend exposes the master list at /languages-spoken
  // (LanguageSpokenDto → { id, name, code }). We sync the
  // dropdown with that source of truth and, if the API is
  // unreachable, fall back to a curated list merged with
  // whatever the user already had saved so the chips never
  // disappear after a refresh.
  const FALLBACK_LANGUAGES = [
    'Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão',
    'Italiano', 'Holandês', 'Mandarim', 'Japonês', 'Coreano',
    'Russo', 'Árabe', 'Hindi', 'Turco', 'Polaco',
    'Sueco', 'Norueguês', 'Dinamarquês', 'Finlandês', 'Grego',
    'Catalão', 'Romeno', 'Checo', 'Húngaro', 'Ucraniano',
  ];
  useEffect(() => {
    let isMounted = true;
    setLoadingLanguages(true);
    request('GET', '/languages-spoken')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        if (list.length) {
          setLanguageOptions(list.map((l) => ({
            label: l.name || l.languageName || l,
            value: l.name || l.languageName || l,
          })));
        } else {
          throw new Error('empty');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        // Use the curated list and merge in any pre-existing
        // languages from the user's saved record so the chips
        // show up even when the API is silent.
        const known = new Set(FALLBACK_LANGUAGES);
        const saved = parseLanguages(form.languagesSpoken);
        const extras = saved.filter((v) => !known.has(v));
        setLanguageOptions([
          ...FALLBACK_LANGUAGES.map((name) => ({ label: name, value: name })),
          ...extras.map((name) => ({ label: name, value: name })),
        ]);
      })
      .finally(() => { if (isMounted) setLoadingLanguages(false); });
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // ── Inline validation (mirrors backend constraints) ──────────
  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Nome é obrigatório.';
    else if (form.firstName.length > 50) next.firstName = 'Nome demasiado longo (máx. 50).';
    if (!form.lastName.trim()) next.lastName = 'Apelido é obrigatório.';
    else if (form.lastName.length > 50) next.lastName = 'Apelido demasiado longo (máx. 50).';
    if (form.userBio.length > 500) next.userBio = 'Bio demasiado longa (máx. 500 caracteres).';
    if (form.nationality.length > 50) next.nationality = 'Nacionalidade demasiado longa (máx. 50).';
    if (form.city.length > 100) next.city = 'Cidade demasiado longa (máx. 100).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Bump a per-username "version" counter in localStorage AND
  // dispatch a same-tab CustomEvent. Other tabs / windows pick up
  // the `storage` event; this tab picks up the CustomEvent. Both
  // let the UserProfile view (and the AppShell avatar) re-fetch
  // the latest profile data and show the new photo immediately.
  const bumpProfilePhotoVersion = useCallback(() => {
    if (!user) return;
    try {
      localStorage.setItem(
        `${user.username}_profilePhotoVersion`,
        String(Date.now()),
      );
    } catch (e) { /* localStorage may be unavailable */ }
    try {
      window.dispatchEvent(
        new CustomEvent('gm:profile-updated', {
          detail: {
            username: user.username,
            firstName: form.firstName,
            lastName: form.lastName,
            profilePhoto: form.profilePhoto || null,
          },
        }),
      );
    } catch (e) { /* no-op */ }
  }, [user]);

  const handlePhotoChange = (file) => {
    setPhotoFile(file);
    setPhotoRemoved(file === null);
    if (file) {
      // Create a blob: URL so the uploader can preview the new file
      // while we still hold the original URL. The uploader handles
      // its own internal state so we don't need to mirror the URL
      // here — `originalPhoto` is enough for the reset-on-save flow.
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!validate()) {
      toast.danger('Verifique os campos em falta antes de guardar.');
      return;
    }
    setSaving(true);
    try {
      // 1. Save the text fields first. We pass an array of languages
      //    so the backend can map them to IDs in the languages_spoken
      //    join table; if the user left it blank we send an empty
      //    array to clear the field.
      const languages = (form.languagesSpoken || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await request('PATCH', `/users/${user.id}/update-profile`, {
        firstName: form.firstName,
        lastName: form.lastName,
        userBio: form.userBio,
        nationality: form.nationality,
        city: form.city,
        gender: form.gender,
        birthDate: form.birthDate || null,
        languagesSpoken: languages.join(', '),
      });

      // 2. Photo: upload only if the user picked a new one, OR delete
      //    if they explicitly removed the existing one.
      if (photoFile) {
        const upRes = await uploadFile('/photos/upload', photoFile);
        const newUrl = upRes?.data?.fileUrl;
        if (newUrl) {
          // We set BOTH `profilePhoto` (canonical backend field) and
          // `profilePicture` (legacy alias used by some components
          // like the Header) so every consumer renders the new photo
          // immediately without a refresh.
          const updated = {
            ...user,
            profilePhoto: newUrl,
            profilePicture: newUrl,
          };
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
          // Notify every other consumer (sidebar avatar, UserProfile
          // page, etc.) that the photo has changed.
          bumpProfilePhotoVersion();
        }
      } else if (photoRemoved && originalPhoto) {
        // The backend exposes DELETE /photos/profile (note: this is
        // /photos + /profile = /photos/profile — matches the
        // controller mapping). Returns 200 with empty body.
        try {
          await request('DELETE', '/photos/profile');
        } catch (delErr) {
          // Best-effort — at worst the photo stays the same and the
          // user can retry.
          console.warn('Photo delete failed:', delErr);
        }
        const updated = { ...user, profilePhoto: null, profilePicture: null };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        bumpProfilePhotoVersion();
      }

      // 3. Cover photo: same flow as the profile photo, but writes
      //    to /photos/cover-upload (and /photos/cover for delete).
      //    We don't touch the auth user object since the cover is
      //    only used on the profile page — but we DO bump the
      //    photo version counter so the UserProfile refetch
      //    happens on the next mount and the new banner shows up.
      if (coverFile) {
        try {
          const upRes = await uploadFile('/photos/cover-upload', coverFile);
          const newCover = upRes?.data?.fileUrl;
          if (newCover) {
            bumpProfilePhotoVersion();
          }
        } catch (coverErr) {
          console.warn('Cover upload failed:', coverErr);
          toast.danger('A capa não foi actualizada. O perfil foi guardado, mas tente novamente.');
        }
      } else if (coverRemoved && originalCover) {
        try {
          await request('DELETE', '/photos/cover');
          bumpProfilePhotoVersion();
        } catch (coverErr) {
          console.warn('Cover delete failed:', coverErr);
        }
      }

      toast.success('Perfil atualizado com sucesso!');

      // Round 46+ — Propagate the updated TEXT fields (firstName,
      // lastName, bio, etc.) to the AuthContext + localStorage so
      // every consumer (header avatar, sidebar, UserProfile, comments
      // author, TravelCard, etc.) renders the new name without
      // requiring a refresh. The photo path is handled separately
      // above (it bumps a version counter) because the URL only
      // changes when the user picks/removes a file.
      const refetched = await request('GET', `/users/${user.id}/detailed`);
      if (refetched?.data) {
        const fresh = {
          ...user,
          ...refetched.data,
          // Make sure the localStorage user object has the canonical
          // auth fields too (id, username, role, token).
          id: user.id, username: user.username, role: user.role, token: user.token,
        };
        setUser(fresh);
        localStorage.setItem('user', JSON.stringify(fresh));
        bumpProfilePhotoVersion();

        // Round 77 (Bug 2): the post-save refetch re-hydrates the
        // form so gender/birthDate are visible after a save (they
        // used to be stripped because UserDetailedProfileDto didn't
        // expose them). The DTO fix on the backend is what makes
        // `refetched.data.gender` and `.birthDate` non-null now, but
        // mirroring into the form here closes the loop without
        // forcing a second round-trip via `loadProfile()`.
        setForm((prev) => ({
          ...prev,
          gender: refetched.data.gender ?? prev.gender ?? '',
          birthDate: refetched.data.birthDate || prev.birthDate || '',
        }));
        // Round 46+ — Also fire a manual `storage` event so any
        // mounted listener (e.g. the AppShell's storage handler)
        // re-renders. The `storage` event normally only fires for
        // cross-tab updates; we dispatch it manually so the same
        // tab also picks up the change.
        try { window.dispatchEvent(new StorageEvent('storage', { key: 'user' })); } catch (_) { /* no-op */ }
      }

      // Refetch the latest profile so `originalPhoto` and the form
      // pick up the new profilePhoto URL from the backend (the photo
      // upload endpoint writes the new path directly to the DB).
      try { await loadProfile(); } catch (e) { /* non-fatal */ }

      // After a short delay, bounce back to the view page.
      setTimeout(() => navigate(`/profile/${user.username}`), 800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao guardar o perfil. Tente novamente.';
      toast.danger(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer size="md" className="gm-edit-profile">
        <div className="gm-edit-profile__state" role="status" aria-live="polite">
          <IconLoader2 size={28} strokeWidth={1.75} className="gm-edit-profile__spin" />
          <p>A carregar o seu perfil…</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="md" className="gm-edit-profile">
      {/* Round 80 — removed the PageHeader with the big
         "Editar Perfil" title, the "Mantenha o seu perfil…"
         subtitle and the user icon. The page is now
         self-explanatory (the form fields make it obvious
         that the user is editing their profile) and the
         "Voltar ao Perfil" + "Guardar Alterações" buttons
         are co-located at the bottom in the action bar, so
         the user sees the primary action right next to the
         cancel/back affordance, the way every modern form
         does. The PageContainer still provides the max-width
         and spacing. */}

      <form onSubmit={handleSave} noValidate className="gm-edit-profile__form">
        {/* Photo card — sits at the top for visual prominence */}
        <motion.section
          className="gm-edit-profile__card gm-edit-profile__card--photo"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Foto de Perfil"
        >
          <header className="gm-edit-profile__card-head">
            <div className="gm-edit-profile__card-icon gm-edit-profile__card-icon--accent">
              <IconCamera size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2>Foto de Perfil</h2>
              <p>A foto aparece no seu perfil, comentários e feed. Use uma imagem quadrada com pelo menos 200×200px.</p>
            </div>
          </header>
          <div className="gm-edit-profile__card-body">
            <ProfilePhotoUploader
              currentPhoto={originalPhoto}
              onFileChange={handlePhotoChange}
              disabled={saving}
            />
            {photoRemoved && originalPhoto && (
              <p className="gm-edit-profile__warning" role="alert">
                <IconAlertCircle size={14} strokeWidth={2} /> A foto actual será removida quando guardar.
              </p>
            )}
          </div>
        </motion.section>

        {/* Cover photo card — the wide banner on /profile/{username}.
            Mirrors the profile photo flow: pick a file or remove
            the existing one. The actual upload happens on save via
            POST /photos/cover-upload (or DELETE /photos/cover). */}
        <motion.section
          className="gm-edit-profile__card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.02 }}
          aria-label="Foto de Capa"
        >
          <header className="gm-edit-profile__card-head">
            <div className="gm-edit-profile__card-icon">
              <IconImage size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2>Foto de Capa</h2>
              <p>A imagem de cabeçalho no seu perfil. Use uma imagem horizontal (recomendado 1600×500px).</p>
            </div>
          </header>
          <div className="gm-edit-profile__card-body">
            <div
              className="gm-edit-profile__cover-preview"
              style={
                coverFile
                  ? { backgroundImage: `url(${URL.createObjectURL(coverFile)})` }
                  : originalCover && !coverRemoved
                  ? { backgroundImage: `url(${toFullMediaUrl(originalCover)})` }
                  : undefined
              }
              aria-label="Pré-visualização da capa"
            >
              {!coverFile && (!originalCover || coverRemoved) && (
                <div className="gm-edit-profile__cover-empty">
                  <IconImage size={32} strokeWidth={1.25} />
                  <span>Sem capa definida. O perfil usará o gradiente padrão.</span>
                </div>
              )}
            </div>
            <div className="gm-edit-profile__cover-actions">
              <label className="gm-edit-profile__cover-pick">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) {
                      setCoverFile(f);
                      setCoverRemoved(false);
                    }
                  }}
                  disabled={saving}
                />
                <span>
                  <IconCamera size={14} strokeWidth={1.75} />
                  {coverFile ? 'Substituir imagem' : 'Escolher imagem'}
                </span>
              </label>
              {originalCover && !coverRemoved && !coverFile && (
                <button
                  type="button"
                  className="gm-edit-profile__cover-remove"
                  onClick={() => { setCoverRemoved(true); setCoverFile(null); }}
                  disabled={saving}
                >
                  <IconX size={14} strokeWidth={2} /> Remover capa
                </button>
              )}
              {coverFile && (
                <button
                  type="button"
                  className="gm-edit-profile__cover-remove"
                  onClick={() => setCoverFile(null)}
                  disabled={saving}
                >
                  <IconX size={14} strokeWidth={2} /> Cancelar
                </button>
              )}
            </div>
            {coverRemoved && originalCover && (
              <p className="gm-edit-profile__warning" role="alert">
                <IconAlertCircle size={14} strokeWidth={2} /> A capa actual será removida quando guardar.
              </p>
            )}
            {coverFile && (
              <p className="gm-edit-profile__hint">
                <IconAlertCircle size={14} strokeWidth={2} /> Nova capa seleccionada. Será enviada quando guardar.
              </p>
            )}
          </div>
        </motion.section>

        {/* Identity card */}
        <motion.section
          className="gm-edit-profile__card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
          aria-label="Identidade"
        >
          <header className="gm-edit-profile__card-head">
            <div className="gm-edit-profile__card-icon">
              <IconUser size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2>Identidade</h2>
              <p>Como o seu nome aparece para outros viajantes.</p>
            </div>
          </header>
          <div className="gm-edit-profile__card-body">
            <div className="gm-edit-profile__grid">
              <div className="gm-edit-profile__field">
                <label htmlFor="firstName">
                  Nome <span className="gm-edit-profile__required">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleField}
                  maxLength={50}
                  className={`gm-edit-profile__input ${errors.firstName ? 'gm-edit-profile__input--error' : ''}`}
                  placeholder="O seu nome"
                  autoComplete="given-name"
                />
                {errors.firstName && (
                  <span className="gm-edit-profile__field-error" role="alert">
                    <IconAlertCircle size={12} strokeWidth={2} /> {errors.firstName}
                  </span>
                )}
              </div>
              <div className="gm-edit-profile__field">
                <label htmlFor="lastName">
                  Apelido <span className="gm-edit-profile__required">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleField}
                  maxLength={50}
                  className={`gm-edit-profile__input ${errors.lastName ? 'gm-edit-profile__input--error' : ''}`}
                  placeholder="O seu apelido"
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <span className="gm-edit-profile__field-error" role="alert">
                    <IconAlertCircle size={12} strokeWidth={2} /> {errors.lastName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Bio + basics card */}
        <motion.section
          className="gm-edit-profile__card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          aria-label="Sobre Mim"
        >
          <header className="gm-edit-profile__card-head">
            <div className="gm-edit-profile__card-icon">
              <IconEdit3 size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2>Sobre Mim</h2>
              <p>Conte um pouco sobre si e o tipo de viagens que gosta de fazer.</p>
            </div>
          </header>
          <div className="gm-edit-profile__card-body">
            <div className="gm-edit-profile__field">
              <label htmlFor="userBio">Bio</label>
              <textarea
                id="userBio"
                name="userBio"
                value={form.userBio}
                onChange={handleField}
                maxLength={500}
                rows={4}
                className={`gm-edit-profile__input gm-edit-profile__textarea ${errors.userBio ? 'gm-edit-profile__input--error' : ''}`}
                placeholder="Conte um pouco sobre si e o tipo de viagens que gosta de fazer…"
              />
              <small className="gm-edit-profile__counter">{form.userBio.length}/500 caracteres</small>
              {errors.userBio && (
                <span className="gm-edit-profile__field-error" role="alert">
                  <IconAlertCircle size={12} strokeWidth={2} /> {errors.userBio}
                </span>
              )}
            </div>
          </div>
        </motion.section>

        {/* Location + personal */}
        <motion.section
          className="gm-edit-profile__card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          aria-label="País e Cidade"
        >
          <header className="gm-edit-profile__card-head">
            <div className="gm-edit-profile__card-icon">
              <IconGlobe size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2>País &amp; Cidade</h2>
              <p>De onde é e onde está agora.</p>
            </div>
          </header>
          <div className="gm-edit-profile__card-body">
            <div className="gm-edit-profile__grid">
              <div className="gm-edit-profile__field">
                <label htmlFor="nationality">País</label>
                <SearchableDropdown
                  id="nationality"
                  options={countryOptions}
                  value={form.nationality}
                  onChange={(v) => {
                    setForm((prev) => ({ ...prev, nationality: v || '', city: '' }));
                    if (errors.nationality) setErrors((prev) => ({ ...prev, nationality: null }));
                  }}
                  placeholder={loadingCountries ? 'A carregar países…' : 'Selecione ou pesquise o país'}
                  disabled={loadingCountries}
                />
                {errors.nationality && (
                  <span className="gm-edit-profile__field-error" role="alert">
                    <IconAlertCircle size={12} strokeWidth={2} /> {errors.nationality}
                  </span>
                )}
              </div>
              <div className="gm-edit-profile__field">
                <label htmlFor="city">Cidade</label>
                <SearchableDropdown
                  id="city"
                  options={cityOptions}
                  value={form.city}
                  onChange={(v) => {
                    setForm((prev) => ({ ...prev, city: v || '' }));
                    if (errors.city) setErrors((prev) => ({ ...prev, city: null }));
                  }}
                  placeholder={
                    !form.nationality
                      ? 'Selecione primeiro o país'
                      : loadingCities
                        ? 'A carregar cidades…'
                        : 'Selecione ou pesquise a cidade'
                  }
                  disabled={!form.nationality || loadingCities}
                />
                {errors.city && (
                  <span className="gm-edit-profile__field-error" role="alert">
                    <IconAlertCircle size={12} strokeWidth={2} /> {errors.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Personal */}
        <motion.section
          className="gm-edit-profile__card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
          aria-label="Detalhes Pessoais"
        >
          <header className="gm-edit-profile__card-head">
            <div className="gm-edit-profile__card-icon">
              <IconCalendar size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2>Detalhes Pessoais</h2>
              <p>Algumas informações opcionais para personalizar a sua experiência.</p>
            </div>
          </header>
          <div className="gm-edit-profile__card-body">
            <div className="gm-edit-profile__grid">
              <div className="gm-edit-profile__field">
                <label htmlFor="gender">Género</label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender || ''}
                  onChange={handleField}
                  className="gm-edit-profile__input gm-edit-profile__select"
                >
                  <option value="">Prefiro não dizer</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="gm-edit-profile__field">
                <label htmlFor="birthDate">Data de nascimento</label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={form.birthDate || ''}
                  onChange={handleField}
                  className="gm-edit-profile__input"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Languages */}
        <motion.section
          className="gm-edit-profile__card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.20 }}
          aria-label="Línguas"
        >
          <header className="gm-edit-profile__card-head">
            <div className="gm-edit-profile__card-icon">
              <IconCompass size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2>Línguas que fala</h2>
              <p>Selecione as línguas no menu. Pode escolher mais do que uma.</p>
            </div>
          </header>
          <div className="gm-edit-profile__card-body">
            <div className="gm-edit-profile__field">
              <label>Línguas</label>
              <MultiSelectDropdown
                options={languageOptions}
                value={parseLanguages(form.languagesSpoken)}
                onChange={(arr) => {
                  setForm((prev) => ({ ...prev, languagesSpoken: arr.join(', ') }));
                  if (errors.languagesSpoken) {
                    setErrors((prev) => ({ ...prev, languagesSpoken: null }));
                  }
                }}
                placeholder={loadingLanguages ? 'A carregar línguas…' : 'Selecione uma ou mais línguas'}
                disabled={loadingLanguages}
              />
            </div>
          </div>
        </motion.section>

        {/* Action bar — Round 80: Cancelar foi removido e
            substituído por "Voltar ao Perfil" (a mesma acção,
            mas a label mais clara que abandona o form sem
            guardar). O "Voltar ao Perfil" + "Guardar
            Alterações" ficam agora lado a lado, com o primary
            (Guardar) à direita, que é onde o user espera
            encontrar a CTA principal em formulários. */}
        <div className="gm-edit-profile__actions">
          <Link
            to={`/profile/${username}`}
            className="gm-profile__btn gm-profile__btn--ghost"
          >
            <IconArrowLeft size={14} strokeWidth={1.75} /> Voltar ao Perfil
          </Link>
          <button
            type="submit"
            className="gm-profile__btn gm-profile__btn--primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <IconLoader2 size={14} strokeWidth={2} className="gm-edit-profile__spin" /> A guardar…
              </>
            ) : (
              <>
                <IconSave size={14} strokeWidth={1.75} /> Guardar Alterações
              </>
            )}
          </button>
        </div>
      </form>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        initialTab="terms"
      />
    </PageContainer>
  );
};

export default EditProfile;
