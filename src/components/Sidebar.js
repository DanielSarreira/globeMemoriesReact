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
} from 'react-icons/fa';
import '../styles/styles.css';
import logo from '../images/logo_white.png';

const Sidebar = () => {
  const { user } = useAuth();
  const [showCategories, setShowCategories] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const [activePage, setActivePage] = useState('/');

  useEffect(() => {
    setActivePage(location.pathname);
  }, [location]);

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

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        <FaBars />
      </button>

      <div className="user-info">
        {!isCollapsed && (
          <div className="logo-container">
            {/* Envolver o logotipo em um Link para redirecionar para a página inicial */}
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
          <li>
            <Link
              to="/"
              className={activePage === '/' ? 'active' : ''}
              onClick={() => setActivePage('/')}
            >
              <FaHome className="icon" /> {!isCollapsed && 'Página Inicial'}
            </Link>
          </li>
          <li>
            <Link
              to="/travels"
              className={activePage === '/travels' ? 'active' : ''}
              onClick={() => setActivePage('/travels')}
            >
              <FaPlane className="icon" /> {!isCollapsed && 'Descobrir Viagens'}
            </Link>
          </li>

          <li>
            <Link
              to="/my-travels"
              className={activePage === '/my-travels' ? 'active' : ''}
              onClick={() => setActivePage('/my-travels')}
            >
              <FaList className="icon" /> {!isCollapsed && 'As Minhas Viagens'}
            </Link>
          </li>

          <li>
            <Link
              to="/futuretravels"
              className={activePage === '/futuretravels' ? 'active' : ''}
              onClick={() => setActivePage('/futuretravels')}
            >
              <FaCog className="icon" /> {!isCollapsed && 'Planear Viagem'}
            </Link>
          </li>

          <li>
            <Link
              to="/users"
              className={activePage === '/users' ? 'active' : ''}
              onClick={() => setActivePage('/users')}
            >
              <FaUser className="icon" /> {!isCollapsed && 'Seguir Viajantes'}
            </Link>
          </li>

      
          <li>
            <Link
              to="/qanda"
              className={activePage === '/qanda' ? 'active' : ''}
              onClick={() => setActivePage('/qanda')}
            >
              <FaCog className="icon" /> {!isCollapsed && 'Forum'}
            </Link>
          </li>

          <div className="top">
            <li>
              <Link
                to="/my-travels"
                state={{ openModal: true }}
                className={activePage === '/my-travels' ? 'active' : ''}
                onClick={() => setActivePage('/my-travels')}
              >
                <FaAd className="icon" /> {!isCollapsed && 'Adicionar Viagem'}
              </Link>
            </li>
          </div>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;