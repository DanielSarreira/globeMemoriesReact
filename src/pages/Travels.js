import React, { useState } from 'react';
import travels from '../data/travelsData.js';
import '../styles/Travels.css';
import { FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';



const Travels = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [sortOption, setSortOption] = useState('recent');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  

  
  

  const uniqueCountries = [...new Set(travels.map(travel => travel.country))];
  const uniqueCities = selectedCountry
    ? [...new Set(travels.filter(travel => travel.country === selectedCountry).map(travel => travel.city))]
    : [];

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleCategoryChange = (category) => {
    setCategoryFilter((prev) => 
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const handleCategoryRemove = (category) => {
    setCategoryFilter((prev) => prev.filter((item) => item !== category));
  };

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
    setSelectedCity('');
  };

  const handleSortChange = (e) => setSortOption(e.target.value);

  const handleSeeAll = () => {
    setSearchTerm('');
    setCategoryFilter([]);
    setSelectedCountry('');
    setSelectedCity('');
    setSortOption('recent');
  };

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  const filteredTravels = travels.filter((travel) => {
    const matchesSearch = travel.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter.length === 0 || 
      (Array.isArray(travel.category) && categoryFilter.every(category => travel.category.includes(category)));
    const matchesCountry = selectedCountry === '' || travel.country === selectedCountry;
    const matchesCity = selectedCity === '' || travel.city === selectedCity;

    return matchesSearch && matchesCategory && matchesCountry && matchesCity;
  })
  .sort((a, b) => {
    if (sortOption === 'recent') {
      return new Date(b.startDate) - new Date(a.startDate); // Mais recente
    } else if (sortOption === 'name') {
      return a.name.localeCompare(b.name); // Nome (A-Z)
    } else if (sortOption === 'name-desc') {
      return b.name.localeCompare(a.name); // Nome (Z-A)
    } else if (sortOption === 'price-asc') {
      return a.price - b.price; // Preço (Crescente)
    } else if (sortOption === 'price-desc') {
      return b.price - a.price; // Preço (Decrescente)
    }
    return 0;
  });

  return (
    <div className="travels-container">
      <div className="filters">
       
        <h1>Categorias:</h1>
        <div className="checkbox-group">
          {[
            'Aventura', 'Cultural', 'Histórico', 'Natureza', 'Praia', 
            'Montanha', 'Cidade', 'Gastronomia', 'Relaxamento', 'Romântico',
            'Família', 'Festas e Eventos', 'Esportes', 'Aventura ao Ar Livre', 
            'Cruzeiros', 'Viagens de Negócios', 'Saúde e Bem-Estar', 'Voluntariado',
            'Eco-turismo', 'Camping', 'Caminhadas', 'Fotografia', 'Festivais',
            'Retiros Espirituais', 'Viagens de Luxo', 'Exótica', 'Safari', 
            'Praias Paradisíacas', 'Roteiros Personalizados', 'Viagens de Estudo',
            'Histórias e Lendas Locais', 'Aventuras Urbanas', 'Roteiros de Compras',
            'Turismo de Aventura', 'Experiências Gastronômicas', 'Rotas Cênicas', 
            'Ilhas', 'Turismo de Natureza', 'Road Trips', 'Turismo Religioso'
          ].map((category) => (
            <label key={category} className={`checkbox-label ${categoryFilter.includes(category) ? 'active' : ''}`}>
              <input
                type="checkbox"
                value={category}
                checked={categoryFilter.includes(category)}
                onChange={() => handleCategoryChange(category)}
              />
              {category}
            </label>
          ))}
        </div>

        {categoryFilter.length > 0 && (
          <div className="selected-categories">
            <h4>Categorias Selecionadas:</h4>
            {categoryFilter.map((category) => (
              <span key={category} className="selected-category">
                {category} <button onClick={() => handleCategoryRemove(category)}>X</button>
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar..."
          value={searchTerm}
          onChange={handleSearch}
        />

        <div className="country-city-filters">
          <select value={selectedCountry} onChange={handleCountryChange}>
            <option value="">Selecionar País</option>
            {uniqueCountries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          {selectedCountry && (
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
              <option value="">Selecionar Cidade</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          )}
        </div>

        <div className="sort-group">
          <label>Ordenar por:</label>
          <select onChange={handleSortChange} value={sortOption}>
          <option value="recent">Mais recente</option>
          <option value="name">Nome (A-Z)</option>
          <option value="name-desc">Nome (Z-A)</option>
          <option value="price-asc">Preço (Crescente)</option>
          <option value="price-desc">Preço (Decrescente)</option>
          </select>
        </div>


        <button onClick={handleSeeAll} className="see-all-button">Ver Tudo</button>
      </div>
      

      




      <div className="travels-list">
        {filteredTravels.length > 0 ? (
          filteredTravels.map((travel) => (
            <div key={travel.id} className="travel-item">
              <div className="travel-content">
                <img src={travel.highlightImage} alt={travel.name} className="highlight-image" />
                <div className="travel-text">
                  <h3>{travel.name}</h3>
                  <p><b>Utilizador:</b> {travel.user}</p>
                  <p><b>Categorias:</b> {Array.isArray(travel.category) ? travel.category.join(', ') : travel.category}</p>
                  <p><b>País:</b> {travel.country} | <b>Cidade:</b> {travel.city}</p>
                  <p><b>Preço:</b> {travel.price}€</p>
                  
                  <p><b>Datas:</b> {travel.startDate} a {travel.endDate}</p>
                  <p>{travel.description}</p>
                  <Link to={`/travel/${travel.id}`} className="details-button">Mais Informações</Link>
                  <div className="travel-stars">{renderStars(travel.stars)}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>Nenhuma viagem encontrada com os critérios selecionados.</p>
        )}
      </div>
    </div>
  );
};

export default Travels;