// src/components/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin.css';

const UserManagement = () => {
  const [users, setUsers] = useState([
    // Mock data
    { _id: '1', firstName:'Tiago', lastName:'Miranda', username: 'tiago', email: 'tiago@example.com', isBanned: false, banExpiration: null },
    { _id: '2', firstName:'Ana', lastName:'Assis', username: 'ana', email: 'ana@example.com', isBanned: true, banExpiration: '2025-03-26' },
  ]);

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchUsers = async () => {
      // const { data } = await axios.get('/api/users', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleBan = async (id, type, duration) => {
    // Placeholder para chamada à API
    setUsers(users.map(user =>
      user._id === id
        ? { ...user, isBanned: true, banExpiration: type === 'temporary' ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null }
        : user
    ));
  };

  const handleUnban = async (id) => {
    // Placeholder para chamada à API
    setUsers(users.map(user =>
      user._id === id ? { ...user, isBanned: false, banExpiration: null } : user
    ));
  };

  const handleDelete = async (id) => {
    // Placeholder para chamada à API
    setUsers(users.filter(user => user._id !== id));
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Utilizadores</h2>
      <table className="admin-table-admin">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Username</th>
            <th>Email</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.isBanned ? `Banido até ${user.banExpiration || 'Permanente'}` : 'Ativo'}</td>
              <td>
                {!user.isBanned && (
                  <>
                    <button className="btn-warning-admin" onClick={() => handleBan(user._id, 'temporary', 7)}>Banir 7 Dias</button>
                    <button className="btn-danger-admin" onClick={() => handleBan(user._id, 'permanent')}>Banir Permanente</button>
                  </>
                )}
                {user.isBanned && (
                  <button className="btn-success-admin" onClick={() => handleUnban(user._id)}>Desbanir</button>
                )}
                <button className="btn-danger-admin" onClick={() => handleDelete(user._id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;