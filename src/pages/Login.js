// src/pages/Login.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/pages/login-travel.css';

// Modern travel-themed background video (optional, fallback to gradient if not loaded)
const YOUTUBE_BG_URL = 'https://www.youtube.com/embed/YFhwEJosUsU?autoplay=1&mute=1&controls=0&loop=1&playlist=YFhwEJosUsU&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validação de campos vazios
    if (!formData.username.trim()) {
      setErrorMessage('Por favor, insira o seu nome de utilizador.');
      setSuccessMessage('');
      return;
    }

    if (!formData.password.trim()) {
      setErrorMessage('Por favor, insira a sua palavra-passe.');
      setSuccessMessage('');
      return;
    }

    onLogin(e, formData.username, formData.password);
  };

  const onLogin = (event, username, password) => {
    event.preventDefault();
    request(
      "POST",
      "/login",
      {
        username: username,
        password: password,
      }
    )
      .then((response) => {
        setAuthHeader(response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data));
        
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
        console.log(response);
        navigate("/");
      })
      .catch((error) => {
        setAuthHeader(null);
        setErrorMessage('Credenciais inválidas. Tente novamente.');
        console.log(error);
      });
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
            <img src={require('../images/Globe-Memories.png')} alt="Globe Memories Logo" className="travel-logo-img" />
            
          </div>
          <form onSubmit={handleSubmit} className="login-travel-form">
            <br></br>
            <div className="input-group">
              <label>Nome de Utilizador:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Insira o seu nome de utilizador"
                required
                autoComplete="username"
              />
            </div>
            <div className="input-group">
              <label>Palavra-passe:</label>
              <div className="password-group-inline">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Insira a sua palavra-passe"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div className="login-travel-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                Lembrar-me
              </label>
              <button
                type="button"
                className="forgot-password"
                onClick={() => setShowForgotPasswordModal(true)}
              >
                Esqueceu a palavra-passe?
              </button>
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
            <button type="submit" className="login-travel-btn">Entrar</button>
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
    </>
  );
};

export default Login;
