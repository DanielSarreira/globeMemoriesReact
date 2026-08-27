// src/components/admin/CountryManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import { translateCountry, translateCity } from '../../utils/localization';
import Toast from '../Toast';
import { FaTrash, FaEdit, FaPlus, FaGlobeAmericas } from 'react-icons/fa';
import '../../styles/Admin.css';

const CountryManagement = () => {
  const [tab, setTab] = useState('cities'); // 'cities' | 'countries'

  // Cities tab state
  const [cities, setCities] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Countries tab state
  const [countries, setCountries] = useState([]);
  const [countrySearch, setCountrySearch] = useState('');

  // Edit / Add modal
  const [editing, setEditing] = useState(null); // null | { id?, cityName, countryName }
  const [showAdd, setShowAdd] = useState(false);

  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  // ─── Cities ────────────────────────────────────────────────────────
  const fetchCities = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build the params object WITHOUT undefined keys — axios
      // otherwise serialises them as the literal string "undefined",
      // which the backend then matches against `country = 'undefined'`
      // and returns an empty page. See Round 55 bugfix.
      const params = { page, size: 20 };
      const country = selectedCountry.trim();
      const q = search.trim();
      if (country) params.country = country;
      if (q) params.q = q;

      const r = await request('GET', '/admin/cities/search', null, { params });
      setCities(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
      setTotalElements(r.data?.totalElements || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar cidades.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedCountry]);

  useEffect(() => {
    if (tab === 'cities') {
      fetchCities();
    } else {
      setCountryInput('');
    }
  }, [tab, fetchCities]);

  // Debounce the country input — typing fast would otherwise fire
  // one request per keystroke against the 45k+ row table.
  const [countryInput, setCountryInput] = useState('');
  useEffect(() => {
    if (tab !== 'cities') return;
    const t = setTimeout(() => {
      if (countryInput !== selectedCountry) {
        setSelectedCountry(countryInput);
        setPage(0);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryInput, tab]);

  // ─── Countries ─────────────────────────────────────────────────────
  const fetchCountries = useCallback(async () => {
    // /cities/countries is a public endpoint that returns the sorted
    // distinct list. We re-use it for the admin view.
    try {
      const r = await request('GET', '/cities/countries');
      setCountries(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      showToast('Erro a carregar países.', 'error');
    }
  }, []);

  useEffect(() => {
    if (tab === 'countries') fetchCountries();
  }, [tab, fetchCountries]);

  // ─── Mutations ─────────────────────────────────────────────────────
  const saveCity = async () => {
    if (!editing) return;
    if (!editing.cityName?.trim() || !editing.countryName?.trim()) {
      showToast('Cidade e país são obrigatórios.', 'error');
      return;
    }
    try {
      if (editing.id) {
        await request('PUT', `/admin/cities/${editing.id}`, {
          cityName: editing.cityName.trim(),
          countryName: editing.countryName.trim(),
        });
        showToast('Cidade atualizada.', 'success');
      } else {
        await request('POST', '/admin/cities', {
          cityName: editing.cityName.trim(),
          countryName: editing.countryName.trim(),
        });
        showToast('Cidade adicionada.', 'success');
      }
      setEditing(null);
      setShowAdd(false);
      fetchCities();
      fetchCountries();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a guardar.', 'error');
    }
  };

  const removeCity = async (c) => {
    if (!window.confirm(`Eliminar a cidade "${translateCity(c.cityName)}" (${translateCountry(c.countryName)})?`)) return;
    try {
      await request('DELETE', `/admin/cities/${c.id}`);
      showToast('Cidade eliminada.', 'success');
      fetchCities();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  const filteredCountries = countries.filter((c) => {
    if (!countrySearch) return true;
    const t = countrySearch.toLowerCase();
    return (
      c.toLowerCase().includes(t) ||
      translateCountry(c).toLowerCase().includes(t)
    );
  });

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="admin-section-admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>
          <FaGlobeAmericas /> Gestão de Países e Cidades
        </h2>
        {tab === 'cities' && (
          <button className="btn-primary-admin" onClick={() => { setEditing({ cityName: '', countryName: '' }); setShowAdd(true); }}>
            <FaPlus style={{ marginRight: '6px' }} /> Adicionar cidade
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e9ecef', marginBottom: '20px' }}>
        <button
          onClick={() => setTab('cities')}
          style={{
            padding: '10px 18px', background: tab === 'cities' ? '#0066cc' : 'transparent',
            color: tab === 'cities' ? '#fff' : '#495057', border: 'none',
            borderBottom: tab === 'cities' ? '3px solid #0066cc' : '3px solid transparent',
            marginBottom: '-2px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
          }}
        >
          🏙️ Cidades ({totalElements})
        </button>
        <button
          onClick={() => setTab('countries')}
          style={{
            padding: '10px 18px', background: tab === 'countries' ? '#0066cc' : 'transparent',
            color: tab === 'countries' ? '#fff' : '#495057', border: 'none',
            borderBottom: tab === 'countries' ? '3px solid #0066cc' : '3px solid transparent',
            marginBottom: '-2px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
          }}
        >
          🌍 Países ({countries.length})
        </button>
      </div>

      {tab === 'cities' && (
        <>
          <div className="admin-search-bar" style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Filtrar cidades por nome..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              style={{ flex: 1, minWidth: '220px' }}
            />
            <input
              type="text"
              placeholder="🌍 Filtrar por país (ex: Portugal)..."
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedCountry(countryInput); setPage(0); } }}
              style={{ flex: 1, minWidth: '220px' }}
            />
            <button className="btn-primary-admin" onClick={() => { setSelectedCountry(countryInput); setPage(0); }}>Pesquisar</button>
          </div>

          {isLoading ? <p>A carregar...</p> : (
            <>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                {totalElements} cidade{totalElements !== 1 ? 's' : ''} encontrada{totalElements !== 1 ? 's' : ''}.
              </p>
              <table className="admin-table-admin">
                <thead>
                  <tr><th>ID</th><th>Cidade</th><th>País</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {cities.map((c) => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td>{translateCity(c.cityName)}</td>
                      <td>{translateCountry(c.countryName)}</td>
                      <td>
                        <button className="btn-warning-admin" onClick={() => { setEditing(c); setShowAdd(true); }} style={{ marginRight: '6px' }}>
                          <FaEdit /> Editar
                        </button>
                        <button className="btn-danger-admin" onClick={() => removeCity(c)}>
                          <FaTrash /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cities.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Sem cidades para o filtro.</td></tr>
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                  <button className="btn-secondary-admin" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</button>
                  <span>Página {page + 1} de {totalPages}</span>
                  <button className="btn-secondary-admin" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'countries' && (
        <>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px' }}>
            Lista de países atualmente disponíveis no site. Os países são derivados das cidades registadas — para
            adicionar um novo país, crie uma cidade nele (separador "Cidades").
          </p>
          <div className="admin-search-bar" style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="🔍 Filtrar países..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {filteredCountries.map((c) => (
              <div key={c} style={{ padding: '12px 14px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '6px', fontSize: '0.95rem' }}>
                🌍 {translateCountry(c)}
              </div>
            ))}
            {filteredCountries.length === 0 && (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', padding: '20px' }}>Sem países para o filtro.</p>
            )}
          </div>
        </>
      )}

      {showAdd && editing && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setEditing(null); }}>
          <div className="modal-content-users" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <h3>{editing.id ? 'Editar cidade' : 'Adicionar cidade'}</h3>
            <div className="form-group-admin" style={{ marginTop: '12px' }}>
              <label>Nome da cidade:</label>
              <input
                type="text"
                value={editing.cityName || ''}
                onChange={(e) => setEditing({ ...editing, cityName: e.target.value })}
                placeholder="ex: Lisboa"
              />
            </div>
            <div className="form-group-admin" style={{ marginTop: '12px' }}>
              <label>País:</label>
              <input
                type="text"
                value={editing.countryName || ''}
                onChange={(e) => setEditing({ ...editing, countryName: e.target.value })}
                placeholder="ex: Portugal"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-primary-admin" onClick={saveCity}>Guardar</button>
              <button className="btn-secondary-admin" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default CountryManagement;
