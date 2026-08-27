// src/components/admin/ReportsManagement.js
// Round 58 — full rewrite: the previous version showed only
// "reportador / motivo / descrição" and never showed which trip was
// reported, so the admin had no idea what to look at. The new layout
// surfaces the offending trip (title, author, country) plus the
// reporter (with avatar and link to their profile), and a status
// filter that now reflects the real enum used by the backend
// (PENDING, REVIEWED, RESOLVED, DISMISSED).
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { getDisplayName } from '../../utils/userDisplay';
import { FaFlag, FaCheck, FaTimes, FaExternalLinkAlt, FaUserCircle } from 'react-icons/fa';
import '../../styles/Admin.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'REVIEWED', label: 'Em revisão' },
  { value: 'RESOLVED', label: 'Resolvidos' },
  { value: 'DISMISSED', label: 'Descartados' },
];

const ReportsManagement = () => {
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
      const r = await request('GET', '/admin/trips/reports', { params: { status, page, size: 20 } });
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
      await request('PUT', `/admin/trips/reports/${report.id}/status`, { status: newStatus });
      showToast(`Denúncia marcada como ${newStatus.toLowerCase()}.`, 'success');
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a atualizar.', 'error');
    }
  };

  return (
    <div className="admin-section-admin">
      <h2><FaFlag /> Denúncias de Viagens</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Lista de todas as denúncias feitas pelos viajantes. Clica em
        "Ver viagem" para abrir a publicação denunciada no site e decidir.
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
              <th>Viagem denunciada</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => {
              const reporter = r.reporter;
              const trip = r.trip;
              return (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>
                    {reporter ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {reporter.profilePhoto ? (
                          <img src={reporter.profilePhoto} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <FaUserCircle size={26} color="#999" />
                        )}
                        <div>
                          <div style={{ fontWeight: 500 }}>{getDisplayName(reporter, reporter.username)}</div>
                          {reporter.username && (
                            <Link to={`/profile/${reporter.username}`} style={{ fontSize: '0.78rem', color: '#0066cc' }}>
                              @{reporter.username}
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '320px' }}>
                    {trip ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{trip.title || `Viagem #${trip.id}`}</div>
                        {trip.username && (
                          <div style={{ fontSize: '0.78rem', color: '#666' }}>
                            por{' '}
                            <Link to={`/profile/${trip.username}`} style={{ color: '#0066cc' }}>
                              @{trip.username}
                            </Link>
                            {trip.countryName ? ` · ${trip.countryName}` : ''}
                          </div>
                        )}
                        <a
                          href={`/travel/${trip.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-info-admin"
                          style={{ marginTop: '6px', display: 'inline-flex', gap: '4px', fontSize: '0.78rem' }}
                        >
                          <FaExternalLinkAlt /> Abrir
                        </a>
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
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
                  <td style={{ fontSize: '0.85rem' }}>
                    {r.reportedAt ? new Date(r.reportedAt).toLocaleString() : '—'}
                  </td>
                  <td>
                    {r.status !== 'REVIEWED' && (
                      <button
                        className="btn-info-admin"
                        onClick={() => updateStatus(r, 'REVIEWED')}
                        style={{ marginRight: '4px' }}
                      >
                        <FaCheck /> Rever
                      </button>
                    )}
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
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  Sem denúncias.
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

export default ReportsManagement;
