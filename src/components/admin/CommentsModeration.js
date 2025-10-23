// src/components/admin/CommentsModeration.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';
import {
  FaEye, FaTrash, FaBan, FaExclamationTriangle, FaCheck, FaTimes,
  FaSearch, FaFilter, FaUser, FaFlag, FaImage, FaReply, FaCalendarAlt,
  FaThumbsUp, FaThumbsDown, FaArrowUp, FaArrowDown, FaAlertTriangle,
  FaCheckCircle, FaComment
} from 'react-icons/fa';

const CommentsModeration = () => {
  // Mock data
  const [comments, setComments] = useState([
    {
      _id: '1',
      text: 'Uma viagem incrível! Adorei cada momento.',
      author: { username: 'ana', firstName: 'Ana', lastName: 'Silva' },
      travelId: { title: 'Viagem a Lisboa', author: 'tiago' },
      status: 'approved',
      createdAt: '2025-03-10',
      likes: 12,
      replies: 2,
      reportCount: 0,
      flagged: false,
      depth: 0,
      parentCommentId: null
    },
    {
      _id: '2',
      text: 'Que viagem de merda! Tudo mentira, fotos fake!!!',
      author: { username: 'spammer', firstName: 'Spammer', lastName: 'User' },
      travelId: { title: 'Beach Paradise', author: 'ana' },
      status: 'flagged',
      createdAt: '2025-03-09',
      likes: 0,
      replies: 0,
      reportCount: 5,
      flagged: true,
      depth: 0,
      parentCommentId: null,
      flagReasons: ['abusive', 'spam', 'inappropriate']
    },
    {
      _id: '3',
      text: 'Concordo totalmente! Esse destino é mesmo incrível.',
      author: { username: 'joao', firstName: 'João', lastName: 'Silva' },
      travelId: { title: 'Viagem a Lisboa', author: 'tiago' },
      status: 'approved',
      createdAt: '2025-03-08',
      likes: 5,
      replies: 0,
      reportCount: 0,
      flagged: false,
      depth: 1,
      parentCommentId: '1'
    },
    {
      _id: '4',
      text: 'COMPREM MEUS PRODUTOS! Link aqui: spam.com/products',
      author: { username: 'spammer2', firstName: 'Spammer', lastName: 'Two' },
      travelId: { title: 'Beach Paradise', author: 'ana' },
      status: 'pending',
      createdAt: '2025-03-07',
      likes: 0,
      replies: 0,
      reportCount: 3,
      flagged: false,
      depth: 0,
      parentCommentId: null
    },
    {
      _id: '5',
      text: 'Pode fazer um tutorial sobre como fotografar nestes locais?',
      author: { username: 'maria', firstName: 'Maria', lastName: 'Santos' },
      travelId: { title: 'Viagem a Lisboa', author: 'tiago' },
      status: 'approved',
      createdAt: '2025-03-06',
      likes: 8,
      replies: 1,
      reportCount: 0,
      flagged: false,
      depth: 0,
      parentCommentId: null
    }
  ]);

  const [stats, setStats] = useState({
    totalComments: 450,
    approvedComments: 390,
    flaggedComments: 28,
    pendingComments: 32,
    reportedComments: 45,
    spamComments: 15
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedComment, setSelectedComment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [actionType, setActionType] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Filtrar comentários
  const filteredComments = comments
    .filter(comment => {
      const matchesStatus = filterStatus === 'all' || comment.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.author.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.travelId.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'reports') return b.reportCount - a.reportCount;
      if (sortBy === 'likes') return b.likes - a.likes;
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

  const handleViewDetails = (comment) => {
    setSelectedComment(comment);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedComment) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setComments(comments.map(c =>
        c._id === selectedComment._id
          ? { ...c, status: newStatus, updatedAt: new Date().toLocaleDateString() }
          : c
      ));

      setSelectedComment(prev => ({ ...prev, status: newStatus }));
      showToast(`Status atualizado para ${newStatus}!`, 'success');
    } catch (error) {
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedComment) return;

    if (!window.confirm('Tem a certeza que deseja eliminar este comentário? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setComments(comments.filter(c => c._id !== selectedComment._id));
      showToast('Comentário eliminado com sucesso!', 'success');
      setShowDetailModal(false);
      setSelectedComment(null);
    } catch (error) {
      showToast('Erro ao eliminar comentário', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedComment) return;

    if (!window.confirm(`Tem certeza que deseja banir o utilizador @${selectedComment.author.username}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      showToast(`Utilizador @${selectedComment.author.username} foi banido!`, 'success');
      setShowDetailModal(false);
      setSelectedComment(null);
    } catch (error) {
      showToast('Erro ao banir utilizador', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>💬 Moderação de Comentários</h2>

      {/* Estatísticas */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
          <h4>Aprovados</h4>
          <p style={{ fontSize: '1.8rem', color: '#28a745' }}>{stats.approvedComments}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #dc3545' }}>
          <h4>Marcados</h4>
          <p style={{ fontSize: '1.8rem', color: '#dc3545' }}>{stats.flaggedComments}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ffc107' }}>
          <h4>Pendentes</h4>
          <p style={{ fontSize: '1.8rem', color: '#ffc107' }}>{stats.pendingComments}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ff6b6b' }}>
          <h4>Reportados</h4>
          <p style={{ fontSize: '1.8rem', color: '#ff6b6b' }}>{stats.reportedComments}</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        {/* Pesquisa */}
        <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
          <FaSearch style={{ marginTop: '8px', color: '#666' }} />
          <input
            type="text"
            placeholder="Pesquisar por texto, autor, viagem..."
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
        </select>
      </div>

      {/* Tabela de Comentários */}
      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table className="admin-table-admin" style={{ width: '100%', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th>Comentário</th>
              <th>Autor</th>
              <th>Viagem</th>
              <th>Status</th>
              <th>Denúncias</th>
              <th>Interações</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredComments.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Nenhum comentário encontrado
                </td>
              </tr>
            ) : (
              filteredComments.map(comment => (
                <tr
                  key={comment._id}
                  style={{
                    borderLeft: `4px solid ${getStatusColor(comment.status)}`,
                    background: comment.flagged ? '#fff3cd' : 'transparent',
                    paddingLeft: `${comment.depth * 20}px`
                  }}
                >
                  <td>
                    <span title={comment.text} style={{ display: 'block' }}>
                      {comment.text.substring(0, 50)}...
                    </span>
                    {comment.depth > 0 && (
                      <small style={{ color: '#666', marginTop: '5px' }}>
                        <FaReply /> Resposta
                      </small>
                    )}
                  </td>
                  <td>
                    <strong>@{comment.author.username}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{comment.author.firstName} {comment.author.lastName}</small>
                  </td>
                  <td>
                    <span title={comment.travelId.title}>
                      {comment.travelId.title.substring(0, 30)}...
                    </span>
                    <br />
                    <small style={{ color: '#666' }}>por {comment.travelId.author}</small>
                  </td>
                  <td>
                    <span
                      style={{
                        background: getStatusColor(comment.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {getStatusLabel(comment.status)}
                    </span>
                  </td>
                  <td>
                    {comment.reportCount > 0 ? (
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        <FaFlag style={{ marginRight: '5px' }} />
                        {comment.reportCount}
                      </span>
                    ) : (
                      <span style={{ color: '#28a745' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span title="Likes">
                        <FaThumbsUp style={{ marginRight: '3px', color: '#0066cc' }} />
                        {comment.likes}
                      </span>
                      <span title="Respostas">
                        <FaReply style={{ marginRight: '3px', color: '#666' }} />
                        {comment.replies}
                      </span>
                    </div>
                  </td>
                  <td>{comment.createdAt}</td>
                  <td>
                    <button
                      className="btn-info-admin"
                      onClick={() => handleViewDetails(comment)}
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
      {showDetailModal && selectedComment && (
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
              <h3>Detalhes do Comentário</h3>
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

            {/* Conteúdo do Comentário */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>💬 Comentário</h4>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#333', fontStyle: 'italic' }}>
                "{selectedComment.text}"
              </p>
            </div>

            {/* Informações do Autor */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
              <h4 style={{ marginBottom: '15px' }}>👤 Informações do Autor</h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div><strong>Nome:</strong> {selectedComment.author.firstName} {selectedComment.author.lastName}</div>
                <div><strong>Username:</strong> @{selectedComment.author.username}</div>
                <div><strong>Data do Comentário:</strong> {selectedComment.createdAt}</div>
              </div>
            </div>

            {/* Informações da Viagem */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>🗺️ Viagem Associada</h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div><strong>Título:</strong> {selectedComment.travelId.title}</div>
                <div><strong>Autor:</strong> @{selectedComment.travelId.author}</div>
              </div>
            </div>

            {/* Estatísticas */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>📊 Estatísticas</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div>
                  <strong><FaThumbsUp /> Likes:</strong>
                  <p style={{ fontSize: '1.3rem', color: '#0066cc', marginTop: '5px' }}>{selectedComment.likes}</p>
                </div>
                <div>
                  <strong><FaReply /> Respostas:</strong>
                  <p style={{ fontSize: '1.3rem', color: '#0066cc', marginTop: '5px' }}>{selectedComment.replies}</p>
                </div>
                <div>
                  <strong><FaFlag /> Denúncias:</strong>
                  <p style={{ fontSize: '1.3rem', color: selectedComment.reportCount > 0 ? '#dc3545' : '#28a745', marginTop: '5px' }}>
                    {selectedComment.reportCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Denúncias */}
            {selectedComment.reportCount > 0 && (
              <div style={{ marginBottom: '25px', padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                <h4 style={{ marginBottom: '15px' }}>
                  <FaExclamationTriangle style={{ marginRight: '10px', color: '#ff9900' }} />
                  Denúncias ({selectedComment.reportCount})
                </h4>
                <p>Este comentário foi denunciado {selectedComment.reportCount} vezes.</p>
                {selectedComment.flagReasons && (
                  <div style={{ marginTop: '10px' }}>
                    {selectedComment.flagReasons.map((reason, idx) => (
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

            {/* Status */}
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
                  onClick={handleDeleteComment}
                  disabled={isLoading}
                  className="btn-danger-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1, background: '#8b0000' }}
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
              <button
                onClick={handleBanUser}
                disabled={isLoading}
                className="btn-danger-admin"
                style={{ width: '100%', marginTop: '10px', padding: '10px', background: '#d32f2f', opacity: isLoading ? 0.6 : 1 }}
              >
                <FaBan /> Banir Utilizador
              </button>
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

export default CommentsModeration;
