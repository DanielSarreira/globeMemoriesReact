import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

import bgLoginImage from '../images/banners/bg_login.jpg';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validação de email
    if (!formData.email.includes('@')) {
      setErrorMessage('Por favor, insira um email válido com "@".');
      setSuccessMessage('');
      return;
    }

    // Verificação de passwords
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('As palavras-passe não coincidem.');
      setSuccessMessage('');
      return;
    }

    onRegister(e, formData.firstName, formData.lastName, formData.nationality, formData.email, formData.username, formData.password);
  };

  const onRegister = (event, firstName, lastName, nationality, email, username, password) => {
    event.preventDefault();
    request(
      "POST",
      "/register",
      {
        firstName: firstName,
        lastName: lastName,
        nationality: nationality,
        email: email,
        username: username,
        password: password,
      }
    )
      .then((response) => {
        setAuthHeader(response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data));
        setUser(response.data);
        console.log(response);
        navigate("/");
      })
      .catch((error) => {
        setAuthHeader(null);
        setErrorMessage('Erro ao registar. Verifique os dados e tente novamente.');
        console.log(error);
      });
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
        {/* Seção Esquerda: Formulário de Registo */}
        <div className="register-container">
          <div className="register-header">
            <h2>Registar:</h2>

          </div>
          <form onSubmit={handleSubmit} className="register-form">
            <div className="name-container" style={{ display: 'flex', gap: '20px' }}>
              <div className="form-groupRegister" style={{ flex: 1 }}>
                <label>Primeiro Nome:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Insira o seu Nome"
                  required
                />
              </div>

              <div className="form-groupRegister" style={{ flex: 1 }}>
                <label>Último Nome:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Insira o seu Apelido"
                  required
                />
              </div>
            </div>

           

            <div className="user-email-container" style={{ display: 'flex', gap: '20px' }}>
              <div className="form-groupRegister" style={{ flex: 1 }}>
                <label>Nome de Utilizador:</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Escolha um nome de utilizador"
                  required
                />
              </div>

            <div className="form-groupRegister">
              <label>País:</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="Insira o seu País"
                required
              />
            </div>

            </div>
 

             <div className="form-groupRegister" style={{ flex: 1 }}>
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Insira o seu email"
                  required
                />
              </div>
            <div className="password-container" style={{ display: 'flex', gap: '20px' }}>
              <div className="form-groupRegister" style={{ flex: 1 }}>
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

              <div className="form-groupRegister" style={{ flex: 1 }}>
                <label>Confirmar:</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirme a sua palavra-passe"
                    required
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
                      color: '#9ca3af',
                      fontSize: '1.1rem',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
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

            <button type="submit" className="register-button">Registar</button>
          </form>
        </div>

        {/* Seção Direita: Texto de Boas-Vindas */}
        <div className="welcome-section-register">
          <h3>Bem-vindo (a) à<br /> Globe Memories!</h3>
          <p className="app-description">
            A Globe Memories é a sua plataforma para guardar e partilhar as suas memórias de viagem. 
            Registe-se para começar a criar o seu mapa de memórias pessoal e conectar-se com outros viajantes.
          </p>
          <p>Já tem uma conta?</p>
          <Link to="/login" className="signup-button">Iniciar Sessão</Link>
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

export default Register;
