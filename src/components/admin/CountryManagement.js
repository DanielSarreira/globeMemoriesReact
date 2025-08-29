// src/components/admin/CountryManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [editingCountry, setEditingCountry] = useState(null); // Estado para o país em edição

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchCountries = async () => {
      // const { data } = await axios.get('/api/countries', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setCountries(data);
    };
    fetchCountries();
  }, []);

  // Função para criar um novo país
  const handleCreate = async () => {
    // Placeholder para chamada à API
    setCountries([...countries, { _id: Date.now().toString(), ...newCountry }]);
    setNewCountry({ name: '', code: '' });
  };

  // Função para iniciar a edição de um país
  const handleEdit = (country) => {
    setEditingCountry(country);
    setNewCountry({ name: country.name, code: country.code });
  };

  // Função para salvar as alterações de um país
  const handleUpdate = async () => {
    // Placeholder para chamada à API
    setCountries(
      countries.map((country) =>
        country._id === editingCountry._id
          ? { ...country, name: newCountry.name, code: newCountry.code }
          : country
      )
    );
    setEditingCountry(null); // Limpa o estado de edição
    setNewCountry({ name: '', code: '' }); // Limpa o formulário
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    setEditingCountry(null);
    setNewCountry({ name: '', code: '' });
  };

  // Função para eliminar um país
  const handleDelete = async (id) => {
    // Placeholder para chamada à API
    setCountries(countries.filter((country) => country._id !== id));
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Países</h2>
      <div className="form-group-admin">
        <input
          type="text"
          placeholder="Nome do País"
          value={newCountry.name}
          onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Código (ex.: PT)"
          value={newCountry.code}
          onChange={(e) => setNewCountry({ ...newCountry, code: e.target.value })}
        />
        {editingCountry ? (
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
            Adicionar País
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
          {countries.map((country) => (
            <tr key={country._id}>
              <td>{country.name}</td>
              <td>{country.code}</td>
              <td>
                <button
                  className="btn-warning-admin"
                  onClick={() => handleEdit(country)}
                >
                  Editar
                </button>
                <button
                  className="btn-danger-admin"
                  onClick={() => handleDelete(country._id)}
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

export default CountryManagement;