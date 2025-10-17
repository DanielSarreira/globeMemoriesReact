// src/components/admin/BackupManagement.js
import React, { useState, useEffect } from 'react';
import { FaDatabase, FaDownload, FaUpload, FaTrash, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Toast from '../Toast';
import '../../styles/Admin.css';

const BackupManagement = () => {
  const [backups, setBackups] = useState([
    { 
      id: '1', 
      name: 'backup_2025_10_14_03_00.sql', 
      date: '2025-10-14 03:00:00', 
      size: '145 MB', 
      type: 'automatic',
      status: 'completed' 
    },
    { 
      id: '2', 
      name: 'backup_2025_10_13_03_00.sql', 
      date: '2025-10-13 03:00:00', 
      size: '142 MB', 
      type: 'automatic',
      status: 'completed' 
    },
    { 
      id: '3', 
      name: 'backup_manual_2025_10_12.sql', 
      date: '2025-10-12 15:30:00', 
      size: '140 MB', 
      type: 'manual',
      status: 'completed' 
    },
  ]);
  
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [settings, setSettings] = useState({
    autoBackup: true,
    frequency: 'daily',
    retentionDays: 30,
    maxBackups: 10
  });

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleCreateBackup = async () => {
    if (isCreatingBackup) return;

    if (!window.confirm('Criar um backup manual da base de dados?')) return;

    setIsCreatingBackup(true);
    try {
      // Simulação de criação de backup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newBackup = {
        id: Date.now().toString(),
        name: `backup_manual_${new Date().toISOString().split('T')[0]}.sql`,
        date: new Date().toLocaleString('pt-PT'),
        size: `${Math.floor(Math.random() * 50) + 130} MB`,
        type: 'manual',
        status: 'completed'
      };
      
      setBackups([newBackup, ...backups]);
      showToast('✓ Backup criado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      showToast('✗ Erro ao criar backup. Tente novamente.', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      showToast(`⬇ A transferir ${backup.name}...`, 'info');
      // Simulação de download
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast(`✓ ${backup.name} transferido com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao transferir backup:', error);
      showToast('✗ Erro ao transferir backup.', 'error');
    }
  };

  const handleDeleteBackup = async (id) => {
    const backup = backups.find(b => b.id === id);
    if (!backup) return;

    if (!window.confirm(`Eliminar o backup "${backup.name}"?\n\nEsta ação é irreversível.`)) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setBackups(backups.filter(b => b.id !== id));
      showToast(`✓ Backup "${backup.name}" eliminado.`, 'success');
    } catch (error) {
      console.error('Erro ao eliminar backup:', error);
      showToast('✗ Erro ao eliminar backup.', 'error');
    }
  };

  const handleRestoreBackup = async (backup) => {
    const confirmMessage = `⚠️ ATENÇÃO: Restaurar backup substituirá todos os dados atuais!\n\nDeseja restaurar o backup "${backup.name}"?`;
    
    if (!window.confirm(confirmMessage)) return;

    const finalConfirm = window.prompt('Para confirmar, digite "RESTAURAR" (em maiúsculas):');
    if (finalConfirm !== 'RESTAURAR') {
      showToast('Restauro cancelado. Texto de confirmação incorreto.', 'info');
      return;
    }

    try {
      showToast(`🔄 A restaurar backup ${backup.name}...`, 'info');
      await new Promise(resolve => setTimeout(resolve, 3000));
      showToast(`✓ Backup ${backup.name} restaurado com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      showToast('✗ Erro ao restaurar backup.', 'error');
    }
  };

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('✓ Configurações de backup guardadas!', 'success');
    } catch (error) {
      console.error('Erro ao guardar configurações:', error);
      showToast('✗ Erro ao guardar configurações.', 'error');
    }
  };

  return (
    <div>
      <div className="admin-section-admin">
        <h2>
          <FaDatabase style={{ marginRight: '10px', color: '#0066cc' }} />
          Gestão de Backups
        </h2>

        {/* Estatísticas */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '30px',
          marginTop: '20px'
        }}>
          <div className="stat-card-admin">
            <FaDatabase style={{ fontSize: '2rem', color: '#0066cc', marginBottom: '10px' }} />
            <h3>Total de Backups</h3>
            <p>{backups.length}</p>
          </div>
          <div className="stat-card-admin">
            <FaClock style={{ fontSize: '2rem', color: '#28a745', marginBottom: '10px' }} />
            <h3>Último Backup</h3>
            <p style={{ fontSize: '1.2rem' }}>{backups[0]?.date.split(' ')[1]}</p>
          </div>
          <div className="stat-card-admin">
            <FaCheckCircle style={{ fontSize: '2rem', color: '#ff9900', marginBottom: '10px' }} />
            <h3>Espaço Utilizado</h3>
            <p style={{ fontSize: '1.5rem' }}>
              {backups.reduce((acc, b) => acc + parseInt(b.size), 0)} MB
            </p>
          </div>
        </div>

        {/* Botão de criar backup */}
        <div style={{ marginBottom: '25px' }}>
          <button 
            className="btn-primary-admin"
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            style={{
              opacity: isCreatingBackup ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '1rem',
              padding: '14px 24px'
            }}
          >
            <FaDatabase />
            {isCreatingBackup ? 'A criar backup...' : 'Criar Backup Manual'}
          </button>
        </div>

        {/* Lista de backups */}
        <table className="admin-table-admin">
          <thead>
            <tr>
              <th>Nome do Ficheiro</th>
              <th>Data/Hora</th>
              <th>Tamanho</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {backups.map(backup => (
              <tr key={backup.id}>
                <td>{backup.name}</td>
                <td>{backup.date}</td>
                <td>{backup.size}</td>
                <td>
                  <span className={`admin-badge ${backup.type === 'automatic' ? 'admin-badge-info' : 'admin-badge-warning'}`}>
                    {backup.type === 'automatic' ? 'Automático' : 'Manual'}
                  </span>
                </td>
                <td>
                  <span className="admin-badge admin-badge-success">
                    <FaCheckCircle style={{ marginRight: '5px' }} />
                    Concluído
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-success-admin"
                    onClick={() => handleDownloadBackup(backup)}
                    title="Transferir"
                  >
                    <FaDownload />
                  </button>
                  <button 
                    className="btn-warning-admin"
                    onClick={() => handleRestoreBackup(backup)}
                    title="Restaurar"
                  >
                    <FaUpload />
                  </button>
                  <button 
                    className="btn-danger-admin"
                    onClick={() => handleDeleteBackup(backup.id)}
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Configurações de Backup */}
      <div className="admin-section-admin" style={{ marginTop: '30px' }}>
        <h2>
          <FaClock style={{ marginRight: '10px', color: '#ff9900' }} />
          Configurações de Backup Automático
        </h2>

        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          <div className="form-group-admin">
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => handleSettingsChange('autoBackup', e.target.checked)}
                style={{ marginRight: '10px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Activar Backup Automático</span>
            </label>
          </div>

          <div className="form-group-admin">
            <label>Frequência de Backup:</label>
            <select
              value={settings.frequency}
              onChange={(e) => handleSettingsChange('frequency', e.target.value)}
              disabled={!settings.autoBackup}
            >
              <option value="hourly">Hora a hora</option>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
            </select>
          </div>

          <div className="form-group-admin">
            <label>Dias de Retenção (manter backups por):</label>
            <input
              type="number"
              min="1"
              max="365"
              value={settings.retentionDays}
              onChange={(e) => handleSettingsChange('retentionDays', parseInt(e.target.value))}
              disabled={!settings.autoBackup}
            />
          </div>

          <div className="form-group-admin">
            <label>Número Máximo de Backups:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.maxBackups}
              onChange={(e) => handleSettingsChange('maxBackups', parseInt(e.target.value))}
              disabled={!settings.autoBackup}
            />
          </div>

          <button 
            className="btn-primary-admin"
            onClick={handleSaveSettings}
            style={{ width: 'fit-content' }}
          >
            Guardar Configurações
          </button>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default BackupManagement;
