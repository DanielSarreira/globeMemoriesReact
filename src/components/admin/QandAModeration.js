// src/components/admin/QandAModeration.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';
import {
  FaEye, FaTrash, FaBan, FaExclamationTriangle, FaCheck, FaTimes,
  FaSearch, FaFilter, FaUser, FaFlag, FaQuestion, FaReply, FaCalendarAlt,
  FaThumbsUp, FaArrowUp, FaArrowDown, FaCheckCircle, FaList,
  FaMapMarkerAlt, FaTags
} from 'react-icons/fa';

const QandAModeration = () => {
  // Mock data
  const [qanda, setQanda] = useState([
    {
      _id: '1',
      type: 'question',
      title: 'Qual é o melhor mês para visitar Lisboa?',
      content: 'Gostaria de saber qual é o melhor mês para visitar Lisboa em termos de clima e menos multidões.',
      author: { username: 'ana', firstName: 'Ana', lastName: 'Silva' },
      category: 'Informações',
      country: 'Portugal',
      city: 'Lisboa',
      status: 'approved',
      createdAt: '2025-03-10',
      likes: 15,
      replies: 4,
      views: 128,
      reportCount: 0,
      flagged: false,
      resolved: false,
      parentId: null
    },
    {
      _id: '2',
      type: 'answer',
      title: null,
      content: 'Setembro e outubro são os melhores meses! Clima perfeito e não está tão cheio como em julho e agosto.',
      author: { username: 'tiago', firstName: 'Tiago', lastName: 'Miranda' },
      category: null,
      country: null,
      city: null,
      status: 'approved',
      createdAt: '2025-03-11',
      likes: 12,
      replies: 0,
      views: 0,
      reportCount: 0,
      flagged: false,
      resolved: false,
      parentId: '1'
    },
    {
      _id: '3',
      type: 'question',
      title: 'PRECISO DE AJUDA URGENTE!!!',
      content: 'CLIQUEM NO MEU LINK: scam.com/get-rich GANHEM DINHEIRO FÁCIL!!!',
      author: { username: 'spammer', firstName: 'Spammer', lastName: 'User' },
      category: 'Outro',
      country: 'Unknown',
      city: 'Unknown',
      status: 'pending',
      createdAt: '2025-03-09',
      likes: 0,
      replies: 0,
      views: 5,
      reportCount: 6,
      flagged: true,
      resolved: false,
      parentId: null,
      flagReasons: ['spam', 'inappropriate', 'harassment']
    },
    {
      _id: '4',
      type: 'question',
      title: 'Visto para brasileiros em Portugal',
      content: 'Como funciona o visto para brasileiros? Quanto tempo demora?',
      author: { username: 'maria', firstName: 'Maria', lastName: 'Santos' },
      category: 'Documentação',
      country: 'Portugal',
      city: null,
      status: 'approved',
      createdAt: '2025-03-08',
      likes: 8,
      replies: 2,
      views: 87,
      reportCount: 0,
      flagged: false,
      resolved: true,
      parentId: null
    },
    {
      _id: '5',
      type: 'answer',
      title: null,
      content: 'Você é um idiota! Que pergunta estúpida!',
      author: { username: 'troll', firstName: 'Troll', lastName: 'User' },
      category: null,
      country: null,
      city: null,
      status: 'flagged',
      createdAt: '2025-03-07',
      likes: 0,
      replies: 0,
      views: 0,
      reportCount: 3,
      flagged: true,
      resolved: false,
      parentId: '4',
      flagReasons: ['abusive', 'harassment']
    }
  ]);

  const [stats, setStats] = useState({
    totalQuestions: 350,
    approvedQuestions: 300,
    flaggedQuestions: 28,
    pendingQuestions: 22,
    resolvedQuestions: 180,
    totalAnswers: 650,
    reportedQandA: 45
  });

  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedQA, setSelectedQA] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  // Filtrar Q&A
  const filteredQA = qanda
    .filter(item => {
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.username.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'reports') return b.reportCount - a.reportCount;
      if (sortBy === 'likes') return b.likes - a.likes;
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
      approved: '#28a745',
      pending: '#ffc107',
      flagged: '#dc3545',
      deleted: '#6c757d',
      spam: '#ff6b6b'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      approved: '✓ Aprovado',
      pending: '⏳ Pendente',
      flagged: '🚩 Marcado',
      deleted: '🗑️ Deletado',
      spam: '🚫 Spam'
    };
    return labels[status] || status;
  };

  const handleViewDetails = (item) => {
    setSelectedQA(item);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedQA) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setQanda(qanda.map(item =>
        item._id === selectedQA._id
          ? { ...item, status: newStatus, updatedAt: new Date().toLocaleDateString() }
          : item
      ));

      setSelectedQA(prev => ({ ...prev, status: newStatus }));
      showToast(`Status atualizado para ${newStatus}!`, 'success');
    } catch (error) {
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQA = async () => {
    if (!selectedQA) return;

    if (!window.confirm('Tem a certeza que deseja eliminar isto? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setQanda(qanda.filter(item => item._id !== selectedQA._id));
      showToast('Item eliminado com sucesso!', 'success');
      setShowDetailModal(false);
      setSelectedQA(null);
    } catch (error) {
      showToast('Erro ao eliminar item', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleResolved = async () => {
    if (!selectedQA || selectedQA.type !== 'question') return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setQanda(qanda.map(item =>
        item._id === selectedQA._id
          ? { ...item, resolved: !item.resolved }
          : item
      ));

      setSelectedQA(prev => ({ ...prev, resolved: !prev.resolved }));
      showToast(`Marcado como ${!selectedQA.resolved ? 'resolvido' : 'não resolvido'}!`, 'success');
    } catch (error) {
      showToast('Erro ao atualizar resolução', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>❓ Moderação de Q&A</h2>

      {/* Estatísticas */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #0066cc' }}>
          <h4>Perguntas</h4>
          <p style={{ fontSize: '1.8rem', color: '#0066cc' }}>{stats.totalQuestions}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
          <h4>Resolvidas</h4>
          <p style={{ fontSize: '1.8rem', color: '#28a745' }}>{stats.resolvedQuestions}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #dc3545' }}>
          <h4>Marcadas</h4>
          <p style={{ fontSize: '1.8rem', color: '#dc3545' }}>{stats.flaggedQuestions}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ff6b6b' }}>
          <h4>Reportadas</h4>
          <p style={{ fontSize: '1.8rem', color: '#ff6b6b' }}>{stats.reportedQandA}</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        {/* Pesquisa */}
        <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
          <FaSearch style={{ marginTop: '8px', color: '#666' }} />
          <input
            type="text"
            placeholder="Pesquisar por título, conteúdo, autor..."
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

        {/* Filtro Tipo */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '0.95rem'
          }}
        >
          <option value="all">Todos os Tipos</option>
          <option value="question">Perguntas</option>
          <option value="answer">Respostas</option>
        </select>

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
          <option value="approved">Aprovado</option>
          <option value="pending">Pendente</option>
          <option value="flagged">Marcado</option>
          <option value="spam">Spam</option>
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
          <option value="reports">Mais Reportados</option>
          <option value="likes">Mais Populares</option>
          <option value="views">Mais Vistos</option>
        </select>
      </div>

      {/* Tabela de Q&A */}
      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table className="admin-table-admin" style={{ width: '100%', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Título/Conteúdo</th>
              <th>Autor</th>
              <th>Status</th>
              <th>Denúncias</th>
              <th>Interações</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredQA.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Nenhum item encontrado
                </td>
              </tr>
            ) : (
              filteredQA.map(item => (
                <tr
                  key={item._id}
                  style={{
                    borderLeft: `4px solid ${getStatusColor(item.status)}`,
                    background: item.flagged ? '#fff3cd' : 'transparent'
                  }}
                >
                  <td>
                    <span style={{
                      background: item.type === 'question' ? '#0066cc' : '#17a2b8',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {item.type === 'question' ? '❓ Pergunta' : '💬 Resposta'}
                    </span>
                  </td>
                  <td>
                    {item.type === 'question' ? (
                      <>
                        <strong title={item.title}>{item.title.substring(0, 40)}...</strong>
                        {item.resolved && (
                          <div style={{ marginTop: '5px', color: '#28a745', fontSize: '0.85rem' }}>
                            ✓ Resolvido
                          </div>
                        )}
                      </>
                    ) : (
                      <span title={item.content}>{item.content.substring(0, 40)}...</span>
                    )}
                  </td>
                  <td>
                    <strong>@{item.author.username}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{item.author.firstName} {item.author.lastName}</small>
                  </td>
                  <td>
                    <span
                      style={{
                        background: getStatusColor(item.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>
                    {item.reportCount > 0 ? (
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        <FaFlag style={{ marginRight: '5px' }} />
                        {item.reportCount}
                      </span>
                    ) : (
                      <span style={{ color: '#28a745' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span title="Likes">
                        <FaThumbsUp style={{ marginRight: '3px', color: '#0066cc' }} />
                        {item.likes}
                      </span>
                      <span title="Respostas">
                        <FaReply style={{ marginRight: '3px', color: '#666' }} />
                        {item.replies}
                      </span>
                      {item.views > 0 && (
                        <span title="Visualizações">
                          <FaEye style={{ marginRight: '3px', color: '#666' }} />
                          {item.views}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{item.createdAt}</td>
                  <td>
                    <button
                      className="btn-info-admin"
                      onClick={() => handleViewDetails(item)}
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
      {showDetailModal && selectedQA && (
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
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3>{selectedQA.type === 'question' ? '❓ Pergunta' : '💬 Resposta'}</h3>
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

            {/* Título (para perguntas) */}
            {selectedQA.type === 'question' && selectedQA.title && (
              <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '10px' }}>Título</h4>
                <p style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#333' }}>
                  {selectedQA.title}
                </p>
              </div>
            )}

            {/* Conteúdo */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '10px' }}>Conteúdo</h4>
              <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#555' }}>
                {selectedQA.content}
              </p>
            </div>

            {/* Informações do Autor */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
              <h4 style={{ marginBottom: '15px' }}>👤 Informações do Autor</h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div><strong>Nome:</strong> {selectedQA.author.firstName} {selectedQA.author.lastName}</div>
                <div><strong>Username:</strong> @{selectedQA.author.username}</div>
                <div><strong>Data:</strong> {selectedQA.createdAt}</div>
              </div>
            </div>

            {/* Informações de Categorização (perguntas) */}
            {selectedQA.type === 'question' && (
              <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '15px' }}>🏷️ Categorização</h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {selectedQA.category && (
                    <div><strong>Categoria:</strong> {selectedQA.category}</div>
                  )}
                  {selectedQA.country && (
                    <div><strong>País:</strong> {selectedQA.country}</div>
                  )}
                  {selectedQA.city && (
                    <div><strong>Cidade:</strong> {selectedQA.city}</div>
                  )}
                </div>
              </div>
            )}

            {/* Estatísticas */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>📊 Estatísticas</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <strong><FaThumbsUp /> Likes:</strong>
                  <p style={{ fontSize: '1.3rem', color: '#0066cc', marginTop: '5px' }}>{selectedQA.likes}</p>
                </div>
                <div>
                  <strong><FaReply /> Respostas:</strong>
                  <p style={{ fontSize: '1.3rem', color: '#0066cc', marginTop: '5px' }}>{selectedQA.replies}</p>
                </div>
                {selectedQA.views > 0 && (
                  <div>
                    <strong><FaEye /> Visualizações:</strong>
                    <p style={{ fontSize: '1.3rem', color: '#0066cc', marginTop: '5px' }}>{selectedQA.views}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Denúncias */}
            {selectedQA.reportCount > 0 && (
              <div style={{ marginBottom: '25px', padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                <h4 style={{ marginBottom: '15px' }}>
                  <FaExclamationTriangle style={{ marginRight: '10px', color: '#ff9900' }} />
                  Denúncias ({selectedQA.reportCount})
                </h4>
                {selectedQA.flagReasons && (
                  <div style={{ marginTop: '10px' }}>
                    {selectedQA.flagReasons.map((reason, idx) => (
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
                )}
              </div>
            )}

            {/* Ações */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
              <h4 style={{ marginBottom: '15px' }}>⚡ Ações</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={isLoading}
                  className="btn-success-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1 }}
                >
                  <FaCheckCircle /> Aprovar
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
                  onClick={() => handleUpdateStatus('spam')}
                  disabled={isLoading}
                  className="btn-danger-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1 }}
                >
                  <FaTimes /> Spam
                </button>
                <button
                  onClick={handleDeleteQA}
                  disabled={isLoading}
                  className="btn-danger-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1, background: '#8b0000' }}
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
              {selectedQA.type === 'question' && (
                <button
                  onClick={handleToggleResolved}
                  disabled={isLoading}
                  className="btn-info-admin"
                  style={{ width: '100%', marginTop: '10px', padding: '10px', opacity: isLoading ? 0.6 : 1 }}
                >
                  {selectedQA.resolved ? '❌ Marcar como Não Resolvido' : '✓ Marcar como Resolvido'}
                </button>
              )}
            </div>

            {/* Botão Fechar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

export default QandAModeration;
