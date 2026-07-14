// src/components/admin/UserManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/users', { params: { page, size: 20, search: search.trim() || undefined } });
      setUsers(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar utilizadores.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const changeRole = async (user, role) => {
    if (!window.confirm(`Alterar o role de ${user.username} para ${role}?`)) return;
    try {
      await request('PUT', `/admin/users/${user.id}/role`, { role });
      showToast('Role atualizado.', 'success');
      fetchUsers();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a alterar role.', 'error');
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Eliminar permanentemente ${user.username}?`)) return;
    const confirm = window.prompt('Digite "ELIMINAR" para confirmar:');
    if (confirm !== 'ELIMINAR') {
      showToast('Eliminação cancelada.', 'info');
      return;
    }
    try {
      await request('DELETE', `/admin/users/${user.id}`);
      showToast('Utilizador eliminado.', 'success');
      fetchUsers();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  const exportCsv = () => {
    const rows = ['Nome,Username,Email,Role,Data'];
    users.forEach((u) => {
      rows.push(`"${u.firstName} ${u.lastName}",${u.username},${u.email},${u.role || 'USER'},${u.birthDate || ''}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `utilizadores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-section-admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0 }}>Gestão de Utilizadores</h2>
        <button className="admin-export-btn" onClick={exportCsv}><span>📥</span> Exportar CSV</button>
      </div>

      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="🔍 Pesquisar por nome, username ou email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : (
        <>
          <table className="admin-table-admin">
            <thead>
              <tr><th>Nome</th><th>Username</th><th>Email</th><th>Role</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${(u.role || 'USER').toLowerCase()}`}>
                      {u.role || 'USER'}
                    </span>
                  </td>
                  <td>
                    {u.role !== 'ADMIN' && (
                      <button className="btn-warning-admin" onClick={() => changeRole(u, 'ADMIN')}>Tornar Admin</button>
                    )}
                    {u.role === 'ADMIN' && (
                      <button className="btn-warning-admin" onClick={() => changeRole(u, 'USER')}>Rebaixar</button>
                    )}
                    <button className="btn-danger-admin" onClick={() => remove(u)} style={{ marginLeft: '6px' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Sem utilizadores.</td></tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
              <button className="btn-secondary-admin" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</button>
              <span>Página {page + 1} de {totalPages}</span>
              <button className="btn-secondary-admin" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</button>
            </div>
          )}
        </>
      )}
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default UserManagement;
