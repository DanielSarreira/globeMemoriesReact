// src/components/admin/RoleManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin.css';

const RoleManagement = () => {
  const [roles, setRoles] = useState([
    // Mock data
    { _id: '1', name: 'Super Admin', permissions: ['all'] },
    { _id: '2', name: 'Moderador', permissions: ['manage_content', 'view_logs'] },
  ]);
  const [newRole, setNewRole] = useState({ name: '', permissions: [] });

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchRoles = async () => {
      // const { data } = await axios.get('/api/roles', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setRoles(data);
    };
    fetchRoles();
  }, []);

  const handleCreate = async () => {
    // Placeholder para chamada à API
    setRoles([...roles, { _id: Date.now().toString(), ...newRole }]);
    setNewRole({ name: '', permissions: [] });
  };

  const handleDelete = async (id) => {
    // Placeholder para chamada à API
    setRoles(roles.filter(role => role._id !== id));
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Permissões</h2>
      <div className="form-group-admin">
        <input
          type="text"
          placeholder="Nome da Função"
          value={newRole.name}
          onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Permissões (ex.: manage_content,view_logs)"
          value={newRole.permissions.join(',')}
          onChange={(e) => setNewRole({ ...newRole, permissions: e.target.value.split(',') })}
        />
        <button className="btn-primary-admin" onClick={handleCreate}>Criar Função</button>
      </div>
      <table className="admin-table-admin">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Permissões</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr key={role._id}>
              <td>{role.name}</td>
              <td>{role.permissions.join(', ')}</td>
              <td>
                <button className="btn-danger-admin" onClick={() => handleDelete(role._id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoleManagement;