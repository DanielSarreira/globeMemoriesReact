// src/components/admin/CountryManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

const CountryManagement = () => {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetchCities = useCallback(async () => {
    if (!selectedCountry) {
      setCities([]);
      return;
    }
    setIsLoading(true);
    try {
      const r = await request('GET', '/cities/by-country', { params: { countryName: selectedCountry } });
      setCities(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      showToast('Erro a carregar cidades.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  const filtered = cities.filter((c) => c.cityName.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Cidades/Países</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Total de {cities.length} cidades para o país selecionado.
      </p>
      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="🔍 Filtrar cidades..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <input
          type="text"
          placeholder="🌍 Filtrar por país (carregue Enter)..."
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedCountry(e.target.value); setPage(0); } }}
        />
      </div>
      {isLoading ? (
        <p>A carregar...</p>
      ) : (
        <>
          <table className="admin-table-admin">
            <thead>
              <tr><th>Cidade</th><th>País</th></tr>
            </thead>
            <tbody>
              {paginated.map((c) => (
                <tr key={c.id}>
                  <td>{c.cityName}</td>
                  <td>{c.countryName}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>
                  {selectedCountry ? 'Sem cidades para o filtro.' : 'Insira um país para pesquisar.'}
                </td></tr>
              )}
            </tbody>
          </table>
          {filtered.length > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
              <button className="btn-secondary-admin" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</button>
              <span>Página {page + 1} de {Math.ceil(filtered.length / pageSize)}</span>
              <button className="btn-secondary-admin" disabled={(page + 1) * pageSize >= filtered.length} onClick={() => setPage((p) => p + 1)}>Próxima</button>
            </div>
          )}
        </>
      )}
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default CountryManagement;
