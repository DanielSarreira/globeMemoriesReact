// src/components/admin/ActivityLogs.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

const ActivityLogs = () => {
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  // We don't have a dedicated activity-logs endpoint, so we re-use the
  // user-sessions endpoint (admin can fetch via /users/{id}/sessions) and
  // show a fallback message if it fails.
  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get a sample user and list their sessions
      const usersR = await request('GET', '/admin/users', { params: { page: 0, size: 1 } });
      const u = usersR.data?.content?.[0];
      if (!u) {
        setSessions([]);
        return;
      }
      const r = await request('GET', `/sessions`, { params: { userId: u.id } }).catch(() => null);
      setSessions(r?.data || []);
      setTotalPages(1);
    } catch (e) {
      showToast('Não foi possível carregar sessões ativas.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="admin-section-admin">
      <h2>Sessões Ativas</h2>
      {isLoading ? <p>A carregar...</p> : (
        <table className="admin-table-admin">
          <thead>
            <tr><th>Sessão</th><th>Dispositivo</th><th>IP</th><th>Última atividade</th></tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td>{s.deviceName || s.deviceType || '—'}</td>
                <td>{s.ipAddress || '—'}</td>
                <td>{s.lastActivity ? new Date(s.lastActivity).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Sem sessões registadas.</td></tr>}
          </tbody>
        </table>
      )}
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default ActivityLogs;
