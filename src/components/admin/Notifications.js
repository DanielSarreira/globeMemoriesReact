// src/components/admin/Notifications.js
// Round 53 backoffice — Broadcast notifications page.
// Lists the most recent system-wide notifications, and lets the admin
// compose a message that is delivered to either:
//   - a single user (Round 59 — POST /admin/notifications/send
//     with a target user ID), or
//   - every user (Round 53 — POST /admin/notifications/broadcast).
// Backend: GET  /admin/notifications/recent
//          POST /admin/notifications/send       (single recipient)
//          POST /admin/notifications/broadcast  (everyone)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

const Notifications = () => {
  const [recent, setRecent] = useState([]);
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('all'); // 'all' | 'one'
  const [recipientUsername, setRecipientUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/notifications/recent');
      setRecent(r.data?.content || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a listar notificações.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const send = async () => {
    const trimmed = content.trim();
    if (!trimmed) { showToast('A mensagem não pode estar vazia.', 'error'); return; }
    if (trimmed.length > 500) { showToast('Máximo 500 caracteres.', 'error'); return; }

    if (mode === 'one') {
      const username = recipientUsername.trim();
      if (!username) {
        showToast('Indica o nome de utilizador do destinatário.', 'error');
        return;
      }
      if (!window.confirm(`Enviar esta notificação ao utilizador @${username}?\n\n"${trimmed}"`)) return;
      setIsSending(true);
      try {
        await request('POST', '/admin/notifications/send', { recipientUsername: username, content: trimmed });
        showToast(`Notificação enviada a @${username}.`, 'success');
        setContent('');
        setRecipientUsername('');
        fetch();
      } catch (e) {
        showToast(e?.response?.data?.message || 'Erro a enviar.', 'error');
      } finally {
        setIsSending(false);
      }
    } else {
      if (!window.confirm(`Enviar esta notificação a TODOS os utilizadores?\n\n"${trimmed}"`)) return;
      setIsSending(true);
      try {
        const r = await request('POST', '/admin/notifications/broadcast', { content: trimmed });
        const info = r.data;
        showToast(`Enviado: ${info.sent}/${info.totalUsers}`, 'success');
        setContent('');
        fetch();
      } catch (e) {
        showToast(e?.response?.data?.message || 'Erro a enviar.', 'error');
      } finally {
        setIsSending(false);
      }
    }
  };

  const counter = useMemo(() => `${content.trim().length} / 500`, [content]);

  return (
    <div className="admin-section-admin">
      <h2>📨 Notificações Globais (Broadcast)</h2>

      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        {/* Round 59 — mode picker: broadcast (everyone) vs. targeted
            (one specific user ID). */}
        <div style={{ display: 'flex', gap: '18px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>Destinatário:</span>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="notif-mode"
              value="all"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
            />
            <span>Todos os utilizadores</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="notif-mode"
              value="one"
              checked={mode === 'one'}
              onChange={() => setMode('one')}
            />
            <span>Apenas um utilizador específico</span>
          </label>
        </div>

        {mode === 'one' && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
              Nome de utilizador do destinatário
            </label>
            <input
              type="text"
              value={recipientUsername}
              onChange={(e) => setRecipientUsername(e.target.value)}
              placeholder="Ex: oscar"
              style={{
                width: '240px',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
              }}
            />
            <span style={{ marginLeft: '10px', color: '#6b7280', fontSize: '0.82rem' }}>
              Escreve exatamente o username (sem o <code>@</code>).
            </span>
          </div>
        )}

        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          {mode === 'all' ? 'Mensagem para enviar a todos os utilizadores' : 'Mensagem para enviar ao utilizador selecionado'}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder={mode === 'all'
            ? 'Ex: Manutenção programada amanhã às 22h. Pedimos desculpa pelo incómodo.'
            : 'Ex: Olá! Reparámos que ainda não confirmaste o teu e-mail. Clica aqui para validar.'}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{counter}</span>
          <button
            className="btn-primary-admin"
            onClick={send}
            disabled={isSending || !content.trim() || (mode === 'one' && !recipientUsername.trim())}
            style={{ minWidth: 160 }}
          >
            {isSending
              ? '⏳ A enviar...'
              : mode === 'all'
                ? '📨 Enviar a Todos'
                : '📨 Enviar ao Utilizador'}
          </button>
        </div>
      </div>

      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '0.85rem',
        color: '#92400e',
      }}>
        ℹ️ Cada notificação é persistida na tabela <code>notification</code> com o tipo
        <code>SYSTEM</code>. Aparece no sino de notificações de cada utilizador.
        Não envia email (SMTP está desativado por agora).
      </div>

      <h3 style={{ marginTop: '24px' }}>🕒 Últimas 100 notificações do sistema</h3>
      {isLoading && <p>A carregar...</p>}
      {!isLoading && recent.length === 0 && (
        <div style={{ background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          Sem notificações no sistema.
        </div>
      )}
      {recent.length > 0 && (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={th}>#</th>
                <th style={th}>Tipo</th>
                <th style={th}>Conteúdo</th>
                <th style={th}>Recipient</th>
                <th style={th}>Lida</th>
                <th style={th}>Quando</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((n) => (
                <tr key={n.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ ...td, color: '#9ca3af' }}>#{n.id}</td>
                  <td style={td}>
                    <span style={{
                      padding: '2px 8px',
                      background: n.type === 'ADMIN_ANNOUNCEMENT' ? '#f59e0b' : n.type === 'SYSTEM' ? '#3b82f6' : '#9ca3af',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                    }}>
                      {n.type}
                    </span>
                  </td>
                  <td style={{ ...td, maxWidth: 400 }}>{n.content || '—'}</td>
                  <td style={{ ...td, fontSize: '0.85rem' }}>
                    {n.recipientUsername || `user#${n.recipientId}`}
                  </td>
                  <td style={td}>
                    {n.isRead ? <span style={{ color: '#10b981' }}>✓</span> : <span style={{ color: '#ef4444' }}>○</span>}
                  </td>
                  <td style={{ ...td, fontSize: '0.85rem' }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString('pt-PT') : '—'}
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

export default Notifications;
