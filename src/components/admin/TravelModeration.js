// src/components/admin/TravelModeration.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';
import {
  FaEye, FaEdit, FaTrash, FaExclamationTriangle, FaCheck, FaTimes,
  FaSearch, FaFilter, FaImage, FaVideo, FaMapMarkerAlt, FaCalendarAlt,
  FaMoneyBillWave, FaClock, FaUser, FaFlag, FaHeart, FaComment,
  FaFileAlt, FaChevronDown, FaChevronUp, FaAlertTriangle, FaCheckCircle
} from 'react-icons/fa';

const TravelModeration = () => {
  // Mock data
  const [travels, setTravels] = useState([
    {
      _id: '1',
      title: 'Viagem a Lisboa - Semana Completa',
      author: { username: 'tiago', firstName: 'Tiago', lastName: 'Miranda' },
      country: 'Portugal',
      city: 'Lisboa',
      category: ['Turismo', 'Cultura'],
      status: 'published',
      createdAt: '2025-03-01',
      updatedAt: '2025-03-01',
      reportCount: 3,
      views: 245,
      likes: 42,
      comments: 18,
      imageCount: 12,
      videoCount: 2,
      price: 850,
      days: 7,
      flagged: false,
      flagReasons: [],
      images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      videos: ['video1.mp4', 'video2.mp4'],
      description: 'Uma viagem incrível pela capital portuguesa...',
      reviews: 4.8
    },
    {
      _id: '2',
      title: 'Beach Paradise in Brazil',
      author: { username: 'ana', firstName: 'Ana', lastName: 'Silva' },
      country: 'Brasil',
      city: 'Rio de Janeiro',
      category: ['Praia', 'Lazer'],
      status: 'pending',
      createdAt: '2025-03-05',
      updatedAt: '2025-03-05',
      reportCount: 0,
      views: 0,
      likes: 0,
      comments: 0,
      imageCount: 8,
      videoCount: 1,
      price: 1200,
      days: 5,
      flagged: false,
      flagReasons: [],
      images: ['br1.jpg'],
      videos: [],
      description: 'Praias paradisíacas do Brasil',
      reviews: 0
    },
    {
      _id: '3',
      title: 'Viagem Suspeita com Imagens Questionáveis',
      author: { username: 'spammer', firstName: 'Spammer', lastName: 'User' },
      country: 'Unknown',
      city: 'Unknown',
      category: ['Outro'],
      status: 'flagged',
      createdAt: '2025-03-03',
      updatedAt: '2025-03-03',
      reportCount: 8,
      views: 12,
      likes: 0,
      comments: 2,
      imageCount: 20,
      videoCount: 5,
      price: 0,
      days: 0,
      flagged: true,
      flagReasons: ['inappropriate', 'falseInfo', 'spam'],
      images: ['suspicious1.jpg', 'suspicious2.jpg'],
      videos: [],
      description: 'Conteúdo questionável',
      reviews: 0
    }
  ]);

  const [stats, setStats] = useState({
    totalTravels: 150,
    publishedTravels: 120,
    pendingTravels: 15,
    flaggedTravels: 8,
    suspendedTravels: 7,
    averageRating: 4.5
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTravel, setEditedTravel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [actionType, setActionType] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Filtrar viagens
  const filteredTravels = travels
    .filter(travel => {
      const matchesStatus = filterStatus === 'all' || travel.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        travel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        travel.author.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        travel.city.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'reports') return b.reportCount - a.reportCount;
      if (sortBy === 'views') return b.views - a.views;
      return 0;
    });

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const getStatusColor = (status) => {
    const colors = {
      published: '#28a745',
      pending: '#ffc107',
      flagged: '#dc3545',
      suspended: '#6c757d',
      deleted: '#000'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      published: '✓ Publicada',
      pending: '⏳ Pendente',
      flagged: '🚩 Marcada',
      suspended: '🚫 Suspensa',
      deleted: '🗑️ Deletada'
    };
    return labels[status] || status;
  };

  const handleViewDetails = (travel) => {
    setSelectedTravel(travel);
    setEditedTravel({ ...travel });
    setShowDetailModal(true);
    setIsEditing(false);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTravel) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setTravels(travels.map(t =>
        t._id === selectedTravel._id
          ? { ...t, status: newStatus, updatedAt: new Date().toLocaleDateString() }
          : t
      ));

      setSelectedTravel(prev => ({ ...prev, status: newStatus }));
      showToast(`Status atualizado para ${newStatus}!`, 'success');
    } catch (error) {
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTravel = async () => {
    if (!selectedTravel) return;

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

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setTravels(travels.map(t =>
        t._id === selectedTravel._id ? editedTravel : t
      ));

      setSelectedTravel(editedTravel);
      setIsEditing(false);
      showToast('Viagem atualizada com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao atualizar viagem', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>🛡️ Moderação de Viagens</h2>

      {/* Estatísticas */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
          <h4>Publicadas</h4>
          <p style={{ fontSize: '1.8rem', color: '#28a745' }}>{stats.publishedTravels}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ffc107' }}>
          <h4>Pendentes</h4>
          <p style={{ fontSize: '1.8rem', color: '#ffc107' }}>{stats.pendingTravels}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #dc3545' }}>
          <h4>Marcadas</h4>
          <p style={{ fontSize: '1.8rem', color: '#dc3545' }}>{stats.flaggedTravels}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #6c757d' }}>
          <h4>Suspensas</h4>
          <p style={{ fontSize: '1.8rem', color: '#6c757d' }}>{stats.suspendedTravels}</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        {/* Pesquisa */}
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

        {/* Filtro Status */}
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

        {/* Ordenar por */}
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
          <option value="reports">Mais Reportadas</option>
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
                <tr
                  key={travel._id}
                  style={{
                    borderLeft: `4px solid ${getStatusColor(travel.status)}`,
                    background: travel.flagged ? '#fff3cd' : 'transparent'
                  }}
                >
                  <td>
                    <strong title={travel.title}>
                      {travel.title.substring(0, 30)}...
                    </strong>
                  </td>
                  <td>{travel.author.username}</td>
                  <td>
                    <FaMapMarkerAlt style={{ marginRight: '5px', color: '#0066cc' }} />
                    {travel.city}, {travel.country}
                  </td>
                  <td>
                    <span
                      style={{
                        background: getStatusColor(travel.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
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
                  <td style={{ fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span title="Visualizações">
                        <FaEye style={{ marginRight: '3px', color: '#666' }} />
                        {travel.views}
                      </span>
                      <span title="Likes">
                        <FaHeart style={{ marginRight: '3px', color: '#dc3545' }} />
                        {travel.likes}
                      </span>
                      <span title="Comentários">
                        <FaComment style={{ marginRight: '3px', color: '#0066cc' }} />
                        {travel.comments}
                      </span>
                    </div>
                  </td>
                  <td>{travel.createdAt}</td>
                  <td>
                    <button
                      className="btn-info-admin"
                      onClick={() => handleViewDetails(travel)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      <FaEye /> Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes */}
      {showDetailModal && selectedTravel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3>Detalhes da Viagem</h3>
              <div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-info-admin"
                  style={{ marginRight: '10px', padding: '8px 16px' }}
                >
                  <FaEdit /> {isEditing ? 'Cancelar' : 'Editar'}
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Informações Básicas */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>ℹ️ Informações Básicas</h4>
              {isEditing ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>Título:</label>
                    <input
                      type="text"
                      value={editedTravel.title}
                      onChange={(e) => setEditedTravel({ ...editedTravel, title: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontWeight: 'bold' }}>País:</label>
                      <input
                        type="text"
                        value={editedTravel.country}
                        onChange={(e) => setEditedTravel({ ...editedTravel, country: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 'bold' }}>Cidade:</label>
                      <input
                        type="text"
                        value={editedTravel.city}
                        onChange={(e) => setEditedTravel({ ...editedTravel, city: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>Descrição:</label>
                    <textarea
                      value={editedTravel.description}
                      onChange={(e) => setEditedTravel({ ...editedTravel, description: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px', minHeight: '80px', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div><strong>Título:</strong> {selectedTravel.title}</div>
                  <div><strong>Autor:</strong> {selectedTravel.author.firstName} {selectedTravel.author.lastName} (@{selectedTravel.author.username})</div>
                  <div><strong>Localização:</strong> {selectedTravel.city}, {selectedTravel.country}</div>
                  <div><strong>Categorias:</strong> {selectedTravel.category.join(', ')}</div>
                  <div><strong>Status:</strong> {getStatusLabel(selectedTravel.status)}</div>
                  <div><strong>Data:</strong> {selectedTravel.createdAt}</div>
                </div>
              )}
            </div>

            {/* Estatísticas */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
              <h4 style={{ marginBottom: '15px' }}>📊 Estatísticas</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div>
                  <strong><FaEye /> Visualizações:</strong>
                  <p style={{ fontSize: '1.3rem', color: '#0066cc', marginTop: '5px' }}>{selectedTravel.views}</p>
                </div>
                <div>
                  <strong><FaHeart /> Likes:</strong>
                  <p style={{ fontSize: '1.3rem', color: '#dc3545', marginTop: '5px' }}>{selectedTravel.likes}</p>
                </div>
                <div>
                  <strong><FaComment /> Comentários:</strong>
                  <p style={{ fontSize: '1.3rem', color: '#0066cc', marginTop: '5px' }}>{selectedTravel.comments}</p>
                </div>
              </div>
            </div>

            {/* Conteúdo de Mídia */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>📸 Mídia</h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div>
                  <strong><FaImage /> Imagens:</strong> {selectedTravel.imageCount} imagens
                  {selectedTravel.imageCount > 0 && (
                    <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                      {selectedTravel.images.map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#ddd',
                            height: '100px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            color: '#666'
                          }}
                        >
                          {img}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <strong><FaVideo /> Vídeos:</strong> {selectedTravel.videoCount} vídeos
                </div>
              </div>
            </div>

            {/* Denúncias */}
            {selectedTravel.reportCount > 0 && (
              <div style={{ marginBottom: '25px', padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                <h4 style={{ marginBottom: '15px' }}>
                  <FaExclamationTriangle style={{ marginRight: '10px', color: '#ff9900' }} />
                  Denúncias ({selectedTravel.reportCount})
                </h4>
                <p>Esta viagem foi denunciada {selectedTravel.reportCount} vezes.</p>
                <div style={{ marginTop: '10px' }}>
                  {selectedTravel.flagReasons.map((reason, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        background: '#ff9900',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        marginRight: '8px',
                        marginBottom: '8px',
                        fontSize: '0.85rem'
                      }}
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
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

            {/* Botões de Salvamento */}
            {isEditing && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary-admin"
                  style={{ padding: '10px 20px' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  className="btn-success-admin"
                  style={{ padding: '10px 20px', opacity: isLoading ? 0.6 : 1 }}
                >
                  {isLoading ? '⏳ Salvando...' : '✓ Guardar Alterações'}
                </button>
              </div>
            )}

            {!isEditing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="btn-secondary-admin"
                  style={{ padding: '10px 20px' }}
                >
                  Fechar
                </button>
              </div>
            )}
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

export default TravelModeration;
