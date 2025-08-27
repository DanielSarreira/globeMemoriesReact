import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaUserCircle, FaSignOutAlt, FaBell, FaUserEdit, FaMap, FaTrophy, FaMapMarkedAlt, FaCaretDown, FaGlobe, FaSun, FaAdn, FaBan } from 'react-icons/fa';
import defaultAvatar from '../images/assets/avatar1.jpg';
import TravelsData from '../data/travelsData';
import { request, setAuthHeader } from '../axios_helper';
import axios from 'axios';
import { useWeather } from '../context/WeatherContext';
import InstallAppModal from './InstallAppModal';

// Dados mockados para notificações
const mockNotifications = [
  { id: 1, userId: 'user1', type: 'follow', message: 'AnaSilva começou a seguir-te!', relatedId: 'AnaSilva', isRead: false, createdAt: '2025-03-27T10:00:00' },
  { id: 2, userId: 'user1', type: 'follow', message: 'AnaSilva pediu para seguir!', relatedId: 'AnaSilva', isRead: false, createdAt: '2025-03-27T09:00:00' },
  { id: 3, userId: 'user1', type: 'follow', message: 'AnaSilva deixou de te seguir!', relatedId: 'AnaSilva', isRead: false, createdAt: '2025-03-26T15:30:00' },
  { id: 4, userId: 'user1', type: 'like', message: 'AnaSilva gostou da tua viagem!', relatedId: '1', isRead: false, createdAt: '2025-03-20T12:00:00' },
  { id: 5, userId: 'user1', type: 'comment', message: 'AnaSilva comentou na tua viagem: "Incrível!"', relatedId: '1', isRead: false, createdAt: '2025-02-25T08:00:00' },
  { id: 6, userId: 'user1', type: 'follow', message: 'TiagoMiranda começou a seguir-te!', relatedId: 'tiago', isRead: false, createdAt: '2025-01-15T14:00:00' },
];

const Header = () => {
  const [userSearch, setUserSearch] = useState('');
  const { user } = useAuth();
  const [travelSearch, setTravelSearch] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [totalTravels, setTotalTravels] = useState(0);
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePage, setActivePage] = useState('/');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const { weather, isLoading, setWeather, setIsLoading } = useWeather();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    setTotalTravels(TravelsData.length);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Sempre obter o tempo atual para a localização do utilizador ao montar o header
  useEffect(() => {
    const fetchWeatherForCoords = async (lat, lon) => {
      try {
        setIsLoading(true);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&timezone=auto`;
        const res = await axios.get(url);
        const current = res.data?.current_weather;
        if (current) {
          setWeather({
            temperature: Math.round(current.temperature),
            windspeed: current.windspeed,
            weathercode: current.weathercode,
            time: current.time,
          });
        }
      } catch (error) {
        console.error('Erro ao obter o tempo atual:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherForCoords(latitude, longitude);
        },
        (error) => {
          // Se o utilizador negar, usar Lisboa como fallback
          console.warn('Geolocalização não disponível:', error.message);
          fetchWeatherForCoords(38.7167, -9.1333);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      // Sem geolocalização, fallback para Lisboa
      fetchWeatherForCoords(38.7167, -9.1333);
    }
  }, [setWeather, setIsLoading]);

  // Handlers existentes
  const handleUserSearch = (e) => {
    setUserSearch(e.target.value);
  };

  const handleTravelSearch = (e) => {
    setTravelSearch(e.target.value);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('user-travels');
    setAuthHeader(null);
  };

  // Fechar menus ao clicar fora
  const handleClickOutside = (e) => {
    if (!e.target.closest('.profile-menu') && !e.target.closest('.profile-icon')) {
      setIsProfileMenuOpen(false);
    }
    if (!e.target.closest('.notification-menu') && !e.target.closest('.notification-icon')) {
      setIsNotificationsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Contar notificações não lidas
  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  // Marcar notificação como lida
  const markAsRead = (notificationId) => {
    setNotifications(notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  };

  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const handleInstallClick = () => {
    // Abre o modal com instruções de instalação (e opção nativa quando disponível)
    setIsInstallModalOpen(true);
  };

  return (
    <>
    <header className="header">
      <div className="header-left">
        {isMobile ? (
          <div className="install-app-container">
            <button
              className="install-app-btn"
              onClick={handleInstallClick}
            >
              Instalar App
            </button>
          </div>
        ) : (
          <div className="social-icons">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="https://www.instagram.com/globememories" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
          </div>
        )}
      </div>

      <div className="header-center">
        <p className="travel-counter">
          Já foram partilhadas <strong>{totalTravels}</strong> viagens na Globe Memories! Obrigado a Todos!
        </p>
      </div>

      <div className="header-right">
        {user && (
          <>
            {/* Seção de Notificações */}
          

            {/* Seção de Meteorologia Simplificada (sempre visível) */}
            <div className="weather-section">
              <Link to="/weather" className="weather-icon" title={weather ? `${weather.temperature}°C` : 'Carregando...'}>
                <FaSun />
                {isLoading ? (
                  <span className="weather-temp">...</span>
                ) : weather ? (
                  <span className="weather-temp">{weather.temperature}°C</span>
                ) : (
                  <span className="weather-temp">Tempo°C</span>
                )}
              </Link>
            </div>
          </>
        )}

        {/* Seção de Perfil */}
        {user ? (
          <div className="profile-section">
            <button
              className="profile-icon"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              aria-label="Abrir menu de perfil"
            >
              <div className="profile-icon-wrapper">
                <img
                  src={user.profilePicture || defaultAvatar}
                  alt="Foto de perfil"
                  className="profile-image"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/30'; }}
                />
                <FaCaretDown className="profile-dropdown-arrow" />
              </div>
            </button>
            {isProfileMenuOpen && (
              <div className="profile-menu">
                <Link to={`/profile/${user.username}`} onClick={() => setIsProfileMenuOpen(false)}>
                  <FaUserCircle /> O meu Perfil
                </Link>
                <Link to={`/profile/edit/${user.username}`} onClick={() => setIsProfileMenuOpen(false)}>
                  <FaUserEdit /> Editar Perfil
                </Link>
                <Link to="/blocked-users" onClick={() => setIsProfileMenuOpen(false)}>
                  <FaBan /> Viajantes Bloqueados
                </Link>
                <Link to="/my-travels" onClick={() => setIsProfileMenuOpen(false)}>
                  <FaMap /> As Minhas Viagens
                </Link>
                <Link to={`/achievements`} onClick={() => setIsProfileMenuOpen(false)}>
                  <FaTrophy /> As Minhas Conquistas
                </Link>
                <Link to="/help-support" onClick={() => setIsProfileMenuOpen(false)}>
                  <FaAdn /> Ajuda e Suporte
                </Link>
                <Link
                  to="/login"
                  className={activePage === '/login' ? 'active' : ''}
                  onClick={() => {
                    setActivePage('/login');
                    logout();
                  }}
                >
                  <FaSignOutAlt className="icon" /> {!isCollapsed && 'Logout'}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Link to="" className=""></Link>
        )}
      </div>
    </header>
    <InstallAppModal
      open={isInstallModalOpen}
      onClose={() => setIsInstallModalOpen(false)}
      deferredPrompt={deferredPrompt}
    />
    </>
  );
};

export default Header;