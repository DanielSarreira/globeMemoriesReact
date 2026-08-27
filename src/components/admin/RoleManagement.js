// src/components/admin/RoleManagement.js
// Round 53 backoffice — Role management overview.
// Groups users by role (USER / MODERATOR / ADMIN) and exposes
// per-user role change with audit-friendly confirmation. Also
// surfaces role statistics (counts, recent promotions).
// Backend: GET /admin/users (paginated), PUT /admin/users/{id}/role

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { getDisplayName } from '../../utils/userDisplay';
import '../../styles/Admin.css';

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/users', {
        params: {
          page,
          size: 50,
          search: search.trim() || undefined,
        },
      });
      setUsers(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar utilizadores.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const roleStats = useMemo(() => {
    const stats = { USER: 0, MODERATOR: 0, ADMIN: 0, OTHER: 0 };
    for (const u of users) {
      const r = (u.role || 'USER').toUpperCase();
      if (stats[r] !== undefined) stats[r]++;
      else stats.OTHER++;
    }
    return stats;
  }, [users]);

  const filtered = useMemo(() => {
    if (!filterRole) return users;
    return users.filter((u) => (u.role || 'USER').toUpperCase() === filterRole);
  }, [users, filterRole]);

  const changeRole = async (user, newRole) => {
    const currentRole = (user.role || 'USER').toUpperCase();
    if (currentRole === newRole) return;
    if (newRole === 'ADMIN' && !window.confirm(`Tornar ${user.username} em ADMINISTRADOR? Esta ação dá-lhe acesso total ao backoffice.`)) return;
    if (currentRole === 'ADMIN' && newRole === 'USER' && !window.confirm(`Remover privilégios de ADMIN a ${user.username}?`)) return;
    try {
      await request('PUT', `/admin/users/${user.id}/role`, { role: newRole });
      showToast(`Role de ${user.username} alterado para ${newRole}.`, 'success');
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a alterar role.', 'error');
    }
  };

  const chartData = useMemo(() => ({
    labels: ['USER', 'MODERATOR', 'ADMIN'],
    datasets: [{
      label: 'Utilizadores por Role',
      data: [roleStats.USER, roleStats.MODERATOR, roleStats.ADMIN],
      backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
      borderWidth: 1,
    }],
  }), [roleStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const roleColor = (role) => {
    switch ((role || 'USER').toUpperCase()) {
      case 'ADMIN': return '#ef4444';
      case 'MODERATOR': return '#f59e0b';
      case 'USER': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>👑 Gestão de Roles</h2>

      <div style={{
        background: '#eef2ff',
        border: '1px solid #c7d2fe',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '0.85rem',
        color: '#3730a3',
      }}>
        ℹ️ <strong>USER</strong> é o role padrão. <strong>MODERATOR</strong> pode moderar
        conteúdo. <strong>ADMIN</strong> tem acesso total ao backoffice — só promove quem
        realmente precisa. As ações ficam registadas nos logs do backend.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <Stat label="👤 Utilizadores (USER)" value={roleStats.USER} color="#3b82f6" />
        <Stat label="🛡️ Moderadores" value={roleStats.MODERATOR} color="#f59e0b" />
        <Stat label="👑 Administradores" value={roleStats.ADMIN} color="#ef4444" />
        <Stat label="📊 Total visível" value={users.length} sub="nesta página" />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Distribuição de Roles (página atual)</h3>
        <div style={{ height: '260px' }}><Bar data={chartData} options={chartOptions} /></div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Utilizadores ({filtered.length})</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Procurar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem' }}
            />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem' }}>
              <option value="">Todos os roles</option>
              <option value="USER">USER</option>
              <option value="MODERATOR">MODERATOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={th}>User</th>
                <th style={th}>Email</th>
                <th style={th}>Role atual</th>
                <th style={th}>Alterar para</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={td}>
                    <strong>{getDisplayName(u, u.username)}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>@{u.username} · #{u.id}</div>
                  </td>
                  <td style={{ ...td, fontSize: '0.85rem' }}>{u.email}</td>
                  <td style={td}>
                    <span style={{
                      padding: '3px 10px',
                      background: roleColor(u.role),
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {u.role || 'USER'}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['USER', 'MODERATOR', 'ADMIN'].map((r) => (
                        <button
                          key={r}
                          onClick={() => changeRole(u, r)}
                          disabled={(u.role || 'USER').toUpperCase() === r}
                          style={{
                            padding: '4px 10px',
                            background: (u.role || 'USER').toUpperCase() === r ? '#e5e7eb' : roleColor(r),
                            color: (u.role || 'USER').toUpperCase() === r ? '#9ca3af' : '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (u.role || 'USER').toUpperCase() === r ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={pageBtn}>‹ Anterior</button>
            <span style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Página {page + 1} de {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={pageBtn}>Próxima ›</button>
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

const Stat = ({ label, value, color, sub }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', borderLeft: `4px solid ${color || '#3b82f6'}` }}>
    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{label}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{sub}</div>}
  </div>
);

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' };
const td = { padding: '10px 12px', fontSize: '0.9rem' };
const pageBtn = {
  padding: '6px 14px',
  background: '#fff',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

export default RoleManagement;
