// src/components/admin/CommentsModeration.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import { getDisplayName } from '../../utils/userDisplay';
import Toast from '../Toast';
import { FaTrash, FaComment } from 'react-icons/fa';
import '../../styles/Admin.css';

const CommentsModeration = () => {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  // We don't have a dedicated "list all comments" admin endpoint; this uses
  // the existing comment endpoints per-trip. To keep the UI responsive we
  // show a simplified list loaded lazily.
  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      // As a stopgap: list the most recent comments from the latest trips.
      const r = await request('GET', '/admin/trips', { params: { page: 0, size: 5 } });
      const trips = r.data?.content || [];
      const allComments = [];
      for (const t of trips) {
        try {
          const cr = await request('GET', `/trips/${t.id}/comments`, { params: { page: 0, size: 20 } });
          (cr.data?.content || []).forEach((c) => allComments.push({ ...c, tripId: t.id, tripTitle: t.title }));
        } catch (_) {}
      }
      setComments(allComments);
      setTotalPages(1);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar comentários.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (c) => {
    if (!window.confirm('Eliminar este comentário permanentemente?')) return;
    try {
      await request('DELETE', `/trips/${c.tripId}/comments/${c.id}`);
      showToast('Comentário eliminado.', 'success');
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  return (
    <div className="admin-section-admin">
      <h2><FaComment /> Moderação de Comentários</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        A mostrar os comentários mais recentes. Os comentários podem ser eliminados definitivamente.
      </p>
      {isLoading ? <p>A carregar...</p> : (
        <table className="admin-table-admin">
          <thead>
            <tr><th>Viagem</th><th>Autor</th><th>Conteúdo</th><th>Data</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={`${c.tripId}-${c.id}`}>
                <td>{c.tripTitle}</td>
                <td>{getDisplayName(c, c.userId)}</td>
                <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.content}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}</td>
                <td>
                  <button className="btn-danger-admin" onClick={() => remove(c)}><FaTrash /> Eliminar</button>
                </td>
              </tr>
            ))}
            {comments.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Sem comentários.</td></tr>}
          </tbody>
        </table>
      )}
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default CommentsModeration;
