import React, { useState } from 'react';
import { FaSearch, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import '../styles/Header.css'; // Certifique-se de ter este arquivo CSS para estilização

const Header = () => {
  const [userSearch, setUserSearch] = useState('');
  const [travelSearch, setTravelSearch] = useState('');

  const handleUserSearch = (e) => {
    setUserSearch(e.target.value);
  };

  const handleTravelSearch = (e) => {
    setTravelSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Aqui você pode implementar a lógica de pesquisa
    console.log(`User Search: ${userSearch}, Travel Search: ${travelSearch}`);
  };

  return (
    <header className="header">
      <div className="header-logo">
        <h1></h1>
      </div>
      <form className="search-form" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Pesquisar Utilizador..."
          value={userSearch}
          onChange={handleUserSearch}
          className="search-input"
        />
        <input
          type="text"
          placeholder="Pesquisar Viagem..."
          value={travelSearch}
          onChange={handleTravelSearch}
          className="search-input"
        />
        <button type="submit" className="search-button">
          <FaSearch />
        </button>
      </form>
      <div className="social-icons">
        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
          <FaFacebook />
        </a>
        <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
          <FaTwitter />
        </a>
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
          <FaInstagram />
        </a>
        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
          <FaLinkedin />
        </a>
      </div>
    </header>
  );
};

export default Header;
