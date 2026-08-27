// src/components/admin/UserManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import { getDisplayName } from '../../utils/userDisplay';
import Toast from '../Toast';
import { FaTrash, FaBan, FaUnlock, FaEye, FaUserShield, FaUserCog } from 'react-icons/fa';
import '../../styles/Admin.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [selected, setSelected] = useState(null);

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

  const banUser = async (user) => {
    if (!user.id) {
      showToast('Utilizador sem ID válido — não foi possível banir.', 'error');
      return;
    }
    const reason = window.prompt(`Motivo do banimento de ${user.username} (opcional):`) ?? null;
    if (reason === null) return; // user cancelled
    try {
      await request('POST', `/admin/users/${user.id}/ban`, { reason: (reason || '').trim() || null });
      showToast('Utilizador banido.', 'success');
      fetchUsers();
      if (selected?.id === user.id) {
        setSelected({
          ...selected,
          banned: true,
          banReason: (reason || '').trim() || null,
          bannedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message;
      showToast(
        serverMsg || (status ? `Erro a banir (HTTP ${status}).` : 'Erro a banir.'),
        'error',
      );
    }
  };

  const unbanUser = async (user) => {
    if (!window.confirm(`Reativar ${user.username}?`)) return;
    try {
      await request('POST', `/admin/users/${user.id}/unban`);
      showToast('Utilizador reativado.', 'success');
      fetchUsers();
      if (selected?.id === user.id) {
        setSelected({ ...selected, banned: false, banReason: null, bannedAt: null });
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a reativar.', 'error');
    }
  };

  const remove = async (user) => {
    if (!user.id) {
      showToast('Utilizador sem ID válido — não foi possível eliminar.', 'error');
      return;
    }
    if (!window.confirm(`Eliminar permanentemente ${user.username}? Esta ação é IRREVERSÍVEL.`)) return;
    const confirm = window.prompt('Digite "ELIMINAR" para confirmar:');
    if (confirm !== 'ELIMINAR') {
      showToast('Eliminação cancelada.', 'info');
      return;
    }
    try {
      await request('DELETE', `/admin/users/${user.id}`);
      showToast('Utilizador eliminado.', 'success');
      setSelected(null);
      fetchUsers();
    } catch (e) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message;
      showToast(
        serverMsg || (status ? `Erro a eliminar (HTTP ${status}).` : 'Erro a eliminar.'),
        'error',
      );
    }
  };

  const exportCsv = () => {
    const rows = ['Nome,Username,Email,Role,Data,Banido'];
    users.forEach((u) => {
      const fullName = getDisplayName(u, u.username);
      rows.push(`"${fullName}",${u.username},${u.email},${u.role || 'USER'},${u.birthDate || ''},${u.banned ? 'SIM' : 'NAO'}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `utilizadores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const detail = selected;

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
              <tr><th>Nome</th><th>Username</th><th>Email</th><th>Role</th><th>Estado</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={u.banned ? { background: '#fff5f5' } : undefined}>
                  <td>{getDisplayName(u, u.username)}</td>
                  <td>@{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${(u.role || 'USER').toLowerCase()}`}>
                      {u.role || 'USER'}
                    </span>
                  </td>
                  <td>
                    {u.banned
                      ? <span className="role-badge role-admin" style={{ background: '#dc3545' }}>Banido</span>
                      : <span className="role-badge role-user">Ativo</span>}
                  </td>
                  <td>
                    <button className="btn-info-admin" onClick={() => setSelected(u)} style={{ marginRight: '4px' }}>
                      <FaEye /> Ver
                    </button>
                    {u.role !== 'ADMIN' && !u.banned && (
                      <button className="btn-danger-admin" onClick={() => banUser(u)} style={{ marginRight: '4px' }}>
                        <FaBan /> Banir
                      </button>
                    )}
                    {u.banned && (
                      <button className="btn-success-admin" onClick={() => unbanUser(u)} style={{ marginRight: '4px' }}>
                        <FaUnlock /> Reativar
                      </button>
                    )}
                    {u.role !== 'ADMIN' && (
                      <button className="btn-danger-admin" onClick={() => remove(u)} title="Eliminar permanentemente">
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Sem utilizadores.</td></tr>
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

      {detail && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: detail.banned ? '#dc3545' : '#0066cc',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', fontWeight: 'bold',
              }}>
                {(detail.firstName?.[0] || detail.username?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{getDisplayName(detail, detail.username)}</h3>
                <p style={{ margin: 0, color: '#666' }}>@{detail.username} · {detail.email}</p>
              </div>
            </div>

            {detail.banned && (
              <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                <strong>Conta banida</strong>
                {detail.bannedAt && <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>desde {new Date(detail.bannedAt).toLocaleString()}</p>}
                {detail.banReason && <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Motivo: {detail.banReason}</p>}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.92rem' }}>
              <div><strong>Role:</strong> {detail.role || 'USER'}</div>
              <div><strong>Género:</strong> {detail.gender || '—'}</div>
              <div><strong>Nacionalidade:</strong> {detail.nationality || '—'}</div>
              <div><strong>Cidade:</strong> {detail.city || '—'}</div>
              <div><strong>Data nascimento:</strong> {detail.birthDate || '—'}</div>
              <div><strong>Idiomas:</strong> {detail.languagesSpoken || '—'}</div>
              <div><strong>Email verificado:</strong> {detail.emailVerified ? 'Sim' : 'Não'}</div>
              <div><strong>Perfil privado:</strong> {detail.privateProfile ? 'Sim' : 'Não'}</div>
              <div><strong>Estatísticas:</strong> {detail.showStatistics || 'PUBLIC'}</div>
              <div><strong>Estatísticas monetárias:</strong> {detail.showMonetaryStatistics || 'PUBLIC'}</div>
            </div>

            {detail.userBio && (
              <div style={{ marginTop: '12px' }}>
                <strong>Bio:</strong>
                <p style={{ margin: '4px 0 0', padding: '8px 10px', background: '#f8f9fa', borderRadius: '6px' }}>{detail.userBio}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
              {detail.role !== 'ADMIN' && !detail.banned && (
                <button className="btn-danger-admin" onClick={() => banUser(detail)}>
                  <FaBan /> Banir
                </button>
              )}
              {detail.banned && (
                <button className="btn-success-admin" onClick={() => unbanUser(detail)}>
                  <FaUnlock /> Reativar
                </button>
              )}
              {detail.role === 'USER' && (
                <button className="btn-warning-admin" onClick={() => { changeRole(detail, 'ADMIN'); setSelected({ ...detail, role: 'ADMIN' }); }}>
                  <FaUserShield /> Tornar Admin
                </button>
              )}
              {detail.role === 'ADMIN' && (
                <button className="btn-warning-admin" onClick={() => { changeRole(detail, 'USER'); setSelected({ ...detail, role: 'USER' }); }}>
                  <FaUserCog /> Rebaixar
                </button>
              )}
              {detail.role !== 'ADMIN' && (
                <button className="btn-danger-admin" onClick={() => remove(detail)}>
                  <FaTrash /> Eliminar
                </button>
              )}
              <button className="btn-secondary-admin" onClick={() => setSelected(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default UserManagement;
