// src/pages/Login.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

import bgLoginImage from '../images/banners/bg_login.jpg';

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
        console.log('Resultado da escolha do usuário:', outcome);
        if (outcome === 'accepted') {
          console.log('Usuário aceitou instalar o PWA');
          localStorage.setItem('isInstalled', 'true');
          setIsInstalled(true);
        } else {
          console.log('Usuário recusou instalar o PWA');
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
    console.log('Usuário fechou o pop-up');
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
        setSuccessMessage('Palavra-passe alterada com sucesso! Faça login com a sua nova palavra-passe.');
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
    <div className="register-page" style={{
      minHeight: '100vh',
      width: '',
      background: `url('${bgLoginImage}') center center/cover no-repeat, linear-gradient(180deg, #004a94 0%, #e68a00 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="register-wrapper">
        {/* Seção Esquerda: Formulário de Login */}
        <div className="register-container">
          <div className="login-header">
            <h2>Iniciar Sessão:</h2>
          </div>
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-groupRegister">
              <label>Nome de Utilizador:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Insira o seu nome de utilizador"
                required
              />
            </div>

            <div className="form-groupRegister">
              <label>Palavra-passe:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Insira a sua palavra-passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: '1.1rem',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="login-options" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: '20px 0',
              fontSize: '0.95rem'
            }}>
              <label style={{
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                padding: '8px 12px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.15)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.transform = 'translateY(0)';
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ 
                    accentColor: '#fff', 
                    width: '16px', 
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  fontFamily: 'inherit'
                }}>💾 Lembrar-me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                style={{
                  color: '#fff',
                  background: '#000',
                  border: '2px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '15px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '500',
                  backdropFilter: 'blur(5px)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#000';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#000';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                ✨ Esqueceu a palavra-passe?
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

            <button type="submit" className="login1-button">Entrar</button>
          </form>
        </div>

        {/* Seção Direita: Texto de Boas-Vindas */}
        <div className="welcome-section-login">
          <h3>Bem-vindo (a) de volta à<br /> Globe Memories!</h3>
          <p className="app-description">
            Capture e partilhe as suas memórias pelo mundo. Explore destinos únicos,
            documente as suas aventuras e conecte-se com outros viajantes numa experiência
            verdadeiramente global.
          </p>
          <div style={{
            marginTop: '30px',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#fff',
              fontSize: '1.1rem',
              marginBottom: '15px',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>Não tem uma conta?</p>
            <Link 
              to="/register" 
              className="signup-button"
              style={{
                display: 'inline-block',
                padding: '12px 25px',
                background: 'transparent',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '25px',
                fontWeight: 'bold',
                fontSize: '1.05rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
                textShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                e.target.style.background = 'transparent';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                e.target.style.background = 'transparent';
              }}
            >
              🌍 Registar Agora
            </Link>
          </div>
        </div>
      </div>

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
                <p>Adicione à sua tela inicial com um clique.</p>
                <button onClick={handleInstall} className="install-button">
                  Instalar
                </button>
              </>
            ) : isIOS ? (
              <p>
                Toque no botão <strong>Compartilhar</strong> e selecione <strong>Adicionar à Tela Inicial</strong>.
              </p>
            ) : (
              <p>
                Para instalar, use a opção do seu navegador para adicionar à tela inicial (geralmente no menu de opções).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
