import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaUserCircle, FaSignOutAlt, FaBell, FaUserEdit, FaMap, FaTrophy, FaMapMarkedAlt, FaCaretDown, FaGlobe, FaSun } from 'react-icons/fa';
import defaultAvatar from '../images/assets/avatar1.jpg';
import TravelsData from '../data/travelsData';
import '../styles/styles.css';
import { request, setAuthHeader } from '../axios_helper';
import axios from 'axios';

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
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({ city: 'Lisboa', lat: 38.7167, lon: -9.1333 });
  const location = useLocation();

  // Contar o número total de viagens
  useEffect(() => {
    setTotalTravels(TravelsData.length);
  }, []);

  // Carregar localização inicial
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: 'Sua localização',
          });
        },
        (error) => {
          console.error('Erro de geolocalização:', error);
        }
      );
    }
  }, []);

  // Mapear código de condição climática
  const getWeatherDescription = (code) => {
    const weatherCodes = {
      0: { description: 'Céu limpo', emoji: '☀️' },
      1: { description: 'Poucas nuvens', emoji: '🌤️' },
      2: { description: 'Nuvens dispersas', emoji: '⛅' },
      3: { description: 'Nublado', emoji: '☁️' },
      45: { description: 'Nevoeiro', emoji: '🌫️' },
      48: { description: 'Nevoeiro com geada', emoji: '🌫️' },
      51: { description: 'Chuva fraca', emoji: '🌦️' },
      53: { description: 'Chuva moderada', emoji: '🌧️' },
      55: { description: 'Chuva forte', emoji: '🌧️' },
      61: { description: 'Chuva', emoji: '🌧️' },
      63: { description: 'Chuva moderada', emoji: '🌧️' },
      65: { description: 'Chuva intensa', emoji: '⛈️' },
      71: { description: 'Neve fraca', emoji: '❄️' },
      73: { description: 'Neve moderada', emoji: '❄️' },
      75: { description: 'Neve forte', emoji: '❄️' },
      80: { description: 'Chuva esporádica', emoji: '🌦️' },
      81: { description: 'Chuva moderada', emoji: '🌧️' },
      82: { description: 'Chuva forte', emoji: '⛈️' },
      95: { description: 'Trovoada', emoji: '⛈️' },
      96: { description: 'Trovoada com granizo', emoji: '⛈️' },
    };
    return weatherCodes[code] || { description: 'Desconhecido', emoji: '❓' };
  };

  // Buscar dados meteorológicos simplificados
  const fetchWeather = async (location) => {
    setIsLoading(true);
    try {
      let lat, lon, cityName;
      if (location.lat && location.lon) {
        lat = location.lat;
        lon = location.lon;
        cityName = location.city || 'Sua localização';
      } else {
        const response = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location.city)}&count=1`);
        const data = response.data;
        if (!data.results || data.results.length === 0) throw new Error('Cidade não encontrada');
        lat = data.results[0].latitude;
        lon = data.results[0].longitude;
        cityName = data.results[0].name;
      }

      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
      );
      const current = weatherResponse.data.current;
      const weatherInfo = getWeatherDescription(current.weather_code);

      setWeatherData({
        city: cityName,
        temperature: Math.round(current.temperature_2m),
        emoji: weatherInfo.emoji,
      });
    } catch (error) {
      console.error('Erro ao buscar meteorologia no header:', error);
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar meteorologia ao mudar localização
  useEffect(() => {
    if (userLocation) {
      fetchWeather(userLocation);
    }
  }, [userLocation]);

  // Handlers existentes
  const handleUserSearch = (e) => {
    setUserSearch(e.target.value);
  };

  const handleTravelSearch = (e) => {
    setTravelSearch(e.target.value);
  };

  const logout = () => {
    localStorage.removeItem('user');
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

  // Não renderizar o conteúdo do Header nas páginas de Login e Register
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <header className="header">
      <div className="header-left">
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
            <div className="notification-section">
              <button
                className="notification-icon"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label="Abrir menu de notificações"
              >
                <FaBell />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {isNotificationsOpen && (
                <div className="notification-menu">
                  {notifications.length > 0 ? (
                    <>
                      {notifications.slice(0, 6).map((notif) => (
                        <div
                          key={notif.id}
                          className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                        >
                          <Link
                            to={notif.type === 'like' || notif.type === 'comment' ? `/travel/${notif.relatedId}` : `/profile/${notif.relatedId}`}
                            onClick={() => {
                              markAsRead(notif.id);
                              setIsNotificationsOpen(false);
                            }}
                          >
                            {notif.message}
                          </Link>
                        </div>
                      ))}
                      <Link
                        to="/notifications"
                        className="view-more-notifications"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        Ver mais notificações
                      </Link>
                    </>
                  ) : (
                    <p className="no-notifications">Nenhuma notificação disponível.</p>
                  )}
                </div>
              )}
            </div>

            {/* Seção de Meteorologia Simplificada */}
            <div className="weather-section">
              <Link to="/weather" className="weather-icon" title={weatherData ? `${weatherData.temperature}°C em ${weatherData.city}` : 'Carregando...'}>
                <FaSun />
                {isLoading ? (
                  <span className="weather-temp">...</span>
                ) : weatherData ? (
                  <span className="weather-temp">{weatherData.temperature}°C {weatherData.emoji}</span>
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
                <Link to="/my-travels" onClick={() => setIsProfileMenuOpen(false)}>
                  <FaMap /> As Minhas Viagens
                </Link>
                <Link to={`/achievements`} onClick={() => setIsProfileMenuOpen(false)}>
                  <FaTrophy /> As Minhas Conquistas
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
  );
};

export default Header;