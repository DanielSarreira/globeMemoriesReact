// src/components/admin/TravelModerationComplete.js
import React, { useState, useEffect, useCallback } from 'react';
import { request, toFullMediaUrl } from '../../axios_helper';
import Toast from '../Toast';
import { FaTrash, FaEye, FaSearch } from 'react-icons/fa';
import '../../styles/Admin.css';

const TravelModerationComplete = () => {
  const [travels, setTravels] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [selected, setSelected] = useState(null);

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/trips', { params: { page, size: 12 } });
      setTravels(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar viagens.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (trip) => {
    if (!window.confirm(`Eliminar a viagem "${trip.title}"?`)) return;
    try {
      await request('DELETE', `/admin/trips/${trip.id}`);
      showToast('Viagem eliminada.', 'success');
      setSelected(null);
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  const filtered = travels.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.title || '').toLowerCase().includes(q) || (t.username || '').toLowerCase().includes(q);
  });

  return (
    <div className="admin-section-admin">
      <h2><FaEye /> Moderação de Viagens</h2>
      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="🔍 Filtrar por título ou utilizador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isLoading ? <p>A carregar...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '20px' }}>
            {filtered.map((t) => (
              <div key={t.id} className="admin-trip-card" style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '15px', background: '#fff' }}>
                {t.tripPhoto && (
                  <img src={toFullMediaUrl(t.tripPhoto)} alt={t.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                )}
                <h3 style={{ margin: '10px 0 6px' }}>{t.title}</h3>
                <p style={{ margin: 0, color: '#666' }}>por {t.username || `user#${t.userId}`}</p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                  {t.citiesVisited?.[0] || '—'}, {t.countriesVisited?.[0] || '—'}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button className="btn-primary-admin" onClick={() => setSelected(t)}>Ver Detalhes</button>
                  <button className="btn-danger-admin" onClick={() => remove(t)}><FaTrash /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p style={{ textAlign: 'center', padding: '30px' }}>Sem viagens.</p>}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secondary-admin" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</button>
              <span>{page + 1} / {totalPages}</span>
              <button className="btn-secondary-admin" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</button>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>{selected.title}</h3>
            <p><strong>Autor:</strong> {selected.username || `user#${selected.userId}`}</p>
            <p><strong>Cidades:</strong> {selected.citiesVisited?.join(', ') || '—'}</p>
            <p><strong>Países:</strong> {selected.countriesVisited?.join(', ') || '—'}</p>
            <p><strong>Período:</strong> {selected.startDate} → {selected.endDate}</p>
            <p><strong>Rating:</strong> {selected.tripRating || 0} ⭐</p>
            <p><strong>Total:</strong> {selected.totalCosts}€</p>
            <p style={{ marginTop: '10px' }}>{selected.tripSummary || '(sem descrição)'}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-danger-admin" onClick={() => remove(selected)}>Eliminar Viagem</button>
              <button className="btn-secondary-admin" onClick={() => setSelected(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default TravelModerationComplete;
