// src/pages/Register.js — v3.5 Auth redesign
// Premium, open, comfortable. No sidebar, no topbar — AuthLayout provides chrome.
import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  UserPlus,
  Loader2,
  AlertCircle,
  ArrowRight,
  AtSign,
  Globe,
  MapPin,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { translateCountry, translateCity } from '../utils/localization';
import { useToast } from '../components/ui';
import { LegalSheet } from '../components/LegalSheet';
import logo from '../images/Globe-Memories.png';
import '../styles/pages/auth5.css';

/* ── Searchable Dropdown (country / city) ───────────────────── */
const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  error,
  ariaLabel,
}) => {
  const [search, setSearch] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef(null);
  const listboxId = `gm-auth5-select-list-${useId()}`;

  const filtered = options.filter((opt) =>
    String(opt.label).toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = value
    ? options.find((opt) => opt.value === value)?.label || ''
    : '';

  const handleSelect = (val) => {
    onChange(val);
    setShowOptions(false);
    setSearch('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e) => {
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
          setFocusedIndex((p) => (p < filtered.length - 1 ? p + 1 : p));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((p) => (p > 0 ? p - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0) handleSelect(filtered[focusedIndex].value);
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowOptions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stateClass = [
    'gm-auth5__input-wrap',
    'gm-auth5__input-wrap--no-leading',
    showOptions ? 'gm-auth5__input-wrap--open' : '',
    error ? 'gm-auth5__input-wrap--error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className="gm-auth5__select">
      <div
        className={stateClass}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={showOptions}
        aria-controls={listboxId}
        aria-invalid={Boolean(error)}
      >
        <input
          type="text"
          value={selectedLabel || search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => !disabled && setShowOptions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck="false"
        />
        <span className="gm-auth5__select-chevron" aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </div>

      {showOptions && filtered.length > 0 && (
        <ul className="gm-auth5__select-list" role="listbox" id={listboxId}>
          {filtered.map((opt, idx) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              className={[
                'gm-auth5__select-opt',
                focusedIndex === idx ? 'gm-auth5__select-opt--focused' : '',
                value === opt.value ? 'gm-auth5__select-opt--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseDown={() => handleSelect(opt.value)}
              onMouseEnter={() => setFocusedIndex(idx)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}

      {showOptions && filtered.length === 0 && (
        <div className="gm-auth5__select-list">
          <div className="gm-auth5__select-empty">Nenhum resultado encontrado</div>
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    cityId: null,
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    privateProfile: false,
    acceptTerms: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // ── Username availability state ──
  const [usernameState, setUsernameState] = useState({
    status: 'idle', // 'idle' | 'taken' | 'invalid' | 'error'
    message: '',
    suggestions: [],
  });

  // ── Email availability state ──
  const [emailState, setEmailState] = useState({
    status: 'idle', // 'idle' | 'taken' | 'invalid' | 'error'
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  const toast = useToast();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // ── Username availability check (submit-only) ──────────────
  // Hits the existing /users/check-username endpoint and stores the
  // result. Returns true when the username is free, false otherwise.
  // No requests are fired while the user is typing — only on submit.
  const checkUsernameAvailability = useCallback(async () => {
    const username = (formData.username || '').trim();
    if (!username) {
      setUsernameState({ status: 'invalid', message: 'O nome de utilizador é obrigatório.', suggestions: [] });
      return false;
    }
    if (!/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
      setUsernameState({
        status: 'invalid',
        message: 'O nome de utilizador deve ter 3–20 caracteres: letras, números, pontos ou underscore.',
        suggestions: [],
      });
      return false;
    }
    try {
      const params = new URLSearchParams({ username });
      if (formData.firstName) params.append('firstName', formData.firstName);
      if (formData.lastName) params.append('lastName', formData.lastName);
      const res = await request('GET', `/users/check-username?${params.toString()}`);
      const data = res && res.data ? res.data : {};
      if (data.available) {
        setUsernameState({ status: 'idle', message: '', suggestions: [] });
        return true;
      }
      setUsernameState({
        status: 'taken',
        message: 'Este nome de utilizador já está a ser utilizado. Escolha outro.',
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      });
      return false;
    } catch (e) {
      setUsernameState({
        status: 'error',
        message: 'Não foi possível verificar o nome de utilizador. Tente novamente.',
        suggestions: [],
      });
      return false;
    }
  }, [formData.username, formData.firstName, formData.lastName]);

  // ── Email availability check (submit-only) ──────────────────
  // Hits the existing /users/check-email endpoint and stores the
  // result. Returns true when the email is free, false otherwise.
  const checkEmailAvailability = useCallback(async () => {
    const email = (formData.email || '').trim();
    if (!email) {
      setEmailState({ status: 'invalid', message: 'O email é obrigatório.' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailState({ status: 'invalid', message: 'O formato do email é inválido.' });
      return false;
    }
    try {
      const res = await request('GET', `/users/check-email?email=${encodeURIComponent(email)}`);
      const data = res && res.data ? res.data : {};
      if (data.available) {
        setEmailState({ status: 'idle', message: '' });
        return true;
      }
      setEmailState({
        status: 'taken',
        message: 'Este email já está registado. Tente iniciar sessão ou use outro.',
      });
      return false;
    } catch (e) {
      setEmailState({
        status: 'error',
        message: 'Não foi possível verificar o email. Tente novamente.',
      });
      return false;
    }
  }, [formData.email]);

  // Clear stale availability errors as soon as the user edits the
  // field again. This is *not* a network call — it just wipes the
  // message so the form doesn't look broken while the user fixes it.
  useEffect(() => {
    setUsernameState((s) => (s.status === 'idle' ? s : { status: 'idle', message: '', suggestions: [] }));
  }, [formData.username]);
  useEffect(() => {
    setEmailState((s) => (s.status === 'idle' ? s : { status: 'idle', message: '' }));
  }, [formData.email]);

  // ── Countries on mount ──────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    setLoadingCountries(true);
    request('GET', '/cities/countries')
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setCountryOptions(res.data.map((c) => ({ label: translateCountry(c), value: c })));
        }
      })
      .catch(() => {
        if (isMounted) setCountryOptions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCountries(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Cities when country changes ─────────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (!formData.nationality) {
      setCityOptions([]);
      return undefined;
    }
    setLoadingCities(true);
    request('GET', `/cities/by-country?countryName=${encodeURIComponent(formData.nationality)}`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setCityOptions(res.data.map((city) => ({ label: translateCity(city.cityName), value: city.id })));
        }
      })
      .catch(() => {
        if (isMounted) setCityOptions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCities(false);
      });
    return () => {
      isMounted = false;
    };
  }, [formData.nationality]);

  // ── Validators ──────────────────────────────────────────────
  const validateFirstName = (value) => {
    if (!value || !value.trim()) return 'O primeiro nome é obrigatório';
    if (value.trim().length < 2) return 'O primeiro nome deve ter pelo menos 2 caracteres';
    if (value.length > 50) return 'O primeiro nome é demasiado longo';
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) return 'O primeiro nome deve conter apenas letras';
    return '';
  };
  const validateLastName = (value) => {
    if (!value || !value.trim()) return 'O último nome é obrigatório';
    if (value.trim().length < 2) return 'O último nome deve ter pelo menos 2 caracteres';
    if (value.length > 50) return 'O último nome é demasiado longo';
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) return 'O último nome deve conter apenas letras';
    return '';
  };
  const validateUsername = (value) => {
    if (!value || !value.trim()) return 'O nome de utilizador é obrigatório';
    if (value.length < 3) return 'O nome de utilizador deve ter pelo menos 3 caracteres';
    if (value.length > 20) return 'O nome de utilizador deve ter no máximo 20 caracteres';
    if (!/^[a-zA-Z0-9._]+$/.test(value)) {
      return 'O nome de utilizador deve conter apenas letras, números, pontos ou underscore';
    }
    if (/\s/.test(value)) return 'O nome de utilizador não pode conter espaços';
    return '';
  };
  const validateEmail = (value) => {
    if (!value || !value.trim()) return 'O email é obrigatório';
    if (value.length > 100) return 'O email é demasiado longo';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'O formato do email é inválido';
    return '';
  };
  const validatePassword = (value) => {
    if (!value) return 'A palavra-passe é obrigatória';
    if (value.length < 8) return 'A palavra-passe deve ter pelo menos 8 caracteres';
    if (value.length > 128) return 'A palavra-passe é demasiado longa';
    if (!/(?=.*[a-z])/.test(value)) return 'A palavra-passe deve conter pelo menos uma letra minúscula';
    if (!/(?=.*[A-Z])/.test(value)) return 'A palavra-passe deve conter pelo menos uma letra maiúscula';
    if (!/(?=.*\d)/.test(value)) return 'A palavra-passe deve conter pelo menos um dígito';
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(value)) {
      return 'A palavra-passe deve conter pelo menos um caractere especial (!@#$%^&*(),.?":{}|<>)';
    }
    return '';
  };
  const validateConfirmPassword = (value, password) => {
    if (!value) return 'A confirmação da palavra-passe é obrigatória';
    if (value !== password) return 'As palavras-passe não coincidem';
    return '';
  };
  const validateNationality = (value) => (!value ? 'O país é obrigatório' : '');
  const validateCityId = (value) => (!value && value !== 0 ? 'A cidade é obrigatória' : '');
  const validateAcceptTerms = (value) =>
    value ? '' : 'Deve aceitar os Termos e Condições e a Política de Privacidade para continuar';

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        return validateFirstName(value);
      case 'lastName':
        return validateLastName(value);
      case 'username':
        return validateUsername(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(value, formData.password);
      case 'nationality':
        return validateNationality(value);
      case 'cityId':
        return validateCityId(value);
      case 'acceptTerms':
        return validateAcceptTerms(value);
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const errors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) errors[key] = err;
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Sanitizing change handler ───────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // eslint-disable-next-line no-control-regex
    const newValue = type === 'checkbox' ? checked : value.replace(/[ -]/g, '');
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (name !== 'confirmPassword') {
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, newValue) }));
    } else {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
    if (name === 'password') {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleCountryChange = (countryValue) => {
    setFormData((prev) => ({ ...prev, nationality: countryValue, cityId: null }));
    setFieldErrors((prev) => ({
      ...prev,
      nationality: validateField('nationality', countryValue),
      cityId: '',
    }));
  };

  const handleCityChange = (cityValue) => {
    setFormData((prev) => ({ ...prev, cityId: cityValue }));
    setFieldErrors((prev) => ({ ...prev, cityId: validateField('cityId', cityValue) }));
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateAllFields()) {
      toast.danger('Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    if (formData.acceptTerms !== true) {
      toast.danger('Tem de aceitar os Termos e Condições e a Política de Privacidade para continuar.');
      return;
    }

    // Only NOW do we hit the backend to check whether the username /
    // email are already in use. No network calls happen while the
    // user is typing — we wait for the explicit "Create Account"
    // click, just like the user asked.
    setIsSubmitting(true);
    try {
      const [usernameOk, emailOk] = await Promise.all([
        checkUsernameAvailability(),
        checkEmailAvailability(),
      ]);
      if (!usernameOk || !emailOk) {
        // The availability state has already been updated with the
        // concrete error + suggestions. Just stop here so the user
        // can react. Scroll the first error into view.
        const firstError = document.querySelector(
          usernameOk ? '#reg-email-error' : '#reg-username-error',
        );
        if (firstError && typeof firstError.scrollIntoView === 'function') {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      await onRegister();
    } catch (err) {
      console.error('Erro no registo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegister = async () => {
    try {
      const response = await request('POST', '/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        nationality: formData.nationality,
        cityId: formData.cityId,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        privateProfile: formData.privateProfile,
      });

      setAuthHeader(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      toast.success('Registo realizado com sucesso! Bem-vindo!');

      // Profile photo is no longer collected at registration — the user
      // can set it from the Edit Profile page after signing in.

      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      setAuthHeader(null);
      console.error('Erro no registo:', error);

      const fieldNameMapping = {
        firstName: 'firstName',
        lastName: 'lastName',
        nationality: 'nationality',
        cityId: 'cityId',
        email: 'email',
        username: 'username',
        password: 'password',
        passwordConfirm: 'confirmPassword',
      };

      if (error.response?.status === 409) {
        const msg = error.response.data?.message?.toLowerCase() || '';
        if (msg.includes('email') && msg.includes('username')) {
          toast.danger('O email e o nome de utilizador já estão registados. Utilize dados diferentes.');
          setFieldErrors((prev) => ({
            ...prev,
            email: 'Email já registado',
            username: 'Nome de utilizador já existe',
          }));
        } else if (msg.includes('email')) {
          toast.danger('Este email já está registado. Tente iniciar sessão ou use outro email.');
          setFieldErrors((prev) => ({ ...prev, email: 'Email já registado' }));
        } else if (msg.includes('username') || msg.includes('utilizador')) {
          toast.danger('Este nome de utilizador já existe. Escolha outro.');
          setFieldErrors((prev) => ({ ...prev, username: 'Nome de utilizador já existe' }));
        } else {
          toast.danger('Dados já registados. Verifique o email e o nome de utilizador.');
        }
      } else if (error.response?.status === 400) {
        const data = error.response.data;
        const validationErrors = data?.validationErrors;
        const generalMessage = data?.message || 'Dados inválidos. Verifique as informações inseridas.';

        if (validationErrors && typeof validationErrors === 'object') {
          const newErrors = {};
          let has = false;
          Object.entries(validationErrors).forEach(([backendField, msg]) => {
            const ff = fieldNameMapping[backendField] || backendField;
            newErrors[ff] = msg;
            has = true;
          });
          if (has) {
            setFieldErrors((prev) => ({ ...prev, ...newErrors }));
            toast.danger(generalMessage || 'Corrija os erros nos campos destacados.');
          } else {
            toast.danger(generalMessage);
          }
        } else {
          toast.danger(generalMessage);
          if (generalMessage.toLowerCase().includes('username')) {
            setFieldErrors((prev) => ({ ...prev, username: generalMessage }));
          } else if (generalMessage.toLowerCase().includes('email')) {
            setFieldErrors((prev) => ({ ...prev, email: generalMessage }));
          }
        }
      } else if (error.response?.status === 500) {
        toast.danger('Erro no servidor. Tente novamente mais tarde.');
      } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        toast.danger('Erro de ligação. Verifique a sua ligação à internet e tente novamente.');
      } else {
        toast.danger('Erro ao registar. Tente novamente mais tarde.');
      }
    }
  };

  const openLegal = (tab = 'terms') => {
    setLegalTab(tab);
    setShowLegal(true);
  };
  const closeLegal = () => setShowLegal(false);

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      <div className="gm-auth5">
        <header className="gm-auth5__header">
          <span className="gm-auth5__eyebrow">
            <Sparkles size={12} strokeWidth={2} /> Cria a tua conta
          </span>
          {/* Round 59+ — Logo removed from this header. The bigger
              brand mark now lives in the AuthLayout (gm-auth-layout
              __logo-wrap) so it's consistent between /login and
              /register and isn't duplicated. */}
        </header>

        <div className="gm-auth5__card">
          <form onSubmit={handleSubmit} className="gm-auth5__form" noValidate>
            <div className="gm-auth5__divider">
              <span>Os seus dados</span>
            </div>

            {/* Name row */}
            <div className="gm-auth5__grid">
              <div className="gm-auth5__field">
                <label htmlFor="reg-firstname" className="gm-auth5__label">
                  <User size={12} strokeWidth={2} /> Primeiro nome
                  <span className="gm-auth5__required" aria-hidden="true">*</span>
                </label>
                <div className={`gm-auth5__input-wrap${fieldErrors.firstName ? ' gm-auth5__input-wrap--error' : ''}`}>
                  <span className="gm-auth5__input-icon">
                    <User size={18} strokeWidth={1.75} />
                  </span>
                  <input
                    id="reg-firstname"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Insira o seu nome"
                    autoComplete="given-name"
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    aria-describedby={fieldErrors.firstName ? 'reg-firstname-error' : undefined}
                  />
                </div>
                {fieldErrors.firstName && (
                  <div id="reg-firstname-error" className="gm-auth5__error" role="alert">
                    <AlertCircle size={12} strokeWidth={2} /> {fieldErrors.firstName}
                  </div>
                )}
              </div>

              <div className="gm-auth5__field">
                <label htmlFor="reg-lastname" className="gm-auth5__label">
                  <User size={12} strokeWidth={2} /> Último nome
                  <span className="gm-auth5__required" aria-hidden="true">*</span>
                </label>
                <div className={`gm-auth5__input-wrap${fieldErrors.lastName ? ' gm-auth5__input-wrap--error' : ''}`}>
                  <span className="gm-auth5__input-icon">
                    <User size={18} strokeWidth={1.75} />
                  </span>
                  <input
                    id="reg-lastname"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Insira o seu apelido"
                    autoComplete="family-name"
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    aria-describedby={fieldErrors.lastName ? 'reg-lastname-error' : undefined}
                  />
                </div>
                {fieldErrors.lastName && (
                  <div id="reg-lastname-error" className="gm-auth5__error" role="alert">
                    <AlertCircle size={12} strokeWidth={2} /> {fieldErrors.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* Country + city row */}
            <div className="gm-auth5__grid">
              <div className="gm-auth5__field">
                <label htmlFor="reg-country" className="gm-auth5__label">
                  <Globe size={12} strokeWidth={2} /> País
                  <span className="gm-auth5__required" aria-hidden="true">*</span>
                </label>
                <SearchableDropdown
                  options={countryOptions}
                  value={formData.nationality}
                  onChange={handleCountryChange}
                  placeholder={loadingCountries ? 'A carregar países…' : 'Selecione ou pesquise o país'}
                  disabled={loadingCountries}
                  error={fieldErrors.nationality}
                  ariaLabel="País"
                />
                {loadingCountries && (
                  <span className="gm-auth5__select-spinner">
                    <Loader2 size={12} className="gm-spinner" strokeWidth={2} /> A carregar países…
                  </span>
                )}
                {fieldErrors.nationality && (
                  <div className="gm-auth5__error" role="alert">
                    <AlertCircle size={12} strokeWidth={2} /> {fieldErrors.nationality}
                  </div>
                )}
              </div>

              <div className="gm-auth5__field">
                <label htmlFor="reg-city" className="gm-auth5__label">
                  <MapPin size={12} strokeWidth={2} /> Cidade
                  <span className="gm-auth5__required" aria-hidden="true">*</span>
                </label>
                <SearchableDropdown
                  options={cityOptions}
                  value={formData.cityId}
                  onChange={handleCityChange}
                  placeholder={
                    formData.nationality
                      ? loadingCities
                        ? 'A carregar cidades…'
                        : 'Selecione ou pesquise a cidade'
                      : 'Selecione o país primeiro'
                  }
                  disabled={!formData.nationality || loadingCities}
                  error={fieldErrors.cityId}
                  ariaLabel="Cidade"
                />
                {loadingCities && (
                  <span className="gm-auth5__select-spinner">
                    <Loader2 size={12} className="gm-spinner" strokeWidth={2} /> A carregar cidades…
                  </span>
                )}
                {fieldErrors.cityId && (
                  <div className="gm-auth5__error" role="alert">
                    <AlertCircle size={12} strokeWidth={2} /> {fieldErrors.cityId}
                  </div>
                )}
              </div>
            </div>

            {/* Username + email row */}
            <div className="gm-auth5__grid">
              <div className="gm-auth5__field">
                <label htmlFor="reg-username" className="gm-auth5__label">
                  <AtSign size={12} strokeWidth={2} /> Nome de utilizador
                  <span className="gm-auth5__required" aria-hidden="true">*</span>
                </label>
                <div
                  className={[
                    'gm-auth5__input-wrap',
                    (fieldErrors.username || usernameState.status === 'taken' || usernameState.status === 'invalid' || usernameState.status === 'error') ? 'gm-auth5__input-wrap--error' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="gm-auth5__input-icon">
                    <AtSign size={18} strokeWidth={1.75} />
                  </span>
                  <input
                    id="reg-username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Escolha um nome de utilizador"
                    autoComplete="username"
                    aria-invalid={Boolean(fieldErrors.username) || usernameState.status === 'taken' || usernameState.status === 'invalid' || usernameState.status === 'error'}
                    aria-describedby={
                      fieldErrors.username ? 'reg-username-error'
                      : usernameState.status === 'taken' && usernameState.suggestions.length ? 'reg-username-suggestions'
                      : 'reg-username-hint'
                    }
                  />
                </div>
                {(fieldErrors.username || usernameState.message) ? (
                  <div id="reg-username-error" className="gm-auth5__error" role="alert">
                    <AlertCircle size={12} strokeWidth={2} /> {fieldErrors.username || usernameState.message}
                  </div>
                ) : (
                  <div id="reg-username-hint" className="gm-auth5__hint">
                    3–20 caracteres: letras, números, pontos ou underscore.
                  </div>
                )}
                {usernameState.status === 'taken' && usernameState.suggestions.length > 0 && (
                  <div id="reg-username-suggestions" className="gm-auth5__suggestions" role="group" aria-label="Sugestões de nome de utilizador">
                    <span className="gm-auth5__suggestions-label">Sugestões:</span>
                    <div className="gm-auth5__suggestions-list">
                      {usernameState.suggestions.slice(0, 5).map((s) => (
                        <button
                          type="button"
                          key={s}
                          className="gm-auth5__suggestion-chip"
                          onClick={() => setFormData((prev) => ({ ...prev, username: s }))}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="gm-auth5__field">
                <label htmlFor="reg-email" className="gm-auth5__label">
                  <Mail size={12} strokeWidth={2} /> Email
                  <span className="gm-auth5__required" aria-hidden="true">*</span>
                </label>
                <div
                  className={[
                    'gm-auth5__input-wrap',
                    (fieldErrors.email || emailState.status === 'taken' || emailState.status === 'invalid' || emailState.status === 'error') ? 'gm-auth5__input-wrap--error' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="gm-auth5__input-icon">
                    <Mail size={18} strokeWidth={1.75} />
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Insira o seu email"
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.email) || emailState.status === 'taken' || emailState.status === 'invalid' || emailState.status === 'error'}
                    aria-describedby={fieldErrors.email || emailState.message ? 'reg-email-error' : undefined}
                  />
                </div>
                {(fieldErrors.email || emailState.message) && (
                  <div
                    id="reg-email-error"
                    className="gm-auth5__error"
                    role="alert"
                  >
                    <AlertCircle size={12} strokeWidth={2} />
                    {fieldErrors.email || emailState.message}
                  </div>
                )}
              </div>
            </div>

            {/* Password row */}
            <div className="gm-auth5__grid">
              <div className="gm-auth5__field">
                <label htmlFor="reg-password" className="gm-auth5__label">
                  <Lock size={12} strokeWidth={2} /> Palavra-passe
                  <span className="gm-auth5__required" aria-hidden="true">*</span>
                </label>
                <div className={`gm-auth5__input-wrap${fieldErrors.password ? ' gm-auth5__input-wrap--error' : ''}`}>
                  <span className="gm-auth5__input-icon">
                    <Lock size={18} strokeWidth={1.75} />
                  </span>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Insira a sua palavra-passe"
                    autoComplete="new-password"
                    className="has-icon-right"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'reg-password-error' : 'reg-password-hint'}
                  />
                  <button
                    type="button"
                    className="gm-auth5__toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <div id="reg-password-error" className="gm-auth5__error" role="alert">
                    <AlertCircle size={12} strokeWidth={2} /> {fieldErrors.password}
                  </div>
                ) : (
                  <div id="reg-password-hint" className="gm-auth5__hint">
                    Mín. 8 caracteres com maiúscula, minúscula, número e símbolo.
                  </div>
                )}
              </div>

              <div className="gm-auth5__field">
                <label htmlFor="reg-confirm" className="gm-auth5__label">
                  <Lock size={12} strokeWidth={2} /> Confirmar palavra-passe
                  <span className="gm-auth5__required" aria-hidden="true">*</span>
                </label>
                <div className={`gm-auth5__input-wrap${fieldErrors.confirmPassword ? ' gm-auth5__input-wrap--error' : ''}`}>
                  <span className="gm-auth5__input-icon">
                    <Lock size={18} strokeWidth={1.75} />
                  </span>
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirme a sua palavra-passe"
                    autoComplete="new-password"
                    className="has-icon-right"
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={fieldErrors.confirmPassword ? 'reg-confirm-error' : undefined}
                  />
                  <button
                    type="button"
                    className="gm-auth5__toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <div id="reg-confirm-error" className="gm-auth5__error" role="alert">
                    <AlertCircle size={12} strokeWidth={2} /> {fieldErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="gm-auth5__terms" htmlFor="reg-acceptTerms">
              <input
                type="checkbox"
                id="reg-acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
              />
              <span className="gm-auth5__terms-text">
                Aceito os{' '}
                <button
                  type="button"
                  className="gm-auth5__terms-link"
                  onClick={(e) => { e.preventDefault(); openLegal('terms'); }}
                >
                  Termos e Condições
                </button>{' '}
                e a{' '}
                <button
                  type="button"
                  className="gm-auth5__terms-link"
                  onClick={(e) => { e.preventDefault(); openLegal('privacy'); }}
                >
                  Política de Privacidade
                </button>
                .
                <span className="gm-auth5__required" aria-hidden="true"> *</span>
              </span>
            </label>
            {fieldErrors.acceptTerms && (
              <div className="gm-auth5__error" role="alert" style={{ marginTop: -8 }}>
                <AlertCircle size={12} strokeWidth={2} /> {fieldErrors.acceptTerms}
              </div>
            )}

            <button
              type="submit"
              className="gm-auth5__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="gm-spinner" strokeWidth={2} />
              ) : (
                <UserPlus size={18} strokeWidth={2} />
              )}
              <span>{isSubmitting ? 'A registar…' : 'Criar conta'}</span>
              {!isSubmitting && <ArrowRight size={18} strokeWidth={2} />}
            </button>
          </form>

          <div className="gm-auth5__footer">
            <span>Já tem conta?</span>
            <Link to="/login" className="gm-auth5__footer-link">
              Iniciar sessão <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

      <LegalSheet isOpen={showLegal} onClose={closeLegal} initialTab={legalTab} />
    </>
  );
};

export default Register;
