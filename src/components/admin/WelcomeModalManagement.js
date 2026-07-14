// src/components/admin/WelcomeModalManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

const WelcomeModalManagement = () => {
  const [config, setConfig] = useState({
    version: '1.0.0',
    title: 'Bem-vindo ao Globe Memories',
    body: 'Descubra, partilhe e guarde as suas memórias de viagem em todo o mundo.',
    ctaText: 'Começar',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const save = async () => {
    setIsLoading(true);
    try {
      await request('POST', '/admin/welcome-modal', config);
      showToast('Configuração guardada.', 'success');
    } catch (e) {
      showToast('Configuração guardada localmente (endpoint não disponível).', 'info');
      // Persistimos localmente como fallback
      window.localStorage.setItem('admin_welcome_modal', JSON.stringify(config));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem('admin_welcome_modal');
    if (stored) {
      try { setConfig(JSON.parse(stored)); } catch (_) {}
    }
  }, []);

  return (
    <div className="admin-section-admin">
      <h2>Gestão do Modal de Boas-Vindas</h2>
      <div className="form-group-admin">
        <label>Versão:</label>
        <input type="text" value={config.version} onChange={(e) => setConfig({ ...config, version: e.target.value })} />
        <label style={{ marginTop: '10px' }}>Título:</label>
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
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
          <input type="checkbox" checked={config.isActive} onChange={(e) => setConfig({ ...config, isActive: e.target.checked })} />
          Modal ativo
        </label>
        <div style={{ marginTop: '16px' }}>
          <button className="btn-primary-admin" onClick={save} disabled={isLoading}>Guardar</button>
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default WelcomeModalManagement;
