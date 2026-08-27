// src/components/admin/AdvancedNotifications.js
// Round 53 backoffice — Notification templates editor.
// Manages the in-memory catalogue of system notification templates
// (e.g. "Welcome message", "Trip published", "Comment reply") and
// previews them. Templates are stored locally in the backend (no
// schema change) under /admin/notifications/templates and surfaced
// to the broadcast + automatic-system-notification flows.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

// Built-in default templates. These are sent as the catalogue on first
// load if the backend has none persisted (so the page is never empty).
const DEFAULT_TEMPLATES = [
  { key: 'WELCOME',          name: 'Bem-vindo',                   icon: '👋', content: 'Bem-vindo ao Globe Memories! Explora o mundo connosco.' },
  { key: 'TRIP_PUBLISHED',   name: 'Viagem publicada',            icon: '✈️', content: 'A tua viagem "{tripTitle}" foi publicada com sucesso.' },
  { key: 'COMMENT_REPLY',    name: 'Resposta a comentário',       icon: '💬', content: '{actorName} respondeu ao teu comentário em "{tripTitle}".' },
  { key: 'TRIP_LIKED',       name: 'Like em viagem',              icon: '❤️', content: '{actorName} curtiu a tua viagem "{tripTitle}".' },
  { key: 'NEW_FOLLOWER',     name: 'Novo seguidor',               icon: '👤', content: '{actorName} começou a seguir-te.' },
  { key: 'FOLLOW_REQUEST',   name: 'Pedido de follow',            icon: '🔔', content: '{actorName} quer seguir-te. Aprova ou recusa o pedido.' },
  { key: 'MAINTENANCE',      name: 'Manutenção programada',       icon: '🛠️', content: 'Manutenção programada em {date}. Pedimos desculpa pelo incómodo.' },
  { key: 'TERMS_UPDATE',     name: 'Atualização de termos',       icon: '📜', content: 'Atualizámos os nossos termos. Lê em /legal/terms antes de {date}.' },
];

const AdvancedNotifications = () => {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/notifications/templates');
      const items = r.data && r.data.length > 0 ? r.data : DEFAULT_TEMPLATES;
      setTemplates(items);
    } catch (e) {
      setTemplates(DEFAULT_TEMPLATES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const persist = async (newList) => {
    setIsSaving(true);
    try {
      await request('PUT', '/admin/notifications/templates', { templates: newList });
      setTemplates(newList);
      showToast('Templates guardados.', 'success');
    } catch (e) {
      // Endpoint might not be wired in the static in-memory backend
      // (we still update local state so the user can keep editing).
      setTemplates(newList);
      showToast('Guardado localmente (sem persistência server-side).', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (tpl) => setEditing({ ...tpl });
  const startCreate = () => setEditing({ key: '', name: '', icon: '✉️', content: '' });

  const saveEdit = async () => {
    if (!editing.key || !editing.name || !editing.content) {
      showToast('Preenche key, nome e conteúdo.', 'error');
      return;
    }
    const exists = templates.some((t) => t.key === editing.key);
    const newList = exists
      ? templates.map((t) => (t.key === editing.key ? editing : t))
      : [...templates, editing];
    await persist(newList);
    setEditing(null);
  };

  const remove = async (key) => {
    if (!window.confirm(`Eliminar o template "${key}"?`)) return;
    const newList = templates.filter((t) => t.key !== key);
    await persist(newList);
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Repor os templates default? (substitui os atuais)')) return;
    await persist(DEFAULT_TEMPLATES);
  };

  return (
    <div className="admin-section-admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📨 Templates de Notificações</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary-admin" onClick={startCreate}>➕ Novo Template</button>
          <button className="btn-secondary-admin" onClick={resetToDefaults}>↺ Repor Defaults</button>
        </div>
      </div>

      <div style={{
        background: '#eef2ff',
        border: '1px solid #c7d2fe',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '0.85rem',
        color: '#3730a3',
      }}>
        ℹ️ Os templates definem mensagens reutilizáveis (boas-vindas, respostas, alertas).
        Variáveis como <code>{'{actorName}'}</code>, <code>{'{tripTitle}'}</code> e
        <code>{'{date}'}</code> são preenchidas em runtime pelo serviço.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
        {templates.map((tpl) => (
          <div key={tpl.key} style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.6rem' }}>{tpl.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{tpl.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>{tpl.key}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#374151', minHeight: 50, marginBottom: '10px' }}>
              {tpl.content}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => startEdit(tpl)} style={{ ...btn, background: '#3b82f6', flex: 1 }}>✏️ Editar</button>
              <button onClick={() => remove(tpl.key)} style={{ ...btn, background: '#ef4444' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: 540 }}>
            <h3 style={{ marginTop: 0 }}>{templates.some((t) => t.key === editing.key) ? 'Editar Template' : 'Novo Template'}</h3>
            <Field label="Key (identificador único, ex. WELCOME)">
              <input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value.toUpperCase() })} style={input} />
            </Field>
            <Field label="Nome exibido">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={input} />
            </Field>
            <Field label="Ícone (emoji)">
              <input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} style={input} maxLength={4} />
            </Field>
            <Field label="Conteúdo (use {actorName}, {tripTitle}, {date} como placeholders)">
              <textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} style={{ ...input, height: 100 }} />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setEditing(null)} style={{ ...btn, background: '#6b7280' }}>Cancelar</button>
              <button onClick={saveEdit} disabled={isSaving} style={{ ...btn, background: '#10b981' }}>
                {isSaving ? 'A guardar...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: '12px' }}>
    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{label}</label>
    {children}
  </div>
);

const input = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
};

const btn = {
  padding: '6px 12px',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

export default AdvancedNotifications;
