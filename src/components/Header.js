import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaUserCircle, FaSignOutAlt, FaBell, FaUserEdit, FaMap, FaTrophy, FaMapMarkedAlt, FaCaretDown, FaGlobe, FaSun } from 'react-icons/fa';
import defaultAvatar from '../images/assets/avatar1.jpg';
import TravelsData from '../data/travelsData';
import '../styles/styles.css';
import { request, setAuthHeader } from '../axios_helper';
import axios from 'axios';
import { useWeather } from '../context/WeatherContext';

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
  const { weather, isLoading } = useWeather();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

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

  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const handleInstallClick = () => {
    // Implemente a lógica para instalar o aplicativo
  };

  return (
    <header className="header">
      <div className="header-left">
        {isMobile ? (
          <div className="install-app-container">
            <button
              className="install-app-btn"
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              style={{ opacity: deferredPrompt ? 1 : 0.5, cursor: deferredPrompt ? 'pointer' : 'not-allowed' }}
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