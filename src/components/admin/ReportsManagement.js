// src/components/admin/ReportsManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { FaFlag, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
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
      showToast(`Report ${newStatus.toLowerCase()}.`, 'success');
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a atualizar.', 'error');
    }
  };

  return (
    <div className="admin-section-admin">
      <h2><FaFlag /> Denúncias de Viagens</h2>
      <div className="admin-search-bar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {isLoading ? <p>A carregar...</p> : (
        <table className="admin-table-admin">
          <thead>
            <tr><th>ID</th><th>Reportador</th><th>Motivo</th><th>Descrição</th><th>Estado</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.reporterUsername || r.reporterId}</td>
                <td>{r.reason}</td>
                <td>{r.description || '—'}</td>
                <td><span className={`status-badge status-${(r.status || '').toLowerCase()}`}>{r.status}</span></td>
                <td>
                  {r.status !== 'RESOLVED' && (
                    <button className="btn-success-admin" onClick={() => updateStatus(r, 'RESOLVED')}><FaCheck /> Resolver</button>
                  )}
                  {r.status !== 'DISMISSED' && (
                    <button className="btn-warning-admin" onClick={() => updateStatus(r, 'DISMISSED')} style={{ marginLeft: '6px' }}><FaTimes /> Descartar</button>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Sem reports.</td></tr>}
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
