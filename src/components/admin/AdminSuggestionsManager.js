import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaThumbsUp, FaThumbsDown, FaEye, FaTimes, FaFilter, FaDownload } from 'react-icons/fa';
import { request } from '../../axios_helper';
import '../../styles/components/admin-suggestions.css';

const AdminSuggestionsManager = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [stats, setStats] = useState({});
  const [responseText, setResponseText] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('medium');

  useEffect(() => {
    loadSuggestions();
    loadStats();
  }, [filterStatus, filterType]);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await request('get', `/api/suggestions/admin/all?${params}`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await request('get', '/api/suggestions/stats/summary');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const updateStatus = async (suggestionId, newStatus) => {
    try {
      await request('patch', `/api/suggestions/${suggestionId}/status`, {
        status: newStatus,
        priority: priorityLevel,
        updatedAt: new Date()
      });
      loadSuggestions();
      loadStats();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const addResponse = async (suggestionId) => {
    if (!responseText.trim()) return;

    try {
      await request('post', `/api/suggestions/${suggestionId}/response`, {
        adminId: 'admin-id', // Replace com ID real do admin
        adminName: 'Admin',
        message: responseText
      });
      setResponseText('');
      loadSuggestions();
    } catch (error) {
      console.error('Erro ao adicionar resposta:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      reviewing: '#17a2b8',
      approved: '#28a745',
      rejected: '#dc3545',
      implemented: '#6c5ce7'
    };
    return colors[status] || '#6c757d';
  };

  const getTypeLabel = (type) => {
    return type === 'error' ? '🔴 Erro' : '💡 Sugestão';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#ff9900',
      critical: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  return (
    <div className="admin-suggestions-container">
      <div className="admin-suggestions-header">
        <h2>📋 Gerir Sugestões e Erros</h2>
        <div className="admin-suggestions-stats">
          <div className="stat-card">
            <span className="stat-label">Total</span>
            <span className="stat-value">{suggestions.length}</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-label">Pendentes</span>
            <span className="stat-value">{suggestions.filter(s => s.status === 'pending').length}</span>
          </div>
          <div className="stat-card reviewing">
            <span className="stat-label">Em Revisão</span>
            <span className="stat-value">{suggestions.filter(s => s.status === 'reviewing').length}</span>
          </div>
          <div className="stat-card approved">
            <span className="stat-label">Aprovadas</span>
            <span className="stat-value">{suggestions.filter(s => s.status === 'approved').length}</span>
          </div>
        </div>
      </div>

      <div className="admin-suggestions-filters">
        <div className="filter-group">
          <label>Filtrar por Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="reviewing">Em Revisão</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas</option>
            <option value="implemented">Implementadas</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Filtrar por Tipo:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Todos</option>
            <option value="error">Erros</option>
            <option value="suggestion">Sugestões</option>
          </select>
        </div>
      </div>

      <div className="admin-suggestions-list">
        {isLoading ? (
          <div className="loading-spinner">Carregando...</div>
        ) : suggestions.length === 0 ? (
          <div className="no-suggestions">Nenhuma sugestão encontrada</div>
        ) : (
          suggestions.map(suggestion => (
            <div key={suggestion._id} className="suggestion-item">
              <div className="suggestion-item-header">
                <div className="suggestion-item-title">
                  <span className="suggestion-type">{getTypeLabel(suggestion.type)}</span>
                  <h3>{suggestion.title}</h3>
                  <span className="suggestion-page">{suggestion.page}</span>
                </div>
                <div className="suggestion-item-actions">
                  <span 
                    className="suggestion-status"
                    style={{ backgroundColor: getStatusColor(suggestion.status) }}
                  >
                    {suggestion.status}
                  </span>
                  <button 
                    className="suggestion-view-btn"
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <FaEye /> Ver
                  </button>
                </div>
              </div>
              <p className="suggestion-item-description">{suggestion.description}</p>
              <div className="suggestion-item-footer">
                <span className="suggestion-user">Por: {suggestion.username}</span>
                <span className="suggestion-date">{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                <div className="suggestion-votes">
                  <span><FaThumbsUp /> {suggestion.votes?.upvotes || 0}</span>
                  <span><FaThumbsDown /> {suggestion.votes?.downvotes || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedSuggestion && (
        <div className="suggestion-detail-modal">
          <div className="suggestion-detail-content">
            <div className="suggestion-detail-header">
              <h2>{selectedSuggestion.title}</h2>
              <button 
                className="suggestion-detail-close"
                onClick={() => setSelectedSuggestion(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="suggestion-detail-body">
              <div className="detail-section">
                <h4>Informações</h4>
                <p><strong>Tipo:</strong> {getTypeLabel(selectedSuggestion.type)}</p>
                <p><strong>Utilizador:</strong> {selectedSuggestion.username}</p>
                <p><strong>Página:</strong> {selectedSuggestion.page}</p>
                <p><strong>Data:</strong> {new Date(selectedSuggestion.createdAt).toLocaleString('pt-PT')}</p>
              </div>

              <div className="detail-section">
                <h4>Descrição</h4>
                <p>{selectedSuggestion.description}</p>
              </div>

              {selectedSuggestion.steps && (
                <div className="detail-section">
                  <h4>Passos para Reproduzir</h4>
                  <p>{selectedSuggestion.steps}</p>
                </div>
              )}

              {selectedSuggestion.screenshot?.url && (
                <div className="detail-section">
                  <h4>Captura de Ecrã</h4>
                  <img src={selectedSuggestion.screenshot.url} alt="Screenshot" />
                </div>
              )}

              <div className="detail-section">
                <h4>Gestão</h4>
                <div className="management-controls">
                  <div className="control-group">
                    <label>Status:</label>
                    <select 
                      value={selectedSuggestion.status}
                      onChange={(e) => updateStatus(selectedSuggestion._id, e.target.value)}
                    >
                      <option value="pending">Pendente</option>
                      <option value="reviewing">Em Revisão</option>
                      <option value="approved">Aprovada</option>
                      <option value="rejected">Rejeitada</option>
                      <option value="implemented">Implementada</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <label>Prioridade:</label>
                    <select 
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value)}
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Respostas ({selectedSuggestion.responses?.length || 0})</h4>
                <div className="responses-list">
                  {selectedSuggestion.responses?.map((response, idx) => (
                    <div key={idx} className="response-item">
                      <strong>{response.adminName}</strong>
                      <p>{response.message}</p>
                      <small>{new Date(response.timestamp).toLocaleString('pt-PT')}</small>
                    </div>
                  ))}
                </div>

                <div className="add-response">
                  <textarea
                    placeholder="Adicionar resposta do admin..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows="3"
                  />
                  <button 
                    className="btn-submit"
                    onClick={() => addResponse(selectedSuggestion._id)}
                    disabled={!responseText.trim()}
                  >
                    Enviar Resposta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSuggestionsManager;
