// src/components/admin/TransportMethodManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [editingTransportMethod, setEditingTransportMethod] = useState(null); // Estado para o método de transporte em edição

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchTransportMethods = async () => {
      // const { data } = await axios.get('/api/transport-methods', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setTransportMethods(data);
    };
    fetchTransportMethods();
  }, []);

  // Função para criar um novo método de transporte
  const handleCreate = async () => {
    // Placeholder para chamada à API
    setTransportMethods([...transportMethods, { _id: Date.now().toString(), ...newTransportMethod }]);
    setNewTransportMethod({ name: '', description: '' });
  };

  // Função para iniciar a edição de um método de transporte
  const handleEdit = (transportMethod) => {
    setEditingTransportMethod(transportMethod);
    setNewTransportMethod({ name: transportMethod.name, description: transportMethod.description });
  };

  // Função para salvar as alterações de um método de transporte
  const handleUpdate = async () => {
    // Placeholder para chamada à API
    setTransportMethods(
      transportMethods.map((method) =>
        method._id === editingTransportMethod._id
          ? { ...method, name: newTransportMethod.name, description: newTransportMethod.description }
          : method
      )
    );
    setEditingTransportMethod(null); // Limpa o estado de edição
    setNewTransportMethod({ name: '', description: '' }); // Limpa o formulário
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    setEditingTransportMethod(null);
    setNewTransportMethod({ name: '', description: '' });
  };

  // Função para eliminar um método de transporte
  const handleDelete = async (id) => {
    // Placeholder para chamada à API
    setTransportMethods(transportMethods.filter((method) => method._id !== id));
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Métodos de Transporte</h2>
      <div className="form-group-admin">
        <input
          type="text"
          placeholder="Nome do Método de Transporte"
          value={newTransportMethod.name}
          onChange={(e) => setNewTransportMethod({ ...newTransportMethod, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Descrição"
          value={newTransportMethod.description}
          onChange={(e) => setNewTransportMethod({ ...newTransportMethod, description: e.target.value })}
        />
        {editingTransportMethod ? (
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
            Adicionar Método de Transporte
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
          {transportMethods.map((method) => (
            <tr key={method._id}>
              <td>{method.name}</td>
              <td>{method.description}</td>
              <td>
                <button
                  className="btn-warning-admin"
                  onClick={() => handleEdit(method)}
                >
                  Editar
                </button>
                <button
                  className="btn-danger-admin"
                  onClick={() => handleDelete(method._id)}
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

export default TransportMethodManagement;