// src/components/admin/TravelModerationComplete.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';
import {
  FaEye, FaSearch, FaFilter, FaEdit, FaTrash, FaMapMarkerAlt,
  FaHeart, FaComment, FaFlag, FaCheckCircle, FaTimes,
  FaExclamationTriangle, FaCalendarAlt, FaMoneyBillWave,
  FaImage, FaVideo, FaHotel, FaUtensils, FaMapPin,
  FaShieldAlt, FaItinerary, FaStar, FaThumbsDown, FaPlane,
  FaLanguage, FaTablets, FaCloudRain, FaArrowUp, FaArrowDown,
  FaChevronDown, FaChevronUp, FaTimes as FaTimesIcon, FaFileAlt
} from 'react-icons/fa';

const TravelModerationComplete = () => {
  // Estados principais
  const [travels, setTravels] = useState([
    // Mock data completo
    {
      _id: '1',
      title: 'Viagem Mágica a Lisboa',
      author: { username: 'tiago', firstName: 'Tiago', lastName: 'Miranda' },
      country: 'Portugal',
      city: 'Lisboa',
      status: 'published',
      createdAt: '2025-03-15',
      reportCount: 2,
      views: 450,
      likes: 125,
      comments: 18,
      // Dados completos da viagem
      description: 'Uma viagem inesquecível pela capital portuguesa...',
      longDescription: 'Descrição longa detalhada da viagem...',
      categories: ['Cidade', 'Cultural', 'Gastronómia'],
      language: 'Português',
      days: 5,
      startDate: '2025-03-01',
      endDate: '2025-03-06',
      price: 850,
      priceDetails: {
        hotel: 300,
        transport: 250,
        food: 200,
        extras: 100
      },
      climate: 'Primavera agradável, média 18º',
      localTransport: ['Metro', 'Autocarro', 'Comboio'],
      highlightImage: 'image-url',
      images: {
        general: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'],
        accommodations: ['hotel1.jpg', 'hotel2.jpg', 'hotel3.jpg'],
        food: ['food1.jpg', 'food2.jpg', 'food3.jpg'],
        pointsOfInterest: ['poi1.jpg', 'poi2.jpg', 'poi3.jpg'],
        transport: ['transport1.jpg']
      },
      videos: ['video1.mp4', 'video2.mp4', 'video3.mp4'],
      accommodations: [
        {
          name: 'Hotel Memória Lisboa',
          type: 'Hotel 4 Estrelas',
          description: 'Hotel boutique no coração da cidade',
          rating: 4.8,
          checkInDate: '2025-03-01',
          checkOutDate: '2025-03-05',
          regime: 'Pequeno-almoço incluído',
          price: 300
        }
      ],
      foodRecommendations: [
        { name: 'Pastéis de Nata', description: 'Especialidade de Belém', restaurant: 'Pastelaria de Belém' },
        { name: 'Sardinha Assada', description: 'Prato típico português', restaurant: 'Restaurante Porto' }
      ],
      pointsOfInterest: [
        { name: 'Torre de Belém', type: 'Monumento', link: 'https://...' },
        { name: 'Mosteiro dos Jerónimos', type: 'Monumento', link: 'https://...' },
        { name: 'Parque das Nações', type: 'Parque', link: 'https://...' }
      ],
      safety: {
        tips: [
          'Evitar zonas desertas à noite',
          'Guardar pertences com cuidado',
          'Usar táxi para regressar tarde'
        ],
        vaccinations: ['Nenhuma obrigatória', 'Hepatite A recomendada']
      },
      itinerary: [
        {
          day: 1,
          title: 'Chegada e exploração',
          activities: [
            'Chegada ao aeroporto',
            'Check-in no hotel',
            'Passeio pelo Bairro Alto',
            'Jantar em restaurante tradicional'
          ]
        },
        {
          day: 2,
          title: 'Monumentos históricos',
          activities: [
            'Visita à Torre de Belém',
            'Mosteiro dos Jerónimos',
            'Pastelaria de Belém',
            'Passeio no Tejo'
          ]
        }
      ],
      reviews: [
        { user: 'João', rating: 5, comment: 'Excelente viagem, recomendo!' },
        { user: 'Maria', rating: 4, comment: 'Muito bom, Lisboa é incrível' }
      ],
      negativePoints: 'Cidade um pouco cara em alguns restaurantes',
      flagReasons: ['spam', 'falseInfo'],
      flagged: false,
      suspended: false
    }
  ]);

  const [filteredTravels, setFilteredTravels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [expandedSections, setExpandedSections] = useState({});

  // Filtrar viagens
  useEffect(() => {
    let filtered = travels;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.author.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'reports') {
      filtered.sort((a, b) => b.reportCount - a.reportCount);
    } else if (sortBy === 'views') {
      filtered.sort((a, b) => b.views - a.views);
    }

    setFilteredTravels(filtered);
  }, [travels, searchTerm, filterStatus, sortBy]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const getStatusColor = (status) => {
    const colors = {
      published: '#28a745',
      pending: '#ffc107',
      flagged: '#ff9900',
      suspended: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      published: 'Publicada',
      pending: 'Pendente',
      flagged: 'Marcada',
      suspended: 'Suspensa'
    };
    return labels[status] || status;
  };

  const handleUpdateStatus = async (newStatus) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTravels(travels.map(t =>
        t._id === selectedTravel._id ? { ...t, status: newStatus } : t
      ));
      setSelectedTravel({ ...selectedTravel, status: newStatus });
      showToast(`Estado alterado para ${getStatusLabel(newStatus)}!`, 'success');
    } catch (error) {
      showToast('Erro ao atualizar estado', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTravel = async () => {
    if (!window.confirm('Tem a certeza que deseja eliminar esta viagem? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTravels(travels.filter(t => t._id !== selectedTravel._id));
      showToast('Viagem eliminada com sucesso!', 'success');
      setShowDetailModal(false);
      setSelectedTravel(null);
    } catch (error) {
      showToast('Erro ao eliminar viagem', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (travel) => {
    setSelectedTravel(travel);
    setShowDetailModal(true);
    setIsEditing(false);
    setExpandedSections({ general: true });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Componente para seção colapsável
  const CollapsibleSection = ({ title, icon: Icon, children, section, isOpen }) => (
    <div style={{ marginBottom: '20px', border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => toggleSection(section)}
        style={{
          width: '100%',
          padding: '15px 20px',
          background: '#f8f9fa',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1rem',
          fontWeight: 'bold',
          color: '#333'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {Icon && <Icon />}
          {title}
        </span>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {isOpen && (
        <div style={{ padding: '20px', background: 'white' }}>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-section-admin">
      <h2>🛡️ Moderação de Viagens - Visão Completa</h2>

      {/* Estatísticas */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
          <h4>Publicadas</h4>
          <p style={{ fontSize: '1.8rem', color: '#28a745' }}>
            {travels.filter(t => t.status === 'published').length}
          </p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ffc107' }}>
          <h4>Pendentes</h4>
          <p style={{ fontSize: '1.8rem', color: '#ffc107' }}>
            {travels.filter(t => t.status === 'pending').length}
          </p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #dc3545' }}>
          <h4>Marcadas</h4>
          <p style={{ fontSize: '1.8rem', color: '#dc3545' }}>
            {travels.filter(t => t.status === 'flagged').length}
          </p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #6c757d' }}>
          <h4>Suspensas</h4>
          <p style={{ fontSize: '1.8rem', color: '#6c757d' }}>
            {travels.filter(t => t.status === 'suspended').length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
          <FaSearch style={{ marginTop: '8px', color: '#666' }} />
          <input
            type="text"
            placeholder="Pesquisar por título, autor, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '0.95rem'
          }}
        >
          <option value="all">Todos os Status</option>
          <option value="published">Publicada</option>
          <option value="pending">Pendente</option>
          <option value="flagged">Marcada</option>
          <option value="suspended">Suspensa</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '0.95rem'
          }}
        >
          <option value="date">Mais Recentes</option>
          <option value="reports">Mais Denunciadas</option>
          <option value="views">Mais Vistas</option>
        </select>
      </div>

      {/* Tabela de Viagens */}
      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table className="admin-table-admin" style={{ width: '100%', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Localização</th>
              <th>Status</th>
              <th>Denúncias</th>
              <th>Interações</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTravels.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Nenhuma viagem encontrada
                </td>
              </tr>
            ) : (
              filteredTravels.map(travel => (
                <tr key={travel._id} style={{ borderLeft: `4px solid ${getStatusColor(travel.status)}` }}>
                  <td><strong>{travel.title.substring(0, 30)}...</strong></td>
                  <td>{travel.author.username}</td>
                  <td>
                    <FaMapMarkerAlt style={{ marginRight: '5px', color: '#0066cc' }} />
                    {travel.city}, {travel.country}
                  </td>
                  <td>
                    <span style={{
                      background: getStatusColor(travel.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {getStatusLabel(travel.status)}
                    </span>
                  </td>
                  <td>
                    {travel.reportCount > 0 ? (
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        <FaFlag style={{ marginRight: '5px' }} />
                        {travel.reportCount}
                      </span>
                    ) : (
                      <span style={{ color: '#28a745' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem' }}>
                      <span><FaEye style={{ marginRight: '3px' }} />{travel.views}</span>
                      <span><FaHeart style={{ marginRight: '3px', color: '#dc3545' }} />{travel.likes}</span>
                      <span><FaComment style={{ marginRight: '3px', color: '#0066cc' }} />{travel.comments}</span>
                    </div>
                  </td>
                  <td>{travel.createdAt}</td>
                  <td>
                    <button
                      className="btn-info-admin"
                      onClick={() => handleViewDetails(travel)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      <FaEye /> Ver Completa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes Completos */}
      {showDetailModal && selectedTravel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '95vh',
            overflowY: 'auto',
            boxShadow: '0 10px 50px rgba(0,0,0,0.4)'
          }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #e9ecef', paddingBottom: '15px' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0' }}>{selectedTravel.title}</h2>
                <p style={{ margin: '0', color: '#666', fontSize: '0.95rem' }}>
                  por <strong>@{selectedTravel.author.username}</strong> em {selectedTravel.createdAt}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: '#f0f0f0',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Conteúdo em abas colapsáveis */}

            {/* 1. INFORMAÇÕES GERAIS */}
            <CollapsibleSection
              title="📋 Informações Gerais"
              icon={FaFileAlt}
              section="general"
              isOpen={expandedSections.general}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <strong style={{ color: '#0066cc' }}>Status:</strong>
                  <p>{getStatusLabel(selectedTravel.status)}</p>
                </div>
                <div>
                  <strong style={{ color: '#0066cc' }}>Localização:</strong>
                  <p>{selectedTravel.city}, {selectedTravel.country}</p>
                </div>
                <div>
                  <strong style={{ color: '#0066cc' }}>Duração:</strong>
                  <p>{selectedTravel.days} dias ({selectedTravel.startDate} a {selectedTravel.endDate})</p>
                </div>
                <div>
                  <strong style={{ color: '#0066cc' }}>Idioma:</strong>
                  <p>{selectedTravel.language}</p>
                </div>
                <div>
                  <strong style={{ color: '#0066cc' }}>Categorias:</strong>
                  <p>{selectedTravel.categories.join(', ')}</p>
                </div>
                <div>
                  <strong style={{ color: '#0066cc' }}>Clima:</strong>
                  <p>{selectedTravel.climate}</p>
                </div>
              </div>
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e9ecef' }}>
                <strong style={{ color: '#0066cc' }}>Descrição:</strong>
                <p>{selectedTravel.description}</p>
                <strong style={{ color: '#0066cc', marginTop: '10px', display: 'block' }}>Descrição Longa:</strong>
                <p>{selectedTravel.longDescription}</p>
              </div>
            </CollapsibleSection>

            {/* 2. PREÇOS */}
            <CollapsibleSection
              title="💰 Detalhes de Preço"
              icon={FaMoneyBillWave}
              section="pricing"
              isOpen={expandedSections.pricing}
            >
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>Preço Total: €{selectedTravel.price}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {Object.entries(selectedTravel.priceDetails).map(([key, value]) => (
                    <div key={key} style={{ padding: '10px', background: 'white', borderRadius: '6px' }}>
                      <span style={{ textTransform: 'capitalize' }}>{key}: </span>
                      <strong>€{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {/* 3. IMAGENS */}
            <CollapsibleSection
              title="🖼️ Imagens"
              icon={FaImage}
              section="images"
              isOpen={expandedSections.images}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                {Object.entries(selectedTravel.images).map(([category, images]) => (
                  <div key={category}>
                    <h5 style={{ textTransform: 'capitalize', marginBottom: '8px', color: '#0066cc' }}>
                      {category} ({images.length})
                    </h5>
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '100%',
                          height: '100px',
                          background: '#f0f0f0',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px',
                          fontSize: '2rem'
                        }}
                      >
                        🖼️
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* 4. VÍDEOS */}
            <CollapsibleSection
              title="🎬 Vídeos"
              icon={FaVideo}
              section="videos"
              isOpen={expandedSections.videos}
            >
              <p style={{ marginBottom: '15px' }}>Total de vídeos: <strong>{selectedTravel.videos.length}</strong></p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {selectedTravel.videos.map((video, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#000',
                      height: '150px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '3rem'
                    }}
                  >
                    ▶️
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* 5. ACOMODAÇÕES */}
            <CollapsibleSection
              title="🏨 Acomodações"
              icon={FaHotel}
              section="accommodations"
              isOpen={expandedSections.accommodations}
            >
              {selectedTravel.accommodations.map((acc, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>{acc.name}</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.95rem' }}>
                    <div><strong>Tipo:</strong> {acc.type}</div>
                    <div><strong>Regime:</strong> {acc.regime}</div>
                    <div><strong>Check-in:</strong> {acc.checkInDate}</div>
                    <div><strong>Check-out:</strong> {acc.checkOutDate}</div>
                    <div><strong>Classificação:</strong> ⭐ {acc.rating}</div>
                    <div><strong>Preço:</strong> €{acc.price}</div>
                  </div>
                  <p style={{ marginTop: '10px', color: '#666' }}>{acc.description}</p>
                </div>
              ))}
            </CollapsibleSection>

            {/* 6. RECOMENDAÇÕES DE COMIDA */}
            <CollapsibleSection
              title="🍽️ Recomendações de Comida"
              icon={FaUtensils}
              section="food"
              isOpen={expandedSections.food}
            >
              {selectedTravel.foodRecommendations.map((food, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    marginBottom: '10px'
                  }}
                >
                  <h5 style={{ margin: '0 0 5px 0', color: '#0066cc' }}>{food.name}</h5>
                  <p style={{ margin: '0 0 5px 0' }}>{food.description}</p>
                  <small style={{ color: '#666' }}>Restaurante: {food.restaurant}</small>
                </div>
              ))}
            </CollapsibleSection>

            {/* 7. PONTOS DE INTERESSE */}
            <CollapsibleSection
              title="📍 Pontos de Interesse"
              icon={FaMapPin}
              section="poi"
              isOpen={expandedSections.poi}
            >
              {selectedTravel.pointsOfInterest.map((poi, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    marginBottom: '10px'
                  }}
                >
                  <h5 style={{ margin: '0 0 5px 0', color: '#0066cc' }}>{poi.name}</h5>
                  <p style={{ margin: '0' }}>Tipo: {poi.type} | <a href={poi.link} target="_blank" rel="noopener noreferrer">Ver mais</a></p>
                </div>
              ))}
            </CollapsibleSection>

            {/* 8. SEGURANÇA E VACINAÇÕES */}
            <CollapsibleSection
              title="🛡️ Segurança e Vacinações"
              icon={FaShieldAlt}
              section="safety"
              isOpen={expandedSections.safety}
            >
              <div>
                <h5 style={{ color: '#0066cc', marginBottom: '10px' }}>Dicas de Segurança:</h5>
                <ul style={{ marginLeft: '20px' }}>
                  {selectedTravel.safety.tips.map((tip, idx) => (
                    <li key={idx} style={{ marginBottom: '5px' }}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div style={{ marginTop: '15px' }}>
                <h5 style={{ color: '#0066cc', marginBottom: '10px' }}>Vacinações Recomendadas:</h5>
                <ul style={{ marginLeft: '20px' }}>
                  {selectedTravel.safety.vaccinations.map((vac, idx) => (
                    <li key={idx} style={{ marginBottom: '5px' }}>{vac}</li>
                  ))}
                </ul>
              </div>
            </CollapsibleSection>

            {/* 9. ITINERÁRIO */}
            <CollapsibleSection
              title="📅 Itinerário Completo"
              icon={FaCalendarAlt}
              section="itinerary"
              isOpen={expandedSections.itinerary}
            >
              {selectedTravel.itinerary.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '15px',
                    background: '#e7f3ff',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    borderLeft: '4px solid #0066cc'
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0' }}>Dia {day.day}: {day.title}</h5>
                  <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                    {day.activities.map((activity, aIdx) => (
                      <li key={aIdx} style={{ marginBottom: '5px' }}>{activity}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CollapsibleSection>

            {/* 10. REVIEWS */}
            <CollapsibleSection
              title="⭐ Reviews e Avaliações"
              icon={FaStar}
              section="reviews"
              isOpen={expandedSections.reviews}
            >
              {selectedTravel.reviews.map((review, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong>{review.user}</strong>
                    <span style={{ color: '#ff9900' }}>{'⭐'.repeat(review.rating)}</span>
                  </div>
                  <p style={{ margin: '0', color: '#666' }}>{review.comment}</p>
                </div>
              ))}
            </CollapsibleSection>

            {/* 11. PONTOS NEGATIVOS */}
            <CollapsibleSection
              title="⚠️ Pontos Negativos"
              icon={FaThumbsDown}
              section="negative"
              isOpen={expandedSections.negative}
            >
              <p style={{ padding: '15px', background: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ff9900' }}>
                {selectedTravel.negativePoints}
              </p>
            </CollapsibleSection>

            {/* 12. DENÚNCIAS */}
            {selectedTravel.reportCount > 0 && (
              <CollapsibleSection
                title="🚩 Denúncias"
                icon={FaFlag}
                section="reports"
                isOpen={expandedSections.reports}
              >
                <p>Esta viagem foi denunciada <strong>{selectedTravel.reportCount}</strong> vezes.</p>
                <p><strong>Motivos:</strong> {selectedTravel.flagReasons.join(', ')}</p>
              </CollapsibleSection>
            )}

            {/* AÇÕES */}
            <div style={{ marginTop: '30px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
              <h4 style={{ marginBottom: '15px' }}>⚡ Ações</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <button
                  onClick={() => handleUpdateStatus('published')}
                  disabled={isLoading}
                  className="btn-success-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1 }}
                >
                  <FaCheckCircle /> Publicar
                </button>
                <button
                  onClick={() => handleUpdateStatus('flagged')}
                  disabled={isLoading}
                  className="btn-warning-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1 }}
                >
                  <FaFlag /> Marcar
                </button>
                <button
                  onClick={() => handleUpdateStatus('suspended')}
                  disabled={isLoading}
                  className="btn-danger-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1 }}
                >
                  <FaTimes /> Suspender
                </button>
                <button
                  onClick={handleDeleteTravel}
                  disabled={isLoading}
                  className="btn-danger-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1, background: '#8b0000' }}
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>

            {/* Botão Fechar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary-admin"
                style={{ padding: '10px 20px' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default TravelModerationComplete;
