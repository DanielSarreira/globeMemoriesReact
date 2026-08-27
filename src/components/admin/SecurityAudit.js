// src/components/admin/SecurityAudit.js
// Round 53 backoffice — Security audit overview.
// Shows recent active sessions, logins per day, blocked users,
// reports by status, top IPs, expired sessions.
// Backend: GET /admin/security-audit

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

const SecurityAudit = () => {
  const [audit, setAudit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/security-audit');
      setAudit(r.data);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar auditoria.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const loginLabels = useMemo(() => Object.keys(audit?.loginsLast7Days || {}), [audit]);
  const loginsData = useMemo(() => ({
    labels: loginLabels,
    datasets: [{
      label: 'Sessões iniciadas',
      data: loginLabels.map((d) => audit?.loginsLast7Days?.[d] || 0),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }],
  }), [loginLabels, audit]);

  const topIpsData = useMemo(() => ({
    labels: (audit?.topIps || []).map((i) => i.ip),
    datasets: [{
      label: 'Sessões por IP',
      data: (audit?.topIps || []).map((i) => i.count),
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    }],
  }), [audit]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  if (isLoading && !audit) {
    return <div className="admin-section-admin"><p>A carregar auditoria...</p></div>;
  }
  if (!audit) {
    return <div className="admin-section-admin"><p>Sem dados para mostrar.</p></div>;
  }

  return (
    <div className="admin-section-admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🔒 Auditoria de Segurança</h2>
        <button className="btn-primary-admin" onClick={fetch} disabled={isLoading}>
          {isLoading ? 'A atualizar...' : '🔄 Atualizar'}
        </button>
      </div>

      {/* Top stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <Stat label="🚫 Utilizadores Bloqueados" value={audit.totalBlockedUsers} sub="na plataforma" />
        <Stat label="⏰ Sessões Expiradas 24h" value={audit.sessionsExpiredLast24h} sub="últimas 24h" />
        <Stat label="📋 Relatórios Pendentes" value={getPendingReports(audit.reportsByStatus)} sub="utilizadores + viagens" />
        <Stat label="🌐 IPs Únicos" value={audit.topIps?.length || 0} sub="rastreados" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        <Card title="📊 Logins — últimos 7 dias">
          <div style={{ height: '280px' }}><Bar data={loginsData} options={chartOptions} /></div>
        </Card>
        <Card title="🌐 Top IPs por número de sessões">
          <div style={{ height: '280px' }}><Bar data={topIpsData} options={chartOptions} /></div>
        </Card>
      </div>

      <Card title="📋 Relatórios por estado">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {Object.entries(audit.reportsByStatus || {}).map(([status, count]) => (
            <div key={status} style={{
              padding: '8px 14px',
              background: getStatusColor(status),
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#fff',
            }}>
              {status}: {count}
            </div>
          ))}
        </div>
      </Card>

      <Card title={`🖥️ Sessões ativas recentes (${audit.recentSessions?.length || 0})`}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={th}>User</th>
                <th style={th}>IP</th>
                <th style={th}>Dispositivo</th>
                <th style={th}>Última Atividade</th>
                <th style={th}>Expira</th>
                <th style={th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {audit.recentSessions?.map((s) => (
                <tr key={s.sessionId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={td}>
                    <strong>{s.username}</strong>
                    {s.userId && <span style={{ color: '#9ca3af', marginLeft: 6 }}>#{s.userId}</span>}
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.ipAddress}</td>
                  <td style={td}>
                    {s.deviceName || s.deviceType || '—'}
                    {s.deviceType && <span style={{ color: '#9ca3af', marginLeft: 6 }}>({s.deviceType})</span>}
                  </td>
                  <td style={td}>{formatDate(s.lastActivity)}</td>
                  <td style={td}>{formatDate(s.expiresAt)}</td>
                  <td style={td}>
                    <span style={{
                      padding: '3px 8px',
                      background: s.isActive ? '#10b981' : '#6b7280',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {s.isActive ? 'ATIVA' : 'INATIVA'}
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
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  }}>
    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '6px' }}>{label}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>{sub}</div>}
  </div>
);

const Card = ({ title, children }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  }}>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem' }}>{title}</h3>
    {children}
  </div>
);

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' };
const td = { padding: '10px 12px', fontSize: '0.9rem' };

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getPendingReports(map) {
  if (!map) return 0;
  let total = 0;
  for (const [k, v] of Object.entries(map)) {
    if (k.includes('PENDING') || k.includes('OPEN')) total += v;
  }
  return total;
}

function getStatusColor(status) {
  if (status.includes('PENDING')) return '#f59e0b';
  if (status.includes('RESOLVED') || status.includes('ACCEPTED')) return '#10b981';
  if (status.includes('REJECTED') || status.includes('DISMISSED')) return '#6b7280';
  if (status.includes('UNDER_REVIEW')) return '#3b82f6';
  return '#9ca3af';
}

export default SecurityAudit;
