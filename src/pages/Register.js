import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import TermsModal from '../components/TermsModal';

import '../styles/pages/register-travel.css';
import logoImg from '../images/Globe-Memories.png';

// Modern travel-themed background video (optional, fallback to gradient if not loaded)
const YOUTUBE_BG_URL = 'https://www.youtube.com/embed/YFhwEJosUsU?autoplay=1&mute=1&controls=0&loop=1&playlist=YFhwEJosUsU&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1';

// Lista de países
const countries = [
  'Portugal', 'Brasil', 'Espanha', 'França', 'Alemanha', 'Reino Unido', 'Itália', 'Estados Unidos', 
  'Canadá', 'Holanda', 'Bélgica', 'Suíça', 'Áustria', 'Noruega', 'Suécia', 'Dinamarca', 'Finlândia',
  'Polônia', 'República Checa', 'Hungria', 'Grécia', 'Turquia', 'Rússia', 'Japão', 'China', 'Coreia do Sul',
  'Austrália', 'Nova Zelândia', 'Argentina', 'Chile', 'México', 'Colômbia', 'Peru', 'Outros'
];

// Lista de cidades por país (simplificada para principais cidades)
const citiesByCountry = {
  'Portugal': ['Lisboa', 'Porto', 'Braga', 'Coimbra', 'Aveiro', 'Faro', 'Funchal', 'Évora'],
  'Brasil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Curitiba', 'Recife'],
  'Espanha': ['Madrid', 'Barcelona', 'Sevilha', 'Valência', 'Bilbao', 'Granada', 'Toledo', 'Salamanca'],
  'França': ['Paris', 'Lyon', 'Marselha', 'Nice', 'Toulouse', 'Bordeaux', 'Nantes', 'Estrasburgo'],
  'Alemanha': ['Berlim', 'Munique', 'Hamburgo', 'Colônia', 'Frankfurt', 'Stuttgart', 'Dresden', 'Leipzig'],
  'Reino Unido': ['Londres', 'Manchester', 'Birmingham', 'Liverpool', 'Bristol', 'Edinburgh', 'Glasgow', 'Cardiff'],
  'Itália': ['Roma', 'Milão', 'Nápoles', 'Turim', 'Palermo', 'Génova', 'Bologna', 'Florença'],
  'Estados Unidos': ['Nova York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Las Vegas', 'Boston'],
  'Outros': ['Outra']
};

