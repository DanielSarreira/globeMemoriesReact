// src/components/admin/CountryManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaExclamationCircle, FaCheck, FaTimes } from 'react-icons/fa';
import Toast from '../Toast';
import '../../styles/Admin.css';

const CountryManagement = () => {
  const [countries, setCountries] = useState([
    // Mock data
    { _id: '1', name: 'Portugal', code: 'PT' },
    { _id: '2', name: 'Espanha', code: 'ES' },
    { _id: '3', name: 'Alemanha', code: 'AL' },
    { _id: '4', name: 'Brasil', code: 'BR' },
    { _id: '5', name: 'Ucrânia', code: 'UC' },
  ]);
  const [newCountry, setNewCountry] = useState({ name: '', code: '' });
  const [editingCountry, setEditingCountry] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchCountries = async () => {
      try {
        // const { data } = await axios.get('/api/countries', {
        //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        // });
        // setCountries(data);
      } catch (error) {
        showToast('Erro ao carregar países', 'error');
      }
    };
    fetchCountries();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const validateCountryName = (name) => {
    if (!name.trim()) return 'Nome do país é obrigatório';
    if (name.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
    if (name.trim().length > 50) return 'Nome não pode exceder 50 caracteres';
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) return 'Nome só pode conter letras e espaços';
    return '';
  };

  const validateCountryCode = (code) => {
    if (!code.trim()) return 'Código do país é obrigatório';
    if (code.trim().length !== 2) return 'Código deve ter exactamente 2 caracteres';
    if (!/^[A-Z]{2}$/.test(code.trim().toUpperCase())) return 'Código deve conter apenas letras maiúsculas';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return validateCountryName(value);
      case 'code':
        return validateCountryCode(value);
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const trimmedData = {
      name: newCountry.name.trim(),
      code: newCountry.code.trim().toUpperCase()
    };

    const newErrors = {};
    Object.keys(trimmedData).forEach(key => {
      const error = validateField(key, trimmedData[key]);
      if (error) newErrors[key] = error;
    });

    // Verificar duplicados
    const isDuplicateName = countries.some(country => 
      country._id !== editingCountry?._id && 
      country.name.toLowerCase() === trimmedData.name.toLowerCase()
    );
    
    const isDuplicateCode = countries.some(country => 
      country._id !== editingCountry?._id && 
      country.code.toUpperCase() === trimmedData.code.toUpperCase()
    );

    if (isDuplicateName) newErrors.name = 'Já existe um país com este nome';
    if (isDuplicateCode) newErrors.code = 'Já existe um país com este código';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setNewCountry(prev => ({
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

  // Função para criar um novo país
  const handleCreate = async () => {
    if (isSubmitting) return;

    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const countryData = {
        name: newCountry.name.trim(),
        code: newCountry.code.trim().toUpperCase()
      };

      // Placeholder para chamada à API
      // const response = await axios.post('/api/countries', countryData, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setCountries([...countries, { _id: Date.now().toString(), ...countryData }]);
      setNewCountry({ name: '', code: '' });
      setErrors({});
      showToast('País adicionado com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao criar país:', error);
      showToast('Erro ao adicionar país. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para iniciar a edição de um país
  const handleEdit = (country) => {
    setEditingCountry(country);
    setNewCountry({ name: country.name, code: country.code });
    setErrors({});
    setShowDeleteConfirm(null);
  };

  // Função para salvar as alterações de um país
  const handleUpdate = async () => {
    if (isSubmitting) return;

    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const countryData = {
        name: newCountry.name.trim(),
        code: newCountry.code.trim().toUpperCase()
      };

      // Placeholder para chamada à API
      // const response = await axios.put(`/api/countries/${editingCountry._id}`, countryData, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setCountries(
        countries.map((country) =>
          country._id === editingCountry._id
            ? { ...country, ...countryData }
            : country
        )
      );
      setEditingCountry(null);
      setNewCountry({ name: '', code: '' });
      setErrors({});
      showToast('País actualizado com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao actualizar país:', error);
      showToast('Erro ao actualizar país. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    setEditingCountry(null);
    setNewCountry({ name: '', code: '' });
    setErrors({});
  };

  // Função para eliminar um país
  const handleDelete = async (id) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Placeholder para chamada à API
      // await axios.delete(`/api/countries/${id}`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      
      setCountries(countries.filter((country) => country._id !== id));
      setShowDeleteConfirm(null);
      showToast('País eliminado com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao eliminar país:', error);
      showToast('Erro ao eliminar país. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (country) => {
    setShowDeleteConfirm(country);
    setEditingCountry(null);
    setErrors({});
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Países</h2>
      
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
              Tem certeza que deseja eliminar o país <strong>{showDeleteConfirm.name}</strong>?
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
              Nome do País: <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nome do País"
              value={newCountry.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'input-error' : ''}
              disabled={isSubmitting}
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
              Código do País: <span style={{color: 'red'}}>*</span>
            </label>
            <input
              type="text"
              placeholder="Código (ex.: PT)"
              value={newCountry.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              className={errors.code ? 'input-error' : ''}
              disabled={isSubmitting}
              maxLength={2}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.code && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {errors.code}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {editingCountry ? (
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
                disabled={isSubmitting || Object.keys(errors).some(key => errors[key]) || !newCountry.name.trim() || !newCountry.code.trim()}
                style={{
                  opacity: (isSubmitting || Object.keys(errors).some(key => errors[key]) || !newCountry.name.trim() || !newCountry.code.trim()) ? 0.6 : 1,
                  cursor: (isSubmitting || Object.keys(errors).some(key => errors[key]) || !newCountry.name.trim() || !newCountry.code.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'A adicionar...' : 'Adicionar País'}
              </button>
            )}
          </div>
        </div>
      </div>
      <table className="admin-table-admin">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Código</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {countries.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Nenhum país encontrado
              </td>
            </tr>
          ) : (
            countries.map((country) => (
              <tr key={country._id} style={{
                backgroundColor: editingCountry?._id === country._id ? '#f8f9fa' : 'transparent'
              }}>
                <td>{country.name}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{country.code}</td>
                <td>
                  <button
                    className="btn-warning-admin"
                    onClick={() => handleEdit(country)}
                    disabled={isSubmitting || editingCountry !== null}
                    style={{
                      opacity: (isSubmitting || editingCountry !== null) ? 0.6 : 1,
                      marginRight: '8px'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger-admin"
                    onClick={() => confirmDelete(country)}
                    disabled={isSubmitting || editingCountry !== null}
                    style={{
                      opacity: (isSubmitting || editingCountry !== null) ? 0.6 : 1
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

export default CountryManagement;