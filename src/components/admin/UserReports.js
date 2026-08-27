// src/components/admin/UserReports.js
//
// Round 58 — dedicated page for USER-LEVEL reports (e.g. a
// traveller reports another traveller for inappropriate
// behaviour). The previous backoffice conflated this with
// /admin/reports which is trip-level only — so when the
// pendingUserReports count went up in the dashboard, the
// admin had no obvious place to read the actual queue. The
// new page calls GET /admin/users/reports (returns
// AdminReportedUserDto rows) and shows the same status
// transitions as the trip-reports page.
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { getDisplayName } from '../../utils/userDisplay';
import { FaUserShield, FaCheck, FaTimes, FaExternalLinkAlt, FaUserCircle } from 'react-icons/fa';
import '../../styles/Admin.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'REVIEWED', label: 'Em revisão' },
  { value: 'RESOLVED', label: 'Resolvidos' },
  { value: 'DISMISSED', label: 'Descartados' },
];

const UserReports = () => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/users/reports', {
        params: { status, page, size: 20 },
      });
      setReports(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar reports.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = async (report, newStatus) => {
    try {
      // Round 59 — the real admin endpoint is
      //   PUT /admin/users/reports/{reportId}/status
      // accepting { status: "RESOLVED" | "DISMISSED" | "REVIEWED" | "PENDING" }.
      // The `request` helper signature is (method, url, data, options)
      // so we pass the body directly as the 3rd arg, not as
      // `{ data: ... }` (that would wrap it in a { data: ... } object
      // and Spring would 400 with "Validation failed" because the
      // top-level `status` field would be missing).
      await request('PUT', `/admin/users/reports/${report.reportId}/status`, { status: newStatus });
      showToast(`Denúncia marcada como ${newStatus.toLowerCase()}.`, 'success');
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a atualizar.', 'error');
    }
  };

  return (
    <div className="admin-section-admin">
      <h2><FaUserShield /> Denúncias de Utilizadores</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Lista de denúncias feitas por viajantes contra outros viajantes
        (conteúdo inapropriado, assédio, spam, etc.). Clica em "Ver perfil"
        para abrir a conta denunciada.
      </p>

      <div className="admin-search-bar" style={{ display: 'flex', gap: '10px' }}>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {isLoading ? <p>A carregar...</p> : (
        <table className="admin-table-admin">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reportador</th>
              <th>Utilizador denunciado</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => {
              const reporter = {
                id: r.reporterId,
                username: r.reporterUsername,
              };
              const reported = {
                id: r.reportedUserId,
                username: r.reportedUserUsername,
              };
              return (
                <tr key={r.reportId}>
                  <td>#{r.reportId}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaUserCircle size={26} color="#999" />
                      <Link to={`/profile/${reporter.username}`} style={{ color: '#0066cc' }}>
                        @{reporter.username}
                      </Link>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaUserCircle size={26} color="#999" />
                      <Link to={`/profile/${reported.username}`} style={{ color: '#0066cc' }}>
                        @{reported.username}
                      </Link>
                      <Link
                        to={`/profile/${reported.username}`}
                        className="btn-info-admin"
                        style={{ marginLeft: '6px', fontSize: '0.78rem', display: 'inline-flex', gap: '4px' }}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FaExternalLinkAlt /> Ver perfil
                      </Link>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.reason}</div>
                    {r.description && (
                      <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>
                        {r.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${(r.status || '').toLowerCase()}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status !== 'RESOLVED' && (
                      <button
                        className="btn-success-admin"
                        onClick={() => updateStatus(r, 'RESOLVED')}
                        style={{ marginRight: '4px' }}
                      >
                        <FaCheck /> Resolver
                      </button>
                    )}
                    {r.status !== 'DISMISSED' && (
                      <button
                        className="btn-warning-admin"
                        onClick={() => updateStatus(r, 'DISMISSED')}
                      >
                        <FaTimes /> Descartar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {reports.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  Sem denúncias de utilizadores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <button className="btn-secondary-admin" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</button>
          <span>Página {page + 1} de {totalPages}</span>
          <button className="btn-secondary-admin" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</button>
        </div>
      )}
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default UserReports;
