// src/components/admin/RoleManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaExclamationCircle, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import Toast from '../Toast';
import '../../styles/Admin.css';

const RoleManagement = () => {
  const [roles, setRoles] = useState([
    // Mock data
    { _id: '1', name: 'Super Admin', permissions: ['all'] },
    { _id: '2', name: 'Moderador', permissions: ['manage_content', 'view_logs'] },
  ]);
  const [newRole, setNewRole] = useState({ name: '', permissions: [] });
  const [editingRole, setEditingRole] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [permissionsInput, setPermissionsInput] = useState('');
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const availablePermissions = [
    { value: 'all', label: 'Todas as permissões' },
    { value: 'manage_users', label: 'Gerir utilizadores' },
    { value: 'manage_content', label: 'Gerir conteúdo' },
    { value: 'manage_categories', label: 'Gerir categorias' },
    { value: 'manage_countries', label: 'Gerir países' },
    { value: 'manage_transport', label: 'Gerir transportes' },
    { value: 'view_logs', label: 'Ver registos' },
    { value: 'view_statistics', label: 'Ver estatísticas' },
    { value: 'manage_settings', label: 'Gerir definições' }
  ];

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchRoles = async () => {
      try {
        // const { data } = await axios.get('/api/roles', {
        //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        // });
        // setRoles(data);
      } catch (error) {
        showToast('Erro ao carregar funções', 'error');
      }
    };
    fetchRoles();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const validateRoleName = (name) => {
    if (!name.trim()) return 'Nome da função é obrigatório';
    if (name.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
    if (name.trim().length > 50) return 'Nome não pode exceder 50 caracteres';
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) return 'Nome só pode conter letras e espaços';
    return '';
  };

  const validatePermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return 'Pelo menos uma permissão é obrigatória';
    const validPermissions = availablePermissions.map(p => p.value);
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) return `Permissões inválidas: ${invalidPermissions.join(', ')}`;
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return validateRoleName(value);
      case 'permissions':
        return validatePermissions(value);
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const trimmedData = {
      name: newRole.name.trim(),
      permissions: newRole.permissions.filter(p => p.trim())
    };

    const newErrors = {};
    Object.keys(trimmedData).forEach(key => {
      const error = validateField(key, trimmedData[key]);
      if (error) newErrors[key] = error;
    });

    // Verificar duplicados
    const isDuplicateName = roles.some(role => 
      role._id !== editingRole?._id && 
      role.name.toLowerCase() === trimmedData.name.toLowerCase()
    );

    if (isDuplicateName) newErrors.name = 'Já existe uma função com este nome';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setNewRole(prev => ({
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

  const handlePermissionToggle = (permission) => {
    let updatedPermissions;
    if (permission === 'all') {
      // Se selecionar "all", remover todas as outras ou adicionar só "all"
      updatedPermissions = newRole.permissions.includes('all') ? [] : ['all'];
    } else {
      // Se selecionar outra permissão, remover "all" se existir
      updatedPermissions = newRole.permissions.filter(p => p !== 'all');
      if (updatedPermissions.includes(permission)) {
        updatedPermissions = updatedPermissions.filter(p => p !== permission);
      } else {
        updatedPermissions.push(permission);
      }
    }
    handleChange('permissions', updatedPermissions);
  };

  const handleCreate = async () => {
    if (isSubmitting) return;

    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const roleData = {
        name: newRole.name.trim(),
        permissions: newRole.permissions
      };

      // Placeholder para chamada à API
      // const response = await axios.post('/api/roles', roleData, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setRoles([...roles, { _id: Date.now().toString(), ...roleData }]);
      setNewRole({ name: '', permissions: [] });
      setErrors({});
      showToast('Função criada com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao criar função:', error);
      showToast('Erro ao criar função. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setNewRole({ name: role.name, permissions: [...role.permissions] });
    setErrors({});
    setShowDeleteConfirm(null);
  };

  const handleUpdate = async () => {
    if (isSubmitting) return;

    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const roleData = {
        name: newRole.name.trim(),
        permissions: newRole.permissions
      };

      // Placeholder para chamada à API
      // const response = await axios.put(`/api/roles/${editingRole._id}`, roleData, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setRoles(
        roles.map((role) =>
          role._id === editingRole._id
            ? { ...role, ...roleData }
            : role
        )
      );
      setEditingRole(null);
      setNewRole({ name: '', permissions: [] });
      setErrors({});
      showToast('Função actualizada com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao actualizar função:', error);
      showToast('Erro ao actualizar função. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setNewRole({ name: '', permissions: [] });
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (isSubmitting) return;

    // Verificar se é uma função protegida
    const roleToDelete = roles.find(r => r._id === id);
    if (roleToDelete && roleToDelete.name === 'Super Admin') {
      showToast('Não é possível eliminar a função Super Admin', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Placeholder para chamada à API
      // await axios.delete(`/api/roles/${id}`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setRoles(roles.filter(role => role._id !== id));
      setShowDeleteConfirm(null);
      showToast('Função eliminada com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao eliminar função:', error);
      showToast('Erro ao eliminar função. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (role) => {
    if (role.name === 'Super Admin') {
      showToast('Não é possível eliminar a função Super Admin', 'error');
      return;
    }
    setShowDeleteConfirm(role);
    setEditingRole(null);
    setErrors({});
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Funções e Permissões</h2>
      
      {/* Modal de confirmação de eliminação */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Confirmar Eliminação</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Tem certeza que deseja eliminar a função <strong>{showDeleteConfirm.name}</strong>?
              <br />Esta acção não pode ser desfeita e pode afectar utilizadores com esta função.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="btn-danger-admin"
                onClick={() => handleDelete(showDeleteConfirm._id)}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? 'A eliminar...' : 'Sim, Eliminar'}
              </button>
              <button 
                className="btn-secondary-admin"
                onClick={cancelDelete}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="form-group-admin">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nome da Função: <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nome da Função"
              value={newRole.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'input-error' : ''}
              disabled={isSubmitting}
              maxLength={50}
            />
            {errors.name && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.name}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Permissões: <span style={{color: 'red'}}>*</span>
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '10px',
              border: errors.permissions ? '1px solid #e74c3c' : '1px solid #ddd',
              padding: '15px',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}>
              {availablePermissions.map(permission => (
                <label key={permission.value} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '3px',
                  backgroundColor: newRole.permissions.includes(permission.value) ? '#e3f2fd' : 'transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={newRole.permissions.includes(permission.value)}
                    onChange={() => handlePermissionToggle(permission.value)}
                    disabled={isSubmitting}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px' }}>{permission.label}</span>
                </label>
              ))}
            </div>
            {errors.permissions && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.permissions}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Seleccione "Todas as permissões" para acesso completo ou seleccione permissões específicas.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {editingRole ? (
              <>
                <button 
                  className="btn-primary-admin" 
                  onClick={handleUpdate}
                  disabled={isSubmitting || Object.keys(errors).some(key => errors[key])}
                  style={{
                    opacity: (isSubmitting || Object.keys(errors).some(key => errors[key])) ? 0.6 : 1,
                    cursor: (isSubmitting || Object.keys(errors).some(key => errors[key])) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FaCheck style={{ marginRight: '5px' }} />
                  {isSubmitting ? 'A guardar...' : 'Guardar Alterações'}
                </button>
                <button 
                  className="btn-danger-admin" 
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  <FaTimes style={{ marginRight: '5px' }} />
                  Cancelar
                </button>
              </>
            ) : (
              <button 
                className="btn-primary-admin" 
                onClick={handleCreate}
                disabled={isSubmitting || Object.keys(errors).some(key => errors[key]) || !newRole.name.trim() || newRole.permissions.length === 0}
                style={{
                  opacity: (isSubmitting || Object.keys(errors).some(key => errors[key]) || !newRole.name.trim() || newRole.permissions.length === 0) ? 0.6 : 1,
                  cursor: (isSubmitting || Object.keys(errors).some(key => errors[key]) || !newRole.name.trim() || newRole.permissions.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'A criar...' : 'Criar Função'}
              </button>
            )}
          </div>
        </div>
      </div>
      <table className="admin-table-admin">
        <thead>
          <tr>
            <th>Nome da Função</th>
            <th>Permissões</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Nenhuma função encontrada
              </td>
            </tr>
          ) : (
            roles.map(role => (
              <tr key={role._id} style={{
                backgroundColor: editingRole?._id === role._id ? '#f8f9fa' : 'transparent'
              }}>
                <td style={{ fontWeight: 'bold' }}>
                  {role.name}
                  {role.name === 'Super Admin' && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '12px', 
                      color: '#28a745',
                      fontWeight: 'normal'
                    }}>
                      (Protegida)
                    </span>
                  )}
                </td>
                <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                  {role.permissions.includes('all') ? (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>🔓 Todas as permissões</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {role.permissions.map(permission => {
                        const permissionLabel = availablePermissions.find(p => p.value === permission)?.label || permission;
                        return (
                          <span key={permission} style={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            border: '1px solid #bbdefb'
                          }}>
                            {permissionLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td>
                  <button
                    className="btn-warning-admin"
                    onClick={() => handleEdit(role)}
                    disabled={isSubmitting || editingRole !== null}
                    style={{
                      opacity: (isSubmitting || editingRole !== null) ? 0.6 : 1,
                      marginRight: '8px'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger-admin"
                    onClick={() => confirmDelete(role)}
                    disabled={isSubmitting || editingRole !== null || role.name === 'Super Admin'}
                    style={{
                      opacity: (isSubmitting || editingRole !== null || role.name === 'Super Admin') ? 0.6 : 1
                    }}
                  >
                    <FaTrash style={{ marginRight: '5px' }} />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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

export default RoleManagement;