// src/components/admin/UserProfilesManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';
import {
  FaUsers, FaSearch, FaEdit, FaEye, FaTrash, FaCheck, FaTimes,
  FaUserCircle, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt,
  FaFire, FaHeart, FaComment, FaImage, FaTrophy, FaShieldAlt,
  FaUserTie, FaUserLock, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

const UserProfilesManagement = () => {
  const [users, setUsers] = useState([
    // Mock data
    {
      _id: '1',
      username: 'tiago',
      firstName: 'Tiago',
      lastName: 'Miranda',
      email: 'tiago@example.com',
      profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
      bio: 'Apaixonado por viagens e aventuras',
      location: 'Portugal',
      joinDate: '2024-01-15',
      isVerified: true,
      isPremium: true,
      isBanned: false,
      stats: {
        travels: 12,
        followers: 342,
        following: 156,
        likes: 1203,
        comments: 456,
        achievements: 8
      },
      recentActivity: [
        { type: 'travel', action: 'Publicou viagem', date: '2025-03-20' },
        { type: 'comment', action: 'Comentou numa viagem', date: '2025-03-19' },
        { type: 'like', action: 'Gostou de uma viagem', date: '2025-03-18' }
      ],
      blockedUsers: ['user2', 'user5'],
      followers: [
        { username: 'ana', firstName: 'Ana', profilePicture: 'https://randomuser.me/api/portraits/women/1.jpg' },
        { username: 'joao', firstName: 'João', profilePicture: 'https://randomuser.me/api/portraits/men/2.jpg' }
      ],
      following: [
        { username: 'maria', firstName: 'Maria', profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg' }
      ],
      achievements: ['Explorador', 'Viajante Assíduo', 'Comentador Ativo'],
      settings: {
        privacy: 'public',
        notifications: true,
        emailNotifications: true,
        showProfile: true
      }
    },
    {
      _id: '2',
      username: 'ana',
      firstName: 'Ana',
      lastName: 'Assis',
      email: 'ana@example.com',
      profilePicture: 'https://randomuser.me/api/portraits/women/1.jpg',
      bio: 'Turista e fotógrafa',
      location: 'Portugal',
      joinDate: '2024-03-20',
      isVerified: true,
      isPremium: false,
      isBanned: true,
      banReason: 'Violação de termos de serviço',
      banExpiration: '2025-05-20',
      stats: {
        travels: 5,
        followers: 145,
        following: 89,
        likes: 234,
        comments: 123,
        achievements: 3
      },
      recentActivity: [],
      blockedUsers: [],
      followers: [],
      following: [],
      achievements: ['Iniciante', 'Fotógrafo'],
      settings: {
        privacy: 'friends',
        notifications: false,
        emailNotifications: false,
        showProfile: false
      }
    }
  ]);

  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [editData, setEditData] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  // Filtrar utilizadores
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus === 'banned') {
      filtered = filtered.filter(u => u.isBanned);
    } else if (filterStatus === 'verified') {
      filtered = filtered.filter(u => u.isVerified);
    } else if (filterStatus === 'premium') {
      filtered = filtered.filter(u => u.isPremium);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterStatus]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
    setExpandedSections({ general: true, stats: true });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditData({ ...user });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setUsers(users.map(u => u._id === editData._id ? editData : u));
      showToast('Utilizador atualizado com sucesso!', 'success');
      setShowEditModal(false);
      setSelectedUser(editData);
    } catch (error) {
      showToast('Erro ao atualizar utilizador', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (userId, permanent = false) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const confirmMsg = permanent
      ? `Tem a certeza que deseja banir permanentemente ${user.firstName}?`
      : `Tem a certeza que deseja banir ${user.firstName} por 30 dias?`;

    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setUsers(users.map(u =>
        u._id === userId
          ? {
              ...u,
              isBanned: true,
              banReason: 'Banido pela administração',
              banExpiration: permanent ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          : u
      ));
      showToast(`${user.firstName} foi banido com sucesso!`, 'success');
      if (selectedUser?._id === userId) {
        const updatedUser = users.find(u => u._id === userId);
        setSelectedUser({ ...updatedUser, isBanned: true });
      }
    } catch (error) {
      showToast('Erro ao banir utilizador', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbanUser = async (userId) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setUsers(users.map(u =>
        u._id === userId
          ? { ...u, isBanned: false, banReason: null, banExpiration: null }
          : u
      ));
      showToast(`${user.firstName} foi desbanido com sucesso!`, 'success');
      if (selectedUser?._id === userId) {
        setSelectedUser({ ...user, isBanned: false });
      }
    } catch (error) {
      showToast('Erro ao desbanir utilizador', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    if (!window.confirm(`Tem a certeza que deseja eliminar a conta de ${user.firstName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setUsers(users.filter(u => u._id !== userId));
      showToast('Utilizador eliminado com sucesso!', 'success');
      setShowDetailModal(false);
      setSelectedUser(null);
    } catch (error) {
      showToast('Erro ao eliminar utilizador', 'error');
    } finally {
      setIsLoading(false);
    }
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
      <h2>👥 Gestão de Perfis de Utilizadores</h2>

      {/* Estatísticas */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #0066cc' }}>
          <h4>Total de Utilizadores</h4>
          <p style={{ fontSize: '1.8rem', color: '#0066cc' }}>{users.length}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
          <h4>Verificados</h4>
          <p style={{ fontSize: '1.8rem', color: '#28a745' }}>
            {users.filter(u => u.isVerified).length}
          </p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ff9900' }}>
          <h4>Premium</h4>
          <p style={{ fontSize: '1.8rem', color: '#ff9900' }}>
            {users.filter(u => u.isPremium).length}
          </p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #dc3545' }}>
          <h4>Banidos</h4>
          <p style={{ fontSize: '1.8rem', color: '#dc3545' }}>
            {users.filter(u => u.isBanned).length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
          <FaSearch style={{ marginTop: '8px', color: '#666' }} />
          <input
            type="text"
            placeholder="Pesquisar por nome, username, email..."
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
          <option value="all">Todos os Utilizadores</option>
          <option value="verified">Verificados</option>
          <option value="premium">Premium</option>
          <option value="banned">Banidos</option>
        </select>
      </div>

      {/* Tabela de Utilizadores */}
      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table className="admin-table-admin" style={{ width: '100%', minWidth: '900px' }}>
          <thead>
            <tr>
              <th>Utilizador</th>
              <th>Email</th>
              <th>Localização</th>
              <th>Estado</th>
              <th>Viagens</th>
              <th>Seguidores</th>
              <th>Data de Entrada</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Nenhum utilizador encontrado
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr
                  key={user._id}
                  style={{
                    borderLeft: `4px solid ${user.isBanned ? '#dc3545' : user.isPremium ? '#ff9900' : '#0066cc'}`
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        style={{
                          width: '35px',
                          height: '35px',
                          borderRadius: '50%'
                        }}
                      />
                      <div>
                        <strong>@{user.username}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{user.firstName} {user.lastName}</small>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <FaMapMarkerAlt style={{ marginRight: '5px', color: '#0066cc' }} />
                    {user.location}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {user.isVerified && (
                        <span style={{
                          background: '#28a745',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>✓ Verificado</span>
                      )}
                      {user.isPremium && (
                        <span style={{
                          background: '#ff9900',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>★ Premium</span>
                      )}
                      {user.isBanned && (
                        <span style={{
                          background: '#dc3545',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>⛔ Banido</span>
                      )}
                    </div>
                  </td>
                  <td><strong>{user.stats.travels}</strong></td>
                  <td><strong>{user.stats.followers}</strong></td>
                  <td>{user.joinDate}</td>
                  <td>
                    <button
                      className="btn-info-admin"
                      onClick={() => handleViewDetails(user)}
                      style={{ padding: '6px 10px', fontSize: '0.8rem', marginRight: '5px' }}
                      title="Ver perfil completo"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="btn-warning-admin"
                      onClick={() => handleEditUser(user)}
                      style={{ padding: '6px 10px', fontSize: '0.8rem', marginRight: '5px' }}
                      title="Editar utilizador"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-danger-admin"
                      onClick={() => handleDeleteUser(user._id)}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      title="Eliminar utilizador"
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

      {/* Modal de Detalhes */}
      {showDetailModal && selectedUser && (
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
            maxWidth: '800px',
            width: '100%',
            maxHeight: '95vh',
            overflowY: 'auto',
            boxShadow: '0 10px 50px rgba(0,0,0,0.4)'
          }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '2px solid #e9ecef', paddingBottom: '15px' }}>
              <img
                src={selectedUser.profilePicture}
                alt={selectedUser.username}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <div>
                <h2 style={{ margin: '0' }}>{selectedUser.firstName} {selectedUser.lastName}</h2>
                <p style={{ margin: '5px 0', color: '#666' }}>@{selectedUser.username}</p>
                <p style={{ margin: '5px 0', color: '#0066cc' }}>{selectedUser.email}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {selectedUser.isVerified && <span style={{ background: '#28a745', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>✓ Verificado</span>}
                  {selectedUser.isPremium && <span style={{ background: '#ff9900', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>★ Premium</span>}
                  {selectedUser.isBanned && <span style={{ background: '#dc3545', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>⛔ Banido</span>}
                </div>
              </div>
            </div>

            {/* Informações Gerais */}
            <CollapsibleSection
              title="ℹ️ Informações Gerais"
              section="general"
              isOpen={expandedSections.general}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <strong>Bio:</strong>
                  <p>{selectedUser.bio || 'Sem bio'}</p>
                </div>
                <div>
                  <strong>Localização:</strong>
                  <p>{selectedUser.location}</p>
                </div>
                <div>
                  <strong>Data de Entrada:</strong>
                  <p>{selectedUser.joinDate}</p>
                </div>
                <div>
                  <strong>Estado da Conta:</strong>
                  <p>{selectedUser.isBanned ? `Banido até ${selectedUser.banExpiration}` : 'Ativa'}</p>
                </div>
              </div>
            </CollapsibleSection>

            {/* Estatísticas */}
            <CollapsibleSection
              title="📊 Estatísticas"
              section="stats"
              isOpen={expandedSections.stats}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div style={{ padding: '15px', background: '#e7f3ff', borderRadius: '8px', textAlign: 'center' }}>
                  <FaImage style={{ fontSize: '1.5rem', color: '#0066cc', marginBottom: '10px' }} />
                  <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: '#0066cc' }}>{selectedUser.stats.travels}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Viagens</p>
                </div>
                <div style={{ padding: '15px', background: '#f0f7ff', borderRadius: '8px', textAlign: 'center' }}>
                  <FaUsers style={{ fontSize: '1.5rem', color: '#17a2b8', marginBottom: '10px' }} />
                  <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: '#17a2b8' }}>{selectedUser.stats.followers}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Seguidores</p>
                </div>
                <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
                  <FaHeart style={{ fontSize: '1.5rem', color: '#ff9900', marginBottom: '10px' }} />
                  <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9900' }}>{selectedUser.stats.likes}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Gostos</p>
                </div>
                <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
                  <FaComment style={{ fontSize: '1.5rem', color: '#28a745', marginBottom: '10px' }} />
                  <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>{selectedUser.stats.comments}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Comentários</p>
                </div>
                <div style={{ padding: '15px', background: '#fce4ec', borderRadius: '8px', textAlign: 'center' }}>
                  <FaTrophy style={{ fontSize: '1.5rem', color: '#e91e63', marginBottom: '10px' }} />
                  <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: '#e91e63' }}>{selectedUser.stats.achievements}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Conquistas</p>
                </div>
              </div>
            </CollapsibleSection>

            {/* Seguidores */}
            {selectedUser.followers.length > 0 && (
              <CollapsibleSection
                title={`👥 Seguidores (${selectedUser.followers.length})`}
                section="followers"
                isOpen={expandedSections.followers}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                  {selectedUser.followers.map((follower, idx) => (
                    <div key={idx} style={{ textAlign: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <img src={follower.profilePicture} alt={follower.username} style={{ width: '50px', height: '50px', borderRadius: '50%', marginBottom: '10px' }} />
                      <p style={{ margin: '5px 0', fontWeight: 'bold' }}>@{follower.username}</p>
                      <small style={{ color: '#666' }}>{follower.firstName}</small>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Conquistas */}
            {selectedUser.achievements.length > 0 && (
              <CollapsibleSection
                title={`🏆 Conquistas (${selectedUser.achievements.length})`}
                section="achievements"
                isOpen={expandedSections.achievements}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {selectedUser.achievements.map((achievement, idx) => (
                    <div key={idx} style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px', textAlign: 'center', border: '2px solid #ff9900' }}>
                      <p style={{ margin: '0', fontSize: '1.5rem', marginBottom: '5px' }}>🏅</p>
                      <p style={{ margin: '0', fontSize: '0.9rem', fontWeight: 'bold' }}>{achievement}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Ações */}
            <div style={{ marginTop: '30px', padding: '20px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0066cc' }}>
              <h4 style={{ marginBottom: '15px' }}>⚡ Ações</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <button
                  onClick={() => handleEditUser(selectedUser)}
                  className="btn-primary-admin"
                  style={{ padding: '10px' }}
                >
                  <FaEdit /> Editar Perfil
                </button>
                {selectedUser.isBanned ? (
                  <button
                    onClick={() => handleUnbanUser(selectedUser._id)}
                    className="btn-success-admin"
                    style={{ padding: '10px' }}
                  >
                    <FaCheck /> Desbanir
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleBanUser(selectedUser._id, false)}
                      className="btn-warning-admin"
                      style={{ padding: '10px' }}
                    >
                      <FaShieldAlt /> Banir 30 Dias
                    </button>
                    <button
                      onClick={() => handleBanUser(selectedUser._id, true)}
                      className="btn-danger-admin"
                      style={{ padding: '10px' }}
                    >
                      <FaTimes /> Banir Permanentemente
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDeleteUser(selectedUser._id)}
                  className="btn-danger-admin"
                  style={{ padding: '10px', background: '#8b0000' }}
                >
                  <FaTrash /> Eliminar Conta
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
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

export default UserProfilesManagement;
