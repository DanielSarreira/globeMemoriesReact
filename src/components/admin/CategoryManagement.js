// src/components/admin/CategoryManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { FaExclamationCircle } from 'react-icons/fa';
import '../../styles/Admin.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', icon: ':herb:' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const EMOJI_OPTIONS = [
    ':herb:', ':beach_with_umbrella:', ':person_climbing:', ':mountain:',
    ':city_dusk:', ':classical_building:', ':fork_and_knife:', ':tent:',
    ':european_castle:', ':airplane:', ':ship:', ':bicyclist:',
    ':camera:', ':heart:', ':moneybag:', ':sparkles:',
  ];

  const showToast = (message, type) => setToast({ message, type, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await request('GET', '/admin/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      showToast('Erro ao carregar categorias.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Nome da categoria é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        if (value.trim().length > 55) return 'Nome deve ter no máximo 55 caracteres';
        return '';
      case 'icon':
        if (!value) return 'Escolha um emoji';
        return '';
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const newErrors = {};
    Object.keys(newCategory).forEach((key) => {
      const error = validateField(key, newCategory[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setNewCategory((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleCreate = async () => {
    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await request('POST', '/admin/categories', {
        name: newCategory.name.trim(),
        icon: newCategory.icon,
      });
      setNewCategory({ name: '', icon: ':herb:' });
      setErrors({});
      showToast('Categoria criada com sucesso!', 'success');
      await fetchCategories();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      showToast(error?.response?.data?.message || 'Erro ao criar categoria.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setNewCategory({ name: category.name, icon: category.icon });
  };

  const handleUpdate = async () => {
    if (!validateAllFields()) return;
    setIsLoading(true);
    try {
      await request('PUT', `/admin/categories/${editingCategory.id}`, {
        name: newCategory.name.trim(),
        icon: newCategory.icon,
      });
      setEditingCategory(null);
      setNewCategory({ name: '', icon: ':herb:' });
      setErrors({});
      showToast('Categoria atualizada com sucesso!', 'success');
      await fetchCategories();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      showToast(error?.response?.data?.message || 'Erro ao atualizar categoria.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', icon: ':herb:' });
    setErrors({});
  };

  const handleDelete = async (id) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    if (!window.confirm(`Eliminar a categoria "${category.name}"?`)) return;
    setIsLoading(true);
    try {
      await request('DELETE', `/admin/categories/${id}`);
      showToast(`Categoria "${category.name}" eliminada.`, 'success');
      await fetchCategories();
    } catch (error) {
      console.error('Erro ao eliminar categoria:', error);
      showToast(error?.response?.data?.message || 'Erro ao eliminar categoria.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Categorias</h2>
      <div className="form-group-admin">
        <div style={{ marginBottom: '15px' }}>
          <label>Nome da Categoria: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            placeholder="Nome da Categoria (ex: Aventura, Cultura...)"
            value={newCategory.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={errors.name ? 'input-error' : ''}
            disabled={isLoading}
            maxLength={55}
          />
          {errors.name && (
            <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
              <FaExclamationCircle style={{ marginRight: '5px' }} />
              {errors.name}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Ícone (Emoji):</label>
          <select
            value={newCategory.icon}
            onChange={(e) => handleInputChange('icon', e.target.value)}
            disabled={isLoading}
            style={{ padding: '10px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ced4da' }}
          >
            {EMOJI_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace(/:/g, '')}
              </option>
            ))}
          </select>
        </div>

        <div>
          {editingCategory ? (
            <>
              <button className="btn-primary-admin" onClick={handleUpdate} disabled={isLoading} style={{ opacity: isLoading ? 0.6 : 1 }}>
                {isLoading ? 'A guardar...' : 'Guardar Alterações'}
              </button>
              <button className="btn-danger-admin" onClick={handleCancelEdit} disabled={isLoading} style={{ opacity: isLoading ? 0.6 : 1 }}>
                Cancelar
              </button>
            </>
          ) : (
            <button className="btn-primary-admin" onClick={handleCreate} disabled={isLoading} style={{ opacity: isLoading ? 0.6 : 1 }}>
              {isLoading ? 'A criar...' : 'Criar Categoria'}
            </button>
          )}
        </div>
      </div>

      {isLoading && categories.length === 0 ? (
        <p>A carregar...</p>
      ) : (
        <table className="admin-table-admin">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Ícone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.icon}</td>
                <td>
                  <button className="btn-warning-admin" onClick={() => handleEdit(category)} disabled={isLoading} style={{ marginRight: '6px' }}>
                    Editar
                  </button>
                  <button className="btn-danger-admin" onClick={() => handleDelete(category.id)} disabled={isLoading}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                  Nenhuma categoria registada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default CategoryManagement;
