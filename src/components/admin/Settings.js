// src/components/admin/Settings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaExclamationCircle, FaSave, FaUndo, FaCog } from 'react-icons/fa';
import Toast from '../Toast';
import '../../styles/Admin.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Globe Memories',
    supportEmail: 'support@globememories.com',
    maxFileSize: 5, // MB
    maintenanceMode: false,
    allowRegistrations: true,
    maxUsersPerDay: 100,
    sessionTimeout: 60, // minutes
    backupFrequency: 'daily',
    enableNotifications: true
  });
  
  const [originalSettings, setOriginalSettings] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchSettings = async () => {
      try {
        // const { data } = await axios.get('/api/settings', {
        //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        // });
        // setSettings(data);
        // setOriginalSettings({ ...data });
        setOriginalSettings({ ...settings });
      } catch (error) {
        showToast('Erro ao carregar configurações', 'error');
      }
    };
    fetchSettings();
  }, []);

  // Verificar se há alterações
  useEffect(() => {
    const hasChangesNow = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChangesNow);
  }, [settings, originalSettings]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const validateSiteName = (name) => {
    if (!name.trim()) return 'Nome do site é obrigatório';
    if (name.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
    if (name.trim().length > 100) return 'Nome não pode exceder 100 caracteres';
    return '';
  };

  const validateSupportEmail = (email) => {
    if (!email.trim()) return 'Email de suporte é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Formato de email inválido';
    return '';
  };

  const validateMaxFileSize = (size) => {
    if (!size || size < 1) return 'Tamanho mínimo é 1 MB';
    if (size > 100) return 'Tamanho máximo é 100 MB';
    return '';
  };

  const validateMaxUsersPerDay = (users) => {
    if (!users || users < 1) return 'Mínimo de 1 utilizador por dia';
    if (users > 10000) return 'Máximo de 10.000 utilizadores por dia';
    return '';
  };

  const validateSessionTimeout = (timeout) => {
    if (!timeout || timeout < 5) return 'Mínimo de 5 minutos';
    if (timeout > 1440) return 'Máximo de 1440 minutos (24 horas)';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'siteName':
        return validateSiteName(value);
      case 'supportEmail':
        return validateSupportEmail(value);
      case 'maxFileSize':
        return validateMaxFileSize(value);
      case 'maxUsersPerDay':
        return validateMaxUsersPerDay(value);
      case 'sessionTimeout':
        return validateSessionTimeout(value);
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const newErrors = {};
    const fieldsToValidate = ['siteName', 'supportEmail', 'maxFileSize', 'maxUsersPerDay', 'sessionTimeout'];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, settings[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));

    // Validação em tempo real
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    if (!hasChanges) {
      showToast('Não há alterações para guardar', 'info');
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados para envio
      const settingsToSave = {
        ...settings,
        siteName: settings.siteName.trim(),
        supportEmail: settings.supportEmail.trim()
      };

      // Placeholder para chamada à API
      // await axios.put('/api/settings', settingsToSave, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setOriginalSettings({ ...settingsToSave });
      showToast('Configurações guardadas com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao guardar configurações:', error);
      showToast('Erro ao guardar configurações. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...originalSettings });
    setErrors({});
    showToast('Configurações restauradas', 'info');
  };

  return (
    <div className="admin-section-admin">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <FaCog style={{ marginRight: '10px', fontSize: '24px', color: '#4a90e2' }} />
        <h2 style={{ margin: 0 }}>Configurações do Sistema</h2>
      </div>

      {hasChanges && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          ⚠️ Existem alterações não guardadas
        </div>
      )}

      <div style={{ display: 'grid', gap: '25px' }}>
        {/* Configurações Gerais */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ marginTop: 0, color: '#495057' }}>Configurações Gerais</h3>
          
          <div className="form-group-admin">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nome do Site: <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              className={errors.siteName ? 'input-error' : ''}
              disabled={isSubmitting}
              maxLength={100}
              placeholder="Nome da aplicação"
            />
            {errors.siteName && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.siteName}
              </div>
            )}
          </div>

          <div className="form-group-admin">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email de Suporte: <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleChange('supportEmail', e.target.value)}
              className={errors.supportEmail ? 'input-error' : ''}
              disabled={isSubmitting}
              placeholder="support@globememories.com"
            />
            {errors.supportEmail && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.supportEmail}
              </div>
            )}
          </div>
        </div>

        {/* Configurações de Sistema */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ marginTop: 0, color: '#495057' }}>Configurações de Sistema</h3>
          
          <div className="form-group-admin">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tamanho Máximo de Ficheiro (MB): <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.maxFileSize}
              onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value) || 0)}
              className={errors.maxFileSize ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {errors.maxFileSize && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.maxFileSize}
              </div>
            )}
          </div>

          <div className="form-group-admin">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Máximo de Utilizadores por Dia: <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={settings.maxUsersPerDay}
              onChange={(e) => handleChange('maxUsersPerDay', parseInt(e.target.value) || 0)}
              className={errors.maxUsersPerDay ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {errors.maxUsersPerDay && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.maxUsersPerDay}
              </div>
            )}
          </div>

          <div className="form-group-admin">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Timeout de Sessão (minutos): <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={settings.sessionTimeout}
              onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value) || 0)}
              className={errors.sessionTimeout ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {errors.sessionTimeout && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.sessionTimeout}
              </div>
            )}
          </div>

          <div className="form-group-admin">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Frequência de Backup:
            </label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => handleChange('backupFrequency', e.target.value)}
              disabled={isSubmitting}
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            >
              <option value="hourly">Hora a hora</option>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
            </select>
          </div>
        </div>

        {/* Configurações de Funcionalidades */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ marginTop: 0, color: '#495057' }}>Configurações de Funcionalidades</h3>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                disabled={isSubmitting}
                style={{ marginRight: '10px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Modo de Manutenção</span>
              <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                {settings.maintenanceMode ? '(Sistema indisponível para utilizadores)' : '(Sistema disponível)'}
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.allowRegistrations}
                onChange={(e) => handleChange('allowRegistrations', e.target.checked)}
                disabled={isSubmitting}
                style={{ marginRight: '10px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Permitir Novos Registos</span>
              <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                {settings.allowRegistrations ? '(Utilizadores podem registar-se)' : '(Registos desactivados)'}
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                disabled={isSubmitting}
                style={{ marginRight: '10px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Activar Notificações</span>
              <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                {settings.enableNotifications ? '(Notificações activadas)' : '(Notificações desactivadas)'}
              </span>
            </label>
          </div>
        </div>

        {/* Botões de Acção */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            className="btn-secondary-admin" 
            onClick={handleReset}
            disabled={isSubmitting || !hasChanges}
            style={{
              opacity: (isSubmitting || !hasChanges) ? 0.6 : 1,
              cursor: (isSubmitting || !hasChanges) ? 'not-allowed' : 'pointer'
            }}
          >
            <FaUndo style={{ marginRight: '5px' }} />
            Restaurar
          </button>
          <button 
            className="btn-primary-admin" 
            onClick={handleSave}
            disabled={isSubmitting || Object.keys(errors).some(key => errors[key])}
            style={{
              opacity: (isSubmitting || Object.keys(errors).some(key => errors[key])) ? 0.6 : 1,
              cursor: (isSubmitting || Object.keys(errors).some(key => errors[key])) ? 'not-allowed' : 'pointer'
            }}
          >
            <FaSave style={{ marginRight: '5px' }} />
            {isSubmitting ? 'A guardar...' : 'Guardar Configurações'}
          </button>
        </div>
      </div>

      {/* Toast para feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default Settings;