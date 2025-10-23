// src/components/admin/AchievementsManagement.js
import React, { useState, useEffect } from 'react';
import Toast from '../Toast';
import '../../styles/Admin.css';
import {
  FaTrophy, FaPlus, FaEdit, FaTrash, FaStar, FaUsers,
  FaGlobeAmericas, FaMoneyBillWave, FaCamera, FaComment,
  FaBook, FaUserFriends, FaHeart, FaEye, FaCheckCircle,
  FaMapMarkedAlt, FaThumbsUp, FaCrown, FaPlane, FaMountain,
  FaClock, FaGem, FaCompass, FaQuestionCircle, FaSearch,
  FaFilter, FaTimes
} from 'react-icons/fa';

const AchievementsManagement = () => {
  // Mock data
  const [achievements, setAchievements] = useState([
    {
      _id: '1',
      name: 'Explorador Iniciante',
      description: 'Partilhe a sua primeira viagem',
      icon: '🏆',
      condition: 'travels >= 1',
      category: 'Viagens',
      earnedCount: 2341,
      active: true,
      createdAt: '2025-01-01'
    },
    {
      _id: '2',
      name: 'Trotador do Globo',
      description: 'Visite 3 países diferentes',
      icon: '🌍',
      condition: 'uniqueCountries >= 3',
      category: 'Viagens',
      earnedCount: 856,
      active: true,
      createdAt: '2025-01-01'
    },
    {
      _id: '3',
      name: 'Borboleta Social',
      description: 'Siga 3 pessoas',
      icon: '🦋',
      condition: 'followers >= 3',
      category: 'Social',
      earnedCount: 1204,
      active: true,
      createdAt: '2025-01-01'
    },
    {
      _id: '4',
      name: 'Viajante Económico',
      description: 'Gastar menos de 500€ numa viagem',
      icon: '💰',
      condition: 'minPriceTravel < 500',
      category: 'Viagens',
      earnedCount: 634,
      active: true,
      createdAt: '2025-01-01'
    },
    {
      _id: '5',
      name: 'Fotógrafo de Viagens',
      description: 'Publicar uma viagem com mais de 5 fotos',
      icon: '📸',
      condition: 'imageCount >= 5',
      category: 'Conteúdo',
      earnedCount: 423,
      active: true,
      createdAt: '2025-01-01'
    }
  ]);

  const [stats, setStats] = useState({
    totalAchievements: 25,
    activeAchievements: 23,
    inactiveAchievements: 2,
    mostEarnedAchievement: { name: 'Explorador Iniciante', count: 2341 },
    leastEarnedAchievement: { name: 'Fotógrafo de Viagens', count: 423 }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    condition: '',
    category: 'Viagens'
  });

  // Filtrar achievements
  const filteredAchievements = achievements
    .filter(achievement => {
      const matchesSearch = searchTerm === '' ||
        achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || achievement.category === filterCategory;
      const matchesActive = filterActive === 'all' || 
        (filterActive === 'active' ? achievement.active : !achievement.active);
      return matchesSearch && matchesCategory && matchesActive;
    });

  const categories = ['Viagens', 'Social', 'Conteúdo', 'Interação', 'Exploração'];

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleOpenForm = (achievement = null) => {
    if (achievement) {
      setIsEditing(true);
      setSelectedAchievement(achievement);
      setFormData({
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        condition: achievement.condition,
        category: achievement.category
      });
    } else {
      setIsEditing(false);
      setFormData({
        name: '',
        description: '',
        icon: '',
        condition: '',
        category: 'Viagens'
      });
    }
    setShowFormModal(true);
  };

  const handleSaveAchievement = async () => {
    // Validação
    if (!formData.name.trim() || !formData.description.trim() || !formData.icon.trim() || !formData.condition.trim()) {
      showToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (isEditing) {
        setAchievements(achievements.map(a =>
          a._id === selectedAchievement._id
            ? { ...a, ...formData, updatedAt: new Date().toLocaleDateString() }
            : a
        ));
        showToast('Achievement atualizado com sucesso!', 'success');
      } else {
        const newAchievement = {
          _id: (achievements.length + 1).toString(),
          ...formData,
          earnedCount: 0,
          active: true,
          createdAt: new Date().toLocaleDateString()
        };
        setAchievements([...achievements, newAchievement]);
        showToast('Achievement criado com sucesso!', 'success');
      }

      setShowFormModal(false);
      setFormData({
        name: '',
        description: '',
        icon: '',
        condition: '',
        category: 'Viagens'
      });
    } catch (error) {
      showToast('Erro ao guardar achievement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (achievement) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setAchievements(achievements.map(a =>
        a._id === achievement._id ? { ...a, active: !a.active } : a
      ));
      showToast(`Achievement ${!achievement.active ? 'ativado' : 'desativado'}!`, 'success');
    } catch (error) {
      showToast('Erro ao alterar estado', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAchievement = async (achievement) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar "${achievement.name}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setAchievements(achievements.filter(a => a._id !== achievement._id));
      showToast('Conquista eliminada com sucesso!', 'success');
      setShowDetailModal(false);
    } catch (error) {
      showToast('Erro ao eliminar achievement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>🏆 Gestão de Achievements/Conquistas</h2>

      {/* Estatísticas */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #FFD700' }}>
          <h4>Total</h4>
          <p style={{ fontSize: '1.8rem', color: '#FFD700' }}>{stats.totalAchievements}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
          <h4>Ativos</h4>
          <p style={{ fontSize: '1.8rem', color: '#28a745' }}>{stats.activeAchievements}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #6c757d' }}>
          <h4>Inativos</h4>
          <p style={{ fontSize: '1.8rem', color: '#6c757d' }}>{stats.inactiveAchievements}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #0066cc' }}>
          <h4>Mais Ganho</h4>
          <p style={{ fontSize: '1rem', color: '#0066cc', marginTop: '5px' }}>
            {stats.mostEarnedAchievement.name} ({stats.mostEarnedAchievement.count})
          </p>
        </div>
      </div>

      {/* Filtros e Botão Adicionar */}
      <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        {/* Botão Adicionar */}
        <button
          onClick={() => handleOpenForm()}
          className="btn-success-admin"
          style={{
            gridColumn: '1 / -1',
            padding: '12px 20px',
            fontSize: '1rem',
            marginBottom: '10px'
          }}
        >
          <FaPlus /> Adicionar Novo Achievement
        </button>

        {/* Pesquisa */}
        <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
          <FaSearch style={{ marginTop: '8px', color: '#666' }} />
          <input
            type="text"
            placeholder="Pesquisar achievement..."
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

        {/* Filtro Categoria */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '0.95rem'
          }}
        >
          <option value="all">Todas as Categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Filtro Estado */}
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '0.95rem'
          }}
        >
          <option value="all">Todos os Estados</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {/* Tabela de Achievements */}
      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table className="admin-table-admin" style={{ width: '100%', minWidth: '900px' }}>
          <thead>
            <tr>
              <th>Ícone</th>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Ganho por</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAchievements.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Nenhum achievement encontrado
                </td>
              </tr>
            ) : (
              filteredAchievements.map(achievement => (
                <tr
                  key={achievement._id}
                  style={{
                    borderLeft: `4px solid ${achievement.active ? '#FFD700' : '#6c757d'}`,
                    opacity: achievement.active ? 1 : 0.7
                  }}
                >
                  <td style={{ fontSize: '1.5rem', textAlign: 'center' }}>
                    {achievement.icon}
                  </td>
                  <td>
                    <strong>{achievement.name}</strong>
                  </td>
                  <td>
                    <span title={achievement.description}>
                      {achievement.description.substring(0, 40)}...
                    </span>
                  </td>
                  <td>
                    <span style={{
                      background: '#e7f3ff',
                      color: '#0066cc',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem'
                    }}>
                      {achievement.category}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#0066cc', fontSize: '1.1rem' }}>
                      {achievement.earnedCount}
                    </strong>
                  </td>
                  <td>
                    <span style={{
                      background: achievement.active ? '#d4edda' : '#f8d7da',
                      color: achievement.active ? '#28a745' : '#dc3545',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {achievement.active ? '✓ Ativo' : '✗ Inativo'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-info-admin"
                      onClick={() => {
                        setSelectedAchievement(achievement);
                        setShowDetailModal(true);
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: '5px' }}
                    >
                      Ver
                    </button>
                    <button
                      className="btn-warning-admin"
                      onClick={() => handleOpenForm(achievement)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem', marginRight: '5px' }}
                    >
                      <FaEdit /> Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes */}
      {showDetailModal && selectedAchievement && (
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3>
                <span style={{ fontSize: '2rem', marginRight: '10px' }}>
                  {selectedAchievement.icon}
                </span>
                {selectedAchievement.name}
              </h3>
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

            {/* Informações */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>ℹ️ Informações</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <strong>Descrição:</strong>
                  <p style={{ marginTop: '5px', color: '#555' }}>{selectedAchievement.description}</p>
                </div>
                <div>
                  <strong>Categoria:</strong> {selectedAchievement.category}
                </div>
                <div>
                  <strong>Condição:</strong>
                  <code style={{
                    background: '#e7f3ff',
                    color: '#0066cc',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    display: 'block',
                    marginTop: '5px',
                    fontSize: '0.85rem'
                  }}>
                    {selectedAchievement.condition}
                  </code>
                </div>
                <div>
                  <strong>Data de Criação:</strong> {selectedAchievement.createdAt}
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
              <h4 style={{ marginBottom: '15px' }}>📊 Estatísticas</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '5px' }}>Ganho por:</strong>
                  <p style={{ fontSize: '1.5rem', color: '#0066cc', fontWeight: 'bold' }}>
                    {selectedAchievement.earnedCount}
                  </p>
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: '5px' }}>Estado:</strong>
                  <p style={{
                    fontSize: '1rem',
                    color: selectedAchievement.active ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {selectedAchievement.active ? '✓ Ativo' : '✗ Inativo'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
              <h4 style={{ marginBottom: '15px' }}>⚡ Ações</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => handleToggleActive(selectedAchievement)}
                  disabled={isLoading}
                  className="btn-info-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1 }}
                >
                  {selectedAchievement.active ? '✗ Desativar' : '✓ Ativar'}
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenForm(selectedAchievement);
                  }}
                  disabled={isLoading}
                  className="btn-warning-admin"
                  style={{ padding: '10px', opacity: isLoading ? 0.6 : 1 }}
                >
                  <FaEdit /> Editar
                </button>
              </div>
              <button
                onClick={() => handleDeleteAchievement(selectedAchievement)}
                disabled={isLoading}
                className="btn-danger-admin"
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px',
                  opacity: isLoading ? 0.6 : 1,
                  background: '#8b0000'
                }}
              >
                <FaTrash /> Eliminar Conquista
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

      {/* Modal de Formulário */}
      {showFormModal && (
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
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3>{isEditing ? 'Editar Achievement' : 'Novo Achievement'}</h3>
              <button
                onClick={() => setShowFormModal(false)}
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

            {/* Formulário */}
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Explorador Iniciante"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Partilhe a sua primeira viagem"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Ícone *
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Ex: 🏆 (emoji)"
                  maxLength="2"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1.5rem',
                    textAlign: 'center'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  Condição *
                </label>
                <input
                  type="text"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder="Ex: travels >= 1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                  Exemplos: travels {'>'} 1, uniqueCountries {'>'} 3, followers {'>'} 3, imageCount {'>'} 5
                </small>
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
              <button
                onClick={() => setShowFormModal(false)}
                className="btn-secondary-admin"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAchievement}
                disabled={isLoading}
                className="btn-success-admin"
                style={{ padding: '10px 20px', opacity: isLoading ? 0.6 : 1 }}
              >
                {isLoading ? '⏳ Salvando...' : '✓ Guardar'}
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

export default AchievementsManagement;
