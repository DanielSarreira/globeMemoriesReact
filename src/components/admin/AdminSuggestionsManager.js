// src/components/admin/AdminSuggestionsManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/components/admin-suggestions.css';

const STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'REVIEWED', label: 'Em revisão' },
  { value: 'RESOLVED', label: 'Resolvidos' },
  { value: 'DISMISSED', label: 'Descartados' },
];

const TYPES = [
  { value: '', label: 'Todos' },
  { value: 'SUGGESTION', label: 'Sugestões' },
  { value: 'ERROR_REPORT', label: 'Reportes de Erro' },
];

const AdminSuggestionsManager = () => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/feedback', {
        params: { status, feedbackType: type, page, size: 20 },
      });
      setItems(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [status, type, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = async (item, newStatus) => {
    try {
      await request('PUT', `/admin/feedback/${item.id}/status`, { status: newStatus });
      showToast(`Feedback ${newStatus.toLowerCase()}.`, 'success');
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a atualizar.', 'error');
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>📬 Sugestões & Erros</h2>
      <div className="admin-search-bar">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(0); }}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {isLoading ? <p>A carregar...</p> : (
        <table className="admin-table-admin">
          <thead>
            <tr><th>Tipo</th><th>Título</th><th>Descrição</th><th>Estado</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.feedbackType}</td>
                <td>{it.title}</td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.description}</td>
                <td><span className={`status-badge status-${(it.status || '').toLowerCase()}`}>{it.status}</span></td>
                <td>
                  {it.status !== 'RESOLVED' && (
                    <button className="btn-success-admin" onClick={() => updateStatus(it, 'RESOLVED')}>Resolver</button>
                  )}
                  {it.status !== 'DISMISSED' && (
                    <button className="btn-warning-admin" onClick={() => updateStatus(it, 'DISMISSED')} style={{ marginLeft: '6px' }}>Descartar</button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Sem feedback.</td></tr>}
          </tbody>
        </table>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <button className="btn-secondary-admin" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</button>
          <span>{page + 1} / {totalPages}</span>
          <button className="btn-secondary-admin" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</button>
        </div>
      )}
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default AdminSuggestionsManager;
