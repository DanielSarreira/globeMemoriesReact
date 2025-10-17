// src/components/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';

const UserManagement = () => {
  const [users, setUsers] = useState([
    // Mock data
    { _id: '1', firstName:'Tiago', lastName:'Miranda', username: 'tiago', email: 'tiago@example.com', isBanned: false, banExpiration: null, createdAt: '2024-01-15' },
    { _id: '2', firstName:'Ana', lastName:'Assis', username: 'ana', email: 'ana@example.com', isBanned: true, banExpiration: '2025-03-26', createdAt: '2024-03-20' },
    { _id: '3', firstName:'João', lastName:'Silva', username: 'joao', email: 'joao@example.com', isBanned: false, banExpiration: null, createdAt: '2024-05-10' },
    { _id: '4', firstName:'Maria', lastName:'Santos', username: 'maria', email: 'maria@example.com', isBanned: false, banExpiration: null, createdAt: '2024-06-12' },
    { _id: '5', firstName:'Pedro', lastName:'Costa', username: 'pedro', email: 'pedro@example.com', isBanned: true, banExpiration: '2025-12-31', createdAt: '2024-02-28' },
  ]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchUsers = async () => {
      // const { data } = await axios.get('/api/users', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setUsers(data);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    // Aplicar filtros e pesquisa
    let filtered = users;

    // Filtro de pesquisa
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? !user.isBanned : user.isBanned
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleBan = async (id, type, duration) => {
    const user = users.find(u => u._id === id);
    if (!user) return;

    const confirmMessage = type === 'permanent' 
      ? `Tem a certeza que deseja banir permanentemente o utilizador ${user.firstName} ${user.lastName}?`
      : `Tem a certeza que deseja banir o utilizador ${user.firstName} ${user.lastName} por ${duration} dias?`;
    
    if (!window.confirm(confirmMessage)) return;

    setIsLoading(true);
    try {
      // Placeholder para chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(users.map(user =>
        user._id === id
          ? { 
              ...user, 
              isBanned: true, 
              banExpiration: type === 'temporary' 
                ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                : null 
            }
          : user
      ));
      
      const banMessage = type === 'permanent' 
        ? `Utilizador ${user.firstName} ${user.lastName} banido permanentemente!`
        : `Utilizador ${user.firstName} ${user.lastName} banido por ${duration} dias!`;
      
      showToast(banMessage, 'success');
    } catch (error) {
      console.error('Erro ao banir utilizador:', error);
      showToast('Erro ao banir utilizador. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async (id) => {
    const user = users.find(u => u._id === id);
    if (!user) return;

    if (!window.confirm(`Tem a certeza que deseja desbanir o utilizador ${user.firstName} ${user.lastName}?`)) return;

    setIsLoading(true);
    try {
      // Placeholder para chamada à API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setUsers(users.map(user =>
        user._id === id ? { ...user, isBanned: false, banExpiration: null } : user
      ));
      
      showToast(`Utilizador ${user.firstName} ${user.lastName} desbaneado com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao desbanir utilizador:', error);
      showToast('Erro ao desbanir utilizador. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const user = users.find(u => u._id === id);
    if (!user) return;

    const confirmMessage = `ATENÇÃO: Esta ação é irreversível!\n\nTem a certeza que deseja eliminar permanentemente o utilizador ${user.firstName} ${user.lastName}?\n\nTodos os dados, viagens e conteúdos serão perdidos.`;
    
    if (!window.confirm(confirmMessage)) return;

    const finalConfirm = window.prompt('Para confirmar, digite "ELIMINAR" (em maiúsculas):');
    if (finalConfirm !== 'ELIMINAR') {
      showToast('Eliminação cancelada. Texto de confirmação incorreto.', 'info');
      return;
    }

    setIsLoading(true);
    try {
      // Placeholder para chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUsers(users.filter(user => user._id !== id));
      showToast(`Utilizador ${user.firstName} ${user.lastName} eliminado permanentemente.`, 'success');
    } catch (error) {
      console.error('Erro ao eliminar utilizador:', error);
      showToast('Erro ao eliminar utilizador. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nome,Username,Email,Estado,Data de Registo\n"
      + filteredUsers.map(u => 
          `${u.firstName} ${u.lastName},${u.username},${u.email},${u.isBanned ? 'Banido' : 'Ativo'},${u.createdAt || 'N/A'}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `utilizadores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('✓ Ficheiro CSV exportado com sucesso!', 'success');
  };

  return (
    <div className="admin-section-admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0 }}>Gestão de Utilizadores</h2>
        <button 
          className="admin-export-btn"
          onClick={handleExportCSV}
        >
          <span>📥</span>
          Exportar CSV
        </button>
      </div>

      {/* Estatísticas */}
      <div className="stats-grid-admin" style={{ marginBottom: '25px' }}>
        <div className="stat-card-admin">
          <h3>Total</h3>
          <p>{users.length}</p>
        </div>
        <div className="stat-card-admin">
          <h3>Ativos</h3>
          <p style={{ color: '#28a745' }}>{users.filter(u => !u.isBanned).length}</p>
        </div>
        <div className="stat-card-admin">
          <h3>Banidos</h3>
          <p style={{ color: '#dc3545' }}>{users.filter(u => u.isBanned).length}</p>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="🔍 Pesquisar por nome, username ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos os Estados</option>
          <option value="active">Apenas Ativos</option>
          <option value="banned">Apenas Banidos</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '12px',
          color: '#6c757d'
        }}>
          <p style={{ fontSize: '1.2rem', margin: 0 }}>
            {searchTerm || statusFilter !== 'all' 
              ? '🔍 Nenhum utilizador encontrado com os filtros aplicados' 
              : 'Nenhum utilizador registado'}
          </p>
        </div>
      ) : (
        <table className="admin-table-admin">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Username</th>
            <th>Email</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user._id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.isBanned ? `Banido até ${user.banExpiration || 'Permanente'}` : 'Ativo'}</td>
              <td>
                {!user.isBanned && (
                  <>
                    <button 
                      className="btn-warning-admin" 
                      onClick={() => handleBan(user._id, 'temporary', 7)}
                      disabled={isLoading}
                      style={{ opacity: isLoading ? 0.6 : 1 }}
                    >
                      {isLoading ? 'A processar...' : 'Banir 7 Dias'}
                    </button>
                    <button 
                      className="btn-danger-admin" 
                      onClick={() => handleBan(user._id, 'permanent')}
                      disabled={isLoading}
                      style={{ opacity: isLoading ? 0.6 : 1 }}
                    >
                      {isLoading ? 'A processar...' : 'Banir Permanente'}
                    </button>
                  </>
                )}
                {user.isBanned && (
                  <button 
                    className="btn-success-admin" 
                    onClick={() => handleUnban(user._id)}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.6 : 1 }}
                  >
                    {isLoading ? 'A processar...' : 'Desbanir'}
                  </button>
                )}
                <button 
                  className="btn-danger-admin" 
                  onClick={() => handleDelete(user._id)}
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                >
                  {isLoading ? 'A processar...' : 'Eliminar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

export default UserManagement;