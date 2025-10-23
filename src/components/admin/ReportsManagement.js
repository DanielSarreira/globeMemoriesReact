// src/components/admin/ReportsManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';
import {
  FaFlag, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaEye,
  FaFilter, FaSearch, FaExclamationTriangle, FaEnvelope, FaHistory,
  FaArrowUp, FaArrowDown, FaUser, FaImage, FaComments, FaReply,
  FaTimes, FaCheck, FaTrash, FaAlertTriangle, FaFileAlt
} from 'react-icons/fa';

const ReportsManagement = () => {
  // Estado para relatórios
  const [reports, setReports] = useState([
    // Mock data
    {
      _id: '1',
      reportType: 'travel',
      reportedContent: { title: 'Viagem a Lisboa', author: 'tiago' },
      reportedBy: { username: 'ana' },
      reportReasons: ['inappropriate', 'falseInfo'],
      description: 'As imagens parecem falsas',
      status: 'open',
      priority: 'high',
      createdAt: '2025-03-10',
      viewCount: 0,
      contentPreview: 'Viagem com informações incorretas...'
    },
    {
      _id: '2',
      reportType: 'comment',
      reportedContent: { text: 'Comentário abusivo' },
      reportedBy: { username: 'joao' },
      reportReasons: ['abusive', 'harassment'],
      description: 'Utilizador está a assediar outros',
      status: 'investigating',
      priority: 'critical',
      createdAt: '2025-03-09',
      viewCount: 1,
      contentPreview: 'Comentário ofensivo...'
    },
    {
      _id: '3',
      reportType: 'user',
      reportedContent: { username: 'spammer' },
      reportedBy: { username: 'maria' },
      reportReasons: ['spam'],
      description: 'Utilizador está a fazer spam',
      status: 'resolved',
      priority: 'medium',
      createdAt: '2025-03-08',
      viewCount: 2,
      contentPreview: 'Conteúdo de spam...',
      resolutionAction: 'warned'
    }
  ]);

  const [stats, setStats] = useState({
    totalReports: 150,
    openReports: 45,
    investigatingReports: 23,
    resolvedReports: 82,
    criticalPriority: 8,
    highPriority: 22
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [actionType, setActionType] = useState(''); // 'warn', 'delete', 'dismiss', 'suspend'
  const [actionMessage, setActionMessage] = useState('');

  // Filtrar relatórios
  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.reportType === filterType;
    const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
    const matchesSearch = searchTerm === '' ||
      report.reportedContent.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedContent.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedContent.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesType && matchesPriority && matchesSearch;
  });

  // Toast functions
  const showToast = (message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  // Cores para status
  const getStatusColor = (status) => {
    const colors = {
      open: '#dc3545',
      investigating: '#ffc107',
      resolved: '#28a745',
      closed: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  // Cores para prioridade
  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#ff9900',
      critical: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  // Ícone para tipo de reporte
  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'travel':
        return <FaImage style={{ color: '#0066cc' }} />;
      case 'comment':
        return <FaComments style={{ color: '#17a2b8' }} />;
      case 'user':
        return <FaUser style={{ color: '#ff9900' }} />;
      default:
        return <FaFlag />;
    }
  };

  // Texto para tipo de reporte
  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'travel':
        return 'Viagem';
      case 'comment':
        return 'Comentário';
      case 'user':
        return 'Utilizador';
      default:
        return 'Desconhecido';
    }
  };

  // Abrir modal de detalhes
  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
    // Marcar como visualizado
    if (report.viewCount === 0) {
      setReports(reports.map(r =>
        r._id === report._id ? { ...r, viewCount: 1 } : r
      ));
    }
  };

  // Atualizar status do reporte
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedReport) return;

    setIsLoading(true);
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setReports(reports.map(r =>
        r._id === selectedReport._id
          ? { ...r, status: newStatus, updatedAt: new Date().toLocaleDateString() }
          : r
      ));

      setSelectedReport(prev => ({ ...prev, status: newStatus }));
      showToast(`Status atualizado para ${newStatus}!`, 'success');
    } catch (error) {
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Tomar ação sobre o reporte
  const handleTakeAction = async () => {
    if (!actionType || !actionMessage.trim()) {
      showToast('Selecione uma ação e adicione uma mensagem', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500));

      setReports(reports.map(r =>
        r._id === selectedReport._id
          ? {
              ...r,
              status: 'resolved',
              resolutionAction: actionType,
              resolutionNotes: actionMessage
            }
          : r
      ));

      const actionLabel = {
        warn: 'Aviso enviado ao utilizador',
        delete: 'Conteúdo deletado',
        suspend: 'Utilizador suspenso',
        dismiss: 'Reporte descartado'
      }[actionType] || 'Ação realizada';

      showToast(actionLabel, 'success');
      setActionType('');
      setActionMessage('');
      await handleUpdateStatus('resolved');
    } catch (error) {
      showToast('Erro ao tomar ação', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Notificar utilizador
  const handleNotifyUser = async () => {
    if (!selectedReport) return;

    setIsLoading(true);
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));

      showToast('Notificação enviada ao utilizador!', 'success');
    } catch (error) {
      showToast('Erro ao enviar notificação', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Ícone de prioridade
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <FaArrowUp style={{ color: '#dc3545', marginRight: '5px' }} />;
      case 'high':
        return <FaArrowUp style={{ color: '#ff9900', marginRight: '5px' }} />;
      case 'medium':
        return <FaArrowDown style={{ color: '#ffc107', marginRight: '5px' }} />;
      default:
        return <FaArrowDown style={{ color: '#28a745', marginRight: '5px' }} />;
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>🚩 Gestão de Denúncias</h2>

      {/* Estatísticas */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #dc3545' }}>
          <h4>Denúncias Abertas</h4>
          <p style={{ fontSize: '1.8rem', color: '#dc3545' }}>{stats.openReports}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ffc107' }}>
          <h4>Em Investigação</h4>
          <p style={{ fontSize: '1.8rem', color: '#ffc107' }}>{stats.investigatingReports}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
          <h4>Resolvidos</h4>
          <p style={{ fontSize: '1.8rem', color: '#28a745' }}>{stats.resolvedReports}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #dc3545' }}>
          <h4>Críticos</h4>
          <p style={{ fontSize: '1.8rem', color: '#dc3545' }}>{stats.criticalPriority}</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        {/* Pesquisa */}
        <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
          <FaSearch style={{ marginTop: '8px', color: '#666' }} />
          <input
            type="text"
            placeholder="Pesquisar por conteúdo, descrição..."
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
          <option value="open">Aberto</option>
          <option value="investigating">Em Investigação</option>
          <option value="resolved">Resolvido</option>
          <option value="closed">Fechado</option>
        </select>

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
          <option value="travel">Viagem</option>
          <option value="comment">Comentário</option>
          <option value="user">Utilizador</option>
        </select>

        {/* Filtro Prioridade */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '0.95rem'
          }}
        >
          <option value="all">Todas as Prioridades</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </div>

      {/* Tabela de Reportes */}
      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table className="admin-table-admin" style={{ width: '100%', minWidth: '900px' }}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Conteúdo Reportado</th>
              <th>Reportado por</th>
              <th>Motivos</th>
              <th>Status</th>
              <th>Prioridade</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Nenhum reporte encontrado
                </td>
              </tr>
            ) : (
              filteredReports.map(report => (
                <tr key={report._id} style={{ borderLeft: `4px solid ${getPriorityColor(report.priority)}` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getReportTypeIcon(report.reportType)}
                      {getReportTypeLabel(report.reportType)}
                    </div>
                  </td>
                  <td>
                    <span title={report.reportedContent.title || report.reportedContent.username || report.reportedContent.text}>
                      {(report.reportedContent.title || report.reportedContent.username || report.reportedContent.text || 'N/A').substring(0, 30)}...
                    </span>
                  </td>
                  <td>{report.reportedBy.username}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>
                      {report.reportReasons.join(', ')}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        background: getStatusColor(report.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {getPriorityIcon(report.priority)}
                      <span style={{ color: getPriorityColor(report.priority), fontWeight: 'bold' }}>
                        {report.priority}
                      </span>
                    </div>
                  </td>
                  <td>{report.createdAt}</td>
                  <td>
                    <button
                      className="btn-info-admin"
                      onClick={() => handleViewDetails(report)}
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
      {showDetailModal && selectedReport && (
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
              <h3>Detalhes do Reporte</h3>
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
                <FaTimes />
              </button>
            </div>

            {/* Informações do Reporte */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>ℹ️ Informações do Reporte</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <strong>Tipo:</strong> {getReportTypeLabel(selectedReport.reportType)}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    background: getStatusColor(selectedReport.status),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    marginLeft: '8px'
                  }}>
                    {selectedReport.status}
                  </span>
                </div>
                <div>
                  <strong>Prioridade:</strong>{' '}
                  <span style={{
                    color: getPriorityColor(selectedReport.priority),
                    fontWeight: 'bold',
                    marginLeft: '8px'
                  }}>
                    {selectedReport.priority}
                  </span>
                </div>
                <div>
                  <strong>Data:</strong> {selectedReport.createdAt}
                </div>
                <div>
                  <strong>Reportado por:</strong> {selectedReport.reportedBy.username}
                </div>
              </div>
            </div>

            {/* Conteúdo Reportado */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
              <h4 style={{ marginBottom: '15px' }}>⚠️ Conteúdo Reportado</h4>
              <div>
                <strong>Título/Nome:</strong>{' '}
                {selectedReport.reportedContent.title || selectedReport.reportedContent.username || 'N/A'}
              </div>
              <div style={{ marginTop: '10px' }}>
                <strong>Preview:</strong>
                <p style={{ margin: '10px 0', fontSize: '0.9rem', color: '#555' }}>
                  {selectedReport.contentPreview}
                </p>
              </div>
            </div>

            {/* Motivos da Denúncia */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>📋 Motivos da Denúncia</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedReport.reportReasons.map((reason, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem'
                    }}
                  >
                    {reason}
                  </span>
                ))}
              </div>
              {selectedReport.description && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Descrição do utilizador:</strong>
                  <p style={{ margin: '10px 0', fontSize: '0.9rem', color: '#555', fontStyle: 'italic' }}>
                    "{selectedReport.description}"
                  </p>
                </div>
              )}
            </div>

            {/* Ação a Tomar */}
            {selectedReport.status === 'open' || selectedReport.status === 'investigating' ? (
              <div style={{ marginBottom: '25px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
                <h4 style={{ marginBottom: '15px' }}>⚡ Tomar Ação</h4>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Tipo de Ação:
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #0066cc',
                      borderRadius: '6px',
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="">Selecione uma ação...</option>
                    <option value="warn">📧 Enviar Aviso</option>
                    <option value="delete">🗑️ Eliminar Conteúdo</option>
                    <option value="suspend">🚫 Suspender Utilizador</option>
                    <option value="dismiss">✓ Descartar Reporte</option>
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Mensagem/Notas:
                  </label>
                  <textarea
                    value={actionMessage}
                    onChange={(e) => setActionMessage(e.target.value)}
                    placeholder="Descreva a ação e o motivo..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #0066cc',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      minHeight: '100px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleTakeAction}
                    disabled={isLoading}
                    className="btn-success-admin"
                    style={{
                      padding: '10px 20px',
                      opacity: isLoading ? 0.6 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? '⏳ Processando...' : '✓ Executar Ação'}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('investigating')}
                    disabled={isLoading}
                    className="btn-warning-admin"
                    style={{
                      padding: '10px 20px',
                      opacity: isLoading ? 0.6 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? '⏳...' : '🔍 Marcar como Investigando'}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Histórico de Ações */}
            {selectedReport.resolutionAction && (
              <div style={{ marginBottom: '25px', padding: '20px', background: '#d4edda', borderRadius: '8px', border: '1px solid #28a745' }}>
                <h4 style={{ marginBottom: '15px' }}>✓ Histórico de Ações</h4>
                <div>
                  <strong>Ação Tomada:</strong> {selectedReport.resolutionAction}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <strong>Notas:</strong>
                  <p style={{ margin: '10px 0', fontSize: '0.9rem', color: '#555' }}>
                    {selectedReport.resolutionNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary-admin"
                style={{ padding: '10px 20px' }}
              >
                Fechar
              </button>
              <button
                onClick={handleNotifyUser}
                disabled={isLoading || selectedReport.status !== 'resolved'}
                className="btn-info-admin"
                style={{
                  padding: '10px 20px',
                  opacity: (isLoading || selectedReport.status !== 'resolved') ? 0.6 : 1,
                  cursor: (isLoading || selectedReport.status !== 'resolved') ? 'not-allowed' : 'pointer'
                }}
              >
                <FaEnvelope /> Notificar Utilizador
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
        onClose={closeToast}
      />
    </div>
  );
};

export default ReportsManagement;
