// src/components/admin/BackupManagement.js
// Round 53 backoffice — Backup management page.
// Lists existing pg_dump backups, allows creating a new one,
// downloads as .sql, and deletes old ones.
// Backend: GET/POST/DELETE /admin/backup[/create|/{filename}]

import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { API_BASE_URL } from '../../utils/mediaUrl';
import '../../styles/Admin.css';

const BackupManagement = () => {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  const tokenKey = 'adminAuthToken';

  const getAuthToken = () => {
    try {
      const raw = localStorage.getItem(tokenKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') return parsed;
        if (parsed && parsed.token) return parsed.token;
      }
    } catch {}
    return localStorage.getItem(tokenKey) || '';
  };

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/backup');
      setBackups(r.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a listar backups.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const createBackup = async () => {
    setIsCreating(true);
    try {
      const r = await request('POST', '/admin/backup/create');
      const info = r.data;
      if (info.status === 'SUCCESS') {
        showToast('Backup criado com sucesso.', 'success');
        fetchBackups();
      } else {
        showToast(`Falhou: ${info.note || 'erro desconhecido'}`, 'error');
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a criar backup.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const downloadBackup = async (filename) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/backup/download/${encodeURIComponent(filename)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showToast('Erro a descarregar: ' + e.message, 'error');
    }
  };

  const deleteBackup = async (filename) => {
    if (!window.confirm(`Eliminar o backup ${filename}? Esta ação não pode ser desfeita.`)) return;
    try {
      await request('DELETE', `/admin/backup/${encodeURIComponent(filename)}`);
      showToast('Backup eliminado.', 'success');
      fetchBackups();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    }
  };

  const totalSize = backups.reduce((s, b) => s + (b.sizeBytes || 0), 0);

  return (
    <div className="admin-section-admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>💾 Gestão de Backups</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            {backups.length} backup(s) • {formatBytes(totalSize)} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary-admin" onClick={createBackup} disabled={isCreating}>
            {isCreating ? '⏳ A criar...' : '➕ Criar Backup Agora'}
          </button>
          <button className="btn-secondary-admin" onClick={fetchBackups} disabled={isLoading}>
            {isLoading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '0.9rem',
        color: '#92400e',
      }}>
        ℹ️ Os backups são dumps completos do PostgreSQL via <code>pg_dump</code> e ficam guardados em
        <code> ./backups/ </code> na diretoria do backend. Em produção, considere Supabase PITR
        ou snapshots automatizados.
      </div>

      {backups.length === 0 && !isLoading ? (
        <div style={{
          background: '#f9fafb',
          border: '1px dashed #d1d5db',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: '#6b7280',
        }}>
          <p style={{ fontSize: '1rem', margin: 0 }}>Nenhum backup encontrado.</p>
          <p style={{ fontSize: '0.85rem', margin: '8px 0 0 0' }}>Clica em "Criar Backup Agora" para gerar o primeiro.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={th}>Ficheiro</th>
                <th style={th}>Tamanho</th>
                <th style={th}>Criado</th>
                <th style={th}>Estado</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.filename} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.85rem' }}>{b.filename}</td>
                  <td style={td}>{formatBytes(b.sizeBytes)}</td>
                  <td style={td}>{b.createdAt ? new Date(b.createdAt).toLocaleString('pt-PT') : '—'}</td>
                  <td style={td}>
                    <span style={{
                      padding: '3px 10px',
                      background: b.status === 'SUCCESS' ? '#10b981' : '#ef4444',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {b.status}
                    </span>
                    {b.note && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>{b.note}</div>}
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => downloadBackup(b.filename)}
                              style={{ ...btn, background: '#3b82f6' }}>
                        ⬇️ Descarregar
                      </button>
                      <button onClick={() => deleteBackup(b.filename)}
                              style={{ ...btn, background: '#ef4444' }}>
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem' };
const td = { padding: '10px 12px', fontSize: '0.9rem' };
const btn = {
  padding: '5px 10px',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

export default BackupManagement;