// Componente de Toast para feedback
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

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
    city: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    console.log('É iOS?', isIOSDevice);

    // Detectar se o navegador suporta beforeinstallprompt
    const supportsPrompt = 'onbeforeinstallprompt' in window;
    setSupportsBeforeInstallPrompt(supportsPrompt);
    console.log('Suporta beforeinstallprompt?', supportsPrompt);

    // Detectar se o app está em modo standalone (indicando que foi instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isInstalledInLocalStorage = localStorage.getItem('isInstalled') === 'true';
    setIsInstalled(isStandalone || isInstalledInLocalStorage);
    console.log('Está em modo standalone?', isStandalone);
    console.log('isInstalled no localStorage?', isInstalledInLocalStorage);
    console.log('App está instalado?', isStandalone || isInstalledInLocalStorage);

    // Detectar se é um dispositivo móvel
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      console.log('Largura da janela:', window.innerWidth, 'isMobile:', mobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && !isInstalled) {
      console.log('Mostrando o pop-up de instalação');
      setShowInstallPrompt(true);
    } else {
      console.log('Pop-up não mostrado: não é um dispositivo móvel ou o app já está instalado');
    }

    const handleBeforeInstallPrompt = (e) => {
      console.log('Evento beforeinstallprompt disparado!');
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('deferredPrompt definido:', e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      console.log('PWA foi instalada com sucesso!');
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
    if (!value.trim()) return 'Primeiro nome é obrigatório';
    if (value.trim().length < 2) return 'Primeiro nome deve ter pelo menos 2 caracteres';
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) return 'Primeiro nome deve conter apenas letras';
    return '';
  };

  const validateLastName = (value) => {
    if (!value.trim()) return 'Último nome é obrigatório';
    if (value.trim().length < 2) return 'Último nome deve ter pelo menos 2 caracteres';
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) return 'Último nome deve conter apenas letras';
    return '';
  };

  const validateUsername = (value) => {
    if (!value.trim()) return 'Nome de utilizador é obrigatório';
    if (value.length < 3) return 'Nome de utilizador deve ter pelo menos 3 caracteres';
    if (value.length > 20) return 'Nome de utilizador deve ter no máximo 20 caracteres';
    if (!/^[a-zA-Z0-9._]+$/.test(value)) return 'Nome de utilizador deve conter apenas letras, números, pontos ou underscore';
    if (/\s/.test(value)) return 'Nome de utilizador não pode conter espaços';
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email é obrigatório';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Formato de email inválido';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Palavra-passe é obrigatória';
    if (value.length < 8) return 'Palavra-passe deve ter pelo menos 8 caracteres';
    if (!/(?=.*[a-z])/.test(value)) return 'Palavra-passe deve conter pelo menos uma letra minúscula';
    if (!/(?=.*[A-Z])/.test(value)) return 'Palavra-passe deve conter pelo menos uma letra maiúscula';
    if (!/(?=.*\d)/.test(value)) return 'Palavra-passe deve conter pelo menos um número';
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(value)) return 'Palavra-passe deve conter pelo menos um caractere especial (!@#$%^&*(),.?":{}|<>)';
    return '';
  };

  const validateConfirmPassword = (value, password) => {
    if (!value) return 'Confirmação de palavra-passe é obrigatória';
    if (value !== password) return 'As palavras-passe não coincidem';
    return '';
  };

  const validateNationality = (value) => {
    if (!value) return 'País é obrigatório';
    return '';
  };

  const validateCity = (value) => {
    if (!value) return 'Cidade é obrigatória';
    return '';
  };

  const validateAcceptTerms = (value) => {
    if (!value) return 'Deve aceitar os Termos e Política de Privacidade';
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
    console.log('Botão Instalar clicado!');
    console.log('deferredPrompt atual:', deferredPrompt);
    if (deferredPrompt) {
      try {
        console.log('Chamando deferredPrompt.prompt()');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Resultado da escolha do utilizador:', outcome);
        if (outcome === 'accepted') {
          console.log('Utilizador aceitou instalar o PWA');
          localStorage.setItem('isInstalled', 'true');
          setIsInstalled(true);
        } else {
          console.log('Utilizador recusou instalar o PWA');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Erro ao chamar prompt():', error);
      }
      setShowInstallPrompt(false);
    } else {
      console.log('deferredPrompt é null, não foi possível chamar prompt()');
    }
  };

  const handleDismiss = () => {
    console.log('Utilizador fechou o modal');
    setShowInstallPrompt(false);
  };

  const openTermsModal = (tab = 'terms') => {
    setTermsModalTab(tab);
    setShowTermsModal(true);
  };

  const closeTermsModal = () => {
    setShowTermsModal(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));

    // Validar campo em tempo real
    const error = validateField(name, newValue);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Se for confirmPassword, também validar quando password mudar
    if (name === 'password' && formData.confirmPassword) {
      const confirmError = validateConfirmPassword(formData.confirmPassword, newValue);
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: confirmError
      }));
    }

    // Limpar cidade quando país mudar
    if (name === 'nationality') {
      setFormData(prevData => ({
        ...prevData,
        city: ''
      }));
      setFieldErrors(prev => ({
        ...prev,
        city: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validar todos os campos
    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
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
          city: formData.city,
          email: email,
          username: username,
          password: password,
        }
      );
      
      setAuthHeader(response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
      showToast('Registo realizado com sucesso! Bem-vindo!', 'success');
      
      // Aguardar um pouco antes de redirecionar para mostrar o toast
      setTimeout(() => {
        navigate("/");
      }, 1500);
      
    } catch (error) {
      setAuthHeader(null);
      console.error('Erro no registo:', error);
      
      // Verificar tipos específicos de erro
      if (error.response?.status === 409) {
        if (error.response.data?.message?.includes('email')) {
          showToast('Este email já está registado. Tente fazer login ou use outro email.', 'error');
          setFieldErrors(prev => ({ ...prev, email: 'Email já registado' }));
        } else if (error.response.data?.message?.includes('username')) {
          showToast('Este nome de utilizador já existe. Escolha outro.', 'error');
          setFieldErrors(prev => ({ ...prev, username: 'Nome de utilizador já existe' }));
        } else {
          showToast('Dados já registados. Verifique email e nome de utilizador.', 'error');
        }
      } else if (error.response?.status === 400) {
        showToast('Dados inválidos. Verifique as informações inseridas.', 'error');
      } else {
        showToast('Erro no servidor. Tente novamente mais tarde.', 'error');
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
            
            {/* Primeira linha: Primeiro Nome + Último Nome */}
            <div className="form-row">
              <div className="input-group">
                <label>Primeiro Nome: <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Insira o seu Nome"
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
                  placeholder="Insira o seu Apelido"
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

            {/* Segunda linha: País + Cidade */}
            <div className="form-row">
              <div className="input-group">
                <label>Selecione o seu País: <span style={{color: 'red'}}>*</span></label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className={`select-modern ${fieldErrors.nationality ? 'input-error' : ''}`}
                  required
                >
                  <option value="">Selecione o seu país</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {fieldErrors.nationality && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.nationality}
                  </div>
                )}
              </div>
              <div className="input-group">
                <label>Selecione a sua Cidade: <span style={{color: 'red'}}>*</span></label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`select-modern ${fieldErrors.city ? 'input-error' : ''}`}
                  required
                  disabled={!formData.nationality}
                >
                  <option value="">Selecione a sua cidade</option>
                  {formData.nationality && citiesByCountry[formData.nationality] && 
                    citiesByCountry[formData.nationality].map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                </select>
                {fieldErrors.city && (
                  <div className="field-error">
                    <FaExclamationCircle style={{ marginRight: '5px' }} />
                    {fieldErrors.city}
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
                  placeholder="Escolha um nome de utilizador"
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
                  placeholder="Insira o seu email"
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
                    placeholder="Insira a sua palavra-passe"
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
                    placeholder="Confirme a sua palavra-passe"
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
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="acceptTerms">
                  <span className="required-star">*</span> Aceito os{' '}
                  <span 
                    className="terms-link" 
                    onClick={() => openTermsModal('terms')}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && openTermsModal('terms')}
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
                  >
                    Política de Privacidade
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
              <span>Já tem conta criada?</span>
              <Link to="/login" className="register-btn">Iniciar Sessão</Link>
            </div>
          </form>

        </div>
      </div>

      {/* Pop-up de instalação */}
      {showInstallPrompt && (
        <div className="install-prompt-overlay" onClick={handleDismiss}>
          <div className="install-prompt" onClick={(e) => e.stopPropagation()}>
            <button className="install-prompt-close" onClick={handleDismiss}>
              ✕
            </button>
            <img src="./icons/favicon.jpg" alt="Globe Memories" className="install-prompt-icon" />
            <h3>Instale o Globe Memories!</h3>
            {supportsBeforeInstallPrompt ? (
              <>
                <p>Adicione ao seu ecrã inicial com um clique.</p>
                <button onClick={handleInstall} className="install-button">
                  Instalar
                </button>
              </>
            ) : isIOS ? (
              <p>
                Toque no botão <strong>Partilhar</strong> e seleccione <strong>Adicionar ao Ecrã Principal</strong>.
              </p>
            ) : (
              <p>
                Para instalar, use a opção do seu navegador para adicionar ao ecrã inicial (geralmente no menu de opções).
              </p>
            )}
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
