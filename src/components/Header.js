import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaUserCircle, FaSignOutAlt, FaBars, FaBell, FaGlobe, FaUserEdit, FaMap } from 'react-icons/fa';
import defaultAvatar from '../images/assets/avatar1.jpg';
import TravelsData from '../data/travelsData'; // Importa os dados para contar as viagens
import '../styles/styles.css';
import { request, setAuthHeader } from '../axios_helper';

const Header = () => {
  const [userSearch, setUserSearch] = useState('');
  const { user } = useAuth();
  const [travelSearch, setTravelSearch] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para menu mobile
  const [totalTravels, setTotalTravels] = useState(0); // Estado para o número de viagens
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
   const [activePage, setActivePage] = useState('/'); // Estado para a página ativa

  // Contar o número total de viagens ao montar o componente
  useEffect(() => {
    setTotalTravels(TravelsData.length);
  }, []);

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
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
          <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
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
          <button className="notification-icon" aria-label="Notificações">
            <FaBell />
            <span className="notification-badge">3</span>
          </button>
        )}
        
        {user ? (
          <div className="profile-section">
            <button
              className="profile-icon"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              aria-label="Abrir menu de perfil"
            >
              <img
                src={user.profilePicture || defaultAvatar}
                alt="Foto de perfil"
                className="profile-image"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/30'; }}
              />
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
                <Link to="/login" className={activePage === '/login' ? 'active' : ''} onClick={() => {setActivePage('/login'); logout();}}>
                  <FaSignOutAlt className="icon" /> {!isCollapsed && 'Logout'}
                </Link>
                          
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-link">
            Login
          </Link>
        )}
      </div>


    </header>
  );
};

export default Header;