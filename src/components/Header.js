import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaUserCircle, FaSignOutAlt, FaUserEdit, FaMap, FaTrophy, FaCaretDown, FaSun, FaAdn, FaCog } from 'react-icons/fa';
import defaultAvatar from '../images/assets/avatar1.jpg';
import TravelsData from '../data/travelsData';
import { request, setAuthHeader, getUserAvatar } from '../axios_helper';
import { useWeather } from '../context/WeatherContext';
import Toast from './Toast';
import SuggestionButton from './SuggestionButton';
import SuggestionModal from './SuggestionModal';

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
  // Notificações serão carregadas do backend - inicialmente vazio
  const [notifications, setNotifications] = useState([]);
  const { weather, isLoading, setWeather, setIsLoading } = useWeather();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  
  // Toast functions
  const showToast = (message, type) => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast({ message: '', type: '', isVisible: false }), 2600);
  };
  
  const hideToast = () => {
    setToast({ message: '', type: '', isVisible: false });
  };

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

  // Sempre obter o tempo atual para a localização do utilizador ao montar o header
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    
    const fetchWeatherForCoords = async (lat, lon) => {
      if (!mounted) return;
      
      try {
        if (mounted) setIsLoading(true);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&timezone=auto`;

        const res = await request('GET', url, null, {
          signal: controller.signal,
          timeout: 8000
        });
        
        if (!mounted || controller.signal.aborted) return;
        
        const current = res.data?.current_weather;
        if (current && mounted) {
          setWeather({
            temperature: Math.round(current.temperature),
            windspeed: current.windspeed,
            weathercode: current.weathercode,
            time: current.time,
          });
        }
      } catch (error) {
        if (mounted && error.name !== 'AbortError') {
          // Silenciosamente falha - não mostra erro para weather opcional
          setWeather(null);
        }
      } finally {
        if (mounted && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const getLocationAndWeather = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (mounted) {
              const { latitude, longitude } = position.coords;
              fetchWeatherForCoords(latitude, longitude);
            }
          },
          (error) => {
            // Se o utilizador negar, usar Lisboa como fallback
            if (mounted) {
              fetchWeatherForCoords(38.7167, -9.1333);
            }
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 3600000 }
        );
      } else {
        // Sem geolocalização, fallback para Lisboa
        if (mounted) {
          fetchWeatherForCoords(38.7167, -9.1333);
        }
      }
    };

    // Começar a buscar weather
    getLocationAndWeather();
    
    return () => {
      mounted = false;
      controller.abort();
    };
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

  return (
    <div>
    <header className="header">
      <div className="header-left">
        {user && isMobile && (
          <SuggestionButton onClick={() => setIsSuggestionModalOpen(true)} />
        )}
        {!isMobile && (
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
          Já foram partilhadas <strong>{totalTravels}</strong> viagens na Globe Memories
        </p>
      </div>

      <div className="header-right">
        {user && (
          <>
            {!isMobile && (
              <SuggestionButton onClick={() => setIsSuggestionModalOpen(true)} />
            )}

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
                  src={getUserAvatar(user) || defaultAvatar}
                  alt="Foto de perfil"
                  className="header-profile-image"
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
                <Link to="/my-travels" onClick={() => setIsProfileMenuOpen(false)}>
                  <FaMap /> As Minhas Viagens
                </Link>
                <Link to={`/achievements`} onClick={() => setIsProfileMenuOpen(false)}>
                  <FaTrophy /> As Minhas Conquistas
                </Link>
                <Link to="/settings-and-privacy" onClick={() => setIsProfileMenuOpen(false)}>
                  <FaCog /> Definições e Privacidade
                </Link>
                <Link to="/help-support" onClick={() => setIsProfileMenuOpen(false)}>
                  <FaAdn /> Ajuda e Suporte
                </Link>
                <Link
                  to="/login"
                  className={activePage === '/login' ? 'active' : ''}
                  onClick={() => {
                    setActivePage('/login');
                    showToast('Sessão terminada com sucesso!', 'success');
                    logout();
                  }}
                >
                  <FaSignOutAlt className="icon logout-button" /> {!isCollapsed && 'Logout'}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Link to="" className=""></Link>
        )}
      </div>
    </header>
    <SuggestionModal
      isOpen={isSuggestionModalOpen}
      onClose={() => setIsSuggestionModalOpen(false)}
      showToast={showToast}
    />
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
    />
    </div>
  );
};

export default Header;