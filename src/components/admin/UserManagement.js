// src/components/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';

const UserManagement = () => {
  const [users, setUsers] = useState([
    // Mock data
    { _id: '1', firstName:'Tiago', lastName:'Miranda', username: 'tiago', email: 'tiago@example.com', isBanned: false, banExpiration: null },
    { _id: '2', firstName:'Ana', lastName:'Assis', username: 'ana', email: 'ana@example.com', isBanned: true, banExpiration: '2025-03-26' },
  ]);
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

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Utilizadores</h2>
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
          {users.map(user => (
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