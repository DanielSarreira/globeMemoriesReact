// src/components/admin/ContentManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { request, toFullMediaUrl } from '../../axios_helper';
import { getDisplayName } from '../../utils/userDisplay';
import Toast from '../Toast';
import { FaTrash, FaEye, FaUser, FaGlobeAmericas, FaQuestion } from 'react-icons/fa';
import '../../styles/Admin.css';

const ContentManagement = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('trips'); // 'trips' | 'forum'
  const [trips, setTrips] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [tPage, setTPage] = useState(0);
  const [qPage, setQPage] = useState(0);
  const [tTotalPages, setTTotalPages] = useState(0);
  const [qTotalPages, setQTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/trips', { params: { page: tPage, size: 20 } });
      setTrips(r.data?.content || []);
      setTTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar conteúdo.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [tPage]);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/forum/questions', { params: { page: qPage, size: 20 } });
      setQuestions(r.data?.content || []);
      setQTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar perguntas.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [qPage]);

  useEffect(() => {
    if (tab === 'trips') fetchTrips();
    else fetchQuestions();
  }, [tab, fetchTrips, fetchQuestions]);

  const removeTrip = async (t) => {
    if (!window.confirm(`Eliminar "${t.title}"?`)) return;
    try {
      await request('DELETE', `/admin/trips/${t.id}`);
      showToast('Viagem removida.', 'success');
      fetchTrips();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  const removeQuestion = async (q) => {
    if (!window.confirm(`Eliminar a pergunta?`)) return;
    try {
      await request('DELETE', `/admin/forum/questions/${q.questionId || q.id}`);
      showToast('Pergunta removida.', 'success');
      fetchQuestions();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  const openUser = (username) => {
    if (username) navigate(`/profile/${username}`);
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Conteúdo</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Lista de viagens e perguntas do fórum. Clica no nome do autor para abrir o perfil do utilizador.
      </p>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e9ecef', marginBottom: '20px' }}>
        <button
          onClick={() => setTab('trips')}
          style={{
            padding: '10px 18px', background: tab === 'trips' ? '#0066cc' : 'transparent',
            color: tab === 'trips' ? '#fff' : '#495057', border: 'none',
            borderBottom: tab === 'trips' ? '3px solid #0066cc' : '3px solid transparent',
            marginBottom: '-2px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <FaGlobeAmericas /> Viagens
        </button>
        <button
          onClick={() => setTab('forum')}
          style={{
            padding: '10px 18px', background: tab === 'forum' ? '#0066cc' : 'transparent',
            color: tab === 'forum' ? '#fff' : '#495057', border: 'none',
            borderBottom: tab === 'forum' ? '3px solid #0066cc' : '3px solid transparent',
            marginBottom: '-2px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <FaQuestion /> Fórum
        </button>
      </div>

      {isLoading ? <p>A carregar...</p> : (
        <>
          {tab === 'trips' && (
            <>
              <table className="admin-table-admin">
                <thead>
                  <tr><th>ID</th><th>Foto</th><th>Título</th><th>Autor</th><th>Data</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t.id}>
                      <td>#{t.id}</td>
                      <td>
                        {t.photos?.[0] ? (
                          <img src={toFullMediaUrl(t.photos[0])} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                        ) : <span style={{ color: '#aaa' }}>—</span>}
                      </td>
                      <td style={{ maxWidth: '320px' }}>{t.title}</td>
                      <td>
                        <button
                          onClick={() => openUser(t.username)}
                          style={{ background: 'transparent', border: 'none', color: '#0066cc', cursor: 'pointer', padding: 0, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Abrir perfil do autor"
                        >
                          <FaUser /> {getDisplayName(t, `user#${t.userId}`)}
                        </button>
                        <div style={{ fontSize: '0.78rem', color: '#888' }}>@{t.username || '—'}</div>
                      </td>
                      <td>{t.startDate || '—'}</td>
                      <td>
                        <button className="btn-info-admin" onClick={() => navigate(`/travel/${t.id}`)} style={{ marginRight: '4px' }}>
                          <FaEye /> Ver
                        </button>
                        <button className="btn-danger-admin" onClick={() => removeTrip(t)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {trips.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Sem conteúdo.</td></tr>}
                </tbody>
              </table>
              {tTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                  <button className="btn-secondary-admin" disabled={tPage === 0} onClick={() => setTPage((p) => p - 1)}>Anterior</button>
                  <span>{tPage + 1} / {tTotalPages}</span>
                  <button className="btn-secondary-admin" disabled={tPage >= tTotalPages - 1} onClick={() => setTPage((p) => p + 1)}>Próxima</button>
                </div>
              )}
            </>
          )}

          {tab === 'forum' && (
            <>
              <table className="admin-table-admin">
                <thead>
                  <tr><th>ID</th><th>Categoria</th><th>Pergunta</th><th>Autor</th><th>Data</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.questionId || q.id}>
                      <td>#{q.questionId || q.id}</td>
                      <td>{q.category || '—'}</td>
                      <td style={{ maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.questionText}</td>
                      <td>
                        <button
                          onClick={() => openUser(q.username)}
                          style={{ background: 'transparent', border: 'none', color: '#0066cc', cursor: 'pointer', padding: 0, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Abrir perfil do autor"
                        >
                          <FaUser /> {getDisplayName(q, `user#${q.userId}`)}
                        </button>
                        <div style={{ fontSize: '0.78rem', color: '#888' }}>@{q.username || '—'}</div>
                      </td>
                      <td>{q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}</td>
                      <td>
                        <button className="btn-danger-admin" onClick={() => removeQuestion(q)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {questions.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Sem perguntas.</td></tr>}
                </tbody>
              </table>
              {qTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                  <button className="btn-secondary-admin" disabled={qPage === 0} onClick={() => setQPage((p) => p - 1)}>Anterior</button>
                  <span>{qPage + 1} / {qTotalPages}</span>
                  <button className="btn-secondary-admin" disabled={qPage >= qTotalPages - 1} onClick={() => setQPage((p) => p + 1)}>Próxima</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default ContentManagement;
