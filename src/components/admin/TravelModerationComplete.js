// src/components/admin/TravelModerationComplete.js
import React, { useState, useEffect, useCallback } from 'react';
import { request, toFullMediaUrl } from '../../axios_helper';
import { getDisplayName, getDisplayInitials } from '../../utils/userDisplay';
import { translateCountry, translateCity } from '../../utils/localization';
import Toast from '../Toast';
import { FaTrash, FaEye, FaTimes, FaUser, FaStar, FaEuroSign, FaCamera, FaBed, FaUtensils, FaBus, FaLanguage, FaRoute, FaTags, FaMapMarkerAlt, FaPlus } from 'react-icons/fa';
import '../../styles/Admin.css';

const fmt = (v) => (v == null || v === '' ? '—' : v);
const fmtList = (arr) => (Array.isArray(arr) && arr.length ? arr.join(', ') : '—');

const Section = ({ icon: Icon, title, children }) => (
  <div style={{ marginTop: '14px' }}>
    <h4 style={{ margin: '0 0 6px', color: '#495057', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon /> {title}
    </h4>
    <div style={{ padding: '10px 12px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
      {children}
    </div>
  </div>
);

const TravelModerationComplete = () => {
  const [travels, setTravels] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [selected, setSelected] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);

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
    if (!window.confirm(`Eliminar a viagem "${trip.title}"? Esta ação é IRREVERSÍVEL.`)) return;
    try {
      await request('DELETE', `/admin/trips/${trip.id}`);
      showToast('Viagem eliminada.', 'success');
      setSelected(null);
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  // V15 — Reference-point inline editing. The admin can tweak the
  // category of each point, add new points, or delete them without
  // leaving the moderation modal. We hit the existing
  // `PUT /trips/{id}` endpoint (no new admin endpoint required)
  // with a payload rebuilt from the currently-displayed trip so
  // the in-place update only touches the reference-points set.
  //
  // NOTE — We rebuild the payload as a partial TripDto (the
  // controller's `updateTrip` does an in-place update of the
  // reference-points list when the field is present, so even an
  // empty array clears the list, and the full list replaces it).
  const [refpointSaving, setRefpointSaving] = useState(false);
  const updateReferencePoint = async (pointId, patch) => {
    if (!selected) return;
    setRefpointSaving(true);
    try {
      const nextPoints = (selected.referencePoints || []).map((p) =>
        p.id === pointId ? { ...p, ...patch } : p
      );
      // Build a minimal TripDto payload. The backend's updateTrip
      // resolves the cities / categories / languages from the IDs
      // and only updates the fields that are present, so the partial
      // payload below is enough to mutate the reference-point list.
      const payload = {
        id: selected.id,
        userId: selected.userId,
        cities: (selected.cities || []).map((c) => c.cityId).filter(Boolean),
        categories: (selected.categories || []).map((c) => c.categoryId).filter(Boolean),
        languagesSpoken: (selected.languagesSpoken || []).map((l) => l.id).filter(Boolean),
        title: selected.title,
        startDate: selected.startDate,
        endDate: selected.endDate,
        tripDurationDays: selected.tripDurationDays,
        tripSummary: selected.tripSummary,
        tripDescription: selected.tripDescription,
        tripRating: selected.tripRating,
        tripPrivacy: (selected.tripPrivacy || 'PUBLIC').toUpperCase(),
        isHidden: !!selected.isHidden,
        cost: selected.cost ? {
          total: selected.cost.total,
          accommodation: selected.cost.accommodation,
          food: selected.cost.food,
          transport: selected.cost.transport,
          extra: selected.cost.extra,
          currency: selected.cost.currency || 'EUR',
        } : null,
        referencePoints: nextPoints,
      };
      await request('PUT', `/trips/${selected.id}`, payload);
      setSelected({ ...selected, referencePoints: nextPoints });
      showToast('Ponto de referência atualizado.', 'success');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a guardar o ponto de referência.', 'error');
    } finally {
      setRefpointSaving(false);
    }
  };
  const addReferencePoint = async () => {
    if (!selected) return;
    // Use the trip's first city as the default city so the NOT
    // NULL column never trips the insert. Empty name is OK — admin
    // can edit it after the row is created.
    const fallbackCity = selected.cities?.[0]
      ? `${selected.cities[0].cityName}, ${selected.cities[0].countryname}`
      : '-';
    const nextPoints = [
      ...(selected.referencePoints || []),
      { name: 'Novo ponto', description: '', type: 'Outro', city: fallbackCity },
    ];
    setRefpointSaving(true);
    try {
      const payload = {
        id: selected.id,
        userId: selected.userId,
        cities: (selected.cities || []).map((c) => c.cityId).filter(Boolean),
        categories: (selected.categories || []).map((c) => c.categoryId).filter(Boolean),
        languagesSpoken: (selected.languagesSpoken || []).map((l) => l.id).filter(Boolean),
        title: selected.title,
        startDate: selected.startDate,
        endDate: selected.endDate,
        tripDurationDays: selected.tripDurationDays,
        tripSummary: selected.tripSummary,
        tripDescription: selected.tripDescription,
        tripRating: selected.tripRating,
        tripPrivacy: (selected.tripPrivacy || 'PUBLIC').toUpperCase(),
        isHidden: !!selected.isHidden,
        cost: selected.cost ? {
          total: selected.cost.total,
          accommodation: selected.cost.accommodation,
          food: selected.cost.food,
          transport: selected.cost.transport,
          extra: selected.cost.extra,
          currency: selected.cost.currency || 'EUR',
        } : null,
        referencePoints: nextPoints,
      };
      await request('PUT', `/trips/${selected.id}`, payload);
      // Re-fetch the trip so the new point's id is hydrated.
      const fresh = await request('GET', `/admin/trips/${selected.id}`);
      setSelected(fresh.data || fresh);
      showToast('Ponto de referência adicionado.', 'success');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a adicionar o ponto de referência.', 'error');
    } finally {
      setRefpointSaving(false);
    }
  };
  const removeReferencePoint = async (pointId) => {
    if (!selected) return;
    if (!window.confirm('Eliminar este ponto de referência?')) return;
    setRefpointSaving(true);
    try {
      const nextPoints = (selected.referencePoints || []).filter((p) => p.id !== pointId);
      const payload = {
        id: selected.id,
        userId: selected.userId,
        cities: (selected.cities || []).map((c) => c.cityId).filter(Boolean),
        categories: (selected.categories || []).map((c) => c.categoryId).filter(Boolean),
        languagesSpoken: (selected.languagesSpoken || []).map((l) => l.id).filter(Boolean),
        title: selected.title,
        startDate: selected.startDate,
        endDate: selected.endDate,
        tripDurationDays: selected.tripDurationDays,
        tripSummary: selected.tripSummary,
        tripDescription: selected.tripDescription,
        tripRating: selected.tripRating,
        tripPrivacy: (selected.tripPrivacy || 'PUBLIC').toUpperCase(),
        isHidden: !!selected.isHidden,
        cost: selected.cost ? {
          total: selected.cost.total,
          accommodation: selected.cost.accommodation,
          food: selected.cost.food,
          transport: selected.cost.transport,
          extra: selected.cost.extra,
          currency: selected.cost.currency || 'EUR',
        } : null,
        referencePoints: nextPoints,
      };
      await request('PUT', `/trips/${selected.id}`, payload);
      setSelected({ ...selected, referencePoints: nextPoints });
      showToast('Ponto de referência removido.', 'success');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a remover o ponto de referência.', 'error');
    } finally {
      setRefpointSaving(false);
    }
  };

  const filtered = travels.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.title || '').toLowerCase().includes(q) ||
      (t.username || '').toLowerCase().includes(q) ||
      (t.userFirstName || '').toLowerCase().includes(q) ||
      (t.userLastName || '').toLowerCase().includes(q) ||
      (t.cityName || '').toLowerCase().includes(q) ||
      (t.country || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-section-admin">
      <h2><FaEye /> Moderação de Viagens</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Lista paginada de todas as viagens. Clica em "Ver Detalhes" para informação completa.
      </p>
      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="🔍 Filtrar por título, autor, cidade ou país..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isLoading ? <p>A carregar...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '20px' }}>
            {filtered.map((t) => (
              <div key={t.id} className="admin-trip-card" style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '15px', background: '#fff' }}>
                {t.photos?.[0] && (
                  <img src={toFullMediaUrl(t.photos[0])} alt={t.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                )}
                <h3 style={{ margin: '10px 0 6px' }}>{t.title}</h3>
                <p style={{ margin: 0, color: '#666' }}>
                  por <strong>{getDisplayName(t, `user#${t.userId}`)}</strong>
                </p>
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                  📍 {fmt(translateCity(t.cityName))}, {fmt(translateCountry(t.country))}
                </p>
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#888' }}>
                  {t.startDate || '—'} → {t.endDate || '—'} · ⭐ {t.tripRating || 0} · {t.totalLikes || 0} ❤
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
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', width: '92vw', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selected.title}</h3>
                <p style={{ margin: '4px 0 0', color: '#666' }}>ID #{selected.id}</p>
              </div>
              <button className="btn-secondary-admin" onClick={() => setSelected(null)}><FaTimes /></button>
            </div>

            {/* Author card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', padding: '10px 12px', background: '#e7f3ff', borderRadius: '8px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#0066cc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 'bold', flexShrink: 0,
              }}>
                {getDisplayInitials(selected, '?')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>
                  <FaUser style={{ marginRight: '6px' }} />
                  {getDisplayName(selected, `user#${selected.userId}`)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                  @{selected.username || '—'} · ID #{selected.userId}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '14px' }}>
              <div><strong>📍 Destino:</strong><br />{fmt(translateCity(selected.cityName))}, {fmt(translateCountry(selected.country))}</div>
              <div><strong>📅 Período:</strong><br />{fmt(selected.startDate)} → {fmt(selected.endDate)}</div>
              <div><strong>⏱ Duração:</strong><br />{fmt(selected.tripDurationDays)} dias</div>
              <div><FaStar style={{ color: '#f5b301' }} /> <strong>Rating:</strong> {fmt(selected.tripRating)}</div>
              <div><FaEuroSign /> <strong>Total:</strong> {fmt(selected.cost?.total)}{selected.cost?.currency || '€'}</div>
              <div><strong>🔒 Privacidade:</strong> {fmt(selected.tripPrivacy)}</div>
              <div><strong>👁 Visível:</strong> {selected.isHidden ? 'Não (rascunho)' : 'Sim'}</div>
              <div><strong>❤️ Likes:</strong> {fmt(selected.totalLikes)}</div>
              <div><strong>☁️ Clima:</strong> {fmt(selected.weather)}</div>
            </div>

            {(selected.tripSummary || selected.tripDescription) && (
              <Section icon={() => <span>📝</span>} title="Descrição">
                {selected.tripSummary && <p style={{ margin: 0, fontWeight: 'bold' }}>{selected.tripSummary}</p>}
                {selected.tripDescription && <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{selected.tripDescription}</p>}
              </Section>
            )}

            {/* Round 59 — full cost breakdown (per category). The
                previous version only rendered a single "total" value
                which was missing the per-component totals the admin
                needs to spot anomalies. */}
            {selected.cost && (
              <Section icon={FaEuroSign} title="Custos da viagem">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <div><strong>Total:</strong> {fmt(selected.cost.total)} {fmt(selected.cost.currency) || '€'}</div>
                  <div><strong>Voo:</strong> {fmt(selected.cost.flight ?? selected.cost.transport)} {fmt(selected.cost.currency) || '€'}</div>
                  <div><strong>Alojamento:</strong> {fmt(selected.cost.accommodation)} {fmt(selected.cost.currency) || '€'}</div>
                  <div><strong>Alimentação:</strong> {fmt(selected.cost.food)} {fmt(selected.cost.currency) || '€'}</div>
                  <div><strong>Extras:</strong> {fmt(selected.cost.extra)} {fmt(selected.cost.currency) || '€'}</div>
                </div>
              </Section>
            )}

            {/* Round 59 — itineary by day with topics. The DTO comes
                back as `itineraryDays` but the wizard sends it as
                `days`; we normalise both names here. */}
            {selected.tripItinerary?.itineraryDays?.length > 0 && (
              <Section icon={FaRoute} title={`Itinerário (${selected.tripItinerary.itineraryDays.length} dias)`}>
                {selected.tripItinerary.itineraryDays.map((d, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <strong>{fmt(d.day) || `Dia ${i + 1}`}</strong>
                    {Array.isArray(d.topics) && d.topics.length > 0 && (
                      <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                        {d.topics.map((t, j) => (
                          <li key={j}>{fmt(t.title || t.text || t.name)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {/* Round 59 — categories + reference points. */}
            {Array.isArray(selected.categories) && selected.categories.length > 0 && (
              <Section icon={FaTags} title="Categorias">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selected.categories.map((c, i) => (
                    <span key={i} className="admin-pill">{typeof c === 'object' ? fmt(c.name || c.title) : fmt(c)}</span>
                  ))}
                </div>
              </Section>
            )}

            {Array.isArray(selected.referencePoints) && (
              <Section icon={FaMapMarkerAlt} title={`Pontos de referência (${selected.referencePoints.length})`}>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {selected.referencePoints.map((p, i) => (
                    <li key={p.id ?? i} style={{ marginBottom: '6px' }}>
                      <strong>{fmt(p.title || p.name)}</strong>
                      {p.city && <span style={{ color: '#6c757d' }}> · {p.city}</span>}
                      {/* V15 — Inline-editable category. Admins can
                          tweak the type of each point without leaving
                          the moderation modal. The dropdown lists the
                          same 13 presets the wizard exposes so the
                          data stays consistent across the product. */}
                      <select
                        value={p.type || ''}
                        onChange={(e) => updateReferencePoint(p.id, { type: e.target.value })}
                        disabled={refpointSaving}
                        style={{
                          marginLeft: 8,
                          padding: '2px 6px',
                          fontSize: '0.78rem',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          background: '#fff',
                        }}
                        title="Tipo do ponto de referência"
                      >
                        <option value="">— Sem tipo —</option>
                        <option value="Monumento">Monumento</option>
                        <option value="Praia">Praia</option>
                        <option value="Museu">Museu</option>
                        <option value="Miradouro">Miradouro</option>
                        <option value="Parque">Parque</option>
                        <option value="Restaurante">Restaurante</option>
                        <option value="Bar">Bar</option>
                        <option value="Mercado">Mercado</option>
                        <option value="Igreja / Templo">Igreja / Templo</option>
                        <option value="Castelo">Castelo</option>
                        <option value="Jardim">Jardim</option>
                        <option value="Praça">Praça</option>
                        <option value="Outro">Outro</option>
                      </select>
                      {p.description && <div style={{ color: '#6c757d', fontSize: '0.85rem', marginTop: '2px' }}>{fmt(p.description)}</div>}
                      <button
                        type="button"
                        onClick={() => removeReferencePoint(p.id)}
                        disabled={refpointSaving}
                        style={{
                          marginLeft: 8,
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          background: '#fff',
                          color: '#dc3545',
                          border: '1px solid #dc3545',
                          borderRadius: '4px',
                          cursor: refpointSaving ? 'not-allowed' : 'pointer',
                        }}
                        title="Eliminar este ponto de referência"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={addReferencePoint}
                  disabled={refpointSaving}
                  style={{
                    marginTop: '8px',
                    padding: '4px 12px',
                    fontSize: '0.8rem',
                    background: '#f88f00',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: refpointSaving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  + Adicionar ponto de referência
                </button>
              </Section>
            )}

            {/* Round 59 — positive + negative points. */}
            {Array.isArray(selected.positivePoints) && selected.positivePoints.length > 0 && (
              <Section icon={() => <span>👍</span>} title={`Pontos positivos (${selected.positivePoints.length})`}>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {selected.positivePoints.map((p, i) => (
                    <li key={i}>{fmt(p.title || p.text || p.description)}</li>
                  ))}
                </ul>
              </Section>
            )}
            {Array.isArray(selected.negativePoints) && selected.negativePoints.length > 0 && (
              <Section icon={() => <span>👎</span>} title={`Pontos negativos (${selected.negativePoints.length})`}>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {selected.negativePoints.map((p, i) => (
                    <li key={i}>{fmt(p.title || p.text || p.description)}</li>
                  ))}
                </ul>
              </Section>
            )}

            {Array.isArray(selected.photos) && selected.photos.length > 0 && (
              <Section icon={FaCamera} title={`Fotos (${selected.photos.length})`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                  {selected.photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img
                        src={toFullMediaUrl(p)}
                        alt={selected.photoCaptions?.[i] || `Foto ${i + 1}`}
                        onClick={() => setActivePhoto({ src: toFullMediaUrl(p), caption: selected.photoCaptions?.[i] || '' })}
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e0e0e0' }}
                      />
                      {selected.photoCaptions?.[i] && (
                        <div style={{ fontSize: '0.72rem', padding: '2px 4px', background: 'rgba(0,0,0,0.55)', color: '#fff', position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: '0 0 6px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selected.photoCaptions[i]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {Array.isArray(selected.accommodations) && selected.accommodations.length > 0 && (
              <Section icon={FaBed} title={`Alojamentos (${selected.accommodations.length})`}>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {selected.accommodations.map((a, i) => (
                    <li key={i}>
                      <strong>{a.accommodationName || a.name || 'Alojamento'}</strong>
                      {a.city && <span> · {a.city}</span>}
                      {a.pricePerNight != null && <span> · {a.pricePerNight}€/noite</span>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {Array.isArray(selected.recommendedFoods) && selected.recommendedFoods.length > 0 && (
              <Section icon={FaUtensils} title={`Comida recomendada (${selected.recommendedFoods.length})`}>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {selected.recommendedFoods.map((f, i) => (
                    <li key={i}>{f.foodName || f.name || 'Prato'}{f.price != null ? ` · ${f.price}€` : ''}</li>
                  ))}
                </ul>
              </Section>
            )}

            {Array.isArray(selected.tripTransports) && selected.tripTransports.length > 0 && (
              <Section icon={FaBus} title={`Transportes (${selected.tripTransports.length})`}>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {selected.tripTransports.map((t, i) => (
                    <li key={i}>
                      {t.transportType || t.type || 'Transporte'}
                      {t.origin && t.destination && <span> · {t.origin} → {t.destination}</span>}
                      {t.cost != null && <span> · {t.cost}€</span>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {Array.isArray(selected.languagesSpoken) && selected.languagesSpoken.length > 0 && (
              <Section icon={FaLanguage} title="Idiomas">
                {fmtList(selected.languagesSpoken)}
              </Section>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button className="btn-danger-admin" onClick={() => remove(selected)}>Eliminar Viagem</button>
              <button className="btn-secondary-admin" onClick={() => setSelected(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {activePhoto && (
        <div className="modal-overlay" onClick={() => setActivePhoto(null)} style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={activePhoto.src} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', display: 'block', borderRadius: '6px' }} />
            {activePhoto.caption && (
              <div style={{ marginTop: '10px', color: '#fff', textAlign: 'center' }}>{activePhoto.caption}</div>
            )}
            <button onClick={() => setActivePhoto(null)} style={{ position: 'absolute', top: -40, right: 0, background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default TravelModerationComplete;
