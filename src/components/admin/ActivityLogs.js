// src/components/admin/ActivityLogs.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { FaHistory, FaUserShield, FaSignInAlt, FaBell } from 'react-icons/fa';
import '../../styles/Admin.css';

const TABS = [
  { id: 'sessions',  label: 'Sessões',          icon: FaSignInAlt },
  { id: 'activity',  label: 'Atividade Users',  icon: FaBell },
  { id: 'admin',     label: 'Ações Admin',      icon: FaUserShield },
];

const TYPE_LABELS = {
  FOLLOW: 'Seguiu',
  FOLLOW_REQUEST: 'Pediu para seguir',
  FOLLOW_ACCEPTED: 'Aceitou pedido',
  TRIP_LIKE: 'Curtiu viagem',
  TRIP_COMMENT: 'Comentou viagem',
  TRIP_COMMENT_REPLY: 'Respondeu comentário',
  FORUM_QUESTION_COMMENT: 'Comentou pergunta',
  FORUM_COMMENT_REPLY: 'Respondeu no fórum',
};

const ADMIN_TYPE_LABELS = {
  USER_BAN: 'Banir utilizador',
  USER_UNBAN: 'Reativar utilizador',
  USER_DELETE: 'Eliminar utilizador',
  ROLE_CHANGE: 'Alterar permissões',
};

const ActivityLogs = () => {
  const [data, setData] = useState({ userSessions: [], userActivity: [], adminActions: [] });
  const [tab, setTab] = useState('sessions');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/logs');
      setData(r.data || { userSessions: [], userActivity: [], adminActions: [] });
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const sessions = data.userSessions || [];
  const activity = data.userActivity || [];
  const actions  = data.adminActions || [];

  return (
    <div className="admin-section-admin">
      <h2><FaHistory /> Logs de Atividade</h2>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>
        Sessões, atividade de utilizadores e ações de administrador. Atualiza automaticamente ao mudar de separador.
      </p>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e9ecef', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const count =
            t.id === 'sessions' ? sessions.length :
            t.id === 'activity' ? activity.length :
            actions.length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 18px',
                background: active ? '#0066cc' : 'transparent',
                color: active ? '#fff' : '#495057',
                border: 'none',
                borderBottom: active ? '3px solid #0066cc' : '3px solid transparent',
                marginBottom: '-2px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '6px 6px 0 0',
              }}
            >
              <Icon /> {t.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? <p>A carregar...</p> : (
        <>
          {tab === 'sessions' && (
            <table className="admin-table-admin">
              <thead>
                <tr><th>#</th><th>Utilizador</th><th>IP</th><th>Dispositivo</th><th>Iniciada</th><th>Última atividade</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.sessionId}>
                    <td>#{s.sessionId}</td>
                    <td>{s.firstName} {s.lastName} <span style={{ color: '#888' }}>@{s.username}</span></td>
                    <td>{s.ipAddress || '—'}</td>
                    <td>{s.deviceName || s.deviceType || '—'}</td>
                    <td>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</td>
                    <td>{s.lastActivity ? new Date(s.lastActivity).toLocaleString() : '—'}</td>
                    <td>
                      <span className={`role-badge ${s.isActive ? 'role-user' : 'role-admin'}`}>
                        {s.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Sem sessões registadas.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {tab === 'activity' && (
            <table className="admin-table-admin">
              <thead>
                <tr><th>Quando</th><th>Tipo</th><th>De</th><th>Para</th><th>Conteúdo</th></tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</td>
                    <td>{TYPE_LABELS[a.type] || a.type}</td>
                    <td>@{a.actorUsername}</td>
                    <td>@{a.recipientUsername}</td>
                    <td style={{ maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.content}</td>
                  </tr>
                ))}
                {activity.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Sem atividade recente.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {tab === 'admin' && (
            <table className="admin-table-admin">
              <thead>
                <tr><th>Quando</th><th>Tipo</th><th>Alvo</th><th>Detalhe</th></tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id}>
                    <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</td>
                    <td>{ADMIN_TYPE_LABELS[a.type] || a.type}</td>
                    <td>@{a.targetUsername}</td>
                    <td style={{ maxWidth: '420px' }}>{a.reason}</td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Sem ações de administrador registadas.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default ActivityLogs;
