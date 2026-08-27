// src/components/admin/WelcomeModalManagement.js
import React, { useState, useEffect } from 'react';
import Toast from '../Toast';
import { FaTrash, FaHandsHelping, FaCheck, FaTimes } from 'react-icons/fa';
import '../../styles/Admin.css';

/**
 * Round 55 — admin toggle for the per-page welcome modals.
 *
 * The user-facing welcome modals (QandA / Users / Achievements) read
 * from localStorage to decide whether to render. This page lets the
 * admin disable all of them at once (the "Eliminar modal" action
 * Tiago asked for) by setting a "kill switch" key. When the kill
 * switch is on, each modal's `shouldShow()` returns false.
 */

const KILL_SWITCH_KEY = 'admin_welcome_modal_disabled';
const PAGES = [
  { key: 'qanda',        label: 'Q&A',        util: 'qandaModalUtils' },
  { key: 'users',        label: 'Utilizadores', util: 'usersModalUtils' },
  { key: 'achievements', label: 'Conquistas',   util: 'achievementsModalUtils' },
];

const WelcomeModalManagement = () => {
  const [disabledAll, setDisabledAll] = useState(false);
  const [perPage, setPerPage] = useState({ qanda: false, users: false, achievements: false });
  const [config, setConfig] = useState({
    title: 'Bem-vindo ao Globe Memories',
    body: 'Descubra, partilhe e guarde as suas memórias de viagem em todo o mundo.',
    ctaText: 'Começar',
  });
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const killAll = window.localStorage.getItem(KILL_SWITCH_KEY) === 'true';
    setDisabledAll(killAll);
    const per = { qanda: false, users: false, achievements: false };
    PAGES.forEach((p) => {
      per[p.key] = window.localStorage.getItem(`admin_welcome_modal_disabled_${p.key}`) === 'true';
    });
    setPerPage(per);

    try {
      const cfgRaw = window.localStorage.getItem('admin_welcome_modal');
      if (cfgRaw) setConfig(JSON.parse(cfgRaw));
    } catch (_) {}
  }, []);

  const applyToAll = (val) => {
    setDisabledAll(val);
    if (val) {
      window.localStorage.setItem(KILL_SWITCH_KEY, 'true');
      // Also clear the per-version "dismissed" keys so the toggle
      // is fully effective.
      ['welcome_modal_dismissed_version', 'qanda_modal_dismissed', 'users_modal_dismissed', 'achievements_modal_dismissed'].forEach((k) =>
        window.localStorage.removeItem(k)
      );
      showToast('Modal de boas-vindas desativado em todo o site.', 'success');
    } else {
      window.localStorage.removeItem(KILL_SWITCH_KEY);
      showToast('Modal de boas-vindas reativado. Os utilizadores que já tinham fechado vão continuar sem o ver até recarregarem.', 'info');
    }
  };

  const togglePage = (key) => {
    const next = !perPage[key];
    setPerPage({ ...perPage, [key]: next });
    if (next) {
      window.localStorage.setItem(`admin_welcome_modal_disabled_${key}`, 'true');
    } else {
      window.localStorage.removeItem(`admin_welcome_modal_disabled_${key}`);
    }
  };

  const resetAllDismissed = () => {
    ['welcome_modal_dismissed_version', 'qanda_modal_dismissed', 'users_modal_dismissed', 'achievements_modal_dismissed'].forEach((k) =>
      window.localStorage.removeItem(k)
    );
    showToast('Estado de "não mostrar de novo" limpo em todos os utilizadores (localStorage do browser atual).', 'success');
  };

  const saveConfig = () => {
    window.localStorage.setItem('admin_welcome_modal', JSON.stringify(config));
    showToast('Configuração guardada localmente. Para o servidor, persiste via endpoint admin (não implementado nesta ronda).', 'info');
  };

  return (
    <div className="admin-section-admin">
      <h2><FaHandsHelping /> Modal de Boas-Vindas</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Liga/desliga o modal de boas-vindas que aparece nas páginas QandA, Utilizadores e Conquistas.
      </p>

      <div style={{
        background: disabledAll ? '#fff5f5' : '#f0f9f0',
        border: `2px solid ${disabledAll ? '#dc3545' : '#28a745'}`,
        borderRadius: '12px',
        padding: '20px',
        marginTop: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0 }}>
              {disabledAll ? <><FaTimes style={{ color: '#dc3545' }} /> Modal desativado em todo o site</> : <><FaCheck style={{ color: '#28a745' }} /> Modal ativo</>}
            </h3>
            <p style={{ margin: '4px 0 0', color: '#666' }}>
              {disabledAll
                ? 'Os utilizadores NÃO vão ver o modal de boas-vindas em nenhuma página.'
                : 'O modal aparece para novos visitantes nas páginas configuradas abaixo.'}
            </p>
          </div>
          <button
            className={disabledAll ? 'btn-primary-admin' : 'btn-danger-admin'}
            onClick={() => applyToAll(!disabledAll)}
            style={{ padding: '10px 20px', fontSize: '1rem' }}
          >
            {disabledAll ? <><FaCheck /> Reativar modal</> : <><FaTrash /> Eliminar modal</>}
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: '32px' }}>Controlo por página</h3>
      <table className="admin-table-admin">
        <thead>
          <tr><th>Página</th><th>Estado</th><th>Ação</th></tr>
        </thead>
        <tbody>
          {PAGES.map((p) => (
            <tr key={p.key}>
              <td><strong>{p.label}</strong></td>
              <td>
                {perPage[p.key]
                  ? <span className="role-badge role-admin" style={{ background: '#dc3545' }}>Desativado</span>
                  : <span className="role-badge role-user">Ativo</span>}
              </td>
              <td>
                <button
                  className={perPage[p.key] ? 'btn-success-admin' : 'btn-warning-admin'}
                  onClick={() => togglePage(p.key)}
                >
                  {perPage[p.key] ? 'Reativar' : 'Desativar nesta página'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn-info-admin" onClick={resetAllDismissed}>
          🧹 Limpar estado "não mostrar de novo" (utilizadores atuais)
        </button>
      </div>

      <h3 style={{ marginTop: '32px' }}>Texto do modal</h3>
      <p style={{ color: '#666', fontSize: '0.85rem' }}>
        A configuração de texto (título, corpo, CTA) é guardada localmente; a ronda 55 ainda não a persiste no backend.
      </p>
      <div className="form-group-admin">
        <label>Título:</label>
        <input type="text" value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} />
        <label style={{ marginTop: '10px' }}>Mensagem:</label>
        <textarea
          rows={4}
          value={config.body}
          onChange={(e) => setConfig({ ...config, body: e.target.value })}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da' }}
        />
        <label style={{ marginTop: '10px' }}>Texto do botão:</label>
        <input type="text" value={config.ctaText} onChange={(e) => setConfig({ ...config, ctaText: e.target.value })} />
        <div style={{ marginTop: '16px' }}>
          <button className="btn-primary-admin" onClick={saveConfig}>Guardar Texto (local)</button>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default WelcomeModalManagement;
