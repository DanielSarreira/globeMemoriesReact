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
import logo from '../images/Globe-Memories.png'; // Atualize o caminho conforme necessário

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
      {!isCollapsed && (
          <div className="logo-container">
            <img src={logo} alt="Globe Memories Logo" className="logo" />
          </div>
        )}
        <div className="profile-avatar">
          <img
            src="/static/media/avatar.55c3eb5641681d05db07.jpg"
            alt="Avatar do usuário"
            className="avatar"
          />
        </div>
        {!isCollapsed && <p>Bem-vindo(a) Tiago!</p>}
        
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
          
      
            <li>
              <Link onClick={logout} to="/login">
                <FaSignOutAlt className="icon" /> {!isCollapsed && 'Logout'}
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

    </div>
  );
};

export default Sidebar;
