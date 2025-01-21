import React, { useState } from 'react';
import travels from '../data/travelsData.js';
import '../styles/Travels.css';
import { FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Slider from '@mui/material/Slider';


const Travels = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [sortOption, setSortOption] = useState('recent');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [daysRange, setDaysRange] = useState([1, 30]);
  const [transportFilter, setTransportFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const uniqueCountries = [...new Set(travels.map(travel => travel.country))];
  const uniqueCities = selectedCountry
    ? [...new Set(travels.filter(travel => travel.country === selectedCountry).map(travel => travel.city))]
    : [];
  const uniqueTransportMethods = [...new Set(travels.map(travel => travel.transport))];

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

  const handlePriceChange = (event, newValue) => setPriceRange(newValue);

  const handleDaysChange = (event, newValue) => setDaysRange(newValue);

  const handleTransportChange = (e) => setTransportFilter(e.target.value);

  const handleSeeAll = () => {
    setSearchTerm('');
    setCategoryFilter([]);
    setSelectedCountry('');
    setSelectedCity('');
    setSortOption('recent');
    setPriceRange([0, 1000]);
    setDaysRange([1, 30]);
    setTransportFilter('');
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
    const matchesPrice = travel.price >= priceRange[0] && travel.price <= priceRange[1];
    const matchesDays = travel.days >= daysRange[0] && travel.days <= daysRange[1];
    const matchesTransport = transportFilter === '' || travel.transport === transportFilter;

    return matchesSearch && matchesCategory && matchesCountry && matchesCity && matchesPrice && matchesDays && matchesTransport;
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

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className="travels-container">
      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar Viagem..."
          value={searchTerm}
          onChange={handleSearch}
        />

    

        <div className="checkbox-group">
  {[
    { name: 'Natureza', icon: '🌿' },
    { name: 'Praia', icon: '🏖️' },
    { name: 'Aventura', icon: '🧗‍♂️' },
    { name: 'Cultural', icon: '🏛️' },
    { name: 'Histórico', icon: '🏰' },
    { name: 'Cidade', icon: '🌆' },
    { name: 'Gastronomia', icon: '🍴' },
    { name: 'Cruzeiros', icon: '🚢' },
    { name: 'Campismo', icon: '⛺' },
    { name: 'Montanha', icon: '🏔️' },
    { name: 'Praias Paradisíacas', icon: '🏝️' },
    { name: 'Praias Fluviais', icon: '🌊' },
    { name: 'Relaxamento', icon: '🧘‍♂️' },
    { name: 'Safari', icon: '🦁' },
    { name: 'Road Trips', icon: '🚗' },
    { name: 'Ilhas', icon: '🏝️' },
    { name: 'Família', icon: '👨‍👩‍👧‍👦' },
    { name: 'Viagens de Luxo', icon: '💎' },
    { name: 'Viagens de Negócios', icon: '💼' },
    { name: 'Viagens a Solo', icon: '🧳' },
    { name: 'Viagens de Bem-Estar', icon: '💆‍♂️' },
    { name: 'Exótica', icon: '🌴' },
    { name: 'Turismo Sustentável', icon: '🌱' },
    { name: 'Turismo de Aventura', icon: '🧭' },
    { name: 'Retiros Espirituais', icon: '🙏' },
    { name: 'Eco-turismo', icon: '🌍' },
    { name: 'Aventura ao Ar Livre', icon: '🏞️' },
    { name: 'Turismo de Experiência', icon: '🎒' },
    { name: 'Turismo Religioso', icon: '⛪' },
    { name: 'Caminhadas', icon: '🥾' },
    { name: 'Festivais', icon: '🎉' },
    { name: 'Festas e Eventos', icon: '🎶' },
    { name: 'Locais Históricos', icon: '📖' },
    { name: 'Aventuras Urbanas', icon: '🏙️' },
    { name: 'Viagens Personalizadas', icon: '🗺️' },
    { name: 'Viagens de Compras', icon: '🛍️' },
    { name: 'Fotografia', icon: '📸' },
    { name: 'Zona Rural', icon: '🚜' },
    { name: 'Voluntariado', icon: '🤝' },
    { name: 'Turismo de Aventura Extrema', icon: '⚡' },
    { name: 'Experiências Gastronômicas', icon: '🍕' },
    { name: 'Desportos', icon: '⚽' },
  ]
  .map(({ name, icon }) => (
    <label key={name} className={`checkbox-label ${categoryFilter.includes(name) ? 'active' : ''}`}>
      <input
        type="checkbox"
        value={name}
        checked={categoryFilter.includes(name)}
        onChange={() => handleCategoryChange(name)}
      />
      <span className="category-icon">{icon}</span> {name}
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


<div className="filters-container">


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

        <button onClick={toggleModal} className="filters-button">Filtros</button>
        <button onClick={handleSeeAll} className="see-all-button">Ver Tudo</button>
      </div>


      {/* Modal de Filtros */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={toggleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Filtros</h3>
            <div className="filter-group">
              <label>Preço da Viagem:</label>
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
              />
              <p>De: {priceRange[0]}€ até {priceRange[1]}€</p>
            </div>

            <div className="filter-group">
              <label>Número de Dias da Viagem:</label>
              <Slider
                value={daysRange}
                onChange={handleDaysChange}
                valueLabelDisplay="auto"
                min={1}
                max={30}
              />
              <p>De {daysRange[0]} a {daysRange[1]} dias</p>
            </div>

            <div className="filter-group">
              <label>Método de Transporte:</label>
              <select value={transportFilter} onChange={handleTransportChange}>
                <option value="">Selecionar Transporte</option>
                {uniqueTransportMethods.map((transport) => (
                  <option key={transport} value={transport}>{transport}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
            <label>País</label>
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
        </div>

            <button onClick={toggleModal} className="close-modal-button">Fechar</button>
          </div>
        </div>
      )}

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
                  <p><b>Categoria:</b> {travel.category.join(', ')}</p>
                  <p><b>Preço da Viagem:</b> {travel.price}€</p>
                  <p><b>Duração da Viagem:</b> {travel.days} dias</p>
                  <p><b>Localização:</b> {travel.country}, {travel.city}</p>
                  <div className="travel-stars">
                    {renderStars(travel.stars)}
                  </div>
                  <Link to={`/travel/${travel.id}`} className="button">Ver mais detalhes</Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>Não há viagens para mostrar com esses filtros.</p>
        )}
      </div>
    </div>
  );
};

export default Travels;
