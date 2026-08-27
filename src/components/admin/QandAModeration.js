// src/components/admin/QandAModeration.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import { getDisplayName } from '../../utils/userDisplay';
import Toast from '../Toast';
import { FaTrash, FaQuestion, FaComment, FaTimes } from 'react-icons/fa';
import '../../styles/Admin.css';

const QandAModeration = () => {
  const [tab, setTab] = useState('questions'); // 'questions' | 'comments'
  const [questions, setQuestions] = useState([]);
  const [comments, setComments] = useState([]);
  const [qPage, setQPage] = useState(0);
  const [cPage, setCPage] = useState(0);
  const [qTotalPages, setQTotalPages] = useState(0);
  const [cTotalPages, setCTotalPages] = useState(0);
  const [qSearch, setQSearch] = useState('');
  const [cSearch, setCSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [selected, setSelected] = useState(null); // { type, item }
  const [openQuestion, setOpenQuestion] = useState(null); // question with its comments

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

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

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/forum/comments', { params: { page: cPage, size: 20 } });
      setComments(r.data?.content || []);
      setCTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar comentários.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [cPage]);

  useEffect(() => {
    if (tab === 'questions') fetchQuestions();
    else fetchComments();
  }, [tab, fetchQuestions, fetchComments]);

  const removeQuestion = async (q) => {
    const qid = q.questionId || q.id;
    if (!qid) {
      showToast('Esta pergunta não tem ID válido — não foi possível eliminar.', 'error');
      return;
    }
    if (!window.confirm(`Eliminar a pergunta e TODOS os seus comentários?`)) return;
    try {
      await request('DELETE', `/admin/forum/questions/${qid}`);
      showToast('Pergunta eliminada.', 'success');
      setSelected(null);
      setOpenQuestion(null);
      fetchQuestions();
    } catch (e) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message;
      showToast(
        serverMsg || (status ? `Erro a eliminar (HTTP ${status}).` : 'Erro a eliminar.'),
        'error',
      );
    }
  };

  const removeComment = async (c) => {
    const cid = c.commentId || c.id;
    if (!cid) {
      showToast('Este comentário não tem ID válido — não foi possível eliminar.', 'error');
      return;
    }
    if (!window.confirm(`Eliminar este comentário?`)) return;
    try {
      await request('DELETE', `/admin/forum/comments/${cid}`);
      showToast('Comentário eliminado.', 'success');
      setSelected(null);
      fetchComments();
      if (openQuestion) {
        // Refetch the open question's comments after a deletion.
        loadQuestionComments(openQuestion.question);
      }
    } catch (e) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message;
      showToast(
        serverMsg || (status ? `Erro a eliminar (HTTP ${status}).` : 'Erro a eliminar.'),
        'error',
      );
    }
  };

  const loadQuestionComments = async (q) => {
    setIsLoading(true);
    try {
      // Round 57 — fetch all pages until we have every comment for this
      // question. The /admin/forum/comments endpoint now returns
      // `forumQuestionId` on every DTO, so we can filter precisely.
      const targetQid = q.questionId || q.id;
      const own = [];
      let page = 0;
      const size = 100;
      // Cap at 10 pages (1000 comments) — more than enough for any
      // realistic Q&A. Avoids runaway loops.
      for (let i = 0; i < 10; i++) {
        const r = await request('GET', '/admin/forum/comments', { params: { page, size } });
        const all = r.data?.content || [];
        all.forEach((c) => {
          if (c.forumQuestionId === targetQid) own.push(c);
        });
        if (all.length < size) break;
        page += 1;
      }
      setOpenQuestion({ question: q, comments: own });
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar comentários da pergunta.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const qFiltered = questions.filter((q) => {
    if (!qSearch) return true;
    const t = qSearch.toLowerCase();
    return (
      (q.questionText || '').toLowerCase().includes(t) ||
      (q.category || '').toLowerCase().includes(t) ||
      (q.username || '').toLowerCase().includes(t)
    );
  });

  const cFiltered = comments.filter((c) => {
    if (!cSearch) return true;
    const t = cSearch.toLowerCase();
    return (
      (c.content || '').toLowerCase().includes(t) ||
      (c.username || '').toLowerCase().includes(t)
    );
  });

  return (
    <div className="admin-section-admin">
      <h2><FaQuestion /> Moderação de Q&A</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Vê todas as perguntas do fórum, abre cada uma para ler os comentários, ou lista diretamente todos os comentários.
      </p>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e9ecef', marginBottom: '20px' }}>
        <button
          onClick={() => setTab('questions')}
          style={{
            padding: '10px 18px', background: tab === 'questions' ? '#0066cc' : 'transparent',
            color: tab === 'questions' ? '#fff' : '#495057', border: 'none',
            borderBottom: tab === 'questions' ? '3px solid #0066cc' : '3px solid transparent',
            marginBottom: '-2px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <FaQuestion /> Perguntas
        </button>
        <button
          onClick={() => setTab('comments')}
          style={{
            padding: '10px 18px', background: tab === 'comments' ? '#0066cc' : 'transparent',
            color: tab === 'comments' ? '#fff' : '#495057', border: 'none',
            borderBottom: tab === 'comments' ? '3px solid #0066cc' : '3px solid transparent',
            marginBottom: '-2px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <FaComment /> Todos os Comentários
        </button>
      </div>

      {tab === 'questions' && (
        <>
          <div className="admin-search-bar">
            <input
              type="text"
              placeholder="🔍 Filtrar perguntas..."
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
            />
          </div>
          {isLoading ? <p>A carregar...</p> : (
            <>
              <table className="admin-table-admin">
                <thead>
                  <tr><th>Categoria</th><th>Pergunta</th><th>Autor</th><th>Data</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {qFiltered.map((q) => (
                    <tr key={q.questionId || q.id}>
                      <td>{q.category || '—'}</td>
                      <td style={{ maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.questionText}</td>
                      <td>{getDisplayName(q, `user#${q.userId}`)}</td>
                      <td>{q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}</td>
                      <td>
                        <button className="btn-info-admin" onClick={() => setSelected({ type: 'question', item: q })} style={{ marginRight: '4px' }}>
                          Ver Detalhes
                        </button>
                        <button className="btn-danger-admin" onClick={() => removeQuestion(q)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {qFiltered.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Sem perguntas.</td></tr>}
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

      {tab === 'comments' && (
        <>
          <div className="admin-search-bar">
            <input
              type="text"
              placeholder="🔍 Filtrar comentários por conteúdo ou autor..."
              value={cSearch}
              onChange={(e) => setCSearch(e.target.value)}
            />
          </div>
          {isLoading ? <p>A carregar...</p> : (
            <>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
                {comments.length} comentário{comments.length !== 1 ? 's' : ''} na página atual.
              </p>
              <table className="admin-table-admin">
                <thead>
                  <tr><th>Autor</th><th>Conteúdo</th><th>Likes</th><th>Data</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {cFiltered.map((c) => (
                    <tr key={c.commentId || c.id}>
                      <td>{getDisplayName(c, `user#${c.userId}`)}</td>
                      <td style={{ maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.content}</td>
                      <td>♥ {c.totalLikes ?? 0}</td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}</td>
                      <td>
                        <button className="btn-danger-admin" onClick={() => removeComment(c)}>
                          <FaTrash /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cFiltered.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Sem comentários.</td></tr>}
                </tbody>
              </table>
              {cTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                  <button className="btn-secondary-admin" disabled={cPage === 0} onClick={() => setCPage((p) => p - 1)}>Anterior</button>
                  <span>{cPage + 1} / {cTotalPages}</span>
                  <button className="btn-secondary-admin" disabled={cPage >= cTotalPages - 1} onClick={() => setCPage((p) => p + 1)}>Próxima</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {selected?.type === 'question' && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Pergunta #{selected.item.questionId || selected.item.id}</h3>
              <button className="btn-secondary-admin" onClick={() => setSelected(null)}><FaTimes /></button>
            </div>
            <p style={{ marginTop: '10px' }}><strong>Categoria:</strong> {selected.item.category || '—'}</p>
            <p style={{ marginTop: '10px', padding: '10px 12px', background: '#e7f3ff', borderRadius: '6px' }}>{selected.item.questionText}</p>
            <p style={{ marginTop: '10px' }}>
              <strong>Autor:</strong> {getDisplayName(selected.item, `user#${selected.item.userId}`)}
            </p>
            <p style={{ marginTop: '4px', color: '#666', fontSize: '0.85rem' }}>
              {selected.item.createdAt ? new Date(selected.item.createdAt).toLocaleString() : '—'}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button className="btn-info-admin" onClick={() => loadQuestionComments(selected.item)}>
                <FaComment /> Ver Comentários
              </button>
              <button className="btn-danger-admin" onClick={() => removeQuestion(selected.item)}>
                <FaTrash /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {openQuestion && (
        <div className="modal-overlay" onClick={() => setOpenQuestion(null)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Comentários da pergunta #{openQuestion.question.questionId || openQuestion.question.id}</h3>
              <button className="btn-secondary-admin" onClick={() => setOpenQuestion(null)}><FaTimes /></button>
            </div>
            <p style={{ marginTop: '10px', padding: '8px 10px', background: '#e7f3ff', borderRadius: '6px', fontSize: '0.9rem' }}>
              {openQuestion.question.questionText}
            </p>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '12px' }}>
              <strong>{openQuestion.comments.length}</strong> comentário{openQuestion.comments.length !== 1 ? 's' : ''} encontrado{openQuestion.comments.length !== 1 ? 's' : ''} para esta pergunta.
            </p>
            {openQuestion.comments.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Esta pergunta ainda não tem respostas.</p>
            ) : (
              <table className="admin-table-admin">
                <thead>
                  <tr><th>Autor</th><th>Conteúdo</th><th>Data</th><th></th></tr>
                </thead>
                <tbody>
                  {openQuestion.comments.map((c) => (
                    <tr key={c.commentId || c.id}>
                      <td>{getDisplayName(c, `user#${c.userId}`)}</td>
                      <td style={{ maxWidth: '380px' }}>{c.content}</td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}</td>
                      <td>
                        <button className="btn-danger-admin" onClick={() => removeComment(c)}><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default QandAModeration;
