// src/components/admin/CategoryManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  // Função para criar uma nova categoria
  const handleCreate = async () => {
    // Placeholder para chamada à API
    setCategories([...categories, { _id: Date.now().toString(), ...newCategory }]);
    setNewCategory({ name: '', description: '' });
  };

  // Função para iniciar a edição de uma categoria
  const handleEdit = (category) => {
    setEditingCategory(category);
    setNewCategory({ name: category.name, description: category.description });
  };

  // Função para salvar as alterações de uma categoria
  const handleUpdate = async () => {
    // Placeholder para chamada à API
    setCategories(
      categories.map((category) =>
        category._id === editingCategory._id
          ? { ...category, name: newCategory.name, description: newCategory.description }
          : category
      )
    );
    setEditingCategory(null); // Limpa o estado de edição
    setNewCategory({ name: '', description: '' }); // Limpa o formulário
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
  };

  // Função para excluir uma categoria
  const handleDelete = async (id) => {
    // Placeholder para chamada à API
    setCategories(categories.filter((category) => category._id !== id));
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Categorias</h2>
      <div className="form-group-admin">
        <input
          type="text"
          placeholder="Nome da Categoria"
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Descrição"
          value={newCategory.description}
          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
        />
        {editingCategory ? (
          <>
            <button className="btn-primary-admin" onClick={handleUpdate}>
              Salvar Alterações
            </button>
            <button className="btn-danger-admin" onClick={handleCancelEdit}>
              Cancelar
            </button>
          </>
        ) : (
          <button className="btn-primary-admin" onClick={handleCreate}>
            Criar Categoria
          </button>
        )}
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
                >
                  Editar
                </button>
                <button
                  className="btn-danger-admin"
                  onClick={() => handleDelete(category._id)}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryManagement;