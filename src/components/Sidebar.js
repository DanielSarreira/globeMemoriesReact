import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request, setAuthHeader } from '../axios_helper';
import {
  FaHome,
  FaPlane,
  FaUser,
  FaSignInAlt,
  FaUserPlus,
  FaCog,
  FaSignOutAlt,
  FaList,
  FaAd,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaBars,
  FaMapMarker,
  FaMapMarked,
  FaMapMarkedAlt,
  FaSearch,
  FaGlobe,
  FaComments,
  FaRoute,
  FaPlus
} from 'react-icons/fa';
import '../styles/styles.css';
import logo from '../images/logo_white.png';

const Sidebar = () => {
  const { user } = useAuth();
  const [showCategories, setShowCategories] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const [activePage, setActivePage] = useState('/');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    setActivePage(location.pathname);
  }, [location]);

  // Detectar se é mobile com base no tamanho da janela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Chamar na inicialização

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCategories = () => {
    setShowCategories(!showCategories);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setAuthHeader(null);
  };

  const profileLink = user ? `/profile/${user.username || 'guest'}` : '/profile/guest';
  const editProfileLink = user ? `/profile/edit/${user.username || 'guest'}` : '/profile/edit/guest';

  // Lista de itens da navegação sem o botão "Adicionar Viagem"
  const navItems = [
    {
      to: '/',
      label: 'Página Inicial',
      icon: <FaHome className="icon" />,
    },
    {
      to: '/travels',
      label: 'Descobrir Viagens',
      icon: <FaPlane className="icon" />,
    },
    {
      to: '/users',
      label: 'Seguir Viajantes',
      icon: <FaSearch className="icon" />,
    },
    {
      to: '/interactivemap',
      label: 'Mapa Mundo',
      icon: <FaGlobe className="icon" />,
    },
    {
      to: '/qanda',
      label: 'Forum',
      icon: <FaComments className="icon" />,
    },
    {
      to: '/futuretravels',
      label: 'Planear Viagem',
      icon: <FaRoute className="icon" />,
    },
  ];

  // Determinar a posição do botão "Adicionar Viagem"
  const navItemsWithAddButton = [...navItems];
  if (isMobile) {
    // No mobile, inserir o botão "Adicionar Viagem" no meio da lista (após o 3º item)
    const middleIndex = Math.floor(navItems.length / 2); // Índice 3 (após "Seguir Viajantes")
    navItemsWithAddButton.splice(middleIndex, 0, {
      to: '/my-travels',
      label: 'Adicionar Viagem',
      icon: <FaPlus className="icon" />,
      isAddButton: true,
      className: 'top', // Adicionar a classe "top" para o estilo no mobile
    });
  } else {
    // No desktop, manter o botão "Adicionar Viagem" como último item dentro de um div com classe "top"
    navItemsWithAddButton.push({
      to: '/my-travels',
      label: 'Adicionar Viagem',
      icon: <FaPlus className="icon" />,
      isAddButton: true,
      className: 'top', // Adicionar a classe "top" para o estilo no desktop
    });
  }

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        <FaBars />
      </button>

      <div className="user-info">
        {!isCollapsed && (
          <div className="logo-container">
            <Link to="/">
              <img src={logo} alt="Globe Memories Logo" className="logo" />
            </Link>
          </div>
        )}
        <div className="profile-avatar">
          <img
            src={user?.profilePicture || '/static/media/avatar.55c3eb5641681d05db07.jpg'}
            alt="Avatar do usuário"
            className="avatar"
          />
        </div>
        {!isCollapsed && <p>Bem-vindo(a) {user?.username || 'Convidado'}!</p>}
      </div>

      <nav>
        <ul>
          {navItemsWithAddButton.map((item, index) => (
            <li key={index} className={item.className || ''}>
              <Link
                to={item.to}
                className={activePage === item.to ? 'active' : ''}
                onClick={() => setActivePage(item.to)}
                state={item.isAddButton ? { openModal: true } : undefined}
              >
                {item.icon} {!isCollapsed && item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;