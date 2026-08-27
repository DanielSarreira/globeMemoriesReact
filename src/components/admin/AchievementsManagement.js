// src/components/admin/AchievementsManagement.js
// Round 53 backoffice — Achievements (gamification) page.
// Shows the achievement catalogue and per-user unlock status.
// Backend: GET /admin/achievements/catalogue, GET /admin/achievements/users

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

const AchievementsManagement = () => {
  const [catalogue, setCatalogue] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cat, us] = await Promise.all([
        request('GET', '/admin/achievements/catalogue'),
        request('GET', '/admin/achievements/users'),
      ]);
      setCatalogue(cat.data || []);
      setUsers(us.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar achievements.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      (u.username || '').toLowerCase().includes(s) ||
      (u.displayName || '').toLowerCase().includes(s)
    );
  }, [users, search]);

  const topByAchievements = useMemo(() => {
    return [...users].sort((a, b) => b.totalUnlocked - a.totalUnlocked).slice(0, 10);
  }, [users]);

  const leaderboardData = useMemo(() => ({
    labels: topByAchievements.map((u) => u.username || `user#${u.userId}`),
    datasets: [{
      label: 'Achievements desbloqueadas',
      data: topByAchievements.map((u) => u.totalUnlocked),
      backgroundColor: 'rgba(168, 85, 247, 0.6)',
      borderColor: 'rgba(168, 85, 247, 1)',
      borderWidth: 1,
    }],
  }), [topByAchievements]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const tierColor = (tier) => {
    switch (tier) {
      case 'BRONZE': return '#cd7f32';
      case 'SILVER': return '#9ca3af';
      case 'GOLD': return '#f59e0b';
      case 'PLATINUM': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  if (isLoading && catalogue.length === 0) {
    return <div className="admin-section-admin"><p>A carregar achievements...</p></div>;
  }

  return (
    <div className="admin-section-admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🏆 Achievements & Gamificação</h2>
        <button className="btn-primary-admin" onClick={fetchAll} disabled={isLoading}>
          {isLoading ? '⏳' : '🔄'} Atualizar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <Stat label="Total Achievements" value={catalogue.length} sub="no catálogo" />
        <Stat label="Utilizadores" value={users.length} sub="com contagens" />
        <Stat label="Média por User" value={users.length ? (users.reduce((s, u) => s + u.totalUnlocked, 0) / users.length).toFixed(1) : '0'} sub="achievements desbloqueadas" />
        <Stat label="Power Users (5+)" value={users.filter((u) => u.totalUnlocked >= 5).length} sub="≥ 5 achievements" />
      </div>

      <Card title="🥇 Top 10 — Leaderboard">
        <div style={{ height: '300px' }}><Bar data={leaderboardData} options={chartOptions} /></div>
      </Card>

      <Card title="📚 Catálogo de Achievements">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {catalogue.map((a) => (
            <div key={a.key} style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              borderLeft: `4px solid ${tierColor(a.tier)}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
                <strong style={{ flex: 1 }}>{a.name}</strong>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: tierColor(a.tier), color: '#fff', borderRadius: '12px' }}>{a.tier}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{a.description}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', fontFamily: 'monospace' }}>{a.key}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={`👥 Achievements por Utilizador (${filteredUsers.length})`}>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="🔍 Procurar por username ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.9rem',
            }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={th}>User</th>
                <th style={th}>Viagens</th>
                <th style={th}>Likes</th>
                <th style={th}>Comentários</th>
                <th style={th}>Seguidores</th>
                <th style={th}>Seguindo</th>
                <th style={th}>Achievements</th>
                <th style={th}>Desbloqueadas</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.userId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={td}>
                    <strong>{u.displayName || u.username}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>@{u.username}</div>
                  </td>
                  <td style={td}>{u.trips}</td>
                  <td style={td}>{u.likes}</td>
                  <td style={td}>{u.comments}</td>
                  <td style={td}>{u.followers}</td>
                  <td style={td}>{u.following}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {u.unlockedKeys?.length > 0
                        ? u.unlockedKeys.map((k) => {
                            const a = catalogue.find((c) => c.key === k);
                            return a ? (
                              <span key={k} title={a.name} style={{
                                fontSize: '1.1rem', cursor: 'help',
                              }}>{a.icon}</span>
                            ) : null;
                          })
                        : <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Nenhuma</span>}
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{
                      padding: '3px 10px',
                      background: u.totalUnlocked >= 5 ? '#10b981' : u.totalUnlocked > 0 ? '#3b82f6' : '#9ca3af',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      {u.totalUnlocked}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

const Stat = ({ label, value, sub }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{label}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{sub}</div>}
  </div>
);

const Card = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem' }}>{title}</h3>
    {children}
  </div>
);

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' };
const td = { padding: '10px 12px', fontSize: '0.9rem' };

export default AchievementsManagement;
