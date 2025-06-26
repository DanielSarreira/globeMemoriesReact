import React, { useState, useEffect } from 'react';
import travels from '../data/travelsData.js';
import '../styles/styles.css';
import { FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Slider from '@mui/material/Slider';

const Travels = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [sortOption, setSortOption] = useState('recent');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [daysRange, setDaysRange] = useState([1, 90]);
  const [transportFilter, setTransportFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setPriceRange([0, 5000]);
    setDaysRange([1, 90]);
    setTransportFilter('');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
  };

  const months = [
    { value: '', label: 'Selecionar Mês' },
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? '#ffc107' : '#e4e5e9'} size={20} />
    ))
  );

  const filteredTravels = travels.filter((travel) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      travel.name.toLowerCase().includes(searchLower) ||
      travel.country.toLowerCase().includes(searchLower) ||
      travel.city.toLowerCase().includes(searchLower) ||
      travel.user.toLowerCase().includes(searchLower)
    );
    const matchesCategory = categoryFilter.length === 0 ||
      (Array.isArray(travel.category) && categoryFilter.every(category => travel.category.includes(category)));
    const matchesCountry = selectedCountry === '' || travel.country === selectedCountry;
    const matchesCity = selectedCity === '' || travel.city === selectedCity;
    const matchesPrice = travel.price >= priceRange[0] && travel.price <= priceRange[1];
    const matchesDays = travel.days >= daysRange[0] && travel.days <= daysRange[1];
    const matchesTransport = transportFilter === '' || travel.transport === transportFilter;

    const travelStart = new Date(travel.startDate);
    const travelEnd = new Date(travel.endDate);
    const matchesDate = startDate && endDate
      ? new Date(startDate) <= travelStart && new Date(endDate) >= travelEnd
      : selectedMonth
        ? String(travelStart.getMonth() + 1).padStart(2, '0') === selectedMonth
        : true;

    return matchesSearch && matchesCategory && matchesCountry && matchesCity && matchesPrice && matchesDays && matchesTransport && matchesDate;
  })
    .sort((a, b) => {
      if (sortOption === 'recent') {
        return new Date(b.startDate) - new Date(a.startDate);
      } else if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortOption === 'price-asc') {
        return a.price - b.price;
      } else if (sortOption === 'price-desc') {
        return b.price - a.price;
      }
      return 0;
    });

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const categories = [
    { name: 'Natureza', icon: '🌿' },
    { name: 'Praia', icon: '🏖️' },
    { name: 'Aventura', icon: '🧗' },
    { name: 'Cultural', icon: '🏛️' },
    { name: 'Histórico', icon: '🏰' },
    { name: 'Cidade', icon: '🌆' },
    { name: 'Gastronomia', icon: '🍴' },
    { name: 'Cruzeiros', icon: '🚢' },
    { name: 'Campismo', icon: '⛺' },
    { name: 'Montanha', icon: '🏔️' },
    { name: 'Praias Paradisíacas', icon: '🏝️' },
    { name: 'Praias Fluviais', icon: '🌊' },
    { name: 'Relaxamento', icon: '🧘' },
    { name: 'Safari', icon: '🦁' },
    { name: 'Road Trips', icon: '🚗' },
    { name: 'Ilhas', icon: '🏝️' },
    { name: 'Família', icon: '👨‍👩‍👧‍👦' },
    { name: 'Viagens de Luxo', icon: '💎' },
    { name: 'Viagens de Negócios', icon: '💼' },
    { name: 'Viagens a Solo', icon: '🧳' },
    { name: 'Viagens de Bem-Estar', icon: '💆' },
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
    { name: 'Aventura Extrema', icon: '⚡' },
    { name: 'Experiências Gastronômicas', icon: '🍕' },
    { name: 'Desportos', icon: '⚽' },
    { name: 'Românticas', icon: '💖' },
    { name: 'Mobilidade Reduzida', icon: '♿' },
    { name: 'Viagens a dois', icon: '💑' },
    { name: 'Viagens em Grupo', icon: '🧑‍🤝‍🧑' },
    { name: 'Turismo Rural', icon: '🌾' },
    { name: 'Turismo Subaquático', icon: '🤿' },
  ];

  const defaultCategoryLimit = isMobile ? 'Cultural' : 'Viagens de Luxo';
  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, categories.findIndex(cat => cat.name === defaultCategoryLimit) + 1);

  return (
    <div className="travels-container">
      <div className="filters">
        <div className="checkbox-group">
          {visibleCategories.map(({ name, icon }) => (
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
          <div className="checkbox-group">
            {!showAllCategories ? (
              <button onClick={() => setShowAllCategories(true)} className="button">
                Ver mais categorias
              </button>
            ) : (
              <button onClick={() => setShowAllCategories(false)} className="button">
                Ver menos categorias
              </button>
            )}
            <button onClick={handleSeeAll} className="button">Limpar filtros</button>
          </div>
        </div>

        {categoryFilter.length > 0 && (
          <div className="selected-categories">
            <h3>Categorias Selecionadas:</h3>
            {categoryFilter.map((category) => (
              <span key={category} className="selected-category">
                {category} <button onClick={() => handleCategoryRemove(category)}>X</button>
              </span>
            ))}
          </div>
        )}

        <div className="filters-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Pesquisar viagens..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

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

          <div className="date-filters" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value) {
                  setStartDate('');
                  setEndDate('');
                }
              }}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sort-group">
            <select onChange={handleSortChange} value={sortOption}>
              <option value="recent">Mais recente</option>
              <option value="name">Nome (A-Z)</option>
              <option value="name-desc">Nome (Z-A)</option>
              <option value="price-asc">Preço (Crescente)</option>
              <option value="price-desc">Preço (Decrescente)</option>
            </select>
          </div>

          <button onClick={toggleModal} className="button">FILTROS</button>
        </div>

        {isModalOpen && (
          <div className="modal-overlay" onClick={toggleModal}>
            <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Filtros</h3>
              <div className="filter-group">
                <label>Preço Total da Viagem:</label>
                <Slider
                  value={priceRange}
                  onChange={handlePriceChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={5000}
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
                  max={90}
                />
                <p>De {daysRange[0]} a {daysRange[1]} dias</p>
              </div>

              <button onClick={toggleModal} className="close-modal-button">Fechar</button>
            </div>
          </div>
        )}
      </div>

      <div className="travels-list">
        {filteredTravels.length > 0 ? (
          filteredTravels.map((travel) => (
            <div key={travel.id} className="travel-card">
              <Link to={`/travel/${travel.id}`}>
                <div className="travel-content">
                  <img src={travel.highlightImage} alt={travel.name} className="highlight-image" />
                  <div className="travel-text">
                    <h2>{travel.name}</h2>
                    <p><b>👤 Utilizador:</b> {travel.user}</p>
                    <p><b>🌍 País:</b> {travel.country}</p>
                    <p><b>🏙️ Cidade:</b> {travel.city}</p>
                    <p><b>🗂️ Categoria:</b> {travel.category.join(', ')}</p>
                    <p><b>📅 Data de Início:</b> {travel.startDate}</p>
                    <p><b>📅 Data do Fim:</b> {travel.endDate}</p>
                    <p><b>💰 Preço Total da Viagem:</b> {travel.price}€</p>
                    <p><strong>Avaliação Geral:</strong> {renderStars(travel.stars)}</p>
                    <Link to={`/travel/${travel.id}`} className="button">Ver mais detalhes</Link>
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <p>Nenhuma viagem encontrada com os filtros selecionados.</p>
        )}
      </div>
    </div>
  );
};

export default Travels;
