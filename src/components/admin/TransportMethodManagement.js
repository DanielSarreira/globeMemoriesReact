// src/components/admin/TransportMethodManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaExclamationCircle, FaCheck, FaTimes } from 'react-icons/fa';
import Toast from '../Toast';
import '../../styles/Admin.css';

const TransportMethodManagement = () => {
  const [transportMethods, setTransportMethods] = useState([
    // Mock data
    { _id: '1', name: 'Avião', description: 'Viagem de Avião' },
    { _id: '2', name: 'Carro', description: 'Viagem de carro' },
    { _id: '3', name: 'Autocarro', description: 'Viagem de autocarro' },
    { _id: '4', name: 'Barco', description: 'Viagem de barco' },
    { _id: '5', name: 'Comboio', description: 'Viagem de comboio' },
    { _id: '6', name: 'Bicicleta', description: 'Viagem de bicicleta' },
    { _id: '7', name: 'A Pé', description: 'Viagem a Pé' },
  ]);
  const [newTransportMethod, setNewTransportMethod] = useState({ name: '', description: '' });
  const [editingTransportMethod, setEditingTransportMethod] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchTransportMethods = async () => {
      try {
        // const { data } = await axios.get('/api/transport-methods', {
        //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        // });
        // setTransportMethods(data);
      } catch (error) {
        showToast('Erro ao carregar métodos de transporte', 'error');
      }
    };
    fetchTransportMethods();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const validateName = (name) => {
    if (!name.trim()) return 'Nome do método de transporte é obrigatório';
    if (name.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
    if (name.trim().length > 30) return 'Nome não pode exceder 30 caracteres';
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) return 'Nome só pode conter letras e espaços';
    return '';
  };

  const validateDescription = (description) => {
    if (!description.trim()) return 'Descrição é obrigatória';
    if (description.trim().length < 5) return 'Descrição deve ter pelo menos 5 caracteres';
    if (description.trim().length > 100) return 'Descrição não pode exceder 100 caracteres';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return validateName(value);
      case 'description':
        return validateDescription(value);
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const trimmedData = {
      name: newTransportMethod.name.trim(),
      description: newTransportMethod.description.trim()
    };

    const newErrors = {};
    Object.keys(trimmedData).forEach(key => {
      const error = validateField(key, trimmedData[key]);
      if (error) newErrors[key] = error;
    });

    // Verificar duplicados
    const isDuplicateName = transportMethods.some(method => 
      method._id !== editingTransportMethod?._id && 
      method.name.toLowerCase() === trimmedData.name.toLowerCase()
    );

    if (isDuplicateName) newErrors.name = 'Já existe um método de transporte com este nome';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setNewTransportMethod(prev => ({
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

  // Função para criar um novo método de transporte
  const handleCreate = async () => {
    if (isSubmitting) return;

    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const methodData = {
        name: newTransportMethod.name.trim(),
        description: newTransportMethod.description.trim()
      };

      // Placeholder para chamada à API
      // const response = await axios.post('/api/transport-methods', methodData, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setTransportMethods([...transportMethods, { _id: Date.now().toString(), ...methodData }]);
      setNewTransportMethod({ name: '', description: '' });
      setErrors({});
      showToast('Método de transporte adicionado com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao criar método de transporte:', error);
      showToast('Erro ao adicionar método de transporte. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para iniciar a edição de um método de transporte
  const handleEdit = (transportMethod) => {
    setEditingTransportMethod(transportMethod);
    setNewTransportMethod({ name: transportMethod.name, description: transportMethod.description });
    setErrors({});
    setShowDeleteConfirm(null);
  };

  // Função para salvar as alterações de um método de transporte
  const handleUpdate = async () => {
    if (isSubmitting) return;

    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const methodData = {
        name: newTransportMethod.name.trim(),
        description: newTransportMethod.description.trim()
      };

      // Placeholder para chamada à API
      // const response = await axios.put(`/api/transport-methods/${editingTransportMethod._id}`, methodData, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setTransportMethods(
        transportMethods.map((method) =>
          method._id === editingTransportMethod._id
            ? { ...method, ...methodData }
            : method
        )
      );
      setEditingTransportMethod(null);
      setNewTransportMethod({ name: '', description: '' });
      setErrors({});
      showToast('Método de transporte actualizado com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao actualizar método de transporte:', error);
      showToast('Erro ao actualizar método de transporte. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    setEditingTransportMethod(null);
    setNewTransportMethod({ name: '', description: '' });
    setErrors({});
  };

  // Função para eliminar um método de transporte
  const handleDelete = async (id) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Placeholder para chamada à API
      // await axios.delete(`/api/transport-methods/${id}`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setTransportMethods(transportMethods.filter((method) => method._id !== id));
      setShowDeleteConfirm(null);
      showToast('Método de transporte eliminado com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao eliminar método de transporte:', error);
      showToast('Erro ao eliminar método de transporte. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (method) => {
    setShowDeleteConfirm(method);
    setEditingTransportMethod(null);
    setErrors({});
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Métodos de Transporte</h2>
      
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
              Tem certeza que deseja eliminar o método de transporte <strong>{showDeleteConfirm.name}</strong>?
              <br />Esta acção não pode ser desfeita.
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nome do Método: <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nome do Método de Transporte"
              value={newTransportMethod.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'input-error' : ''}
              disabled={isSubmitting}
              maxLength={30}
            />
            {errors.name && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.name}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Descrição: <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="text"
              placeholder="Descrição do método de transporte"
              value={newTransportMethod.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={errors.description ? 'input-error' : ''}
              disabled={isSubmitting}
              maxLength={100}
            />
            {errors.description && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.description}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
              {newTransportMethod.description.length}/100 caracteres
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {editingTransportMethod ? (
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
                disabled={isSubmitting || Object.keys(errors).some(key => errors[key]) || !newTransportMethod.name.trim() || !newTransportMethod.description.trim()}
                style={{
                  opacity: (isSubmitting || Object.keys(errors).some(key => errors[key]) || !newTransportMethod.name.trim() || !newTransportMethod.description.trim()) ? 0.6 : 1,
                  cursor: (isSubmitting || Object.keys(errors).some(key => errors[key]) || !newTransportMethod.name.trim() || !newTransportMethod.description.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'A adicionar...' : 'Adicionar Método de Transporte'}
              </button>
            )}
          </div>
        </div>
      </div>
      <table className="admin-table-admin">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {transportMethods.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Nenhum método de transporte encontrado
              </td>
            </tr>
          ) : (
            transportMethods.map((method) => (
              <tr key={method._id} style={{
                backgroundColor: editingTransportMethod?._id === method._id ? '#f8f9fa' : 'transparent'
              }}>
                <td style={{ fontWeight: 'bold' }}>{method.name}</td>
                <td style={{ maxWidth: '250px', wordWrap: 'break-word' }}>{method.description}</td>
                <td>
                  <button
                    className="btn-warning-admin"
                    onClick={() => handleEdit(method)}
                    disabled={isSubmitting || editingTransportMethod !== null}
                    style={{
                      opacity: (isSubmitting || editingTransportMethod !== null) ? 0.6 : 1,
                      marginRight: '8px'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger-admin"
                    onClick={() => confirmDelete(method)}
                    disabled={isSubmitting || editingTransportMethod !== null}
                    style={{
                      opacity: (isSubmitting || editingTransportMethod !== null) ? 0.6 : 1
                    }}
                  >
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

export default TransportMethodManagement;