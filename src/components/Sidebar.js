import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const [showCategories, setShowCategories] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCategories = () => {
    setShowCategories(!showCategories);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setAuthHeader(null);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        <FaBars />
      </button>

      <div className="user-info">
        {!isCollapsed && <h2>Globe Memories</h2>}
        <div className="profile-avatar">
          <img
            src="/static/media/avatar.55c3eb5641681d05db07.jpg"
            alt="Avatar do usuário"
            className="avatar"
          />
        </div>
        {!isCollapsed && <p>Bem-vindo(a) Tiago!</p>}
        <nav>
          <ul>
            <li>
              <Link onClick={logout} to="/login">
                <FaSignOutAlt className="icon" /> {!isCollapsed && 'Logout'}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <nav>
        <ul>
          <li>
            <Link to="/">
              <FaHome className="icon" /> {!isCollapsed && 'Home'}
            </Link>
          </li>
          <li>
            <Link to="/travels">
              <FaPlane className="icon" /> {!isCollapsed && 'Viagens'}
            </Link>
          </li>
          <li>
            <Link to="/my-travels">
              <FaList className="icon" /> {!isCollapsed && 'As Minhas Viagens'}
            </Link>
          </li>
          <li>
            <Link to="/profile">
              <FaUser className="icon" /> {!isCollapsed && 'O Meu Perfil'}
            </Link>
          </li>
          <li>
            <Link to="/HelpSupport">
              <FaCog className="icon" /> {!isCollapsed && 'Ajuda e Suporte'}
            </Link>
          </li>
          <div className="top">
            <li>
              <Link to="/my-travels">
                <FaAd className="icon" /> {!isCollapsed && 'Adicionar Viagem'}
              </Link>
            </li>
          </div>
        </ul>
      </nav>

      <div className="social-media">
        <ul>
          <li>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </a>
          </li>
          <li>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
          </li>
          <li>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
