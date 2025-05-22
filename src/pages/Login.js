// src/pages/Login.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import '../styles/styles.css';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // Estado para "Remember Me"
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "username") setUsername(value);
    if (name === "password") setPassword(value);
  };

  const onSubmitLogin = (e) => {
    e.preventDefault();
    
    // Validação de campos vazios
    if (!username.trim()) {
      setErrorMessage('Por favor, insira o seu nome de utilizador.');
      setSuccessMessage('');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Por favor, insira a sua palavra-passe.');
      setSuccessMessage('');
      return;
    }

    onLogin(e, username, password);
  };

  const onLogin = (e, username, password) => {
    e.preventDefault();
    request(
      "POST",
      "/login",
      {
        username: username,
        password: password
      }
    ).then(
      (response) => {
        setAuthHeader(response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data));
        setUser(response.data);
        setSuccessMessage('Login realizado com sucesso!');
        setErrorMessage('');
        console.log(response);
        navigate("/");
      }
    ).catch(
      (error) => {
        setAuthHeader(null);
        setErrorMessage('Credenciais inválidas. Por favor, verifique o seu nome de utilizador e palavra-passe.');
        setSuccessMessage('');
        console.log(error);
      }
    );
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        {/* Seção Esquerda: Formulário de Login */}
        <div className="login-container">
          <div className="login-header">
            <h2>Entrar na sua conta</h2>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>
          <form onSubmit={onSubmitLogin} className="login-form">
            <div className="form-groupLR">
              <label>Utilizador</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Username"
                value={username}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-groupLR">
              <label>Password</label>
              <input
                type="password"
                id="loginPassword"
                name="password"
                placeholder="Password"
                value={password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-groupLR">
              <label className="remember-me">
                <input
                  type="checkbox"
                  className='remember-me-checkbox'
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Lembrar-me</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Esqueceu-se da Password?
              </Link>
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

            <button type="submit" className="login-button">Entrar</button>
          </form>
        </div>

        {/* Seção Direita: Texto de Boas-Vindas e Botão de Registro */}
        <div className="welcome-section">
          <h3>Bem-vindo (a) à<br></br> Globe Memories!</h3>
          <p className="app-description">
            A Globe Memories é a sua plataforma para guardar e partilhar as suas memórias de viagem. 
            Registe-se para começar a criar o seu mapa de memórias pessoal e conectar-se com outros viajantes.
          </p>
          <p>Não tem uma conta?</p>
          <Link to="/register" className="signup-button">Resgistar</Link>
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

export default Login;