// src/components/admin/Settings.js
import React, { useState, useEffect } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Globe Memories',
    contactEmail: 'contact@globememories.com',
    maxPhotosPerTrip: 20,
    maxVideosPerTrip: 3,
    maintenanceMode: false,
    allowRegistration: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  useEffect(() => {
    const stored = window.localStorage.getItem('admin_settings');
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch (_) {}
    }
  }, []);

  const save = async () => {
    setIsLoading(true);
    try {
      await request('PUT', '/admin/settings', settings);
      showToast('Configurações guardadas.', 'success');
    } catch (e) {
      window.localStorage.setItem('admin_settings', JSON.stringify(settings));
      showToast('Configurações guardadas localmente (backend ainda não tem endpoint específico).', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>Configurações da Plataforma</h2>
      <div className="form-group-admin">
        <label>Nome do site:</label>
        <input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
        <label style={{ marginTop: '10px' }}>Email de contacto:</label>
        <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
        <label style={{ marginTop: '10px' }}>Máx. fotos por viagem:</label>
        <input type="number" min="1" max="100" value={settings.maxPhotosPerTrip} onChange={(e) => setSettings({ ...settings, maxPhotosPerTrip: parseInt(e.target.value, 10) })} />
        <label style={{ marginTop: '10px' }}>Máx. vídeos por viagem:</label>
        <input type="number" min="0" max="10" value={settings.maxVideosPerTrip} onChange={(e) => setSettings({ ...settings, maxVideosPerTrip: parseInt(e.target.value, 10) })} />
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
          <input type="checkbox" checked={settings.allowRegistration} onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })} />
          Permitir novos registos
        </label>
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
          <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} />
          Modo manutenção
        </label>
        <div style={{ marginTop: '16px' }}>
          <button className="btn-primary-admin" onClick={save} disabled={isLoading}>Guardar</button>
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default Settings;
