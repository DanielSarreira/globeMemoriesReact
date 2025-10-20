import React, { useState, useEffect } from 'react';
import travels from '../data/travelsData.js';
import '../styles/components/modern-filters.css';
// ...existing code...
import { FaStar, FaFlag, FaEllipsisV } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import Slider from '@mui/material/Slider';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import '../styles/pages/globe-memories-interactive-map.css'; // Para usar o estilo do modal
import { travelsModalUtils } from '../utils/modalUtils';

const Travels = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [sortOption, setSortOption] = useState('recent');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [daysRange, setDaysRange] = useState([1, 365]);
  const [transportFilter, setTransportFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [reportedTravels, setReportedTravels] = useState([]);
  const [reportReasons, setReportReasons] = useState({
    inappropriate: false,
    falseInfo: false,
    abusive: false,
    spam: false,
    violation: false,
    plagiarism: false,
    other: false,
  });
  const [otherReason, setOtherReason] = useState('');
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => travelsModalUtils.shouldShow());
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect para processar filtros vindos da navegação (ex: do Spin the Globe)
  useEffect(() => {
    if (location.state?.filterByCountry) {
      setSelectedCountry(location.state.filterByCountry);
      setSelectedCity(''); // Limpar cidade quando definir país
      
      if (location.state.message) {
        showToast(location.state.message, 'success');
      }
      
      // Limpar o state da navegação para evitar re-aplicação
      window.history.replaceState(null, '');
    }
  }, [location.state]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowDropdown(null);
      }
    };
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const uniqueCountries = [...new Set(travels.map(travel => travel.country))];
  const uniqueCities = selectedCountry
    ? [...new Set(travels.filter(travel => travel.country === selectedCountry).map(travel => travel.city))]
    : [];
  const uniqueTransportMethods = [...new Set(travels.map(travel => travel.transport))];

  // Função para sanitizar inputs de pesquisa (SEM remover espaços)
  const sanitizeSearchInput = (input) => {
    if (!input) return '';
    
    // Remove apenas conteúdo perigoso, MAS MANTÉM ESPAÇOS
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '');
    // REMOVIDO .trim() para permitir espaços
  };

  const handleSearch = (e) => {
    const rawValue = e.target.value;
    
    if (rawValue.length > 100) {
      showToast('Pesquisa não pode exceder 100 caracteres!', 'error');
      return;
    }

    const sanitized = sanitizeSearchInput(rawValue);
    
    // Verificar apenas se caracteres perigosos foram removidos (não comparar trim)
    if (sanitized !== rawValue && rawValue !== '') {
      showToast('Pesquisa contém caracteres não permitidos que foram removidos!', 'error');
    }

    setSearchTerm(sanitized);
  };

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
    setDaysRange([1, 365]);
    setTransportFilter('');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    showToast('Filtros limpos com sucesso!', 'info');
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

  const toggleDropdown = (travelId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(showDropdown === travelId ? null : travelId);
  };

  const handleReasonChange = (reason) => {
    setReportReasons((prev) => ({ ...prev, [reason]: !prev[reason] }));
  };

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleReportTravel = (travel, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Inicie sessão para denunciar viagens.', 'error');
      return;
    }
    setSelectedTravel(travel);
    setShowReportModal(true);
    setShowDropdown(null);
  };

  const confirmReportTravel = () => {
    if (selectedTravel) {
      const hasSelectedReason = Object.values(reportReasons).some((v) => v) ||
        (reportReasons.other && otherReason.trim());
      if (!hasSelectedReason) {
        showToast('Por favor, selecione pelo menos um motivo para a denúncia.', 'error');
        return;
      }
      setReportedTravels([...reportedTravels, selectedTravel.id]);
      setShowReportModal(false);
      setSelectedTravel(null);
      setReportReasons({
        inappropriate: false,
        falseInfo: false,
        abusive: false,
        spam: false,
        violation: false,
        plagiarism: false,
        other: false,
      });
      setOtherReason('');
      showToast('Viagem denunciada com sucesso. Obrigado pelo seu feedback!', 'success');
    }
  };

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
      {/* Modal de Boas-vindas */}
      {showWelcomeModal && (
        <div className="gm-map-welcome-overlay">
          <div className="gm-map-welcome-modal">
            <div className="gm-map-welcome-header">
              <h2>Explorador de Viagens Globe Memories</h2>
              <button className="gm-map-close-btn" onClick={() => setShowWelcomeModal(false)}>×</button>
            </div>
            <div className="gm-map-welcome-content">
              <p>Descubra experiências de viagem reais partilhadas pela comunidade global! Explore, filtre e inspire-se com milhares de aventuras autênticas.</p>
              <div className="gm-map-features-grid">
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🔍</span>
                  <div>
                    <strong>Sistema de Filtros Avançado</strong>
                    <p>Filtre por categoria, país, cidade, preço, duração e método de transporte para encontrar viagens ideais</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">📊</span>
                  <div>
                    <strong>Ordenação Inteligente</strong>
                    <p>Organize viagens por data, popularidade, preço ou avaliações para descobrir as melhores experiências</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">⭐</span>
                  <div>
                    <strong>Sistema de Avaliações Detalhado</strong>
                    <p>Consulte avaliações e comentários reais de viajantes para tomar decisões informadas</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🛡️</span>
                  <div>
                    <strong>Conteúdo Verificado e Seguro</strong>
                    <p>Todas as viagens são moderadas e verificadas para garantir informações autênticas e úteis</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gm-map-welcome-footer">
              <div className="dont-show-again">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    Não mostrar novamente esta mensagem
                  </span>
                </label>
              </div>
              <button className="gm-map-welcome-btn primary" onClick={() => {
                if (dontShowAgain) {
                  travelsModalUtils.dismiss();
                }
                setShowWelcomeModal(false);
              }}>
                Explorar viagens!
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="categories-actions">
            {!showAllCategories ? (
              <button onClick={() => setShowAllCategories(true)} className="button-orange">
                Ver mais categorias
              </button>
            ) : (
              <button onClick={() => setShowAllCategories(false)} className="button-orange">
                Ver menos categorias
              </button>
            )}
            <button onClick={handleSeeAll} className="button-danger">Limpar filtros</button>
          </div>
        </div>

        {categoryFilter.length > 0 && (
          <div className="selected-categories">
            
            {categoryFilter.map((category) => (
              <span key={category} className="selected-category">
                {category} <button onClick={() => handleCategoryRemove(category)}>X</button>
              </span>
            ))}
          </div>
        )}

        <div className="modern-filters-wrapper">
          <div className="modern-filters-grid">
            <div className="modern-filter-group">
              <label className="modern-filter-label">🔍 Pesquisar</label>
              <div className="modern-search-wrapper">
                <input
                  type="text"
                  className="modern-filter-input modern-search-input"
                  placeholder="Nome da viagem / país / cidade / viajante ..."
                  value={searchTerm}
                  onChange={handleSearch}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="modern-filter-group">
              <label className="modern-filter-label">🌍 Localização</label>
              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: selectedCountry ? '1fr 1fr' : '1fr' }}>
                <select className="modern-filter-select" value={selectedCountry} onChange={handleCountryChange}>
                  <option value="">Todos os Países</option>
                  {uniqueCountries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>

                {selectedCountry && (
                  <select className="modern-filter-select" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                    <option value="">Todas as Cidades</option>
                    {uniqueCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="modern-filter-group">
              <label className="modern-filter-label">📅 Período</label>
              <select
                className="modern-filter-select"
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

            <div className="modern-filter-group" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '12px', alignItems: 'end' }}>
              <div>
                <label className="modern-filter-label">🔄 Ordenar por</label>
                <select className="modern-filter-select" onChange={handleSortChange} value={sortOption}>
                  <option value="recent">Mais recente</option>
                  <option value="name">Nome (A-Z)</option>
                  <option value="name-desc">Nome (Z-A)</option>
                  <option value="price-asc">Preço (Crescente)</option>
                  <option value="price-desc">Preço (Decrescente)</option>
                </select>
              </div>
              <button onClick={toggleModal} className="modern-filter-button modern-more-filters-btn">
                Filtros
              </button>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modern-modal-content">
              <h3 className="modern-modal-title">Filtros Avançados</h3>
              
              <div className="modern-modal-group">
                <label className="modern-modal-label">💰 Preço Total da Viagem:</label>
                <Slider
                  value={priceRange}
                  onChange={handlePriceChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={5000}
                />
                <p className="modern-modal-value">De: {priceRange[0]}€ até {priceRange[1]}€</p>
              </div>

              <div className="modern-modal-group">
                <label className="modern-modal-label">📅 Número de Dias da Viagem:</label>
                <Slider
                  value={daysRange}
                  onChange={handleDaysChange}
                  valueLabelDisplay="auto"
                  min={1}
                  max={365}
                />
                <p className="modern-modal-value">De {daysRange[0]} a {daysRange[1]} dias</p>
              </div>

              <div className="modern-modal-footer">
                <button onClick={toggleModal} className="modern-modal-button">
                  Fechar
                </button>
              </div>
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
                  <div className="dropdown-container" style={{ position: 'relative' }}>
                    {!(user && travel.user && user.username === travel.user) && (
                      <button
                        className="dropdown-toggle"
                        onClick={(e) => toggleDropdown(travel.id, e)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          transition: 'background-color 0.1s',
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                      >
                        <FaEllipsisV />
                      </button>
                    )}
                    {showDropdown === travel.id && (
                      <div
                        className="dropdown-menu"
                        style={{
                          position: 'absolute',
                          top: '40px',
                          right: '10px',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                          zIndex: 5000,
                          minWidth: '180px',
                        }}
                      >
                        <button
                          className="dropdown-item"
                          onClick={(e) => handleReportTravel(travel, e)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#e74c3c',
                            fontSize: '14px',
                          }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                        >
                          <FaFlag /> Denunciar Viagem
                        </button>
                      </div>
                    )}
                  </div>
                  <img src={travel.highlightImage} alt={travel.name} className="highlight-image" />
                  <div className="travel-text">
                    <h2>{travel.name}</h2>
                    <p><b>👤 Viajante:</b> {travel.user}</p>
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

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div
            className="modal-content-users"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <h2>Denunciar Viagem</h2>
            <p>
              Por que deseja denunciar a viagem <strong>{selectedTravel?.name}</strong>?
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Esta ação irá reportar a viagem aos administradores.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.inappropriate}
                    onChange={() => handleReasonChange('inappropriate')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Conteúdo inapropriado</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: imagens ofensivas, descrições inapropriadas, nudez, etc.)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.falseInfo}
                    onChange={() => handleReasonChange('falseInfo')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Informação falsa ou enganosa</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: locais inexistentes, preços manipulados, etc.)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.abusive}
                    onChange={() => handleReasonChange('abusive')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Assédio/Abuso nos conteúdos</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: linguagem agressiva ou ofensiva)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.spam}
                    onChange={() => handleReasonChange('spam')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Spam ou autopromoção</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: publicidade abusiva, links externos)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.plagiarism}
                    onChange={() => handleReasonChange('plagiarism')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Plágio de conteúdo</strong>
                    <div style={{ color: '#666', fontSize: '12px' }}>(ex: fotos/textos copiados sem créditos)</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.violation}
                    onChange={() => handleReasonChange('violation')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Violação das regras da plataforma</strong>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={reportReasons.other}
                    onChange={() => handleReasonChange('other')}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <strong>Outro (especificar)</strong>
                  </div>
                </label>
                {reportReasons.other && (
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Descreva o motivo da denúncia..."
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                      resize: 'vertical',
                      minHeight: '80px',
                    }}
                  />
                )}
              </div>
            </div>

            <div className="modal-buttons">
              <button
                className="button-danger"
                onClick={() => {
                  setShowReportModal(false);
                  setReportReasons({
                    inappropriate: false,
                    falseInfo: false,
                    abusive: false,
                    spam: false,
                    violation: false,
                    plagiarism: false,
                    other: false,
                  });
                  setOtherReason('');
                }}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#6c757d',
                  color: 'white',
                }}
              >
                Cancelar
              </button>
              <button
                className="button-orange"
                onClick={confirmReportTravel}
                style={{
                  padding: '10px 20px',
                  margin: '5px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                }}
              >
                Denunciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast para feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default Travels;
