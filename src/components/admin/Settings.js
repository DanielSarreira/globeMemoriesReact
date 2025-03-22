// src/components/admin/Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Globe Memories',
    supportEmail: 'support@globememories.com',
    maxFileSize: 5, // MB
  });

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchSettings = async () => {
      // const { data } = await axios.get('/api/settings', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    // Placeholder para chamada à API
    // await axios.put('/api/settings', settings, {
    //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
    // });
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="admin-section-admin">
      <h2>Configurações</h2>
      <div className="form-group-admin">
        <label>Nome do Site:</label>
        <input
          type="text"
          value={settings.siteName}
          onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
        />
      </div>
      <div className="form-group-admin">
        <label>Email de Suporte:</label>
        <input
          type="email"
          value={settings.supportEmail}
          onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
        />
      </div>
      <div className="form-group-admin">
        <label>Tamanho Máximo de Arquivo (MB):</label>
        <input
          type="number"
          value={settings.maxFileSize}
          onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
        />
      </div>
      <button className="btn-primary-admin" onClick={handleSave}>Salvar Configurações</button>
    </div>
  );
};

export default Settings;