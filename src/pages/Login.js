// src/pages/Login.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import '../styles/pages/login-travel.css';

// Modern travel-themed background video (optional, fallback to gradient if not loaded)
const YOUTUBE_BG_URL = 'https://www.youtube.com/embed/YFhwEJosUsU?autoplay=1&mute=1&controls=0&loop=1&playlist=YFhwEJosUsU&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1';

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

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    token: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Estados para o pop-up de instalação
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [supportsBeforeInstallPrompt, setSupportsBeforeInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Carregar dados salvos se "Remember Me" estava ativo
    const savedUsername = localStorage.getItem('rememberedUsername');
    const wasRemembered = localStorage.getItem('rememberMe') === 'true';
    
    if (savedUsername && wasRemembered) {
      setFormData(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }

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

  // Efeito para verificar bloqueio de tentativas
  useEffect(() => {
    const checkBlockStatus = () => {
      const lastFailedAttempt = localStorage.getItem('lastFailedLoginAttempt');
      const attemptCount = parseInt(localStorage.getItem('loginAttemptCount') || '0');
      
      if (lastFailedAttempt && attemptCount >= 5) {
        const timeSinceLastAttempt = Date.now() - parseInt(lastFailedAttempt);
        const blockDuration = 15 * 60 * 1000; // 15 minutos
        
        if (timeSinceLastAttempt < blockDuration) {
          setIsBlocked(true);
          setBlockTimeRemaining(Math.ceil((blockDuration - timeSinceLastAttempt) / 1000));
          setLoginAttempts(attemptCount);
        } else {
          // Reset after block period
          localStorage.removeItem('lastFailedLoginAttempt');
          localStorage.removeItem('loginAttemptCount');
          setIsBlocked(false);
          setBlockTimeRemaining(0);
          setLoginAttempts(0);
        }
      }
    };

    checkBlockStatus();
    const interval = setInterval(checkBlockStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Funções de validação
  const validateUsername = (value) => {
    if (!value.trim()) return 'O nome de utilizador é obrigatório';
    if (value.length < 3) return 'O nome de utilizador deve ter pelo menos 3 caracteres';
    if (/\s/.test(value)) return 'O nome de utilizador não pode conter espaços';
    if (!/^[a-zA-Z0-9._]+$/.test(value)) return 'O nome de utilizador deve conter apenas letras, números, pontos ou underscore';
    return '';
  };

  const validatePasswordLogin = (value) => {
    if (!value) return 'A palavra-passe é obrigatória';
    if (value.length < 8) return 'A palavra-passe deve ter pelo menos 8 caracteres';
    return '';
  };

  // Função para validar campo individual
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'username':
        error = validateUsername(value);
        break;
      case 'password':
        error = validatePasswordLogin(value);
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

  // Função para gerenciar tentativas de login
  const handleFailedLogin = () => {
    const currentAttempts = loginAttempts + 1;
    setLoginAttempts(currentAttempts);
    localStorage.setItem('loginAttemptCount', currentAttempts.toString());
    localStorage.setItem('lastFailedLoginAttempt', Date.now().toString());

    if (currentAttempts >= 5) {
      setIsBlocked(true);
      setBlockTimeRemaining(15 * 60); // 15 minutos
      showToast('Muitas tentativas falhadas. Conta bloqueada por 15 minutos.', 'error');
    } else {
      const remainingAttempts = 5 - currentAttempts;
      showToast(`Credenciais incorretas. ${remainingAttempts} tentativa(s) restante(s).`, 'error');
    }
  };

  const resetLoginAttempts = () => {
    setLoginAttempts(0);
    setIsBlocked(false);
    setBlockTimeRemaining(0);
    localStorage.removeItem('loginAttemptCount');
    localStorage.removeItem('lastFailedLoginAttempt');
  };

  // Função para formatar tempo de bloqueio
  const formatBlockTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
        console.error('Erro ao instalar PWA:', error);
      }
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Validar campo em tempo real
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || isBlocked) return;

    // Validar todos os campos
    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário antes de continuar.', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await onLogin(e, formData.username, formData.password);
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLogin = async (event, username, password) => {
    event.preventDefault();
    
    try {
      const response = await request(
        "POST",
        "/login",
        {
          username: username,
          password: password,
        }
      );
      
      setAuthHeader(response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      
      // Reset login attempts on successful login
      resetLoginAttempts();
      
      // Implementar funcionalidade "Remember Me"
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
        localStorage.setItem('rememberMe', 'true');
        // Definir token com expiração mais longa se "Remember Me" estiver ativo
        localStorage.setItem('rememberMeToken', response.data.token);
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberMeToken');
      }
      
      setUser(response.data);
      showToast(`Bem-vindo, ${response.data.firstName || username}!`, 'success');
      
      // Aguardar um pouco antes de redirecionar para mostrar o toast
      setTimeout(() => {
        navigate("/");
      }, 1500);
      
    } catch (error) {
      setAuthHeader(null);
      console.error('Erro no login:', error);
      
      // Handle failed login attempt
      handleFailedLogin();
      
      // Verificar tipos específicos de erro
      if (error.response?.status === 401) {
        // Não especificar qual campo está errado por segurança
        setFieldErrors({});
      } else if (error.response?.status === 429) {
        showToast('Demasiadas tentativas. Tente novamente mais tarde.', 'error');
      } else if (error.response?.status === 400) {
        showToast('Dados inválidos. Verifique as informações inseridas.', 'error');
      } else if (error.response?.status === 500) {
        showToast('Erro no servidor. Tente novamente mais tarde.', 'error');
      } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        showToast('Erro de ligação. Verifique a sua ligação à internet e tente novamente.', 'error');
      } else {
        showToast('Erro ao iniciar sessão. Tente novamente mais tarde.', 'error');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordMessage('Por favor, insira o seu nome de utilizador ou email.');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      // Simular chamada para o backend (será implementado posteriormente)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay de rede
      
      // Por enquanto, apenas simular sucesso
      setForgotPasswordMessage('✅ Email de recuperação enviado! Verifique a sua caixa de entrada.');
      
      // Em produção, aqui seria feita a chamada real:
      // const response = await request('POST', '/forgot-password', { email: forgotPasswordEmail });
      
      // Após 2 segundos, fechar o modal de forgot password e abrir o modal de reset
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail('');
        setForgotPasswordMessage('');
        setShowResetPasswordModal(true);
      }, 2000);
      
    } catch (error) {
      setForgotPasswordMessage('❌ Erro ao enviar email. Tente novamente.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target;
    setResetPasswordData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'A palavra-passe deve ter pelo menos 8 caracteres.';
    }
    if (!hasUpperCase) {
      return 'A palavra-passe deve conter pelo menos uma letra maiúscula.';
    }
    if (!hasLowerCase) {
      return 'A palavra-passe deve conter pelo menos uma letra minúscula.';
    }
    if (!hasNumbers) {
      return 'A palavra-passe deve conter pelo menos um número.';
    }
    if (!hasSpecialChar) {
      return 'A palavra-passe deve conter pelo menos um carácter especial.';
    }
    return null;
  };

  const handleResetPassword = async () => {
    setResetPasswordMessage('');

    // Validações
    if (!resetPasswordData.token.trim()) {
      setResetPasswordMessage('Código de recuperação é obrigatório.');
      return;
    }

    if (!resetPasswordData.newPassword.trim()) {
      setResetPasswordMessage('Nova palavra-passe é obrigatória.');
      return;
    }

    if (!resetPasswordData.confirmPassword.trim()) {
      setResetPasswordMessage('Confirmação da palavra-passe é obrigatória.');
      return;
    }

    // Validar força da palavra-passe
    const passwordError = validatePassword(resetPasswordData.newPassword);
    if (passwordError) {
      setResetPasswordMessage(passwordError);
      return;
    }

    // Verificar se as palavras-passe coincidem
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setResetPasswordMessage('As palavras-passe não coincidem.');
      return;
    }

    setResetPasswordLoading(true);

    try {
      // Simular chamada para o backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular sucesso
      setResetPasswordMessage('✅ Palavra-passe alterada com sucesso!');
      
      // Em produção, seria algo como:
      // await request('POST', '/reset-password', {
      //   token: resetPasswordData.token,
      //   newPassword: resetPasswordData.newPassword
      // });
      
      // Fechar modal após 2 segundos e mostrar mensagem de sucesso no login
      setTimeout(() => {
        setShowResetPasswordModal(false);
        setResetPasswordData({ token: '', newPassword: '', confirmPassword: '' });
        setResetPasswordMessage('');
        setSuccessMessage('Palavra-passe alterada com sucesso! Inicie sessão com a sua nova palavra-passe.');
      }, 2000);
      
    } catch (error) {
      setResetPasswordMessage('❌ Erro ao alterar palavra-passe. Tente novamente.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordEmail('');
    setForgotPasswordMessage('');
    setForgotPasswordLoading(false);
  };

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setResetPasswordData({ token: '', newPassword: '', confirmPassword: '' });
    setResetPasswordMessage('');
    setResetPasswordLoading(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <>
      {/* Travel-themed animated background */}
      <div className="login-travel-bg">
        <iframe
          src={YOUTUBE_BG_URL}
          title="Login Background Video"
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
            <img src={require('../images/Globe-Memories.png')} alt="Globe Memories Logo" className="travel-logo-img" /><br></br>
            <div className="travel-slogan">Viaje. Explore. Lembre. Compartilhe.</div>
          </div>
          <form onSubmit={handleSubmit} className="login-travel-form">
            <div className="input-group">
              <label>Nome de Utilizador: <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Insira o seu nome de utilizador *"
                className={fieldErrors.username ? 'input-error' : ''}
                required
                autoComplete="username"
                disabled={isBlocked}
              />
              {fieldErrors.username && (
                <div className="field-error">
                  <FaExclamationCircle style={{ marginRight: '5px' }} />
                  {fieldErrors.username}
                </div>
              )}
            </div>
            <div className="input-group">
              <label>Palavra-passe: <span style={{color: 'red'}}>*</span></label>
              <div className="password-group-inline">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Insira a sua palavra-passe *"
                  className={fieldErrors.password ? 'input-error' : ''}
                  required
                  autoComplete="current-password"
                  disabled={isBlocked}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  disabled={isBlocked}
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
            </div>
            <div className="login-travel-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isBlocked}
                />
                Lembrar-me
              </label>
              <button
                type="button"
                className="forgot-password"
                onClick={() => setShowForgotPasswordModal(true)}
                disabled={isBlocked}
              >
                Esqueceu a palavra-passe?
              </button>
            </div>

            {/* Avisos de segurança */}
            {loginAttempts > 0 && loginAttempts < 5 && (
              <div style={{
                padding: '10px',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                color: '#856404',
                fontSize: '0.9rem',
                textAlign: 'center',
                margin: '10px 0'
              }}>
                ⚠️ {5 - loginAttempts} tentativa(s) restante(s) antes do bloqueio
              </div>
            )}

            {isBlocked && (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                borderRadius: '8px',
                color: '#721c24',
                fontSize: '0.9rem',
                textAlign: 'center',
                margin: '10px 0'
              }}>
                🔒 Conta bloqueada por excesso de tentativas. Tempo restante: {formatBlockTime(blockTimeRemaining)}
              </div>
            )}
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
            <button 
              type="submit" 
              className="login-travel-btn" 
              disabled={isSubmitting || isBlocked}
            >
              {isSubmitting ? 'A Entrar...' : isBlocked ? `Bloqueado (${formatBlockTime(blockTimeRemaining)})` : 'Entrar'}
            </button>
          </form>
          <div className="login-travel-register">
            <span>Ainda não tem conta?</span>
            <Link to="/register" className="register-btn">
              Registar Agora
            </Link>
          </div>
        </div>
      </div>
      {/* ...existing code for modals and install prompt... */}

      {/* Modal de Redefinir Palavra-passe */}
      {showResetPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          backdropFilter: 'blur(5px)'
        }} onClick={closeResetPasswordModal}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '40px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            position: 'relative',
            textAlign: 'center',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeResetPasswordModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#333'}
              onMouseLeave={(e) => e.target.style.color = '#666'}
            >
              ✕
            </button>
            
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{
                color: '#333',
                fontSize: '1.8rem',
                marginBottom: '10px',
                fontWeight: 'bold'
              }}>🔐 Redefinir Palavra-passe</h2>
              <p style={{
                color: '#666',
                fontSize: '1rem',
                lineHeight: '1.5'
              }}>
                Insira o código recebido por email e defina a sua nova palavra-passe.
              </p>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontWeight: '500'
              }}>Código de Recuperação:</label>
              <input
                type="text"
                name="token"
                value={resetPasswordData.token}
                onChange={handleResetPasswordChange}
                placeholder="Insira o código recebido por email"
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  fontFamily: 'inherit',
                  textAlign: 'center',
                  letterSpacing: '2px',
                  fontWeight: 'bold'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontWeight: '500'
              }}>Nova Palavra-passe:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={resetPasswordData.newPassword}
                  onChange={handleResetPasswordChange}
                  placeholder="Insira a sua nova palavra-passe"
                  style={{
                    width: '100%',
                    padding: '15px 45px 15px 15px',
                    borderRadius: '10px',
                    border: '2px solid #e0e0e0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontWeight: '500'
              }}>Confirmar Nova Palavra-passe:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={resetPasswordData.confirmPassword}
                  onChange={handleResetPasswordChange}
                  placeholder="Confirme a sua nova palavra-passe"
                  style={{
                    width: '100%',
                    padding: '15px 45px 15px 15px',
                    borderRadius: '10px',
                    border: '2px solid #e0e0e0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Requisitos da palavra-passe */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '10px',
              padding: '15px',
              margin: '15px 0',
              border: '1px solid #e9ecef',
              textAlign: 'left'
            }}>
              <h4 style={{ 
                color: '#333', 
                fontSize: '0.9rem', 
                marginBottom: '10px'
              }}>
                🛡️ Requisitos da Palavra-passe:
              </h4>
              <ul style={{ 
                color: '#666', 
                fontSize: '0.8rem', 
                paddingLeft: '20px',
                margin: 0
              }}>
                <li>Pelo menos 8 caracteres</li>
                <li>Uma letra maiúscula</li>
                <li>Uma letra minúscula</li>
                <li>Um número</li>
                <li>Um carácter especial (!@#$%^&*)</li>
              </ul>
            </div>

            {resetPasswordMessage && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                backgroundColor: resetPasswordMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                color: resetPasswordMessage.includes('✅') ? '#155724' : '#721c24',
                border: `1px solid ${resetPasswordMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
                fontSize: '0.9rem'
              }}>
                {resetPasswordMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={closeResetPasswordModal}
                style={{
                  padding: '12px 25px',
                  borderRadius: '25px',
                  border: '2px solid #ddd',
                  background: 'transparent',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '1rem',
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
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetPasswordLoading}
                style={{
                  padding: '12px 25px',
                  borderRadius: '25px',
                  border: 'none',
                  background: resetPasswordLoading ? '#ccc' : 'linear-gradient(135deg, #007bff, #0056b3)',
                  color: '#fff',
                  cursor: resetPasswordLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  if (!resetPasswordLoading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0,123,255,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!resetPasswordLoading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0,123,255,0.3)';
                  }
                }}
              >
                {resetPasswordLoading ? '🔄 Alterando...' : '🔐 Alterar Palavra-passe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Esqueceu a Palavra-passe */}
      {showForgotPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }} onClick={closeForgotPasswordModal}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '40px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            position: 'relative',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeForgotPasswordModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#333'}
              onMouseLeave={(e) => e.target.style.color = '#666'}
            >
              ✕
            </button>
            
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{
                color: '#333',
                fontSize: '1.8rem',
                marginBottom: '10px',
                fontWeight: 'bold'
              }}>🔐 Recuperar Palavra-passe</h2>
              <p style={{
                color: '#666',
                fontSize: '1rem',
                lineHeight: '1.5'
              }}>
                Insira o seu nome de utilizador ou email para receber as instruções de recuperação.
              </p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <input
                type="text"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="Nome de utilizador ou email"
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {forgotPasswordMessage && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                backgroundColor: forgotPasswordMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                color: forgotPasswordMessage.includes('✅') ? '#155724' : '#721c24',
                border: `1px solid ${forgotPasswordMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
                fontSize: '0.9rem'
              }}>
                {forgotPasswordMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={closeForgotPasswordModal}
                style={{
                  padding: '12px 25px',
                  borderRadius: '25px',
                  border: '2px solid #ddd',
                  background: 'transparent',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '1rem',
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
                Cancelar
              </button>
              <button
                onClick={handleForgotPassword}
                disabled={forgotPasswordLoading}
                style={{
                  padding: '12px 25px',
                  borderRadius: '25px',
                  border: 'none',
                  background: forgotPasswordLoading ? '#ccc' : 'linear-gradient(135deg, #007bff, #0056b3)',
                  color: '#fff',
                  cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  if (!forgotPasswordLoading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0,123,255,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!forgotPasswordLoading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0,123,255,0.3)';
                  }
                }}
              >
                {forgotPasswordLoading ? '📧 Enviando...' : '📧 Enviar Email'}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
};

export default Login;
