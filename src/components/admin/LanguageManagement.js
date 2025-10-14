// src/components/admin/LanguageManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin.css';

const LanguageManagement = () => {
  const [languages, setLanguages] = useState([
    // Mock data
    { _id: '1', name: 'Português', code: 'pt' },
    { _id: '2', name: 'Inglês', code: 'en' },
    { _id: '3', name: 'Italiano', code: 'it' },
    { _id: '4', name: 'francês', code: 'fr' },
    { _id: '5', name: 'espanhol', code: 'es' },
  ]);
  const [newLanguage, setNewLanguage] = useState({ name: '', code: '' });
  const [editingLanguage, setEditingLanguage] = useState(null); // Estado para o idioma em edição

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchLanguages = async () => {
      // const { data } = await axios.get('/api/languages', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setLanguages(data);
    };
    fetchLanguages();
  }, []);

  // Função para criar um novo idioma
  const handleCreate = async () => {
    // Placeholder para chamada à API
    setLanguages([...languages, { _id: Date.now().toString(), ...newLanguage }]);
    setNewLanguage({ name: '', code: '' });
  };

  // Função para iniciar a edição de um idioma
  const handleEdit = (language) => {
    setEditingLanguage(language);
    setNewLanguage({ name: language.name, code: language.code });
  };

  // Função para salvar as alterações de um idioma
  const handleUpdate = async () => {
    // Placeholder para chamada à API
    setLanguages(
      languages.map((language) =>
        language._id === editingLanguage._id
          ? { ...language, name: newLanguage.name, code: newLanguage.code }
          : language
      )
    );
    setEditingLanguage(null); // Limpa o estado de edição
    setNewLanguage({ name: '', code: '' }); // Limpa o formulário
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    setEditingLanguage(null);
    setNewLanguage({ name: '', code: '' });
  };

  // Função para eliminar um idioma
  const handleDelete = async (id) => {
    // Placeholder para chamada à API
    setLanguages(languages.filter((language) => language._id !== id));
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Idiomas</h2>
      <div className="form-group-admin">
        <input
          type="text"
          placeholder="Nome do Idioma"
          value={newLanguage.name}
          onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Código (ex.: pt)"
          value={newLanguage.code}
          onChange={(e) => setNewLanguage({ ...newLanguage, code: e.target.value })}
        />
        {editingLanguage ? (
          <>
            <button className="btn-primary-admin" onClick={handleUpdate}>
              Guardar Alterações
            </button>
            <button className="btn-danger-admin" onClick={handleCancelEdit}>
              Cancelar
            </button>
          </>
        ) : (
          <button className="btn-primary-admin" onClick={handleCreate}>
            Adicionar Idioma
          </button>
        )}
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
          {languages.map((language) => (
            <tr key={language._id}>
              <td>{language.name}</td>
              <td>{language.code}</td>
              <td>
                <button
                  className="btn-warning-admin"
                  onClick={() => handleEdit(language)}
                >
                  Editar
                </button>
                <button
                  className="btn-danger-admin"
                  onClick={() => handleDelete(language._id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LanguageManagement;