import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaPlane, FaUser, FaSignInAlt, FaUserPlus, FaCog, FaSignOutAlt, FaList } from 'react-icons/fa';
import './Sidebar.css'; // Importa o CSS para estilização

const Sidebar = () => {
  const [showCategories, setShowCategories] = useState(false);

  const toggleCategories = () => {
    setShowCategories(!showCategories);
  };

  return (
    <div className="sidebar">
      <h2>Globe Memories</h2>
      <div className="user-info">
        <img
          src="https://via.placeholder.com/100" // Substitua pela URL do avatar do usuário
          alt="User Avatar"
          className="user-avatar"
        />
        <p>Bem-vindo, Tiago!</p> {/* Personalize com o nome do usuário */}
      </div>
      <nav>
        <ul>
          <li>
            <Link to="/">
              <FaHome className="icon" /> Home
            </Link>
          </li>
          <li>
            <Link to="/travels">
              <FaPlane className="icon" /> Viagens
            </Link>
          </li>
          <li>
            <Link to="/my-travels">
              <FaList className="icon" /> As Minhas Viagens
            </Link>
          </li>
          <li>
            <Link to="/profile">
              <FaUser className="icon" /> O Meu Perfil
            </Link>
          </li>
          <li>
            <Link to="/login">
              <FaSignInAlt className="icon" /> Login
            </Link>
          </li>
          <li>
            <Link to="/register">
              <FaUserPlus className="icon" /> Registrar
            </Link>
          </li>
          <li>
            <Link to="/logout">
              <FaSignOutAlt className="icon" /> Logout
            </Link>
          </li>
          <li>
            <Link to="/settings">
              <FaCog className="icon" /> Configurações
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
