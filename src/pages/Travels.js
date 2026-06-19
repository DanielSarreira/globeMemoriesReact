import React, { useState, useEffect } from 'react';
import travels from '../data/travelsData.js';
import { request, toFullMediaUrl } from '../axios_helper';
import '../styles/components/modern-filters.css';
// ...existing code...
import { FaStar, FaFlag, FaEllipsisV } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import Slider from '@mui/material/Slider';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import '../styles/pages/globe-memories-interactive-map.css'; // Para usar o estilo do modal
import { travelsModalUtils } from '../utils/modalUtils';
import defaultAvatar from '../images/assets/avatar.jpg';

const Travels = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [sortOption, setSortOption] = useState('recent');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [daysRange, setDaysRange] = useState([1, 365]);
  const [ratingRange, setRatingRange] = useState([1, 5]);
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
  
  // Backend integration states
  const [feedTravels, setFeedTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const travelsPerPage = 20;

  // API data states
  const [apiCategories, setApiCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch public trips with filters
  useEffect(() => {
    const fetchPublicFeed = async () => {
      setLoading(true);
      try {
        // Build query parameters from filters
        const params = new URLSearchParams();
        params.append('page', currentPage);
        params.append('size', travelsPerPage);
        
        // Map sortOption to backend sort parameter
        const getSortParameter = () => {
          switch(sortOption) {
            case 'recent': return 'startDate,desc';
            case 'oldest': return 'startDate,asc';
            case 'price-asc': return 'cost.total,asc';
            case 'price-desc': return 'cost.total,desc';
            case 'rating': return 'tripRating,desc';
            case 'duration-desc': return 'tripDurationDays,desc';
            case 'duration-asc': return 'tripDurationDays,asc';
            default: return 'startDate,desc';
          }
        };
        params.append('sort', getSortParameter());
        
        // Add filters only if they are set
        if (categoryFilter.length > 0) {
          // Map category names to IDs using categories (prioritize API categories with real IDs)
          const categoryIds = categoryFilter
            .map(catName => {
              // First try to find in apiCategories (has real backend IDs)
              const apiCat = apiCategories.find(c => c.name === catName);
              if (apiCat?.id) return apiCat.id;
              // Fallback: if not in API but in fallback, use the category name as identifier
              return null;
            })
            .filter(id => id != null);
          if (categoryIds.length > 0) {
            params.append('categories', categoryIds.join(','));
          }
        }
        
        if (selectedMonth) {
          params.append('month', parseInt(selectedMonth));
        }
        
        if (priceRange[0] > 0 || priceRange[1] < 5000) {
          params.append('minCost', priceRange[0]);
          params.append('maxCost', priceRange[1]);
        }
        
        if (daysRange[0] > 1 || daysRange[1] < 365) {
          params.append('minDays', daysRange[0]);
          params.append('maxDays', daysRange[1]);
        }
        
        // Always send rating filters (range is 1-5)
        params.append('minRating', ratingRange[0]);
        params.append('maxRating', ratingRange[1]);
        
        if (searchTerm.trim()) {
          params.append('text', searchTerm.trim());
        }

        const response = await request('GET', `/trips/public-feed?${params.toString()}`);
        
        if (response?.data) {
          const pageData = response.data;
          
          // Map TripFeedDto to internal travel object structure
          const mappedTravels = (pageData.content || []).map(trip => ({
            id: trip.tripId,
            tripId: trip.tripId,
            name: trip.tripTitle || 'Untitled Trip',
            description: trip.tripSummary || 'No description available',
            longDescription: trip.tripSummary || '',
            city: trip.citiesVisited?.[0] || 'Unknown',
            country: trip.countriesVisited?.[0] || 'Unknown',
            citiesVisited: trip.citiesVisited || [],
            countriesVisited: trip.countriesVisited || [],
            user: trip.username || `User ${trip.userId}`,
            userId: trip.userId,
            userProfilePicture: trip.userProfilePhoto || defaultAvatar,
            highlightImage: toFullMediaUrl(trip.tripPhoto) || require('../images/highlightImage/aveiro.jpg'),
            price: (trip.totalCosts || 0).toString(),
            likes: trip.totalLikes || 0,
            stars: trip.tripRating || 0,
            startDate: trip.startDate,
            endDate: trip.endDate,
            category: (trip.categories || []).map(cat => cat.categoryName || cat.name || ''),
            categories_full: (trip.categories || []).map(cat => {
              const emojiMap = {
                ':city_dusk:': '🌆',
                ':herb:': '🌿',
                ':classical_building:': '🏛️',
                ':beach_with_umbrella:': '🏖️',
                ':mountain:': '⛰️',
                ':fork_and_knife:': '🍽️',
                ':airplane:': '✈️',
                ':tent:': '⛺'
              };
              return {
                name: cat.categoryName || cat.name || '',
                icon: emojiMap[cat.categoryIcon] || '📌'
              };
            }),
            comments: [],
            images_generalInformation: [],
            images_accommodations: [],
            images_foodRecommendations: [],
            images_referencePoints: [],
            images_transportMethods: [],
            accommodations: [],
            foodRecommendations: [],
            transportMethods: [],
            pointsOfInterest: [],
            itinerary: [],
            negativePoints: [],
            travelVideos: [],
            isHidden: trip.isHidden || false,
            privacy: 'public',
            createdAt: trip.startDate
          }));

          // On first page, replace travels; on subsequent pages, append
          if (currentPage === 0) {
            setFeedTravels(mappedTravels);
          } else {
            setFeedTravels(prev => [...prev, ...mappedTravels]);
          }
          
          setTotalPages(pageData.totalPages || 0);
          setTotalElements(pageData.totalElements || 0);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching public feed:', err);
        const errorMsg = err.response?.data?.message || 'Erro ao carregar as viagens. Tente novamente mais tarde.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        
        // Fallback to mock data on error (only on first page)
        if (currentPage === 0) {
          const mockData = travels.slice(0, travelsPerPage);
          setFeedTravels(mockData);
          setTotalPages(Math.ceil(travels.length / travelsPerPage));
          setTotalElements(travels.length);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublicFeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, categoryFilter, selectedMonth, priceRange, daysRange, ratingRange, sortOption]);

  // Effect to process filters coming from navigation (e.g., from Spin the Globe)
  useEffect(() => {
    if (location.state?.filterByCountry) {
      // Set search term to country name since we removed country dropdown
      setSearchTerm(location.state.filterByCountry);
      setCurrentPage(0);
      
      if (location.state.message) {
        showToast(location.state.message, 'success');
      }
      
      // Clean up navigation state to prevent re-application
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

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await request('GET', '/categories');
        if (response?.data && Array.isArray(response.data)) {
          // Backend now returns emojis directly, no mapping needed
          const categoriesWithEmojis = response.data.map(cat => ({
            name: cat.name || '',
            icon: cat.icon || '📌', // Use emoji directly from backend, fallback to 📌
            id: cat.id
          }));
          setApiCategories(categoriesWithEmojis);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        showToast('Erro ao carregar categorias', 'error');
        // Fallback: use empty array, will show hardcoded categories
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

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
    setCurrentPage(0); // Reset pagination when searching
  };

  const handleCategoryChange = (category) => {
    setCategoryFilter((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
    setCurrentPage(0);
  };

  const handleCategoryRemove = (category) => {
    setCategoryFilter((prev) => prev.filter((item) => item !== category));
    setCurrentPage(0);
  };

  const handleSortChange = (e) => setSortOption(e.target.value);

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
    setCurrentPage(0);
  };

  const handleDaysChange = (event, newValue) => {
    setDaysRange(newValue);
    setCurrentPage(0);
  };

  const handleTransportChange = (e) => setTransportFilter(e.target.value);

  const handleSeeAll = () => {
    setSearchTerm('');
    setCategoryFilter([]);
    setSortOption('recent');
    setPriceRange([0, 5000]);
    setDaysRange([1, 365]);
    setRatingRange([1, 5]);
    setTransportFilter('');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setCurrentPage(0);
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

  // Backend already handles filtering, so use feedTravels directly (already sorted)
  const filteredTravels = feedTravels;

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

  // Use API categories if available, otherwise fallback to hardcoded categories
  const fallbackCategories = [
    { name: 'Natureza', icon: '🌿', id: 1 },
    { name: 'Praia', icon: '🏖️', id: 2 },
    { name: 'Aventura', icon: '🧗', id: 3 },
    { name: 'Cultural', icon: '🏛️', id: 4 },
    { name: 'Histórico', icon: '🏰', id: 5 },
    { name: 'Cidade', icon: '🌆', id: 6 },
    { name: 'Gastronomia', icon: '🍴', id: 7 },
    { name: 'Cruzeiros', icon: '🚢', id: 8 },
    { name: 'Campismo', icon: '⛺', id: 9 },
    { name: 'Montanha', icon: '🏔️', id: 10 },
  ];
  
  // Merge API categories with fallback - prioritize API but keep fallback for reference
  const categories = apiCategories.length > 0 ? apiCategories : fallbackCategories;

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
            {categoryFilter.map((category) => {
              const categoryData = apiCategories.find(c => c.name === category) || categories.find(c => c.name === category);
              return (
                <span key={category} className="selected-category">
                  {categoryData?.icon} {category} <button onClick={() => handleCategoryRemove(category)}>X</button>
                </span>
              );
            })}
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
              <label className="modern-filter-label">⭐ Avaliação</label>
              <div style={{ padding: '15px 10px' }}>
                <Slider
                  value={ratingRange}
                  onChange={(event, newValue) => {
                    setRatingRange(newValue);
                    setCurrentPage(0);
                  }}
                  valueLabelDisplay="auto"
                  min={1}
                  max={5}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                    { value: 3, label: '3' },
                    { value: 4, label: '4' },
                    { value: 5, label: '5' }
                  ]}
                />
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  {ratingRange[0]} - {ratingRange[1]} ⭐
                </div>
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
                  <option value="oldest">Mais antigo</option>
                  <option value="price-desc">Preço (Crescente)</option>
                  <option value="price-asc">Preço (Decrescente)</option>
                  <option value="rating">Avaliação (Maior)</option>
                  <option value="duration-desc">Duração (Mais longo)</option>
                  <option value="duration-asc">Duração (Mais curto)</option>
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
        {loading && currentPage === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 20px', fontSize: '16px', color: '#666' }}>
            Carregando viagens...
          </p>
        ) : filteredTravels.length > 0 ? (
          <>
            {filteredTravels.map((travel) => (
              <div key={travel.id} className="travel-card">
                <Link to={`/travel/${travel.tripId}`}>
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
                      <p><b>🗂️ Categoria:</b> {travel.category && travel.category.length > 0 ? travel.category.join(', ') : 'Não categorizada'}</p>
                      <p><b>📅 Data de Início:</b> {travel.startDate}</p>
                      <p><b>📅 Data do Fim:</b> {travel.endDate}</p>
                      <p><b>💰 Preço Total da Viagem:</b> {travel.price}€</p>
                      <p><strong>Avaliação Geral:</strong> {renderStars(travel.stars)}</p>
                      <Link to={`/travel/${travel.tripId}`} className="button">Ver mais detalhes</Link>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
            
            {/* Load More Button */}
            {currentPage < totalPages - 1 && (
              <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={loading}
                  style={{
                    padding: '12px 30px',
                    backgroundColor: '#ff9900',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    opacity: loading ? 0.7 : 1,
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#ff8800')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#ff9900')}
                >
                  {loading ? 'Carregando...' : 'Carregar Mais'}
                </button>
              </div>
            )}
            
            {/* Pagination Info */}
            <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px' }}>
              Exibindo {filteredTravels.length} de {totalElements} viagens
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', padding: '40px 20px' }}>
            Nenhuma viagem encontrada com os filtros selecionados.
          </p>
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
