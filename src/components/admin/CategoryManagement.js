// src/components/admin/CategoryManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import { FaExclamationCircle } from 'react-icons/fa';
import '../../styles/Admin.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([
    // Mock data
    { _id: '1', name: 'Aventura', description: 'Viagens de aventura' },
    { _id: '2', name: 'Cultura', description: 'Viagens culturais' },
    { _id: '3', name: 'Cidade', description: 'Viagens de Cidade' },
    { _id: '4', name: 'Natureza', description: 'Viagens de Natureza' },
    { _id: '5', name: 'Praia', description: 'Viagens de Praia' },
  ]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null); // Estado para a categoria em edição
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchCategories = async () => {
      // const { data } = await axios.get('/api/categories', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setCategories(data);
    };
    fetchCategories();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Nome da categoria é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        if (value.trim().length > 50) return 'Nome deve ter no máximo 50 caracteres';
        if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) return 'Nome deve conter apenas letras';
        // Verificar se já existe (exceto se estiver editando)
        const existingCategory = categories.find(cat => 
          cat.name.toLowerCase() === value.trim().toLowerCase() && 
          (!editingCategory || cat._id !== editingCategory._id)
        );
        if (existingCategory) return 'Já existe uma categoria com este nome';
        return '';
      case 'description':
        if (!value.trim()) return 'Descrição é obrigatória';
        if (value.trim().length < 5) return 'Descrição deve ter pelo menos 5 caracteres';
        if (value.trim().length > 200) return 'Descrição deve ter no máximo 200 caracteres';
        return '';
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const newErrors = {};
    Object.keys(newCategory).forEach(key => {
      const error = validateField(key, newCategory[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
    
    // Validação em tempo real
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Função para criar uma nova categoria
  const handleCreate = async () => {
    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Placeholder para chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCategories([...categories, { _id: Date.now().toString(), ...newCategory }]);
      setNewCategory({ name: '', description: '' });
      setErrors({});
      showToast('Categoria criada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      showToast('Erro ao criar categoria. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para iniciar a edição de uma categoria
  const handleEdit = (category) => {
    setEditingCategory(category);
    setNewCategory({ name: category.name, description: category.description });
  };

  // Função para salvar as alterações de uma categoria
  const handleUpdate = async () => {
    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Placeholder para chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCategories(
        categories.map((category) =>
          category._id === editingCategory._id
            ? { ...category, name: newCategory.name.trim(), description: newCategory.description.trim() }
            : category
        )
      );
      setEditingCategory(null); // Limpa o estado de edição
      setNewCategory({ name: '', description: '' }); // Limpa o formulário
      setErrors({});
      showToast('Categoria atualizada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      showToast('Erro ao atualizar categoria. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
    setErrors({});
    showToast('Edição cancelada', 'info');
  };

  // Função para eliminar uma categoria
  const handleDelete = async (id) => {
    const category = categories.find(cat => cat._id === id);
    if (!category) return;

    if (!window.confirm(`Tem a certeza que deseja eliminar a categoria "${category.name}"?\n\nEsta ação é irreversível e pode afetar viagens existentes.`)) return;

    setIsLoading(true);
    try {
      // Placeholder para chamada à API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setCategories(categories.filter((category) => category._id !== id));
      showToast(`Categoria "${category.name}" eliminada com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao eliminar categoria:', error);
      showToast('Erro ao eliminar categoria. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Categorias</h2>
      <div className="form-group-admin">
        <div style={{ marginBottom: '15px' }}>
          <label>Nome da Categoria: <span style={{color: 'red'}}>*</span></label>
          <input
            type="text"
            placeholder="Nome da Categoria (ex: Aventura, Cultura...)"
            value={newCategory.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={errors.name ? 'input-error' : ''}
            disabled={isLoading}
            maxLength={50}
          />
          {errors.name && (
            <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
              <FaExclamationCircle style={{ marginRight: '5px' }} />
              {errors.name}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
            {newCategory.name.length}/50 caracteres
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Descrição: <span style={{color: 'red'}}>*</span></label>
          <input
            type="text"
            placeholder="Descrição detalhada da categoria..."
            value={newCategory.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={errors.description ? 'input-error' : ''}
            disabled={isLoading}
            maxLength={200}
          />
          {errors.description && (
            <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
              <FaExclamationCircle style={{ marginRight: '5px' }} />
              {errors.description}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
            {newCategory.description.length}/200 caracteres
          </div>
        </div>

        <div>
          {editingCategory ? (
            <>
              <button 
                className="btn-primary-admin" 
                onClick={handleUpdate}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.6 : 1 }}
              >
                {isLoading ? 'A guardar...' : 'Guardar Alterações'}
              </button>
              <button 
                className="btn-danger-admin" 
                onClick={handleCancelEdit}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.6 : 1 }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button 
              className="btn-primary-admin" 
              onClick={handleCreate}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? 'A criar...' : 'Criar Categoria'}
            </button>
          )}
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
          {categories.map((category) => (
            <tr key={category._id}>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>
                <button
                  className="btn-warning-admin"
                  onClick={() => handleEdit(category)}
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                >
                  {isLoading ? 'A processar...' : 'Editar'}
                </button>
                <button
                  className="btn-danger-admin"
                  onClick={() => handleDelete(category._id)}
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                >
                  {isLoading ? 'A processar...' : 'Eliminar'}
                </button>
              </td>
            </tr>
          ))}
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

export default CategoryManagement;