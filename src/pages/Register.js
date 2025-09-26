import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

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
              <div className="input-group">
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

            {/* Segunda linha: País + Cidade */}
            <div className="form-row">
              <div className="input-group">
                <label>Selecione o seu País:</label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  className="select-modern"
                >
                  <option value="">Selecione o seu país</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Selecione a sua Cidade:</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="select-modern"
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
              </div>
            </div>

            {/* Terceira linha: Nome de Utilizador + Email */}
            <div className="form-row">
              <div className="input-group">
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
              <div className="input-group">
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
            </div>

            {/* Quarta linha: Palavra-passe + Confirmar */}
            <div className="form-row">
              <div className="input-group">
                <label>Palavra-passe:</label>
                <div className="password-group-inline">
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
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label>Confirmar palavra-passe:</label>
                <div className="password-group-inline">
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
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

            <button type="submit" className="login-travel-btn">
              <span style={{display:'inline-flex',alignItems:'center',gap:'0.5em'}}>
                Registar
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
    </>
  );
};

export default Register;
