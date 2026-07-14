import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader, uploadFile } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import TermsModal from '../components/TermsModal';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';

import '../styles/pages/register-travel.css';
import logoImg from '../images/Globe-Memories.png';

// Modern travel-themed background video (optional, fallback to gradient if not loaded)
const YOUTUBE_BG_URL = 'https://www.youtube.com/embed/YFhwEJosUsU?autoplay=1&mute=1&controls=0&loop=1&playlist=YFhwEJosUsU&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1';


// Custom Searchable Dropdown with improved UX (matching register design)
const SearchableDropdown = ({ options, value, onChange, placeholder, disabled, labelKey = 'label', valueKey = 'value', error }) => {
  const [search, setSearch] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = React.useRef(null);

  const filteredOptions = options.filter(opt =>
    opt[labelKey].toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = value ? options.find(opt => opt[valueKey] === value)?.[labelKey] || '' : '';

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

// Componente de Toast para feedback
const Toast = ({ message, type, onClose, show }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2400); // 2400ms = 2.4 segundos
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`toast ${type}`}>
      {message}
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
    acceptTerms: false
  });

  const [fieldErrors, setFieldErrors] = useState({});
  // Async country/city dropdown state
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  // Fetch countries on mount (axios_helper best practice)
  useEffect(() => {
    let isMounted = true;
    setLoadingCountries(true);
    request('GET', '/cities/countries')
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          setCountryOptions(res.data.map(c => ({ label: c, value: c })));
        }
      })
      .catch(() => {
        if (isMounted) setCountryOptions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCountries(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Fetch cities when nationality changes (axios_helper best practice)
  useEffect(() => {
    let isMounted = true;
    if (!formData.nationality) {
      setCityOptions([]);
      return;
    }
    setLoadingCities(true);
    request('GET', `/cities/by-country?countryName=${encodeURIComponent(formData.nationality)}`)
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          // Display city name but store city ID as value
          setCityOptions(res.data.map(city => ({ label: city.cityName, value: city.id })));
        }
      })
      .catch(() => {
        if (isMounted) setCityOptions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCities(false);
      });
    return () => { isMounted = false; };
  }, [formData.nationality]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Optional profile photo picked during registration. We upload it
  // AFTER the user account is created, so the photo upload is part of
  // a 2-step flow (POST /register → POST /photos/upload) and the form
  // can be submitted even without picking a photo.
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState('terms');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Estados para o pop-up de instalação (igual ao Login)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [supportsBeforeInstallPrompt, setSupportsBeforeInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Lógica para o pop-up de instalação (copiada do Login)
  useEffect(() => {
    // Detectar se é iOS
    const userAgent = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Detectar se o navegador suporta beforeinstallprompt
    const supportsPrompt = 'onbeforeinstallprompt' in window;
    setSupportsBeforeInstallPrompt(supportsPrompt);

    // Detectar se o app está em modo standalone (indicando que foi instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isInstalledInLocalStorage = localStorage.getItem('isInstalled') === 'true';
    setIsInstalled(isStandalone || isInstalledInLocalStorage);

    // Detectar se é um dispositivo móvel
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && !isInstalled) {
      setShowInstallPrompt(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      localStorage.setItem('isInstalled', 'true');
      setIsInstalled(true);
      setShowInstallPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => {});
    };
  }, [isMobile, isInstalled]);

  // Funções de validação
  const validateFirstName = (value) => {
    if (!value.trim()) return 'O primeiro nome é obrigatório';
    if (value.trim().length < 2) return 'O primeiro nome deve ter pelo menos 2 caracteres';
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) return 'O primeiro nome deve conter apenas letras';
    return '';
  };

  const validateLastName = (value) => {
    if (!value.trim()) return 'O último nome é obrigatório';
    if (value.trim().length < 2) return 'O último nome deve ter pelo menos 2 caracteres';
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) return 'O último nome deve conter apenas letras';
    return '';
  };

  const validateUsername = (value) => {
    if (!value.trim()) return 'O nome de utilizador é obrigatório';
    if (value.length < 3) return 'O nome de utilizador deve ter pelo menos 3 caracteres';
    if (value.length > 20) return 'O nome de utilizador deve ter no máximo 20 caracteres';
    if (!/^[a-zA-Z0-9._]+$/.test(value)) return 'O nome de utilizador deve conter apenas letras, números, pontos ou underscore';
    if (/\s/.test(value)) return 'O nome de utilizador não pode conter espaços';
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) return 'O email é obrigatório';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'O formato do email é inválido';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'A palavra-passe é obrigatória';
    if (value.length < 8) return 'A palavra-passe deve ter pelo menos 8 caracteres';
    if (!/(?=.*[a-z])/.test(value)) return 'A palavra-passe deve conter pelo menos uma letra minúscula';
    if (!/(?=.*[A-Z])/.test(value)) return 'A palavra-passe deve conter pelo menos uma letra maiúscula';
    if (!/(?=.*\d)/.test(value)) return 'A palavra-passe deve conter pelo menos um dígito';
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(value)) return 'A palavra-passe deve conter pelo menos um caractere especial (!@#$%^&*(),.?":{}|<>)';
    return '';
  };

  const validateConfirmPassword = (value, password) => {
    if (!value) return 'A confirmação da palavra-passe é obrigatória';
    if (value !== password) return 'As palavras-passe não coincidem';
    return '';
  };

  const validateNationality = (value) => {
    if (!value) return 'O país é obrigatório';
    return '';
  };

  const validateCity = (value) => {
    if (!value) return 'A cidade é obrigatória';
    return '';
  };

  const validateCityId = (value) => {
    if (!value && value !== 0) return 'A cidade é obrigatória';
    return '';
  };

  const validateAcceptTerms = (value) => {
    if (!value) return 'Deve aceitar os Termos e Condições e a Política de Privacidade';
    return '';
  };

  // Função para validar campo individual
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'firstName':
        error = validateFirstName(value);
        break;
      case 'lastName':
        error = validateLastName(value);
        break;
      case 'username':
        error = validateUsername(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(value, formData.password);
        break;
      case 'nationality':
        error = validateNationality(value);
        break;
      case 'city':
        error = validateCity(value);
        break;
      case 'cityId':
        error = validateCityId(value);
        break;
      case 'acceptTerms':
        error = validateAcceptTerms(value);
        break;
      default:
        break;
    }
    return error;
  };

  // Função para validar todos os campos
  const validateAllFields = () => {
    const errors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para mostrar toast
  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('isInstalled', 'true');
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (error) {
        // Silent fail - user experience not affected
      }
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  const openTermsModal = (tab = 'terms') => {
    setTermsModalTab(tab);
    setShowTermsModal(true);
  };

  const closeTermsModal = () => {
    setShowTermsModal(false);
  };

  // General handler for normal inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));
    // Validar campo em tempo real (excepto confirmPassword por segurança)
    if (name !== 'confirmPassword') {
      const error = validateField(name, newValue);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }));
    }
    if (name === 'password') {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }));
    }
    // Limpar cidade quando país mudar
    if (name === 'nationality') {
      setFormData(prevData => ({
        ...prevData,
        cityId: null
      }));
      setFieldErrors(prev => ({
        ...prev,
        cityId: ''
      }));
    }
  };

  // Handler for SearchableDropdown country
  const handleCountryChange = (countryValue) => {
    setFormData(prev => ({ ...prev, nationality: countryValue, cityId: null }));
    setFieldErrors(prev => ({ ...prev, nationality: validateField('nationality', countryValue), cityId: '' }));
  };
  // Handler for SearchableDropdown city
  const handleCityChange = (cityValue) => {
    setFormData(prev => ({ ...prev, cityId: cityValue }));
    setFieldErrors(prev => ({ ...prev, cityId: validateField('cityId', cityValue) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validar todos os campos
    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário antes de continuar.', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await onRegister(e, formData.firstName, formData.lastName, formData.nationality, formData.email, formData.username, formData.password);
    } catch (error) {
      console.error('Erro no registo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegister = async (event, firstName, lastName, nationality, email, username, password) => {
    event.preventDefault();
    
    try {
      const response = await request(
        "POST",
        "/register",
        {
          firstName: firstName,
          lastName: lastName,
          nationality: nationality,
          cityId: formData.cityId,
          email: email,
          username: username,
          password: password,
          passwordConfirm: formData.confirmPassword,
          privateProfile: formData.privateProfile
        }
      );
      
      setAuthHeader(response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
      showToast('Registo realizado com sucesso! Bem-vindo!', 'success');

      // 2-step profile photo upload: if the user picked a photo during
      // registration, POST it now that the account exists. We update
      // the in-memory + localStorage user with the new photo URL so
      // the rest of the app reflects it without a refresh.
      if (profilePhotoFile) {
        try {
          const photoRes = await uploadFile('/photos/upload', profilePhotoFile);
          // uploadFile returns the axios response; the backend returns
          // a FileUploadResponseDto with .data.fileUrl and .data.publicUrl
          const fileUrl = photoRes?.data?.fileUrl;
          if (fileUrl) {
            // We set BOTH `profilePhoto` (canonical backend field) and
            // `profilePicture` (legacy alias used by the Header/Sidebar/
            // Home) so every consumer reflects the new photo without a
            // refresh.
            const updatedUser = {
              ...response.data,
              profilePhoto: fileUrl,
              profilePicture: fileUrl,
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (photoErr) {
          // Photo upload is best-effort — the account is already
          // created and the user can add a photo later from their
          // profile page. We just log + show a soft warning.
          console.warn('Profile photo upload failed (account was created):', photoErr);
          showToast('Conta criada, mas não foi possível carregar a foto. Pode adicioná-la mais tarde no seu perfil.', 'info');
        }
      }
      
      // Aguardar um pouco antes de redirecionar para mostrar o toast
      setTimeout(() => {
        navigate("/");
      }, 1500);
      
    } catch (error) {
      setAuthHeader(null);
      console.error('Erro no registo:', error);
      
      // Map backend field names to frontend field names
      const fieldNameMapping = {
        firstName: 'firstName',
        lastName: 'lastName',
        nationality: 'nationality',
        cityId: 'cityId',
        email: 'email',
        username: 'username',
        password: 'password',
        passwordConfirm: 'confirmPassword'
      };

      // Verificar tipos específicos de erro
      if (error.response?.status === 409) {
        const errorMessage = error.response.data?.message?.toLowerCase() || '';
        
        if (errorMessage.includes('email') && errorMessage.includes('username')) {
          showToast('O email e o nome de utilizador já estão registados. Utilize dados diferentes.', 'error');
          setFieldErrors(prev => ({ 
            ...prev, 
            email: 'Email já registado',
            username: 'Nome de utilizador já existe'
          }));
        } else if (errorMessage.includes('email')) {
          showToast('Este email já está registado. Tente iniciar sessão ou use outro email.', 'error');
          setFieldErrors(prev => ({ ...prev, email: 'Email já registado' }));
        } else if (errorMessage.includes('username') || errorMessage.includes('utilizador')) {
          showToast('Este nome de utilizador já existe. Escolha outro.', 'error');
          setFieldErrors(prev => ({ ...prev, username: 'Nome de utilizador já existe' }));
        } else {
          showToast('Dados já registados. Verifique o email e o nome de utilizador.', 'error');
        }
      } else if (error.response?.status === 400) {
        const responseData = error.response.data;
        const validationErrors = responseData?.validationErrors;
        const generalMessage = responseData?.message || 'Dados inválidos. Verifique as informações inseridas.';
        
        // If there are specific validation errors from the backend, map them to fields
        if (validationErrors && typeof validationErrors === 'object') {
          const newFieldErrors = {};
          let hasErrors = false;
          
          // Map backend field errors to frontend field names
          Object.entries(validationErrors).forEach(([backendField, errorMessage]) => {
            const frontendField = fieldNameMapping[backendField] || backendField;
            newFieldErrors[frontendField] = errorMessage;
            hasErrors = true;
          });
          
          if (hasErrors) {
            setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));
            showToast(generalMessage || 'Corrija os erros nos campos destacados.', 'error');
          } else {
            showToast(generalMessage, 'error');
          }
        } else {
          // If no validation errors object, check if message contains specific info
          showToast(generalMessage, 'error');
          
          // Try to identify field from message
          if (generalMessage.toLowerCase().includes('username')) {
            setFieldErrors(prev => ({ ...prev, username: generalMessage }));
          } else if (generalMessage.toLowerCase().includes('email')) {
            setFieldErrors(prev => ({ ...prev, email: generalMessage }));
          }
        }
      } else if (error.response?.status === 500) {
        showToast('Erro no servidor. Tente novamente mais tarde.', 'error');
      } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        showToast('Erro de ligação. Verifique a sua ligação à internet e tente novamente.', 'error');
      } else {
        showToast('Erro ao registar. Tente novamente mais tarde.', 'error');
      }
    }
  };

  return (
    <>
      {/* Travel-themed animated background */}
      <div className="login-travel-bg">
        <iframe
          src={YOUTUBE_BG_URL}
          title="Register Background Video"
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
          tabIndex="-1"
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
        />
        {/* Gradient overlay for glassmorphism effect */}
        <div className="login-travel-gradient" />
        {/* Travel icons floating animation */}
        <div className="travel-icons-floating">
          <span role="img" aria-label="airplane">✈️</span>
          <span role="img" aria-label="palm">🌴</span>
          <span role="img" aria-label="mountain">🏔️</span>
          <span role="img" aria-label="camera">📷</span>
          <span role="img" aria-label="beach">🏖️</span>
        </div>
      </div>
      
      <div className="login-travel-wrapper">
        <div className="login-travel-card">
          <div className="login-travel-header">
            <img src={logoImg} alt="Globe Memories Logo" className="travel-logo-img" /><br></br>
            <div className="travel-slogan">Viaje. Explore. Lembre. Compartilhe.</div>
          </div>
          <form onSubmit={handleSubmit} className="login-travel-form">

            {/* ── Profile photo (optional) ───────────────────────────
                The user can pick a photo now or upload one later from
                their profile page. We upload it AFTER the account is
                created, so the submit flow stays a 2-step POST. */}
            <div className="register-photo-section">
              <ProfilePhotoUploader
                currentPhoto={null}
                onFileChange={setProfilePhotoFile}
                disabled={isSubmitting}
              />
              <p className="register-photo-hint">
                📸 A foto de perfil é opcional — pode adicioná-la ou trocá-la mais tarde.
              </p>
            </div>

            {/* Primeira linha: Primeiro Nome + Último Nome */}
            <div className="form-row">
              <div className="input-group">
                <label>Primeiro Nome: <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Insira o seu Nome *"
                  className={fieldErrors.firstName ? 'input-error' : ''}
                  required
                />
                {fieldErrors.firstName && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.firstName}
                  </div>
                )}
              </div>
              <div className="input-group">
                <label>Último Nome: <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Insira o seu Apelido *"
                  className={fieldErrors.lastName ? 'input-error' : ''}
                  required
                />
                {fieldErrors.lastName && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* Segunda linha: País + Cidade (com dropdowns de busca) */}
            <div className="form-row">
              <div className="input-group">
                <label>Selecione o seu País: <span style={{color: 'red'}}>*</span></label>
                <SearchableDropdown
                  options={countryOptions}
                  value={formData.nationality}
                  onChange={handleCountryChange}
                  placeholder={loadingCountries ? 'Carregando países...' : 'Selecione ou pesquise o país *'}
                  disabled={loadingCountries}
                  error={fieldErrors.nationality}
                />
                {fieldErrors.nationality && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.nationality}
                  </div>
                )}
              </div>
              <div className="input-group">
                <label>Selecione a sua Cidade: <span style={{color: 'red'}}>*</span></label>
                <SearchableDropdown
                  options={cityOptions}
                  value={formData.cityId}
                  onChange={handleCityChange}
                  placeholder={formData.nationality ? (loadingCities ? 'Carregando cidades...' : 'Selecione ou pesquise a cidade *') : 'Selecione o país primeiro'}
                  disabled={!formData.nationality || loadingCities}
                  error={fieldErrors.cityId}
                />
                {fieldErrors.cityId && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.cityId}
                  </div>
                )}
              </div>
            </div>

            {/* Terceira linha: Nome de Utilizador + Email */}
            <div className="form-row">
              <div className="input-group">
                <label>Nome de Utilizador: <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Escolha um nome de utilizador *"
                  className={fieldErrors.username ? 'input-error' : ''}
                  required
                />
                {fieldErrors.username && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.username}
                  </div>
                )}
                <div className="input-hint">3-20 caracteres, apenas letras, números, pontos ou underscore</div>
              </div>
              <div className="input-group">
                <label>Email: <span style={{color: 'red'}}>*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Insira o seu email *"
                  className={fieldErrors.email ? 'input-error' : ''}
                  required
                />
                {fieldErrors.email && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.email}
                  </div>
                )}
              </div>
            </div>

            {/* Quarta linha: Palavra-passe + Confirmar */}
            <div className="form-row">
              <div className="input-group">
                <label>Palavra-passe: <span style={{color: 'red'}}>*</span></label>
                <div className="password-group-inline">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Insira a sua palavra-passe *"
                    className={fieldErrors.password ? 'input-error' : ''}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.password}
                  </div>
                )}
                <div className="input-hint">Mín. 8 caracteres com maiúscula, minúscula, número e símbolo</div>
              </div>
              <div className="input-group">
                <label>Confirmar palavra-passe: <span style={{color: 'red'}}>*</span></label>
                <div className="password-group-inline">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirme a sua palavra-passe *"
                    className={fieldErrors.confirmPassword ? 'input-error' : ''}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            {/* Quinta linha: Checkbox de Termos */}
            <div className="terms-section">
              <div className="checkbox-group" style={{display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px'}}>
                <label htmlFor="acceptTerms" style={{cursor: 'pointer', lineHeight: '1.4', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
                  <div style={{position: 'relative', display: 'inline-block'}}>
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      required
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        cursor: 'pointer',
                        height: 0,
                        width: 0
                      }}
                    />
                    <span style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      backgroundColor: formData.acceptTerms ? '#007bff' : 'rgba(255, 255, 255, 0.15)',
                      border: formData.acceptTerms ? '2px solid #007bff' : '2px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: '4px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      boxShadow: formData.acceptTerms ? '0 0 10px rgba(0, 123, 255, 0.5)' : '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}>
                      {formData.acceptTerms && (
                        <svg 
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '12px',
                            height: '12px',
                            fill: 'white',
                            pointerEvents: 'none'
                          }}
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </span>
                  </div>
                  <span>
                    <span style={{color: 'red'}}>*</span> Aceito os{' '}
                    <span 
                      className="terms-link" 
                      onClick={() => openTermsModal('terms')}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && openTermsModal('terms')}
                      style={{color: '#007bff', textDecoration: 'underline', cursor: 'pointer'}}
                    >
                      Termos e Condições
                    </span>{' '}
                    e a{' '}
                    <span 
                      className="terms-link" 
                      onClick={() => openTermsModal('privacy')}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && openTermsModal('privacy')}
                      style={{color: '#007bff', textDecoration: 'underline', cursor: 'pointer'}}
                    >
                      Política de Privacidade
                    </span>
                  </span>
                </label>
              </div>
              {fieldErrors.acceptTerms && (
                <div className="field-error" style={{marginTop: '5px'}}>
                  <FaExclamationCircle style={{ marginRight: '5px' }} />
                  {fieldErrors.acceptTerms}
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="error-message">
                <FaExclamationCircle /> {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="success-message">
                <FaCheckCircle /> {successMessage}
              </div>
            )}

            <button type="submit" className="login-travel-btn" disabled={isSubmitting}>
              <span style={{display:'inline-flex',alignItems:'center',gap:'0.5em'}}>
                {isSubmitting ? 'A Registar...' : 'Registar'}
              </span>
            </button>

            <div className="login-travel-register">
              <span>Já tem conta?</span>
              <Link to="/login" className="register-btn">Iniciar Sessão</Link>
            </div>
          </form>

        </div>
      </div>

      {/* Pop-up de instalação */}
      {showInstallPrompt && !isInstalled && (
        <div className="install-prompt-overlay" onClick={handleDismiss}>
          <div className="install-prompt" onClick={(e) => e.stopPropagation()} style={{ width: '95%', maxWidth: '600px' }}>
            <button className="install-prompt-close" onClick={handleDismiss}>
              ✕
            </button>
            
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <img 
                src="./icons/favicon.jpg" 
                alt="Globe Memories" 
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '25px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  marginBottom: '15px'
                }}
              />
              <h2 style={{
                color: '#333',
                fontSize: '1.6rem',
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>📱 Instale o Globe Memories!</h2>
              <p style={{
                color: '#666',
                fontSize: '0.95rem',
                margin: 0
              }}>
                Acesso rápido e offline
              </p>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '20px',
              border: '1px solid #e9ecef'
            }}>
              {supportsBeforeInstallPrompt ? (
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '1.3rem', marginTop: '2px' }}>⚡</span>
                    <div>
                      <p style={{
                        color: '#333',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        margin: '0 0 4px 0'
                      }}>Acesso Instantâneo</p>
                      <p style={{
                        color: '#666',
                        fontSize: '0.85rem',
                        margin: 0
                      }}>Abra o app direto do seu ecrã inicial</p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '1.3rem', marginTop: '2px' }}>🔒</span>
                    <div>
                      <p style={{
                        color: '#333',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        margin: '0 0 4px 0'
                      }}>Segurança Total</p>
                      <p style={{
                        color: '#666',
                        fontSize: '0.85rem',
                        margin: 0
                      }}>Funciona offline em muitos casos</p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '1.3rem', marginTop: '2px' }}>✨</span>
                    <div>
                      <p style={{
                        color: '#333',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        margin: '0 0 4px 0'
                      }}>Experiência Premium</p>
                      <p style={{
                        color: '#666',
                        fontSize: '0.85rem',
                        margin: 0
                      }}>Interface nativa e otimizada</p>
                    </div>
                  </div>
                </div>
              ) : isIOS ? (
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '15px'
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>📤</span>
                    <div>
                      <p style={{
                        color: '#333',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        margin: '0 0 4px 0'
                      }}>Passo 1: Toque em Partilhar</p>
                      <p style={{
                        color: '#666',
                        fontSize: '0.85rem',
                        margin: 0
                      }}>Botão na barra inferior do navegador</p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>➕</span>
                    <div>
                      <p style={{
                        color: '#333',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        margin: '0 0 4px 0'
                      }}>Passo 2: Selecione "Ecrã Principal"</p>
                      <p style={{
                        color: '#666',
                        fontSize: '0.85rem',
                        margin: 0
                      }}>Opção disponível no menu de partilha</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '15px'
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>⋮</span>
                    <div>
                      <p style={{
                        color: '#333',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        margin: '0 0 4px 0'
                      }}>Passo 1: Abra o Menu</p>
                      <p style={{
                        color: '#666',
                        fontSize: '0.85rem',
                        margin: 0
                      }}>Ícone com três pontos no canto superior</p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>➕</span>
                    <div>
                      <p style={{
                        color: '#333',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        margin: '0 0 4px 0'
                      }}>Passo 2: "Instalar" ou "Ecrã inicial"</p>
                      <p style={{
                        color: '#666',
                        fontSize: '0.85rem',
                        margin: 0
                      }}>Procure esta opção no menu</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleDismiss}
                style={{
                  padding: '12px 25px',
                  borderRadius: '25px',
                  border: '2px solid #ddd',
                  background: 'transparent',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#999';
                  e.target.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#ddd';
                  e.target.style.color = '#666';
                }}
              >
                Agora Não
              </button>
              {supportsBeforeInstallPrompt && (
                <button
                  onClick={handleInstall}
                  style={{
                    padding: '12px 25px',
                    borderRadius: '25px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #007bff, #0056b3)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0,123,255,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0,123,255,0.3)';
                  }}
                >
                  ✨ Instalar Agora
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast para feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />

      {/* Modal de Termos e Condições */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={closeTermsModal}
        initialTab={termsModalTab}
      />
    </>
  );
};

export default Register;
