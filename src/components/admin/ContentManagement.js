// src/components/admin/ContentManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { FaTrash } from 'react-icons/fa';
import '../../styles/Admin.css';

const ContentManagement = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/trips', { params: { page, size: 20 } });
      setItems(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar conteúdo.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (t) => {
    if (!window.confirm(`Eliminar "${t.title}"?`)) return;
    try {
      await request('DELETE', `/admin/trips/${t.id}`);
      showToast('Conteúdo removido.', 'success');
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Conteúdo (Viagens)</h2>
      {isLoading ? <p>A carregar...</p> : (
        <table className="admin-table-admin">
          <thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td>#{t.id}</td>
                <td>{t.title}</td>
                <td>{t.username || `user#${t.userId}`}</td>
                <td>{t.startDate}</td>
                <td>
                  <button className="btn-danger-admin" onClick={() => remove(t)}><FaTrash /> Eliminar</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Sem conteúdo.</td></tr>}
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

export default ContentManagement;
