// src/components/admin/AdvancedNotifications.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';
import {
  FaBell, FaSearch, FaPaperPlane, FaHistory, FaUser, FaCalendarAlt,
  FaClock, FaUsers, FaFilter, FaEdit, FaTrash, FaCheck, FaTimes,
  FaChevronDown, FaChevronUp, FaChartLine, FaTrophy, FaGlobeAmericas,
  FaMapMarkerAlt, FaFire, FaEnvelope, FaPlus, FaEye
} from 'react-icons/fa';

const AdvancedNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      _id: '1',
      title: 'Bem-vindo ao Globe Memories!',
      description: 'Obrigado por se juntar à nossa comunidade de viajantes.',
      content: 'Explore viagens incríveis compartilhadas por utilizadores em todo o mundo...',
      type: 'welcome',
      recipient: 'all',
      status: 'sent',
      sentAt: '2025-03-20T10:30:00Z',
      readCount: 1250,
      clickCount: 450,
      readRate: 75,
      clickRate: 36,
      recipientCount: 1500
    },
    {
      _id: '2',
      title: 'Novo Update: Funcionalidade de Mapa Interativo',
      description: 'Descubra o novo mapa interativo com as viagens mais populares.',
      content: 'Agora pode ver todas as viagens no mapa e planear a sua próxima aventura...',
      type: 'feature',
      recipient: 'premium',
      status: 'scheduled',
      scheduledFor: '2025-03-25T14:00:00Z',
      recipientCount: 450
    },
    {
      _id: '3',
      title: 'Você tem novos comentários na sua viagem!',
      description: 'A viagem "Paris: City of Love" recebeu 3 novos comentários.',
      content: 'Visite o seu perfil para ver os comentários...',
      type: 'activity',
      recipient: 'specific',
      targetUsers: ['tiago', 'ana'],
      status: 'draft',
      recipientCount: 2
    }
  ]);

  const [templates, setTemplates] = useState([
    { _id: '1', name: 'Boas-vindas', subject: 'Bem-vindo a Globe Memories', preview: 'Obrigado por se juntar...' },
    { _id: '2', name: 'Notícia de Feature', subject: 'Novo! {feature}', preview: 'Temos uma novidade para si...' },
    { _id: '3', name: 'Reminder de Viagem', subject: 'Sua viagem {location}', preview: 'Não se esqueça de...' }
  ]);

  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [expandedSections, setExpandedSections] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'general',
    recipient: 'all',
    targetUsers: [],
    scheduledFor: '',
    templateId: null
  });

  // Filtrar notificações
  useEffect(() => {
    let filtered = notifications;

    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(n => n.status === filterStatus);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, filterStatus]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleCreateNotification = async () => {
    if (!formData.title || !formData.description || !formData.content) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const newNotification = {
        _id: Date.now().toString(),
        ...formData,
        status: formData.scheduledFor ? 'scheduled' : 'draft',
        recipientCount: calculateRecipientCount(formData.recipient),
        sentAt: formData.scheduledFor ? null : new Date().toISOString(),
        readCount: 0,
        clickCount: 0,
        readRate: 0,
        clickRate: 0
      };

      setNotifications([newNotification, ...notifications]);
      showToast('Notificação criada com sucesso!', 'success');
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      showToast('Erro ao criar notificação', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async (notificationId) => {
    const notif = notifications.find(n => n._id === notificationId);
    if (!notif) return;

    if (!window.confirm(`Tem a certeza que deseja enviar esta notificação para ${notif.recipientCount} utilizadores?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotifications(notifications.map(n =>
        n._id === notificationId
          ? { ...n, status: 'sent', sentAt: new Date().toISOString(), readCount: Math.floor(n.recipientCount * 0.5) }
          : n
      ));
      showToast('Notificação enviada com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao enviar notificação', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNotification = (notif) => {
    setFormData({
      title: notif.title,
      description: notif.description,
      content: notif.content,
      type: notif.type,
      recipient: notif.recipient,
      targetUsers: notif.targetUsers || [],
      scheduledFor: notif.scheduledFor || ''
    });
    setSelectedNotification(notif);
    setShowCreateModal(true);
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Tem a certeza que deseja eliminar esta notificação?')) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setNotifications(notifications.filter(n => n._id !== notificationId));
      showToast('Notificação eliminada com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao eliminar notificação', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = (templateId) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.subject,
        templateId: templateId
      }));
      showToast('Template aplicado!', 'success');
    }
  };

  const calculateRecipientCount = (recipient) => {
    const counts = {
      'all': 2500,
      'premium': 450,
      'verified': 1200,
      'new': 150,
      'inactive': 300,
      'active': 1800,
      'specific': formData.targetUsers.length
    };
    return counts[recipient] || 0;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      type: 'general',
      recipient: 'all',
      targetUsers: [],
      scheduledFor: '',
      templateId: null
    });
    setSelectedNotification(null);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
      <h2>🔔 Notificações Avançadas</h2>

      {/* Estatísticas */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #0066cc' }}>
          <h4>Notificações Enviadas</h4>
          <p style={{ fontSize: '1.8rem', color: '#0066cc' }}>
            {notifications.filter(n => n.status === 'sent').length}
          </p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ff9900' }}>
          <h4>Agendadas</h4>
          <p style={{ fontSize: '1.8rem', color: '#ff9900' }}>
            {notifications.filter(n => n.status === 'scheduled').length}
          </p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #17a2b8' }}>
          <h4>Rascunhos</h4>
          <p style={{ fontSize: '1.8rem', color: '#17a2b8' }}>
            {notifications.filter(n => n.status === 'draft').length}
          </p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
          <h4>Taxa Média de Leitura</h4>
          <p style={{ fontSize: '1.8rem', color: '#28a745' }}>
            {notifications.filter(n => n.readRate).length > 0
              ? Math.round(notifications.filter(n => n.readRate).reduce((a, b) => a + b.readRate, 0) / notifications.filter(n => n.readRate).length)
              : 0}%
          </p>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
          <FaSearch style={{ marginTop: '8px', color: '#666' }} />
          <input
            type="text"
            placeholder="Pesquisar notificações..."
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
          <option value="all">Todas as Notificações</option>
          <option value="sent">Enviadas</option>
          <option value="scheduled">Agendadas</option>
          <option value="draft">Rascunhos</option>
        </select>

        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="btn-success-admin"
          style={{ padding: '10px' }}
        >
          <FaPlus /> Nova Notificação
        </button>
      </div>

      {/* Tabela de Notificações */}
      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table className="admin-table-admin" style={{ width: '100%', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Destinatários</th>
              <th>Analytics</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotifications.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Nenhuma notificação encontrada
                </td>
              </tr>
            ) : (
              filteredNotifications.map(notif => (
                <tr key={notif._id}>
                  <td>
                    <strong>{notif.title}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{notif.description}</small>
                  </td>
                  <td>
                    <span style={{
                      background: notif.type === 'welcome' ? '#e7f3ff' : notif.type === 'feature' ? '#e8f5e9' : '#fff3e0',
                      color: notif.type === 'welcome' ? '#0066cc' : notif.type === 'feature' ? '#28a745' : '#ff9900',
                      padding: '5px 10px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {notif.type === 'welcome' ? '👋 Boas-vindas' : notif.type === 'feature' ? '✨ Feature' : '📢 Atividade'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      background: notif.status === 'sent' ? '#e8f5e9' : notif.status === 'scheduled' ? '#fff3e0' : '#f5f5f5',
                      color: notif.status === 'sent' ? '#28a745' : notif.status === 'scheduled' ? '#ff9900' : '#666',
                      padding: '5px 10px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {notif.status === 'sent' ? '✓ Enviada' : notif.status === 'scheduled' ? '🕐 Agendada' : '✏️ Rascunho'}
                    </span>
                  </td>
                  <td>
                    <strong>{notif.recipientCount}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{notif.recipient}</small>
                  </td>
                  <td>
                    {notif.readCount > 0 ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                          <FaEye style={{ color: '#0066cc' }} />
                          <span>{notif.readRate}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FaFire style={{ color: '#ff9900' }} />
                          <span>{notif.clickRate}%</span>
                        </div>
                      </>
                    ) : (
                      <small style={{ color: '#999' }}>Sem dados</small>
                    )}
                  </td>
                  <td>
                    {notif.status === 'sent' ? notif.sentAt?.split('T')[0] : notif.scheduledFor?.split('T')[0] || '—'}
                  </td>
                  <td>
                    {notif.status === 'draft' && (
                      <button
                        className="btn-success-admin"
                        onClick={() => handleSendNotification(notif._id)}
                        style={{ padding: '6px 10px', fontSize: '0.8rem', marginRight: '5px' }}
                        title="Enviar notificação"
                      >
                        <FaPaperPlane />
                      </button>
                    )}
                    <button
                      className="btn-info-admin"
                      onClick={() => handleEditNotification(notif)}
                      style={{ padding: '6px 10px', fontSize: '0.8rem', marginRight: '5px' }}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-danger-admin"
                      onClick={() => handleDeleteNotification(notif._id)}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Criar/Editar Notificação */}
      {showCreateModal && (
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
            maxWidth: '700px',
            width: '100%',
            maxHeight: '95vh',
            overflowY: 'auto',
            boxShadow: '0 10px 50px rgba(0,0,0,0.4)'
          }}>
            <h2 style={{ marginTop: 0 }}>
              {selectedNotification ? '✏️ Editar Notificação' : '📝 Nova Notificação'}
            </h2>

            {/* Templates Rápidos */}
            <CollapsibleSection
              title="📋 Templates Rápidos"
              section="templates"
              isOpen={expandedSections.templates}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {templates.map(template => (
                  <button
                    key={template._id}
                    onClick={() => handleApplyTemplate(template._id)}
                    style={{
                      padding: '10px',
                      background: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#e9ecef'}
                    onMouseLeave={(e) => e.target.style.background = '#f8f9fa'}
                  >
                    <strong>{template.name}</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                      {template.preview}
                    </p>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            {/* Conteúdo */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título da notificação"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição (preview)"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Conteúdo Completo *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Conteúdo completo da notificação..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontFamily: 'Arial, sans-serif',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Configurações */}
            <CollapsibleSection
              title="⚙️ Configurações"
              section="settings"
              isOpen={expandedSections.settings === undefined ? true : expandedSections.settings}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Tipo de Notificação
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="general">Geral</option>
                    <option value="welcome">Boas-vindas</option>
                    <option value="feature">Nova Feature</option>
                    <option value="activity">Atividade</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Destinatários
                  </label>
                  <select
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="all">Todos os Utilizadores</option>
                    <option value="premium">Premium</option>
                    <option value="verified">Verificados</option>
                    <option value="new">Novos Utilizadores</option>
                    <option value="inactive">Inativos</option>
                    <option value="active">Ativos</option>
                    <option value="specific">Específicos</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  <FaCalendarAlt style={{ marginRight: '8px' }} />
                  Agendar Envio (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </CollapsibleSection>

            {/* Resumo */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>📊 Resumo:</p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                • Destinatários: <strong>{calculateRecipientCount(formData.recipient)}</strong>
              </p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                • Tipo: <strong>{formData.type}</strong>
              </p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                • Status: <strong>{formData.scheduledFor ? 'Será agendada' : 'Será salva como rascunho'}</strong>
              </p>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', gap: '10px' }}>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="btn-secondary-admin"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNotification}
                className="btn-primary-admin"
                style={{ padding: '10px 20px' }}
                disabled={isLoading}
              >
                {isLoading ? '⏳ A guardar...' : selectedNotification ? '💾 Atualizar' : '✓ Criar'}
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

export default AdvancedNotifications;
