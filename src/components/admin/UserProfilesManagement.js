// src/components/admin/UserProfilesManagement.js
// Round 53 backoffice — User profile overview.
// Focuses on profile-level details (bio, city, languages, privacy,
// photo, social counts) rather than account security. Useful for
// content moderation and verifying the public-facing info matches
// what the user filled in.
// Backend: GET /admin/users (paginated, includes profile fields)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { getDisplayName } from '../../utils/userDisplay';
import { toFullMediaUrl } from '../../utils/mediaUrl';
import '../../styles/Admin.css';

// Round 77 (Bug 2): helper that snapshots the editable subset of a
// user record into the form state. Kept outside the component so
// it's a stable reference and can also be used to "Repor" (reset)
// the form to the current backend values.
const buildEditFormFromUser = (u) => ({
  gender: u?.gender || '',
  birthDate: u?.birthDate || '',
  nationality: u?.nationality || '',
  city: u?.city || '',
  languagesSpoken: u?.languagesSpoken || '',
  userBio: u?.userBio || '',
});

const UserProfilesManagement = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  // Round 77 (Bug 2): the admin can now edit gender / birthDate /
  // city / nationality / bio / languagesSpoken from the detail
  // modal. `editForm` holds the in-progress edits, `editSaving`
  // disables the save button while the PUT is in flight. The form
  // is re-initialised every time the admin opens a different user.
  const [editForm, setEditForm] = useState(() => buildEditFormFromUser(null));
  const [editSaving, setEditSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  // Round 77 (Bug 2): save the admin's profile edits to the
  // backend. We only send the editable subset — the read-only
  // fields (id, role, privateProfile, etc.) are preserved by the
  // backend unchanged. birthDate is sent as "" (not null) when the
  // admin clears the field; the UserDto's @JsonFormat accepts both
  // and the entity stores null when the value is empty. Re-fetch
  // the user list afterwards so the table shows the updated city /
  // nationality without a manual refresh.
  const handleSaveEdit = async () => {
    if (!selected) return;
    setEditSaving(true);
    try {
      await request('PUT', `/admin/users/${selected.id}/profile`, {
        gender: editForm.gender,
        birthDate: editForm.birthDate || null,
        nationality: editForm.nationality,
        city: editForm.city,
        languagesSpoken: editForm.languagesSpoken,
        userBio: editForm.userBio,
      });
      showToast('Perfil atualizado pelo admin.', 'success');
      // Refetch the table so the cached `users` array reflects the
      // new values. The modal stays open with the in-memory copy
      // updated so the admin sees their change immediately.
      const updated = await request('GET', `/admin/users/${selected.id}`);
      const freshUser = updated?.data || null;
      if (freshUser) {
        setSelected(freshUser);
        setEditForm(buildEditFormFromUser(freshUser));
        setUsers((prev) => prev.map((u) => (u.id === freshUser.id ? freshUser : u)));
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erro ao guardar perfil.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/users', {
        params: { page, size: 50, search: search.trim() || undefined },
      });
      setUsers(r.data?.content || []);
      setTotalPages(r.data?.totalPages || 0);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar perfis.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const flagStats = useMemo(() => {
    let privateCount = 0, noPhoto = 0, noBio = 0, noCity = 0, total = users.length;
    for (const u of users) {
      if (u.privateProfile) privateCount++;
      if (!u.profilePhoto) noPhoto++;
      if (!u.userBio) noBio++;
      if (!u.city) noCity++;
    }
    return { privateCount, noPhoto, noBio, noCity, total };
  }, [users]);

  return (
    <div className="admin-section-admin">
      <h2>👤 Gestão de Perfis de Utilizador</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <Stat label="Total de perfis" value={flagStats.total} sub="nesta página" />
        <Stat label="🔒 Privados" value={flagStats.privateCount} sub="privateProfile=true" />
        <Stat label="📷 Sem foto" value={flagStats.noPhoto} sub="perfil sem avatar" />
        <Stat label="📝 Sem bio" value={flagStats.noBio} sub="bio por preencher" />
        <Stat label="📍 Sem cidade" value={flagStats.noCity} sub="city por preencher" />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Perfis ({users.length})</h3>
          <input
            type="text"
            placeholder="🔍 Procurar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem', minWidth: 200 }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={th}>Foto</th>
                <th style={th}>Nome</th>
                <th style={th}>Username</th>
                <th style={th}>Email</th>
                <th style={th}>Cidade</th>
                <th style={th}>Bio</th>
                <th style={th}>Idioma</th>
                <th style={th}>Privacidade</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={td}>
                    {u.profilePhoto ? (
                      <img src={toFullMediaUrl(`download/${u.profilePhoto}`)} alt={u.username}
                           style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                           onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
                        {u.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    <strong>{getDisplayName(u, u.username)}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ID: {u.id}</div>
                  </td>
                  <td style={td}>@{u.username}</td>
                  <td style={{ ...td, fontSize: '0.85rem' }}>{u.email}</td>
                  <td style={td}>{u.city || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                  <td style={{ ...td, fontSize: '0.85rem', maxWidth: 240 }}>
                    {u.userBio
                      ? <span title={u.userBio}>{u.userBio.length > 60 ? u.userBio.slice(0, 60) + '…' : u.userBio}</span>
                      : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={td}>{u.languagesSpoken || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                  <td style={td}>
                    {u.privateProfile ? (
                      <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '12px', fontSize: '0.75rem' }}>🔒 Privado</span>
                    ) : (
                      <span style={{ padding: '2px 8px', background: '#d1fae5', color: '#065f46', borderRadius: '12px', fontSize: '0.75rem' }}>🌍 Público</span>
                    )}
                  </td>
                  <td style={td}>
                    <button onClick={() => { setSelected(u); setEditForm(buildEditFormFromUser(u)); }} style={{ padding: '4px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      🔍 Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={pageBtn}>‹ Anterior</button>
            <span style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Página {page + 1} de {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={pageBtn}>Próxima ›</button>
          </div>
        )}
      </div>

      {selected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }} onClick={() => { setSelected(null); setEditForm(buildEditFormFromUser(null)); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Perfil de {selected.username}</h3>
              <button onClick={() => { setSelected(null); setEditForm(buildEditFormFromUser(null)); }} style={{ padding: '4px 10px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Fechar</button>
            </div>
            <ProfileField label="ID" value={selected.id} />
            <ProfileField label="Username" value={`@${selected.username}`} />
            <ProfileField label="Nome" value={getDisplayName(selected, selected.username)} />
            <ProfileField label="Email" value={selected.email} />
            <ProfileField label="Role" value={selected.role || 'USER'} />
            <ProfileField label="Email verificado" value={selected.emailVerified ? '✓ Sim' : '✗ Não'} />
            <ProfileField label="Perfil privado" value={selected.privateProfile ? '🔒 Sim' : '🌍 Não'} />
            <ProfileField label="Foto de perfil" value={selected.profilePhoto || '—'} />
            <ProfileField label="Foto de capa" value={selected.coverPhoto || '—'} />
            <ProfileField label="Notificações de novos viajantes" value={selected.notifNewTravels ? '✓' : '✗'} />
            <ProfileField label="Notificações de comentários" value={selected.notifComments ? '✓' : '✗'} />
            <ProfileField label="Notificações de seguidores" value={selected.notifFollowers ? '✓' : '✗'} />
            <ProfileField label="Notificações de promoções" value={selected.notifPromotions ? '✓' : '✗'} />
            <ProfileField label="Estatísticas públicas" value={selected.showStatistics} />
            <ProfileField label="Estatísticas monetárias" value={selected.showMonetaryStatistics} />

            {/* Round 77 (Bug 2): editable profile fields. The admin can
                now fix gender / birthDate / city / nationality / bio /
                languages for any user — the backoffice used to be
                read-only which meant stale data (typos, missing DOB,
                wrong city) could only be fixed by asking the user to
                log in. Saves go to PUT /admin/users/{id}/profile which
                reuses the same UserService.updateUserProfile the
                self-service EditProfile page uses. */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Editar perfil (admin)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>Género</label>
                  <select
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                  >
                    <option value="">— não definido —</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>Data de nascimento</label>
                  <input
                    type="date"
                    value={editForm.birthDate || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, birthDate: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>Nacionalidade</label>
                  <input
                    type="text"
                    value={editForm.nationality || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, nationality: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>Cidade</label>
                  <input
                    type="text"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>Idiomas falados (separar por vírgula)</label>
                  <input
                    type="text"
                    value={editForm.languagesSpoken || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, languagesSpoken: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>Bio</label>
                  <textarea
                    value={editForm.userBio || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, userBio: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  disabled={editSaving}
                  onClick={handleSaveEdit}
                  style={{ padding: '8px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: editSaving ? 'wait' : 'pointer', fontSize: '0.9rem' }}
                >
                  {editSaving ? 'A guardar…' : 'Guardar alterações'}
                </button>
                <button
                  type="button"
                  disabled={editSaving}
                  onClick={() => setEditForm(buildEditFormFromUser(selected))}
                  style={{ padding: '8px 18px', background: '#e5e7eb', color: '#1f2937', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Repor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

const Stat = ({ label, value, sub }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{label}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{sub}</div>}
  </div>
);

const ProfileField = ({ label, value, multiline }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
    <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: '0.9rem', wordBreak: 'break-word', whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value}</div>
  </div>
);

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' };
const td = { padding: '10px 12px', fontSize: '0.9rem', verticalAlign: 'middle' };
const pageBtn = { padding: '6px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' };

export default UserProfilesManagement;
