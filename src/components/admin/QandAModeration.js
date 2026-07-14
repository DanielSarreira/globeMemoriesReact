// src/components/admin/QandAModeration.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { FaTrash, FaQuestion } from 'react-icons/fa';
import '../../styles/Admin.css';

const QandAModeration = () => {
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/forum/questions', { params: { page, size: 20 } });
      setQuestions(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar perguntas.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (q) => {
    if (!window.confirm('Eliminar esta pergunta?')) return;
    try {
      await request('DELETE', `/admin/forum/questions/${q.id}`);
      showToast('Pergunta eliminada.', 'success');
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  return (
    <div className="admin-section-admin">
      <h2><FaQuestion /> Moderação de Q&A</h2>
      {isLoading ? <p>A carregar...</p> : (
        <table className="admin-table-admin">
          <thead>
            <tr><th>Categoria</th><th>Pergunta</th><th>Autor</th><th>Data</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td>{q.category}</td>
                <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.questionText}</td>
                <td>{q.username || `user#${q.userId}`}</td>
                <td>{q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}</td>
                <td>
                  <button className="btn-danger-admin" onClick={() => remove(q)}><FaTrash /> Eliminar</button>
                </td>
              </tr>
            ))}
            {questions.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Sem perguntas.</td></tr>}
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

export default QandAModeration;
